import api from './axios';
import type { Internship } from '../types';

export interface InternshipInput {
  title: string;
  company: string;
  type: Internship['type'];
  domain: string[];
  location?: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration?: string;
  deadline?: string;
  applyUrl: string;
  skillsReq: string[];
  criteria?: string;
  description?: string;
}

export async function fetchAdminInternships(): Promise<Internship[]> {
  const res = await api.get<{ success: boolean; data: Internship[] }>('/admin/internships');
  return res.data.data;
}

export async function createAdminInternship(payload: InternshipInput): Promise<Internship> {
  const res = await api.post<{ success: boolean; data: Internship }>('/admin/internships', payload);
  return res.data.data;
}

export async function updateAdminInternship(
  id: string,
  payload: Partial<InternshipInput & { status: Internship['status'] }>
): Promise<Internship> {
  const res = await api.patch<{ success: boolean; data: Internship }>(
    `/admin/internships/${id}`,
    payload
  );
  return res.data.data;
}

export async function deactivateAdminInternship(id: string): Promise<Internship> {
  const res = await api.patch<{ success: boolean; data: Internship }>(
    `/admin/internships/${id}/deactivate`
  );
  return res.data.data;
}
