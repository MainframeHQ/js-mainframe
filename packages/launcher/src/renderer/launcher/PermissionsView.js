//@flow

import React, { Component } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  Switch,
  ScrollView,
} from 'react-native-web'
import Button from '../Button'

// TODO use types defined in permissions package when ready

type Domain = string
type PermissionGrant = boolean
type PermissionRequirement = 'required' | 'optional'
type PermissionOption = {
  HTTPS_REQUEST?: Array<Domain>,
  [PermissionKey]: ?true,
}
type PermissionSetting = {
  HTTPS_REQUEST?: { [Domain]: PermissionGrant },
  [PermissionKey]: PermissionGrant,
}

// Permissions requested by manifest
export type PermissionOptions = {
  [PermissionRequirement]: PermissionOption,
}

// Permissions set by user
export type PermissionSettings = {
  [PermissionRequirement]: PermissionSetting,
}

// Permissions formatted for saving to app state
export type AppPermissions = {
  HTTPS_REQUEST?: {
    granted?: Array<Domain>,
    denied?: Array<Domain>,
  },
  [PermissionKey]: ?boolean,
}

type Props = {
  permissions: PermissionOptions,
  onSubmit: (permissionSettings: PermissionSettings) => void,
}

type State = {
  permissionSettings: PermissionSettings,
  failedValidation?: boolean,
}

type PermissionInfo = {
  name: string,
  description: string,
}

const PERMISSION_NAMES = {
  SWARM_DOWNLOAD: {
    name: 'Download From Swarm',
    description: 'Allow the app to download files from swarm',
  },
  SWARM_UPLOAD: {
    name: 'Upload To Swarm',
    description: 'Allow this app to upload files from swarm',
  },
  WEB3_CALL: {
    name: 'Read from Blockchain',
    description: 'Allow this app to make read only calls to the blockchain',
  },
  WEB3_SEND: {
    name: 'Write to the Blockchain',
    description:
      'Allow this app to make transactional calls to the blockchain, e.g. send tokens',
  },
  HTTPS_REQUEST: {
    name: 'Make https requests',
    description: 'Allow this app to make https requests to specified domains',
  },
  NOTIFICATIONS_DISPLAY: {
    name: 'Display Notifications',
    description: 'Allow this app to display notifications',
  },
  LOCATION_GET: {
    name: 'Read Location',
    description: 'Allow this app to read your current location',
  },
}

type PermissionKey = $Keys<typeof PERMISSION_NAMES>

export default class PermissionsView extends Component<Props, State> {
  state = {
    permissionSettings: {
      required: {
        HTTPS_REQUEST: {},
      },
      optional: {
        HTTPS_REQUEST: {},
      },
    },
  }

  // HANDLERS

  onPressDone = () => {
    const invalid = Object.keys(this.props.permissions.required).some(key => {
      const stateValue = this.state.permissionSettings.required[key]
      if (stateValue == null) {
        return true
      }
      if (key === 'HTTPS_REQUEST') {
        const value = this.props.permissions.required[key]
        if (value == null) {
          return true
        }
        const nonAcceptedDomain = value.some(domain => {
          return !stateValue[domain]
        })
        return nonAcceptedDomain
      } else if (!stateValue) {
        return true
      }
      return false
    })
    if (invalid) {
      this.setState({ failedValidation: true })
      return
    }

    const appPermissions = {
      HTTPS_REQUEST: {
        granted: [],
        denied: [],
      },
    }
    const formatSettings = settings => {
      Object.keys(settings).forEach(key => {
        const perm = settings[key]
        if (key === 'HTTPS_REQUEST') {
          Object.keys(perm).forEach(domain => {
            if (!appPermissions[key][domain]) {
              const granted = perm[domain] ? 'granted' : 'denied'
              appPermissions[key][granted].push(domain)
            }
          })
        } else {
          appPermissions[key] = perm
        }
      })
    }
    formatSettings(this.state.permissionSettings.required)
    formatSettings(this.state.permissionSettings.optional)
    this.props.onSubmit(appPermissions)
  }

  onToggle = (
    key: PermissionKey,
    requiredType: PermissionRequirement,
    accept: boolean,
    option?: string,
  ) => {
    const permissionSettings = this.state.permissionSettings
    if (key === 'HTTPS_REQUEST' && option != null) {
      let acceptedDomains = this.state.permissionSettings[requiredType][
        'HTTPS_REQUEST'
      ]
      if (permissionSettings[requiredType].HTTPS_REQUEST[option] === accept) {
        delete permissionSettings[requiredType].HTTPS_REQUEST[option]
      } else {
        permissionSettings[requiredType].HTTPS_REQUEST[option] = accept
        console.log(
          'set perm: ',
          permissionSettings[requiredType].HTTPS_REQUEST[option],
        )
      }
    } else {
      if (permissionSettings[requiredType][key] === accept) {
        delete permissionSettings[requiredType][key]
      } else {
        permissionSettings[requiredType][key] = accept
      }
    }
    this.setState({ permissionSettings })
  }

