import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { UpdateProfileInput } from '../validators/user.validators';

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, college, branch, year, skills } = req.body as UpdateProfileInput;
  const userId = req.user!.userId;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name !== undefined && { name }),
      ...(college !== undefined && { college }),
      ...(branch !== undefined && { branch }),
      ...(year !== undefined && { year }),
      ...(skills !== undefined && { skills }),
    },
    select: {
      id: true, email: true, name: true,
      college: true, branch: true, year: true, skills: true,
    },
  });
  res.json({ success: true, data: updated });
});
