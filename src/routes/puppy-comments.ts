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

// Get all comments for a puppy
router.get('/puppy/:puppyId', async (req: Request, res: Response) => {
  try {
    const { puppyId } = req.params;
    const comments = await prisma.puppyComment.findMany({
      where: {
        puppyId,
        isVisible: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment (admin only)
router.post('/', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { puppyId, content, author, isVisible } = req.body;

    if (!puppyId || !content) {
      return res.status(400).json({ error: 'Puppy ID and content are required' });
    }

    // Verify puppy exists
    const puppy = await prisma.puppy.findUnique({ where: { id: puppyId } });
    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    const comment = await prisma.puppyComment.create({
      data: {
        puppyId,
        content,
        author: author || 'Admin',
        isVisible: isVisible !== undefined ? isVisible : true,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment (admin only)
router.patch('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, author, isVisible } = req.body;

    const existing = await prisma.puppyComment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const comment = await prisma.puppyComment.update({
      where: { id },
      data: {
        content: content ?? existing.content,
        author: author ?? existing.author,
        isVisible: isVisible !== undefined ? isVisible : existing.isVisible,
      },
    });

    res.json(comment);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment (admin only)
router.delete('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.puppyComment.delete({ where: { id } });
    res.json({ message: 'Comment deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Comment not found' });
    }
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;

