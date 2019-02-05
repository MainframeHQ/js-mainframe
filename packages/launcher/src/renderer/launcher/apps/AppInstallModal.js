//@flow

import {
  havePermissionsToGrant,
  type StrictPermissionsGrants,
  createStrictPermissionGrants,
} from '@mainframe/app-permissions'
import type { IdentityOwnData } from '@mainframe/client'
import type { ManifestData } from '@mainframe/app-manifest'
import React, { Component } from 'react'
import { Text, TextField } from '@morpheus-ui/core'
import { type FormSubmitPayload } from '@morpheus-ui/forms'

import { commitMutation } from 'react-relay'
import styled from 'styled-components/native'

import { EnvironmentContext } from '../RelayEnvironment'

import applyContext, { type CurrentUser } from '../LauncherContext'
import FormModalView from '../../UIComponents/FormModalView'
import DropFile from '../../UIComponents/DropFile'
import Loader from '../../UIComponents/Loader'
import rpc from '../rpc'
import PermissionsView from '../PermissionsView'
import { appInstallMutation } from './appMutations'

type Props = {
  onRequestClose: () => void,
  onInstallComplete: () => void,
}

type ViewProps = Props & {
  user: CurrentUser,
}

type State = {
  installStep: 'manifest' | 'permissions' | 'download',
  manifest: ?ManifestData,
  userPermissions?: StrictPermissionsGrants,
  ownUsers: Array<IdentityOwnData>,
  errorMsg?: string,
}

const Container = styled.View`
  flex: 1;
  width: 100%;
  max-width: 550px;
  padding: 20px;
  justify-content: center;
  overflow-y: auto;
`

const TextContainer = styled.View`
  padding: 20px;
`

const View = styled.View``

const DragView = styled.TouchableOpacity`
  border-style: dashed;
  border-width: 1px;
  border-color: #d3d3d3;
  padding: 50px;
`

class AppInstallModal extends Component<ViewProps, State> {
  static contextType = EnvironmentContext

  state = {
    installStep: 'manifest',
    manifest: null,
    ownUsers: [],
  }

  // HANDLERS

  onDrop = (files: Array<File>) => {
    this.handleSelectedFiles(files)
  }

  handleSelectedFiles = async (files: Array<Object>) => {
    if (files.length) {
      try {
        const manifest = await rpc.readManifest(files[0].path)
        if (
          typeof manifest.data.name === 'string' &&
          typeof manifest.data.permissions === 'object'
        ) {
          this.setState({
            manifest: manifest.data,
          })
          if (havePermissionsToGrant(manifest.data.permissions)) {
            this.setState({
              installStep: 'permissions',
            })
          } else {
            const strictGrants = createStrictPermissionGrants({})
            this.onSubmitPermissions(strictGrants)
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('invalid manifest')
        }
      } catch (err) {
        // TODO: Feedback error
        // eslint-disable-next-line no-console
        console.log('error parsing manifest: ', err)
      }
    }
  }

  onSubmitManifest = (payload: FormSubmitPayload) => {
    if (payload.valid) {
      // TODO: Implement the mainframe ID
    }
  }

  onSubmitPermissions = (userPermissions: StrictPermissionsGrants) => {
    this.setState(
      {
        installStep: 'download',
        userPermissions,
      },
      this.saveApp,
    )
  }

  saveApp = async () => {
    // $FlowFixMe: userPermissions key in state
    const { manifest, userPermissions } = this.state
    if (manifest == null || userPermissions == null) {
      // eslint-disable-next-line no-console
      console.log('invalid manifest or permissions to save app')
      // TODO: Display error
      return
    }

    const permissionsSettings = {
      grants: userPermissions,
      permissionsChecked: true,
    }

    const params = {
      userID: this.props.user.localID,
      manifest,
      permissionsSettings,
    }

    // $FlowFixMe: Permission types
    commitMutation(this.context, {
      mutation: appInstallMutation,
      variables: { input: params },
      onCompleted: () => {
        this.props.onInstallComplete()
      },
      onError: err => {
        const msg =
          err.message || 'Sorry, there was a problem creating your app.'
        this.setState({
          errorMsg: msg,
        })
      },
    })
  }

  // RENDER

  renderManifestImport() {
    return (
      <FormModalView
        dismissButton="CANCEL"
        confirmButton="OK"
        title="Install an app"
        onRequestClose={this.props.onRequestClose}
        onSubmitForm={this.onSubmitManifest}>
        <Container>
          <TextContainer>
            <Text variant={['modalText', 'center']}>
              Lorem ipsum dolor amet sitim opsos calibri <br />
              dos ipsum dolor amet sitimus.
            </Text>
          </TextContainer>
          <View>
            <TextField name="appid" required label="Mainframe App ID" />
            <DropFile
              onDrop={this.onDrop}
              inputTestID="installer-file-selector"
              accept={['application/json']}>
              <DragView>
                <Text variant={['modalText', 'center']}>
                  Or drag and drop a manifest file here.
                </Text>
              </DragView>
            </DropFile>
          </View>
        </Container>
      </FormModalView>
    )
  }

  renderPermissions() {
    const { manifest } = this.state

    return manifest ? (
      <PermissionsView
        name={manifest.name}
        permissions={manifest.permissions}
        onSubmit={this.onSubmitPermissions}
        onCancel={this.props.onRequestClose}
      />
    ) : null
  }

  renderDownload() {
    const { manifest } = this.state

    return manifest ? (
      <FormModalView title={`Downloading ${manifest.name}`}>
        <Container>
          <TextContainer>
            <Text variant={['modalText', 'center']}>
              <Loader />
            </Text>
          </TextContainer>
        </Container>
      </FormModalView>
    ) : null
  }

  render() {
    switch (this.state.installStep) {
      case 'manifest':
        return this.renderManifestImport()
      case 'permissions':
        return this.renderPermissions()
      case 'download':
        return this.renderDownload()
      default:
        return null
    }
  }
}

export default applyContext(AppInstallModal)
