/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0f7c67';
const tintColorDark = '#95f2cb';

export const Colors = {
  light: {
    text: '#17271f',
    background: '#f4efe5',
    chrome: '#f9f5ed',
    card: '#fffaf3',
    cardSoft: '#f2eadf',
    hero: '#1f372d',
    heroText: '#f6f1e8',
    heroMuted: '#c5d4ca',
    line: '#ddd2c4',
    lineStrong: '#7db89f',
    badge: '#e4efe8',
    badgeStrong: '#244438',
    shadow: 'rgba(23, 39, 31, 0.10)',
    barTrack: '#d8d0c2',
    accent: tintColorLight,
    warning: '#b8662a',
    ambientA: '#eddcc1',
    ambientB: '#d9efe8',
    tint: tintColorLight,
    icon: '#5f7368',
    muted: '#6e786f',
    tabIconDefault: '#79857e',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ecf5ef',
    background: '#0d1512',
    chrome: '#101d18',
    card: '#12231d',
    cardSoft: '#193028',
    hero: '#d5f2de',
    heroText: '#10231b',
    heroMuted: '#44695c',
    line: '#223a31',
    lineStrong: '#77c9a7',
    badge: '#183026',
    badgeStrong: '#234438',
    shadow: 'rgba(0, 0, 0, 0.28)',
    barTrack: '#24453a',
    accent: tintColorDark,
    warning: '#f0ae61',
    ambientA: '#1b2b25',
    ambientB: '#102723',
    tint: tintColorDark,
    icon: '#91a49a',
    muted: '#9cb3a8',
    tabIconDefault: '#71867c',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    serif: 'serif',
    rounded: 'sans-serif-medium',
    mono: 'monospace',
  },
  web: {
    sans: "'Avenir Next', 'Segoe UI', sans-serif",
    serif: "'Iowan Old Style', 'Palatino Linotype', serif",
    rounded: "'Avenir Next Rounded', 'Trebuchet MS', sans-serif",
    mono: "'SFMono-Regular', 'IBM Plex Mono', monospace",
  },
});
