/**
 * @fileoverview PayloadSource selection algorithm implementation
 *
 * This module implements the logic for selecting the best payload source
 * based on client capabilities and preferences.
 */

import type { PayloadSource, Capabilities, CapabilityHints, Block } from '../types';

export interface PayloadSourceScore {
  payloadSource: PayloadSource;
  score: number;
  reasons: string[];
}

/**
 * Engine for selecting optimal payload sources based on client capabilities
 */
export class PayloadSourceSelector {
  /**
   * Select the best payload source for a block based on capabilities
   */
  selectBestPayloadSource(block: Block, capabilities: Capabilities): PayloadSource | null {
    // Start with primary content
    const primary = block.content.primary;
    const alternatives = block.content.alternatives || [];

    // Combine all available sources
    const allSources = [primary, ...alternatives];

    if (allSources.length === 0) {
      return null;
    }

    // Score all acceptable sources
    const scoredSources = this.scorePayloadSources(allSources, capabilities);

    if (scoredSources.length === 0) {
      // Check if any accept type is a catch-all
      const hasCatchAll = capabilities.accept.some(
        (accept) => accept.split(';')[0].trim() === '*/*'
      );

      if (hasCatchAll) {
        // Return primary as fallback for catch-all
        return primary;
      }

      // No acceptable sources and no catch-all, return null
      return null;
    }

    // Sort by score (highest first) and return best
    scoredSources.sort((a, b) => b.score - a.score);
    return scoredSources[0].payloadSource;
  }

  /**
   * Score all payload sources based on capabilities
   */
  private scorePayloadSources(
    sources: PayloadSource[],
    capabilities: Capabilities
  ): PayloadSourceScore[] {
    const scored: PayloadSourceScore[] = [];

    for (const source of sources) {
      const score = this.scorePayloadSource(source, capabilities);
      if (score.score > 0) {
        scored.push(score);
      }
    }

    return scored;
  }

  /**
   * Score a single payload source against capabilities
   */
  private scorePayloadSource(
    source: PayloadSource,
    capabilities: Capabilities
  ): PayloadSourceScore {
    const reasons: string[] = [];
    let score = 0;

    // Check if media type is acceptable
    const mediaTypeScore = this.scoreMediaType(source.mediaType, capabilities.accept);
    if (mediaTypeScore <= 0) {
      return { payloadSource: source, score: 0, reasons: ['Media type not acceptable'] };
    }

    score += mediaTypeScore;
    reasons.push(`Media type score: ${mediaTypeScore}`);

    // Add format preference bonus for modern formats
    const formatBonus = this.getFormatPreferenceBonus(source.mediaType);
    if (formatBonus > 0) {
      score += formatBonus;
      reasons.push(`Format preference bonus: ${formatBonus}`);
    }

    // Prefer inline content for small data (reduces HTTP requests)
    if (source.type === 'inline') {
      let inlineBonus = 0.1;

      // Give higher bonus for inline content on slow networks
      if (capabilities.hints?.network === 'SLOW' || capabilities.hints?.network === 'CELLULAR') {
        inlineBonus = 0.5;
        reasons.push('Inline content bonus (slow network)');
      } else {
        reasons.push('Inline content bonus');
      }

      score += inlineBonus;
    }

    // Apply capability hints
    if (capabilities.hints) {
      const hintScore = this.applyCapabilityHints(source, capabilities.hints);
      score += hintScore.score;
      reasons.push(...hintScore.reasons);
    }

    return { payloadSource: source, score, reasons };
  }

  /**
   * Score media type against accept list
   */
  private scoreMediaType(variantType: string, acceptTypes: string[]): number {
    let bestScore = 0;

    for (const acceptType of acceptTypes) {
      if (this.mediaTypeMatches(variantType, acceptType)) {
        // Extract quality value if present (e.g., "image/webp;q=0.8")
        const quality = this.extractQuality(acceptType);
        bestScore = Math.max(bestScore, quality);
      }
    }

    return bestScore;
  }

  /**
   * Check if variant media type matches accept pattern
   */
  private mediaTypeMatches(variantType: string, acceptType: string): boolean {
    // Remove parameters for comparison
    const variantBase = variantType.split(';')[0].trim();
    const acceptBase = acceptType.split(';')[0].trim();

    // Handle wildcards (e.g., "image/*")
    if (acceptBase.endsWith('/*')) {
      const prefix = acceptBase.slice(0, -2);
      return variantBase.startsWith(prefix);
    }

    // Handle catch-all
    if (acceptBase === '*/*') {
      return true;
    }

    // Exact match
    return variantBase === acceptBase;
  }

