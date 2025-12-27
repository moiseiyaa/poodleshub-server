import { z } from 'zod';

export const createSeoMetaSchema = z.object({
  entityType: z.enum(['PAGE', 'PUPPY', 'BREED', 'BLOG', 'CATEGORY']),
  entityId: z.string().optional(),
  metaTitle: z.string().max(70, 'Meta title must be 70 characters or less').optional(),
  metaDescription: z.string().max(160, 'Meta description must be 160 characters or less').optional(),
  focusKeywords: z.array(z.string()).default([]),
  slug: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  robots: z.enum(['INDEX', 'NOINDEX']).default('INDEX'),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  schemaType: z.enum(['ARTICLE', 'PRODUCT', 'FAQ', 'ORGANIZATION']).default('ARTICLE'),
});

export const updateSeoMetaSchema = createSeoMetaSchema.partial();

export const slugUniquenessSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
  excludeId: z.string().optional(),
});

export type CreateSeoMetaInput = z.infer<typeof createSeoMetaSchema>;
export type UpdateSeoMetaInput = z.infer<typeof updateSeoMetaSchema>;
export type SlugUniquenessInput = z.infer<typeof slugUniquenessSchema>;
