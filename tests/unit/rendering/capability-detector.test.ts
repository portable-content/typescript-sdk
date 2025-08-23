/**
 * @fileoverview Tests for CapabilityDetector
 */

import { CapabilityDetector } from '../../../src/rendering/capability-detector';

// Mock global objects for testing
const mockWindow = {
  screen: { width: 1920, height: 1080 },
  devicePixelRatio: 2.0
};

const mockNavigator = {
  connection: {
    effectiveType: '4g'
  }
};

const mockDocument = {
  createElement: jest.fn(() => ({
    width: 1,
    height: 1,
    toDataURL: jest.fn((format: string) => `data:${format},mock-data`)
  })),
  implementation: {
    hasFeature: jest.fn(() => true)
  }
};

describe('CapabilityDetector', () => {
  let detector: CapabilityDetector;
  let originalWindow: any;
  let originalNavigator: any;
  let originalDocument: any;

  beforeEach(() => {
    detector = new CapabilityDetector();
    
    // Store original globals
    originalWindow = global.window;
    originalNavigator = global.navigator;
    originalDocument = global.document;
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.navigator = originalNavigator;
    global.document = originalDocument;
  });

  describe('detectCapabilities', () => {
    it('should detect capabilities in browser environment', () => {
      // Mock browser environment
      global.window = mockWindow as any;
      global.navigator = mockNavigator as any;
      global.document = mockDocument as any;

      const capabilities = detector.detectCapabilities();

      expect(capabilities.accept).toContain('text/markdown');
      expect(capabilities.accept).toContain('text/html');
      expect(capabilities.accept).toContain('image/png');
      expect(capabilities.hints).toBeDefined();
      expect(capabilities.hints?.width).toBe(1920);
      expect(capabilities.hints?.height).toBe(1080);
      expect(capabilities.hints?.density).toBe(2.0);
      expect(capabilities.hints?.network).toBe('FAST');
      expect(capabilities.hints?.interactive).toBe(true);
    });

    it('should provide defaults in server environment', () => {
      // Mock server environment (no window/document)
      global.window = undefined as any;
      global.document = undefined as any;
      global.navigator = undefined as any;

      const capabilities = detector.detectCapabilities();

      expect(capabilities.accept).toContain('text/markdown');
      expect(capabilities.accept).toContain('text/html');
      expect(capabilities.hints?.width).toBe(375); // Default mobile width
      expect(capabilities.hints?.height).toBe(667); // Default mobile height
      expect(capabilities.hints?.density).toBe(1);
      expect(capabilities.hints?.network).toBe('FAST');
      expect(capabilities.hints?.interactive).toBe(false);
    });
  });

  describe('media type detection', () => {
    beforeEach(() => {
      global.document = mockDocument as any;
    });

    it('should detect supported image formats', () => {
      const capabilities = detector.detectCapabilities();

      // Should always include basic formats
      expect(capabilities.accept).toContain('image/png');
      expect(capabilities.accept).toContain('image/jpeg');
      expect(capabilities.accept).toContain('image/gif');
    });

    it('should detect WebP support when available', () => {
      mockDocument.createElement.mockReturnValue({
        width: 1,
        height: 1,
        toDataURL: jest.fn((format: string) => 
          format === 'image/webp' ? 'data:image/webp,mock' : 'data:image/png,mock'
        )
      });

      const capabilities = detector.detectCapabilities();
      expect(capabilities.accept).toContain('image/webp');
    });

    it('should detect AVIF support when available', () => {
      mockDocument.createElement.mockReturnValue({
        width: 1,
        height: 1,
        toDataURL: jest.fn((format: string) => 
          format === 'image/avif' ? 'data:image/avif,mock' : 'data:image/png,mock'
        )
      });

      const capabilities = detector.detectCapabilities();
      expect(capabilities.accept).toContain('image/avif');
    });

    it('should handle canvas creation errors gracefully', () => {
      const originalDocument = global.document;

      // Mock document with failing createElement
      global.document = {
        createElement: jest.fn(() => {
          throw new Error('Canvas not supported');
        }),
        implementation: {
          hasFeature: jest.fn(() => true)
        }
      } as any;

      const capabilities = detector.detectCapabilities();

      // Should still include basic formats
      expect(capabilities.accept).toContain('image/png');
      expect(capabilities.accept).toContain('image/jpeg');
      // But not advanced formats
      expect(capabilities.accept).not.toContain('image/webp');
      expect(capabilities.accept).not.toContain('image/avif');

      // Restore original document
      global.document = originalDocument;
    });

    it('should detect SVG support', () => {
      mockDocument.implementation.hasFeature.mockReturnValue(true);

      const capabilities = detector.detectCapabilities();
      expect(capabilities.accept).toContain('image/svg+xml');
    });

    it('should handle missing SVG support', () => {
      mockDocument.implementation.hasFeature.mockReturnValue(false);

      const capabilities = detector.detectCapabilities();
      expect(capabilities.accept).not.toContain('image/svg+xml');
    });
  });

  describe('screen detection', () => {
    it('should detect screen dimensions', () => {
      global.window = {
        screen: { width: 2560, height: 1440 }
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.width).toBe(2560);
      expect(capabilities.hints?.height).toBe(1440);
    });

    it('should use defaults when window is not available', () => {
      global.window = undefined as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.width).toBe(375);
      expect(capabilities.hints?.height).toBe(667);
    });

    it('should detect pixel density', () => {
      global.window = {
        screen: { width: 1920, height: 1080 },
        devicePixelRatio: 3.0
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.density).toBe(3.0);
    });

    it('should default to 1.0 pixel density when not available', () => {
      global.window = {
        screen: { width: 1920, height: 1080 }
        // No devicePixelRatio
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.density).toBe(1.0);
    });
  });

  describe('network detection', () => {
    it('should detect 4G as FAST network', () => {
      global.navigator = {
        connection: { effectiveType: '4g' }
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('FAST');
    });

    it('should detect 3G as SLOW network', () => {
      global.navigator = {
        connection: { effectiveType: '3g' }
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('SLOW');
    });

    it('should detect 2G as CELLULAR network', () => {
      global.navigator = {
        connection: { effectiveType: '2g' }
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('CELLULAR');
    });

    it('should detect slow-2g as CELLULAR network', () => {
      global.navigator = {
        connection: { effectiveType: 'slow-2g' }
      } as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('CELLULAR');
    });

    it('should default to FAST when connection info is not available', () => {
      global.navigator = {} as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('FAST');
    });

    it('should default to FAST when navigator is not available', () => {
      global.navigator = undefined as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.network).toBe('FAST');
    });
  });

  describe('interactive capability detection', () => {
    it('should detect interactive environment when window and document are available', () => {
      global.window = mockWindow as any;
      global.document = mockDocument as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.interactive).toBe(true);
    });

    it('should detect non-interactive environment when window is not available', () => {
      global.window = undefined as any;
      global.document = mockDocument as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.interactive).toBe(false);
    });

    it('should detect non-interactive environment when document is not available', () => {
      global.window = mockWindow as any;
      global.document = undefined as any;

      const capabilities = detector.detectCapabilities();
      expect(capabilities.hints?.interactive).toBe(false);
    });
  });
});
