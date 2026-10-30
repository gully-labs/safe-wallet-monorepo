import type { ColorPalette } from './types'

/**
 * Unified dark mode color palette.
 * Gully Safe: GullyChain brand kit v4 (GN 2.0 roles): ink #0A0F0E ground, #111716 cards, charcoal #1A1F1E surfaces,
 * emerald #00C878 primary (ink text), deep green #005B39, mint #2CF29A live/links, white/silver text, #8FA09C secondary,
 * kit success #10B981 / warning #F59E0B / error #EF4444.
 * Merged from web and mobile palettes with mobile's extended colors as the base.
 */
const darkPalette: ColorPalette = {
  text: {
    primary: '#FFFFFF',
    secondary: '#8FA09C',
    disabled: '#8FA09C',
    contrast: '#0A0F0E',
  },
  primary: {
    dark: '#005B39',
    main: '#00C878',
    light: '#D0D5DA',
  },
  secondary: {
    dark: '#8FA09C',
    main: '#FFFFFF',
    light: '#2CF29A',
    background: '#111716',
  },
  border: {
    main: '#8FA09C',
    light: '#1A1F1E',
    background: '#0A0F0E',
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
    dark: '#D9F4FB',
    main: '#00C878',
    light: '#458898',
    background: '#203339',
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
    default: '#0A0F0E',
    main: '#0A0F0E',
    sheet: '#0A0F0E',
    paper: '#111716',
    light: '#111716',
    secondary: '#1A1F1E',
    skeleton: 'rgba(255, 255, 255, 0.04)',
    disabled: '#7878801F',
  },
  backdrop: {
    main: '#8FA09C',
  },
  logo: {
    main: '#FFFFFF',
    background: '#1A1F1E',
  },
  static: {
    main: '#0A0F0E',
    light: '#8FA09C',
    primary: '#FFFFFF',
    textSecondary: '#A1A3A7',
    textBrand: '#00C878',
  },
}

export default darkPalette
