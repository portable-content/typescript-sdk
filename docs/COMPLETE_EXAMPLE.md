# Complete Implementation Example

This guide provides a complete, working example of implementing a style adapter and renderer from scratch. Follow along to understand the entire process.

## Scenario: Building a CSS-in-JS Adapter and React Renderer

We'll build a complete system using styled-components as our styling system and React as our UI framework.

## Step 1: Implement the Style Adapter

```typescript
// src/adapters/styled-components-adapter.ts
import { StyleAdapter, Theme, defaultTheme } from '@portable-content/typescript-sdk';
import { css, FlattenSimpleInterpolation } from 'styled-components';

export class StyledComponentsAdapter implements StyleAdapter<FlattenSimpleInterpolation, Theme> {
  public readonly name = 'styled-components';
  public readonly version = '1.0.0';
  public theme: Theme;

  public readonly capabilities = {
    responsive: true,
    animations: true,
    variants: true,
    darkMode: true,
    customProperties: false,
  };

  constructor(theme: Theme = defaultTheme) {
    this.theme = theme;
  }

  createStyles(styleDefinition: any, theme?: Theme): FlattenSimpleInterpolation {
    const currentTheme = theme || this.theme;

    if (!styleDefinition || typeof styleDefinition !== 'object') {
      return css``;
    }

    // Convert style object to CSS template literal
    const cssRules = this.objectToCssRules(styleDefinition, currentTheme);
    return css`
      ${cssRules}
    `;
  }

  combineStyles(...styles: FlattenSimpleInterpolation[]): FlattenSimpleInterpolation {
    const validStyles = styles.filter(Boolean);
    return css`
      ${validStyles}
    `;
  }

  createResponsiveStyles(
    styleDefinition: any,
    breakpoints?: Record<string, any>
  ): FlattenSimpleInterpolation {
    const baseStyles = this.createStyles(styleDefinition);

    if (!breakpoints) {
      return baseStyles;
    }

    const responsiveRules = Object.entries(breakpoints)
      .map(([breakpoint, styles]) => {
        const breakpointValue = this.getBreakpointValue(breakpoint);
        const rules = this.objectToCssRules(styles, this.theme);
        return `
          @media (min-width: ${breakpointValue}) {
            ${rules}
          }
        `;
      })
      .join('\n');

    return css`
      ${baseStyles}
      ${responsiveRules}
    `;
  }

  createAnimatedStyles(styleDefinition: any): FlattenSimpleInterpolation {
    const baseStyles = this.createStyles(styleDefinition);

    // Add default transitions
    const transitions = css`
      transition: all 0.2s ease-in-out;
    `;

    return css`
      ${baseStyles}
      ${transitions}
    `;
  }

  createVariantStyles(variants: Record<string, any>): FlattenSimpleInterpolation {
    const variantRules = Object.entries(variants)
      .map(([variant, styles]) => {
        const rules = this.objectToCssRules(styles, this.theme);
        return `
          &:${variant} {
            ${rules}
          }
        `;
      })
      .join('\n');

    return css`
      ${variantRules}
    `;
  }

  onThemeChange(newTheme: Theme): void {
    this.theme = newTheme;
    // In a real implementation, you might trigger re-renders here
    console.log('Theme changed to:', newTheme);
  }

  // Helper methods
  private objectToCssRules(obj: Record<string, any>, theme: Theme): string {
    return Object.entries(obj)
      .map(([property, value]) => {
        const resolvedValue = this.resolveValue(value, theme);
        const cssProperty = this.camelToKebabCase(property);
        return `${cssProperty}: ${resolvedValue};`;
      })
      .join('\n');
  }

  private resolveValue(value: any, theme: Theme): any {
    if (typeof value === 'string' && value.startsWith('theme.')) {
      return this.getThemeValue(value.substring(6), theme) || value;
    }
    return value;
  }

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

  private camelToKebabCase(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private getBreakpointValue(breakpoint: string): string {
    const breakpoints = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    };
    return breakpoints[breakpoint] || '768px';
  }
}
```

## Step 2: Create the Style Provider

```typescript
// src/providers/StyleProvider.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { StyleAdapter } from '@portable-content/typescript-sdk';
import { ThemeProvider } from 'styled-components';

const StyleContext = createContext<StyleAdapter | null>(null);

interface StyleProviderProps {
  adapter: StyleAdapter;
  children: ReactNode;
}

export const StyleProvider: React.FC<StyleProviderProps> = ({ adapter, children }) => {
  useEffect(() => {
    adapter.onMount?.();
    return () => adapter.onUnmount?.();
  }, [adapter]);

  return (
    <StyleContext.Provider value={adapter}>
      <ThemeProvider theme={adapter.theme}>
        {children}
      </ThemeProvider>
    </StyleContext.Provider>
  );
};

export const useStyleAdapter = (): StyleAdapter => {
  const adapter = useContext(StyleContext);
  if (!adapter) {
    throw new Error('useStyleAdapter must be used within a StyleProvider');
  }
  return adapter;
};
```

