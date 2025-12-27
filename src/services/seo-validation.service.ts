import { z } from 'zod';

export interface SeoValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  score: number; // 0-100 SEO score
}

export class SeoValidationService {
  private static readonly CRITICAL_PAGES = ['home', 'about', 'contact', 'puppies'];
  private static readonly MIN_TITLE_LENGTH = 30;
  private static readonly MAX_TITLE_LENGTH = 70;
  private static readonly MIN_DESCRIPTION_LENGTH = 120;
  private static readonly MAX_DESCRIPTION_LENGTH = 160;
  private static readonly RECOMMENDED_KEYWORDS = 3;
  private static readonly MAX_KEYWORDS = 10;

  static validateSeoData(data: {
    entityType?: string;
    entityId?: string;
    metaTitle?: string;
    metaDescription?: string;
    focusKeywords?: string[];
    slug?: string;
    canonicalUrl?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  }): SeoValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let score = 100;

    // Title validation
    if (!data.metaTitle) {
      errors.push('Meta title is required');
      score -= 25;
    } else {
      if (data.metaTitle.length < this.MIN_TITLE_LENGTH) {
        warnings.push(`Meta title is too short (${data.metaTitle.length} chars). Recommended: ${this.MIN_TITLE_LENGTH}-${this.MAX_TITLE_LENGTH} chars`);
        score -= 10;
      }
      if (data.metaTitle.length > this.MAX_TITLE_LENGTH) {
        errors.push(`Meta title is too long (${data.metaTitle.length} chars). Maximum: ${this.MAX_TITLE_LENGTH} chars`);
        score -= 15;
      }
    }

    // Description validation
    if (!data.metaDescription) {
      errors.push('Meta description is required');
      score -= 25;
    } else {
      if (data.metaDescription.length < this.MIN_DESCRIPTION_LENGTH) {
        warnings.push(`Meta description is too short (${data.metaDescription.length} chars). Recommended: ${this.MIN_DESCRIPTION_LENGTH}-${this.MAX_DESCRIPTION_LENGTH} chars`);
        score -= 10;
      }
      if (data.metaDescription.length > this.MAX_DESCRIPTION_LENGTH) {
        errors.push(`Meta description is too long (${data.metaDescription.length} chars). Maximum: ${this.MAX_DESCRIPTION_LENGTH} chars`);
        score -= 15;
      }
    }

    // Keywords validation
    if (!data.focusKeywords || data.focusKeywords.length === 0) {
      warnings.push('No focus keywords provided. Recommended: 3-5 keywords');
      score -= 15;
    } else {
      if (data.focusKeywords.length < this.RECOMMENDED_KEYWORDS) {
        warnings.push(`Too few keywords (${data.focusKeywords.length}). Recommended: ${this.RECOMMENDED_KEYWORDS}-${this.MAX_KEYWORDS} keywords`);
        score -= 5;
      }
      if (data.focusKeywords.length > this.MAX_KEYWORDS) {
        warnings.push(`Too many keywords (${data.focusKeywords.length}). Recommended: ${this.RECOMMENDED_KEYWORDS}-${this.MAX_KEYWORDS} keywords`);
        score -= 5;
      }

      // Check for keyword stuffing
      const titleLower = data.metaTitle?.toLowerCase() || '';
      const descLower = data.metaDescription?.toLowerCase() || '';
      data.focusKeywords.forEach(keyword => {
        const keywordLower = keyword.toLowerCase();
        const titleCount = (titleLower.match(new RegExp(keywordLower, 'g')) || []).length;
        const descCount = (descLower.match(new RegExp(keywordLower, 'g')) || []).length;
        
        if (titleCount > 2) {
          warnings.push(`Keyword "${keyword}" appears too many times in title (${titleCount} times)`);
          score -= 5;
        }
        if (descCount > 3) {
          warnings.push(`Keyword "${keyword}" appears too many times in description (${descCount} times)`);
          score -= 5;
        }
      });
    }

