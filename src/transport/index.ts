/**
 * @fileoverview Transport layer exports
 */

// Transport interfaces
export type {
  Transport,
  TransportFactory,
  TransportRegistry,
  TransportConnectionState,
  TransportConnectionOptions,
  TransportMessage,
  TransportMessageType,
  TransportEventPayload,
  TransportBatchEventPayload,
  TransportSubscriptionPayload,
  TransportErrorPayload,
  TransportEventHandler,
  TransportBatchEventHandler,
  TransportConnectionStateHandler,
  TransportErrorHandler,
  TransportUnsubscribeFunction,
  TransportStats,
} from './transport-interface';

// Transport implementations
export { BaseTransport } from './base-transport';
export { MockTransport } from './mock-transport';

// Transport registry
export {
  MockTransportFactory,
  DefaultTransportRegistry,
  transportRegistry,
  createTransport,
  registerTransportFactory,
  isTransportSupported,
} from './transport-registry';

// Transport constants
export {
  DEFAULT_TRANSPORT_OPTIONS,
  TRANSPORT_MESSAGE_PRIORITIES,
  TRANSPORT_PROTOCOLS,
} from './transport-interface';