  // RENDER

  renderPermission = (
    key: PermissionKey,
    option: PermissionOption,
    required: boolean,
  ) => {
    const { permissionSettings } = this.state
    const type = required ? 'required' : 'optional'
    let options
    if (PERMISSION_NAMES[key]) {
      if (key === 'HTTPS_REQUEST') {
        options = (
          <View key={key} style={styles.domains}>
            {option.map(domain => {
              const accepted = !!permissionSettings[type][key][domain]
              const rejected = permissionSettings[type][key][domain] === false
              const style = [styles.domainOption]
              return (
                <View style={styles.domainRow} key={domain}>
                  <Text key={domain} style={styles.domainLabel}>
                    {domain}
                  </Text>
                  <View style={styles.switches}>
                    <Text style={styles.switchLabel}>YES</Text>
                    <Switch
                      value={accepted}
                      onValueChange={() =>
                        this.onToggle(key, type, true, domain)
                      }
                    />
                    <Text style={styles.switchLabel}>NO</Text>
                    <Switch
                      value={rejected}
                      onValueChange={() =>
                        this.onToggle(key, type, false, domain)
                      }
                    />
                  </View>
                </View>
              )
            })}
          </View>
        )
      } else {
        const accepted = !!permissionSettings[type][key]
        const rejected = permissionSettings[type][key] === false
        options = (
          <View style={styles.switches}>
            <Text style={styles.switchLabel}>YES</Text>
            <Switch
              value={accepted}
              onValueChange={() => this.onToggle(key, type, true)}
              key={key + 'YES'}
            />
            <Text style={styles.switchLabel}>NO</Text>
            <Switch
              value={rejected}
              onValueChange={() => this.onToggle(key, type, false)}
              key={key + 'NO'}
            />
          </View>
        )
      }
      const hasOptions = key === 'HTTPS_REQUEST'
      const rowStyle = hasOptions
        ? styles.permissionRowWithOptions
        : styles.permissionRow
      return (
        <View style={rowStyle} key={key}>
          <View style={styles.permissionInfo}>
            <Text style={styles.permissionName}>
              {PERMISSION_NAMES[key].name}
            </Text>
            <Text style={styles.permissionDescription}>
              {PERMISSION_NAMES[key].description}
            </Text>
          </View>
          {options}
        </View>
      )
    } else {
      return (
        <View style={styles.permissionRow} key={key}>
          <Text style={styles.permissionName}>
            {`This app is asking for permission to an unknown permission key: ${key}`}
          </Text>
        </View>
      )
    }
  }

  renderPermissionsOptions = () => {
    const required = Object.keys(this.props.permissions.required).map(key => {
      const option = this.props.permissions.required[key]
      return this.renderPermission(key, option, true)
    })
    const optional = Object.keys(this.props.permissions.optional).map(key => {
      const option = this.props.permissions.optional[key]
      return this.renderPermission(key, option, false)
    })
    return (
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>Required Permissions</Text>
        {required}
        <Text style={styles.header}>Optional Permissions</Text>
        {optional}
      </ScrollView>
    )
  }

  render() {
    const failedValidation = this.state.failedValidation ? (
      <Text style={styles.errorMessage}>
        You have to accept all required permissions to continue.
      </Text>
    ) : null
    return (
      <View style={styles.container}>
        {this.renderPermissionsOptions()}
        {failedValidation}
        <Button title="Save Preferences" onPress={this.onPressDone} />
      </View>
    )
  }
}

const COLOR_WHITE = '#ffffff'
const COLOR_LIGHT_GREY = '#f0f0f0'
const COLOR_MF_RED = '#db0b56'

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLOR_WHITE,
    flex: 1,
    maxHeight: 400,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  permissionRow: {
    backgroundColor: COLOR_LIGHT_GREY,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionRowWithOptions: {
    backgroundColor: COLOR_LIGHT_GREY,
    padding: 8,
    marginBottom: 6,
    flexDirection: 'column',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    paddingBottom: 6,
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionDescription: {
    fontSize: 12,
    paddingRight: 20,
  },
  scrollView: {
    marginBottom: 10,
    flex: 1,
  },
  domains: {
    paddingTop: 5,
  },
  domainRow: {
    flexDirection: 'row',
    padding: 7,
    backgroundColor: COLOR_WHITE,
  },
  domainOption: {
    borderRadius: 30,
    padding: 8,
    backgroundColor: COLOR_WHITE,
    textAlign: 'center',
    margin: 4,
  },
  domainLabel: {
    flex: 1,
  },
  switches: {
    flexDirection: 'row',
  },
  switchLabel: {
    paddingHorizontal: 5,
  },
  errorMessage: {
    paddingBottom: 10,
    paddingTop: 5,
    color: COLOR_MF_RED,
  },
})
