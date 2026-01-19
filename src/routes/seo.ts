import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  createSeoMetaSchema, 
  updateSeoMetaSchema, 
  slugUniquenessSchema 
// @ts-ignore - compiled JS extension
} from '../schemas/seo.schema.js';
// @ts-ignore - compiled JS extension
import { SeoValidationService } from '../services/seo-validation.service.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /admin/seo/lighthouse - List latest Lighthouse audits
router.get('/lighthouse', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    // If a lighthouseAudit table exists return real data, otherwise empty array
    if ((prisma as any).lighthouseAudit) {
      const audits = await (prisma as any).lighthouseAudit.findMany({
        orderBy: { fetchedAt: 'desc' },
        take: limit,
      });
      return res.json(audits);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error fetching Lighthouse audits:', err);
    return res.status(500).json({ error: 'Failed to fetch Lighthouse audits' });
  }
});

// GET /admin/seo/broken-links - List broken link reports
router.get('/broken-links', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    if ((prisma as any).brokenLink) {
      const links = await (prisma as any).brokenLink.findMany({
        orderBy: { checkedAt: 'desc' },
        take: limit,
      });
      return res.json(links);
    }
    return res.json([]);
  } catch (err) {
    console.error('Error fetching broken links:', err);
    return res.status(500).json({ error: 'Failed to fetch broken links' });
  }
});

// GET /admin/seo - Get all SEO metadata
router.get('/', async (req, res) => {
  try {
    const { entityType, page = 1, limit = 50 } = req.query;
    
    
    const where = entityType ? { entityType: entityType as string } : {};
    
    const [seoMetas, total] = await Promise.all([
      prisma.seoMeta.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit)
      }),
      prisma.seoMeta.count({ where })
    ]);

    res.json({
      data: seoMetas,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching SEO metadata:', error);
    
    // Handle database connection issues gracefully
    if (error.code === 'P1001' || error.code === 'P2021' || error.code === 'P2023') {
      // Database connection or table doesn't exist
      return res.json({
        data: [],
        pagination: {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 50,
          total: 0,
          pages: 0
        },
        message: 'SEO data not available. Please configure SEO metadata through the admin panel.'
      });
    }
    
    res.status(500).json({ error: 'Failed to fetch SEO metadata' });
  }
});

// GET /admin/seo/:id - Get specific SEO metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const seoMeta = await prisma.seoMeta.findUnique({
      where: { id }
    });

    if (!seoMeta) {
      return res.status(404).json({ error: 'SEO metadata not found' });
    }

    res.json(seoMeta);
  } catch (error: any) {
    console.error('Error fetching SEO metadata:', error);
    res.status(500).json({ error: 'Failed to fetch SEO metadata' });
  }
});

// GET /admin/seo/entity/:entityType/:entityId - Get SEO by entity
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const seoMeta = await prisma.seoMeta.findFirst({
      where: {
        entityType: entityType as string,
        entityId: entityId
      }
    });

    res.json(seoMeta || null);
  } catch (error: any) {
    console.error('Error fetching SEO by entity:', error);
    res.status(500).json({ error: 'Failed to fetch SEO metadata' });
  }
});

