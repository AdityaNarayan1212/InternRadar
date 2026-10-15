import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

type InternshipRow = Awaited<ReturnType<typeof prisma.internship.findMany>>[number];

// GET all internships with filters
// Personalization (fitScore / matchedSkills / missingSkills / isSaved) is
// attached only when a valid token is present (see optionalAuth). Logged-out
// requests still get the listing back, just without those fields - the
// frontend treats an undefined fitScore as the "locked" state.
export const getInternships = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type, isRemote, domain, search, status,
      underratedOnly, minFitScore, minStipend, maxStipend,
      sort = 'fitScore', page = '1', limit = '12',
    } = req.query;

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (isRemote !== undefined) where.isRemote = isRemote === 'true';
    if (domain) {
      const domains = (domain as string).split(',').map((d) => d.trim()).filter(Boolean);
      if (domains.length === 1) where.domain = { has: domains[0] };
      else if (domains.length > 1) where.domain = { hasSome: domains };
    }
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
        { location: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (underratedOnly === 'true' && !type) {
      // "Underrated" = the low-visibility org types this product exists to
      // surface. There's no separate isUnderrated column - it's derived from
      // type, same categories the product brief calls out (DRDO/ISRO-style).
      where.type = { in: ['GOVERNMENT', 'RESEARCH'] };
    }

    const minStipendNum = minStipend ? parseInt(minStipend as string) : undefined;
    const maxStipendNum = maxStipend ? parseInt(maxStipend as string) : undefined;
    if (minStipendNum !== undefined && !Number.isNaN(minStipendNum)) {
      where.stipendMax = { gte: minStipendNum };
    }
    if (maxStipendNum !== undefined && !Number.isNaN(maxStipendNum)) {
      where.stipendMin = { lte: maxStipendNum };
    }

    const userId = req.user?.userId;
    const minFitScoreNum = minFitScore !== undefined ? parseFloat(minFitScore as string) : undefined;

    // fitScore lives per (user, internship) in AiAnalysis, not on Internship
    // itself, so a fit-score filter or sort needs the user's analyses pulled
    // in ahead of the main query.
    const scoreByInternshipId = new Map<string, number>();
    if (userId) {
      const analyses = await prisma.aiAnalysis.findMany({
        where: { userId },
        select: { internshipId: true, fitScore: true },
      });
      for (const a of analyses) {
        if (a.fitScore != null) scoreByInternshipId.set(a.internshipId, a.fitScore);
      }
      if (minFitScoreNum !== undefined && !Number.isNaN(minFitScoreNum)) {
        const qualifyingIds = [...scoreByInternshipId.entries()]
          .filter(([, score]) => score >= minFitScoreNum)
          .map(([id]) => id);
        where.id = { in: qualifyingIds };
      }
    } else if (minFitScoreNum !== undefined && !Number.isNaN(minFitScoreNum)) {
      // No token, so no analysis exists for anyone -> nothing can qualify yet
      where.id = { in: [] };
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    if (
      !Number.isSafeInteger(pageNum) ||
      pageNum < 1 ||
      !Number.isSafeInteger(limitNum) ||
      limitNum < 1 ||
      limitNum > 100
    ) {
      res.status(400).json({
        success: false,
        message: 'page must be a positive integer and limit must be between 1 and 100',
      });
      return;
    }

    let internships: InternshipRow[];
    let total: number;

    if (sort === 'fitScore' && userId) {
      // Small dataset -> sorting the filtered set in memory is fine. At real
      // scale this would need the score materialized as an indexed column.
      const all = await prisma.internship.findMany({ where, orderBy: { createdAt: 'desc' } });
      total = all.length;
      const sorted = [...all].sort(
        (a, b) => (scoreByInternshipId.get(b.id) ?? -1) - (scoreByInternshipId.get(a.id) ?? -1)
      );
      internships = sorted.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);
    } else {
      const orderBy = sort === 'deadline'
        ? { deadline: 'asc' as const }
        : { createdAt: 'desc' as const };
      [internships, total] = await Promise.all([
        prisma.internship.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy,
        }),
        prisma.internship.count({ where }),
      ]);
    }

    // Attach personalization for just this page's results
    let savedIds = new Set<string>();
    const missingByInternshipId = new Map<string, string[]>();
    if (userId && internships.length > 0) {
      const ids = internships.map((i) => i.id);
      const [saved, analyses] = await Promise.all([
        prisma.savedInternship.findMany({
          where: { userId, internshipId: { in: ids } },
          select: { internshipId: true },
        }),
        prisma.aiAnalysis.findMany({
          where: { userId, internshipId: { in: ids } },
          select: { internshipId: true, missingSkills: true },
        }),
      ]);
      savedIds = new Set(saved.map((s: { internshipId: string }) => s.internshipId));
      for (const a of analyses) {
        missingByInternshipId.set(a.internshipId, a.missingSkills);
      }
    }

    const data = internships.map((i) => {
      const missingSkills = missingByInternshipId.get(i.id);
      return {
        ...i,
        fitScore: scoreByInternshipId.get(i.id),
        matchedSkills: missingSkills
          ? i.skillsReq.filter((s: string) => !missingSkills.includes(s))
          : undefined,
        missingSkills,
        isSaved: savedIds.has(i.id),
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch internships' });
  }
};

// GET single internship, personalized the same way as the list endpoint
export const getInternshipById = async (req: Request, res: Response): Promise<void> => {
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: req.params.id },
    });
    if (!internship) {
      res.status(404).json({ success: false, message: 'Internship not found' });
      return;
    }

    const userId = req.user?.userId;
    let fitScore: number | undefined;
    let matchedSkills: string[] | undefined;
    let missingSkills: string[] | undefined;
    let isSaved = false;
    let applicationStatus: string | undefined;

    if (userId) {
      const [analysis, saved] = await Promise.all([
        prisma.aiAnalysis.findUnique({
          where: { userId_internshipId: { userId, internshipId: internship.id } },
        }),
        prisma.savedInternship.findUnique({
          where: { userId_internshipId: { userId, internshipId: internship.id } },
        }),
      ]);
      if (analysis?.fitScore != null) {
        fitScore = analysis.fitScore;
        missingSkills = analysis.missingSkills;
        matchedSkills = internship.skillsReq.filter(
          (s: string) => !analysis.missingSkills.includes(s)
        );
      }
      isSaved = !!saved;
      applicationStatus = saved?.applicationStatus;
    }

    res.json({
      success: true,
      data: { ...internship, fitScore, matchedSkills, missingSkills, isSaved, applicationStatus },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch internship' });
  }
};

