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
  createdAt?: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  source: string;
  type: 'GOVERNMENT' | 'STARTUP' | 'CORPORATE' | 'RESEARCH';
  domain: string[];
  location?: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration?: string;
  deadline?: string;
  applyUrl: string;
  status: 'OPEN' | 'CLOSED' | 'REOPENING';
  verified: boolean;
  skillsReq: string[];
  criteria?: string;
  reopenDate?: string;
  description?: string;
  createdAt?: string;
  lastScraped?: string;
  fitScore?: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}