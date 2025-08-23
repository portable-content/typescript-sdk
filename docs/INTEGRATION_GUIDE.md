# Renderer and Adapter Integration Guide

This guide shows how to integrate style adapters with renderers to create a complete rendering system for any UI framework.

## Architecture Overview

The integration follows a three-layer architecture:

1. **SDK Layer**: Provides StyleAdapter interface and theme system
2. **Renderer Layer**: Framework-specific components that use adapters
3. **Adapter Layer**: Styling system implementations

## Integration Patterns

### Pattern 1: Provider-Based Integration

Most UI frameworks benefit from a provider pattern that makes the style adapter available throughout the component tree.

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { StyleAdapter, Theme } from '@portable-content/typescript-sdk';

// Create context for the style adapter
const StyleContext = createContext<StyleAdapter | null>(null);

// Provider component
interface StyleProviderProps {
  adapter: StyleAdapter;
  children: ReactNode;
}

export const StyleProvider: React.FC<StyleProviderProps> = ({ adapter, children }) => {
  // Initialize adapter lifecycle
  React.useEffect(() => {
    adapter.onMount?.();
    return () => adapter.onUnmount?.();
  }, [adapter]);

  return (
    <StyleContext.Provider value={adapter}>
      {children}
    </StyleContext.Provider>
  );
};

// Hook to access the adapter
export const useStyleAdapter = (): StyleAdapter => {
  const adapter = useContext(StyleContext);
  if (!adapter) {
    throw new Error('useStyleAdapter must be used within a StyleProvider');
  }
  return adapter;
};
```

### Pattern 2: Direct Integration

For simpler cases or non-React frameworks, pass the adapter directly to renderers:

```typescript
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';
import type { StyleAdapter } from '@portable-content/typescript-sdk';

export class MyRenderer extends BaseBlockRenderer {
  constructor(private styleAdapter: StyleAdapter) {
    super();
  }

  async render(block: Block, props: any, context: RenderContext) {
    // Use the adapter to create styles
    const styles = this.styleAdapter.createStyles({
      container: {
        padding: 'theme.spacing.md',
        backgroundColor: 'theme.colors.background.primary',
      },
      text: {
        fontSize: 'theme.typography.sizes.md',
        color: 'theme.colors.text.primary',
      },
    });

    // Render with your framework using the styles
    return {
      content: this.renderWithFramework(block, styles, props),
      variant: this.selectVariant(block, context),
    };
  }
}
```

## Framework-Specific Integration Examples

### React Integration

```typescript
import React from 'react';
import { Block, RenderContext } from '@portable-content/typescript-sdk';

interface BlockRendererProps {
  block: Block;
  context: RenderContext;
}

export const MarkdownRenderer: React.FC<BlockRendererProps> = ({ block, context }) => {
  const styleAdapter = useStyleAdapter();

  // Create styles using the adapter
  const styles = styleAdapter.createStyles({
    container: {
      padding: 'theme.spacing.md',
      borderRadius: 'theme.borderRadius.md',
      backgroundColor: 'theme.colors.background.secondary',
    },
    content: {
      fontSize: 'theme.typography.sizes.md',
      lineHeight: 'theme.typography.lineHeights.normal',
      color: 'theme.colors.text.primary',
    }
  });

  // Select best variant
  const variant = selectBestVariant(block.variants, context.capabilities);

  if (!variant) {
    return <div>No content available</div>;
  }

  // Render based on adapter output type
  if (typeof styles.container === 'string') {
    // CSS class-based styling
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          {renderMarkdown(variant.content)}
        </div>
      </div>
    );
  } else {
    // Object-based styling (React Native, CSS-in-JS)
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {renderMarkdown(variant.content)}
        </div>
      </div>
    );
  }
};
```

### Vue Integration

```typescript
import { defineComponent, inject } from 'vue';
import type { StyleAdapter, Block, RenderContext } from '@portable-content/typescript-sdk';

