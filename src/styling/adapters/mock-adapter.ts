/**
 * @fileoverview Mock adapter for testing and development
 */

import type { StyleAdapter, Theme } from '../../types/styling';
import { defaultTheme } from '../../types/styling';

/**
 * Mock adapter that simulates different styling system behaviors
 * Useful for testing and development
 */
export class MockStyleAdapter implements StyleAdapter<string, Theme> {
  public readonly name: string;
  public readonly version = '1.0.0';
  public theme: Theme;

  public readonly capabilities = {
    responsive: true,
    animations: true,
    variants: true,
    darkMode: true,
    customProperties: true,
  };

  private mountCallbacks: (() => void)[] = [];
  private unmountCallbacks: (() => void)[] = [];
  private themeChangeCallbacks: ((theme: Theme) => void)[] = [];

  constructor(name: string = 'mock', theme: Theme = defaultTheme) {
    this.name = name;
    this.theme = theme;
  }

  createStyles(styleDefinition: any, theme?: Theme): string {
    const currentTheme = theme || this.theme;
    
    if (!styleDefinition || typeof styleDefinition !== 'object') {
      return '';
    }

    // Simulate creating CSS classes or style strings
    const styleKeys = Object.keys(styleDefinition);
    const classNames = styleKeys.map(key => `${this.name}-${key}`);
    
    return classNames.join(' ');
  }

  combineStyles(...styles: string[]): string {
    return styles
      .filter(Boolean)
      .filter(style => typeof style === 'string')
      .join(' ');
  }

  createResponsiveStyles(styleDefinition: any, breakpoints?: any): string {
    // Simulate responsive style creation
    const baseStyles = this.createStyles(styleDefinition);
    return `${baseStyles} responsive`;
  }

  createAnimatedStyles(styleDefinition: any): string {
    // Simulate animated style creation
    const baseStyles = this.createStyles(styleDefinition);
    return `${baseStyles} animated`;
  }

  createVariantStyles(variants: Record<string, any>): string {
    // Simulate variant style creation
    const variantKeys = Object.keys(variants);
    const variantClasses = variantKeys.map(key => `variant-${key}`);
    return variantClasses.join(' ');
  }

  onMount(): void {
    this.mountCallbacks.forEach(callback => callback());
  }

  onUnmount(): void {
    this.unmountCallbacks.forEach(callback => callback());
  }

  onThemeChange(newTheme: Theme): void {
    this.theme = newTheme;
    this.themeChangeCallbacks.forEach(callback => callback(newTheme));
  }

  // Test utilities
  addMountCallback(callback: () => void): void {
    this.mountCallbacks.push(callback);
  }

  addUnmountCallback(callback: () => void): void {
    this.unmountCallbacks.push(callback);
  }

  addThemeChangeCallback(callback: (theme: Theme) => void): void {
    this.themeChangeCallbacks.push(callback);
  }

  clearCallbacks(): void {
    this.mountCallbacks = [];
    this.unmountCallbacks = [];
    this.themeChangeCallbacks = [];
  }

  // Simulate different adapter behaviors
  simulateError(): void {
    throw new Error(`Mock adapter ${this.name} simulated error`);
  }

  simulateSlowOperation(delay: number = 100): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`slow-operation-${this.name}`);
      }, delay);
    });
  }
}

/**
 * Create a mock adapter instance
 */
export function createMockAdapter(name?: string, theme?: Theme): MockStyleAdapter {
  return new MockStyleAdapter(name, theme);
}

/**
 * Default mock adapter instance
 */
export const mockAdapter = new MockStyleAdapter();
