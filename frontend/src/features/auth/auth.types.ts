import type { User as ApiUser } from '../../types/api';

export type User = ApiUser;

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
