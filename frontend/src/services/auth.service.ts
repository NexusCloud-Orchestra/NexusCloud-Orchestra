import { getAccessToken, setAccessToken, refreshSession as clientRefreshSession } from '../api/client';
import { login as apiLogin, logout as apiLogout, me as apiMe } from '../api/auth';
import type { AuthTokens, LoginCredentials, User } from '../features/auth/auth.types';

class AuthService {
  public getAccessToken(): string | null {
    return getAccessToken();
  }

  public setAccessToken(token: string | null): void {
    setAccessToken(token);
  }

  public async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const tokens = await apiLogin(credentials.email, credentials.password);
    const user = await apiMe();
    return {
      user,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_in: 1800,
      },
    };
  }

  public async refresh(): Promise<AuthTokens> {
    const ok = await clientRefreshSession();
    if (!ok) {
      throw new Error('Refresh failed');
    }
    const token = getAccessToken();
    return {
      access_token: token || '',
      refresh_token: '',
      token_type: 'bearer',
      expires_in: 1800,
    };
  }

  public async getCurrentUser(): Promise<User> {
    return apiMe();
  }

  public async logout(): Promise<void> {
    await apiLogout();
  }
}

export const authService = new AuthService();