## Step 3: Implement Block Renderers

```typescript
// src/renderers/MarkdownRenderer.tsx
import React from 'react';
import styled from 'styled-components';
import { BaseBlockRenderer } from '@portable-content/typescript-sdk';
import type { Block, RenderContext, RenderResult } from '@portable-content/typescript-sdk';
import { useStyleAdapter } from '../providers/StyleProvider';

// Styled components using the adapter
const Container = styled.div<{ $styles: any }>`
  ${props => props.$styles}
`;

const Content = styled.div<{ $styles: any }>`
  ${props => props.$styles}
`;

interface MarkdownRendererProps {
  block: Block;
  context: RenderContext;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  block,
  context,
  className
}) => {
  const styleAdapter = useStyleAdapter();

  // Create styles using the adapter
  const containerStyles = styleAdapter.createStyles({
    padding: 'theme.spacing.md',
    borderRadius: 'theme.borderRadius.md',
    backgroundColor: 'theme.colors.background.secondary',
    border: '1px solid theme.colors.border',
    marginBottom: 'theme.spacing.md',
  });

  const contentStyles = styleAdapter.createStyles({
    fontSize: 'theme.typography.sizes.md',
    lineHeight: 'theme.typography.lineHeights.normal',
    color: 'theme.colors.text.primary',
    '& h1': {
      fontSize: 'theme.typography.sizes.xl',
      fontWeight: 'theme.typography.weights.bold',
      marginBottom: 'theme.spacing.sm',
      color: 'theme.colors.text.primary',
    },
    '& h2': {
      fontSize: 'theme.typography.sizes.lg',
      fontWeight: 'theme.typography.weights.semibold',
      marginBottom: 'theme.spacing.sm',
      color: 'theme.colors.text.primary',
    },
    '& p': {
      marginBottom: 'theme.spacing.sm',
    },
    '& code': {
      backgroundColor: 'theme.colors.background.tertiary',
      padding: '2px 4px',
      borderRadius: 'theme.borderRadius.sm',
      fontSize: '0.9em',
    },
  });

  // Select best variant
  const variant = selectBestVariant(block.variants, context.capabilities);

  if (!variant) {
    return (
      <Container $styles={containerStyles} className={className}>
        <Content $styles={contentStyles}>
          No content available
        </Content>
      </Container>
    );
  }

  return (
    <Container $styles={containerStyles} className={className}>
      <Content
        $styles={contentStyles}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(variant.content) }}
      />
    </Container>
  );
};

// Helper function to select best variant
function selectBestVariant(variants: any[], capabilities: any) {
  // Implementation would use the SDK's variant selection logic
  return variants[0]; // Simplified for example
}

// Helper function to render markdown
function renderMarkdown(content: string): string {
  // Use your preferred markdown library
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
```

## Step 4: Create Additional Renderers

```typescript
// src/renderers/ImageRenderer.tsx
import React from 'react';
import styled from 'styled-components';
import { useStyleAdapter } from '../providers/StyleProvider';

const ImageContainer = styled.div<{ $styles: any }>`
  ${props => props.$styles}
`;

const Image = styled.img<{ $styles: any }>`
  ${props => props.$styles}
`;

const Caption = styled.p<{ $styles: any }>`
  ${props => props.$styles}
`;

export const ImageRenderer: React.FC<{ block: Block; context: RenderContext }> = ({
  block,
  context
}) => {
  const styleAdapter = useStyleAdapter();

  const containerStyles = styleAdapter.createStyles({
    marginBottom: 'theme.spacing.lg',
    textAlign: 'center',
  });

  const imageStyles = styleAdapter.createResponsiveStyles(
    {
      maxWidth: '100%',
      height: 'auto',
      borderRadius: 'theme.borderRadius.md',
      boxShadow: 'theme.shadows.md',
    },
    {
      md: {
        maxWidth: '80%',
      },
      lg: {
        maxWidth: '60%',
      }
    }
  );

  const captionStyles = styleAdapter.createStyles({
    marginTop: 'theme.spacing.sm',
    fontSize: 'theme.typography.sizes.sm',
    color: 'theme.colors.text.secondary',
    fontStyle: 'italic',
  });

  const variant = selectBestVariant(block.variants, context.capabilities);

  if (!variant) {
    return null;
  }

  return (
    <ImageContainer $styles={containerStyles}>
      <Image
        $styles={imageStyles}
        src={variant.uri}
        alt={block.payload?.alt || 'Image'}
      />
      {block.payload?.caption && (
        <Caption $styles={captionStyles}>
          {block.payload.caption}
        </Caption>
      )}
    </ImageContainer>
  );
};
```

