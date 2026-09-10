import api from './axios';
import type { ApplicationStatus, Internship, InternshipFilters, PaginatedInternships, ShortlistItem } from '../types';

function toParams(filters: InternshipFilters, page: number, limit = 12) {
  const params: Record<string, string> = { page: String(page), limit: String(limit) };
  if (filters.search) params.search = filters.search;
  if (filters.type) params.type = filters.type;
  if (filters.domain && filters.domain.length > 0) params.domain = filters.domain.join(',');
  if (filters.isRemote !== undefined) params.isRemote = String(filters.isRemote);
  if (filters.status) params.status = filters.status;
  if (filters.underratedOnly) params.underratedOnly = 'true';
  if (filters.minFitScore !== undefined) params.minFitScore = String(filters.minFitScore);
  if (filters.minStipend !== undefined) params.minStipend = String(filters.minStipend);
  if (filters.maxStipend !== undefined) params.maxStipend = String(filters.maxStipend);
  if (filters.sort) params.sort = filters.sort;
  return params;
}

export async function fetchInternships(
  filters: InternshipFilters,
  page: number,
  limit = 12
): Promise<PaginatedInternships> {
  const res = await api.get<PaginatedInternships>('/internships', {
    params: toParams(filters, page, limit),
  });
  return res.data;
}

export async function fetchInternshipById(id: string): Promise<Internship> {
  const res = await api.get<{ success: boolean; data: Internship }>(`/internships/${id}`);
  return res.data.data;
}

export async function toggleSaveInternship(id: string): Promise<boolean> {
  const res = await api.post<{ success: boolean; saved: boolean }>(`/internships/${id}/save`);
  return res.data.saved;
}

export async function fetchSaved(): Promise<ShortlistItem[]> {
  const res = await api.get<{ success: boolean; data: ShortlistItem[] }>('/internships/saved');
  return res.data.data;
}

export async function updateApplicationStatus(
  id: string,
  applicationStatus: ApplicationStatus
): Promise<void> {
  await api.patch(`/internships/${id}/status`, { applicationStatus });
}
