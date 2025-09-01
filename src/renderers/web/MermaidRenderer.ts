/**
 * @fileoverview Mermaid SVG Block Renderer
 */

import { BaseBlockRenderer } from '../../rendering/base-renderers';
import type { Block } from '../../types';
import type { RenderContext, RenderResult } from '../../rendering/interfaces';
import type { RenderingContent } from '../../rendering/content-resolution';

/**
 * Configuration options for Mermaid rendering
 */
export interface MermaidConfig {
  /** Theme for the diagram */
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  /** Background color */
  backgroundColor?: string;
  /** Width of the output SVG */
  width?: number;
  /** Height of the output SVG */
  height?: number;
  /** Font family for text elements */
  fontFamily?: string;
  /** Font size for text elements */
  fontSize?: number;
  /** Whether to include pan/zoom controls */
  interactive?: boolean;
  /** Custom CSS styles to inject */
  customCSS?: string;
}

/**
 * Props for Mermaid rendering
 */
export interface MermaidProps {
  /** Mermaid configuration */
  config?: MermaidConfig;
  /** Custom error message renderer */
  errorRenderer?: (error: Error) => string;
  /** Custom loading message */
  loadingMessage?: string;
}

/**
 * Result of Mermaid SVG rendering
 */
export interface MermaidRenderResult {
  /** Generated SVG content */
  svg: string;
  /** Diagram metadata */
  metadata: {
    /** Detected diagram type */
    diagramType: string;
    /** Number of nodes/elements */
    elementCount: number;
    /** Rendering time in milliseconds */
    renderTime: number;
    /** Whether diagram was cached */
    fromCache: boolean;
  };
}

/**
 * Mermaid block renderer that converts Mermaid syntax to SVG
 */
export class MermaidRenderer extends BaseBlockRenderer<MermaidProps, MermaidRenderResult> {
  readonly kind = 'mermaid';
  readonly priority = 1;

  private static readonly DEFAULT_CONFIG: MermaidConfig = {
    theme: 'default',
    backgroundColor: 'white',
    width: 800,
    height: 600,
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    interactive: false
  };

  async render(
    block: Block,
    props: MermaidProps = {},
    context: RenderContext
  ): Promise<RenderResult<MermaidRenderResult>> {
    const startTime = Date.now();

    try {
      // Resolve the content using RenderingContent architecture
      const content = await this.resolveRenderingContent(block, context);
      
      // Validate that we have Mermaid content
      if (!this.isMermaidContent(content)) {
        throw new Error(`Invalid content type for Mermaid renderer: ${content.mediaType}`);
      }

      // Get the Mermaid syntax
      const mermaidSyntax = content.data as string;
      
      // Parse and render to SVG
      const result = await this.renderMermaidToSVG(mermaidSyntax, props.config);
      
      // Add timing metadata
      result.metadata.renderTime = Date.now() - startTime;
      result.metadata.fromCache = content.metadata?.fromCache || false;

      return {
        content: result,
        payloadSource: content.source
      };

    } catch (error) {
      // Return error SVG
      const errorSvg = this.renderErrorSVG(
        error instanceof Error ? error : new Error('Unknown error'),
        props
      );

      return {
        content: {
          svg: errorSvg,
          metadata: {
            diagramType: 'error',
            elementCount: 0,
            renderTime: Date.now() - startTime,
            fromCache: false
          }
        },
        payloadSource: null
      };
    }
  }

  /**
   * Check if content is valid for Mermaid rendering
   */
  private isMermaidContent(content: RenderingContent): boolean {
    return (
      content.mediaType === 'text/mermaid' ||
      content.mediaType === 'application/mermaid' ||
      content.mediaType === 'text/plain' // Allow plain text that might contain Mermaid
    );
  }

  /**
   * Render Mermaid syntax to SVG
   */
  private async renderMermaidToSVG(
    syntax: string,
    config: MermaidConfig = {}
  ): Promise<MermaidRenderResult> {
    const finalConfig = { ...MermaidRenderer.DEFAULT_CONFIG, ...config };
    
    // Detect diagram type
    const diagramType = this.detectDiagramType(syntax);
    
    // Count elements (simplified)
    const elementCount = this.countElements(syntax);
    
    // Generate SVG (this is a simplified implementation)
    // In a real implementation, you'd use the Mermaid library
    const svg = this.generateSVG(syntax, diagramType, finalConfig);

    return {
      svg,
      metadata: {
        diagramType,
        elementCount,
        renderTime: 0, // Will be set by caller
        fromCache: false // Will be set by caller
      }
    };
  }

  /**
   * Detect the type of Mermaid diagram
   */
  private detectDiagramType(syntax: string): string {
    const trimmed = syntax.trim();
    
    if (trimmed.startsWith('graph')) return 'flowchart';
    if (trimmed.startsWith('flowchart')) return 'flowchart';
    if (trimmed.startsWith('sequenceDiagram')) return 'sequence';
    if (trimmed.startsWith('classDiagram')) return 'class';
    if (trimmed.startsWith('stateDiagram')) return 'state';
    if (trimmed.startsWith('erDiagram')) return 'er';
    if (trimmed.startsWith('gantt')) return 'gantt';
    if (trimmed.startsWith('pie')) return 'pie';
    if (trimmed.startsWith('journey')) return 'journey';
    if (trimmed.startsWith('gitgraph')) return 'gitgraph';
    
    return 'unknown';
  }

