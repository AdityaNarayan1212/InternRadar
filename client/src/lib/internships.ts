import api from './axios';
import {
  ApiResponse,
  AnalyzeInternshipFitResponse,
  Internship,
  InternshipFilters,
  SavedInternship,
} from '../types';

export async function fetchInternships(filters: InternshipFilters) {
  const params: Record<string, string> = {};
  if (filters.type) params.type = filters.type;
  if (filters.isRemote !== undefined) params.isRemote = String(filters.isRemote);
  if (filters.domain) params.domain = filters.domain;
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  params.page = String(filters.page ?? 1);
  params.limit = String(filters.limit ?? 12);

  const res = await api.get<ApiResponse<Internship[]>>('/internships', { params });
  return res.data;
}

export async function fetchSavedInternships() {
  const res = await api.get<ApiResponse<SavedInternship[]>>('/internships/saved');
  return res.data.data;
}

export async function toggleSaveInternship(internshipId: string) {
  const res = await api.post<{ success: boolean; saved: boolean; message: string }>(
    `/internships/${internshipId}/save`
  );
  return res.data;
}

export async function analyzeInternshipFit(internshipId: string) {
  const res = await api.post<AnalyzeInternshipFitResponse>(`/internships/${internshipId}/analyze`);
  return res.data;
}
