// Recomputes AiAnalysis rows (fitScore / missingSkills / matchReasons) for a
// user against every open internship. Called (a) fire-and-forget after a
// profile skills update, and (b) on demand via POST /api/users/recompute-scores.
//
// Runs in small batches rather than all-at-once, since each internship is a
// separate Groq call and free-tier rate limits are real.

import { prisma } from '../lib/prisma';
import { computeFitScore } from './matching.service';

const BATCH_SIZE = 3;

export interface RecomputeSummary {
  computed: number;
  failed: number;
  skipped: boolean;
  reason?: string;
}

export async function recomputeFitScoresForUser(userId: string): Promise<RecomputeSummary> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { skills: true } });

  if (!user) {
    return { computed: 0, failed: 0, skipped: true, reason: 'User not found' };
  }
  if (user.skills.length === 0) {
    return { computed: 0, failed: 0, skipped: true, reason: 'No skills on profile yet' };
  }

  const internships = await prisma.internship.findMany({
    where: { status: 'OPEN' },
    select: { id: true, title: true, company: true, domain: true, skillsReq: true, description: true },
  });
  type InternshipRow = (typeof internships)[number];

  let computed = 0;
  let failed = 0;

  for (let i = 0; i < internships.length; i += BATCH_SIZE) {
    const batch = internships.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (internship: InternshipRow) => {
        const { fitScore, missingSkills, matchReasons } = await computeFitScore(
          user.skills,
          internship
        );
        await prisma.aiAnalysis.upsert({
          where: { userId_internshipId: { userId, internshipId: internship.id } },
          update: { fitScore, missingSkills, matchReasons, generatedAt: new Date() },
          create: {
            userId,
            internshipId: internship.id,
            fitScore,
            missingSkills,
            matchReasons,
            generatedAt: new Date(),
          },
        });
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled') computed++;
      else {
        failed++;
        // eslint-disable-next-line no-console
        console.error('[recomputeFitScoresForUser] analysis failed:', r.reason);
      }
    }
  }

  return { computed, failed, skipped: false };
}
