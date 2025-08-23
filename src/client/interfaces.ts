/**
 * @fileoverview Core client interfaces for transport-agnostic API communication
 */

import { ContentItem, Capabilities } from '../types';

/**
 * Generic GraphQL client interface for transport abstraction
 */
export interface GraphQLClient {
  /**
   * Execute a GraphQL request
   */
  request<T = unknown, V = Record<string, unknown>>(
    document: string,
    variables?: V,
    requestHeaders?: Record<string, string>
  ): Promise<T>;
}

/**
 * GraphQL response wrapper
 */
export interface GraphQLResponse<T = unknown> {
  /** Response data */
  data?: T;
  /** GraphQL errors */
  errors?: Array<{ message: string; path?: string[] }>;
}

/**
 * Search options for content queries
 */
export interface SearchOptions {
  /** Search query string */
  query?: string;
  /** Content type filter */
  type?: string;
  /** Maximum number of results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sort?: 'created' | 'updated' | 'title';
  /** Sort direction */
  direction?: 'asc' | 'desc';
}

/**
 * Search result wrapper
 */
export interface SearchResult {
  /** Array of matching content items */
  items: ContentItem[];
  /** Total number of matching items */
  total: number;
  /** Current offset */
  offset: number;
  /** Number of items returned */
  limit: number;
}

/**
 * Main Portable Content client interface
 */
export interface PortableContentClientInterface {
  /**
   * Get a single content item by ID
   */
  getContent(id: string, capabilities?: Capabilities): Promise<ContentItem | null>;

  /**
   * Search for content items
   */
  searchContent(options?: SearchOptions, capabilities?: Capabilities): Promise<SearchResult>;

  /**
   * Get multiple content items by IDs
   */
  getContentBatch(ids: string[], capabilities?: Capabilities): Promise<ContentItem[]>;
}
