import { create } from 'zustand';
import { User } from '@/types';
import apiClient from '@/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUserInfo: () => Promise<void>;
  initialize: () => void;
  _fetchController: AbortController | null;
  setMustChangePassword: (value: boolean) => void;
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('解析 JWT 失败:', error);
    return null;
  }
};

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  _fetchController: null,

  initialize: () => {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined' && token !== 'null') {
      try {
        const payload = parseJwt(token);
        if (payload) {
          const user: User = {
            id: payload?.user_id || '',
            username: payload?.sub || '',
            email: '',
            name: '',
            is_superuser: payload?.is_superuser || false,
            is_active: true,
          };
          set({ token, user, isAuthenticated: true });
          setTimeout(() => get().fetchUserInfo(), 100);
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
      }
    }
  },

  login: async (username: string, password: string) => {
    const response = await apiClient.post('/v1/auth/login', {
      username,
      password,
    });
    const { token, user } = response.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('token_type', 'Bearer');

    const payload = parseJwt(token);
    const userData: User = {
      id: user?.id || payload?.user_id || '',
      username: user?.username || payload?.sub || username,
      email: user?.email || '',
      name: user?.name || '',
      is_superuser: user?.is_superuser || payload?.is_superuser || false,
      is_active: user?.is_active ?? true,
      status: user?.status,
      must_change_password: user?.must_change_password,
      password_changed_at: user?.password_changed_at,
      last_login_at: user?.last_login_at,
      created_at: user?.created_at,
      updated_at: user?.updated_at,
    };

    set({ token, user: userData, isAuthenticated: true });
  },

  fetchUserInfo: async () => {
    const { user } = get();
    if (!user?.id) return;

    const controller = new AbortController();
    set({ _fetchController: controller });

    try {
      const response = await apiClient.get(`/v1/users/${user.id}/info`, {
        signal: controller.signal,
      });
      if (response.data?.data) {
        const userData = response.data.data;
        set({
          user: {
            ...user,
            email: userData.email || user.email,
            name: userData.name || user.name,
            phone: userData.phone || user.phone,
            avatar: userData.avatar,
            is_superuser: userData.is_superuser ?? user.is_superuser,
            is_active: userData.is_active ?? user.is_active,
            status: userData.status,
            must_change_password: userData.must_change_password,
            password_changed_at: userData.password_changed_at,
            last_login_at: userData.last_login_at,
          }
        });
      }
    } catch (error) {
      if ((error as { name?: string })?.name !== 'CanceledError' && (error as { name?: string })?.name !== 'AbortError') {
        console.warn('获取用户信息失败（不影响应用使用）:', error);
      }
    } finally {
      set({ _fetchController: null });
    }
  },

  setMustChangePassword: (value: boolean) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, must_change_password: value } });
    }
  },

  logout: () => {
    const controller = get()._fetchController;
    if (controller) {
      controller.abort();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('token_type');
    set({ user: null, token: null, isAuthenticated: false, _fetchController: null });
  },
}));

export default useAuthStore;
