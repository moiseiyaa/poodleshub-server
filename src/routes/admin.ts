import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router = Router();

/**
 * POST /api/admin/login
 * Admin login - returns JWT on valid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() }});

    const token = jwt.sign(
      { userId: admin.id, role: admin.role, email: admin.email },
      env.ADMIN_SECRET_KEY,
      { expiresIn: '2h' }
    );

    res.json({ token, user: { email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role } });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
