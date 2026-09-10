import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { recomputeFitScoresForUser } from '../ai/recompute.service';

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, college, branch, year, skills } = req.body;
    const userId = req.user!.userId;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        college,
        branch,
        year: year ? parseInt(year) : undefined,
        skills: skills || [],
      },
      select: {
        id: true, email: true, name: true,
        college: true, branch: true, year: true, skills: true,
      },
    });

    // Fire-and-forget: recompute fit scores against all open internships
    // whenever skills change, so the listing/detail pages reflect the new
    // profile without the student waiting on a round-trip of Groq calls.
    if (Array.isArray(skills) && skills.length > 0) {
      recomputeFitScoresForUser(userId).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[updateProfile] background recompute failed:', err);
      });
    }

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

// On-demand recompute - lets the frontend show a "Recomputing..." state and
// know when it's actually done, and gives a way to test the AI pipeline
// without going through a profile edit.
export const recomputeScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const summary = await recomputeFitScoresForUser(userId);
    res.json({ success: true, ...summary });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to recompute fit scores' });
  }
};
