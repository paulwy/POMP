import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

// HTTP 状态码对应的中文错误信息
const httpErrorMessages: Record<number, string> = {
  400: '请求参数错误，请检查您的输入',
  401: '登录已过期或未登录，请重新登录',
  403: '没有权限访问该资源',
  404: '请求的资源不存在',
  405: '不允许的请求方法',
  408: '请求超时，请稍后重试',
  409: '请求冲突',
  413: '请求内容过大',
  422: '请求数据验证失败',
  429: '请求过于频繁，请稍后重试',
  500: '服务器内部错误，请稍后重试',
  501: '服务器不支持该功能',
  502: '网关错误',
  503: '服务暂不可用，请稍后重试',
  504: '网关超时',
};

// 网络错误提示
const networkErrorMessages: Record<string, string> = {
  'Network Error': '网络连接失败，请检查您的网络设置',
  'timeout': '请求超时，请稍后重试',
};

const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 处理 401 错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('token_type');
      // 避免无限跳转，只有在非登录页时才跳转
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    // 创建中文错误信息
    let chineseErrorMessage: string;
    
    if (error.response) {
      // HTTP 响应错误
      const status = error.response.status;
      chineseErrorMessage = httpErrorMessages[status] || `请求失败 (${status})`;
      
      // 如果后端返回了自定义错误消息，优先使用
      const responseData = error.response.data as { message?: string; error?: string };
      if (responseData?.message) {
        chineseErrorMessage = responseData.message;
      } else if (responseData?.error) {
        chineseErrorMessage = responseData.error;
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      const message = error.message || 'Network Error';
      chineseErrorMessage = networkErrorMessages[message] || '网络连接失败，请稍后重试';
    } else {
      // 请求配置出错
      chineseErrorMessage = '请求配置错误，请稍后重试';
    }

    // 创建一个新的错误对象，包含中文错误信息
    const enhancedError = new Error(chineseErrorMessage) as Error & {
      response?: unknown;
      config?: unknown;
      code?: string;
    };
    enhancedError.response = error.response;
    enhancedError.config = error.config;
    enhancedError.code = error.code;

    return Promise.reject(enhancedError);
  },
);

export default apiClient;
