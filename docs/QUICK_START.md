# Quick Start Guide

Get up and running with the Portable Content SDK styling system in minutes.

## Installation

```bash
npm install @portable-content/typescript-sdk
```

## Basic Setup

### 1. Choose Your Approach

**Option A: Use Built-in Base Adapter (Simple)**

```typescript
import { BaseStyleAdapter, defaultTheme } from '@portable-content/typescript-sdk';

const adapter = new BaseStyleAdapter(defaultTheme);
```

**Option B: Create Custom Adapter (Recommended)**

```typescript
import { StyleAdapter, Theme } from '@portable-content/typescript-sdk';

class MyAdapter implements StyleAdapter {
  name = 'my-adapter';
  theme = defaultTheme;
  capabilities = { responsive: true, darkMode: true };

  createStyles(styles: any) {
    // Convert to your styling system
    return convertStyles(styles, this.theme);
  }

  combineStyles(...styles: any[]) {
    // Merge styles for your system
    return mergeStyles(styles);
  }
}
```

### 2. Set Up Provider (React Example)

```typescript
import React from 'react';
import { StyleProvider } from './StyleProvider'; // See Integration Guide

function App() {
  const adapter = new MyAdapter();

  return (
    <StyleProvider adapter={adapter}>
      <YourContent />
    </StyleProvider>
  );
}
```

### 3. Create Renderers

```typescript
import { useStyleAdapter } from './StyleProvider';

const MarkdownRenderer = ({ block, context }) => {
  const adapter = useStyleAdapter();

  const styles = adapter.createStyles({
    container: {
      padding: 'theme.spacing.md',
      backgroundColor: 'theme.colors.background.primary',
    }
  });

  return (
    <div style={styles.container}>
      {renderContent(block)}
    </div>
  );
};
```

## Common Patterns

### Theme Switching

```typescript
const [theme, setTheme] = useState(defaultTheme);
const adapter = new MyAdapter(theme);

const toggleTheme = () => {
  const newTheme = theme === defaultTheme ? darkTheme : defaultTheme;
  adapter.onThemeChange?.(newTheme);
  setTheme(newTheme);
};
```

### Responsive Styles

```typescript
const styles =
  adapter.createResponsiveStyles?.({ padding: 16 }, { md: { padding: 24 }, lg: { padding: 32 } }) ||
  adapter.createStyles({ padding: 16 });
```

### Capability Detection

```typescript
import { hasCapability } from '@portable-content/typescript-sdk';

if (hasCapability(adapter, 'animations')) {
  const animatedStyles = adapter.createAnimatedStyles?.(styleDefinition);
}
```

## Validation

Always validate your adapters:

```typescript
import { validateStyleAdapter, testStyleAdapter } from '@portable-content/typescript-sdk';

// Validate interface compliance
const validation = validateStyleAdapter(adapter);
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
}

// Test functionality
const testResult = await testStyleAdapter(adapter);
if (!testResult.valid) {
  console.error('Tests failed:', testResult.errors);
}
```

## Next Steps

1. **Read the guides**: Check out the detailed guides in `/docs`
2. **See examples**: Look at `COMPLETE_EXAMPLE.md` for a full implementation
3. **Build your adapter**: Follow `ADAPTER_IMPLEMENTATION_GUIDE.md`
4. **Integrate with renderers**: Use `INTEGRATION_GUIDE.md` for patterns

## Common Styling Systems

### CSS-in-JS (styled-components, emotion)

```typescript
createStyles(styles) {
  return css`${this.objectToCss(styles)}`;
}
```

### Utility Frameworks (Tailwind, NativeWind)

```typescript
createStyles(styles) {
  return this.convertToUtilityClasses(styles);
}
```

### Native Styling (React Native)

```typescript
createStyles(styles) {
  return StyleSheet.create(styles);
}
```

### Component Libraries (Material-UI, Chakra)

```typescript
createStyles(styles) {
  return this.convertToThemeProps(styles);
}
```

## Troubleshooting

**Adapter not found**: Make sure to register your adapter

```typescript
import { registerAdapter } from '@portable-content/typescript-sdk';
registerAdapter(myAdapter);
```

**Theme values not resolving**: Use correct theme reference format

```typescript
// Correct
backgroundColor: 'theme.colors.primary';

// Incorrect
backgroundColor: theme.colors.primary;
```

**Styles not applying**: Check adapter output format matches your system

```typescript
// For CSS classes
return 'my-class-name';

// For style objects
return { backgroundColor: 'red' };
```

This quick start gets you up and running. For detailed implementation guidance, see the comprehensive guides in the `/docs` folder.
