/**
 * @fileoverview React Native Mermaid Block Renderer
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { BaseBlockRenderer } from '../../rendering/base-renderers';
import type { Block, Capabilities } from '../../types';
import type { RenderContext, RenderResult } from '../../rendering/interfaces';
import type { RenderingContent } from '../../rendering/content-resolution';

/**
 * Props for the React Native Mermaid component
 */
export interface MermaidProps {
  /** The block to render */
  block: Block;
  /** Rendering capabilities */
  capabilities: Capabilities;
  /** Custom styles */
  styles?: MermaidStyles;
  /** Loading component */
  LoadingComponent?: React.ComponentType;
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Callback when content is loaded */
  onContentLoaded?: (content: RenderingContent) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Theme for the diagram */
  theme?: 'light' | 'dark';
}

/**
 * Styling interface for mermaid components
 */
export interface MermaidStyles {
  container?: object;
  diagramContainer?: object;
  node?: object;
  connection?: object;
  text?: object;
  title?: object;
  metadata?: object;
  error?: object;
  loading?: object;
}

/**
 * Internal state for the mermaid renderer
 */
interface MermaidState {
  content: RenderingContent | null;
  loading: boolean;
  error: Error | null;
  parsedDiagram: ParsedDiagram | null;
}

/**
 * Parsed diagram structure for React Native rendering
 */
interface ParsedDiagram {
  type: string;
  title?: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  metadata: {
    nodeCount: number;
    connectionCount: number;
  };
}

interface DiagramNode {
  id: string;
  label: string;
  type: 'rect' | 'circle' | 'diamond' | 'rounded';
  x: number;
  y: number;
}

interface DiagramConnection {
  from: string;
  to: string;
  label?: string;
  type: 'solid' | 'dashed' | 'dotted';
}

/**
 * Backend mermaid renderer that uses RenderingContent
 */
class ReactNativeMermaidRenderer extends BaseBlockRenderer<MermaidProps, React.ReactElement> {
  readonly kind = 'mermaid';
  readonly priority = 1;

  async render(
    block: Block,
    props: MermaidProps,
    context: RenderContext
  ): Promise<RenderResult<React.ReactElement>> {
    // This method is used by the backend renderer registry
    // For React Native, we'll use the component directly
    const content = await this.resolveRenderingContent(block, context);
    
    return {
      content: React.createElement(MermaidComponent, { 
        ...props, 
        block, 
        capabilities: context.capabilities 
      }),
      payloadSource: content.source
    };
  }
}

/**
 * React Native Mermaid Component
 */
export const MermaidComponent: React.FC<MermaidProps> = ({
  block,
  capabilities,
  styles = {},
  LoadingComponent,
  ErrorComponent,
  onContentLoaded,
  onError,
  theme = 'light'
}) => {
  const [state, setState] = useState<MermaidState>({
    content: null,
    loading: true,
    error: null,
    parsedDiagram: null
  });

  // Create renderer instance
  const renderer = React.useMemo(() => new ReactNativeMermaidRenderer(), []);

  // Load content function
  const loadContent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const content = await renderer.resolveRenderingContent(block, { capabilities });
      const mermaidText = content.data as string;
      const parsedDiagram = parseMermaidSyntax(mermaidText);
      
      setState({
        content,
        loading: false,
        error: null,
        parsedDiagram
      });
      
      onContentLoaded?.(content);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({
        content: null,
        loading: false,
        error: err,
        parsedDiagram: null
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
        <Text style={defaultStyles.loadingText}>Loading diagram...</Text>
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
          Failed to load diagram: {state.error.message}
        </Text>
        <Text style={defaultStyles.retryText} onPress={retry}>
          Tap to retry
        </Text>
      </View>
    );
  }

  // Render mermaid diagram
  if (state.parsedDiagram) {
    return (
      <View style={[defaultStyles.container, styles.container]}>
        <MermaidDiagramRenderer 
          diagram={state.parsedDiagram} 
          styles={styles}
          theme={theme}
        />
      </View>
    );
  }

  return null;
};

/**
 * React Native diagram renderer component
 */
