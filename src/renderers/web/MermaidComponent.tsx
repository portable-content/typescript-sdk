/**
 * @fileoverview React Component for Mermaid SVG Rendering with Dynamic Updates
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MermaidRenderer, type MermaidConfig, type MermaidProps, type MermaidRenderResult } from './MermaidRenderer';
import type { Block, Capabilities } from '../../types';
import type { RenderingContent } from '../../rendering/content-resolution';

/**
 * Props for the React Mermaid component
 */
export interface MermaidComponentProps {
  /** The block containing Mermaid content */
  block: Block;
  /** Rendering capabilities */
  capabilities: Capabilities;
  /** Mermaid configuration */
  config?: MermaidConfig;
  /** Custom styles for the container */
  className?: string;
  /** Custom styles object */
  style?: React.CSSProperties;
  /** Loading component */
  LoadingComponent?: React.ComponentType;
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Callback when diagram is rendered */
  onRender?: (result: MermaidRenderResult) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Callback when content is loaded */
  onContentLoaded?: (content: RenderingContent) => void;
  /** Whether to enable pan/zoom interactions */
  interactive?: boolean;
  /** Whether to auto-resize based on content */
  autoResize?: boolean;
}

/**
 * Internal state for the Mermaid component
 */
interface MermaidState {
  result: MermaidRenderResult | null;
  loading: boolean;
  error: Error | null;
  lastBlockId: string | null;
}

/**
 * React component for rendering Mermaid diagrams with dynamic updates
 */
export const MermaidComponent: React.FC<MermaidComponentProps> = ({
  block,
  capabilities,
  config,
  className,
  style,
  LoadingComponent,
  ErrorComponent,
  onRender,
  onError,
  onContentLoaded,
  interactive = false,
  autoResize = true
}) => {
  const [state, setState] = useState<MermaidState>({
    result: null,
    loading: true,
    error: null,
    lastBlockId: null
  });

  const rendererRef = useRef<MermaidRenderer>(new MermaidRenderer());
  const containerRef = useRef<HTMLDivElement>(null);

  // Render function
  const renderMermaid = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const renderer = rendererRef.current;
      const renderContext = { capabilities };
      const props: MermaidProps = { config };

      // Use the renderer to get the SVG result
      const renderResult = await renderer.render(block, props, renderContext);
      const result = renderResult.content;

      setState({
        result,
        loading: false,
        error: null,
        lastBlockId: block.id
      });

      onRender?.(result);

      // Get the content for the callback
      try {
        const content = await renderer.resolveRenderingContent(block, renderContext);
        onContentLoaded?.(content);
      } catch (contentError) {
        // Content loading error doesn't affect rendering if we got SVG
        console.warn('Failed to load content for callback:', contentError);
      }

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({
        result: null,
        loading: false,
        error: err,
        lastBlockId: block.id
      });

      onError?.(err);
    }
  }, [block, capabilities, config, onRender, onError, onContentLoaded]);

  // Re-render when block changes
  useEffect(() => {
    if (state.lastBlockId !== block.id) {
      renderMermaid();
    }
  }, [block.id, renderMermaid, state.lastBlockId]);

  // Initial render
  useEffect(() => {
    renderMermaid();
  }, [renderMermaid]);

  // Retry function for error state
  const retry = useCallback(() => {
    renderMermaid();
  }, [renderMermaid]);

  // Handle SVG interactions
  const handleSVGLoad = useCallback(() => {
    if (interactive && containerRef.current) {
      // Add pan/zoom functionality (simplified implementation)
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svg.style.cursor = 'grab';
        // In a real implementation, you'd add proper pan/zoom handlers
      }
    }
  }, [interactive]);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && state.result && containerRef.current) {
      const container = containerRef.current;
      const svg = container.querySelector('svg');
      
      if (svg) {
        // Simple auto-resize logic
        const containerWidth = container.clientWidth;
        if (containerWidth > 0) {
          const scale = Math.min(1, containerWidth / (config?.width || 800));
          svg.style.transform = `scale(${scale})`;
          svg.style.transformOrigin = 'top left';
        }
      }
    }
  }, [state.result, autoResize, config?.width]);

  // Render loading state
  if (state.loading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }

    return (
      <div className={`mermaid-loading ${className || ''}`} style={style}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>Loading Mermaid diagram...</div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Rendering {block.id}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error) {
    if (ErrorComponent) {
      return <ErrorComponent error={state.error} retry={retry} />;
    }

    return (
      <div className={`mermaid-error ${className || ''}`} style={style}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #f44336',
          borderRadius: '4px'
        }}>
          <div style={{ color: '#c62828', fontWeight: 'bold', marginBottom: '8px' }}>
            Mermaid Render Error
          </div>
          <div style={{ color: '#666', marginBottom: '12px' }}>
            {state.error.message}
          </div>
          <button 
            onClick={retry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render SVG content
  if (state.result) {
    return (
      <div 
        ref={containerRef}
        className={`mermaid-container ${className || ''}`} 
        style={style}
        onLoad={handleSVGLoad}
      >
        <div 
          dangerouslySetInnerHTML={{ __html: state.result.svg }}
          style={{ 
            width: '100%', 
            overflow: autoResize ? 'hidden' : 'auto'
          }}
        />
        
        {/* Metadata display (optional) */}
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Type: {state.result.metadata.diagramType}</span>
          <span>Elements: {state.result.metadata.elementCount}</span>
          <span>Render: {state.result.metadata.renderTime}ms</span>
          {state.result.metadata.fromCache && <span>📋 Cached</span>}
        </div>
      </div>
    );
  }

  return null;
};

/**
 * Hook for using Mermaid rendering in custom components
 */
export function useMermaidRenderer(
  block: Block,
  capabilities: Capabilities,
  config?: MermaidConfig
) {
  const [state, setState] = useState<{
    result: MermaidRenderResult | null;
    loading: boolean;
    error: Error | null;
  }>({
    result: null,
    loading: true,
    error: null
  });

  const rendererRef = useRef<MermaidRenderer>(new MermaidRenderer());

  const render = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const renderer = rendererRef.current;
      const renderResult = await renderer.render(
        block, 
        { config }, 
        { capabilities }
      );

      setState({
        result: renderResult.content,
        loading: false,
        error: null
      });

    } catch (error) {
      setState({
        result: null,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error')
      });
    }
  }, [block, capabilities, config]);

  useEffect(() => {
    render();
  }, [render]);

  return {
    ...state,
    retry: render
  };
}

/**
 * Utility component for displaying Mermaid validation errors
 */
export const MermaidValidationError: React.FC<{ 
  errors: string[]; 
  onDismiss?: () => void;
}> = ({ errors, onDismiss }) => (
  <div style={{
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    padding: '12px',
    margin: '8px 0'
  }}>
    <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '8px' }}>
      Mermaid Syntax Issues:
    </div>
    <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
      {errors.map((error, index) => (
        <li key={index}>{error}</li>
      ))}
    </ul>
    {onDismiss && (
      <button 
        onClick={onDismiss}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          backgroundColor: 'transparent',
          border: '1px solid #856404',
          borderRadius: '2px',
          color: '#856404',
          cursor: 'pointer'
        }}
      >
        Dismiss
      </button>
    )}
  </div>
);
