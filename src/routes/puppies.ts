import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

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

    res.json(puppies);
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

    res.json(puppy);
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

    res.json(puppies);
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

    res.json(puppies);
  } catch (error) {
    console.error('Error fetching available puppies:', error);
    res.status(500).json({ error: 'Failed to fetch available puppies' });
  }
});

export default router;