const MermaidDiagramRenderer: React.FC<{ 
  diagram: ParsedDiagram; 
  styles: MermaidStyles;
  theme: 'light' | 'dark';
}> = ({ diagram, styles, theme }) => {
  const themeStyles = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ScrollView style={[defaultStyles.diagramContainer, styles.diagramContainer]}>
      {/* Title */}
      {diagram.title && (
        <Text style={[defaultStyles.title, themeStyles.title, styles.title]}>
          {diagram.title}
        </Text>
      )}

      {/* Diagram type indicator */}
      <View style={defaultStyles.typeIndicator}>
        <Text style={[defaultStyles.typeText, themeStyles.typeText]}>
          {diagram.type.toUpperCase()} DIAGRAM
        </Text>
      </View>

      {/* Nodes */}
      <View style={defaultStyles.nodesContainer}>
        {diagram.nodes.map((node, index) => (
          <View key={node.id} style={[
            defaultStyles.node, 
            themeStyles.node,
            styles.node,
            getNodeStyle(node.type, theme)
          ]}>
            <Text style={[defaultStyles.nodeText, themeStyles.nodeText, styles.text]}>
              {node.label}
            </Text>
            <Text style={defaultStyles.nodeId}>#{node.id}</Text>
          </View>
        ))}
      </View>

      {/* Connections */}
      {diagram.connections.length > 0 && (
        <View style={defaultStyles.connectionsContainer}>
          <Text style={[defaultStyles.sectionTitle, themeStyles.sectionTitle]}>
            Connections
          </Text>
          {diagram.connections.map((conn, index) => (
            <View key={index} style={[defaultStyles.connection, styles.connection]}>
              <Text style={[defaultStyles.connectionText, themeStyles.connectionText]}>
                {conn.from} → {conn.to}
                {conn.label && ` (${conn.label})`}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Metadata */}
      <View style={[defaultStyles.metadata, styles.metadata]}>
        <Text style={[defaultStyles.metadataText, themeStyles.metadataText]}>
          Nodes: {diagram.metadata.nodeCount} | Connections: {diagram.metadata.connectionCount}
        </Text>
      </View>
    </ScrollView>
  );
};

/**
 * Simple Mermaid parser for React Native rendering
 */
function parseMermaidSyntax(mermaidText: string): ParsedDiagram {
  const lines = mermaidText.trim().split('\n').map(line => line.trim()).filter(Boolean);
  
  if (lines.length === 0) {
    throw new Error('Empty Mermaid diagram');
  }

  const firstLine = lines[0];
  let diagramType = 'unknown';
  
  // Detect diagram type
  if (firstLine.startsWith('graph')) diagramType = 'flowchart';
  else if (firstLine.startsWith('flowchart')) diagramType = 'flowchart';
  else if (firstLine.startsWith('sequenceDiagram')) diagramType = 'sequence';
  else if (firstLine.startsWith('classDiagram')) diagramType = 'class';

  const nodes: DiagramNode[] = [];
  const connections: DiagramConnection[] = [];
  let nodeCounter = 0;

  // Simple parsing (this is very basic - real implementation would be more robust)
  lines.slice(1).forEach(line => {
    // Parse connections like "A --> B" or "A[Label] --> B[Label]"
    const connectionMatch = line.match(/(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (connectionMatch) {
      const [, fromId, fromLabel, toId, toLabel] = connectionMatch;
      
      // Add nodes if not exists
      if (!nodes.find(n => n.id === fromId)) {
        nodes.push({
          id: fromId,
          label: fromLabel || fromId,
          type: 'rect',
          x: nodeCounter * 100,
          y: Math.floor(nodeCounter / 3) * 80
        });
        nodeCounter++;
      }
      
      if (!nodes.find(n => n.id === toId)) {
        nodes.push({
          id: toId,
          label: toLabel || toId,
          type: 'rect',
          x: nodeCounter * 100,
          y: Math.floor(nodeCounter / 3) * 80
        });
        nodeCounter++;
      }

      connections.push({
        from: fromId,
        to: toId,
        type: 'solid'
      });
    }
  });

  return {
    type: diagramType,
    nodes,
    connections,
    metadata: {
      nodeCount: nodes.length,
      connectionCount: connections.length
    }
  };
}

/**
 * Get node style based on type and theme
 */
function getNodeStyle(type: DiagramNode['type'], theme: 'light' | 'dark') {
  const baseStyle = theme === 'dark' ? darkTheme.nodeBase : lightTheme.nodeBase;
  
  switch (type) {
    case 'circle':
      return { ...baseStyle, borderRadius: 25 };
    case 'diamond':
      return { ...baseStyle, transform: [{ rotate: '45deg' }] };
    case 'rounded':
      return { ...baseStyle, borderRadius: 12 };
    default:
      return baseStyle;
  }
}

/**
 * Default styles
 */
const defaultStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  diagramContainer: {
    flex: 1,
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  typeIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  nodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  node: {
    margin: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 6,
  },
  nodeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  nodeId: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  connectionsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  connection: {
    padding: 8,
    marginVertical: 2,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  metadata: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 12,
    color: '#666',
  },
});

/**
 * Light theme styles
 */
const lightTheme = {
  title: { color: '#000' },
  typeText: { color: '#666' },
  nodeBase: { backgroundColor: '#e3f2fd', borderColor: '#1976d2' },
  nodeText: { color: '#000' },
  sectionTitle: { color: '#000' },
  connectionText: { color: '#333' },
  metadataText: { color: '#666' },
};

/**
 * Dark theme styles
 */
const darkTheme = {
  title: { color: '#fff' },
  typeText: { color: '#ccc' },
  nodeBase: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' },
  nodeText: { color: '#fff' },
  sectionTitle: { color: '#fff' },
  connectionText: { color: '#ccc' },
  metadataText: { color: '#999' },
};

// Export the renderer for use in renderer registry
export const mermaidRenderer = new ReactNativeMermaidRenderer();
