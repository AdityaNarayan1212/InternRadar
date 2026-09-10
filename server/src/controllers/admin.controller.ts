import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// All routes here are mounted behind authenticate + requireAdmin.

export const createInternship = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, company, type, domain, location, isRemote,
      stipendMin, stipendMax, duration, deadline, applyUrl,
      skillsReq, criteria, description,
    } = req.body;

    if (!title || !company || !type || !applyUrl) {
      res.status(400).json({
        success: false,
        message: 'title, company, type, and applyUrl are required',
      });
      return;
    }

    const internship = await prisma.internship.create({
      data: {
        title,
        company,
        source: 'InternRadar team',
        type,
        domain: domain ?? [],
        location: location || null,
        isRemote: !!isRemote,
        stipendMin: stipendMin != null ? Number(stipendMin) : null,
        stipendMax: stipendMax != null ? Number(stipendMax) : null,
        duration: duration || null,
        deadline: deadline ? new Date(deadline) : null,
        applyUrl,
        status: 'OPEN',
        // false = "Added by InternRadar team" on the detail page, matching
        // the existing caption logic - true is reserved for API-synced data
        // from a real ingestion source, which doesn't exist yet.
        verified: false,
        skillsReq: skillsReq ?? [],
        criteria: criteria || null,
        description: description || null,
      },
    });

    res.status(201).json({ success: true, data: internship });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create internship' });
  }
};

export const updateInternship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title, company, type, domain, location, isRemote,
      stipendMin, stipendMax, duration, deadline, applyUrl,
      status, skillsReq, criteria, description,
    } = req.body;

    const internship = await prisma.internship.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(company !== undefined && { company }),
        ...(type !== undefined && { type }),
        ...(domain !== undefined && { domain }),
        ...(location !== undefined && { location: location || null }),
        ...(isRemote !== undefined && { isRemote: !!isRemote }),
        ...(stipendMin !== undefined && { stipendMin: stipendMin != null ? Number(stipendMin) : null }),
        ...(stipendMax !== undefined && { stipendMax: stipendMax != null ? Number(stipendMax) : null }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(applyUrl !== undefined && { applyUrl }),
        ...(status !== undefined && { status }),
        ...(skillsReq !== undefined && { skillsReq }),
        ...(criteria !== undefined && { criteria: criteria || null }),
        ...(description !== undefined && { description: description || null }),
      },
    });

    res.json({ success: true, data: internship });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update internship' });
  }
};

// Soft "delete" - flips status to CLOSED rather than removing the row, so
// existing shortlist/analysis references (and history) stay intact.
export const deactivateInternship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const internship = await prisma.internship.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
    res.json({ success: true, data: internship });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to deactivate internship' });
  }
};

// Plain listing for the admin table - no personalization, no pagination
// limit games, just everything so it's easy to scan and manage.
export const getAdminInternships = async (req: Request, res: Response): Promise<void> => {
  try {
    const internships = await prisma.internship.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: internships });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch internships' });
  }
};
