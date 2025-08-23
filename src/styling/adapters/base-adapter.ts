/**
 * @fileoverview Base adapter implementation for framework-agnostic styling
 */

import type { StyleAdapter, Theme } from '../../types/styling';
import { defaultTheme } from '../../types/styling';

/**
 * Base adapter that provides a simple object-based styling approach
 * This can be used as a foundation for other adapters or for testing
 */
export class BaseStyleAdapter implements StyleAdapter<Record<string, any>, Theme> {
  public readonly name = 'base';
  public readonly version = '1.0.0';
  public theme: Theme;

  public readonly capabilities = {
    responsive: false,
    animations: false,
    variants: false,
    darkMode: true,
    customProperties: false,
  };

  constructor(theme: Theme = defaultTheme) {
    this.theme = theme;
  }

  createStyles(styleDefinition: any, theme?: Theme): Record<string, any> {
    const currentTheme = theme || this.theme;
    
    if (!styleDefinition || typeof styleDefinition !== 'object') {
      return {};
    }

    // Process each style key
    const processedStyles: Record<string, any> = {};

    for (const [key, styles] of Object.entries(styleDefinition)) {
      if (styles && typeof styles === 'object') {
        processedStyles[key] = this.processStyleObject(styles as Record<string, any>, currentTheme);
      }
    }

    return processedStyles;
  }

  combineStyles(...styles: Record<string, any>[]): Record<string, any> {
    return styles
      .filter(Boolean)
      .reduce((combined, style) => ({ ...combined, ...style }), {});
  }

  onThemeChange(newTheme: Theme): void {
    this.theme = newTheme;
  }

  /**
   * Process a single style object, resolving theme references
   */
  private processStyleObject(styles: Record<string, any>, theme: Theme): Record<string, any> {
    const processed: Record<string, any> = {};

    for (const [property, value] of Object.entries(styles)) {
      processed[property] = this.resolveThemeValue(value, theme);
    }

    return processed;
  }

  /**
   * Resolve theme references in style values
   */
  private resolveThemeValue(value: any, theme: Theme): any {
    if (typeof value === 'string') {
      // Handle theme references like 'theme.colors.primary'
      if (value.startsWith('theme.')) {
        return this.getThemeValue(value.substring(6), theme) || value;
      }
    }

    return value;
  }

  /**
   * Get a value from theme using dot notation
   */
  private getThemeValue(path: string, theme: Theme): any {
    const parts = path.split('.');
    let current: any = theme;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

/**
 * Create a base adapter instance with default theme
 */
export const baseAdapter = new BaseStyleAdapter();

/**
 * Create a base adapter instance with custom theme
 */
export function createBaseAdapter(theme: Theme): BaseStyleAdapter {
  return new BaseStyleAdapter(theme);
}