  /**
   * Extract quality value from accept type
   */
  private extractQuality(acceptType: string): number {
    const qMatch = acceptType.match(/;q=([0-9.]+)/);
    return qMatch ? parseFloat(qMatch[1]) : 1.0;
  }

  /**
   * Get format preference bonus for modern/efficient formats
   */
  private getFormatPreferenceBonus(mediaType: string): number {
    // Prefer modern, efficient formats
    switch (mediaType) {
      case 'image/avif':
        return 0.3; // Highest preference for AVIF
      case 'image/webp':
        return 0.2; // High preference for WebP
      case 'image/jpeg':
        return 0.1; // Slight preference for JPEG over PNG
      case 'text/html':
        return 0.1; // Prefer rendered HTML over markdown
      default:
        return 0;
    }
  }

  /**
   * Apply capability hints to adjust score
   */
  private applyCapabilityHints(
    source: PayloadSource,
    hints: CapabilityHints
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Size preferences
    if (hints.width && source.width) {
      const sizeDiff = Math.abs(source.width - hints.width);
      const sizeScore = Math.max(0, 1 - sizeDiff / hints.width);
      score += sizeScore * 0.3; // 30% weight for size matching
      reasons.push(`Size match score: ${sizeScore.toFixed(2)}`);
    }

    // Network optimization for external sources
    if (hints.network && source.type === 'external') {
      // Estimate size for external content (simplified)
      const estimatedSize = this.estimateContentSize(source);
      if (estimatedSize > 0) {
        const networkScore = this.scoreForNetwork(estimatedSize, hints.network);
        score += networkScore * 0.4; // 40% weight for network optimization
        reasons.push(`Network optimization score: ${networkScore.toFixed(2)}`);
      }
    }

    // Density preferences
    if (hints.density && source.width && source.height) {
      const densityScore = this.scoreDensity(source, hints.density);
      score += densityScore * 0.2; // 20% weight for density
      reasons.push(`Density score: ${densityScore.toFixed(2)}`);
    }

    // File size preferences for inline content
    if (hints.maxBytes && source.type === 'inline' && source.source) {
      const inlineSize = new Blob([source.source]).size;
      if (inlineSize > hints.maxBytes) {
        score -= 0.5; // Penalty for exceeding max size
        reasons.push('Penalty for exceeding max file size');
      }
    }

    return { score, reasons };
  }

  /**
   * Score variant based on network type
   */
  private scoreForNetwork(bytes: number, network: string): number {
    const sizeMB = bytes / (1024 * 1024);

    switch (network) {
      case 'FAST':
        return 1.0; // No penalty for fast networks
      case 'SLOW':
        return Math.max(0, 1 - sizeMB * 0.5); // Penalty for large files
      case 'CELLULAR':
        return Math.max(0, 1 - sizeMB * 0.8); // Higher penalty for cellular
      default:
        return 0.5;
    }
  }

  /**
   * Score payload source based on density requirements
   */
  private scoreDensity(source: PayloadSource, targetDensity: number): number {
    // This is a simplified density scoring
    // In practice, you might want more sophisticated logic
    if (targetDensity >= 2.0 && source.width && source.width >= 1600) {
      return 1.0; // High-res source for high-density displays
    } else if (targetDensity < 2.0 && source.width && source.width < 1600) {
      return 1.0; // Standard-res source for standard displays
    }
    return 0.5;
  }

  /**
   * Estimate content size for external sources
   */
  private estimateContentSize(source: PayloadSource): number {
    // Simple estimation based on media type and dimensions
    if (source.mediaType.startsWith('image/') && source.width && source.height) {
      // Rough estimate: width * height * bytes per pixel
      const pixelCount = source.width * source.height;
      switch (source.mediaType) {
        case 'image/jpeg':
          return pixelCount * 0.5; // JPEG compression
        case 'image/png':
          return pixelCount * 2; // PNG less compressed
        case 'image/webp':
          return pixelCount * 0.3; // WebP more efficient
        case 'image/avif':
          return pixelCount * 0.2; // AVIF most efficient
        default:
          return pixelCount;
      }
    }

    // Default estimate for unknown types
    return 100000; // 100KB default
  }
}