// GET /admin/seo/slug/check - Check slug uniqueness
router.get('/slug/check', async (req, res) => {
  try {
    const { slug, excludeId } = req.query;
    
    const validation = slugUniquenessSchema.parse({
      slug,
      excludeId
    });

    const existing = await prisma.seoMeta.findFirst({
      where: {
        slug: validation.slug,
        ...(excludeId && { id: { not: excludeId as string } })
      }
    });

    res.json({ 
      isUnique: !existing,
      message: existing ? 'Slug already exists' : 'Slug is available'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error checking slug uniqueness:', error);
    res.status(500).json({ error: 'Failed to check slug uniqueness' });
  }
});

// GET /admin/seo/validate - Validate SEO data
router.post('/validate', async (req, res) => {
  try {
    const validation = SeoValidationService.validateSeoData(req.body);
    res.json(validation);
  } catch (error: any) {
    console.error('Error validating SEO data:', error);
    res.status(500).json({ error: 'Failed to validate SEO data' });
  }
});

// GET /admin/seo/defaults - Get default SEO data for entity type
router.get('/defaults', async (req, res) => {
  try {
    const { entityType, entityId } = req.query;
    
    let entityData = null;
    if (entityType === 'PUPPY' && entityId) {
      entityData = await prisma.puppy.findUnique({
        where: { id: entityId as string },
        select: { name: true, breed: true, gender: true, color: true }
      });
    } else if (entityType === 'BREED' && entityId) {
      entityData = await prisma.breed.findUnique({
        where: { id: entityId as string },
        select: { name: true, description: true }
      });
    }

    const defaults = SeoValidationService.generateDefaultSeoData(
      entityType as string,
      entityId as string,
      entityData
    );
    
    res.json(defaults);
  } catch (error: any) {
    console.error('Error generating defaults:', error);
    res.status(500).json({ error: 'Failed to generate defaults' });
  }
});

// GET /admin/seo/audit - Audit SEO health
router.get('/audit', async (req, res) => {
  try {
    const seoDataList = await prisma.seoMeta.findMany({
      select: {
        entityType: true,
        entityId: true,
        metaTitle: true,
        metaDescription: true,
        focusKeywords: true,
        slug: true,
        canonicalUrl: true,
        robots: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true
      }
    });

    const audit = SeoValidationService.auditSeoHealth(seoDataList);
    res.json(audit);
  } catch (error: any) {
    console.error('Error auditing SEO:', error);
    res.status(500).json({ error: 'Failed to audit SEO' });
  }
});

// POST /admin/seo - Create SEO metadata
router.post('/', async (req, res) => {
  try {
    const validation = createSeoMetaSchema.parse(req.body);
    
    // Validate SEO quality
    const seoValidation = SeoValidationService.validateSeoData(validation);
    if (!seoValidation.isValid && seoValidation.errors.length > 0) {
      return res.status(400).json({ 
        error: 'SEO validation failed',
        validation: seoValidation
      });
    }
    
    // Check slug uniqueness if provided
    if (validation.slug) {
      const existing = await prisma.seoMeta.findFirst({
        where: { slug: validation.slug }
      });
      
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const seoMeta = await prisma.seoMeta.create({
      data: {
        id: `seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...validation,
        entityId: validation.entityId || `${validation.entityType}_${Date.now()}`,
        updatedAt: new Date()
      }
    });

    res.status(201).json({ 
      data: seoMeta,
      validation: seoValidation,
      message: 'SEO metadata created successfully'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating SEO metadata:', error);
    res.status(500).json({ error: 'Failed to create SEO metadata' });
  }
});

// PUT /admin/seo/:id - Update SEO metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Sanitize incoming body: convert explicit nulls to types Zod expects
    const rawBody: any = { ...(req.body || {}) };
    const emptyStringFields = ['canonicalUrl', 'ogImage'];
    const undefFields = ['metaTitle', 'metaDescription', 'ogTitle', 'ogDescription', 'slug', 'entityId', 'entityType', 'robots', 'schemaType'];

    for (const key of Object.keys(rawBody)) {
      if (rawBody[key] === null) {
        if (emptyStringFields.includes(key)) rawBody[key] = '';
        else if (key === 'focusKeywords') rawBody[key] = [];
        else rawBody[key] = undefined;
      }
    }

    const validation = updateSeoMetaSchema.parse(rawBody);
    // Load existing record and merge with incoming partial update
    const existingSeo = await prisma.seoMeta.findUnique({ where: { id } });
    if (!existingSeo) {
      return res.status(404).json({ error: 'SEO metadata not found' });
    }

    const merged = { ...existingSeo, ...validation };

    // Validate SEO quality against the merged data so partial updates are allowed
    const seoValidation = SeoValidationService.validateSeoData(merged as any);
    if (!seoValidation.isValid && seoValidation.errors.length > 0) {
      return res.status(400).json({ 
        error: 'SEO validation failed',
        validation: seoValidation
      });
    }
    
    // Check slug uniqueness if slug is being updated
    if (validation.slug) {
      const existing = await prisma.seoMeta.findFirst({
        where: {
          slug: validation.slug,
          id: { not: id }
        }
      });
      
      if (existing) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const seoMeta = await prisma.seoMeta.update({
      where: { id },
      data: {
        ...validation,
        updatedAt: new Date()
      }
    });

    res.json({ 
      data: seoMeta,
      validation: seoValidation,
      message: 'SEO metadata updated successfully'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'SEO metadata not found' });
    }
    console.error('Error updating SEO metadata:', error);
    res.status(500).json({ error: 'Failed to update SEO metadata' });
  }
});

// DELETE /admin/seo/:id - Delete SEO metadata
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.seoMeta.delete({
      where: { id }
    });

    res.json({ message: 'SEO metadata deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'SEO metadata not found' });
    }
    console.error('Error deleting SEO metadata:', error);
    res.status(500).json({ error: 'Failed to delete SEO metadata' });
  }
});

// GET /admin/seo/bulk - Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { operation, data } = req.body;
    
    switch (operation) {
      case 'create':
        const created = await prisma.seoMeta.createMany({
          data: data.map((item: any) => createSeoMetaSchema.parse(item)),
          skipDuplicates: true
        });
        res.json({ created: created.count });
        break;
        
      case 'update':
        const updated = await Promise.all(
          data.map((item: any) => 
            prisma.seoMeta.update({
              where: { id: item.id },
              data: updateSeoMetaSchema.parse(item)
            })
          )
        );
        res.json({ updated: updated.length });
        break;
        
      case 'delete':
        const deleted = await prisma.seoMeta.deleteMany({
          where: { id: { in: data.ids } }
        });
        res.json({ deleted: deleted.count });
        break;
        
      default:
        res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error: any) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// GET /api/seo/public/:entityType/:entityId - Public endpoint for frontend
router.get('/public/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    const seoMeta = await prisma.seoMeta.findFirst({
      where: {
        entityType: entityType as string,
        entityId: entityId,
        robots: 'INDEX' // Only return indexable content
      },
      select: {
        metaTitle: true,
        metaDescription: true,
        ogTitle: true,
        ogDescription: true,
        ogImage: true,
        canonicalUrl: true,
        robots: true,
        schemaType: true,
        focusKeywords: true
      }
    });

    res.json(seoMeta || {});
  } catch (error: any) {
    console.error('Error fetching public SEO data:', error);
    res.status(500).json({ error: 'Failed to fetch SEO data' });
  }
});

export default router;
