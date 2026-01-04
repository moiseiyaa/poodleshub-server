import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import {
  getAnalyticsSummary,
  getPageViewsTrend,
  getConversionFunnel,
  getPopularPages,
  getEventsByType,
  logEvent,
  clearOldAnalytics
} from '../services/analytics.service.js';

const router = Router();

/**
 * GET /api/analytics/overview
 * Return dashboard with business metrics (puppies, applications, revenue)
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

/**
 * GET /api/analytics/traffic
 * Return real-time traffic analytics (page views, visitors, conversion rate)
 * Query params: days (default 7)
 */
router.get('/traffic', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const summary = await getAnalyticsSummary(days);

    res.json({
      timeframe: `${days} days`,
      summary
    });
  } catch (err) {
    console.error('Error fetching traffic analytics:', err);
    res.status(500).json({ error: 'Failed to fetch traffic analytics' });
  }
});

/**
 * GET /api/analytics/trend
 * Return page views trend over time
 * Query params: days (default 7)
 */
router.get('/trend', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const trend = await getPageViewsTrend(days);

    res.json(trend);
  } catch (err) {
    console.error('Error fetching trend:', err);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

/**
 * GET /api/analytics/funnel
 * Return conversion funnel (page views → inquiries → purchases)
 * Query params: days (default 30)
 */
router.get('/funnel', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const funnel = await getConversionFunnel(days);

    res.json(funnel);
  } catch (err) {
    console.error('Error fetching funnel:', err);
    res.status(500).json({ error: 'Failed to fetch funnel' });
  }
});

/**
 * GET /api/analytics/popular-pages
 * Return most visited pages
 * Query params: limit (default 10), days (default 7)
 */
router.get('/popular-pages', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const days = parseInt(req.query.days as string) || 7;
    const pages = await getPopularPages(limit, days);

    res.json(pages);
  } catch (err) {
    console.error('Error fetching popular pages:', err);
    res.status(500).json({ error: 'Failed to fetch popular pages' });
  }
});

/**
 * GET /api/analytics/events/:eventType
 * Return specific event type logs
 * Params: eventType (pageView, inquiry, contact, purchase)
 * Query params: days (default 7)
 */
router.get('/events/:eventType', async (req: Request, res: Response) => {
  try {
    const { eventType } = req.params;
    const days = parseInt(req.query.days as string) || 7;
    const events = await getEventsByType(eventType, days);

    res.json({
      eventType,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * POST /api/analytics/log
 * Manually log a custom event
 * Body: { eventType, pathname, userId?, metadata? }
 */
router.post('/log', async (req: Request, res: Response) => {
  try {
    const { eventType, pathname, userId, metadata } = req.body;

    if (!eventType || !pathname) {
      return res.status(400).json({ error: 'eventType and pathname required' });
    }

    const event = await logEvent(eventType, pathname, { userId, metadata });
    res.status(201).json(event);
  } catch (err) {
    console.error('Error logging event:', err);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

/**
 * POST /api/analytics/cleanup
 * Delete analytics older than N days (admin only)
 * Body: { olderThanDays? (default 90) }
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const { olderThanDays } = req.body;
    const deleted = await clearOldAnalytics(olderThanDays || 90);

    res.json({
      message: `Deleted ${deleted} old analytics events`,
      deletedCount: deleted
    });
  } catch (err) {
    console.error('Error cleaning up analytics:', err);
    res.status(500).json({ error: 'Failed to cleanup analytics' });

export default router;
