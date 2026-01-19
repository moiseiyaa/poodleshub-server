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
import GA4Service from '../services/ga4.service.js';

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
  }
});

// ============================================================================
// GOOGLE ANALYTICS 4 ENDPOINTS
// ============================================================================

/**
 * GET /api/analytics/ga4/status
 * Check if GA4 is configured
 */
router.get('/ga4/status', async (_req: Request, res: Response) => {
  try {
    const isConfigured = GA4Service.isGA4Configured();
    res.json({
      configured: isConfigured,
      message: isConfigured 
        ? 'GA4 is properly configured' 
        : 'GA4 requires GA4_PROPERTY_ID and Google service account credentials'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/ga4/realtime
 * Get real-time active users
 */
router.get('/ga4/realtime', async (_req: Request, res: Response) => {
  try {
    const data = await GA4Service.getRealTimeActiveUsers();
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching real-time data:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch real-time data' });
  }
});

/**
 * GET /api/analytics/ga4/traffic
 * Get comprehensive traffic analytics from GA4
 * Query params: startDate (default '30daysAgo'), endDate (default 'today')
 */
router.get('/ga4/traffic', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getTrafficAnalytics(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching GA4 traffic:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch GA4 traffic data' });
  }
});

/**
 * GET /api/analytics/ga4/top-pages
 * Get top performing pages
 * Query params: startDate, endDate, limit
 */
router.get('/ga4/top-pages', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const data = await GA4Service.getTopPages(startDate, endDate, limit);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching top pages:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch top pages' });
  }
});

/**
 * GET /api/analytics/ga4/traffic-sources
 * Get traffic sources breakdown
 * Query params: startDate, endDate
 */
router.get('/ga4/traffic-sources', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getTrafficSources(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching traffic sources:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch traffic sources' });
  }
});

/**
 * GET /api/analytics/ga4/demographics
 * Get user demographics (age, gender)
 * Query params: startDate, endDate
 */
router.get('/ga4/demographics', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getUserDemographics(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching demographics:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch demographics' });
  }
});

/**
 * GET /api/analytics/ga4/devices
 * Get device breakdown
 * Query params: startDate, endDate
 */
router.get('/ga4/devices', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getDeviceBreakdown(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching device data:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch device data' });
  }
});

/**
 * GET /api/analytics/ga4/geographic
 * Get geographic data (countries, cities)
 * Query params: startDate, endDate
 */
router.get('/ga4/geographic', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getGeographicData(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching geographic data:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch geographic data' });
  }
});

/**
 * GET /api/analytics/ga4/events
 * Get event tracking data
 * Query params: startDate, endDate, limit
 */
router.get('/ga4/events', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    const limit = parseInt(req.query.limit as string) || 20;
    
    const data = await GA4Service.getEventTracking(startDate, endDate, limit);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch event data' });
  }
});

/**
 * GET /api/analytics/ga4/landing-exit-pages
 * Get landing pages and exit pages
 * Query params: startDate, endDate
 */
router.get('/ga4/landing-exit-pages', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getLandingAndExitPages(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching landing/exit pages:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch landing/exit pages' });
  }
});

/**
 * GET /api/analytics/ga4/conversions
 * Get conversion tracking data
 * Query params: startDate, endDate
 */
router.get('/ga4/conversions', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getConversions(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching conversions:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch conversions' });
  }
});

/**
 * GET /api/analytics/ga4/performance
 * Get page performance metrics
 * Query params: startDate, endDate
 */
router.get('/ga4/performance', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getPagePerformance(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching performance data:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch performance data' });
  }
});

/**
 * GET /api/analytics/ga4/engagement
 * Get user engagement metrics
 * Query params: startDate, endDate
 */
router.get('/ga4/engagement', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const data = await GA4Service.getUserEngagement(startDate, endDate);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching engagement data:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch engagement data' });
  }
});

/**
 * GET /api/analytics/ga4/comprehensive
 * Get all analytics data in one request
 * Query params: startDate, endDate
 */
router.get('/ga4/comprehensive', async (req: Request, res: Response) => {
  try {
    const startDate = (req.query.startDate as string) || '30daysAgo';
    const endDate = (req.query.endDate as string) || 'today';
    
    const [
      realtime,
      traffic,
      topPages,
      sources,
      demographics,
      devices,
      geographic,
      events,
      landingExitPages,
      conversions,
      performance,
      engagement,
    ] = await Promise.all([
      GA4Service.getRealTimeActiveUsers(),
      GA4Service.getTrafficAnalytics(startDate, endDate),
      GA4Service.getTopPages(startDate, endDate, 10),
      GA4Service.getTrafficSources(startDate, endDate),
      GA4Service.getUserDemographics(startDate, endDate),
      GA4Service.getDeviceBreakdown(startDate, endDate),
      GA4Service.getGeographicData(startDate, endDate),
      GA4Service.getEventTracking(startDate, endDate, 20),
      GA4Service.getLandingAndExitPages(startDate, endDate),
      GA4Service.getConversions(startDate, endDate),
      GA4Service.getPagePerformance(startDate, endDate),
      GA4Service.getUserEngagement(startDate, endDate),
    ]);
    
    res.json({
      realtime,
      traffic,
      topPages,
      sources,
      demographics,
      devices,
      geographic,
      events,
      landingExitPages,
      conversions,
      performance,
      engagement,
      dateRange: { startDate, endDate },
    });
  } catch (err: any) {
    console.error('Error fetching comprehensive analytics:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch comprehensive analytics' });
  }
});

// GET /api/analytics/page-views-by-day - daily page views for given timeframe
router.get('/page-views-by-day', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Raw query is faster for aggregation than Prisma client API
    const result = await prisma.$queryRaw<any>`
      SELECT DATE("timestamp") AS date,
             COUNT(*)::int      AS count
      FROM   "AnalyticsEvent"
      WHERE  "eventType" = 'pageView'
        AND  "timestamp" >= ${since}
      GROUP  BY DATE("timestamp")
      ORDER  BY date ASC;
    `;

    res.json(result);
  } catch (err) {
    /* eslint-disable no-console */
    console.error('Error fetching page views by day:', err);
    res.status(500).json({ error: 'Failed to fetch page views by day' });
  }
});

export default router;

