export interface User {
  id: string;
  email: string;
  name: string;
  college?: string;
  branch?: string;
  year?: number;
  skills: string[];
  resumeUrl?: string;
  isAdmin?: boolean;
}

export type InternshipType = 'GOVERNMENT' | 'STARTUP' | 'CORPORATE' | 'RESEARCH';
export type InternshipStatus = 'OPEN' | 'CLOSED' | 'REOPENING';
export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'REJECTED' | 'SELECTED';
export type SortOption = 'recency' | 'deadline' | 'fitScore';

export interface Internship {
  id: string;
  title: string;
  company: string;
  source: string;
  type: InternshipType;
  domain: string[];
  location?: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration?: string;
  deadline?: string;
  applyUrl: string;
  status: InternshipStatus;
  verified: boolean;
  skillsReq: string[];
  criteria?: string;
  description?: string;
  createdAt: string;
  // Personalized fields - only present on an authenticated request.
  // fitScore/matchedSkills/missingSkills are further gated on an AI
  // analysis existing for this user+internship. Treat a missing fitScore
  // as "locked", never as 0.
  fitScore?: number;
  matchedSkills?: string[];
  missingSkills?: string[];
  isSaved?: boolean;
  applicationStatus?: ApplicationStatus;
}

export interface ShortlistItem extends Internship {
  applicationStatus: ApplicationStatus;
  savedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type NotificationType = 'DEADLINE_REMINDER' | 'REOPEN_ALERT' | 'NEW_MATCH' | 'WEEKLY_DIGEST';

export interface AppNotification {
  id: string;
  userId: string;
  internshipId?: string;
  type: NotificationType;
  message: string;
  read: boolean;
  sentAt: string;
}

export interface RecomputeSummary {
  success: boolean;
  computed: number;
  failed: number;
  skipped: boolean;
  reason?: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedInternships {
  success: boolean;
  data: Internship[];
  pagination: Pagination;
}

export interface InternshipFilters {
  search?: string;
  type?: InternshipType;
  domain?: string[];
  isRemote?: boolean;
  status?: InternshipStatus;
  underratedOnly?: boolean;
  minFitScore?: number;
  minStipend?: number;
  maxStipend?: number;
  sort?: SortOption;
}
