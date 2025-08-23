# Styling System

The Portable Content SDK v0.2.0 introduces a comprehensive styling system that enables framework-agnostic styling with support for multiple styling approaches.

## Overview

The styling system provides:

- **Universal Theme System** - Consistent design tokens across all styling approaches
- **Style Adapter Pattern** - Clean interface for different styling systems
- **Registry System** - Dynamic registration and discovery of styling adapters
- **Validation & Testing** - Comprehensive validation and testing utilities
- **Type Safety** - Full TypeScript support with strict typing

## Core Concepts

### Theme

A theme defines the design tokens used throughout your application:

```typescript
import { Theme, defaultTheme, darkTheme } from '@portable-content/typescript-sdk';

// Use built-in themes
const theme = defaultTheme;

// Or create custom themes
const customTheme: Theme = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    // ... more colors
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
    sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32 },
    weights: { normal: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
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
    // ... more shadows
  },
};
```

### Style Adapter

A style adapter implements the `StyleAdapter` interface to work with specific styling systems:

```typescript
import { StyleAdapter, Theme } from '@portable-content/typescript-sdk';

interface StyleAdapter<TStyle = any, TTheme = Theme> {
  name: string;
  version?: string;
  theme: TTheme;

  // Core methods
  createStyles: (styleDefinition: any, theme?: TTheme) => TStyle;
  combineStyles: (...styles: TStyle[]) => TStyle;

  // Optional advanced features
  createResponsiveStyles?: (styleDefinition: any, breakpoints?: any) => TStyle;
  createAnimatedStyles?: (styleDefinition: any) => TStyle;
  createVariantStyles?: (variants: Record<string, any>) => TStyle;

  // Lifecycle hooks
  onMount?: () => void;
  onUnmount?: () => void;
  onThemeChange?: (newTheme: TTheme) => void;

  // Capabilities metadata
  capabilities?: {
    responsive?: boolean;
    animations?: boolean;
    variants?: boolean;
    darkMode?: boolean;
    customProperties?: boolean;
  };
}
```

## Built-in Adapters

### Base Adapter

A simple object-based adapter for basic styling:

```typescript
import { BaseStyleAdapter, defaultTheme } from '@portable-content/typescript-sdk';

const adapter = new BaseStyleAdapter(defaultTheme);

const styles = adapter.createStyles({
  container: {
    backgroundColor: 'theme.colors.background.primary',
    padding: 16,
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
    color: 'theme.colors.text.primary',
  },
});

// Theme references are automatically resolved
console.log(styles.container.backgroundColor); // '#FFFFFF'
```

### Mock Adapter

A testing adapter that simulates different styling system behaviors:

```typescript
import { createMockAdapter } from '@portable-content/typescript-sdk';

const mockAdapter = createMockAdapter('test-adapter', customTheme);

// Supports all capabilities for testing
console.log(mockAdapter.capabilities);
// { responsive: true, animations: true, variants: true, darkMode: true, customProperties: true }

const styles = mockAdapter.createStyles({ container: { padding: 16 } });
console.log(styles); // 'test-adapter-container'
```

## Registry System

Register and manage styling adapters dynamically:

```typescript
import {
  registerAdapter,
  getAdapter,
  hasAdapter,
  getAllAdapters,
} from '@portable-content/typescript-sdk';

// Register adapters
registerAdapter(baseAdapter);
registerAdapter(mockAdapter);

// Retrieve adapters
const adapter = getAdapter('base');
if (adapter) {
  const styles = adapter.createStyles(styleDefinition);
}

// Check if adapter exists
if (hasAdapter('my-custom-adapter')) {
  // Use the adapter
}

// Get all registered adapters
const allAdapters = getAllAdapters();
```

## Theme Utilities

### Merging Themes

```typescript
import { mergeThemes, defaultTheme } from '@portable-content/typescript-sdk';

const customTheme = mergeThemes(defaultTheme, {
  colors: {
    primary: '#ff6b6b',
    text: {
      primary: '#2c3e50',
    },
  },
  spacing: {
    md: 20,
  },
});
```

### Theme Variants

```typescript
import { createThemeVariant } from '@portable-content/typescript-sdk';

const brandTheme = createThemeVariant(defaultTheme, {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
});
```

### Theme Value Access

```typescript
import {
  getThemeColor,
  getThemeSpacing,
  getThemeTypography,
} from '@portable-content/typescript-sdk';

const primaryColor = getThemeColor(theme, 'primary');
const textColor = getThemeColor(theme, 'text.primary');
const mediumSpacing = getThemeSpacing(theme, 'md');
const largeFontSize = getThemeTypography(theme, 'lg');
```

## Validation & Testing

### Adapter Validation

```typescript
import { validateStyleAdapter, testStyleAdapter } from '@portable-content/typescript-sdk';

// Validate adapter interface
const validation = validateStyleAdapter(myAdapter);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  console.warn('Validation warnings:', validation.warnings);
}

// Test adapter functionality
const testResult = await testStyleAdapter(myAdapter);
if (!testResult.valid) {
  console.error('Test failures:', testResult.errors);
}
```

### Capability Detection

```typescript
import { hasCapability, getSupportedCapabilities } from '@portable-content/typescript-sdk';

// Check specific capability
if (hasCapability(adapter, 'responsive')) {
  // Use responsive features
}

// Get all supported capabilities
const capabilities = getSupportedCapabilities(adapter);
console.log('Supported capabilities:', capabilities);
```

## Creating Custom Adapters

Here's how to create a custom adapter for a specific styling system:

```typescript
import { StyleAdapter, Theme, defaultTheme } from '@portable-content/typescript-sdk';

class MyCustomAdapter implements StyleAdapter<string, Theme> {
  public readonly name = 'my-custom';
  public readonly version = '1.0.0';
  public theme: Theme;

  public readonly capabilities = {
    responsive: true,
    animations: false,
    variants: true,
    darkMode: true,
    customProperties: false,
  };

  constructor(theme: Theme = defaultTheme) {
    this.theme = theme;
  }

  createStyles(styleDefinition: any, theme?: Theme): string {
    const currentTheme = theme || this.theme;

    // Convert style definition to your styling system format
    // Return appropriate style representation (classes, objects, etc.)

    return 'my-custom-styles';
  }

  combineStyles(...styles: string[]): string {
    return styles.filter(Boolean).join(' ');
  }

  onThemeChange(newTheme: Theme): void {
    this.theme = newTheme;
    // Handle theme changes
  }
}

// Register your custom adapter
const customAdapter = new MyCustomAdapter();
registerAdapter(customAdapter);
```

## Best Practices

1. **Use Theme References**: Reference theme values using dot notation (`'theme.colors.primary'`) for automatic resolution
2. **Validate Adapters**: Always validate custom adapters before using them in production
3. **Test Thoroughly**: Use the testing utilities to ensure adapter reliability
4. **Handle Capabilities**: Check adapter capabilities before using advanced features
5. **Lifecycle Management**: Implement lifecycle hooks for complex adapters that need setup/cleanup
6. **Type Safety**: Leverage TypeScript types for better development experience

## Testing

The styling system includes comprehensive tests located in `tests/unit/styling/`:

- `adapter-registry.test.ts` - Registry system tests
- `validation.test.ts` - Adapter validation and testing utilities
- `theme-utils.test.ts` - Theme manipulation and utility functions

Run styling tests specifically:

```bash
npm test -- --testPathPattern=styling
```

## Examples

See the [styling system demo](../examples/styling-system-demo.ts) for a comprehensive example of all features.
