/**
 * @fileoverview Tests for BaseStyleAdapter
 */

import { BaseStyleAdapter, createBaseAdapter, baseAdapter } from '../../../src/styling/adapters/base-adapter';
import { defaultTheme, darkTheme } from '../../../src/types/styling';

describe('BaseStyleAdapter', () => {
  let adapter: BaseStyleAdapter;

  beforeEach(() => {
    adapter = new BaseStyleAdapter();
  });

  describe('constructor', () => {
    it('should initialize with default theme', () => {
      expect(adapter.theme).toEqual(defaultTheme);
      expect(adapter.name).toBe('base');
      expect(adapter.version).toBe('1.0.0');
    });

    it('should initialize with custom theme', () => {
      const customAdapter = new BaseStyleAdapter(darkTheme);
      expect(customAdapter.theme).toEqual(darkTheme);
    });
  });

  describe('createStyles', () => {
    it('should handle empty or invalid input', () => {
      expect(adapter.createStyles(null)).toEqual({});
      expect(adapter.createStyles(undefined)).toEqual({});
      expect(adapter.createStyles('string')).toEqual({});
      expect(adapter.createStyles(123)).toEqual({});
    });

    it('should process simple style definitions', () => {
      const styles = adapter.createStyles({
        container: {
          padding: 16,
          backgroundColor: 'red',
        }
      });

      expect(styles).toEqual({
        container: {
          padding: 16,
          backgroundColor: 'red',
        }
      });
    });

    it('should resolve theme references', () => {
      const styles = adapter.createStyles({
        container: {
          padding: 'theme.spacing.md',
          backgroundColor: 'theme.colors.primary',
          borderRadius: 'theme.borderRadius.md',
        }
      });

      expect(styles.container.padding).toBe(defaultTheme.spacing.md);
      expect(styles.container.backgroundColor).toBe(defaultTheme.colors.primary);
      expect(styles.container.borderRadius).toBe(defaultTheme.borderRadius.md);
    });

    it('should handle nested theme references', () => {
      const styles = adapter.createStyles({
        text: {
          color: 'theme.colors.text.primary',
          fontSize: 'theme.typography.sizes.lg',
        }
      });

      expect(styles.text.color).toBe(defaultTheme.colors.text.primary);
      expect(styles.text.fontSize).toBe(defaultTheme.typography.sizes.lg);
    });

    it('should handle invalid theme references', () => {
      const styles = adapter.createStyles({
        container: {
          color: 'theme.invalid.path',
          backgroundColor: 'theme.colors.nonexistent',
        }
      });

      // Should return original value if theme path not found
      expect(styles.container.color).toBe('theme.invalid.path');
      expect(styles.container.backgroundColor).toBe('theme.colors.nonexistent');
    });

    it('should use custom theme when provided', () => {
      const customTheme = {
        ...defaultTheme,
        colors: {
          ...defaultTheme.colors,
          primary: '#custom-color',
        }
      };

      const styles = adapter.createStyles({
        container: {
          backgroundColor: 'theme.colors.primary',
        }
      }, customTheme);

      expect(styles.container.backgroundColor).toBe('#custom-color');
    });

    it('should handle mixed theme and non-theme values', () => {
      const styles = adapter.createStyles({
        container: {
          padding: 'theme.spacing.md',
          margin: 20,
          backgroundColor: 'theme.colors.primary',
          color: 'red',
        }
      });

      expect(styles.container.padding).toBe(defaultTheme.spacing.md);
      expect(styles.container.margin).toBe(20);
      expect(styles.container.backgroundColor).toBe(defaultTheme.colors.primary);
      expect(styles.container.color).toBe('red');
    });
  });

  describe('combineStyles', () => {
    it('should handle empty input', () => {
      expect(adapter.combineStyles()).toEqual({});
      expect(adapter.combineStyles(null as any, undefined as any)).toEqual({});
    });

    it('should combine multiple style objects', () => {
      const style1 = { padding: 16, color: 'red' };
      const style2 = { margin: 8, backgroundColor: 'blue' };
      const style3 = { borderRadius: 4 };

      const combined = adapter.combineStyles(style1, style2, style3);

      expect(combined).toEqual({
        padding: 16,
        color: 'red',
        margin: 8,
        backgroundColor: 'blue',
        borderRadius: 4,
      });
    });

    it('should handle overlapping properties (later wins)', () => {
      const style1 = { padding: 16, color: 'red' };
      const style2 = { padding: 24, backgroundColor: 'blue' };

      const combined = adapter.combineStyles(style1, style2);

      expect(combined).toEqual({
        padding: 24, // Later value wins
        color: 'red',
        backgroundColor: 'blue',
      });
    });

    it('should filter out null/undefined values', () => {
      const style1 = { padding: 16 };
      const style2 = null;
      const style3 = { margin: 8 };
      const style4 = undefined;

      const combined = adapter.combineStyles(style1, style2 as any, style3, style4 as any);

      expect(combined).toEqual({
        padding: 16,
        margin: 8,
      });
    });
  });

  describe('theme value resolution', () => {
    it('should handle deep theme paths', () => {
      const styles = adapter.createStyles({
        shadow: {
          boxShadow: 'theme.shadows.lg',
        }
      });

      expect(styles.shadow.boxShadow).toBe(defaultTheme.shadows.lg);
    });

    it('should handle theme paths that don\'t exist', () => {
      const styles = adapter.createStyles({
        container: {
          someProperty: 'theme.nonexistent.deeply.nested.path',
        }
      });

      expect(styles.container.someProperty).toBe('theme.nonexistent.deeply.nested.path');
    });

    it('should handle theme paths with null/undefined intermediate values', () => {
      const customTheme = {
        ...defaultTheme,
        custom: {
          nested: null,
        }
      };

      const customAdapter = new BaseStyleAdapter(customTheme);
      const styles = customAdapter.createStyles({
        container: {
          value: 'theme.custom.nested.property',
        }
      });

      expect(styles.container.value).toBe('theme.custom.nested.property');
    });
  });
});

describe('baseAdapter', () => {
  it('should be a pre-configured instance', () => {
    expect(baseAdapter).toBeInstanceOf(BaseStyleAdapter);
    expect(baseAdapter.name).toBe('base');
    expect(baseAdapter.theme).toEqual(defaultTheme);
  });
});

describe('createBaseAdapter', () => {
  it('should create adapter with custom theme', () => {
    const customAdapter = createBaseAdapter(darkTheme);
    
    expect(customAdapter).toBeInstanceOf(BaseStyleAdapter);
    expect(customAdapter.theme).toEqual(darkTheme);
    expect(customAdapter.name).toBe('base');
  });

  it('should create different instances', () => {
    const adapter1 = createBaseAdapter(defaultTheme);
    const adapter2 = createBaseAdapter(defaultTheme);
    
    expect(adapter1).not.toBe(adapter2);
    expect(adapter1.theme).toEqual(adapter2.theme);
  });
});
