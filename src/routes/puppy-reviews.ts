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

// Get all reviews for a puppy (only approved ones for public)
router.get('/puppy/:puppyId', async (req: Request, res: Response) => {
  try {
    const { puppyId } = req.params;
    const { includePending } = req.query; // Admin can see pending reviews

    const where: any = { puppyId };
    if (!includePending) {
      where.isApproved = true;
    }

    const reviews = await prisma.puppyReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create review (public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { puppyId, name, email, rating, title, content } = req.body;

    if (!puppyId || !name || !rating || !content) {
      return res.status(400).json({ error: 'Puppy ID, name, rating, and content are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify puppy exists
    const puppy = await prisma.puppy.findUnique({ where: { id: puppyId } });
    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    const review = await prisma.puppyReview.create({
      data: {
        puppyId,
        name,
        email,
        rating: Number(rating),
        title,
        content,
        isApproved: false, // Requires admin approval
      },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Approve/reject review (admin only)
router.patch('/:id/approve', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const existing = await prisma.puppyReview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = await prisma.puppyReview.update({
      where: { id },
      data: { isApproved: isApproved !== undefined ? isApproved : true },
    });

    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Update review (admin only)
router.patch('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, rating, title, content, isApproved } = req.body;

    const existing = await prisma.puppyReview.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const review = await prisma.puppyReview.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        rating: rating !== undefined ? Number(rating) : existing.rating,
        title: title ?? existing.title,
        content: content ?? existing.content,
        isApproved: isApproved !== undefined ? isApproved : existing.isApproved,
      },
    });

    res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete review (admin only)
router.delete('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.puppyReview.delete({ where: { id } });
    res.json({ message: 'Review deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Review not found' });
    }
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;

