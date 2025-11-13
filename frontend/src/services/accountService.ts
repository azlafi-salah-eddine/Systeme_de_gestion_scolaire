import api from './api';

export interface UserProfile {
  id: number;
  nom?: string;
  prenom?: string;
  nom_complet?: string;
  name?: string;
  email: string;
  telephone?: string;
  role_id?: number;
  role?: {
    id: number;
    nom: string;
    description?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdatePayload {
  nom?: string;
  prenom?: string;
  email: string;
  telephone?: string;
}

export interface PasswordUpdatePayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AccountStatistics {
  account_created: string;
  last_login: string;
  role: string;
  role_description?: string;
}

class AccountService {
  // Get user profile
  async getProfile(): Promise<{ success: boolean; data: UserProfile }> {
    const response = await api.get('/account/profile');
    return response.data;
  }

  // Update user profile
  async updateProfile(payload: ProfileUpdatePayload): Promise<{ success: boolean; message: string; data: UserProfile }> {
    const response = await api.put('/account/profile', payload);
    return response.data;
  }

  // Update password
  async updatePassword(payload: PasswordUpdatePayload): Promise<{ success: boolean; message: string }> {
    const response = await api.put('/account/password', payload);
    return response.data;
  }

  // Get account statistics
  async getStatistics(): Promise<{ success: boolean; data: AccountStatistics }> {
    const response = await api.get('/account/statistics');
    return response.data;
  }
}

export const accountService = new AccountService();
export default accountService;
