import { InternshipType } from '@prisma/client';

// The normalized shape every adapter must return, regardless of
// what the source site's HTML/JSON actually looks like.
export interface ScrapedInternship {
  title: string;
  company: string;
  source: string; // e.g. 'DRDO', 'ISRO', 'AICTE'
  type: InternshipType;
  domain: string[];
  location?: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration?: string;
  deadline?: Date;
  applyUrl: string;
  skillsReq: string[];
  criteria?: string;
  description?: string;
}

export interface IngestionAdapter {
  /** Human-readable name, used in ScrapeLog.source */
  name: string;
  /** Fetches + parses the source and returns normalized internships */
  run(): Promise<ScrapedInternship[]>;
}
