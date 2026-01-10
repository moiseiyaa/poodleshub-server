import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { google } from 'googleapis';

/**
 * Google Analytics 4 Data API Service
 * Fetches real-time analytics data from GA4
 * 
 * Setup required:
 * 1. Set GA4_PROPERTY_ID in environment variables
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS path to service account key JSON
 * OR provide credentials directly via GOOGLE_SERVICE_ACCOUNT_KEY
 */

let analyticsDataClient: BetaAnalyticsDataClient | null = null;
let analyticsAdmin: any = null;

// Initialize GA4 client
const initializeGA4Client = () => {
  if (analyticsDataClient) return analyticsDataClient;

  try {
    // Option 1: Using service account key file
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      analyticsDataClient = new BetaAnalyticsDataClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });
    }
    // Option 2: Using service account key JSON string
    else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials,
      });
    }
    // Option 3: Using default credentials (for GCP environments)
    else {
      analyticsDataClient = new BetaAnalyticsDataClient();
    }

    return analyticsDataClient;
  } catch (error) {
    console.error('Failed to initialize GA4 client:', error);
    return null;
  }
};

const getPropertyId = (): string => {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error('GA4_PROPERTY_ID not configured. Please set it in environment variables.');
  }
  return `properties/${propertyId}`;
};

/**
 * Check if GA4 is properly configured
 */
export const isGA4Configured = (): boolean => {
  return !!(
    process.env.GA4_PROPERTY_ID &&
    (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
  );
};

/**
 * Get real-time active users (last 30 minutes)
 */
export const getRealTimeActiveUsers = async () => {
  try {
    const client = initializeGA4Client();
    if (!client) return { activeUsers: 0, error: 'GA4 client not configured' };

    const [response] = await client.runRealtimeReport({
      property: getPropertyId(),
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
    });

    const activeUsers = response.totals?.[0]?.metricValues?.[0]?.value || '0';
    
    return {
      activeUsers: parseInt(activeUsers),
      byPage: response.rows?.map(row => ({
        page: row.dimensionValues?.[0]?.value || 'Unknown',
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
    };
  } catch (error: any) {
    console.error('Error fetching real-time data:', error);
    return { activeUsers: 0, error: error.message };
  }
};

/**
 * Get comprehensive traffic analytics
 */
export const getTrafficAnalytics = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return null;

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'date' },
        { name: 'country' },
        { name: 'deviceCategory' },
        { name: 'sessionDefaultChannelGroup' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'engagementRate' },
        { name: 'conversions' },
      ],
    });

    // Calculate totals
    const totals = response.totals?.[0];
    
    return {
      sessions: parseInt(totals?.metricValues?.[0]?.value || '0'),
      totalUsers: parseInt(totals?.metricValues?.[1]?.value || '0'),
      newUsers: parseInt(totals?.metricValues?.[2]?.value || '0'),
      pageViews: parseInt(totals?.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(totals?.metricValues?.[4]?.value || '0'),
      bounceRate: parseFloat(totals?.metricValues?.[5]?.value || '0') * 100,
      engagementRate: parseFloat(totals?.metricValues?.[6]?.value || '0') * 100,
      conversions: parseInt(totals?.metricValues?.[7]?.value || '0'),
      rows: response.rows || [],
    };
  } catch (error: any) {
    console.error('Error fetching traffic analytics:', error);
    return null;
  }
};

/**
 * Get top pages by page views
 */
export const getTopPages = async (startDate: string = '30daysAgo', endDate: string = 'today', limit: number = 10) => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'pagePath' },
        { name: 'pageTitle' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    });

    return response.rows?.map(row => ({
      path: row.dimensionValues?.[0]?.value || '',
      title: row.dimensionValues?.[1]?.value || '',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
      avgDuration: parseFloat(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
    })) || [];
  } catch (error: any) {
    console.error('Error fetching top pages:', error);
    return [];
  }
};

/**
 * Get traffic sources breakdown
 */
export const getTrafficSources = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    const total = response.totals?.[0];
    const totalSessions = parseInt(total?.metricValues?.[0]?.value || '1');

    return response.rows?.map(row => ({
      channelGroup: row.dimensionValues?.[0]?.value || 'Unknown',
      source: row.dimensionValues?.[1]?.value || '',
      medium: row.dimensionValues?.[2]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      conversions: parseInt(row.metricValues?.[2]?.value || '0'),
      percentage: ((parseInt(row.metricValues?.[0]?.value || '0') / totalSessions) * 100).toFixed(1),
    })) || [];
  } catch (error: any) {
    console.error('Error fetching traffic sources:', error);
    return [];
  }
};

/**
 * Get user demographics (age, gender)
 */
