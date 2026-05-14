import apiClient from '@/api/client';
import { API_BASE_URL } from './workflow';

const WEBSITE_API_BASE = `${API_BASE_URL}/website`;

export interface WebsiteSettings {
  site_name: string;
  site_description: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_links: Record<string, string>;
}

export interface Deployment {
  id: string;
  status: string;
  target: string;
  started_at: string;
  completed_at?: string;
  url?: string;
  error_message?: string;
  triggered_by: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface GenerateWebsiteRequest {
  settings?: WebsiteSettings;
}

export interface DeployWebsiteRequest {
  target: string;
  commit_message?: string;
  settings?: WebsiteSettings;
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    status?: string;
    preview_url?: string;
    output_path?: string;
    build_id?: string;
  };
  message?: string;
}

export interface WebsiteThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview_color: string;
  settings: Partial<WebsiteSettings>;
  layout_type: 'single-page' | 'multi-page' | 'landing' | 'blog';
  navigation_style: 'top' | 'side' | 'hybrid';
  features: {
    hero_section: boolean;
    about_section: boolean;
    services_section: boolean;
    products_section: boolean;
    team_section: boolean;
    contact_section: boolean;
    blog_section: boolean;
    footer_section: boolean;
  };
}

export const WEBSITE_THEME_TEMPLATES: WebsiteThemeTemplate[] = [
  {
    id: 'tech-blue',
    name: '科技企业',
    description: '适合科技公司的专业主题，单页布局，突出产品和服务',
    preview_color: '#3b82f6',
    layout_type: 'single-page',
    navigation_style: 'top',
    features: {
      hero_section: true,
      about_section: true,
      services_section: true,
      products_section: true,
      team_section: false,
      contact_section: true,
      blog_section: false,
      footer_section: true,
    },
    settings: {
      site_name: '科技创新有限公司',
      site_description: '创新科技，引领未来，为企业提供智能化解决方案',
      primary_color: '#3b82f6',
      secondary_color: '#1e40af',
    },
  },
  {
    id: 'business-green',
    name: '商务服务',
    description: '适合企业服务平台，多页布局，功能齐全',
    preview_color: '#10b981',
    layout_type: 'multi-page',
    navigation_style: 'top',
    features: {
      hero_section: true,
      about_section: true,
      services_section: true,
      products_section: false,
      team_section: true,
      contact_section: true,
      blog_section: true,
      footer_section: true,
    },
    settings: {
      site_name: '企业服务平台',
      site_description: '专业服务，值得信赖，助力企业成长',
      primary_color: '#10b981',
      secondary_color: '#059669',
    },
  },
  {
    id: 'elegant-purple',
    name: '创意设计',
    description: '适合设计工作室，着陆页布局，视觉冲击力强',
    preview_color: '#8b5cf6',
    layout_type: 'landing',
    navigation_style: 'side',
    features: {
      hero_section: true,
      about_section: false,
      services_section: true,
      products_section: true,
      team_section: false,
      contact_section: true,
      blog_section: false,
      footer_section: false,
    },
    settings: {
      site_name: '创意设计工作室',
      site_description: '设计创造价值，用创意点亮品牌',
      primary_color: '#8b5cf6',
      secondary_color: '#7c3aed',
    },
  },
  {
    id: 'warm-orange',
    name: '电商零售',
    description: '适合电商商城，多页布局，注重商品展示',
    preview_color: '#f97316',
    layout_type: 'multi-page',
    navigation_style: 'top',
    features: {
      hero_section: true,
      about_section: false,
      services_section: false,
      products_section: true,
      team_section: false,
      contact_section: true,
      blog_section: true,
      footer_section: true,
    },
    settings: {
      site_name: '优选商城',
      site_description: '品质生活，尽在掌握，精选好物等您发现',
      primary_color: '#f97316',
      secondary_color: '#ea580c',
    },
  },
  {
    id: 'professional-gray',
    name: '金融咨询',
    description: '适合金融机构，稳重专业，侧边导航',
    preview_color: '#6b7280',
    layout_type: 'multi-page',
    navigation_style: 'hybrid',
    features: {
      hero_section: false,
      about_section: true,
      services_section: true,
      products_section: true,
      team_section: true,
      contact_section: true,
      blog_section: true,
      footer_section: true,
    },
    settings: {
      site_name: '金融咨询集团',
      site_description: '专业理财，稳健增长，您的财富管理专家',
      primary_color: '#4b5563',
      secondary_color: '#374151',
    },
  },
  {
    id: 'vibrant-red',
    name: '文化传媒',
    description: '适合媒体机构，博客布局，内容丰富',
    preview_color: '#ef4444',
    layout_type: 'blog',
    navigation_style: 'side',
    features: {
      hero_section: true,
      about_section: false,
      services_section: false,
      products_section: false,
      team_section: false,
      contact_section: true,
      blog_section: true,
      footer_section: true,
    },
    settings: {
      site_name: '文化传媒',
      site_description: '精彩内容，无限可能，传递价值资讯',
      primary_color: '#ef4444',
      secondary_color: '#dc2626',
    },
  },
];

export const websiteApi = {
  getSettings: async (): Promise<ApiResponse<WebsiteSettings>> => {
    const response = await apiClient.get(`${WEBSITE_API_BASE}/settings`);
    return response.data;
  },

  updateSettings: async (settings: WebsiteSettings): Promise<ApiResponse<WebsiteSettings>> => {
    const response = await apiClient.put(`${WEBSITE_API_BASE}/settings`, settings);
    return response.data;
  },

  generate: async (req?: GenerateWebsiteRequest): Promise<GenerateResponse> => {
    const response = await apiClient.post(`${WEBSITE_API_BASE}/generate`, req || {});
    return response.data;
  },

  preview: async (req?: GenerateWebsiteRequest): Promise<GenerateResponse> => {
    const response = await apiClient.post(`${WEBSITE_API_BASE}/preview`, req || {});
    return response.data;
  },

  deploy: async (req: DeployWebsiteRequest): Promise<ApiResponse<Deployment>> => {
    const response = await apiClient.post(`${WEBSITE_API_BASE}/deploy`, req);
    return response.data;
  },

  getDeployments: async (): Promise<ApiResponse<Deployment[]>> => {
    const response = await apiClient.get(`${WEBSITE_API_BASE}/deployments`);
    return response.data;
  },
};

export default websiteApi;
