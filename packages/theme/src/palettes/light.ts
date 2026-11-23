import type { ColorPalette } from './types'

/**
 * Unified light mode color palette.
 * Gully Multisig: Gully Labs kit (2026-11-22, same tokens as the gullymultisig.xyz landing): ground #F1F3F8, ink #0E1C38,
 * blue #3754A0 primary, light blue accents. Success, warning, error and info keep their meaning colours.
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const lightPalette: ColorPalette = {
  text: {
    primary: '#0E1C38',
    secondary: '#4F5F82',
    disabled: '#AAB2C8',
    contrast: '#FFFFFF',
  },
  primary: {
    dark: '#2D468A',
    main: '#3754A0',
    light: '#4F5F82',
  },
  secondary: {
    dark: '#3754A0',
    main: '#6F8DDF',
    light: '#3754A0',
    background: '#E6EBF6',
  },
  border: {
    main: '#8A95B2',
    light: '#D9DFEC',
    background: '#F1F3F8',
  },
  error: {
    dark: '#8A1C27',
    main: '#FF5F72',
    light: '#F79BA7',
    background: '#FFE0E6',
  },
  error1: {
    main: '#FFE0E6',
    contrastText: '#8A1C27',
  },
  success: {
    dark: '#1C5538',
    main: '#00B460',
    light: '#84D9A0',
    background: '#CBF2DB',
  },
  info: {
    dark: '#15566A',
    main: '#00BFE5',
    light: '#78D2E7',
    background: '#CEF0FD',
  },
  warning: {
    dark: '#6C2D19',
    main: '#FF8C00',
    light: '#F9B37C',
    background: '#FFECC2',
  },
  warning1: {
    main: '#FFECC2',
    text: '#6C2D19',
    contrastText: '#FF8C00',
  },
  background: {
    default: '#F1F3F8',
    main: '#F1F3F8',
    sheet: '#F1F3F8',
    paper: '#FFFFFF',
    light: '#E6EBF6',
    secondary: '#DDE3F0',
    skeleton: 'rgba(0, 0, 0, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#4F5F82',
  },
  logo: {
    main: '#0E1C38',
    background: '#E6EBF6',
  },
  static: {
    main: '#0E1C38',
    light: '#4F5F82',
    primary: '#FFFFFF',
    textSecondary: '#A1A3A7',
    textBrand: '#3754A0',
  },
}

export default lightPalette
