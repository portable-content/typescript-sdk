/**
 * @fileoverview Error types for the Portable Content client
 */

/**
 * Base error class for Portable Content SDK
 */
export class PortableContentError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'PortableContentError';
  }
}

/**
 * Network-related errors
 */
export class NetworkError extends PortableContentError {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

/**
 * GraphQL-specific errors
 */
export class GraphQLError extends PortableContentError {
  constructor(
    message: string,
    public readonly graphqlErrors?: Array<{ message: string; path?: string[] }>
  ) {
    super(message, 'GRAPHQL_ERROR');
    this.name = 'GraphQLError';
  }
}

/**
 * Content not found error
 */
export class ContentNotFoundError extends PortableContentError {
  constructor(id: string) {
    super(`Content with ID "${id}" not found`, 'CONTENT_NOT_FOUND');
    this.name = 'ContentNotFoundError';
  }
}

/**
 * Validation error
 */
export class ValidationError extends PortableContentError {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}
