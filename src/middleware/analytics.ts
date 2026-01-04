import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

// TypeScript workaround: AnalyticsEvent model may not be in generated types yet
type PrismaAnalytics = typeof prisma & { analyticsEvent?: any };
const analytics = prisma as PrismaAnalytics;

/**
 * Analytics middleware that logs page views and visitor events
 * Runs on every request to track real-time user activity
 */
export const analyticsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for static assets, health checks, and sensitive routes
  const skipPaths = [
    '/health',
    '/metrics',
    '/api/admin',
    '/uploads',
    '/public'
  ];

  const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
  if (shouldSkip) return next();

  // Extract useful data from request
  const pathname = req.path;
  const userAgent = req.headers['user-agent'];
  const referer = req.headers['referer'];
  const userId = req.query.sessionId as string || req.cookies?.sessionId;

  // Determine event type
  let eventType = 'pageView';
  if (req.method === 'POST') {
    if (pathname.includes('/application')) eventType = 'inquiry';
    if (pathname.includes('/contact')) eventType = 'contact';
    if (pathname.includes('/cart')) eventType = 'purchase';
  }

  // Optionally extract metadata from POST body
  let metadata = {};
  if (req.method === 'POST' && req.body) {
    metadata = {
      method: req.method,
      bodyKeys: Object.keys(req.body || {})
    };
  }

  // Fire-and-forget logging (don't block response)
  setImmediate(async () => {
    try {
      await analytics.analyticsEvent!.create({
        data: {
          eventType,
          pathname,
          userId: userId || null,
          userAgent: userAgent?.substring(0, 500) || null,
          referer: referer?.substring(0, 500) || null,
          metadata: Object.keys(metadata).length > 0 ? metadata : undefined
        }
      });
    } catch (err) {
      // Silently fail analytics logging so it doesn't impact application
      console.error('Analytics logging error:', err);
    }
  });

  next();
};
