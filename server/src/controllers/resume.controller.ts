import { Request, Response } from 'express';
import { PDFParse } from 'pdf-parse';
import { prisma } from '../lib/prisma';
import { supabase, RESUME_BUCKET } from '../lib/supabase';
import { extractSkillsFromResume } from '../ai/resume.service';
import { recomputeFitScoresForUser } from '../ai/recompute.service';

// Fixed path per user rather than timestamped - a re-upload naturally
// overwrites (upsert: true) with no orphaned old files to track/clean up,
// and there's no product need for resume history here.
function resumePathFor(userId: string): string {
  return `${userId}/resume.pdf`;
}

function mergeSkills(existing: string[], extracted: string[]): string[] {
  const seen = new Map<string, string>(); // lowercase -> original casing kept
  for (const s of existing) seen.set(s.toLowerCase(), s);
  for (const s of extracted) {
    const key = s.toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  }
  return [...seen.values()];
}

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  if (!supabase) {
    res.status(503).json({
      success: false,
      message: 'Resume storage is not configured (missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
    });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: 'No file uploaded' });
    return;
  }
  if (file.mimetype !== 'application/pdf') {
    res.status(400).json({ success: false, message: 'Only PDF resumes are supported' });
    return;
  }

  const userId = req.user!.userId;

  // 1. Extract text from the PDF
  let text = '';
  const parser = new PDFParse({ data: file.buffer });
  try {
    const result = await parser.getText();
    text = result.text ?? '';
  } catch {
    res.status(400).json({ success: false, message: 'Could not read this PDF - it may be corrupted' });
    return;
  } finally {
    await parser.destroy();
  }

  if (text.trim().length < 50) {
    res.status(400).json({
      success: false,
      message: 'Could not find readable text in this PDF - is it a scanned image rather than a text PDF?',
    });
    return;
  }

  // 2. Extract skills via Groq
  let extractedSkills: string[] = [];
  try {
    extractedSkills = await extractSkillsFromResume(text);
  } catch (err) {
    // Storage upload can still succeed even if skill extraction fails (e.g.
    // Groq is down / misconfigured) - the resume gets saved, skills just
    // won't auto-populate this time.
    console.error('[uploadResume] skill extraction failed:', err);
  }

  // 3. Upload to Supabase Storage (private bucket, fixed per-user path)
  const path = resumePathFor(userId);
  const { error: uploadError } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(path, file.buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    res.status(502).json({ success: false, message: `Upload to storage failed: ${uploadError.message}` });
    return;
  }

  // 4. Merge extracted skills into the profile and save the resume path
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { skills: true } });
  const mergedSkills = mergeSkills(user?.skills ?? [], extractedSkills);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { resumeUrl: path, skills: mergedSkills },
    select: {
      id: true, email: true, name: true, college: true, branch: true,
      year: true, skills: true, resumeUrl: true, isAdmin: true,
    },
  });

  if (mergedSkills.length > 0) {
    recomputeFitScoresForUser(userId).catch((err) => {
      console.error('[uploadResume] background recompute failed:', err);
    });
  }

  res.json({
    success: true,
    data: updated,
    skillsExtracted: extractedSkills.length,
  });
};

export const deleteResume = async (req: Request, res: Response): Promise<void> => {
  if (!supabase) {
    res.status(503).json({ success: false, message: 'Resume storage is not configured' });
    return;
  }
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { resumeUrl: true } });
  if (!user?.resumeUrl) {
    res.status(404).json({ success: false, message: 'No resume on file' });
    return;
  }

  const { error } = await supabase.storage.from(RESUME_BUCKET).remove([user.resumeUrl]);
  if (error) {
    res.status(502).json({ success: false, message: `Failed to delete from storage: ${error.message}` });
    return;
  }

  // Skills stay - deleting the file shouldn't silently wipe profile data
  // the student may have also entered or edited by hand.
  await prisma.user.update({ where: { id: userId }, data: { resumeUrl: null } });
  res.json({ success: true });
};

// Short-lived signed URL for viewing/downloading the current resume - the
// stored path is never exposed as a permanent public link since resumes
// contain personal info.
export const getResumeUrl = async (req: Request, res: Response): Promise<void> => {
  if (!supabase) {
    res.status(503).json({ success: false, message: 'Resume storage is not configured' });
    return;
  }
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { resumeUrl: true } });
  if (!user?.resumeUrl) {
    res.status(404).json({ success: false, message: 'No resume on file' });
    return;
  }

  const { data, error } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(user.resumeUrl, 300); // 5 minutes

  if (error || !data) {
    res.status(502).json({ success: false, message: error?.message ?? 'Failed to generate link' });
    return;
  }

  res.json({ success: true, url: data.signedUrl });
};