    // Slug validation
    if (data.slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
        errors.push('Slug must contain only lowercase letters, numbers, and hyphens');
        score -= 10;
      }
      if (data.slug.length > 100) {
        warnings.push('Slug is very long. Keep it under 100 characters');
        score -= 5;
      }
    }

    // Canonical URL validation
    if (data.canonicalUrl) {
      try {
        new URL(data.canonicalUrl);
      } catch {
        errors.push('Canonical URL is not a valid URL');
        score -= 10;
      }
    }

    // Open Graph validation
    if (!data.ogTitle && data.metaTitle) {
      warnings.push('OG title not set, will fallback to meta title');
      score -= 5;
    }
    if (!data.ogDescription && data.metaDescription) {
      warnings.push('OG description not set, will fallback to meta description');
      score -= 5;
    }
    if (!data.ogImage) {
      warnings.push('OG image not set. Social media sharing will not have a preview image');
      score -= 10;
    } else {
      try {
        new URL(data.ogImage);
      } catch {
        warnings.push('OG image URL appears to be invalid');
        score -= 5;
      }
    }

    // Critical page validations
    if (data.entityType === 'PAGE' && this.CRITICAL_PAGES.includes(data.entityId || '')) {
      if (data.robots === 'NOINDEX') {
        errors.push(`Critical page "${data.entityId}" should not be set to noindex`);
        score -= 30;
      }
      
      if (!data.metaTitle || !data.metaDescription) {
        errors.push(`Critical page "${data.entityId}" must have meta title and description`);
        score -= 20;
      }
    }

    // Content quality checks
    if (data.metaTitle && data.metaDescription) {
      // Check for title-description similarity
      const similarity = this.calculateSimilarity(data.metaTitle, data.metaDescription);
      if (similarity > 0.8) {
        warnings.push('Meta title and description are too similar');
        score -= 10;
      }

      // Check for placeholder content
      const placeholderPatterns = [
        /lorem ipsum/i,
        /coming soon/i,
        /under construction/i,
        /tbd/i,
        /to be determined/i
      ];
      
      placeholderPatterns.forEach(pattern => {
        if (pattern.test(data.metaTitle || '') || pattern.test(data.metaDescription || '')) {
          errors.push('Contains placeholder text. Please provide actual content');
          score -= 20;
        }
      });
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      score: Math.max(0, Math.min(100, score))
    };
  }

  static generateDefaultSeoData(entityType: string, entityId?: string, entityData?: any): {
    metaTitle: string;
    metaDescription: string;
    focusKeywords: string[];
    ogTitle: string;
    ogDescription: string;
    robots: string;
    schemaType: string;
  } {
    switch (entityType) {
      case 'PAGE':
        return this.generatePageDefaults(entityId);
      case 'PUPPY':
        return this.generatePuppyDefaults(entityData);
      case 'BREED':
        return this.generateBreedDefaults(entityData);
      case 'BLOG':
        return this.generateBlogDefaults(entityData);
      default:
        return this.generateGenericDefaults();
    }
  }

  private static generatePageDefaults(pageId?: string) {
    const pageDefaults: Record<string, any> = {
      home: {
        metaTitle: 'PuppyHub USA - Premium Poodles, Doodles & Designer Puppies',
        metaDescription: 'Find your perfect companion at PuppyHub USA. We specialize in healthy, well-socialized Poodles, Doodles, and designer puppies with health guarantees.',
        focusKeywords: ['puppies for sale', 'poodle puppies', 'doodle puppies', 'puppyhub usa', 'designer puppies'],
        ogTitle: 'PuppyHub USA - Premium Puppies',
        ogDescription: 'Discover healthy, well-socialized Poodles and Doodles at PuppyHub USA',
        robots: 'INDEX',
        schemaType: 'ORGANIZATION'
      },
      about: {
        metaTitle: 'About PuppyHub USA - Our Story & Mission',
        metaDescription: 'Learn about PuppyHub USA\'s commitment to breeding healthy, well-socialized Poodles and Doodles. Meet our team and discover our breeding philosophy.',
        focusKeywords: ['about puppyhub usa', 'poodle breeders', 'doodle breeders', 'puppy breeding', 'reputable breeders'],
        ogTitle: 'About PuppyHub USA',
        ogDescription: 'Our story and commitment to breeding premium puppies',
        robots: 'INDEX',
        schemaType: 'ORGANIZATION'
      },
      contact: {
        metaTitle: 'Contact PuppyHub USA - Get in Touch',
        metaDescription: 'Contact PuppyHub USA to find your perfect puppy. Reach out via phone, email, or visit our facility. We\'re here to help you find your ideal companion.',
        focusKeywords: ['contact puppyhub', 'puppy contact', 'poodle breeder contact', 'buy puppies', 'puppy questions'],
        ogTitle: 'Contact PuppyHub USA',
        ogDescription: 'Get in touch to find your perfect puppy companion',
        robots: 'INDEX',
        schemaType: 'ORGANIZATION'
      },
      puppies: {
        metaTitle: 'Available Puppies - Poodles, Doodles & Designer Breeds',
        metaDescription: 'Browse our available Poodles, Doodles, and designer puppies. All puppies come with health guarantees and are well-socialized. Find your perfect companion today.',
        focusKeywords: ['available puppies', 'poodle puppies for sale', 'doodle puppies', 'buy puppies online', 'puppy adoption'],
        ogTitle: 'Available Puppies',
        ogDescription: 'Browse our selection of healthy, well-socialized puppies',
        robots: 'INDEX',
        schemaType: 'PRODUCT'
      }
    };

    return pageDefaults[pageId || ''] || this.generateGenericDefaults();
  }

  private static generatePuppyDefaults(puppyData?: any) {
    const name = puppyData?.name || 'Puppy';
    const breed = puppyData?.breed || 'Designer Breed';
    const gender = puppyData?.gender || '';
    const color = puppyData?.color || '';

    return {
      metaTitle: `${name} - ${breed} ${gender} Puppy for Adoption | PuppyHub USA`,
      metaDescription: `Meet ${name}, a beautiful ${color} ${breed} ${gender} puppy available for adoption. ${name} is healthy, well-socialized, and ready for a loving home. View photos and details.`,
      focusKeywords: [
        `${name.toLowerCase()} ${breed.toLowerCase()}`,
        `${breed.toLowerCase()} puppies for sale`,
        `${gender.toLowerCase()} ${breed.toLowerCase()}`,
        `${color.toLowerCase()} ${breed.toLowerCase()}`,
        'adopt puppies online'
      ],
      ogTitle: `${name} - ${breed} Puppy`,
      ogDescription: `Meet ${name}, a beautiful ${breed} puppy looking for a loving home`,
      robots: 'INDEX',
      schemaType: 'PRODUCT'
    };
  }

  private static generateBreedDefaults(breedData?: any) {
    const name = breedData?.name || 'Designer Breed';
    const description = breedData?.description || '';

    return {
      metaTitle: `${name} Puppies for Sale - Information & Characteristics`,
      metaDescription: `Learn about ${name} puppies including temperament, size, and care requirements. Browse available ${name} puppies at PuppyHub USA with health guarantees.`,
      focusKeywords: [
        `${name.toLowerCase()} puppies`,
        `${name.toLowerCase()} for sale`,
        `${name.toLowerCase()} breed information`,
        `${name.toLowerCase()} temperament`,
        `${name.toLowerCase()} characteristics`
      ],
      ogTitle: `${name} Puppies`,
      ogDescription: `Everything you need to know about ${name} puppies`,
      robots: 'INDEX',
      schemaType: 'ARTICLE'
    };
  }

  private static generateBlogDefaults(blogData?: any) {
    const title = blogData?.title || 'Blog Post';
    const excerpt = blogData?.excerpt || '';

    return {
      metaTitle: `${title} | PuppyHub USA Blog`,
      metaDescription: excerpt || `Read the latest article from PuppyHub USA about puppy care, training tips, and breed information.`,
      focusKeywords: ['puppy care', 'dog training', 'puppy training', 'breed information', 'puppy health'],
      ogTitle: title,
      ogDescription: excerpt,
      robots: 'INDEX',
      schemaType: 'ARTICLE'
    };
  }

  private static generateGenericDefaults() {
    return {
      metaTitle: 'PuppyHub USA - Premium Puppies & Designer Dogs',
      metaDescription: 'Find your perfect companion at PuppyHub USA. We specialize in healthy, well-socialized Poodles, Doodles, and designer puppies.',
      focusKeywords: ['puppies for sale', 'poodle puppies', 'doodle puppies', 'designer dogs', 'puppy adoption'],
      ogTitle: 'PuppyHub USA',
      ogDescription: 'Premium Poodles and Doodles',
      robots: 'INDEX',
      schemaType: 'WEBSITE'
    };
  }

  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  static auditSeoHealth(seoDataList: any[]): {
    totalScore: number;
    criticalIssues: string[];
    recommendations: string[];
    entityScores: Array<{ entityId: string; entityType: string; score: number; issues: string[] }>;
  } {
    let totalScore = 0;
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    const entityScores: Array<{ entityId: string; entityType: string; score: number; issues: string[] }> = [];

    seoDataList.forEach(seo => {
      const validation = this.validateSeoData(seo);
      totalScore += validation.score;
      
      entityScores.push({
        entityId: seo.entityId || 'unknown',
        entityType: seo.entityType,
        score: validation.score,
        issues: [...validation.errors, ...validation.warnings]
      });

      if (validation.score < 50) {
        criticalIssues.push(`${seo.entityType}:${seo.entityId} - Poor SEO score (${validation.score}/100)`);
      }

      if (validation.errors.length > 0) {
        criticalIssues.push(`${seo.entityType}:${seo.entityId} - ${validation.errors.length} critical errors`);
      }

      // Add specific recommendations based on common issues
      if (!seo.metaTitle || !seo.metaDescription) {
        recommendations.push('Add meta titles and descriptions to all pages');
      }
      if (!seo.focusKeywords || seo.focusKeywords.length === 0) {
        recommendations.push('Add focus keywords to improve search ranking');
      }
      if (!seo.ogImage) {
        recommendations.push('Add OG images for better social media sharing');
      }
    });

    const averageScore = seoDataList.length > 0 ? totalScore / seoDataList.length : 0;

    return {
      totalScore: Math.round(averageScore),
      criticalIssues,
      recommendations,
      entityScores
    };
  }
}
