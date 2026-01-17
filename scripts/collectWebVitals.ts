import { writeFileSync } from 'fs';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { PrismaClient } from '@prisma/client';

/**
 * Collects Core Web Vitals for the given URL using Lighthouse and stores
 * the results in the WebVital table.
 *
 * Usage: tsx scripts/collectWebVitals.ts https://my-site.com/
 */
async function main() {
  const url = process.argv[2] || 'https://puppyhubusa.com';
  console.log(`Running Lighthouse for: ${url}`);

  const chrome = await launch({ chromeFlags: ['--headless'] });
  const result = await lighthouse(url, {
    port: chrome.port,
    output: 'json',
    onlyCategories: ['performance'],
  });

  const lcp = result.lhr.audits['largest-contentful-paint'].numericValue || 0;
  const cls = result.lhr.audits['cumulative-layout-shift'].numericValue || 0;
  const inp = result.lhr.audits['interactive'].numericValue || 0;

  const prisma = new PrismaClient();
  await prisma.webVital.create({
    data: {
      url,
      lcp,
      cls,
      inp,
      fetchedAt: new Date(),
    },
  });

  await prisma.$disconnect();
  await chrome.kill();

  console.log('Saved metrics:', { lcp, cls, inp });

  // Optionally write raw report
  const reportPath = `lighthouse-${Date.now()}.json`;
  writeFileSync(reportPath, result.report as string);
  console.log(`Raw report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
