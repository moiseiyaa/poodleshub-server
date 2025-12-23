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
    const transformedPuppies = puppies.map((puppy) => ({
      ...puppy,
      parents: {
        mother: puppy.damImage || '/images/parents/placeholder-dam.jpg',
      },
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
        mother: puppy.damImage || '/images/parents/placeholder-dam.jpg',
      },
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
    const transformedPuppies = puppies.map((puppy) => ({
      ...puppy,
      parents: {
        mother: puppy.damImage || '/images/parents/placeholder-dam.jpg',
      },
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
    const transformedPuppies = puppies.map((puppy) => ({
      ...puppy,
      parents: {
        mother: puppy.damImage || '/images/parents/placeholder-dam.jpg',
      },
    }));

    res.json(transformedPuppies);
  } catch (error) {
    console.error('Error fetching available puppies:', error);
    res.status(500).json({ error: 'Failed to fetch available puppies' });
  }
});

/**
 * Create a new puppy (admin)
 */
router.post('/', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const {
      name,
      breed,
      gender,
      birthDate,
      price,
      status = 'available',
      color,
      generation,
      vaccinations = [],
      notes,
      images = [],
      damImage,
      sireId,
      damId,
    } = req.body;

    if (!name || !breed || !gender || !birthDate || price === undefined || !color || !generation) {
      return res.status(400).json({ error: 'Missing required puppy fields' });
    }

    const puppy = await prisma.puppy.create({
      data: {
        name,
        breed,
        gender,
        birthDate: new Date(birthDate),
        price: Number(price),
        status,
        color,
        generation,
        vaccinations,
        notes,
        images,
        damImage,
        sireId,
        damId,
      },
    });

    res.status(201).json(puppy);
  } catch (err) {
    console.error('Error creating puppy:', err);
    res.status(500).json({ error: 'Failed to create puppy' });
  }
});

/**
 * Update puppy fields (admin)
 */
router.patch('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      breed,
      gender,
      birthDate,
      price,
      status,
      color,
      generation,
      vaccinations,
      notes,
      images,
      damImage,
      sireId,
      damId,
    } = req.body;

    const existing = await prisma.puppy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Puppy not found' });
    }

    const updated = await prisma.puppy.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        breed: breed ?? existing.breed,
        gender: gender ?? existing.gender,
        birthDate: birthDate ? new Date(birthDate) : existing.birthDate,
        price: price !== undefined ? Number(price) : existing.price,
        status: status ?? existing.status,
        color: color ?? existing.color,
        generation: generation ?? existing.generation,
        vaccinations: vaccinations ?? existing.vaccinations,
        notes: notes ?? existing.notes,
        images: images ?? existing.images,
        damImage: damImage ?? existing.damImage,
        sireId: sireId ?? existing.sireId,
        damId: damId ?? existing.damId,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating puppy:', err);
    res.status(500).json({ error: 'Failed to update puppy' });
  }
});

/**
 * Delete puppy (admin)
 */
router.delete('/:id', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.puppy.delete({ where: { id } });
    res.json({ message: 'Puppy deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Puppy not found' });
    }
    console.error('Error deleting puppy:', err);
    res.status(500).json({ error: 'Failed to delete puppy' });
  }
});

/**
 * Legacy status-only endpoint (admin)
 */
router.patch('/:id/status', verifyAdminJWT, async (req: Request, res: Response) => {
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
    console.error('Error updating puppy status:', err);
    res.status(500).json({ error: 'Failed to update puppy status' });
  }
});

export default router;
