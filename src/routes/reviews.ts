import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const router = Router();

function verifyAdminJWT(req: Request, res: Response, next: Function) {
  const token = (req.headers['admin_token'] || req.headers['authorization']) as string | undefined;
  if (!token) return res.status(401).json({ error: 'Missing admin token' });
  try {
    jwt.verify(token.replace('Bearer ', ''), env.ADMIN_SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

/**
 * GET /api/reviews?puppyId=xxx  -> list reviews (public)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { puppyId } = req.query;
    const where: any = {};
    if (puppyId) where.puppyId = puppyId as string;
    const reviews = await prisma.testimonial.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews  (admin authenticated)
 */
router.post('/', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { puppyId, text, rating, adminName } = req.body;
    if (!puppyId || !text) return res.status(400).json({ error: 'puppyId and text are required' });
    const review = await prisma.testimonial.create({
      data: {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: adminName || 'Anonymous',
        text,
        rating: rating ? Number(rating) : 5,
        puppyName: puppyId || 'Unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    });
    res.status(201).json(review);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * DELETE /api/reviews/:id  (admin)
 */
router.delete('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Review not found' });
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
