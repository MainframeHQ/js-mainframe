// @flow

import { Button } from '@morpheus-ui/core'
import AppsIcon from '@morpheus-ui/icons/AppsMd'
import AppsFilledIcon from '@morpheus-ui/icons/AppsFilledMd'
import ContactsIcon from '@morpheus-ui/icons/ContactsMd'
import ContactsFilledIcon from '@morpheus-ui/icons/ContactsFilledMd'
import WalletsIcon from '@morpheus-ui/icons/WalletsMd'
import WalletsFilledIcon from '@morpheus-ui/icons/WalletsFilledMd'
import SettingsIcon from '@morpheus-ui/icons/SettingsMd'
import SettingsFilledIcon from '@morpheus-ui/icons/SettingsFilledMd'
import React from 'react'
import { Route } from 'react-router'
import styled from 'styled-components/native'

import SvgSelectedPointer from '../UIComponents/SVGSelectedPointer'

import { ROUTES } from './constants'

const Container = styled.View`
  width: 126px;
  padding-top: 20px;
  background-color: ${props => props.theme.colors.LIGHT_GREY_F5};
`

const ScrollView = styled.ScrollView`
  padding: ${props => props.theme.spacing * 2}px;
`

const MenuItem = styled.View`
  padding: 10px 0 15px 0;
  align-items: center;
`

const NotificationDot = styled.View`
  width: 5px;
  height: 5px;
  border-radius: 100%;
  background-color: ${props =>
    props.active ? props.theme.colors.PRIMARY_RED : 'transparent'};
  margin-top: 7px;
`

const SelectedPointer = styled.View`
  width: 21px;
  height: 42px;
  position: absolute;
  right: -21px;
  margin-top: -8px;
`

const ITEMS = [
  {
    key: 'apps',
    title: 'Applications',
    icon: AppsIcon,
    activeIcon: AppsFilledIcon,
    path: ROUTES.APPS,
  },
  {
    key: 'contacts',
    title: 'Contacts',
    icon: ContactsIcon,
    activeIcon: ContactsFilledIcon,
    path: ROUTES.CONTACTS,
  },
  {
    key: 'wallets',
    title: 'Wallets',
    icon: WalletsIcon,
    activeIcon: WalletsFilledIcon,
    path: ROUTES.WALLETS,
  },
  {
    key: 'settings',
    title: 'More',
    icon: SettingsIcon,
    activeIcon: SettingsFilledIcon,
    path: ROUTES.SETTINGS,
  },
]

type BadgeKey = 'apps' | 'contacts' | 'wallets' | 'settings'
export type MenuBadges = { [key: BadgeKey]: boolean }

type Props = { badges: MenuBadges }

export default function SideMenu({ badges }: Props) {
  const items = ITEMS.map(data => {
    return (
      <Route key={data.key} path={data.path}>
        {({ history, match }) => (
          <MenuItem>
            <Button
              Icon={match ? data.activeIcon : data.icon}
              variant={match ? ['leftNav', 'leftNavActive'] : 'leftNav'}
              title={data.title}
              onPress={() => {
                history.push(data.path)
              }}
            />
            {match ? (
              <SelectedPointer>
                <SvgSelectedPointer />
              </SelectedPointer>
            ) : null}
            <NotificationDot active={badges[data.key] === true} />
          </MenuItem>
        )}
      </Route>
    )
  })

  return (
    <Container>
      <ScrollView>{items}</ScrollView>
    </Container>
  )
}
