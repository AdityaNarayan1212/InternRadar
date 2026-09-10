import api from './axios';
import type { RecomputeSummary, User } from '../types';

interface UpdateProfilePayload {
  name: string;
  college?: string;
  branch?: string;
  year?: number;
  skills: string[];
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const res = await api.patch<{ success: boolean; data: User }>('/users/profile', payload);
  return res.data.data;
}

export async function recomputeScores(): Promise<RecomputeSummary> {
  const res = await api.post<RecomputeSummary>('/users/recompute-scores');
  return res.data;
}
