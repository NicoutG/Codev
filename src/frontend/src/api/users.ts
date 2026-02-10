import { apiClient } from './client';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'consultant' | 'editeur' | 'admin';
  category: 'polytech' | 'cti';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role: 'consultant' | 'editeur' | 'admin';
  category: 'polytech' | 'cti';
}

export interface UserUpdate {
  username?: string;
  email?: string;
  role?: 'consultant' | 'editeur' | 'admin';
  category?: 'polytech' | 'cti';
  password?: string;
  is_active?: boolean;
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/api/v1/users/');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(`/api/v1/users/${id}`);
    return response.data;
  },

  create: async (user: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>('/api/v1/users/', user);
    return response.data;
  },

  update: async (id: number, user: UserUpdate): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}`, user);
    return response.data;
  },

  updateRole: async (id: number, role: 'consultant' | 'editeur' | 'admin'): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}/role?role=${role}`);
    return response.data;
  },

  updateCategory: async (id: number, category: 'polytech' | 'cti'): Promise<User> => {
    const response = await apiClient.put<User>(`/api/v1/users/${id}/category?category=${category}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/users/${id}`);
  },
};
