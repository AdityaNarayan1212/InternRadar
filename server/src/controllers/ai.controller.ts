import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/AppError';
import { asyncHandler } from '../lib/asyncHandler';
import { analyzeFit } from '../services/ai.service';

// POST /api/internships/:id/analyze
// Returns a cached analysis if one already exists for this user+internship,
// otherwise calls Groq, stores the result, and returns it.
export const analyzeInternshipFit = asyncHandler(async (req: Request, res: Response) => {
  const { id: internshipId } = req.params;
  const userId = req.user!.userId;
  const forceRefresh = req.query.refresh === 'true';

  if (!forceRefresh) {
    const cached = await prisma.aiAnalysis.findUnique({
      where: { userId_internshipId: { userId, internshipId } },
    });
    if (cached) {
      res.json({ success: true, data: cached, cached: true });
      return;
    }
  }

  const [user, internship] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.internship.findUnique({ where: { id: internshipId } }),
  ]);

  if (!user) throw new AppError('User not found', 404);
  if (!internship) throw new AppError('Internship not found', 404);

  const result = await analyzeFit(
    { skills: user.skills, branch: user.branch, year: user.year },
    {
      title: internship.title,
      company: internship.company,
      domain: internship.domain,
      skillsReq: internship.skillsReq,
      criteria: internship.criteria,
    }
  );

  const saved = await prisma.aiAnalysis.upsert({
    where: { userId_internshipId: { userId, internshipId } },
    update: {
      fitScore: result.fitScore,
      matchReasons: result.matchReasons,
      missingSkills: result.missingSkills,
      generatedAt: new Date(),
    },
    create: {
      userId,
      internshipId,
      fitScore: result.fitScore,
      matchReasons: result.matchReasons,
      missingSkills: result.missingSkills,
    },
  });

  res.json({ success: true, data: saved, cached: false });
});
