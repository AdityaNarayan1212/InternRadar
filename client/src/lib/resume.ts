import api from './axios';
import type { User } from '../types';

export interface ResumeUploadResult {
  success: boolean;
  data: User;
  skillsExtracted: number;
  extractionSource?: 'ai' | 'ai+keywords' | 'keywords';
  extractionWarning?: string;
}

export async function uploadResumeFile(file: File): Promise<ResumeUploadResult> {
  const formData = new FormData();
  formData.append('resume', file);
  // Explicitly clear the instance-level default 'application/json' header so
  // axios/the browser sets the correct multipart boundary for FormData.
  const res = await api.post<ResumeUploadResult>('/users/resume', formData, {
    headers: { 'Content-Type': undefined },
  });
  return res.data;
}

export async function deleteResumeFile(): Promise<void> {
  await api.delete('/users/resume');
}

export async function fetchResumeUrl(): Promise<string> {
  const res = await api.get<{ success: boolean; url: string }>('/users/resume-url');
  return res.data.url;
}
