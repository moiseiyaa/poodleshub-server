import 'dotenv/config';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

// Initialize PageSpeed Insights API
const psi = google.pagespeedonline('v5');

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PSI_API_KEY?: string;
    }
  }
}

/**
 * Collect Core Web Vitals using Google PageSpeed Insights API
 * Usage: tsx scripts/collectWebVitalsPsi.ts [url]
 * Requires PSI_API_KEY in .env
 */
async function getPageSpeedMetrics(url: string, apiKey: string) {
  try {
    const response = await psi.pagespeedapi.runpagespeed({
      url,
      key: apiKey,
      strategy: 'mobile',
      category: ['PERFORMANCE', 'ACCESSIBILITY', 'SEO', 'BEST_PRACTICES'],
    });

    const { data } = response;
    const audits = data.lighthouseResult?.audits;
    
    if (!audits) {
      throw new Error('No audit data in response');
    }

    return {
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      inp: audits['interaction-to-next-paint']?.numericValue || 0,
          };
  } catch (error) {
    console.error('Error fetching PageSpeed Insights:', error.message);
    throw error;
  }
}

async function main() {
  const apiKey = process.env.PSI_API_KEY;
  if (!apiKey) {
    throw new Error('PSI_API_KEY is required in .env');
  }

  const url = process.argv[2] || 'https://puppyhubusa.com';
  console.log(`🔍 Fetching metrics for: ${url}`);

  try {
    const metrics = await getPageSpeedMetrics(url, apiKey);
    console.log('📊 Metrics received:', metrics);

    const prisma = new PrismaClient();
    
    // @ts-ignore - webVital model exists at runtime
    await prisma.webVital.create({
      data: {
        url,
        lcp: metrics.lcp,
        cls: metrics.cls,
        inp: metrics.inp,
          fetchedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    console.log('✅ Web Vitals saved to database');
    console.log({
      'Largest Contentful Paint (LCP)': `${metrics.lcp}ms`,
      'Cumulative Layout Shift (CLS)': metrics.cls.toFixed(4),
      'Interaction to Next Paint (INP)': `${metrics.inp}ms`,
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
