import { prisma } from '../lib/prisma';
import { IngestionAdapter } from './adapters/types';
import { demoAdapter } from './adapters/htmlListing.adapter';
import { drdoAdapter } from './adapters/drdo.adapter';

// Register real adapters here as you build them, alongside (or instead of) the demo one.
const adapters: IngestionAdapter[] = [demoAdapter, drdoAdapter];

async function runAdapter(adapter: IngestionAdapter) {
  console.log(`[ingestion] running ${adapter.name}...`);
  let newFound = 0;
  let errorMessage: string | null = null;

  try {
    const scraped = await adapter.run();

    for (const item of scraped) {
      // applyUrl is @unique in the schema, so this upsert is the dedup mechanism:
      // re-running the same adapter won't create duplicate rows.
      const result = await prisma.internship.upsert({
        where: { applyUrl: item.applyUrl },
        update: {
          title: item.title,
          location: item.location,
          deadline: item.deadline,
          lastScraped: new Date(),
        },
        create: {
          title: item.title,
          company: item.company,
          source: item.source,
          type: item.type,
          domain: item.domain,
          location: item.location,
          isRemote: item.isRemote,
          stipendMin: item.stipendMin,
          stipendMax: item.stipendMax,
          duration: item.duration,
          deadline: item.deadline,
          applyUrl: item.applyUrl,
          skillsReq: item.skillsReq,
          criteria: item.criteria,
          description: item.description,
          lastScraped: new Date(),
        },
      });

      // Crude "is this new" check: createdAt === lastScraped-ish moment.
      // Good enough for a log count; not load-bearing logic.
      if (result.createdAt.getTime() > Date.now() - 5000) newFound += 1;
    }

    console.log(`[ingestion] ${adapter.name}: ${scraped.length} found, ${newFound} new`);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown ingestion error';
    console.error(`[ingestion] ${adapter.name} failed:`, errorMessage);
  }

  await prisma.scrapeLog.create({
    data: {
      source: adapter.name,
      status: errorMessage ? 'FAILED' : 'SUCCESS',
      newFound,
      errors: errorMessage,
    },
  });
}

async function main() {
  for (const adapter of adapters) {
    await runAdapter(adapter);
    // Be polite to source servers between adapters.
    await new Promise((r) => setTimeout(r, 1000));
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[ingestion] fatal error:', err);
  process.exit(1);
});
