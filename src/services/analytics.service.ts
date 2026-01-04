import { prisma } from '../lib/prisma';

/**
 * Analytics service for querying real-time analytics data
 * Provides dashboard metrics directly from database
 */

// TypeScript workaround: AnalyticsEvent model may not be in generated types yet
// Cast to any for now, will be properly typed once Prisma regenerates
type PrismaAnalytics = typeof prisma & { analyticsEvent?: any };
const analytics = prisma as PrismaAnalytics;

export interface AnalyticsSummary {
  pageViews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  eventBreakdown: Record<string, number>;
  conversionRate: number;
  avgSessionDuration?: number;
}

/**
 * Get analytics summary for the past N days
 */
export const getAnalyticsSummary = async (days: number = 7): Promise<AnalyticsSummary> => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Total page views
  const pageViews = await analytics.analyticsEvent!.count({
    where: {
      timestamp: { gte: sinceDate },
      eventType: 'pageView'
    }
  });

  // Unique visitors (distinct users)
  const uniqueVisitors = await analytics.analyticsEvent!.findMany({
    where: {
      timestamp: { gte: sinceDate }
    },
    distinct: ['userId'],
    select: { userId: true }
  }).then((events: Array<{ userId: string | null }>) => {
    const uniqueIds = new Set(events.map((e: { userId: string | null }) => e.userId).filter(Boolean));
    return uniqueIds.size;
  });

  // Top pages by view count
  const topPagesRaw = await analytics.analyticsEvent!.groupBy({
    by: ['pathname'],
    _count: { id: true },
    where: {
      timestamp: { gte: sinceDate },
      eventType: 'pageView'
    },
    orderBy: { _count: { id: 'desc' } },
    take: 10
  });

  const topPages = topPagesRaw.map((p: { pathname: string; _count: { id: number } }) => ({
    path: p.pathname,
    views: p._count.id
  }));

  // Event type breakdown
  const eventBreakdownRaw = await analytics.analyticsEvent!.groupBy({
    by: ['eventType'],
    _count: { id: true },
    where: {
      timestamp: { gte: sinceDate }
    }
  });

  const eventBreakdown: Record<string, number> = {};
  eventBreakdownRaw.forEach((e: { eventType: string; _count: { id: number } }) => {
    eventBreakdown[e.eventType] = e._count.id;
  });

  // Get application count for conversion rate
  const inquiries = eventBreakdown['inquiry'] || 0;
  const conversionRate = pageViews > 0 ? (inquiries / pageViews) * 100 : 0;

  return {
    pageViews,
    uniqueVisitors,
    topPages,
    eventBreakdown,
    conversionRate: parseFloat(conversionRate.toFixed(2))
  };
};

/**
 * Get page views over time (daily buckets)
 */
export const getPageViewsTrend = async (days: number = 7) => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await analytics.analyticsEvent!.findMany({
    where: {
      timestamp: { gte: sinceDate },
      eventType: 'pageView'
    },
    select: { timestamp: true }
  });

  // Group by day
  const trend: Record<string, number> = {};
  events.forEach((e: { timestamp: Date }) => {
    const day = e.timestamp.toISOString().split('T')[0];
    trend[day] = (trend[day] || 0) + 1;
  });

  return trend;
};

/**
 * Get conversion funnel (pageViews → inquiries → applications)
 */
export const getConversionFunnel = async (days: number = 30) => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [pageViews, inquiries, purchases] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        timestamp: { gte: sinceDate },
        eventType: 'pageView'
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        timestamp: { gte: sinceDate },
        eventType: 'inquiry'
      }
    }),
    prisma.analyticsEvent.count({
      where: {
        timestamp: { gte: sinceDate },
        eventType: 'purchase'
      }
    })
  ]);

  return {
    step1_pageViews: pageViews,
    step2_inquiries: inquiries,
    step3_purchases: purchases,
    conversionRate_inquiry: pageViews > 0 ? ((inquiries / pageViews) * 100).toFixed(2) : '0',
    conversionRate_purchase: inquiries > 0 ? ((purchases / inquiries) * 100).toFixed(2) : '0'
  };
};

/**
 * Get most popular pages
 */
export const getPopularPages = async (limit: number = 10, days: number = 7) => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const pages = await analytics.analyticsEvent!.groupBy({
    by: ['pathname'],
    _count: { id: true },
    where: {
      timestamp: { gte: sinceDate },
      eventType: 'pageView'
    },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  return pages.map((p: { pathname: string; _count: { id: number } }) => ({
    pathname: p.pathname,
    views: p._count.id
  }));
};

/**
 * Get events by type
 */
export const getEventsByType = async (eventType: string, days: number = 7) => {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return analytics.analyticsEvent!.findMany({
    where: {
      timestamp: { gte: sinceDate },
      eventType
    },
    select: {
      id: true,
      pathname: true,
      timestamp: true,
      userId: true,
      metadata: true
    },
    orderBy: { timestamp: 'desc' },
    take: 100
  });
};

/**
 * Log a custom event
 */
export const logEvent = async (
  eventType: string,
  pathname: string,
  data?: { userId?: string; metadata?: Record<string, any>; userAgent?: string }
) => {
  return analytics.analyticsEvent!.create({
    data: {
      eventType,
      pathname,
      userId: data?.userId || null,
      userAgent: data?.userAgent || null,
      metadata: data?.metadata && Object.keys(data.metadata).length > 0 ? data.metadata : undefined
    }
  });
};

/**
 * Clear old analytics data (older than N days)
 * Run this periodically to keep DB clean
 */
export const clearOldAnalytics = async (olderThanDays: number = 90) => {
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await analytics.analyticsEvent!.deleteMany({
    where: {
      timestamp: { lt: cutoffDate }
    }
  });

  return result.count;
};
