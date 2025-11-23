import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * GET /api/breeds
 * Fetch all breeds
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const breeds = await prisma.breed.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(breeds);
  } catch (error) {
    console.error('Error fetching breeds:', error);
    res.status(500).json({ error: 'Failed to fetch breeds' });
  }
});

/**
 * GET /api/breeds/:id
 * Fetch breed by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const breed = await prisma.breed.findUnique({
      where: { id },
    });

    if (!breed) {
      return res.status(404).json({ error: 'Breed not found' });
    }

    res.json(breed);
  } catch (error) {
    console.error('Error fetching breed:', error);
    res.status(500).json({ error: 'Failed to fetch breed' });
  }
});

export default router;
