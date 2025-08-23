/**
 * @fileoverview Tests for theme utilities
 */

import {
  mergeThemes,
  createThemeVariant,
  spacingToCss,
  typographyToCss,
  validateTheme,
  getThemeColor,
  getThemeSpacing,
  getThemeTypography,
} from '../../../src/styling/theme-utils';
import { defaultTheme, darkTheme } from '../../../src/types/styling';

describe('mergeThemes', () => {
  it('should merge themes correctly', () => {
    const override = {
      colors: {
        primary: '#ff0000',
        text: {
          primary: '#ffffff',
        },
      },
      spacing: {
        md: 20,
      },
    };

    const merged = mergeThemes(defaultTheme, override);

    expect(merged.colors.primary).toBe('#ff0000');
    expect(merged.colors.text.primary).toBe('#ffffff');
    expect(merged.colors.text.secondary).toBe(defaultTheme.colors.text.secondary); // preserved
    expect(merged.spacing.md).toBe(20);
    expect(merged.spacing.sm).toBe(defaultTheme.spacing.sm); // preserved
  });

  it('should handle empty override', () => {
    const merged = mergeThemes(defaultTheme, {});
    expect(merged).toEqual(defaultTheme);
  });
});

describe('createThemeVariant', () => {
  it('should create theme variant with color overrides', () => {
    const colorOverrides = {
      primary: '#00ff00',
      text: {
        primary: '#333333',
      },
    };

    const variant = createThemeVariant(defaultTheme, colorOverrides);

    expect(variant.colors.primary).toBe('#00ff00');
    expect(variant.colors.text.primary).toBe('#333333');
    expect(variant.spacing).toEqual(defaultTheme.spacing); // unchanged
  });
});

describe('spacingToCss', () => {
  it('should convert to pixels by default', () => {
    expect(spacingToCss(16)).toBe('16px');
  });

  it('should convert to rem', () => {
    expect(spacingToCss(16, 'rem')).toBe('1rem');
  });

  it('should convert to em', () => {
    expect(spacingToCss(32, 'em')).toBe('2em');
  });
});

describe('typographyToCss', () => {
  it('should convert typography to CSS object', () => {
    const result = typographyToCss(16, '500', 1.5);

    expect(result).toEqual({
      fontSize: '16px',
      fontWeight: '500',
      lineHeight: 1.5,
    });
  });

  it('should handle optional parameters', () => {
    const result = typographyToCss(18);

    expect(result).toEqual({
      fontSize: '18px',
    });
  });

  it('should convert to rem', () => {
    const result = typographyToCss(16, undefined, undefined, 'rem');

    expect(result).toEqual({
      fontSize: '1rem',
    });
  });
});

describe('validateTheme', () => {
  it('should validate correct theme', () => {
    expect(validateTheme(defaultTheme)).toBe(true);
    expect(validateTheme(darkTheme)).toBe(true);
  });

  it('should reject non-object themes', () => {
    expect(validateTheme(null)).toBe(false);
    expect(validateTheme('theme')).toBe(false);
    expect(validateTheme(123)).toBe(false);
  });

  it('should reject themes missing colors', () => {
    const invalidTheme = { ...defaultTheme };
    delete (invalidTheme as any).colors;

    expect(validateTheme(invalidTheme)).toBe(false);
  });

  it('should reject themes with invalid color properties', () => {
    const invalidTheme = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: 123, // should be string
      },
    };

    expect(validateTheme(invalidTheme)).toBe(false);
  });

  it('should reject themes missing spacing', () => {
    const invalidTheme = { ...defaultTheme };
    delete (invalidTheme as any).spacing;

    expect(validateTheme(invalidTheme)).toBe(false);
  });

  it('should reject themes with invalid spacing values', () => {
    const invalidTheme = {
      ...defaultTheme,
      spacing: {
        ...defaultTheme.spacing,
        md: 'medium', // should be number
      },
    };

    expect(validateTheme(invalidTheme)).toBe(false);
  });
});

describe('getThemeColor', () => {
  it('should get nested color values', () => {
    expect(getThemeColor(defaultTheme, 'primary')).toBe('#007AFF');
    expect(getThemeColor(defaultTheme, 'text.primary')).toBe('#000000');
    expect(getThemeColor(defaultTheme, 'background.secondary')).toBe('#F2F2F7');
  });

  it('should return fallback for invalid paths', () => {
    expect(getThemeColor(defaultTheme, 'invalid.path', '#fallback')).toBe('#fallback');
    expect(getThemeColor(defaultTheme, 'colors.invalid')).toBe('#000000'); // default fallback
  });
});

describe('getThemeSpacing', () => {
  it('should get spacing values', () => {
    expect(getThemeSpacing(defaultTheme, 'md')).toBe(16);
    expect(getThemeSpacing(defaultTheme, 'lg')).toBe(24);
  });

  it('should return fallback for invalid keys', () => {
    expect(getThemeSpacing(defaultTheme, 'invalid' as any, 99)).toBe(99);
  });
});

describe('getThemeTypography', () => {
  it('should get typography values', () => {
    expect(getThemeTypography(defaultTheme, 'md')).toBe(16);
    expect(getThemeTypography(defaultTheme, 'lg')).toBe(18);
  });

  it('should return fallback for invalid keys', () => {
    expect(getThemeTypography(defaultTheme, 'invalid' as any, 99)).toBe(99);
  });
});
