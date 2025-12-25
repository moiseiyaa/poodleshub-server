import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const router = Router();

function verifyAdminJWT(req: Request, res: Response, next: Function) {
  const token = (req.headers['admin_token'] || req.cookies['admin_token'] || req.headers['authorization']) as string | undefined;
  if (!token) return res.status(401).json({ error: 'Missing admin token' });
  try {
    jwt.verify(token.replace('Bearer ', ''), env.ADMIN_SECRET_KEY);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

function toCsv(rows: any[]): string {
  if (rows.length === 0) return '';
  const header = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const str = String(v);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((h) => escape((row as any)[h])).join(','));
  }
  return lines.join('\n');
}

router.get('/', verifyAdminJWT, async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string | undefined) ?? 'applications';
    let rows: any[] = [];
    if (type === 'puppies') {
      const puppies = await prisma.puppy.findMany();
      rows = puppies.map((p) => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        gender: p.gender,
        birthDate: p.birthDate.toISOString(),
        price: p.price,
        status: p.status,
        color: p.color,
        generation: p.generation,
        createdAt: p.createdAt.toISOString(),
      }));
    } else {
      const apps = await prisma.application.findMany();
      rows = apps.map((a) => ({
        id: a.id,
        displayId: a.displayId,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        status: a.status,
        puppyId: a.puppyId,
        createdAt: a.createdAt.toISOString(),
      }));
    }

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-${Date.now()}.csv`);
    return res.send(csv);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
