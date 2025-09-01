/**
 * @fileoverview Loading strategies for content resolution
 */

import type {
  LoadingStrategy,
  ContentResolutionResult,
  RenderingContent,
  ContentResolutionOptions,
} from './content-resolution';
import type { PayloadSource, Capabilities, ExternalPayloadSource } from '../types';

/**
 * Eager loading strategy that immediately loads all content
 */
export class EagerLoadingStrategy implements LoadingStrategy {
  readonly name = 'eager';

  canHandle(_source: PayloadSource): boolean {
    // Eager strategy can handle any payload source
    return true;
  }

  async resolve(
    source: PayloadSource,
    capabilities: Capabilities,
    options: ContentResolutionOptions = {}
  ): Promise<ContentResolutionResult> {
    const startTime = Date.now();

    try {
      let content: RenderingContent;

      if (source.type === 'inline') {
        content = await this.resolveInlineContent(source, options);
      } else {
        content = await this.resolveExternalContent(source, capabilities, options);
      }

      // Add timing metadata
      content.metadata = {
        ...content.metadata,
        loadedAt: new Date(),
        loadDuration: Date.now() - startTime,
        fromCache: false,
      };

      return { success: true, content };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: this.getErrorCode(error),
          source,
          cause: error instanceof Error ? error : undefined,
          timestamp: new Date(),
        },
      };
    }
  }

  private async resolveInlineContent(
    source: PayloadSource,
    options: ContentResolutionOptions
  ): Promise<RenderingContent> {
    if (source.type !== 'inline' || !source.source) {
      throw new Error('Invalid inline payload source');
    }

    const data = source.source;

    // Check size limits
    if (options.maxSize && data.length > options.maxSize) {
      throw new Error(`Content size ${data.length} exceeds maximum ${options.maxSize}`);
    }

    return {
      data,
      mediaType: source.mediaType,
      source,
      metadata: {
        size: data.length,
        hash: (source as ExternalPayloadSource).contentHash,
      },
    };
  }

  private async resolveExternalContent(
    source: PayloadSource,
    capabilities: Capabilities,
    options: ContentResolutionOptions
  ): Promise<RenderingContent> {
    if (source.type !== 'external' || !source.uri) {
      throw new Error('Invalid external payload source');
    }

    const controller = new AbortController();
    const timeoutId = options.timeout
      ? setTimeout(() => controller.abort(), options.timeout)
      : null;

    try {
      const headers: Record<string, string> = {
        ...options.headers,
      };

      // Add Accept header based on capabilities
      if (capabilities.accept.length > 0) {
        headers.Accept = capabilities.accept.join(', ');
      }

      const response = await fetch(source.uri, {
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type') || source.mediaType;

      // Check content length
      const contentLength = response.headers.get('content-length');
      if (contentLength && options.maxSize && parseInt(contentLength) > options.maxSize) {
        throw new Error(`Content size ${contentLength} exceeds maximum ${options.maxSize}`);
      }

      // Determine how to read the content based on media type
      let data: string | ArrayBuffer | Blob;

      if (this.isTextContent(contentType)) {
        data = await response.text();
      } else if (this.isBinaryContent(contentType)) {
        data = await response.arrayBuffer();
      } else {
        // Default to blob for unknown types
        data = await response.blob();
      }

      // Validate content integrity if hash is provided
      const externalSource = source as ExternalPayloadSource;
      if (options.validateIntegrity && externalSource.contentHash) {
        await this.validateContentIntegrity(data, externalSource.contentHash);
      }

      return {
        data,
        mediaType: contentType,
        source,
        metadata: {
          size: this.getContentSize(data),
          hash: externalSource.contentHash,
        },
      };
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private isTextContent(mediaType: string): boolean {
    return (
      mediaType.startsWith('text/') ||
      mediaType.includes('json') ||
      mediaType.includes('xml') ||
      mediaType.includes('javascript') ||
      mediaType.includes('css')
    );
  }

  private isBinaryContent(mediaType: string): boolean {
    return (
      mediaType.startsWith('image/') ||
      mediaType.startsWith('video/') ||
      mediaType.startsWith('audio/') ||
      mediaType.includes('octet-stream')
    );
  }

  private getContentSize(data: string | ArrayBuffer | Blob): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (data instanceof ArrayBuffer) {
      return data.byteLength;
    } else if (data instanceof Blob) {
      return data.size;
    }
    return 0;
  }

  private async validateContentIntegrity(
    data: string | ArrayBuffer | Blob,
    _expectedHash: string
  ): Promise<void> {
    // Simple validation - in production you'd want proper hash verification
    // This is a placeholder for now
    const actualSize = this.getContentSize(data);
    if (actualSize === 0) {
      throw new Error('Content integrity validation failed: empty content');
    }
  }

  private getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      if (error.name === 'AbortError') return 'TIMEOUT';
      if (error instanceof DOMException && error.name === 'AbortError') return 'TIMEOUT';
      if (error.message.includes('Aborted')) return 'TIMEOUT';
      if (error.message.includes('HTTP 404')) return 'NOT_FOUND';
      if (error.message.includes('HTTP 403')) return 'FORBIDDEN';
      if (error.message.includes('HTTP 500')) return 'SERVER_ERROR';
      if (error.message.includes('size') && error.message.includes('exceeds')) return 'SIZE_LIMIT';
      if (error.message.includes('integrity')) return 'INTEGRITY_ERROR';
    }
    if (error instanceof DOMException && error.name === 'AbortError') return 'TIMEOUT';
    return 'UNKNOWN_ERROR';
  }
}
