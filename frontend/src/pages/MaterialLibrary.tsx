import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Star,
  StarOff,
  Link,
  Image,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Button, Input, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Card, Textarea } from '../components/ui';
import HelpPanel from '../components/HelpPanel';
import {
  materialService,
  MaterialItem,
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from '../services/material';

const MATERIAL_TYPES = [
  { value: 'article', label: '文章' },
  { value: 'image', label: '图片' },
  { value: 'template', label: '模板' },
  { value: 'other', label: '其他' },
];

// 三楷深发行业参考资源
const PRESET_URLS = [
  // 建筑工程行业
  { name: '建筑时报', url: 'https://www.jianzhushibao.com' },
  { name: '中国建筑网', url: 'https://www.chinabuildingcenter.com' },
  
  // 设计灵感
  { name: 'Pinterest设计', url: 'https://www.pinterest.com' },
  { name: 'Dribbble设计', url: 'https://dribbble.com' },
  
  // 技术参考
  { name: '建筑技术论坛', url: 'https://www.archdaily.cn' },
  { name: '工程技术资料', url: 'https://www.gong123.com' },
  
  // 行业资讯
  { name: '工程建设信息', url: 'https://www.cein.gov.cn' },
  { name: '建材市场信息', url: 'https://www.jiancai365.com' },
];

export default function MaterialLibrary() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCrawlDialog, setShowCrawlDialog] = useState(false);
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  const [formData, setFormData] = useState<CreateMaterialRequest>({
    name: '',
    material_type: 'article',
    category: '',
    content: '',
    url: '',
    description: '',
    tags: [],
  });

  const [crawlUrl, setCrawlUrl] = useState('');
  const [crawlResult, setCrawlResult] = useState<{
    title: string;
    content: string;
    images: string[];
  } | null>(null);
  const [crawlLoading, setCrawlLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, [page, searchTerm, selectedType, selectedCategory]);

  useEffect(() => {
    const cats = [...new Set(materials.map((m) => m.category).filter(Boolean))];
    setCategories(cats as string[]);
  }, [materials]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const result = await materialService.list({
        keyword: searchTerm || undefined,
        material_type: selectedType || undefined,
        category: selectedCategory || undefined,
        page,
        page_size: pageSize,
      });
      setMaterials(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await materialService.create(formData);
      setShowCreateDialog(false);
      setFormData({
        name: '',
        material_type: 'article',
        category: '',
        content: '',
        url: '',
        description: '',
        tags: [],
      });
      fetchMaterials();
    } catch (error) {
      console.error('Failed to create material:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingMaterial) return;
    try {
      const updateData: UpdateMaterialRequest = {
        name: formData.name || undefined,
        category: formData.category || undefined,
        description: formData.description || undefined,
        tags: (formData.tags || []).length > 0 ? (formData.tags || []) : undefined,
      };
      await materialService.update(editingMaterial.id, updateData);
      setShowEditDialog(false);
      setEditingMaterial(null);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to update material:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个素材吗？')) return;
    try {
      await materialService.delete(id);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const handleToggleFavorite = async (material: MaterialItem) => {
    try {
      await materialService.update(material.id, {
        is_favorite: !material.is_favorite,
      });
      fetchMaterials();
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const handleCrawl = async () => {
    if (!crawlUrl) return;
    setCrawlLoading(true);
    try {
      const result = await materialService.crawl(crawlUrl);
      setCrawlResult({
        title: result.title,
        content: result.content,
        images: result.images,
      });
    } catch (error) {
      console.error('Failed to crawl:', error);
    }
    setCrawlLoading(false);
  };

  const handleSaveCrawlResult = async () => {
    if (!crawlResult) return;
    try {
      await materialService.create({
        name: crawlResult.title || '未命名素材',
        material_type: 'article',
        content: crawlResult.content,
        url: crawlUrl,
        description: '通过网页抓取创建',
        tags: ['crawled'],
      });
      setShowCrawlDialog(false);
      setCrawlUrl('');
      setCrawlResult(null);
      fetchMaterials();
    } catch (error) {
      console.error('Failed to save crawled material:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'template':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return MATERIAL_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image':
        return 'bg-primary/10 text-primary';
      case 'article':
        return 'bg-success/10 text-success';
      case 'template':
        return 'bg-info/10 text-info';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">素材库管理</h1>
          <p className="text-gray-500 mt-1">管理和组织您的素材资源</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowHelpPanel(true)} variant="outline">
            <HelpCircle className="w-4 h-4 mr-2" />
            帮助中心
          </Button>
          <Button onClick={() => setShowCrawlDialog(true)} className="bg-purple-600 hover:bg-purple-700">
            <Sparkles className="w-4 h-4 mr-2" />
            智能抓取
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            创建素材
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索素材名称..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              {MATERIAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  素材名称
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  类型
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  分类
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  标签
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  创建时间
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    暂无素材，点击上方按钮创建
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr
                    key={material.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${getTypeColor(material.material_type)}`}
                        >
                          {getTypeIcon(material.material_type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {material.name}
                          </div>
                          {material.url && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {material.url}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getTypeColor(material.material_type)}>
                        {getTypeLabel(material.material_type)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600">
                        {material.category || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {material.tags?.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        )) || '-'}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-500">
                        {new Date(material.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleFavorite(material)}
                          className={`p-2 rounded-lg transition-colors ${
                            material.is_favorite
                              ? 'text-warning hover:bg-warning/10'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {material.is_favorite ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingMaterial(material);
                            setFormData({
                              name: material.name,
                              material_type: material.material_type,
                              category: material.category || '',
                              content: material.content || '',
                              url: material.url || '',
                              description: material.description || '',
                              tags: material.tags || [],
                            });
                            setShowEditDialog(true);
                          }}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="p-2 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && materials.length > 0 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <span className="text-sm text-gray-500">
              显示 {((page - 1) * pageSize + 1)}-{Math.min(page * pageSize, total)} 条，
              共 {total} 条
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[60px] text-center">
                {page} / {Math.ceil(total / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(Math.ceil(total / pageSize), page + 1))}
                disabled={page >= Math.ceil(total / pageSize)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建素材</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材名称 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入素材名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材类型
              </label>
              <select
                value={formData.material_type}
                onChange={(e) =>
                  setFormData({ ...formData, material_type: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MATERIAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="输入分类名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <Input
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                placeholder="输入素材链接"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入素材描述"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <Input
                value={(formData.tags || []).join(',')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="多个标签用逗号分隔"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditDialog}
        onOpenChange={() => {
          setShowEditDialog(false);
          setEditingMaterial(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑素材</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                素材名称 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="输入素材名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="输入分类名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="输入素材描述"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签
              </label>
              <Input
                value={(formData.tags || []).join(',')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="多个标签用逗号分隔"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCrawlDialog}
        onOpenChange={() => {
          setShowCrawlDialog(false);
          setCrawlUrl('');
          setCrawlResult(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>智能网页抓取</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择预设URL
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_URLS.map((preset) => (
                  <Button
                    key={preset.url}
                    variant="outline"
                    size="sm"
                    onClick={() => setCrawlUrl(preset.url)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                网页URL *
              </label>
              <div className="flex gap-2">
                <Input
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="输入要抓取的网页地址"
                  className="flex-1"
                />
                <Button onClick={handleCrawl} disabled={!crawlUrl || crawlLoading}>
                  {crawlLoading ? '抓取中...' : '抓取'}
                </Button>
              </div>
            </div>

            {crawlResult && (
              <div className="space-y-4">
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">抓取结果</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        标题
                      </label>
                      <Input
                        value={crawlResult.title}
                        onChange={(e) =>
                          setCrawlResult({ ...crawlResult, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        内容预览
                      </label>
                      <Textarea
                        value={crawlResult.content.substring(0, 500)}
                        readOnly
                        rows={5}
                        className="bg-gray-100"
                      />
                    </div>
                    {crawlResult.images.length > 0 && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">
                          图片 ({crawlResult.images.length} 张)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {crawlResult.images.slice(0, 4).map((_, index) => (
                            <div
                              key={index}
                              className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center"
                            >
                              <Image className="w-8 h-8 text-gray-400" />
                            </div>
                          ))}
                          {crawlResult.images.length > 4 && (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-500">
                              +{crawlResult.images.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCrawlDialog(false);
                  setCrawlUrl('');
                  setCrawlResult(null);
                }}
              >
                关闭
              </Button>
              {crawlResult && (
                <Button onClick={handleSaveCrawlResult}>保存为素材</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <HelpPanel
        isOpen={showHelpPanel}
        onClose={() => setShowHelpPanel(false)}
        context="material-library"
      />
    </div>
  );
}
