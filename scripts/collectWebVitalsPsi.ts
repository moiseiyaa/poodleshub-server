import { PsiOptions, output } from 'psi';
import psi from 'psi';
import { PrismaClient } from '@prisma/client';

/**
 * Collect Core Web Vitals using Google PageSpeed Insights API (psi package)
 * Usage: tsx scripts/collectWebVitalsPsi.ts https://example.com/
 * Optionally set PSI_API_KEY env variable for higher quota.
 */
async function main() {
  const url = process.argv[2] || 'https://puppyhubusa.com';
  console.log(`Fetching PSI metrics for ${url}`);

  const opts: PsiOptions = {
    nokey: !process.env.PSI_API_KEY,
    key: process.env.PSI_API_KEY,
    strategy: 'mobile',
  } as any;

  const { data } = await psi(url, opts);
  if (!data || !data.lighthouseResult) {
    throw new Error('Invalid PSI response');
  }

  const audits = data.lighthouseResult.audits as any;
  const lcp = audits['largest-contentful-paint']?.numericValue || 0;
  const cls = audits['cumulative-layout-shift']?.numericValue || 0;
  // INP is experimental; fallback to TBT if missing
  const inp = audits['experimental_interaction_to_next_paint']?.numericValue || audits['total-blocking-time']?.numericValue || 0;

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

  console.log('Saved WebVitals:', { lcp, cls, inp });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
