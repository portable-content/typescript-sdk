/**
 * @fileoverview Variant selection algorithm implementation
 *
 * This module implements the logic for selecting the best variant
 * based on client capabilities and preferences.
 */

import type { Variant, Capabilities, CapabilityHints } from '../types';

export interface VariantScore {
  variant: Variant;
  score: number;
  reasons: string[];
}

/**
 * Engine for selecting optimal variants based on client capabilities
 */
export class VariantSelector {
  /**
   * Select the best variant from available options
   */
  selectBestVariant(variants: Variant[], capabilities: Capabilities): Variant | null {
    if (variants.length === 0) {
      return null;
    }

    // Score all acceptable variants
    const scoredVariants = this.scoreVariants(variants, capabilities);

    if (scoredVariants.length === 0) {
      // No acceptable variants, return fallback
      return this.selectFallbackVariant(variants);
    }

    // Sort by score (highest first) and return best
    scoredVariants.sort((a, b) => b.score - a.score);
    return scoredVariants[0].variant;
  }

  /**
   * Score all variants based on capabilities
   */
  private scoreVariants(variants: Variant[], capabilities: Capabilities): VariantScore[] {
    const scored: VariantScore[] = [];

    for (const variant of variants) {
      const score = this.scoreVariant(variant, capabilities);
      if (score.score > 0) {
        scored.push(score);
      }
    }

    return scored;
  }

  /**
   * Score a single variant against capabilities
   */
  private scoreVariant(variant: Variant, capabilities: Capabilities): VariantScore {
    const reasons: string[] = [];
    let score = 0;

    // Check if media type is acceptable
    const mediaTypeScore = this.scoreMediaType(variant.mediaType, capabilities.accept);
    if (mediaTypeScore <= 0) {
      return { variant, score: 0, reasons: ['Media type not acceptable'] };
    }

    score += mediaTypeScore;
    reasons.push(`Media type score: ${mediaTypeScore}`);

    // Add format preference bonus for modern formats
    const formatBonus = this.getFormatPreferenceBonus(variant.mediaType);
    if (formatBonus > 0) {
      score += formatBonus;
      reasons.push(`Format preference bonus: ${formatBonus}`);
    }

    // Apply capability hints
    if (capabilities.hints) {
      const hintScore = this.applyCapabilityHints(variant, capabilities.hints);
      score += hintScore.score;
      reasons.push(...hintScore.reasons);
    }

    return { variant, score, reasons };
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
    variant: Variant,
    hints: CapabilityHints
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Size preferences
    if (hints.width && variant.width) {
      const sizeDiff = Math.abs(variant.width - hints.width);
      const sizeScore = Math.max(0, 1 - sizeDiff / hints.width);
      score += sizeScore * 0.3; // 30% weight for size matching
      reasons.push(`Size match score: ${sizeScore.toFixed(2)}`);
    }

    // Network optimization
    if (hints.network && variant.bytes) {
      const networkScore = this.scoreForNetwork(variant.bytes, hints.network);
      score += networkScore * 0.4; // 40% weight for network optimization
      reasons.push(`Network optimization score: ${networkScore.toFixed(2)}`);
    }

    // Density preferences
    if (hints.density && variant.width && variant.height) {
      const densityScore = this.scoreDensity(variant, hints.density);
      score += densityScore * 0.2; // 20% weight for density
      reasons.push(`Density score: ${densityScore.toFixed(2)}`);
    }

    // File size preferences
    if (hints.maxBytes && variant.bytes) {
      if (variant.bytes > hints.maxBytes) {
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
   * Score variant based on density requirements
   */
  private scoreDensity(variant: Variant, targetDensity: number): number {
    // This is a simplified density scoring
    // In practice, you might want more sophisticated logic
    if (targetDensity >= 2.0 && variant.width && variant.width >= 1600) {
      return 1.0; // High-res variant for high-density displays
    } else if (targetDensity < 2.0 && variant.width && variant.width < 1600) {
      return 1.0; // Standard-res variant for standard displays
    }
    return 0.5;
  }

  /**
   * Select fallback variant when no variants match capabilities
   */
  private selectFallbackVariant(variants: Variant[]): Variant | null {
    if (variants.length === 0) {
      return null;
    }

    // Prefer variants with URIs (accessible content)
    const accessibleVariants = variants.filter((v) => v.uri);
    if (accessibleVariants.length > 0) {
      // Return smallest accessible variant as fallback
      return accessibleVariants.reduce((smallest, current) => {
        if (!smallest.bytes || !current.bytes) return smallest;
        return current.bytes < smallest.bytes ? current : smallest;
      });
    }

    // Return first variant as last resort
    return variants[0];
  }
}
