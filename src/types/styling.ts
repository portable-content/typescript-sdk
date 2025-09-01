/**
 * @fileoverview Styling system type definitions for the Portable Content System
 */

/**
 * Universal theme tokens that work across all styling systems
 */
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    text: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    background: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    weights: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: ShadowStyle;
    md: ShadowStyle;
    lg: ShadowStyle;
  };
}

/**
 * Shadow style definition that works across platforms
 */
export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number; // Android elevation
}

/**
 * Capabilities that a styling adapter can support
 */
export interface StyleCapabilities {
  /** Supports responsive design features */
  responsive?: boolean;
  /** Supports animations and transitions */
  animations?: boolean;
  /** Supports style variants (hover, focus, etc.) */
  variants?: boolean;
  /** Supports dark mode theming */
  darkMode?: boolean;
  /** Supports custom CSS properties */
  customProperties?: boolean;
}

/**
 * Universal styling adapter interface
 *
 * This interface allows the system to work with any styling approach
 * (StyleSheet, Unistyles, NativeWind, Styled Components, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface StyleAdapter<TStyle = any, TTheme = Theme> {
  /** Unique name for this adapter */
  name: string;

  /** Version of the adapter (optional) */
  version?: string;

  /** Theme object used by this adapter */
  theme: TTheme;

  /** Core method to create styles from a style definition */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createStyles: (styleDefinition: any, theme?: TTheme) => TStyle;

  /** Core method to combine multiple styles */
  combineStyles: (...styles: TStyle[]) => TStyle;

  /** Optional method for responsive styles (if supported) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createResponsiveStyles?: (styleDefinition: any, breakpoints?: any) => TStyle;

  /** Optional method for animated styles (if supported) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createAnimatedStyles?: (styleDefinition: any) => TStyle;

  /** Optional method for variant styles (if supported) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createVariantStyles?: (variants: Record<string, any>) => TStyle;

  /** Lifecycle hook called when adapter is mounted */
  onMount?: () => void;

  /** Lifecycle hook called when adapter is unmounted */
  onUnmount?: () => void;

  /** Lifecycle hook called when theme changes */
  onThemeChange?: (newTheme: TTheme) => void;

  /** Metadata about what this adapter supports */
  capabilities?: StyleCapabilities;
}

/**
 * Default theme tokens
 */
export const defaultTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: {
      primary: '#000000',
      secondary: '#6C6C70',
      tertiary: '#C7C7CC',
    },
    background: {
      primary: '#FFFFFF',
      secondary: '#F2F2F7',
      tertiary: '#E5E5EA',
    },
    border: '#C6C6C8',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;

/**
 * Dark theme variant
 */
export const darkTheme: Theme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    text: {
      primary: '#FFFFFF',
      secondary: '#A1A1A6',
      tertiary: '#48484A',
    },
    background: {
      primary: '#000000',
      secondary: '#1C1C1E',
      tertiary: '#2C2C2E',
    },
    border: '#38383A',
  },
} as const;

/**
 * Type helper to extract style type from adapter
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StyleFromAdapter<T extends StyleAdapter> = T extends StyleAdapter<infer S> ? S : any;

/**
 * Type helper to extract theme type from adapter
 */
export type ThemeFromAdapter<T extends StyleAdapter> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends StyleAdapter<any, infer TH> ? TH : Theme;
