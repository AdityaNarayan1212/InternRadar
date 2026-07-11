export interface JwtPayload {
  userId: string;
  email: string;
}

export interface InternshipFilters {
  type?: 'government' | 'startup' | 'corporate';
  isRemote?: boolean;
  domain?: string;
  location?: string;
  status?: 'open' | 'closed' | 'reopening';
  search?: string;
}