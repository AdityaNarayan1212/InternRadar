export interface User {
  id: string;
  email: string;
  name: string;
  college?: string | null;
  branch?: string | null;
  year?: number | null;
  skills: string[];
  resumeUrl?: string | null;
}

// These mirror the Prisma enums exactly (server returns them as-is, uppercase)
export type InternshipType = 'GOVERNMENT' | 'STARTUP' | 'CORPORATE' | 'RESEARCH';
export type InternshipStatus = 'OPEN' | 'CLOSED' | 'REOPENING';
export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'SELECTED';

export interface Internship {
  id: string;
  title: string;
  company: string;
  source: string;
  type: InternshipType;
  domain: string[];
  location: string | null;
  isRemote: boolean;
  stipendMin: number | null;
  stipendMax: number | null;
  duration: string | null;
  deadline: string | null;
  applyUrl: string;
  status: InternshipStatus;
  verified: boolean;
  skillsReq: string[];
  criteria: string | null;
  description: string | null;
  createdAt: string;
}

export interface SavedInternship {
  id: string;
  userId: string;
  internshipId: string;
  notifyReopen: boolean;
  applicationStatus: ApplicationStatus;
  notes: string | null;
  createdAt: string;
  internship: Internship;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: Pagination;
}

export interface InternshipFilters {
  type?: InternshipType;
  isRemote?: boolean;
  domain?: string;
  search?: string;
  status?: InternshipStatus;
  page?: number;
  limit?: number;
}

export interface AiAnalysis {
  id: string;
  userId: string;
  internshipId: string;
  fitScore: number | null;
  matchReasons: string[];
  missingSkills: string[];
  coverLetter: string | null;
  generatedAt: string;
}

export interface AnalyzeInternshipFitResponse {
  success: boolean;
  data: AiAnalysis;
  cached: boolean;
}
