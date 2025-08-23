/**
 * @fileoverview Capability detection utilities
 *
 * This module contains utilities for detecting client capabilities
 * such as supported media types, viewport size, etc.
 */

import type { Capabilities, CapabilityHints, NetworkType } from '../types';

/**
 * Detects client capabilities for optimal content delivery
 */
export class CapabilityDetector {
  /**
   * Detect capabilities for current environment
   */
  detectCapabilities(): Capabilities {
    return {
      accept: this.detectSupportedMediaTypes(),
      hints: this.detectCapabilityHints()
    };
  }

  /**
   * Detect supported media types
   */
  private detectSupportedMediaTypes(): string[] {
    const supported = [
      'text/markdown',
      'text/html',
      'text/plain'
    ];

    // Check image format support
    if (this.supportsImageFormat('avif')) {
      supported.push('image/avif');
    }
    if (this.supportsImageFormat('webp')) {
      supported.push('image/webp');
    }
    supported.push('image/png', 'image/jpeg', 'image/gif');

    // Check SVG support
    if (this.supportsSVG()) {
      supported.push('image/svg+xml');
    }

    return supported;
  }

  /**
   * Detect capability hints
   */
  private detectCapabilityHints(): CapabilityHints {
    return {
      width: this.detectScreenWidth(),
      height: this.detectScreenHeight(),
      density: this.detectPixelDensity(),
      network: this.detectNetworkType(),
      interactive: this.detectInteractiveCapability()
    };
  }

  /**
   * Check if image format is supported
   */
  private supportsImageFormat(format: string): boolean {
    if (typeof document === 'undefined') {
      return false; // Server-side, assume no support
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
    } catch {
      return false;
    }
  }

  /**
   * Check SVG support
   */
  private supportsSVG(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    return document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Image', '1.1');
  }

  /**
   * Detect screen width
   */
  private detectScreenWidth(): number {
    if (typeof window !== 'undefined') {
      return window.screen.width;
    }
    return 375; // Default mobile width
  }

  /**
   * Detect screen height
   */
  private detectScreenHeight(): number {
    if (typeof window !== 'undefined') {
      return window.screen.height;
    }
    return 667; // Default mobile height
  }

  /**
   * Detect pixel density
   */
  private detectPixelDensity(): number {
    if (typeof window !== 'undefined') {
      return window.devicePixelRatio || 1;
    }
    return 1;
  }

  /**
   * Detect network type
   */
  private detectNetworkType(): NetworkType {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as { connection?: { effectiveType?: string } }).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case '4g':
            return 'FAST';
          case '3g':
            return 'SLOW';
          case '2g':
          case 'slow-2g':
            return 'CELLULAR';
          default:
            return 'FAST';
        }
      }
    }
    return 'FAST'; // Default assumption
  }

  /**
   * Detect interactive capability
   */
  private detectInteractiveCapability(): boolean {
    // Check if we're in an interactive environment
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
}
