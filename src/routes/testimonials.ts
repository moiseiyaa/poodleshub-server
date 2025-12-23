import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const router = Router();

function verifyAdminJWT(req: Request, res: Response, next: Function) {
  const token = req.headers['admin_token'] || req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  try {
    jwt.verify(token.replace('Bearer ', ''), env.ADMIN_SECRET_KEY);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

// Fetch all testimonials
router.get('/', async (_req, res) => {
  try {
    const testimonialClient = (prisma as any)?.testimonial;
    if (!testimonialClient) {
      console.error('Prisma client does not contain `testimonial` model. Did you run `prisma generate`?');
      return res.status(500).json({ error: 'Prisma client missing Testimonial model. Run `npx prisma generate` and restart the server.' });
    }

    const testimonials = await testimonialClient.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json(testimonials);
  } catch (err) {
    console.error('Error fetching testimonials:', err);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

// Create testimonial (admin only)
router.post('/', verifyAdminJWT, async (req, res) => {
  try {
    const {
      name,
      location,
      rating,
      text,
      puppyName,
      puppyBreed,
      initials,
      date,
    } = req.body;

    if (!name || !text || !rating) {
      return res.status(400).json({ error: 'Missing required testimonial fields' });
    }

    const testimonialClient = (prisma as any)?.testimonial;
    if (!testimonialClient) {
      console.error('Prisma client does not contain `testimonial` model. Did you run `prisma generate`?');
      return res.status(500).json({ error: 'Prisma client missing Testimonial model. Run `npx prisma generate` and restart the server.' });
    }

    const testimonial = await testimonialClient.create({
      data: {
        name,
        location,
        rating: Number(rating),
        text,
        puppyName,
        puppyBreed,
        initials,
        date: date ? new Date(date) : null,
      },
    });

    res.status(201).json(testimonial);
  } catch (err) {
    console.error('Error creating testimonial:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
});

// Update testimonial (admin only)
router.patch('/:id', verifyAdminJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      location,
      rating,
      text,
      puppyName,
      puppyBreed,
      initials,
      date,
    } = req.body;

    const testimonialClient = (prisma as any)?.testimonial;
    if (!testimonialClient) {
      console.error('Prisma client does not contain `testimonial` model. Did you run `prisma generate`?');
      return res.status(500).json({ error: 'Prisma client missing Testimonial model. Run `npx prisma generate` and restart the server.' });
    }

    const existing = await testimonialClient.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    const testimonial = await testimonialClient.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        location: location ?? existing.location,
        rating: rating !== undefined ? Number(rating) : existing.rating,
        text: text ?? existing.text,
        puppyName: puppyName ?? existing.puppyName,
        puppyBreed: puppyBreed ?? existing.puppyBreed,
        initials: initials ?? existing.initials,
        date: date !== undefined ? (date ? new Date(date) : null) : existing.date,
      },
    });

    res.json(testimonial);
  } catch (err) {
    console.error('Error updating testimonial:', err);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
});

// Delete testimonial (admin only)
router.delete('/:id', verifyAdminJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const testimonialClient = (prisma as any)?.testimonial;
    if (!testimonialClient) {
      console.error('Prisma client does not contain `testimonial` model. Did you run `prisma generate`?');
      return res.status(500).json({ error: 'Prisma client missing Testimonial model. Run `npx prisma generate` and restart the server.' });
    }

    await testimonialClient.delete({ where: { id } });
    res.json({ message: 'Testimonial deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    console.error('Error deleting testimonial:', err);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
});

export default router;