// SAVE / UNSAVE internship
export const toggleSave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.savedInternship.findUnique({
      where: { userId_internshipId: { userId, internshipId: id } },
    });

    if (existing) {
      await prisma.savedInternship.delete({
        where: { userId_internshipId: { userId, internshipId: id } },
      });
      res.json({ success: true, saved: false, message: 'Removed from saved' });
    } else {
      await prisma.savedInternship.create({
        data: { userId, internshipId: id },
      });
      res.json({ success: true, saved: true, message: 'Saved successfully' });
    }
  } catch {
    res.status(500).json({ success: false, message: 'Failed to toggle save' });
  }
};

// GET saved internships for current user, personalized the same way as the
// other endpoints so the shortlist board can reuse the same card UI.
export const getSaved = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const saved = await prisma.savedInternship.findMany({
      where: { userId },
      include: { internship: true },
      orderBy: { createdAt: 'desc' },
    });
    type SavedRow = (typeof saved)[number];

    const internshipIds = saved.map((s: SavedRow) => s.internshipId);
    const analyses = await prisma.aiAnalysis.findMany({
      where: { userId, internshipId: { in: internshipIds } },
      select: { internshipId: true, fitScore: true, missingSkills: true },
    });
    type AnalysisRow = (typeof analyses)[number];
    const analysisById = new Map<string, AnalysisRow>(
      analyses.map((a: AnalysisRow) => [a.internshipId, a])
    );

    const data = saved.map((s: SavedRow) => {
      const analysis = analysisById.get(s.internshipId);
      return {
        ...s.internship,
        fitScore: analysis?.fitScore ?? undefined,
        matchedSkills: analysis
          ? s.internship.skillsReq.filter((sk: string) => !analysis.missingSkills.includes(sk))
          : undefined,
        missingSkills: analysis?.missingSkills,
        isSaved: true,
        applicationStatus: s.applicationStatus,
        savedAt: s.createdAt,
      };
    });

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch saved internships' });
  }
};

// UPDATE application status
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { applicationStatus } = req.body;
    const userId = req.user!.userId;

    const updated = await prisma.savedInternship.update({
      where: { userId_internshipId: { userId, internshipId: id } },
      data: { applicationStatus },
    });
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
