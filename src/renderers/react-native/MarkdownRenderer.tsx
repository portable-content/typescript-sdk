/**
 * @fileoverview React Native Markdown Block Renderer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BaseBlockRenderer } from '../../rendering/base-renderers';
import type { Block, Capabilities } from '../../types';
import type { RenderContext, RenderResult } from '../../rendering/interfaces';
import type { RenderingContent } from '../../rendering/content-resolution';

/**
 * Props for the React Native Markdown component
 */
export interface MarkdownProps {
  /** The block to render */
  block: Block;
  /** Rendering capabilities */
  capabilities: Capabilities;
  /** Custom styles */
  styles?: MarkdownStyles;
  /** Loading component */
  LoadingComponent?: React.ComponentType;
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Callback when content is loaded */
  onContentLoaded?: (content: RenderingContent) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Styling interface for markdown components
 */
export interface MarkdownStyles {
  container?: object;
  heading1?: object;
  heading2?: object;
  heading3?: object;
  paragraph?: object;
  bold?: object;
  italic?: object;
  code?: object;
  codeBlock?: object;
  link?: object;
  list?: object;
  listItem?: object;
  blockquote?: object;
  error?: object;
  loading?: object;
}

/**
 * Internal state for the markdown renderer
 */
interface MarkdownState {
  content: RenderingContent | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Backend markdown renderer that uses RenderingContent
 */
class ReactNativeMarkdownRenderer extends BaseBlockRenderer<MarkdownProps, React.ReactElement> {
  readonly kind = 'markdown';
  readonly priority = 1;

  async render(
    block: Block,
    props: MarkdownProps,
    context: RenderContext
  ): Promise<RenderResult<React.ReactElement>> {
    // This method is used by the backend renderer registry
    // For React Native, we'll use the component directly
    const content = await this.resolveRenderingContent(block, context);
    
    return {
      content: React.createElement(MarkdownComponent, { 
        ...props, 
        block, 
        capabilities: context.capabilities 
      }),
      payloadSource: content.source
    };
  }
}

/**
 * React Native Markdown Component
 */
export const MarkdownComponent: React.FC<MarkdownProps> = ({
  block,
  capabilities,
  styles = {},
  LoadingComponent,
  ErrorComponent,
  onContentLoaded,
  onError
}) => {
  const [state, setState] = useState<MarkdownState>({
    content: null,
    loading: true,
    error: null
  });

  // Create renderer instance
  const renderer = React.useMemo(() => new ReactNativeMarkdownRenderer(), []);

  // Load content function
  const loadContent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const content = await renderer.resolveRenderingContent(block, { capabilities });
      
      setState({
        content,
        loading: false,
        error: null
      });
      
      onContentLoaded?.(content);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({
        content: null,
        loading: false,
        error: err
      });
      
      onError?.(err);
    }
  }, [block, capabilities, renderer, onContentLoaded, onError]);

  // Load content on mount and when block changes
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Retry function for error state
  const retry = useCallback(() => {
    loadContent();
  }, [loadContent]);

  // Render loading state
  if (state.loading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    
    return (
      <View style={[defaultStyles.loading, styles.loading]}>
        <ActivityIndicator size="small" />
        <Text style={defaultStyles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  // Render error state
  if (state.error) {
    if (ErrorComponent) {
      return <ErrorComponent error={state.error} retry={retry} />;
    }
    
    return (
      <View style={[defaultStyles.error, styles.error]}>
        <Text style={defaultStyles.errorText}>
          Failed to load content: {state.error.message}
        </Text>
        <Text style={defaultStyles.retryText} onPress={retry}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Render markdown content
  if (state.content) {
    const markdownText = state.content.data as string;
    return (
      <View style={[defaultStyles.container, styles.container]}>
        <MarkdownRenderer 
          content={markdownText} 
          styles={styles}
        />
      </View>
    );
  }

  return null;
};

/**
 * Simple markdown renderer component
 * In a real implementation, you'd use a library like react-native-markdown-display
 */
const MarkdownRenderer: React.FC<{ content: string; styles: MarkdownStyles }> = ({ 
  content, 
  styles 
}) => {
  // This is a simplified markdown parser for demonstration
  // In production, use a proper markdown library
  const lines = content.split('\n');
  
  return (
    <View>
      {lines.map((line, index) => {
        // Heading 1
        if (line.startsWith('# ')) {
          return (
            <Text key={index} style={[defaultStyles.heading1, styles.heading1]}>
              {line.substring(2)}
            </Text>
          );
        }
        
        // Heading 2
        if (line.startsWith('## ')) {
          return (
            <Text key={index} style={[defaultStyles.heading2, styles.heading2]}>
              {line.substring(3)}
            </Text>
          );
        }
        
        // Heading 3
        if (line.startsWith('### ')) {
          return (
            <Text key={index} style={[defaultStyles.heading3, styles.heading3]}>
              {line.substring(4)}
            </Text>
          );
        }
        
        // Code block
        if (line.startsWith('```')) {
          return null; // Handle code blocks separately
        }
        
        // Empty line
        if (line.trim() === '') {
          return <View key={index} style={{ height: 10 }} />;
        }
        
        // Regular paragraph
        return (
          <Text key={index} style={[defaultStyles.paragraph, styles.paragraph]}>
            {parseInlineMarkdown(line, styles)}
          </Text>
        );
      })}
    </View>
  );
};

/**
 * Parse inline markdown (bold, italic, code)
 */
const parseInlineMarkdown = (text: string, styles: MarkdownStyles) => {
  // This is a very basic implementation
  // In production, use a proper markdown parser
  const parts = [];
  let currentText = text;
  let key = 0;
  
  // Handle bold text **text**
  currentText = currentText.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    parts.push(
      <Text key={key++} style={[defaultStyles.bold, styles.bold]}>
        {content}
      </Text>
    );
    return `__BOLD_${key - 1}__`;
  });
  
  // Handle italic text *text*
  currentText = currentText.replace(/\*(.*?)\*/g, (match, content) => {
    parts.push(
      <Text key={key++} style={[defaultStyles.italic, styles.italic]}>
        {content}
      </Text>
    );
    return `__ITALIC_${key - 1}__`;
  });
  
  // Handle inline code `code`
  currentText = currentText.replace(/`(.*?)`/g, (match, content) => {
    parts.push(
      <Text key={key++} style={[defaultStyles.code, styles.code]}>
        {content}
      </Text>
    );
    return `__CODE_${key - 1}__`;
  });
  
  // Replace placeholders with components
  const finalParts = [];
  const textParts = currentText.split(/(__\w+_\d+__)/);
  
  textParts.forEach((part, index) => {
    if (part.startsWith('__') && part.endsWith('__')) {
      const partIndex = parseInt(part.match(/_(\d+)__$/)?.[1] || '0');
      finalParts.push(parts[partIndex]);
    } else if (part) {
      finalParts.push(part);
    }
  });
  
  return finalParts.length > 0 ? finalParts : text;
};

/**
 * Default styles for markdown components
 */
const defaultStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  error: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    margin: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 8,
  },
  retryText: {
    fontSize: 14,
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});

// Export the renderer for use in renderer registry
export const markdownRenderer = new ReactNativeMarkdownRenderer();
