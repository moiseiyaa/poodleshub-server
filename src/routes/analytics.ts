import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

/**
 * GET /api/analytics/overview
 * Return simple dashboard counts.
 */
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [totalPuppies, availablePuppies, reservedPuppies, adoptedPuppies] = await Promise.all([
      prisma.puppy.count(),
      prisma.puppy.count({ where: { status: 'available' } }),
      prisma.puppy.count({ where: { status: 'reserved' } }),
      prisma.puppy.count({ where: { status: 'adopted' } }),
    ]);

    const [totalApplications, pendingApplications, approvedApplications, revenue] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: 'submitted' } }),
      prisma.application.count({ where: { status: 'approved' } }),
      prisma.puppy.aggregate({ _sum: { price: true }, where: { status: { in: ['reserved', 'adopted'] } } }),
    ]);

    res.json({
      totalPuppies,
      availablePuppies,
      reservedPuppies,
      adoptedPuppies,
      totalApplications,
      pendingApplications,
      approvedApplications,
      totalRevenue: revenue._sum.price || 0,
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