export const getUserDemographics = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return { byAge: [], byGender: [] };

    // Age breakdown
    const [ageResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'userAgeBracket' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'userAgeBracket' } }],
    });

    // Gender breakdown
    const [genderResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'userGender' }],
      metrics: [{ name: 'totalUsers' }],
    });

    return {
      byAge: ageResponse.rows?.map(row => ({
        age: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
      byGender: genderResponse.rows?.map(row => ({
        gender: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
    };
  } catch (error: any) {
    console.error('Error fetching demographics:', error);
    return { byAge: [], byGender: [] };
  }
};

/**
 * Get device breakdown
 */
export const getDeviceBreakdown = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'deviceCategory' },
        { name: 'operatingSystem' },
        { name: 'browser' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    const total = response.totals?.[0];
    const totalSessions = parseInt(total?.metricValues?.[0]?.value || '1');

    return response.rows?.map(row => ({
      device: row.dimensionValues?.[0]?.value || '',
      os: row.dimensionValues?.[1]?.value || '',
      browser: row.dimensionValues?.[2]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0') * 100,
      percentage: ((parseInt(row.metricValues?.[0]?.value || '0') / totalSessions) * 100).toFixed(1),
    })) || [];
  } catch (error: any) {
    console.error('Error fetching device breakdown:', error);
    return [];
  }
};

/**
 * Get geographic data (countries and cities)
 */
export const getGeographicData = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return { countries: [], cities: [] };

    // Countries
    const [countryResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [
        { name: 'totalUsers' },
        { name: 'sessions' },
        { name: 'conversions' },
      ],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    // Cities
    const [cityResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'city' },
        { name: 'country' },
      ],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
      limit: 10,
    });

    const totalUsers = parseInt(countryResponse.totals?.[0]?.metricValues?.[0]?.value || '1');

    return {
      countries: countryResponse.rows?.map(row => ({
        country: row.dimensionValues?.[0]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        conversions: parseInt(row.metricValues?.[2]?.value || '0'),
        percentage: ((parseInt(row.metricValues?.[0]?.value || '0') / totalUsers) * 100).toFixed(1),
      })) || [],
      cities: cityResponse.rows?.map(row => ({
        city: row.dimensionValues?.[0]?.value || '',
        country: row.dimensionValues?.[1]?.value || '',
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
    };
  } catch (error: any) {
    console.error('Error fetching geographic data:', error);
    return { countries: [], cities: [] };
  }
};

/**
 * Get event tracking data
 */
export const getEventTracking = async (startDate: string = '30daysAgo', endDate: string = 'today', limit: number = 20) => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'eventName' },
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'eventCount' },
        { name: 'eventValue' },
      ],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit,
    });

    return response.rows?.map(row => ({
      eventName: row.dimensionValues?.[0]?.value || '',
      pagePath: row.dimensionValues?.[1]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
      value: parseFloat(row.metricValues?.[1]?.value || '0'),
    })) || [];
  } catch (error: any) {
    console.error('Error fetching event tracking:', error);
    return [];
  }
};

/**
 * Get landing pages and exit pages
 */
export const getLandingAndExitPages = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return { landingPages: [], exitPages: [] };

    // Landing pages
    const [landingResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'landingPage' }],
      metrics: [
        { name: 'sessions' },
        { name: 'bounceRate' },
        { name: 'conversions' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 10,
    });

    // Exit pages
    const [exitResponse] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'exits' },
        { name: 'screenPageViews' },
      ],
      orderBys: [{ metric: { metricName: 'exits' }, desc: true }],
      limit: 10,
    });

    return {
      landingPages: landingResponse.rows?.map(row => ({
        page: row.dimensionValues?.[0]?.value || '',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        bounceRate: parseFloat(row.metricValues?.[1]?.value || '0') * 100,
        conversions: parseInt(row.metricValues?.[2]?.value || '0'),
      })) || [],
      exitPages: exitResponse.rows?.map(row => ({
        page: row.dimensionValues?.[0]?.value || '',
        exits: parseInt(row.metricValues?.[0]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
        exitRate: ((parseInt(row.metricValues?.[0]?.value || '0') / parseInt(row.metricValues?.[1]?.value || '1')) * 100).toFixed(1),
      })) || [],
    };
  } catch (error: any) {
    console.error('Error fetching landing/exit pages:', error);
    return { landingPages: [], exitPages: [] };
  }
};

/**
 * Get conversion tracking data
 */
export const getConversions = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [
        { name: 'conversions' },
        { name: 'eventValue' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS' as const,
            value: 'conversion',
            caseSensitive: false,
          },
        },
      },
      orderBys: [{ metric: { metricName: 'conversions' }, desc: true }],
    });

    return response.rows?.map(row => ({
      conversionName: row.dimensionValues?.[0]?.value || '',
      count: parseInt(row.metricValues?.[0]?.value || '0'),
      value: parseFloat(row.metricValues?.[1]?.value || '0'),
    })) || [];
  } catch (error: any) {
    console.error('Error fetching conversions:', error);
    return [];
  }
};

/**
 * Get page performance metrics (speed, core web vitals)
 */
export const getPagePerformance = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return [];

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 20,
    });

    return response.rows?.map(row => ({
      page: row.dimensionValues?.[0]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
      avgDuration: parseFloat(row.metricValues?.[1]?.value || '0'),
    })) || [];
  } catch (error: any) {
    console.error('Error fetching page performance:', error);
    return [];
  }
};

/**
 * Get user engagement metrics
 */
export const getUserEngagement = async (startDate: string = '30daysAgo', endDate: string = 'today') => {
  try {
    const client = initializeGA4Client();
    if (!client) return null;

    const [response] = await client.runReport({
      property: getPropertyId(),
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'engagedSessions' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViewsPerSession' },
        { name: 'userEngagementDuration' },
      ],
    });

    const metrics = response.totals?.[0]?.metricValues || [];

    return {
      engagedSessions: parseInt(metrics[0]?.value || '0'),
      engagementRate: parseFloat(metrics[1]?.value || '0') * 100,
      avgSessionDuration: parseFloat(metrics[2]?.value || '0'),
      pagesPerSession: parseFloat(metrics[3]?.value || '0'),
      totalEngagementDuration: parseFloat(metrics[4]?.value || '0'),
    };
  } catch (error: any) {
    console.error('Error fetching user engagement:', error);
    return null;
  }
};

export default {
  isGA4Configured,
  getRealTimeActiveUsers,
  getTrafficAnalytics,
  getTopPages,
  getTrafficSources,
  getUserDemographics,
  getDeviceBreakdown,
  getGeographicData,
  getEventTracking,
  getLandingAndExitPages,
  getConversions,
  getPagePerformance,
  getUserEngagement,
};

