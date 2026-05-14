import { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Settings,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Code,
  Download,
  Star,
  TrendingUp,
  Copy,
  FolderOpen,
  MoreHorizontal,
  LayoutGrid,
  List,
  GripVertical,
  Trash,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Bookmark,
  Upload,
  FileText,
  Hash,
} from 'lucide-react';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import * as YAML from 'js-yaml';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Card,
  CardContent,
} from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/Tabs';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { toast } from 'sonner';
import useAuthStore from '@/store/useAuthStore';
import {
  templateService,
  Template,
  TemplateWithStats,
  TemplateVersion,
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  getCategoryLabel,
  getTypeLabel,
} from '@/services/templates';

interface TemplateQueryParams {
  user_id?: string;
  category?: string;
  template_type?: string;
  is_active?: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  '组织架构': <Hash className="h-4 w-4" />,
  '审批流程': <Zap className="h-4 w-4" />,
  '合同模板': <FileText className="h-4 w-4" />,
  '职位级别': <Bookmark className="h-4 w-4" />,
};

const getCategoryIcon = (category: string) => {
  return categoryIcons[category] || <Settings className="h-4 w-4" />;
};

export default function TemplateManagement() {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<TemplateWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importFormat, setImportFormat] = useState<'json' | 'yaml'>('json');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params: TemplateQueryParams = { user_id: user?.id };
      if (filterCategory !== 'all') params.category = filterCategory;
      if (filterType !== 'all') params.template_type = filterType;
      if (filterActive !== 'all') params.is_active = filterActive === 'true';

      const data = await templateService.getTemplates(params);
      setTemplates(data);
    } catch {
      toast('❌ 加载失败：无法加载模板列表');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await templateService.getCategories();
      setCategories(data);
    } catch {
      console.error('加载分类失败');
    }
  };

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [filterCategory, filterType, filterActive, user?.id]);

  const handleInitDefaults = async () => {
    try {
      await templateService.initDefaults();
      toast('✅ 初始化成功：默认模板已加载');
      loadTemplates();
      loadCategories();
    } catch {
      toast('❌ 初始化失败：无法初始化默认模板');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除此模板吗？')) return;
    try {
      await templateService.deleteTemplate(id);
      toast('✅ 删除成功');
      loadTemplates();
    } catch {
      toast('❌ 删除失败：无法删除模板');
    }
  };

  const handleExport = (template: Template) => {
    try {
      const data = {
        name: template.name,
        code: template.code,
        description: template.description,
        category: template.category,
        template_type: template.template_type,
        content: template.content,
        variables: template.variables,
        tags: template.tags,
        version: template.version,
        export_version: '1.0',
        exported_at: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${template.code}_v${template.version}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('✅ 导出成功');
    } catch {
      toast('❌ 导出失败：无法导出模板');
    }
  };

  const handleExportAll = (format: 'json' | 'yaml' | 'xlsx' = 'json') => {
    try {
      const data = templates.map(t => ({
        name: t.template.name,
        code: t.template.code,
        description: t.template.description,
        category: t.template.category,
        template_type: t.template.template_type,
        content: JSON.stringify(t.template.content),
        variables: JSON.stringify(t.template.variables),
        tags: t.template.tags.join(','),
        version: t.template.version,
        is_active: t.template.is_active,
        is_default: t.template.is_default,
        sort_order: t.template.sort_order,
      }));

      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (format === 'yaml') {
        const yamlContent = YAML.dump(data, { indent: 2 });
        blob = new Blob([yamlContent], { type: 'text/yaml' });
        filename = `all_templates_${new Date().toISOString().split('T')[0]}.yaml`;
        mimeType = 'text/yaml';
      } else if (format === 'xlsx') {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Templates');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        filename = `all_templates_${new Date().toISOString().split('T')[0]}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename = `all_templates_${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.type = mimeType;
      a.click();
      URL.revokeObjectURL(url);
      toast(`✅ 导出成功：${format.toUpperCase()}`);
    } catch {
      toast('❌ 导出失败');
    }
  };

  const handleImport = async () => {
    try {
      let data: any[];
      
      if (importFormat === 'yaml') {
        data = YAML.load(importContent) as any[];
      } else {
        data = JSON.parse(importContent);
      }
      
      const templatesToImport = Array.isArray(data) ? data : [data];
      
      for (const tpl of templatesToImport) {
        const createData = {
          ...tpl,
          content: typeof tpl.content === 'string' ? JSON.parse(tpl.content) : tpl.content,
          variables: tpl.variables ? (typeof tpl.variables === 'string' ? JSON.parse(tpl.variables) : tpl.variables) : undefined,
          tags: Array.isArray(tpl.tags) ? tpl.tags : (tpl.tags ? tpl.tags.split(',') : []),
          is_active: tpl.is_active !== undefined ? tpl.is_active : true,
          is_default: tpl.is_default !== undefined ? tpl.is_default : false,
        };
        await templateService.createTemplate(createData);
      }
      
      toast(`✅ JSON导入成功：成功导入 ${templatesToImport.length} 个模板`);
      setIsImportDialogOpen(false);
      setImportContent('');
      loadTemplates();
    } catch {
      toast(`❌ JSON导入失败：请检查${importFormat.toUpperCase()}格式`);
    }
  };

  const handleImportExcel = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const templatesToImport = Array.isArray(data) ? data : [data];
      
      for (const tpl of templatesToImport) {
        const createData = {
          ...tpl,
          content: typeof tpl.content === 'string' ? JSON.parse(tpl.content) : tpl.content,
          variables: tpl.variables ? (typeof tpl.variables === 'string' ? JSON.parse(tpl.variables) : tpl.variables) : undefined,
          tags: Array.isArray(tpl.tags) ? tpl.tags : (tpl.tags ? tpl.tags.split(',') : []),
          is_active: tpl.is_active !== undefined ? tpl.is_active : true,
          is_default: tpl.is_default !== undefined ? tpl.is_default : false,
        };
        await templateService.createTemplate(createData);
      }
      
      toast(`✅ JSON导入成功：成功导入 ${templatesToImport.length} 个模板`);
      setIsImportDialogOpen(false);
      loadTemplates();
    } catch {
      toast(`❌ JSON导入失败：请检查${importFormat.toUpperCase()}格式`);
    }
  };

  const handleToggleFavorite = async (template: Template) => {
    if (!user?.id) return;
    try {
      const result = await templateService.toggleFavorite(template.id, user.id);
      toast(result.is_favorite ? '✅ 已添加收藏' : '✅ 已取消收藏');
      loadTemplates();
    } catch {
      console.error('切换收藏失败');
    }
  };

  const handleDuplicate = async (template: Template) => {
    try {
      const newCode = `${template.code}_copy_${Date.now()}`;
      const newTemplate = {
        ...template,
        code: newCode,
        name: `${template.name} (副本)`,
        is_active: true,
        is_system: false,
        is_default: false,
      };
      await templateService.createTemplate(newTemplate);
      toast('✅ 复制成功');
      loadTemplates();
    } catch {
      toast('❌ 复制失败');
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      searchTerm === '' ||
      t.template.name.toLowerCase().includes(searchLower) ||
      t.template.code.toLowerCase().includes(searchLower) ||
      (t.template.description?.toLowerCase().includes(searchLower)) ||
      t.template.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  const getAvailableTypes = () => {
    if (filterCategory === 'all') {
      return [];
    }
    return TEMPLATE_TYPES[filterCategory] || [];
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredTemplates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTemplates.map(t => t.template.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 个模板吗？`)) return;
    
    try {
      for (const id of selectedIds) {
        await templateService.deleteTemplate(id);
      }
      toast(`✅ 批量删除成功：成功删除 ${selectedIds.length} 个模板`);
      setSelectedIds([]);
      loadTemplates();
    } catch {
      toast('❌ 批量删除失败');
    }
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const newTemplates = [...filteredTemplates];
    const [removed] = newTemplates.splice(fromIndex, 1);
    newTemplates.splice(toIndex, 0, removed);
    
    newTemplates.forEach((item, index) => {
      templateService.updateTemplate(item.template.id, { sort_order: index });
    });
    
    setTemplates(newTemplates);
    toast(`✅ 排序已更新`);
  };

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.template.is_active).length,
    favorite: templates.filter(t => t.is_favorite).length,
    system: templates.filter(t => t.template.is_system).length,
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">模板管理</h1>
                <p className="text-muted-foreground">统一管理所有业务模块的模板资源</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleInitDefaults} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              初始化默认模板
            </Button>
            
            {selectedIds.length > 0 && (
              <Button variant="destructive" onClick={handleBatchDelete} className="gap-2">
                <Trash className="h-4 w-4" />
                批量删除 ({selectedIds.length})
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  导出模板
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportAll('json')}>
                  <Code className="h-4 w-4 mr-2" />
                  JSON 格式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('yaml')}>
                  <Code className="h-4 w-4 mr-2" />
                  YAML 格式
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportAll('xlsx')}>
                  <Database className="h-4 w-4 mr-2" />
                  Excel 格式
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  导入模板
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>导入模板</DialogTitle>
                  <DialogDescription>支持 JSON、YAML 格式或上传 Excel 文件</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Tabs defaultValue="text">
                    <TabsList>
                      <TabsTrigger value="text">文本导入</TabsTrigger>
                      <TabsTrigger value="file">文件上传</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text">
                      <div className="space-y-4">
                        <Select value={importFormat} onValueChange={(v) => setImportFormat(v as 'json' | 'yaml')}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择格式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="json">JSON 格式</SelectItem>
                            <SelectItem value="yaml">YAML 格式</SelectItem>
                          </SelectContent>
                        </Select>
                        <Textarea
                          value={importContent}
                          onChange={(e) => setImportContent(e.target.value)}
                          placeholder={importFormat === 'json' ? '粘贴模板JSON...' : '粘贴模板YAML...'}
                          className="min-h-[300px] font-mono text-sm"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="file">
                      <div className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImportExcel(file);
                            }
                          }}
                          className="hidden"
                          id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer">
                          <Database className="h-14 w-14 mx-auto mb-4 text-primary" />
                          <p className="font-medium text-lg">点击或拖拽上传 Excel 文件</p>
                          <p className="text-sm text-muted-foreground mt-2">支持 .xlsx, .xls 格式</p>
                        </label>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleImport} disabled={!importContent}>
                    导入
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新建模板
              </Button>
            </DialogTrigger>
            <TemplateForm
              mode="create"
              onClose={() => setIsCreateDialogOpen(false)}
              onSuccess={() => {
                loadTemplates();
                setIsCreateDialogOpen(false);
              }}
            />
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">总模板数</p>
                  <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-transparent border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">已启用</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-transparent border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">收藏</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.favorite}</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-transparent border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">系统模板</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">{stats.system}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索模板名称、编码、标签..."
                  className="pl-10 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[140px] h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="全部分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部分类</SelectItem>
                    {TEMPLATE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] h-11">
                    <Database className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="全部类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {getAvailableTypes().map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-[120px] h-11">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="true">启用</SelectItem>
                    <SelectItem value="false">禁用</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center border rounded-md overflow-hidden bg-white">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-none border-r px-3"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="rounded-none px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>正在加载模板...</span>
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-6 bg-muted/50 rounded-2xl mb-4">
                    <FolderOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">暂无模板</h3>
                  <p className="text-muted-foreground mb-6">点击「初始化默认模板」或「新建模板」开始</p>
                  <div className="flex gap-3">
                    <Button onClick={handleInitDefaults}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      初始化默认模板
                    </Button>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      新建模板
                    </Button>
                  </div>
                </div>
              ) : viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/30 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.length === filteredTemplates.length && filteredTemplates.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded border-primary"
                          />
                        </TableHead>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-8"></TableHead>
                        <TableHead className="font-semibold">模板名称</TableHead>
                        <TableHead>编码</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>版本</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>系统</TableHead>
                        <TableHead className="text-center">使用次数</TableHead>
                        <TableHead>更新时间</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates.map((item, index) => (
                        <DraggableTableRow
                          key={item.template.id}
                          item={item}
                          index={index}
                          onReorder={handleReorder}
                          isSelected={selectedIds.includes(item.template.id)}
                          onSelect={() => toggleSelect(item.template.id)}
                          onView={(t) => { setSelectedTemplate(t); setIsViewDialogOpen(true); }}
                          onEdit={(t) => { setSelectedTemplate(t); setIsEditDialogOpen(true); }}
                          onDelete={handleDelete}
                          onExport={handleExport}
                          onToggleFavorite={handleToggleFavorite}
                          onDuplicate={handleDuplicate}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTemplates.map((item) => (
                    <TemplateCard
                      key={item.template.id}
                      item={item}
                      isSelected={selectedIds.includes(item.template.id)}
                      onSelect={() => toggleSelect(item.template.id)}
                      onView={(t) => { setSelectedTemplate(t); setIsViewDialogOpen(true); }}
                      onEdit={(t) => { setSelectedTemplate(t); setIsEditDialogOpen(true); }}
                      onDelete={handleDelete}
                      onExport={handleExport}
                      onToggleFavorite={handleToggleFavorite}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <>
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <ViewTemplateDialog template={selectedTemplate} onClose={() => setIsViewDialogOpen(false)} />
            </Dialog>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <TemplateForm
                mode="edit"
                template={selectedTemplate}
                onClose={() => setIsEditDialogOpen(false)}
                onSuccess={() => {
                  loadTemplates();
                  setIsEditDialogOpen(false);
                  setSelectedTemplate(null);
                }}
              />
            </Dialog>
          </>
        )}
      </div>
    </DndProvider>
  );
}

function TemplateTableRow({
  item,
  onView,
  onEdit,
  onDelete,
  onExport,
  onToggleFavorite,
  onDuplicate,
}: {
  item: TemplateWithStats;
  onView: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onExport: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}) {
  const { template, usage_count, is_favorite } = item;

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span className="font-medium">{template.name}</span>
          {template.is_default && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">默认</Badge>
          )}
          {is_favorite && (
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{template.code}</code>
      </TableCell>
      <TableCell className="text-muted-foreground">{getCategoryLabel(template.category)}</TableCell>
      <TableCell>{getTypeLabel(template.category, template.template_type)}</TableCell>
      <TableCell className="font-mono text-sm">v{template.version}</TableCell>
      <TableCell>
        {template.is_active ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-sm">
            <CheckCircle2 className="h-3 w-3 mr-1" /> 启用
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-sm">
            <XCircle className="h-3 w-3 mr-1" /> 禁用
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {template.is_system ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" /> 系统
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          {usage_count}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(template.updated_at).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView(template)} className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(template)} className="h-8 w-8">
            <Star className={`h-4 w-4 ${is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(template)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!template.is_system && (
                <DropdownMenuItem onClick={() => onDelete(template.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

function TemplateForm({
  mode,
  template,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  template?: Template;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: template?.code || '',
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || '组织架构',
    template_type: template?.template_type || 'department',
    content: template ? JSON.stringify(template.content, null, 2) : '{\n  \n}',
    variables: template?.variables ? JSON.stringify(template.variables, null, 2) : '[]',
    version: template?.version || '1.0',
    is_active: template?.is_active ?? true,
    is_default: template?.is_default ?? false,
    sort_order: template?.sort_order || 0,
    tags: template?.tags?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      let content: Record<string, unknown>, variables: Record<string, unknown>;
      try {
        content = JSON.parse(formData.content);
      } catch {
        toast('❌ 内容格式错误：content 必须是有效的 JSON');
        return;
      }
      try {
        variables = formData.variables.trim() ? JSON.parse(formData.variables) : undefined;
      } catch {
        toast('❌ 变量格式错误：variables 必须是有效的 JSON 数组');
        return;
      }

      const data = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category,
        template_type: formData.template_type,
        content,
        variables,
        version: formData.version,
        is_active: formData.is_active,
        is_default: formData.is_default,
        sort_order: formData.sort_order,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };

      if (mode === 'create') {
        await templateService.createTemplate(data);
      } else {
        await templateService.updateTemplate(template!.id, data);
      }

      toast(mode === 'create' ? '✅ 创建成功' : '✅ 更新成功');
      onSuccess();
    } catch {
      toast(mode === 'create' ? '❌ 创建失败' : '❌ 更新失败');
    } finally {
      setLoading(false);
    }
  };

  const availableTypes = TEMPLATE_TYPES[formData.category] || [];

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {mode === 'create' ? (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Plus className="h-5 w-5 text-primary" />
            </div>
          ) : (
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
          )}
          {mode === 'create' ? '新建模板' : '编辑模板'}
        </DialogTitle>
        <DialogDescription>
          {mode === 'create' ? '创建一个新的模板' : '修改现有模板信息'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">模板编码 *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="例如: dept_general"
              disabled={mode === 'edit' && template?.is_system}
              className={mode === 'edit' && template?.is_system ? 'bg-muted cursor-not-allowed' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">模板名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如: 通用部门"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">描述</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="模板的简要说明"
            className="min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">分类 *</Label>
            <Select
              value={formData.category}
              onValueChange={(v) => {
                setFormData({
                  ...formData,
                  category: v,
                  template_type: availableTypes[0]?.value || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="template_type" className="text-sm font-medium">类型 *</Label>
            <Select
              value={formData.template_type}
              onValueChange={(v) => setFormData({ ...formData, template_type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="version" className="text-sm font-medium">版本</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order" className="text-sm font-medium">排序</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-end space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <Label htmlFor="is_active" className="text-sm">启用</Label>
            </div>
          </div>
          <div className="flex items-end">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
              />
              <Label htmlFor="is_default" className="text-sm">默认</Label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags" className="text-sm font-medium">标签 (逗号分隔)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="例如: 组织, 通用"
          />
        </div>

        <Separator className="my-4" />

        <Tabs defaultValue="content">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="content" className="gap-2">
              <Code className="h-4 w-4" />
              内容 (JSON)
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-2">
              <Settings className="h-4 w-4" />
              变量 (JSON)
            </TabsTrigger>
          </TabsList>
          <TabsContent value="content" className="space-y-2 mt-4">
            <Label className="text-sm font-medium">模板内容</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="font-mono text-sm h-64 bg-muted/50"
              placeholder='{\n  "key": "value"\n}'
            />
          </TabsContent>
          <TabsContent value="variables" className="space-y-2 mt-4">
            <Label className="text-sm font-medium">变量定义</Label>
            <Textarea
              value={formData.variables}
              onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
              className="font-mono text-sm h-64 bg-muted/50"
              placeholder='[{"name": "变量名", "type": "string"}]'
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              mode === 'create' ? '创建' : '保存'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ViewTemplateDialog({ template, onClose, onRefresh }: { template: Template; onClose: () => void; onRefresh?: () => void }) {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [comparingVersion, setComparingVersion] = useState<TemplateVersion | null>(null);

  const loadVersions = async () => {
    try {
      setVersionLoading(true);
      const data = await templateService.getVersions(template.id);
      setVersions(data);
    } catch {
      console.error('加载版本历史失败');
    } finally {
      setVersionLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      const versionName = prompt('请输入版本名称:');
      if (!versionName) return;
      const description = prompt('请输入版本描述:');
      await templateService.createVersion(template.id, { version_name: versionName, description });
      toast('✅ 版本创建成功');
      loadVersions();
    } catch {
      toast('❌ 版本创建失败');
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!window.confirm(`确定要回滚到版本 ${versionNumber} 吗？此操作会创建一个新版本。`)) return;
    try {
      await templateService.rollbackVersion(template.id, versionNumber);
      toast('✅ 回滚成功');
      loadVersions();
      onRefresh?.();
    } catch {
      toast('❌ 回滚失败');
    }
  };

  const handleCompare = (version: TemplateVersion) => {
    if (comparingVersion) {
      setComparingVersion(null);
    } else {
      setComparingVersion(version);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader className="border-b">
        <DialogTitle className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          查看模板: {template.name}
        </DialogTitle>
        <DialogDescription className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-0.5 rounded">{template.code}</code>
          <span className="text-muted-foreground">|</span>
          <span>分类: {getCategoryLabel(template.category)}</span>
        </DialogDescription>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">类型</Label>
            <p className="font-medium mt-1">{getTypeLabel(template.category, template.template_type)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">版本</Label>
            <p className="font-medium mt-1 font-mono">v{template.version}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <Label className="text-xs text-muted-foreground">状态</Label>
            <p className={`font-medium mt-1 ${template.is_active ? 'text-green-600' : 'text-red-600'}`}>
              {template.is_active ? '启用' : '禁用'}
            </p>
          </div>
        </div>

        {template.description && (
          <div className="bg-muted/30 rounded-lg p-4">
            <Label className="text-sm font-medium text-muted-foreground">描述</Label>
            <p className="mt-2">{template.description}</p>
          </div>
        )}

        {template.tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">标签</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {template.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="content">内容</TabsTrigger>
            {template.variables && <TabsTrigger value="variables">变量</TabsTrigger>}
            <TabsTrigger value="history">版本历史</TabsTrigger>
          </TabsList>
          <TabsContent value="content">
            <Card className="border">
              <CardContent className="p-4">
                <pre className="font-mono text-sm overflow-auto max-h-[400px] bg-muted/50 p-4 rounded">
                  {JSON.stringify(template.content, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          {template.variables && (
            <TabsContent value="variables">
              <Card className="border">
                <CardContent className="p-4">
                  <pre className="font-mono text-sm overflow-auto max-h-[400px] bg-muted/50 p-4 rounded">
                    {JSON.stringify(template.variables, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          )}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">版本记录 ({versions.length})</span>
              <Button variant="outline" size="sm" onClick={handleCreateVersion} className="gap-2">
                <Plus className="h-4 w-4" />
                创建版本
              </Button>
            </div>
            {versionLoading ? (
              <div className="text-center py-10">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                <span className="text-muted-foreground">加载中...</span>
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无版本记录</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-auto">
                {versions.map((version, index) => (
                  <Card
                    key={version.id}
                    className={`transition-all ${comparingVersion?.id === version.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                    onClick={() => {
                      setSelectedVersion(version);
                      handleCompare(version);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono">v{version.version_number}</Badge>
                            {version.version_name && (
                              <span className="font-medium">{version.version_name}</span>
                            )}
                            {index === 0 && (
                              <Badge className="bg-green-100 text-green-700 text-xs">当前版本</Badge>
                            )}
                          </div>
                          {version.description && (
                            <p className="text-sm text-muted-foreground mt-2">{version.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            创建于 {new Date(version.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRollback(version.version_number);
                            }}
                            className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {selectedVersion && comparingVersion && selectedVersion.id !== comparingVersion.id && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium">版本对比</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Card className="border border-red-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>v{selectedVersion.version_number}</Badge>
                        <span className="text-sm">{selectedVersion.version_name || '版本'}</span>
                      </div>
                      <pre className="font-mono text-xs overflow-auto max-h-[200px] bg-red-50/50 p-2 rounded">
                        {JSON.stringify(selectedVersion.content, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                  <Card className="border border-green-200">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>v{comparingVersion.version_number}</Badge>
                        <span className="text-sm">{comparingVersion.version_name || '版本'}</span>
                      </div>
                      <pre className="font-mono text-xs overflow-auto max-h-[200px] bg-green-50/50 p-2 rounded">
                        {JSON.stringify(comparingVersion.content, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
                <Button variant="outline" size="sm" onClick={() => setComparingVersion(null)} className="mt-3">
                  关闭对比
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <DialogFooter className="border-t">
        <Button onClick={onClose}>关闭</Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface DraggableTableRowProps {
  item: TemplateWithStats;
  index: number;
  onReorder: (from: number, to: number) => void;
  isSelected: boolean;
  onSelect: () => void;
  onView: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onExport: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}

function DraggableTableRow({ item, index, onReorder, isSelected, onSelect, onView, onEdit, onDelete, onExport, onToggleFavorite, onDuplicate }: DraggableTableRowProps) {
  const { template, usage_count, is_favorite } = item;

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'TEMPLATE_ROW',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'TEMPLATE_ROW',
    hover(item: { index: number }) {
      if (item.index !== index) {
        onReorder(item.index, index);
        item.index = index;
      }
    },
  }), [index, onReorder]);

  return (
    <TableRow
      ref={(node) => drag(drop(node))}
      className={`cursor-move transition-all ${isDragging ? 'opacity-50 bg-primary/10' : 'hover:bg-muted/50'}`}
    >
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-primary"
        />
      </TableCell>
      <TableCell ref={preview} className="text-muted-foreground">
        <GripVertical className="h-5 w-5 cursor-grab hover:text-primary" />
      </TableCell>
      <TableCell>
        {getCategoryIcon(template.category)}
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <span>{template.name}</span>
          {template.is_default && (
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">默认</Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{template.code}</code>
      </TableCell>
      <TableCell className="text-muted-foreground">{getCategoryLabel(template.category)}</TableCell>
      <TableCell>{getTypeLabel(template.category, template.template_type)}</TableCell>
      <TableCell className="font-mono text-sm">v{template.version}</TableCell>
      <TableCell>
        {template.is_active ? (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-sm">
            <CheckCircle2 className="h-3 w-3 mr-1" /> 启用
          </Badge>
        ) : (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-sm">
            <XCircle className="h-3 w-3 mr-1" /> 禁用
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {template.is_system ? (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" /> 系统
          </Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          {usage_count}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(template.updated_at).toLocaleDateString()}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onView(template)} className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(template)} className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(template)} className="h-8 w-8">
            <Star className={`h-4 w-4 ${is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(template)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!template.is_system && (
                <DropdownMenuItem onClick={() => onDelete(template.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface TemplateCardProps {
  item: TemplateWithStats;
  isSelected: boolean;
  onSelect: () => void;
  onView: (template: Template) => void;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => void;
  onExport: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
  onDuplicate: (template: Template) => void;
}

function TemplateCard({ item, isSelected, onSelect, onView, onEdit, onDelete, onExport, onToggleFavorite, onDuplicate }: TemplateCardProps) {
  const { template, usage_count, is_favorite } = item;

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}`}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50" />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getCategoryIcon(template.category)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                {template.is_default && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">默认</Badge>
                )}
                {is_favorite && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
              </div>
              <code className="text-xs text-muted-foreground font-mono">{template.code}</code>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-primary"
          />
        </div>

        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {template.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            {getCategoryLabel(template.category)}
          </Badge>
          <Badge variant="outline">{getTypeLabel(template.category, template.template_type)}</Badge>
          <Badge variant="outline" className="font-mono">v{template.version}</Badge>
          {template.is_active ? (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" /> 启用
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700">
              <XCircle className="h-3 w-3 mr-1" /> 禁用
            </Badge>
          )}
          {template.is_system && (
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1" /> 系统
            </Badge>
          )}
        </div>

        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.map((tag) => (
              <span key={tag} className="text-xs bg-muted/70 px-2 py-0.5 rounded-full text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            使用 {usage_count} 次
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(template.updated_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => onView(template)}>
            <Eye className="h-4 w-4" />
            查看详情
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(template)} className="text-blue-600 hover:text-blue-600 hover:bg-blue-50">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onToggleFavorite(template)}>
            <Star className={`h-4 w-4 ${is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="h-4 w-4 mr-2" />
                复制
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport(template)}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!template.is_system && (
                <DropdownMenuItem onClick={() => onDelete(template.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
