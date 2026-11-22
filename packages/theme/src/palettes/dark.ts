import type { ColorPalette } from './types'

/**
 * Unified dark mode color palette.
 * Gully Multisig: Gully Labs kit (2026-11-22, same tokens as the gullymultisig.xyz landing): navy #0E1C38 ground,
 * #142547 cards, #1B2E56 surfaces, blue #4C6BD6 primary (white text), light blue #8FA8EC links, #F1F3F8 text,
 * #A9B4CF secondary. Success, warning and error keep their meaning colours.
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const darkPalette: ColorPalette = {
  text: {
    primary: '#F1F3F8',
    secondary: '#A9B4CF',
    disabled: '#A9B4CF',
    contrast: '#FFFFFF',
  },
  primary: {
    dark: '#3754A0',
    main: '#4C6BD6',
    light: '#C9D2E8',
  },
  secondary: {
    dark: '#A9B4CF',
    main: '#FFFFFF',
    light: '#8FA8EC',
    background: '#142547',
  },
  border: {
    main: '#6B7BA3',
    light: '#2A3B63',
    background: '#0E1C38',
  },
  error: {
    dark: '#FFE0E6',
    main: '#EF4444',
    light: '#4A2125',
    background: '#4A2125',
  },
  error1: {
    main: '#4A2125',
    contrastText: '#FFE0E6',
  },
  success: {
    dark: '#DEFDEA',
    main: '#10B981',
    light: '#3B7A54',
    background: '#173026',
  },
  info: {
    dark: '#D9E2FB',
    main: '#6F8DDF',
    light: '#5A73B8',
    background: '#17284D',
  },
  warning: {
    dark: '#FFE4CB',
    main: '#F59E0B',
    light: '#A65F34',
    background: '#4A3621',
  },
  warning1: {
    main: '#4A3621',
    text: '#FFE4CB',
    contrastText: '#FF8C00',
  },
  background: {
    default: '#0E1C38',
    main: '#0E1C38',
    sheet: '#0E1C38',
    paper: '#142547',
    light: '#142547',
    secondary: '#1B2E56',
    skeleton: 'rgba(255, 255, 255, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#A9B4CF',
  },
  logo: {
    main: '#FFFFFF',
    background: '#1B2E56',
  },
  static: {
    main: '#0E1C38',
    light: '#A9B4CF',
    primary: '#FFFFFF',
    textSecondary: '#A1A3A7',
    textBrand: '#8FA8EC',
  },
}

export default darkPalette
