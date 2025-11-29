import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Request, Response } from 'express';

const router = Router();

function verifyAdminJWT(req: Request, res: Response, next: Function) {
  const token = req.headers['admin_token'] || req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  try {
    const payload = jwt.verify(token.replace('Bearer ', ''), env.ADMIN_SECRET_KEY);
    // Optionally check role, e.g. if (payload.role !== 'admin') ...
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

/**
 * GET /api/puppies
 * Fetch all puppies with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { breed, status, gender, color } = req.query;

    const where: Record<string, any> = {};

    if (breed) where.breed = breed as string;
    if (status) where.status = status as string;
    if (gender) where.gender = gender as string;
    if (color) where.color = color as string;

    const puppies = await prisma.puppy.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to match frontend expected format
    const transformedPuppies = puppies.map(puppy => ({
      ...puppy,
      parents: {
        mother: puppy.damId || '/images/parents/placeholder-dam.jpg'
      }
    }));

    res.json(transformedPuppies);
  } catch (error) {
    console.error('Error fetching puppies:', error);
    res.status(500).json({ error: 'Failed to fetch puppies' });
  }
});

/**
 * GET /api/puppies/:id
 * Fetch a single puppy by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const puppy = await prisma.puppy.findUnique({
      where: { id },
    });

    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    // Transform data to match frontend expected format
    const transformedPuppy = {
      ...puppy,
      parents: {
        mother: puppy.damId || '/images/parents/placeholder-dam.jpg'
      }
    };

    res.json(transformedPuppy);
  } catch (error) {
    console.error('Error fetching puppy:', error);
    res.status(500).json({ error: 'Failed to fetch puppy' });
  }
});

/**
 * GET /api/puppies/breed/:breed
 * Fetch puppies by breed
 */
router.get('/breed/:breed', async (req, res) => {
  try {
    const { breed } = req.params;

    const puppies = await prisma.puppy.findMany({
      where: { breed },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to match frontend expected format
    const transformedPuppies = puppies.map(puppy => ({
      ...puppy,
      parents: {
        mother: puppy.damId || '/images/parents/placeholder-dam.jpg'
      }
    }));

    res.json(transformedPuppies);
  } catch (error) {
    console.error('Error fetching puppies by breed:', error);
    res.status(500).json({ error: 'Failed to fetch puppies' });
  }
});

/**
 * GET /api/puppies/available
 * Fetch only available puppies
 */
router.get('/status/available', async (req, res) => {
  try {
    const puppies = await prisma.puppy.findMany({
      where: { status: 'available' },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data to match frontend expected format
    const transformedPuppies = puppies.map(puppy => ({
      ...puppy,
      parents: {
        mother: puppy.damId || '/images/parents/placeholder-dam.jpg'
      }
    }));

    res.json(transformedPuppies);
  } catch (error) {
    console.error('Error fetching available puppies:', error);
    res.status(500).json({ error: 'Failed to fetch available puppies' });
  }
});

router.patch('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid status' });
    }
    const puppy = await prisma.puppy.findUnique({ where: { id } });
    if (!puppy) {
      return res.status(404).json({ error: 'Puppy not found' });
    }
    const updated = await prisma.puppy.update({ where: { id }, data: { status } });
    res.json({ message: 'Puppy status updated', puppy: updated });
  } catch (err) {
    console.error('Error updating puppy:', err);
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

export default router;
