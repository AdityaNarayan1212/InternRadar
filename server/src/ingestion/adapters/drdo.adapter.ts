import axios from 'axios';
import * as cheerio from 'cheerio';
import { IngestionAdapter, ScrapedInternship } from './types';

const BASE_URL = 'https://drdo.gov.in/drdo/en/offerings/vacancies';
const PAGES_TO_FETCH = 3; // 0-indexed: page=0,1,2 -> ~30 most recent notices

// DD/MM/YYYY -> Date. DRDO renders dates like "15/07/2026".
function parseDdMmYyyy(text: string | undefined): Date | undefined {
  if (!text) return undefined;
  const match = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(date.getTime()) ? undefined : date;
}

// Small heuristic map from common DRDO lab acronyms (seen in titles) to a domain tag.
// Not exhaustive — extend as you see more labs show up in scraped titles.
const LAB_DOMAIN_HINTS: Record<string, string> = {
  CAIR: 'AI & Robotics',
  DLRL: 'Electronics',
  ADE: 'Aerospace',
  DMRL: 'Materials',
  DRDE: 'Biochemical Research',
  INMAS: 'Biomedical',
  CVRDE: 'Vehicles Research',
};

function guessDomain(title: string): string[] {
  for (const [lab, domain] of Object.entries(LAB_DOMAIN_HINTS)) {
    if (title.toUpperCase().includes(lab)) return [domain];
  }
  return ['Defence R&D'];
}

/**
 * Parses one page of the DRDO vacancies listing.
 *
 * This deliberately avoids depending on exact CSS class names (I fetched
 * the page through a markdown-converting tool and couldn't inspect the
 * real DOM/class names). Instead it anchors on the "View More" link,
 * which is a stable, content-addressable element per posting, and reads
 * the labelled fields ("Advertisement No", "Published Date", "Start Date",
 * "End Date") from the text of that link's containing block.
 *
 * If this comes back with 0 results, open the page in a browser, inspect
 * one listing row, and swap in the real selectors — it'll be more precise
 * than the text-based fallback below.
 */
async function fetchPage(pageIndex: number): Promise<ScrapedInternship[]> {
  const url = `${BASE_URL}?page=${pageIndex}`;
  const { data: html } = await axios.get(url, {
    timeout: 15000,
    headers: { 'User-Agent': 'InternRadarBot/1.0 (+educational project; contact: student project)' },
  });

  const $ = cheerio.load(html);
  const results: ScrapedInternship[] = [];

  $('a').each((_, el) => {
    const anchorText = $(el).text().trim();
    if (!anchorText.toLowerCase().includes('view more')) return;

    const href = $(el).attr('href');
    if (!href) return;
    const applyUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).toString();

    // Walk up a few levels to find a container that holds this row's full text
    // (title + Advertisement No + dates), without needing to know its class name.
    let container = $(el).parent();
    for (let i = 0; i < 3 && container.text().trim().length < 40; i++) {
      container = container.parent();
    }
    const blockText = container.text().replace(/\s+/g, ' ').trim();

    // Only keep postings that are actually internships — this listing mixes in
    // JRF fellowships, apprenticeships, walk-in interviews, and results.
    if (!/intern/i.test(blockText)) return;

    const title = blockText.split(/Advertisement No/i)[0].trim();
    const adNoMatch = blockText.match(/Advertisement No\s*([^\s]+(?:\s[^\s]+)?)\s*Published Date/i);
    const publishedMatch = blockText.match(/Published Date\s*(\d{2}\/\d{2}\/\d{4})/);
    const endDateMatch = blockText.match(/End Date\s*(\d{2}\/\d{2}\/\d{4})/);

    if (!title) return;

    results.push({
      title: title.slice(0, 200),
      company: 'DRDO',
      source: 'DRDO',
      type: 'GOVERNMENT',
      domain: guessDomain(title),
      isRemote: false,
      applyUrl,
      skillsReq: [],
      criteria: adNoMatch ? `Advertisement No: ${adNoMatch[1]}` : undefined,
      deadline: parseDdMmYyyy(endDateMatch?.[1]),
      description: `Published ${publishedMatch?.[1] ?? 'unknown date'}. Source: DRDO vacancies listing.`,
    });
  });

  return results;
}

export const drdoAdapter: IngestionAdapter = {
  name: 'DRDO',
  async run(): Promise<ScrapedInternship[]> {
    const all: ScrapedInternship[] = [];
    for (let page = 0; page < PAGES_TO_FETCH; page++) {
      const pageResults = await fetchPage(page);
      all.push(...pageResults);
      await new Promise((r) => setTimeout(r, 800)); // polite delay between page fetches
    }

    // De-dupe within this run (a title can technically repeat across pages
    // if the site paginates oddly); applyUrl uniqueness handles cross-run dedup.
    const seen = new Set<string>();
    return all.filter((item) => {
      if (seen.has(item.applyUrl)) return false;
      seen.add(item.applyUrl);
      return true;
    });
  },
};
