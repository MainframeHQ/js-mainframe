// @flow

import React, { Component } from 'react'
import { createFragmentContainer, graphql } from 'react-relay'
import {
  havePermissionsToGrant,
  type StrictPermissionsGrants,
} from '@mainframe/app-permissions'
import styled from 'styled-components/native'
import { Text } from '@morpheus-ui/core'
import PlusIcon from '@morpheus-ui/icons/PlusSymbolCircled'
import { findIndex } from 'lodash'
import memoize from 'memoize-one'

import rpc from '../rpc'
import PermissionsView from '../PermissionsView'
import OSLogo from '../../UIComponents/MainframeOSLogo'
import applyContext, { type CurrentUser } from '../LauncherContext'
import CompleteOnboardSession from './CompleteOnboardSession'

import AppInstallModal from './AppInstallModal'
import { InstalledAppItem, SuggestedAppItem } from './AppItem'
import AppUpdateModal from './AppUpdateModal'
import type { AppsView_apps as Apps } from './__generated__/AppsView_apps.graphql'

type InstalledApps = $PropertyType<Apps, 'installed'>
type AppData = $Call<<T>($ReadOnlyArray<T>) => T, InstalledApps>

const SUGGESTED_APPS_URL =
  'https://s3-us-west-2.amazonaws.com/suggested-apps/suggested-apps.json'

const Header = styled.View`
  height: 50px;
`

export const AppsGrid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
`

const AppInstallContainer = styled.TouchableOpacity`
  padding: 15px 10px;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 110px;
  height: 150px;
`

const InstallIcon = styled.View`
  width: 72px;
  height: 72px;
  border-radius: 5px;
  margin-bottom: 10px;
  align-items: center;
  justify-content: center;
  border: 1px solid #a9a9a9;
  ${props => props.hover && 'border: 1px solid #DA1157;'}
