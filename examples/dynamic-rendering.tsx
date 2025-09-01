/**
 * @fileoverview Example of Dynamic Block Rendering with RenderingContent
 */

import React, { useState, useCallback } from 'react';
import { MermaidComponent } from '../src/renderers/web/MermaidComponent';
import { MarkdownComponent } from '../src/renderers/react-native/MarkdownRenderer';
import type { Block, Capabilities } from '../src/types';
import type { RenderingContent } from '../src/rendering/content-resolution';

/**
 * Example app demonstrating dynamic block rendering
 */
export const DynamicRenderingExample: React.FC = () => {
  // Sample blocks with different content types
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: 'mermaid-1',
      kind: 'mermaid',
      content: {
        primary: {
          type: 'inline',
          mediaType: 'text/mermaid',
          source: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`
        }
      }
    },
    {
      id: 'markdown-1',
      kind: 'markdown',
      content: {
        primary: {
          type: 'inline',
          mediaType: 'text/markdown',
          source: `# Dynamic Content Example

This is a **markdown block** that can be *dynamically updated*.

## Features
- Real-time content updates
- Automatic re-rendering
- Error handling
- Loading states

\`\`\`javascript
const example = "code block";
\`\`\``
        }
      }
    },
    {
      id: 'mermaid-external',
      kind: 'mermaid',
      content: {
        primary: {
          type: 'external',
          mediaType: 'text/mermaid',
          uri: 'https://example.com/diagram.mmd'
        },
        alternatives: [
          {
            type: 'inline',
            mediaType: 'text/mermaid',
            source: `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hello Alice!`
          }
        ]
      }
    }
  ]);

  // Client capabilities
  const [capabilities] = useState<Capabilities>({
    accept: ['text/mermaid', 'text/markdown', 'text/plain']
  });

  // Update a block's content
  const updateBlockContent = useCallback((blockId: string, newContent: string) => {
    setBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          content: {
            ...block.content,
            primary: {
              ...block.content.primary,
              source: newContent
            }
          }
        };
      }
      return block;
    }));
  }, []);

  // Add a new block
  const addBlock = useCallback((type: 'mermaid' | 'markdown') => {
    const newBlock: Block = {
      id: `${type}-${Date.now()}`,
      kind: type,
      content: {
        primary: {
          type: 'inline',
          mediaType: type === 'mermaid' ? 'text/mermaid' : 'text/markdown',
          source: type === 'mermaid' 
            ? 'graph LR\n    A --> B\n    B --> C'
            : '# New Block\n\nThis is a new block!'
        }
      }
    };

    setBlocks(prev => [...prev, newBlock]);
  }, []);

  // Remove a block
  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  }, []);

  // Content loaded callback
  const handleContentLoaded = useCallback((blockId: string, content: RenderingContent) => {
    console.log(`Content loaded for ${blockId}:`, {
      mediaType: content.mediaType,
      size: content.metadata?.size,
      fromCache: content.metadata?.fromCache,
      loadDuration: content.metadata?.loadDuration
    });
  }, []);

  // Error callback
  const handleError = useCallback((blockId: string, error: Error) => {
    console.error(`Error in block ${blockId}:`, error);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Dynamic Block Rendering Example</h1>
      
      {/* Controls */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Controls</h3>
        <button 
          onClick={() => addBlock('mermaid')}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Add Mermaid Block
        </button>
        <button 
          onClick={() => addBlock('markdown')}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Add Markdown Block
        </button>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Total blocks: {blocks.length}
        </div>
      </div>

      {/* Render blocks */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {blocks.map(block => (
          <div key={block.id} style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            overflow: 'hidden' 
          }}>
            {/* Block header */}
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{block.kind}</strong> - {block.id}
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Source: {block.content.primary.type} | 
                  Type: {block.content.primary.mediaType}
                </div>
              </div>
              <button 
                onClick={() => removeBlock(block.id)}
                style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#dc3545', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px' 
                }}
              >
                Remove
              </button>
            </div>

            {/* Block content */}
            <div style={{ padding: '16px' }}>
              {block.kind === 'mermaid' ? (
                <MermaidComponent
                  block={block}
                  capabilities={capabilities}
                  config={{
                    theme: 'default',
                    width: 600,
                    height: 400,
                    interactive: true
                  }}
                  onContentLoaded={(content) => handleContentLoaded(block.id, content)}
                  onError={(error) => handleError(block.id, error)}
                  autoResize={true}
                />
              ) : (
                <MarkdownComponent
                  block={block}
                  capabilities={capabilities}
                  onContentLoaded={(content) => handleContentLoaded(block.id, content)}
                  onError={(error) => handleError(block.id, error)}
                />
              )}
            </div>

            {/* Content editor */}
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderTop: '1px solid #ddd' 
            }}>
              <details>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                  Edit Content
                </summary>
                <textarea
                  value={block.content.primary.source || ''}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  style={{
                    width: '100%',
                    height: '120px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                  placeholder={`Enter ${block.kind} content...`}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Changes will automatically trigger re-rendering
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      {blocks.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          No blocks yet. Add some blocks using the controls above!
        </div>
      )}

      {/* Info panel */}
      <div style={{ 
        marginTop: '40px', 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px' 
      }}>
        <h3>How it Works</h3>
        <ul>
          <li><strong>Dynamic Updates:</strong> Edit content in the text areas to see real-time updates</li>
          <li><strong>RenderingContent:</strong> Content is automatically resolved from PayloadSource</li>
          <li><strong>Caching:</strong> Content is cached for performance (check console for cache hits)</li>
          <li><strong>Error Handling:</strong> Invalid content shows error states with retry options</li>
          <li><strong>Loading States:</strong> Async content loading shows loading indicators</li>
          <li><strong>Multiple Sources:</strong> External content falls back to alternatives</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Simpler example focusing on a single Mermaid diagram with live editing
 */
export const LiveMermaidEditor: React.FC = () => {
  const [mermaidContent, setMermaidContent] = useState(`graph TD
    A[User Input] --> B{Valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Show Error]
    C --> E[Success]
    D --> A`);

  const block: Block = {
    id: 'live-editor',
    kind: 'mermaid',
    content: {
      primary: {
        type: 'inline',
        mediaType: 'text/mermaid',
        source: mermaidContent
      }
    }
  };

  const capabilities: Capabilities = {
    accept: ['text/mermaid']
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2>Live Mermaid Editor</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Editor */}
        <div>
          <h3>Mermaid Source</h3>
          <textarea
            value={mermaidContent}
            onChange={(e) => setMermaidContent(e.target.value)}
            style={{
              width: '100%',
              height: '300px',
              fontFamily: 'monospace',
              fontSize: '14px',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        {/* Preview */}
        <div>
          <h3>Live Preview</h3>
          <MermaidComponent
            block={block}
            capabilities={capabilities}
            config={{
              theme: 'default',
              width: 400,
              height: 300
            }}
            style={{
              border: '1px solid #ccc',
              borderRadius: '4px',
              minHeight: '300px'
            }}
          />
        </div>
      </div>
    </div>
  );
};
