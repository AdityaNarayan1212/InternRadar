import { createContext } from 'react';
import type { User } from '../types';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  college?: string;
  branch?: string;
  year?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

// The context object (and its types) live here, separate from both the
// Provider component and the useAuth hook, so no file mixes a component
// export with a non-component export - keeps Fast Refresh working cleanly.
export const AuthContext = createContext<AuthContextType | null>(null);