`

const ScrollView = styled.ScrollView``

export const NewAppButton = (props: {
  title: string,
  onPress: () => void,
  testID: string,
}) => {
  return (
    <AppInstallContainer onPress={props.onPress} testID={props.testID}>
      <InstallIcon>
        <PlusIcon color="#808080" />
      </InstallIcon>
      <Text
        theme={{
          width: '72px',
          fontSize: '11px',
          padding: '5px 0',
          color: '#808080',
          border: '1px solid #a9a9a9',
          borderRadius: '3px',
          textAlign: 'center',
        }}>
        {props.title}
      </Text>
    </AppInstallContainer>
  )
}

type Props = {
  apps: Apps,
  user: CurrentUser,
}

type State = {
  showModal: ?{
    type: 'accept_permissions' | 'app_install' | 'app_update',
    appID?: ?string,
    data?: ?{
      app: AppData,
    },
  },
  hover: ?string,
  showOnboarding: boolean,
  suggestedApps: Array<Object>,
}

class AppsView extends Component<Props, State> {
  state = {
    hover: null,
    showModal: null,
    showOnboarding: false,
    suggestedApps: [],
  }

  componentDidMount() {
    this.fetchSuggested()
  }

  fetchSuggested = async () => {
    try {
      const suggestedPromise = await fetch(SUGGESTED_APPS_URL)

      const suggestedApps = await suggestedPromise.json()
      this.setState({ suggestedApps })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  onSkipOnboarding = () => {
    this.setState({
      showOnboarding: false,
    })
  }

  // App install / update / open

  onPressInstall = () => {
    this.setState({
      showModal: {
        type: 'app_install',
      },
    })
  }

  installSuggested = (appID: string) => {
    this.setState({
      showModal: {
        type: 'app_install',
        appID,
      },
    })
  }

  onPressUpdate = (appID: string) => {
    const app = this.props.apps.installed.find(app => app.localID === appID)
    if (app != null) {
      this.setState({
        showModal: { type: 'app_update', appID },
      })
    }
  }

  onInstallComplete = () => {
    this.onCloseModal()
  }

  onSubmitPermissions = async (permissionSettings: StrictPermissionsGrants) => {
    if (
      this.state.showModal &&
      this.state.showModal.type === 'accept_permissions' &&
      this.state.showModal.data
    ) {
      const { app } = this.state.showModal.data
      const { user } = this.props
      try {
        await rpc.setAppUserPermissionsSettings(app.localID, user.localID, {
          grants: permissionSettings,
          permissionsChecked: true,
        })
        await rpc.launchApp(app.localID, user.localID)
      } catch (err) {
        // TODO: - Error feedback
        // eslint-disable-next-line no-console
        console.warn(err)
      }
      this.setState({
        showModal: undefined,
      })
    }
  }

  onOpenApp = async (appID: string) => {
    const { apps, user } = this.props
    const app = apps.installed.find(app => app.localID === appID)
    if (app == null) {
      return
    }

    const appUser = app.users.find(u => u.localID === user.localID)
    if (
      // $FlowFixMe: difference between Relay-generated and library-defined types
      havePermissionsToGrant(app.manifest.permissions) &&
      (!appUser || !appUser.settings.permissionsSettings.permissionsChecked)
    ) {
      // If this user hasn't used the app before
      // we need to ask to accept permissions
      this.setState({
        showModal: { type: 'accept_permissions', appID },
      })
    } else {
      try {
        await rpc.launchApp(appID, user.localID)
      } catch (err) {
        // TODO: - Error feedback
      }
    }
  }

  onCloseModal = () => {
    this.setState({
      showModal: undefined,
    })
  }

  getSuggestedList = memoize(
    (apps: InstalledApps, suggestedApps: Array<Object>) => {
      return suggestedApps.filter(
        item => findIndex(apps, { mfid: item.mfid }) < 0,
      )
    },
  )

  // RENDER

  renderApps() {
    const apps = this.props.apps.installed
    const installed = apps.map(app => (
      // $FlowFixMe: injected fragment type
      <InstalledAppItem
        key={app.localID}
        installedApp={app}
        onOpenApp={this.onOpenApp}
        onPressUpdate={this.onPressUpdate}
      />
    ))
    const suggested = this.getSuggestedList(apps, this.state.suggestedApps)

    return (
      <ScrollView>
        <Text variant={['smallTitle', 'blue', 'bold']}>
          Installed Applications
        </Text>
        <AppsGrid>
          {installed}
          <NewAppButton
            title="Install"
            onPress={this.onPressInstall}
            testID="launcher-install-app-button"
          />
        </AppsGrid>
        {suggested.length ? (
          <>
            <Text variant={['smallTitle', 'blue', 'bold']}>
              Suggested Applications
            </Text>
            <AppsGrid>
              {suggested.map(app => (
                <SuggestedAppItem
                  key={app.hash}
                  appID={app.hash}
                  mfid={app.mfid}
                  appName={app.name}
                  devName="Mainframe"
                  onOpen={this.installSuggested}
                />
              ))}
            </AppsGrid>
          </>
        ) : null}
      </ScrollView>
    )
  }

  renderButton(title: string, onPress: () => void, testID: string) {
    const hover = this.state.hover === title
    return (
      <AppInstallContainer
        onMouseOver={() => this.setState({ hover: title })}
        onMouseOut={() => this.setState({ hover: '' })}
        onPress={onPress}
        testID={testID}>
        <InstallIcon hover={hover}>
          <PlusIcon color={hover ? '#DA1157' : '#808080'} />
        </InstallIcon>
        <Text
          theme={{
            width: '72px',
            fontSize: '11px',
            padding: '5px 0',
            color: hover ? '#DA1157' : '#808080',
            border: hover ? '1px solid #DA1157' : '1px solid #a9a9a9',
            borderRadius: '3px',
            textAlign: 'center',
          }}>
          {title}
        </Text>
      </AppInstallContainer>
    )
  }

  render() {
    let modal
    if (this.state.showModal) {
      switch (this.state.showModal.type) {
        case 'app_install':
          modal = (
            <AppInstallModal
              appID={this.state.showModal.appID}
              onRequestClose={this.onCloseModal}
              onInstallComplete={this.onInstallComplete}
            />
          )
          break
        case 'accept_permissions': {
          // $FlowFixMe ignore undefined warning
          const { app } = this.state.showModal.data
          modal = (
            <PermissionsView
              name={app.name}
              // $FlowFixMe: difference between Relay-generated and library-defined types
              permissions={app.manifest.permissions}
              onCancel={this.onCloseModal}
              onSubmit={this.onSubmitPermissions}
            />
          )
          break
        }
        case 'app_update': {
          const app = this.props.apps.installed.find(
            // $FlowFixMe ignore undefined warning
            app => app.localID === this.state.showModal.appID,
          )
          modal = app ? (
            // $FlowFixMe: injected fragment type
            <AppUpdateModal
              app={app}
              onRequestClose={this.onCloseModal}
              onUpdateComplete={this.onInstallComplete}
            />
          ) : null
          break
        }
        default:
          modal = null
      }
    }
    return (
      <>
        <Header>
          <OSLogo />
        </Header>
        {this.state.showOnboarding && (
          <CompleteOnboardSession
            onSelectItem={() => {}}
            onSkip={this.onSkipOnboarding}
          />
        )}
        {this.renderApps()}
        {modal}
      </>
    )
  }
}

const AppsViewFragmentContainer = createFragmentContainer(AppsView, {
  apps: graphql`
    fragment AppsView_apps on Apps {
      installed {
        ...AppItem_installedApp
        ...AppUpdateModal_app
        localID
        mfid
        manifest {
          permissions {
            optional {
              WEB_REQUEST
              BLOCKCHAIN_SEND
            }
            required {
              WEB_REQUEST
              BLOCKCHAIN_SEND
            }
          }
        }
        name
        users {
          localID
          identity {
            profile {
              name
            }
          }
          settings {
            permissionsSettings {
              permissionsChecked
              grants {
                BLOCKCHAIN_SEND
                WEB_REQUEST {
                  granted
                  denied
                }
              }
            }
          }
        }
      }
    }
  `,
})

export default applyContext(AppsViewFragmentContainer)
