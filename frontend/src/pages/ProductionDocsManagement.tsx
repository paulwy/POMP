import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Plus, Eye, Send, CheckCircle, Search, FileText, Book, ShieldCheck, Zap, FileSpreadsheet } from 'lucide-react';
import { productionDocsApi, ProductionDocument, DocumentCategory, CreateDocumentRequest, ReviewDocumentRequest, PRODUCTION_DOC_CATEGORIES } from '@/services/production-docs';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'draft' | 'pending_review' | 'published' | 'rejected';

const ProductionDocsManagement: React.FC = () => {
  const [documents, setDocuments] = useState<ProductionDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProductionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [categoryFilter] = useState<string>('');

  const [formData, setFormData] = useState<Partial<CreateDocumentRequest>>({
    category_code: 'tech_standards',
    title: '',
    code: '',
    version: '1.0',
    summary: '',
    content: '',
    file_url: '',
  });

  const [reviewData, setReviewData] = useState<ReviewDocumentRequest>({
    status: 'approved',
    comment: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, documentsData] = await Promise.all([
        productionDocsApi.getCategories(),
        productionDocsApi.getDocuments(statusFilter === 'all' ? undefined : statusFilter, categoryFilter || undefined),
      ]);
      if (categoriesData.length === 0) {
        await initializeCategories();
        const newCategories = await productionDocsApi.getCategories();
        setCategories(newCategories);
      } else {
        setCategories(categoriesData);
      }
      setDocuments(documentsData);
    } catch (error) {
      toast.error('加载数据失败');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeCategories = async () => {
    try {
      for (const category of PRODUCTION_DOC_CATEGORIES) {
        try {
          await productionDocsApi.createCategory({
            name: category.name,
            code: category.code,
            documentType: category.documentType,
            description: category.description,
            sortOrder: PRODUCTION_DOC_CATEGORIES.indexOf(category) + 1,
          });
        } catch (error) {
          console.warn(`Category ${category.code} might already exist`);
        }
      }
    } catch (error) {
      console.error('Failed to initialize categories', error);
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'standard':
        return <Zap className="h-4 w-4" />;
      case 'process':
        return <FileText className="h-4 w-4" />;
      case 'manual':
        return <Book className="h-4 w-4" />;
      case 'safety':
        return <ShieldCheck className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'record':
        return <FileSpreadsheet className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case 'standard':
        return '技术标准';
      case 'process':
        return '工艺流程';
      case 'manual':
        return '操作手册';
      case 'safety':
        return '安全规程';
      case 'quality':
        return '质量标准';
      case 'record':
        return '记录表格';
      default:
        return '其他';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>;
      case 'pending_review':
        return <Badge>待审核</Badge>;
      case 'published':
        return <Badge className="bg-green-500">已发布</Badge>;
      case 'rejected':
        return <Badge variant="destructive">已拒绝</Badge>;
      case 'archived':
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateDocument = async () => {
    if (!formData.title || !formData.category_code || !formData.code) {
      toast.error('请填写标题、选择分类和填写文档编号');
      return;
    }

    setIsSaving(true);
    try {
      await productionDocsApi.createDocument(formData as CreateDocumentRequest);
      toast.success('文档创建成功');
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('创建文档失败');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async (document: ProductionDocument) => {
    try {
      await productionDocsApi.submitForReview(document.id);
      toast.success('已提交审核');
      loadData();
    } catch (error) {
      toast.error('提交审核失败');
      console.error(error);
    }
  };

  const handleReviewDocument = async () => {
    if (!selectedDocument) return;

    setIsReviewing(true);
    try {
      await productionDocsApi.reviewDocument(selectedDocument.id, reviewData);
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
      category_code: 'tech_standards',
      title: '',
      code: '',
      version: '1.0',
      summary: '',
      content: '',
      file_url: '',
    });
    setReviewData({
      status: 'approved',
      comment: '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setSelectedDocument(null);
    setIsCreateDialogOpen(true);
  };

  const openViewDialog = (document: ProductionDocument) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const openReviewDialog = (document: ProductionDocument) => {
    setSelectedDocument(document);
    setReviewData({
      status: 'approved',
      comment: '',
    });
    setIsReviewDialogOpen(true);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.summary?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const needsReview = (doc: ProductionDocument): boolean => {
    if (!doc.lastReviewedAt || !doc.reviewCycleMonths) return false;
    const lastReviewed = new Date(doc.lastReviewedAt);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - lastReviewed.getFullYear()) * 12 +
      (now.getMonth() - lastReviewed.getMonth());
    return monthsDiff >= doc.reviewCycleMonths;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">生产文档管理</h1>
          <p className="text-muted-foreground mt-1">管理技术标准、工艺流程、安全规程等生产文档</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新建文档
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索文档标题、编号或摘要..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="draft">草稿</TabsTrigger>
          <TabsTrigger value="pending_review">待审核</TabsTrigger>
          <TabsTrigger value="published">已发布</TabsTrigger>
          <TabsTrigger value="rejected">已拒绝</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  <span>加载中...</span>
                </CardContent>
              </Card>
            ) : filteredDocuments.length === 0 ? (
              <Card>
                <CardContent className="text-muted-foreground text-center py-12">
                  <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无文档</p>
                  <p className="text-sm mt-1">点击"新建文档"创建第一个文档</p>
                </CardContent>
              </Card>
            ) : (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          {getDocumentTypeIcon(doc.categoryCode || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                            {doc.isTop && <Badge className="bg-yellow-500">置顶</Badge>}
                            {needsReview(doc) && <Badge className="bg-orange-500">待复审</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                            <span className="font-mono">{doc.code}</span>
                            <span>版本 {doc.version}</span>
                            <Badge variant="outline">
                              {getDocumentTypeText(doc.categoryCode || '')}
                            </Badge>
                            {doc.effectiveDate && (
                              <span>生效: {new Date(doc.effectiveDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          {doc.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {doc.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <span className="text-xs text-muted-foreground">
                              创建于 {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="ghost" onClick={() => openViewDialog(doc)}>
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        {doc.status === 'draft' && (
                          <Button size="sm" variant="ghost" onClick={() => handleSubmitForReview(doc)}>
                            <Send className="h-4 w-4 mr-1" />
                            提交审核
                          </Button>
                        )}
                        {doc.status === 'pending_review' && (
                          <Button size="sm" variant="default" onClick={() => openReviewDialog(doc)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            审核
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建生产文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-category">文档分类</Label>
                <select
                  id="doc-category"
                  value={formData.category_code}
                  onChange={(e) => setFormData({ ...formData, category_code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.code}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-code">文档编号</Label>
                <Input
                  id="doc-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如: QS-2024-001"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-title">文档标题</Label>
                <Input
                  id="doc-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入文档标题"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-version">版本号</Label>
                <Input
                  id="doc-version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="如: 1.0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-effective">生效日期</Label>
                <Input
                  id="doc-effective"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-review-cycle">复审周期（月）</Label>
                <Input
                  id="doc-review-cycle"
                  type="number"
                  value={formData.review_cycle_months}
                  onChange={(e) => setFormData({ ...formData, review_cycle_months: parseInt(e.target.value) || 0 })}
                  placeholder="如: 12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-summary">文档摘要</Label>
              <Textarea
                id="doc-summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="简要描述文档内容"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-content">文档内容</Label>
              <Textarea
                id="doc-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="输入文档详细内容..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">附件</Label>
              <Input
                id="doc-file"
                value={formData.file_url}
                onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                placeholder="上传文件或输入文件链接"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateDocument} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存草稿'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">{selectedDocument.code}</Badge>
                <Badge variant="outline">版本 {selectedDocument.version}</Badge>
                {getStatusBadge(selectedDocument.status)}
              </div>
              {selectedDocument.summary && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-muted-foreground">{selectedDocument.summary}</p>
                </div>
              )}
              {selectedDocument.content && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">文档内容</h4>
                  <div className="whitespace-pre-wrap text-sm">{selectedDocument.content}</div>
                </div>
              )}
              {selectedDocument.effectiveDate && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                  <span>生效日期: {new Date(selectedDocument.effectiveDate).toLocaleDateString()}</span>
                  {selectedDocument.expiryDate && (
                    <span>过期日期: {new Date(selectedDocument.expiryDate).toLocaleDateString()}</span>
                  )}
                  {selectedDocument.lastReviewedAt && (
                    <span>最后复审: {new Date(selectedDocument.lastReviewedAt).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>审核文档</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <h4 className="font-medium">{selectedDocument.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDocument.code} - 版本 {selectedDocument.version}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-status">审核结果</Label>
                <select
                  id="review-status"
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'rejected' | 'requested_changes' })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="approved">通过</option>
                  <option value="requested_changes">需要修改</option>
                  <option value="rejected">拒绝</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="review-comment">审核意见</Label>
                <Textarea
                  id="review-comment"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="请输入审核意见"
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleReviewDocument} disabled={isReviewing}>
              {isReviewing ? '审核中...' : '提交审核结果'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductionDocsManagement;
