import type { ColorPalette } from './types'

/**
 * Unified dark mode color palette.
 * Gully Safe: GullyChain brand kit v3 colours (night, ink, cyan, blue, green, white, muted).
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const darkPalette: ColorPalette = {
  text: {
    primary: '#F2F5F7',
    secondary: '#8A97A8',
    disabled: '#8A97A8',
    contrast: '#05080D',
  },
  primary: {
    dark: '#2563FF',
    main: '#00B2FA',
    light: '#A1A3A7',
  },
  secondary: {
    dark: '#8A97A8',
    main: '#F2F5F7',
    light: '#7FD8FD',
    background: '#0D1A26',
  },
  border: {
    main: '#8A97A8',
    light: '#1A2433',
    background: '#05080D',
  },
  error: {
    dark: '#FFE0E6',
    main: '#FF5F72',
    light: '#4A2125',
    background: '#4A2125',
  },
  error1: {
    main: '#4A2125',
    contrastText: '#FFE0E6',
  },
  success: {
    dark: '#DEFDEA',
    main: '#46FB04',
    light: '#3B7A54',
    background: '#173026',
  },
  info: {
    dark: '#D9F4FB',
    main: '#00B2FA',
    light: '#458898',
    background: '#203339',
  },
  warning: {
    dark: '#FFE4CB',
    main: '#FF8C00',
    light: '#A65F34',
    background: '#4A3621',
  },
  warning1: {
    main: '#4A3621',
    text: '#FFE4CB',
    contrastText: '#FF8C00',
  },
  background: {
    default: '#05080D',
    main: '#05080D',
    sheet: '#05080D',
    paper: '#0A1018',
    light: '#0D1A26',
    secondary: '#1A2433',
    skeleton: 'rgba(255, 255, 255, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#8A97A8',
  },
  logo: {
    main: '#F2F5F7',
    background: '#1A2433',
  },
  static: {
    main: '#05080D',
    light: '#8A97A8',
    primary: '#F2F5F7',
    textSecondary: '#A1A3A7',
    textBrand: '#00B2FA',
  },
}

export default darkPalette
