export interface User {
  id: string;
  email: string;
  name: string;
  college: string;
  branch: string;
  year: number;
  skills: string[];
  resumeUrl?: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  source: string;
  type: 'government' | 'startup' | 'corporate';
  domain: string[];
  location: string;
  isRemote: boolean;
  stipendMin?: number;
  stipendMax?: number;
  duration: string;
  deadline?: string;
  applyUrl: string;
  status: 'open' | 'closed' | 'reopening';
  verified: boolean;
  skillsRequired: string[];
  criteria?: string;
  fitScore?: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}