export const MarkdownRenderer = defineComponent({
  props: {
    block: { type: Object as PropType<Block>, required: true },
    context: { type: Object as PropType<RenderContext>, required: true },
  },

  setup(props) {
    const styleAdapter = inject<StyleAdapter>('styleAdapter');

    if (!styleAdapter) {
      throw new Error('StyleAdapter not provided');
    }

    const styles = styleAdapter.createStyles({
      container: {
        padding: 'theme.spacing.md',
        backgroundColor: 'theme.colors.background.primary',
      },
    });

    return { styles };
  },

  render() {
    const variant = selectBestVariant(this.block.variants, this.context.capabilities);

    if (!variant) {
      return h('div', 'No content available');
    }

    return h(
      'div',
      {
        class: typeof this.styles.container === 'string' ? this.styles.container : undefined,
        style: typeof this.styles.container === 'object' ? this.styles.container : undefined,
      },
      [renderMarkdown(variant.content)]
    );
  },
});
```

### React Native Integration

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { Block, RenderContext } from '@portable-content/typescript-sdk';

interface Props {
  block: Block;
  context: RenderContext;
}

export const MarkdownRenderer: React.FC<Props> = ({ block, context }) => {
  const styleAdapter = useStyleAdapter();

  const styles = styleAdapter.createStyles({
    container: {
      padding: 'theme.spacing.md',
      backgroundColor: 'theme.colors.background.primary',
      borderRadius: 'theme.borderRadius.md',
    },
    text: {
      fontSize: 'theme.typography.sizes.md',
      color: 'theme.colors.text.primary',
      lineHeight: 'theme.typography.lineHeights.normal',
    }
  });

  const variant = selectBestVariant(block.variants, context.capabilities);

  if (!variant) {
    return <Text>No content available</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {variant.content}
      </Text>
    </View>
  );
};
```

## Advanced Integration Patterns

### Theme Switching

```typescript
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [adapter, setAdapter] = useState<StyleAdapter>();

  useEffect(() => {
    const theme = isDark ? darkTheme : defaultTheme;
    const newAdapter = new MyStyleAdapter(theme);

    // Notify adapter of theme change
    adapter?.onThemeChange?.(theme);

    setAdapter(newAdapter);
  }, [isDark]);

  return (
    <StyleProvider adapter={adapter}>
      <ThemeToggle onToggle={setIsDark} />
      {children}
    </StyleProvider>
  );
};
```

### Responsive Rendering

```typescript
export const ResponsiveRenderer: React.FC<Props> = ({ block, context }) => {
  const styleAdapter = useStyleAdapter();

  // Check if adapter supports responsive features
  if (hasCapability(styleAdapter, 'responsive')) {
    const responsiveStyles = styleAdapter.createResponsiveStyles?.(
      {
        container: {
          padding: 'theme.spacing.sm',
        }
      },
      {
        md: {
          container: {
            padding: 'theme.spacing.lg',
          }
        }
      }
    );

    return <div className={responsiveStyles}>Content</div>;
  }

  // Fallback to basic styles
  const styles = styleAdapter.createStyles({
    container: { padding: 'theme.spacing.md' }
  });

  return <div className={styles.container}>Content</div>;
};
```

### Multi-Adapter Support

```typescript
interface MultiStyleProviderProps {
  adapters: Record<string, StyleAdapter>;
  defaultAdapter: string;
  children: ReactNode;
}

export const MultiStyleProvider: React.FC<MultiStyleProviderProps> = ({
  adapters,
  defaultAdapter,
  children
}) => {
  const [currentAdapter, setCurrentAdapter] = useState(defaultAdapter);

  const switchAdapter = (adapterName: string) => {
    if (adapters[adapterName]) {
      adapters[currentAdapter]?.onUnmount?.();
      adapters[adapterName]?.onMount?.();
      setCurrentAdapter(adapterName);
    }
  };

  return (
    <StyleProvider adapter={adapters[currentAdapter]}>
      <AdapterSwitcher onSwitch={switchAdapter} />
      {children}
    </StyleProvider>
  );
};
```

## Testing Integration

```typescript
import { render } from '@testing-library/react';
import { createMockAdapter } from '@portable-content/typescript-sdk';

describe('Renderer Integration', () => {
  it('should render with style adapter', () => {
    const mockAdapter = createMockAdapter('test');
    const mockBlock = createMockBlock();
    const mockContext = createMockContext();

    const { container } = render(
      <StyleProvider adapter={mockAdapter}>
        <MarkdownRenderer block={mockBlock} context={mockContext} />
      </StyleProvider>
    );

    expect(container.firstChild).toHaveClass('test-container');
  });

  it('should handle theme changes', () => {
    const mockAdapter = createMockAdapter('test');
    const spy = jest.spyOn(mockAdapter, 'onThemeChange');

    render(
      <StyleProvider adapter={mockAdapter}>
        <ThemeToggle />
      </StyleProvider>
    );

    // Trigger theme change
    fireEvent.click(screen.getByText('Toggle Theme'));

    expect(spy).toHaveBeenCalledWith(expect.any(Object));
  });
});
```

## Best Practices

1. **Validate Adapters**: Always validate adapters before using them in production
2. **Handle Capabilities**: Check adapter capabilities before using advanced features
3. **Error Boundaries**: Wrap renderers in error boundaries to handle adapter failures
4. **Performance**: Cache style results when possible to avoid re-computation
5. **Testing**: Test with multiple adapters to ensure renderer flexibility
6. **Documentation**: Document which adapter features your renderers require

This integration approach ensures your renderers work with any style adapter while maintaining type safety and performance.
