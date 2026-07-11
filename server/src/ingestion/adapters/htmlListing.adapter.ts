import axios from 'axios';
import * as cheerio from 'cheerio';
import { IngestionAdapter, ScrapedInternship } from './types';

/**
 * TEMPLATE ADAPTER — this is a starting point, not a finished scraper.
 *
 * Every government/PSU site structures its listing page differently, so
 * there's no universal selector set. To adapt this for a real source:
 *   1. Open the listing page in the browser, inspect the HTML for the
 *      repeating "card"/"row" element that wraps one internship.
 *   2. Replace the selectors below (`.internship-item`, `.title`, etc.)
 *      to match that site's actual class names / structure.
 *   3. Some sites render listings via JS (React/Angular) instead of
 *      server-rendered HTML — cheerio can't execute JS. For those,
 *      check if there's an underlying JSON API (open DevTools > Network
 *      > XHR while the page loads) and fetch that directly instead of
 *      scraping HTML at all. That's almost always more reliable anyway.
 *   4. Respect the site's robots.txt and terms of service, and keep
 *      request rates low (see the delay in runner.ts).
 */
export function createHtmlListingAdapter(config: {
  name: string;
  url: string;
  type: ScrapedInternship['type'];
  selectors: {
    item: string;
    title: string;
    link: string; // href attribute selector
    location?: string;
    deadline?: string;
  };
}): IngestionAdapter {
  return {
    name: config.name,
    async run(): Promise<ScrapedInternship[]> {
      const { data: html } = await axios.get(config.url, {
        timeout: 15000,
        headers: { 'User-Agent': 'InternRadarBot/1.0 (+educational project)' },
      });

      const $ = cheerio.load(html);
      const results: ScrapedInternship[] = [];

      $(config.selectors.item).each((_, el) => {
        const title = $(el).find(config.selectors.title).text().trim();
        const relativeLink = $(el).find(config.selectors.link).attr('href');
        if (!title || !relativeLink) return; // skip malformed rows

        const applyUrl = relativeLink.startsWith('http')
          ? relativeLink
          : new URL(relativeLink, config.url).toString();

        const location = config.selectors.location
          ? $(el).find(config.selectors.location).text().trim()
          : undefined;

        const deadlineText = config.selectors.deadline
          ? $(el).find(config.selectors.deadline).text().trim()
          : undefined;
        const deadline = deadlineText ? new Date(deadlineText) : undefined;

        results.push({
          title,
          company: config.name,
          source: config.name,
          type: config.type,
          domain: [],
          location,
          isRemote: false,
          applyUrl,
          skillsReq: [],
          deadline: deadline && !isNaN(deadline.getTime()) ? deadline : undefined,
        });
      });

      return results;
    },
  };
}

/**
 * Working example you can run today with no target site required —
 * useful for testing the ingestion pipeline (dedup, upsert, ScrapeLog)
 * end to end before you've written a real scraper. Delete once you have
 * at least one real adapter wired up.
 */
export const demoAdapter: IngestionAdapter = {
  name: 'demo-source',
  async run(): Promise<ScrapedInternship[]> {
    return [
      {
        title: 'Software Engineering Intern',
        company: 'DRDO (Demo)',
        source: 'demo-source',
        type: 'GOVERNMENT',
        domain: ['Software Development'],
        location: 'Delhi',
        isRemote: false,
        stipendMin: 15000,
        stipendMax: 20000,
        duration: '6 months',
        applyUrl: 'https://example.com/demo-internship-1',
        skillsReq: ['C++', 'Python', 'Linux'],
        description: 'Demo record for testing the ingestion pipeline end to end.',
      },
    ];
  },
};
