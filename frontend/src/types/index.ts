export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  is_superuser?: boolean;
  is_active?: boolean;
  status?: string;
  must_change_password?: boolean;
  password_changed_at?: string;
  last_login_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  permission?: string;
  requireAdmin?: boolean;
  children?: MenuItem[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}