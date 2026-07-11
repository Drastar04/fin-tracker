import api from './client';
import type {
  AuthResponse, User, UserProfile,
} from '../types';

export const authApi = {
  register: async (data: { full_name: string; email: string; password: string; password_confirm: string }) => {
    const res = await api.post<AuthResponse>('/auth/register/', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/login/', data);
    return res.data;
  },

  logout: async (refresh: string) => {
    await api.post('/auth/logout/', { refresh });
  },

  getMe: async () => {
    const res = await api.get<User>('/auth/me/');
    return res.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const res = await api.patch<User>('/auth/me/', data);
    return res.data;
  },

  getProfileSettings: async () => {
    const res = await api.get<UserProfile>('/auth/profile/');
    return res.data;
  },

  updateProfileSettings: async (data: Partial<UserProfile>) => {
    const res = await api.patch<UserProfile>('/auth/profile/', data);
    return res.data;
  },

  completeOnboarding: async (data: {
    currency: string;
    country: string;
    timezone: string;
    default_monthly_opening_balance: number;
    theme: string;
  }) => {
    const res = await api.post<{ profile: UserProfile; message: string }>('/auth/onboarding/', data);
    return res.data;
  },

  changePassword: async (data: { old_password: string; new_password: string; new_password_confirm: string }) => {
    const res = await api.post<{ detail: string }>('/auth/change-password/', data);
    return res.data;
  },

  deleteAccount: async () => {
    await api.delete('/auth/delete-account/');
  },
};
