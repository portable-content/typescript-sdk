# Portable Content TypeScript SDK

A framework-agnostic TypeScript SDK for the Portable Content System, providing type-safe data models, API clients, and rendering utilities.

[![codecov](https://codecov.io/gh/portable-content/typescript-sdk/graph/badge.svg?token=kny2WCQvHx)](https://codecov.io/gh/portable-content/typescript-sdk)

## Features

- 🔒 **Type-Safe**: Full TypeScript support with strict type checking
- 🔄 **Transport-Agnostic**: Works with any GraphQL client (Apollo, URQL, etc.)
- 🎨 **Framework-Agnostic**: Core functionality independent of UI frameworks
- 📱 **Capability-Aware**: Intelligent content variant selection
- ✅ **Runtime Validation**: Zod schemas for data validation
- 🧪 **Well-Tested**: Comprehensive test coverage

## Installation

```bash
npm install @portable-content/typescript-sdk
```

## Quick Start

```typescript
import { PortableContentClient, ApolloClientAdapter } from '@portable-content/typescript-sdk';
import { ApolloClient, InMemoryCache } from '@apollo/client';

// Set up your GraphQL client
const apolloClient = new ApolloClient({
  uri: 'https://your-api.example.com/graphql',
  cache: new InMemoryCache(),
});

// Create the Portable Content client
const client = new PortableContentClient(
  new ApolloClientAdapter(apolloClient),
  {
    accept: ['text/html', 'image/jpeg', 'image/png'],
    hints: { width: 1024, height: 768 }
  }
);

// Fetch content
const content = await client.getContent('content-id');
console.log(content);
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run tests
npm test

# Build the package
npm run build

# Run linting
npm run lint
```

### Scripts

- `npm run build` - Build the package for distribution
- `npm run test` - Run the test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Architecture

This SDK is designed with a modular architecture:

- **Types**: Core data models and interfaces
- **Client**: API communication and transport abstraction
- **Rendering**: Framework-agnostic rendering utilities
- **Validation**: Runtime data validation with Zod
- **Utils**: Common utility functions

## Documentation

- [API Reference](./docs/api.md)
- [Usage Examples](./docs/examples.md)
- [Migration Guide](./docs/migration.md)

## Contributing

Please read our [Contributing Guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](./LICENSE) file for details.