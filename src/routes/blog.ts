import express from 'express';
import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

const router = express.Router();

const createBlogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(false),
  publishedAt: z.string().optional()
});

const updateBlogSchema = createBlogSchema.partial();

function verifyAdminJWT(req: any, res: any, next: any) {
  const token = req.headers['admin_token'] || req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  next();
}

// List blogs (public) - only return published blogs
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.blog.findMany({ 
      where: { published: true },
      orderBy: { publishedAt: 'desc' } 
    });
    res.json({ data: posts });
  } catch (err: any) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Get single blog
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.blog.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json(post);
  } catch (err: any) {
    console.error('Error fetching blog:', err);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Create blog (admin)
router.post('/', verifyAdminJWT, async (req, res) => {
  try {
    const data = createBlogSchema.parse(req.body);
    const newPost = await prisma.blog.create({
      data: {
        id: `blog_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: data.title,
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt: data.excerpt || '',
        content: data.content || '',
        tags: data.tags || [],
        published: data.published || false,
        publishedAt: data.published ? new Date(data.publishedAt || Date.now()) : null,
        updatedAt: new Date()
      }
    });
    res.status(201).json({ data: newPost });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error creating blog:', err);
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update blog (admin)
router.put('/:id', verifyAdminJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = updateBlogSchema.parse(req.body);

    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Blog post not found' });

    const merged: any = { ...existing, ...parsed };
    
    // Set publishedAt only if published is true
    let publishedAtValue: Date | null = null;
    if (merged.published) {
      if (parsed.publishedAt) {
        publishedAtValue = new Date(parsed.publishedAt);
      } else if (!existing.publishedAt) {
        // Only set new date if it wasn't already published
        publishedAtValue = new Date();
      } else {
        // Keep existing publishedAt if republishing
        publishedAtValue = existing.publishedAt;
      }
    }

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title: merged.title,
        slug: merged.slug,
        excerpt: merged.excerpt,
        content: merged.content,
        tags: merged.tags || [],
        published: merged.published ?? false,
        publishedAt: publishedAtValue,
        updatedAt: new Date()
      }
    });

    res.json({ data: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete blog (admin)
router.delete('/:id', verifyAdminJWT, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

export default router;
