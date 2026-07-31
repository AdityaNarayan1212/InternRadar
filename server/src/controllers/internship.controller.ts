import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// GET all internships with filters
export const getInternships = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type, isRemote, domain, search, status, page = '1', limit = '12'
    } = req.query;

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (isRemote !== undefined) where.isRemote = isRemote === 'true';
    if (domain) where.domain = { has: domain as string };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [internships, total] = await Promise.all([
      prisma.internship.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.internship.count({ where }),
    ]);

    res.json({
      success: true,
      data: internships,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch internships' });
  }
};

// GET single internship
export const getInternshipById = async (req: Request, res: Response): Promise<void> => {
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: req.params.id },
    });
    if (!internship) {
      res.status(404).json({ success: false, message: 'Internship not found' });
      return;
    }
    res.json({ success: true, data: internship });
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

// GET saved internships for current user
export const getSaved = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const saved = await prisma.savedInternship.findMany({
      where: { userId },
      include: { internship: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: saved });
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