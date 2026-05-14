import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Globe, Settings, Upload, Clock, ExternalLink, CheckCircle2, AlertCircle, Eye, X } from 'lucide-react';
import { websiteApi, WebsiteSettings, Deployment, WEBSITE_THEME_TEMPLATES, WebsiteThemeTemplate } from '@/services/website';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const THEME_STORAGE_KEY = 'website_selected_theme';
const SETTINGS_STORAGE_KEY = 'website_settings';

const WebsiteManagement: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings>({
    site_name: '三楷深发科技',
    site_description: '专业的科技服务提供商',
    logo_url: '/assets/logo.png',
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    contact_email: 'contact@example.com',
    contact_phone: '400-XXX-XXXX',
    contact_address: '河北省石家庄市',
    social_links: {},
  });
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [commitMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const savedSettingsStr = localStorage.getItem(SETTINGS_STORAGE_KEY);

    console.log('=== Website Management Initialization ===');
    console.log('savedTheme:', savedTheme);
    console.log('savedSettingsStr:', savedSettingsStr);

    if (savedTheme && savedSettingsStr) {
      try {
        const savedSettings = JSON.parse(savedSettingsStr);
        console.log('Parsed savedSettings:', savedSettings);
        
        const finalSettings: WebsiteSettings = {
          site_name: savedSettings.site_name || '三楷深发科技',
          site_description: savedSettings.site_description || '',
          logo_url: savedSettings.logo_url || '/assets/logo.png',
          primary_color: savedSettings.primary_color || '#3b82f6',
          secondary_color: savedSettings.secondary_color || '#1e40af',
          contact_email: savedSettings.contact_email || '',
          contact_phone: savedSettings.contact_phone || '',
          contact_address: savedSettings.contact_address || '',
          social_links: savedSettings.social_links || {},
        };
        console.log('Final settings to apply:', finalSettings);
        console.log('Primary color:', finalSettings.primary_color);
        
        setSelectedTheme(savedTheme);
        setSettings(finalSettings);
        loadDeployments();
        return;
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
    console.log('Loading from database...');
    loadSettings();
    loadDeployments();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await websiteApi.getSettings();
      if (response.success && response.data) {
        setSettings({
          site_name: response.data.site_name || '',
          site_description: response.data.site_description || '',
          logo_url: response.data.logo_url || '',
          primary_color: response.data.primary_color || '#3b82f6',
          secondary_color: response.data.secondary_color || '#1e40af',
          contact_email: response.data.contact_email || '',
          contact_phone: response.data.contact_phone || '',
          contact_address: response.data.contact_address || '',
          social_links: response.data.social_links || {},
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadDeployments = async () => {
    try {
      const response = await websiteApi.getDeployments();
      if (response.success && response.data) {
        setDeployments(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load deployments:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await websiteApi.updateSettings(settings);
      if (response.success) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        toast.success('设置已保存');
      } else {
        toast.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('保存设置失败');
    }
  };

  const handleApplyTheme = async (template: WebsiteThemeTemplate) => {
    console.log('=== handleApplyTheme called ===');
    console.log('Template:', template);
    
    const newSettings = { ...settings, ...template.settings };
    console.log('New settings to apply:', newSettings);
    console.log('Primary color to apply:', newSettings.primary_color);
    
    setSelectedTheme(template.id);
    setSettings(newSettings);
    localStorage.setItem(THEME_STORAGE_KEY, template.id);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    
    console.log('LocalStorage updated:', {
      theme: localStorage.getItem(THEME_STORAGE_KEY),
      settings: localStorage.getItem(SETTINGS_STORAGE_KEY)
    });
    
    try {
      const response = await websiteApi.updateSettings(newSettings);
      console.log('API response:', response);
      if (response.success) {
        toast.success(`已应用主题: ${template.name}\n页面颜色已更新，如需完全生效请刷新浏览器`);
      } else {
        toast.warning(`主题已应用，但保存失败: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast.warning(`主题已应用，但保存失败`);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await websiteApi.generate({ settings });
      if (response.success) {
        toast.success('网站已生成');
      } else {
        toast.error(response.message || '生成失败');
      }
    } catch (error) {
      console.error('Failed to generate website:', error);
      toast.error('生成网站失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const response = await websiteApi.preview({ settings });
      if (response.success && response.data?.preview_url) {
        setPreviewUrl(response.data.preview_url);
        setShowPreviewModal(true);
        toast.success('预览已生成');
      } else {
        toast.error(response.message || '预览生成失败');
      }
    } catch (error) {
      console.error('Failed to preview website:', error);
      toast.error('预览网站失败');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await websiteApi.deploy({
        target: 'cloudflare',
        commit_message: commitMessage || '更新网站',
        settings,
      });
      if (response.success) {
        toast.success('部署成功！');
        loadDeployments();
      } else {
        toast.error(response.message || '部署失败');
      }
    } catch (error) {
      console.error('Failed to deploy website:', error);
      toast.error('部署网站失败');
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  // Apply theme colors to CSS variables
  useEffect(() => {
    console.log('=== Applying theme colors to UI ===');
    console.log('Current settings:', settings);
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--theme-primary', settings.primary_color);
      root.style.setProperty('--theme-secondary', settings.secondary_color);
      console.log('CSS variables set:', {
        primary: settings.primary_color,
        secondary: settings.secondary_color
      });
    }
  }, [settings.primary_color, settings.secondary_color]);

  return (
    <>
      <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">网站管理</h1>
                <p className="text-gray-600">管理公司官网的内容、设置和部署</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handlePreview} disabled={isPreviewing} variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  {isPreviewing ? '预览生成中...' : '预览'}
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  <Globe className="w-4 h-4 mr-2" />
                  {isGenerating ? '生成中...' : '生成网站'}
                </Button>
                <Button onClick={handleDeploy} disabled={isDeploying}>
                  <Upload className="w-4 h-4 mr-2" />
                  {isDeploying ? '部署中...' : '部署到公网'}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="settings">
              <TabsList>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  网站设置
                </TabsTrigger>
                <TabsTrigger value="deployments">
                  <Upload className="w-4 h-4 mr-2" />
                  部署历史
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>主题模板</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">选择一个预设主题快速配置网站风格和架构</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {WEBSITE_THEME_TEMPLATES.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          暂无主题模板
                        </div>
                      ) : (
                        WEBSITE_THEME_TEMPLATES.map((template) => {
                          const layoutLabels: Record<string, string> = {
                            'single-page': '单页布局',
                            'multi-page': '多页布局',
                            'landing': '着陆页',
                            'blog': '博客布局',
                          };
                          const navLabels: Record<string, string> = {
                            'top': '顶部导航',
                            'side': '侧边导航',
                            'hybrid': '混合导航',
                          };
                          const enabledFeatures = Object.entries(template.features)
                            .filter(([, enabled]) => enabled)
                            .map(([key]) => {
                              const featureLabels: Record<string, string> = {
                                hero_section: '首页横幅',
                                about_section: '关于我们',
                                services_section: '服务展示',
                                products_section: '产品展示',
                                team_section: '团队介绍',
                                contact_section: '联系我们',
                                blog_section: '新闻博客',
                                footer_section: '页脚',
                              };
                              return featureLabels[key] || key;
                            });

                          return (
                            <button
                              key={template.id}
                              onClick={() => handleApplyTheme(template)}
                              className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 hover:shadow-md ${
                                selectedTheme === template.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div
                                  className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: template.preview_color }}
                                />
                                <span className="font-medium text-lg">{template.name}</span>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <span className="font-medium">布局:</span>
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">{layoutLabels[template.layout_type]}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <span className="font-medium">导航:</span>
                                  <span className="px-2 py-0.5 bg-gray-100 rounded">{navLabels[template.navigation_style]}</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-xs text-gray-600 font-medium mb-1">启用模块:</div>
                                <div className="flex flex-wrap gap-1">
                                  {enabledFeatures.slice(0, 4).map((feature, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                  {enabledFeatures.length > 4 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                                      +{enabledFeatures.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>基本设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="site_name">网站名称</Label>
                        <Input
                          id="site_name"
                          value={settings.site_name}
                          onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="logo_url">Logo URL</Label>
                        <Input
                          id="logo_url"
                          value={settings.logo_url}
                          onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site_description">网站描述</Label>
                      <Textarea
                        id="site_description"
                        value={settings.site_description}
                        onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="primary_color">主色调</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary_color"
                            type="color"
                            value={settings.primary_color}
                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                            className="w-20 h-10 p-1"
                          />
                          <Input
                            value={settings.primary_color}
                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="secondary_color">次色调</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary_color"
                            type="color"
                            value={settings.secondary_color}
                            onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                            className="w-20 h-10 p-1"
                          />
                          <Input
                            value={settings.secondary_color}
                            onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">联系方式</h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="contact_email">联系邮箱</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={settings.contact_email}
                            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contact_phone">联系电话</Label>
                          <Input
                            id="contact_phone"
                            value={settings.contact_phone}
                            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="contact_address">联系地址</Label>
                        <Input
                          id="contact_address"
                          value={settings.contact_address}
                          onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t">
                      <p className="text-sm text-gray-600">
                        点击"应用主题"可快速配置网站风格和架构
                      </p>
                      <Button onClick={handleSaveSettings}>
                        保存设置
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deployments">
                <Card>
                  <CardHeader>
                    <CardTitle>部署历史</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deployments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        暂无部署记录
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {deployments.map((deployment) => (
                          <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              {getStatusIcon(deployment.status)}
                              <div>
                                <div className="font-medium">
                                  部署到 {deployment.target}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(deployment.started_at).toLocaleString()} · {deployment.triggered_by}
                                </div>
                                {deployment.url && (
                                  <a
                                    href={deployment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 mt-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    访问网站
                                  </a>
                                )}
                                {deployment.error_message && (
                                  <div className="text-sm text-destructive mt-1">
                                    错误: {deployment.error_message}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(deployment.status)}`}>
                                {deployment.status}
                              </span>
                              {deployment.completed_at && (
                                <span className="text-sm text-gray-500">
                                  耗时: {Math.round((new Date(deployment.completed_at).getTime() - (new Date(deployment.started_at).getTime()) / 1000))}s
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>

    <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
      <DialogContent className="w-full max-w-5xl h-[80vh] p-0 overflow-hidden">
        <DialogHeader className="bg-gray-50 border-b px-6">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              网站预览
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreviewModal(false)}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {previewUrl && (
          <iframe
            src={previewUrl}
            className="w-full h-[calc(100%-65px)] border-0"
            title="网站预览"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default WebsiteManagement;
