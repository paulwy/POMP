import apiClient from '../api/client';

export interface User {
  id: string;
  username: string;
  email?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  is_superuser: boolean;
  is_active: boolean;
  status: string;
  must_change_password: boolean;
  password_changed_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  name?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  is_superuser: boolean;
}

export interface UpdateUserRequest {
  email: string;
  name?: string;
  phone?: string;
  is_active: boolean;
  is_superuser: boolean;
  password?: string;
}

export interface ApproveUserRequest {
  user_id: string;
  approved: boolean;
  comment?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error: string | null;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>('/v1/auth/login', credentials);
  return response.data.data;
};

export const register = async (data: RegisterRequest): Promise<User> => {
  const response = await apiClient.post<ApiResponse<{ user: User; message: string }>>('/v1/auth/register', data);
  return response.data.data.user;
};

export const getUsers = async (page = 1, pageSize = 10): Promise<{ data: User[]; total: number; page: number; page_size: number }> => {
  const response = await apiClient.get<{ success: boolean; data: User[]; total: number; page: number; page_size: number }>(
    '/v1/auth/users',
    { params: { page, page_size: pageSize } }
  );
  return response.data;
};

export const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/v1/users/all');
  return response.data.data;
};

export const getPendingUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<ApiResponse<User[]>>('/v1/auth/users/pending');
  return response.data.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<ApiResponse<User>>('/v1/auth/users', data);
  return response.data.data;
};

export const updateUser = async (userId: string, data: UpdateUserRequest): Promise<User> => {
  const response = await apiClient.put<ApiResponse<User>>(`/v1/auth/users/${userId}`, data);
  return response.data.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/v1/auth/users/${userId}`);
};

export const approveUser = async (data: ApproveUserRequest): Promise<User> => {
  const response = await apiClient.post<ApiResponse<{ user: User; message: string; comment?: string }>>('/v1/auth/users/approve', data);
  return response.data.data.user;
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<User> => {
  const response = await apiClient.patch<ApiResponse<User>>(`/v1/auth/users/${userId}/status`, { is_active: isActive });
  return response.data.data;
};

export const getUserInfo = async (userId: string): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>(`/v1/users/${userId}/info`);
  return response.data.data;
};

export const changePassword = async (data: ChangePasswordRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/v1/auth/change-password', data);
  return response.data.data;
};
