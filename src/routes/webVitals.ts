import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAdminJWT } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/seo/web-vitals - latest 100 entries (admin)
router.get('/', verifyAdminJWT, async (req, res) => {
  try {
    const data = await prisma.webVital.findMany({
      orderBy: { fetchedAt: 'desc' },
      take: 100,
    });
    res.json(data);
  } catch (err) {
    console.error('WebVitals fetch error', err);
    res.status(500).json({ error: 'Failed to fetch web vitals' });
  }
});

export default router;
