# Style Adapter Implementation Guide

This guide walks you through implementing a custom style adapter for any styling system. Whether you're working with CSS-in-JS, utility frameworks, or native styling systems, this guide provides the patterns and examples you need.

## Overview

A style adapter bridges the gap between the universal Portable Content styling system and your specific styling implementation. It translates generic style definitions into your styling system's format.

## Step-by-Step Implementation

### Step 1: Understand Your Styling System

Before implementing, identify your styling system's characteristics:

**CSS-in-JS Systems** (styled-components, emotion, etc.)

- Input: JavaScript objects
- Output: CSS classes or styled components
- Features: Dynamic theming, runtime styles

**Utility Frameworks** (Tailwind, NativeWind, etc.)

- Input: Utility class names
- Output: Combined class strings
- Features: Compile-time optimization, responsive utilities

**Native Styling** (React Native StyleSheet, etc.)

- Input: JavaScript objects
- Output: Style objects or IDs
- Features: Platform-specific optimizations

**Component Libraries** (Material-UI, Chakra, etc.)

- Input: Theme tokens and props
- Output: Component props or theme overrides
- Features: Design system integration

### Step 2: Define Your Adapter Structure

```typescript
import { StyleAdapter, Theme, defaultTheme } from '@portable-content/typescript-sdk';

// Define what your adapter returns
type MyStyleOutput = string | object | number; // Adjust based on your system

export class MyStyleAdapter implements StyleAdapter<MyStyleOutput, Theme> {
  public readonly name = 'my-adapter';
  public readonly version = '1.0.0';
  public theme: Theme;

  // Define what your styling system supports
  public readonly capabilities = {
    responsive: true, // Can handle breakpoints/media queries
    animations: false, // Can handle transitions/animations
    variants: true, // Can handle hover/focus/active states
    darkMode: true, // Can handle theme switching
    customProperties: false, // Can handle CSS custom properties
  };

  constructor(theme: Theme = defaultTheme) {
    this.theme = theme;
  }

  // Core methods - implement these based on your styling system
  createStyles(styleDefinition: any, theme?: Theme): MyStyleOutput {
    // Implementation goes here
  }

  combineStyles(...styles: MyStyleOutput[]): MyStyleOutput {
    // Implementation goes here
  }

  // Optional: Implement if your system supports these features
  createResponsiveStyles?(styleDefinition: any, breakpoints?: any): MyStyleOutput;
  createAnimatedStyles?(styleDefinition: any): MyStyleOutput;
  createVariantStyles?(variants: Record<string, any>): MyStyleOutput;

  // Optional: Lifecycle hooks for setup/cleanup
  onMount?(): void;
  onUnmount?(): void;
  onThemeChange?(newTheme: Theme): void;
}
```

### Step 3: Implement Core Methods

#### createStyles Method

This is the heart of your adapter. It converts generic style definitions to your system's format:

```typescript
createStyles(styleDefinition: any, theme?: Theme): MyStyleOutput {
  const currentTheme = theme || this.theme;

  if (!styleDefinition || typeof styleDefinition !== 'object') {
    return this.getEmptyStyle(); // Return appropriate empty value
  }

  // Process each style rule
  const processedStyles = {};

  for (const [selector, styles] of Object.entries(styleDefinition)) {
    if (styles && typeof styles === 'object') {
      processedStyles[selector] = this.processStyleRule(
        styles as Record<string, any>,
        currentTheme
      );
    }
  }

  return this.formatOutput(processedStyles);
}

private processStyleRule(styles: Record<string, any>, theme: Theme): any {
  const processed = {};

  for (const [property, value] of Object.entries(styles)) {
    // Handle theme references
    if (typeof value === 'string' && value.startsWith('theme.')) {
      processed[property] = this.resolveThemeValue(value, theme);
    } else {
      processed[property] = this.transformValue(property, value);
    }
  }

  return processed;
}
```

#### combineStyles Method

Merge multiple style outputs:

```typescript
combineStyles(...styles: MyStyleOutput[]): MyStyleOutput {
  // Filter out null/undefined values
  const validStyles = styles.filter(Boolean);

  if (validStyles.length === 0) {
    return this.getEmptyStyle();
  }

  // Implementation depends on your output format:

  // For string-based systems (CSS classes):
  if (typeof validStyles[0] === 'string') {
    return validStyles.join(' ');
  }

  // For object-based systems:
  if (typeof validStyles[0] === 'object') {
    return Object.assign({}, ...validStyles);
  }

  // For other systems, implement appropriate merging logic
  return validStyles[validStyles.length - 1];
}
```

