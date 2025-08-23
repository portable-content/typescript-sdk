/**
 * @fileoverview Unit tests for type definitions
 */

import { BLOCK_KINDS, DEFAULT_CAPABILITIES } from '../../src/types';

describe('Types', () => {
  describe('BLOCK_KINDS', () => {
    it('should have expected block kinds', () => {
      expect(BLOCK_KINDS.MARKDOWN).toBe('markdown');
      expect(BLOCK_KINDS.MERMAID).toBe('mermaid');
      expect(BLOCK_KINDS.IMAGE).toBe('image');
    });
  });

  describe('DEFAULT_CAPABILITIES', () => {
    it('should have default accept types', () => {
      expect(DEFAULT_CAPABILITIES.accept).toContain('text/html');
      expect(DEFAULT_CAPABILITIES.accept).toContain('text/markdown');
      expect(DEFAULT_CAPABILITIES.accept).toContain('image/jpeg');
    });

    it('should have default hints', () => {
      expect(DEFAULT_CAPABILITIES.hints).toBeDefined();
      expect(DEFAULT_CAPABILITIES.hints?.width).toBe(1024);
      expect(DEFAULT_CAPABILITIES.hints?.height).toBe(768);
      expect(DEFAULT_CAPABILITIES.hints?.density).toBe(1.0);
      expect(DEFAULT_CAPABILITIES.hints?.network).toBe('FAST');
    });
  });
});
