import { apiClient } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: 'consultant' | 'editeur' | 'admin';
  is_active: boolean;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/api/v1/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/api/v1/auth/me');
    return response.data;
  },

  changePassword: async (data: PasswordChangeRequest): Promise<void> => {
    await apiClient.post('/api/v1/auth/change-password', data);
  },
};