## Step 5: Set Up the Complete Application

```typescript
// src/App.tsx
import React, { useState } from 'react';
import {
  defaultTheme,
  darkTheme,
  validateStyleAdapter,
  registerAdapter
} from '@portable-content/typescript-sdk';
import { StyledComponentsAdapter } from './adapters/styled-components-adapter';
import { StyleProvider } from './providers/StyleProvider';
import { MarkdownRenderer } from './renderers/MarkdownRenderer';
import { ImageRenderer } from './renderers/ImageRenderer';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [adapter, setAdapter] = useState(() => {
    const newAdapter = new StyledComponentsAdapter(defaultTheme);

    // Validate the adapter
    const validation = validateStyleAdapter(newAdapter);
    if (!validation.valid) {
      console.error('Adapter validation failed:', validation.errors);
    }

    // Register the adapter
    registerAdapter(newAdapter);

    return newAdapter;
  });

  const toggleTheme = () => {
    const newTheme = isDark ? defaultTheme : darkTheme;
    const newAdapter = new StyledComponentsAdapter(newTheme);

    // Notify of theme change
    adapter.onThemeChange?.(newTheme);

    setAdapter(newAdapter);
    setIsDark(!isDark);
  };

  // Mock content for demonstration
  const mockContent = {
    blocks: [
      {
        kind: 'markdown',
        variants: [
          {
            mediaType: 'text/markdown',
            content: '# Hello World\n\nThis is a **markdown** example with `code`.',
          }
        ]
      },
      {
        kind: 'image',
        variants: [
          {
            mediaType: 'image/jpeg',
            uri: 'https://example.com/image.jpg',
          }
        ],
        payload: {
          alt: 'Example image',
          caption: 'This is an example image'
        }
      }
    ]
  };

  const mockContext = {
    capabilities: {
      acceptTypes: ['text/html', 'text/markdown', 'image/*'],
      screen: { width: 1024, height: 768 },
      network: 'FAST'
    }
  };

  return (
    <StyleProvider adapter={adapter}>
      <div style={{ padding: '20px' }}>
        <button onClick={toggleTheme}>
          Switch to {isDark ? 'Light' : 'Dark'} Theme
        </button>

        {mockContent.blocks.map((block, index) => {
          switch (block.kind) {
            case 'markdown':
              return (
                <MarkdownRenderer
                  key={index}
                  block={block}
                  context={mockContext}
                />
              );
            case 'image':
              return (
                <ImageRenderer
                  key={index}
                  block={block}
                  context={mockContext}
                />
              );
            default:
              return <div key={index}>Unknown block type: {block.kind}</div>;
          }
        })}
      </div>
    </StyleProvider>
  );
}

export default App;
```

## Step 6: Add Tests

```typescript
// src/__tests__/StyledComponentsAdapter.test.ts
import { validateStyleAdapter, testStyleAdapter } from '@portable-content/typescript-sdk';
import { StyledComponentsAdapter } from '../adapters/styled-components-adapter';

describe('StyledComponentsAdapter', () => {
  let adapter: StyledComponentsAdapter;

  beforeEach(() => {
    adapter = new StyledComponentsAdapter();
  });

  it('should pass validation', () => {
    const result = validateStyleAdapter(adapter);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should pass functional tests', async () => {
    const result = await testStyleAdapter(adapter);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should create styles correctly', () => {
    const styles = adapter.createStyles({
      container: {
        padding: 16,
        backgroundColor: 'theme.colors.primary',
      },
    });

    expect(styles).toBeDefined();
    // Test that theme references are resolved
    expect(styles.toString()).toContain('#007AFF'); // default primary color
  });

  it('should handle responsive styles', () => {
    const styles = adapter.createResponsiveStyles({ padding: 16 }, { md: { padding: 24 } });

    expect(styles.toString()).toContain('@media');
    expect(styles.toString()).toContain('768px');
  });
});
```

This complete example demonstrates:

1. **Full adapter implementation** with all features
2. **React integration** with styled-components
3. **Multiple renderer types** (markdown, image)
4. **Theme switching** functionality
5. **Validation and testing** integration
6. **Real-world patterns** and best practices

You can adapt this pattern to any styling system and UI framework by changing the adapter implementation and renderer components while keeping the same overall structure.
