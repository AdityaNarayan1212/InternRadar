import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

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
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};