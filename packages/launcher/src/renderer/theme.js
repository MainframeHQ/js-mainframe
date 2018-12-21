import COLORS from './colors'

export default {
  Button: {
    onboarding: {
      padding: 0,
      titleColor: COLORS.PRIMARY_RED,
      titleHoverColor: COLORS.PRIMARY_DARK_RED,
      iconColor: COLORS.PRIMARY_RED,
      iconHoverColor: COLORS.PRIMARY_DARK_RED,
      borderWidth: 0,
    },
    leftNav: {
      iconPosition: 'top',
      titleColor: COLORS.GREY_DARK_80,
      iconColor: COLORS.GREY_DARK_80,
      titleHoverColor: COLORS.PRIMARY_BLUE,
      iconHoverColor: COLORS.PRIMARY_BLUE,
      borderWidth: 0,
      padding: 0,
      fontWeight: 'normal',
      fontSize: 13,
      iconMargin: 5,
    },
    leftNavActive: {
      fontWeight: 'bold',
      titleColor: COLORS.PRIMARY_BLUE,
      iconColor: COLORS.PRIMARY_BLUE,
      titleHoverColor: COLORS.PRIMARY_BLUE,
      iconHoverColor: COLORS.PRIMARY_BLUE,
    },
    completeOnboarding: {
      fontWeight: 'normal',
      borderHoverColor: 'transparent',
      hoverShadow: true,
    },
  },
  Text: {
    default: {
      fontWeight: '300',
    },
    regular: {
      fontWeight: '400',
    },
    error: {
      paddingBottom: 10,
      color: COLORS.PRIMARY_RED,
    },
    smallTitle: {
      textTransform: 'uppercase',
      color: COLORS.GREY_A9,
      fontSize: 10,
      letterSpacing: '1.5px',
      padding: '20px 0',
    },
    appButtonName: {
      fontSize: '12px',
      color: '#303030',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    appButtonId: {
      fontSize: '10px',
      color: '#808080',
      textAlign: 'center',
      width: '72px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'elipsis',
    },
  },
  styled: {
    colors: COLORS,
    spacing: 10,
  },
}
