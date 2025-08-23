/**
 * @fileoverview Theme utility functions
 */

import type { Theme } from '../types/styling';

/**
 * Deep merge two theme objects
 */
export function mergeThemes(baseTheme: Theme, overrideTheme: DeepPartial<Theme>): Theme {
  const result: Theme = {
    colors: {
      ...baseTheme.colors,
      ...overrideTheme.colors,
      text: {
        ...baseTheme.colors.text,
        ...overrideTheme.colors?.text,
      },
      background: {
        ...baseTheme.colors.background,
        ...overrideTheme.colors?.background,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrideTheme.spacing,
    },
    typography: {
      sizes: {
        ...baseTheme.typography.sizes,
        ...overrideTheme.typography?.sizes,
      },
      weights: {
        ...baseTheme.typography.weights,
        ...overrideTheme.typography?.weights,
      },
      lineHeights: {
        ...baseTheme.typography.lineHeights,
        ...overrideTheme.typography?.lineHeights,
      },
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrideTheme.borderRadius,
    },
    shadows: {
      sm: {
        ...baseTheme.shadows.sm,
        ...overrideTheme.shadows?.sm,
        shadowOffset: {
          ...baseTheme.shadows.sm.shadowOffset,
          ...overrideTheme.shadows?.sm?.shadowOffset,
        },
      },
      md: {
        ...baseTheme.shadows.md,
        ...overrideTheme.shadows?.md,
        shadowOffset: {
          ...baseTheme.shadows.md.shadowOffset,
          ...overrideTheme.shadows?.md?.shadowOffset,
        },
      },
      lg: {
        ...baseTheme.shadows.lg,
        ...overrideTheme.shadows?.lg,
        shadowOffset: {
          ...baseTheme.shadows.lg.shadowOffset,
          ...overrideTheme.shadows?.lg?.shadowOffset,
        },
      },
    },
  };

  return result;
}

/**
 * Deep partial type helper
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Create a theme variant with specific color overrides
 */
export function createThemeVariant(
  baseTheme: Theme,
  colorOverrides: DeepPartial<Theme['colors']>
): Theme {
  return mergeThemes(baseTheme, { colors: colorOverrides });
}

/**
 * Convert theme spacing values to CSS units
 */
export function spacingToCss(spacing: number, unit: 'px' | 'rem' | 'em' = 'px'): string {
  if (unit === 'rem') {
    return `${spacing / 16}rem`;
  }
  if (unit === 'em') {
    return `${spacing / 16}em`;
  }
  return `${spacing}px`;
}

/**
 * Convert theme typography size to CSS
 */
export function typographyToCss(
  size: number,
  weight?: string,
  lineHeight?: number,
  unit: 'px' | 'rem' | 'em' = 'px'
): {
  fontSize: string;
  fontWeight?: string;
  lineHeight?: number;
} {
  const result: {
    fontSize: string;
    fontWeight?: string;
    lineHeight?: number;
  } = {
    fontSize: spacingToCss(size, unit),
  };

  if (weight) {
    result.fontWeight = weight;
  }

  if (lineHeight) {
    result.lineHeight = lineHeight;
  }

  return result;
}

/**
 * Validate that a theme object has all required properties
 */
export function validateTheme(theme: any): theme is Theme {
  if (!theme || typeof theme !== 'object') {
    return false;
  }

  // Check colors
  if (!theme.colors || typeof theme.colors !== 'object') {
    return false;
  }

  const requiredColorProps = ['primary', 'secondary', 'success', 'warning', 'error', 'border'];
  for (const prop of requiredColorProps) {
    if (typeof theme.colors[prop] !== 'string') {
      return false;
    }
  }

  // Check nested color objects
  if (!theme.colors.text || typeof theme.colors.text !== 'object') {
    return false;
  }
  if (!theme.colors.background || typeof theme.colors.background !== 'object') {
    return false;
  }

  // Check spacing
  if (!theme.spacing || typeof theme.spacing !== 'object') {
    return false;
  }

  const requiredSpacingProps = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  for (const prop of requiredSpacingProps) {
    if (typeof theme.spacing[prop] !== 'number') {
      return false;
    }
  }

  // Check typography
  if (!theme.typography || typeof theme.typography !== 'object') {
    return false;
  }

  if (!theme.typography.sizes || typeof theme.typography.sizes !== 'object') {
    return false;
  }

  // Check border radius
  if (!theme.borderRadius || typeof theme.borderRadius !== 'object') {
    return false;
  }

  // Check shadows
  if (!theme.shadows || typeof theme.shadows !== 'object') {
    return false;
  }

  return true;
}

/**
 * Get a color value from theme with fallback
 */
export function getThemeColor(
  theme: Theme,
  colorPath: string,
  fallback: string = '#000000'
): string {
  const parts = colorPath.split('.');
  let current: any = theme.colors;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback;
    }
  }

  return typeof current === 'string' ? current : fallback;
}

/**
 * Get a spacing value from theme with fallback
 */
export function getThemeSpacing(
  theme: Theme,
  size: keyof Theme['spacing'],
  fallback: number = 16
): number {
  return theme.spacing[size] ?? fallback;
}

/**
 * Get a typography value from theme with fallback
 */
export function getThemeTypography(
  theme: Theme,
  size: keyof Theme['typography']['sizes'],
  fallback: number = 16
): number {
  return theme.typography.sizes[size] ?? fallback;
}