### Step 4: Handle Theme Integration

```typescript
private resolveThemeValue(themeRef: string, theme: Theme): any {
  // Remove 'theme.' prefix
  const path = themeRef.substring(6);

  // Navigate theme object using dot notation
  const parts = path.split('.');
  let current: any = theme;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Theme value not found: ${themeRef}`);
      return themeRef; // Return original if not found
    }
  }

  return current;
}

private transformValue(property: string, value: any): any {
  // Transform values based on your styling system's requirements

  // Example: Convert numeric spacing to appropriate units
  if (this.isSpacingProperty(property) && typeof value === 'number') {
    return this.formatSpacing(value);
  }

  // Example: Convert color values
  if (this.isColorProperty(property) && typeof value === 'string') {
    return this.formatColor(value);
  }

  return value;
}
```

### Step 5: Add System-Specific Features

#### For Responsive Systems:

```typescript
createResponsiveStyles(styleDefinition: any, breakpoints?: any): MyStyleOutput {
  const baseStyles = this.createStyles(styleDefinition);

  if (!breakpoints || !this.capabilities.responsive) {
    return baseStyles;
  }

  // Process breakpoint-specific styles
  const responsiveStyles = {};

  for (const [breakpoint, styles] of Object.entries(breakpoints)) {
    responsiveStyles[`@media (min-width: ${this.getBreakpointValue(breakpoint)})`] =
      this.createStyles(styles);
  }

  return this.combineStyles(baseStyles, responsiveStyles);
}
```

#### For Animation Systems:

```typescript
createAnimatedStyles(styleDefinition: any): MyStyleOutput {
  if (!this.capabilities.animations) {
    return this.createStyles(styleDefinition);
  }

  // Add animation-specific processing
  const styles = this.createStyles(styleDefinition);

  // Example: Add transition properties
  return this.addTransitions(styles);
}
```

### Step 6: Implement Lifecycle Hooks

```typescript
onMount(): void {
  // Initialize your styling system
  // Example: Inject CSS, register themes, etc.
  console.log(`${this.name} adapter mounted`);
}

onUnmount(): void {
  // Cleanup resources
  // Example: Remove injected CSS, unregister listeners, etc.
  console.log(`${this.name} adapter unmounted`);
}

onThemeChange(newTheme: Theme): void {
  this.theme = newTheme;

  // Handle theme changes in your system
  // Example: Update CSS variables, re-render components, etc.
  this.updateSystemTheme(newTheme);
}
```

## Common Implementation Patterns

### Pattern 1: CSS-in-JS Adapter

```typescript
import { css } from 'styled-components';

export class StyledComponentsAdapter implements StyleAdapter<string, Theme> {
  createStyles(styleDefinition: any): string {
    return css`
      ${this.objectToCss(styleDefinition)}
    `;
  }

  private objectToCss(obj: Record<string, any>): string {
    return Object.entries(obj)
      .map(([key, value]) => `${this.camelToKebab(key)}: ${value};`)
      .join('\n');
  }
}
```

### Pattern 2: Utility Framework Adapter

```typescript
export class TailwindAdapter implements StyleAdapter<string, Theme> {
  createStyles(styleDefinition: any): string {
    const classes: string[] = [];

    for (const [selector, styles] of Object.entries(styleDefinition)) {
      classes.push(...this.stylesToUtilities(styles));
    }

    return classes.join(' ');
  }

  private stylesToUtilities(styles: Record<string, any>): string[] {
    // Convert CSS properties to Tailwind classes
    // Example: { padding: 16 } -> ['p-4']
  }
}
```

### Pattern 3: Native Styling Adapter

```typescript
import { StyleSheet } from 'react-native';

export class ReactNativeAdapter implements StyleAdapter<any, Theme> {
  createStyles(styleDefinition: any): any {
    return StyleSheet.create(styleDefinition);
  }

  combineStyles(...styles: any[]): any {
    return StyleSheet.flatten(styles);
  }
}
```

## Next Steps

1. **Implement your adapter** following the patterns above
2. **Validate your implementation** using the SDK's validation tools
3. **Test thoroughly** with various style definitions
4. **Register your adapter** with the adapter registry
5. **Use in renderers** by passing to StyleProvider or similar

See the [Integration Guide](./INTEGRATION_GUIDE.md) for connecting your adapter to renderers.
