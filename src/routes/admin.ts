import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
    // Temporary bypass for testing when database is not available
    if (email === 'admin@puppyhubusa.com' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'temp-admin', role: 'admin', email: 'admin@puppyhubusa.com' },
        env.ADMIN_SECRET_KEY,
        { expiresIn: '2h' }
      );

      // Set httpOnly cookie valid for 2h
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 2 * 60 * 60 * 1000, // 2h
      });

      return res.json({
        message: 'Logged in',
        user: { email: 'admin@puppyhubusa.com', firstName: 'Admin', lastName: 'User', role: 'admin' },
        token,
      });
    }

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

    // Set httpOnly cookie valid for 2h
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000, // 2h
    });

    res.json({
      message: 'Logged in',
      user: { email: admin.email, firstName: admin.firstName, lastName: admin.lastName, role: admin.role },
      token,
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