  /**
   * Count elements in the diagram (simplified)
   */
  private countElements(syntax: string): number {
    // Simple heuristic: count lines that look like nodes or connections
    const lines = syntax.split('\n').filter(line => line.trim());
    return lines.filter(line => 
      line.includes('-->') || 
      line.includes('---') || 
      line.includes('[') || 
      line.includes('(') ||
      line.includes('{')
    ).length;
  }

  /**
   * Generate SVG from Mermaid syntax (simplified implementation)
   */
  private generateSVG(syntax: string, diagramType: string, config: MermaidConfig): string {
    // This is a very simplified SVG generation for demonstration
    // In a real implementation, you'd use the actual Mermaid library
    
    const { width, height, backgroundColor, fontFamily, fontSize, theme } = config;
    
    // Create basic SVG structure
    const svgHeader = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    const background = `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
    
    // Add basic content based on diagram type
    let content = '';
    
    switch (diagramType) {
      case 'flowchart':
        content = this.generateFlowchartSVG(syntax, config);
        break;
      case 'sequence':
        content = this.generateSequenceSVG(syntax, config);
        break;
      default:
        content = this.generateGenericSVG(syntax, config);
    }
    
    const svgFooter = '</svg>';
    
    return `${svgHeader}${background}${content}${svgFooter}`;
  }

  /**
   * Generate flowchart SVG (simplified)
   */
  private generateFlowchartSVG(syntax: string, config: MermaidConfig): string {
    return `
      <g transform="translate(50, 50)">
        <rect x="0" y="0" width="100" height="50" fill="#e1f5fe" stroke="#01579b" rx="5"/>
        <text x="50" y="30" text-anchor="middle" font-family="${config.fontFamily}" font-size="${config.fontSize}">
          Flowchart
        </text>
        <text x="50" y="80" text-anchor="middle" font-family="${config.fontFamily}" font-size="12" fill="#666">
          ${this.countElements(syntax)} elements
        </text>
      </g>
    `;
  }

  /**
   * Generate sequence diagram SVG (simplified)
   */
  private generateSequenceSVG(syntax: string, config: MermaidConfig): string {
    return `
      <g transform="translate(50, 50)">
        <rect x="0" y="0" width="100" height="50" fill="#f3e5f5" stroke="#4a148c" rx="5"/>
        <text x="50" y="30" text-anchor="middle" font-family="${config.fontFamily}" font-size="${config.fontSize}">
          Sequence
        </text>
        <text x="50" y="80" text-anchor="middle" font-family="${config.fontFamily}" font-size="12" fill="#666">
          ${this.countElements(syntax)} elements
        </text>
      </g>
    `;
  }

  /**
   * Generate generic diagram SVG (simplified)
   */
  private generateGenericSVG(syntax: string, config: MermaidConfig): string {
    return `
      <g transform="translate(50, 50)">
        <rect x="0" y="0" width="200" height="100" fill="#fff3e0" stroke="#e65100" rx="5"/>
        <text x="100" y="40" text-anchor="middle" font-family="${config.fontFamily}" font-size="${config.fontSize}">
          Mermaid Diagram
        </text>
        <text x="100" y="60" text-anchor="middle" font-family="${config.fontFamily}" font-size="12" fill="#666">
          Type: ${this.detectDiagramType(syntax)}
        </text>
        <text x="100" y="80" text-anchor="middle" font-family="${config.fontFamily}" font-size="12" fill="#666">
          ${this.countElements(syntax)} elements
        </text>
      </g>
    `;
  }

  /**
   * Render error SVG
   */
  private renderErrorSVG(error: Error, props: MermaidProps): string {
    const errorMessage = props.errorRenderer ? 
      props.errorRenderer(error) : 
      `Error: ${error.message}`;

    return `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#ffebee"/>
        <rect x="10" y="10" width="380" height="180" fill="none" stroke="#f44336" stroke-width="2" rx="5"/>
        <text x="200" y="50" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#c62828">
          Mermaid Render Error
        </text>
        <text x="200" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">
          ${errorMessage}
        </text>
        <text x="200" y="120" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#999">
          Check your Mermaid syntax and try again
        </text>
      </svg>
    `;
  }
}

/**
 * Factory function to create a Mermaid renderer instance
 */
export function createMermaidRenderer(defaultConfig?: MermaidConfig): MermaidRenderer {
  const renderer = new MermaidRenderer();
  
  // You could extend this to set default configuration
  if (defaultConfig) {
    // Store default config for use in rendering
    (renderer as any).defaultConfig = defaultConfig;
  }
  
  return renderer;
}

/**
 * Utility function to validate Mermaid syntax
 */
export function validateMermaidSyntax(syntax: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const trimmed = syntax.trim();

  if (!trimmed) {
    errors.push('Empty Mermaid syntax');
    return { valid: false, errors };
  }

  // Basic validation - check for known diagram types
  const knownTypes = [
    'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'erDiagram', 'gantt', 'pie', 'journey', 'gitgraph'
  ];

  const hasKnownType = knownTypes.some(type => trimmed.startsWith(type));

  if (!hasKnownType) {
    errors.push('Unknown or missing diagram type');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Export default instance
export const mermaidRenderer = new MermaidRenderer();
