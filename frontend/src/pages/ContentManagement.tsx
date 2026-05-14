import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SafeImage from '@/components/ui/SafeImage';
import { Plus, Edit, Eye, Send, CheckCircle, XCircle, Clock, Filter, Search, Upload, Image as ImageIcon, Sparkles, RefreshCw, LayoutTemplate } from 'lucide-react';
import { cmsApi, Article, Category, CreateArticleRequest, UpdateArticleRequest, ReviewArticleRequest } from '@/services/cms';
import { mediaApi } from '@/services/media';
import { aiService } from '@/services/ai';
import { templateService, Template } from '@/services/templates';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import useAuthStore from '@/store/useAuthStore';

type StatusFilter = 'all' | 'draft' | 'pending_review' | 'published' | 'rejected';

// interface GeneratedImage {
//   url: string;
// }

const IMAGE_STYLES = [
  { value: 'realistic', label: '写实风格' },
  { value: 'artistic', label: '艺术风格' },
  { value: 'design', label: '设计风格' },
];

const ContentManagement: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isImageGenDialogOpen, setIsImageGenDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 文生图状态
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentBackend, setCurrentBackend] = useState<string>('');

  const [formData, setFormData] = useState<Partial<CreateArticleRequest & UpdateArticleRequest>>({
    category_code: 'products',
    title: '',
    summary: '',
    content: '',
    cover_image: '',
  });

  const [reviewData, setReviewData] = useState<ReviewArticleRequest>({
    status: 'approved',
    comment: '',
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, articlesData] = await Promise.all([
        cmsApi.getCategories(),
        cmsApi.getArticles(statusFilter === 'all' ? undefined : statusFilter, categoryFilter || undefined),
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
    } catch (error) {
      toast.error('加载数据失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await templateService.getTemplates({ category: '内容管理' });
      const templateList = data.map(t => t.template);
      setTemplates(templateList);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const applyTemplate = (template: Template) => {
    const content = template.content || {};
    setFormData({
      ...formData,
      title: content.title || '',
      summary: content.summary || '',
      content: content.content || '',
      cover_image: content.cover_image || '',
    });
    setSelectedTemplate(template.id);
    setShowTemplateDialog(false);
    toast.success(`已应用模板: ${template.name}`);
  };

  const handleCreateArticle = async () => {
    if (!formData.title || !formData.category_code) {
      toast.error('请填写标题和选择分类');
      return;
    }

    if (!user) {
      toast.error('用户未登录');
      return;
    }

    setIsSaving(true);
    try {
      await cmsApi.createArticle({
        ...formData,
        author_id: user.id,
      } as CreateArticleRequest);
      toast.success('文章创建成功');
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('创建文章失败');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    setIsUploading(true);
    try {
      const response = await mediaApi.uploadImage(file);
      if (response.success && response.file_url) {
        setFormData({ ...formData, cover_image: response.file_url });
        toast.success('图片上传成功');
      } else {
        toast.error(response.message || '上传失败');
      }
    } catch (error) {
      toast.error('上传图片失败');
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const selectFromGallery = () => {
    toast.info('图片库功能开发中，当前使用示例图片');
    const sampleImages = [
      '/images/products/insulation.svg',
      '/images/products/fireproof.svg',
      '/images/products/smart.svg',
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setFormData({ ...formData, cover_image: randomImage });
    toast.success('已选择示例图片');
  };

  const openImageGenDialog = () => {
    // 如果有文章标题，自动填充到提示词
    if (formData.title) {
      setImagePrompt(`关于"${formData.title}"的封面图片`);
    }
    setGeneratedImages([]);
    setIsImageGenDialogOpen(true);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('请输入图片描述');
      return;
    }
    setIsGeneratingImage(true);
    try {
      const response = await aiService.generateImage({
        prompt: imagePrompt,
        width: 800,
        height: 600,
        num_images: 2,
        style: imageStyle,
      });
      setGeneratedImages(response.images);
      setCurrentBackend(response.backend);
      toast.success('图片生成成功');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '网络错误，请稍后重试');
      console.error('Image generation error:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const selectGeneratedImage = (url: string) => {
    setFormData({ ...formData, cover_image: url });
    setIsImageGenDialogOpen(false);
    toast.success('已选择封面图片');
  };

  const handleAiGenerateContent = async () => {
    if (!formData.title) {
      toast.error('请先输入文章标题，AI 才能帮您生成内容');
      return;
    }
    setIsAiGenerating(true);
    try {
      const response = await fetch('/api/v1/document-ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `请帮我写一篇关于"${formData.title}"的文章，需要包含标题、摘要和正文内容。请用 Markdown 格式。`,
          doc_type: 'user_guide'
        }),
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        const generatedText = result.data.suggested || '';
        let newContent = formData.content || '';
        let newSummary = formData.summary || '';
        
        if (generatedText) {
          newContent = newContent ? newContent + '\n\n' + generatedText : generatedText;
          if (!formData.summary) {
            const sentences = generatedText.split(/[。！？.!?]/).filter((s: string) => s.trim());
            if (sentences.length > 0) {
              newSummary = sentences.slice(0, 2).join('。') + '。';
            }
          }
        }
        
        setFormData({ 
          ...formData, 
          content: newContent,
          summary: newSummary
        });
        toast.success('AI 已为您生成内容！');
      } else {
        toast.error(result.error || 'AI 生成失败，请稍后再试');
      }
    } catch (error) {
      console.error(error);
      toast.error('网络错误，请检查连接');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleUpdateArticle = async () => {
    if (!selectedArticle || !formData.title) {
      toast.error('请填写标题');
      return;
    }

    setIsSaving(true);
    try {
      await cmsApi.updateArticle(selectedArticle.id, formData as UpdateArticleRequest);
      toast.success('文章更新成功');
      setIsViewDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('更新文章失败');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async (article: Article) => {
    try {
      await cmsApi.submitForReview(article.id);
      toast.success('文章已提交审核');
      loadData();
    } catch (error) {
      toast.error('提交审核失败');
      console.error(error);
    }
  };

  const handleReviewArticle = async () => {
    if (!selectedArticle) return;

    setIsReviewing(true);
    try {
      await cmsApi.reviewArticle(selectedArticle.id, reviewData);
      toast.success('审核完成');
      setIsReviewDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error('审核失败');
      console.error(error);
    } finally {
      setIsReviewing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category_code: 'products',
      title: '',
      summary: '',
      content: '',
      cover_image: '',
    });
    setReviewData({
      status: 'approved',
      comment: '',
    });
    setSelectedArticle(null);
  };

  const openEditDialog = (article: Article) => {
    setSelectedArticle(article);
    setFormData({
      category_code: categories.find(c => c.id === article.categoryId)?.code || '',
      title: article.title,
      summary: article.summary,
      content: article.content,
      cover_image: article.coverImage,
    });
    setIsViewDialogOpen(true);
  };

  const openReviewDialog = (article: Article) => {
    setSelectedArticle(article);
    setIsReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: '草稿', variant: 'secondary' as const, icon: <Clock className="h-3 w-3" /> },
      pending_review: { label: '待审核', variant: 'default' as const, icon: <Clock className="h-3 w-3" /> },
      published: { label: '已发布', variant: 'success' as const, icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: '已拒绝', variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId) || categories.find(c => c.code === categoryId);
    return category?.name || '未知分类';
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">内容管理</h1>
                <p className="text-muted-foreground mt-1">管理和发布公司门户内容</p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新建文章
              </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索文章标题或摘要..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                      className="border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      <option value="all">全部状态</option>
                      <option value="draft">草稿</option>
                      <option value="pending_review">待审核</option>
                      <option value="published">已发布</option>
                      <option value="rejected">已拒绝</option>
                    </select>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border rounded-md px-3 py-2 bg-background text-sm"
                    >
                      <option value="">全部分类</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.code}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Articles List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredArticles.map(article => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {article.coverImage && (
                              <div className="w-24 h-24 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                                <SafeImage
                                  src={article.coverImage}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{article.title}</h3>
                                {getStatusBadge(article.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {getCategoryName(article.categoryId || '')}
                              </p>
                              {article.summary && (
                                <p className="text-muted-foreground text-sm mb-2">{article.summary}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>创建于 {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '-'}</span>
                                {article.publishedAt && (
                                  <span>发布于 {new Date(article.publishedAt).toLocaleDateString()}</span>
                                )}
                                <span>浏览 {article.viewCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {article.status === 'draft' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(article)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSubmitForReview(article)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                提交审核
                              </Button>
                            </>
                          )}
                          {article.status === 'pending_review' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(article)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                查看
                              </Button>
                              {user?.is_superuser && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openReviewDialog(article)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  审核
                                </Button>
                              )}
                            </>
                          )}
                          {article.status === 'published' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(article)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              查看
                            </Button>
                          )}
                          {article.status === 'rejected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(article)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              编辑
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredArticles.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center text-muted-foreground">
                      暂无文章
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建文章</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分类</Label>
              <select
                value={formData.category_code}
                onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                className="w-full border rounded-md px-3 py-2 bg-background"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.code}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>布局模板</Label>
              <Button
                variant="outline"
                onClick={() => {
                  loadTemplates();
                  setShowTemplateDialog(true);
                }}
                className="w-full justify-start"
              >
                <LayoutTemplate className="w-4 h-4 mr-2" />
                {selectedTemplate ? `已选择模板` : '选择布局模板'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入文章标题"
              />
            </div>
            <div className="space-y-2">
              <Label>摘要</Label>
              <Textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="请输入文章摘要"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>内容</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiGenerateContent}
                  disabled={isAiGenerating || !formData.title}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isAiGenerating ? 'AI 生成中...' : 'AI 辅助生成'}
                </Button>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="请输入文章内容，或点击上方 AI 辅助生成"
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label>封面图片</Label>
              <div className="space-y-2">
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="请输入封面图片URL，或点击下方按钮上传"
                />
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="cover-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? '上传中...' : '上传图片'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={selectFromGallery}
                    className="flex-1"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    从图库选择
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openImageGenDialog}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 生成封面图片
                </Button>
              </div>
              {formData.cover_image && (
                <div className="mt-2">
                  <SafeImage
                    src={formData.cover_image}
                    alt="封面预览"
                    className="max-h-40 rounded-md object-contain border"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateArticle} disabled={isSaving}>
              {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
              保存草稿
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>选择布局模板</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {templates.length === 0 ? (
              <div className="col-span-2 text-center text-muted-foreground py-8">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无内容管理模板</p>
                <p className="text-sm">请在模板管理中创建内容管理类模板</p>
              </div>
            ) : (
              templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selectedTemplate === template.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => applyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">{template.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {template.description || '无描述'}
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{template.template_type}</Badge>
                      {template.is_default && <Badge className="bg-blue-100 text-blue-800">默认</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.status === 'published' ? '查看文章' : '编辑文章'}</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>分类</Label>
                <select
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                  disabled={selectedArticle.status === 'published'}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.code}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>标题</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入文章标题"
                  disabled={selectedArticle.status === 'published'}
                />
              </div>
              <div className="space-y-2">
                <Label>摘要</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="请输入文章摘要"
                  rows={3}
                  disabled={selectedArticle.status === 'published'}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>内容</Label>
                  {selectedArticle.status !== 'published' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiGenerateContent}
                      disabled={isAiGenerating || !formData.title}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {isAiGenerating ? 'AI 生成中...' : 'AI 辅助生成'}
                    </Button>
                  )}
                </div>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="请输入文章内容，或点击上方 AI 辅助生成"
                  rows={10}
                  disabled={selectedArticle.status === 'published'}
                />
              </div>
              <div className="space-y-2">
                <Label>封面图片URL</Label>
                <Input
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="请输入封面图片URL"
                  disabled={selectedArticle.status === 'published'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
            {selectedArticle?.status !== 'published' && (
              <Button onClick={handleUpdateArticle} disabled={isSaving}>
                {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
                保存
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>审核文章</DialogTitle>
          </DialogHeader>
          {selectedArticle && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold">{selectedArticle.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{getCategoryName(selectedArticle.categoryId || '')}</p>
              </div>
              {selectedArticle.summary && (
                <p className="text-muted-foreground">{selectedArticle.summary}</p>
              )}
              {selectedArticle.content && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm">{selectedArticle.content}</p>
                </div>
              )}
              <div className="space-y-2 pt-4">
                <Label>审核结果</Label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'rejected' | 'requested_changes' })}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  <option value="approved">通过</option>
                  <option value="rejected">拒绝</option>
                  <option value="requested_changes">需要修改</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>审核意见</Label>
                <Textarea
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="请输入审核意见"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleReviewArticle} disabled={isReviewing}>
              {isReviewing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>}
              提交审核
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Generation Dialog */}
      <Dialog open={isImageGenDialogOpen} onOpenChange={setIsImageGenDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>AI 生成封面图片</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>图片描述</Label>
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="请描述您想要的封面图片，例如：'一个现代化的办公建筑，蓝天背景"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>图片风格</Label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 bg-background"
                >
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleGenerateImage} disabled={isGeneratingImage} className="w-full">
              {isGeneratingImage ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成图片
                </>
              )}
            </Button>
            {generatedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>生成的图片（点击选择）</Label>
                  {currentBackend && (
                    <Badge variant="secondary">使用 {currentBackend}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer border-2 border-transparent hover:border-blue-500 rounded-md overflow-hidden transition-all"
                      onClick={() => selectGeneratedImage(imgUrl)}
                    >
                      <SafeImage
                        src={imgUrl}
                        alt={`Generated image ${idx + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 bg-blue-600 text-white px-3 py-1 rounded">
                          选择此图片
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {generatedImages.length > 0 && (
              <p className="text-xs text-muted-foreground">
                提示：点击任意图片即可设为封面
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImageGenDialogOpen(false)}>
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentManagement;
