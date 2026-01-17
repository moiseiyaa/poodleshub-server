import express from 'express';
import { PrismaClient } from '@prisma/client';

// Simple JWT header check (same logic as other admin routes)
function verifyAdminJWT(req: any, res: any, next: any) {
  const token = req.headers['admin_token'] || req.headers['authorization'];
  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Missing admin token' });
  }
  next();
}

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
