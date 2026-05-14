import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Search, 
  Star, 
  Clock, 
  TrendingUp, 
  Eye, 
  Check,
  Filter
} from 'lucide-react';
import { 
  templateService, 
  Template, 
  TemplateWithStats,
  getCategoryLabel, 
  getTypeLabel,
  applyTemplate 
} from '@/services/templates';
import useAuthStore from '@/store/useAuthStore';

interface FormTemplateSelectorProps {
  category?: string;
  templateType?: string;
  onSelect?: (template: Template, content: Record<string, unknown>) => void;
  buttonLabel?: string;
  className?: string;
}

type SortMode = 'default' | 'recent' | 'popular' | 'favorites';

export default function FormTemplateSelector({
  category,
  templateType,
  onSelect,
  buttonLabel = "使用模板",
  className = "",
}: FormTemplateSelectorProps) {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<TemplateWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('default');

  // 加载模板
  const loadTemplates = async () => {
    if (!open) return;
    try {
      setLoading(true);
      const data = await templateService.getTemplates({
        category,
        template_type: templateType,
        is_active: true,
        user_id: user?.id,
      });
      setTemplates(data);
      
      if (user?.id) {
        const favs = await templateService.getFavorites(user.id, category);
        setFavorites(favs);
      }
    } catch (error) {
      console.error("加载模板失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, category, templateType, user?.id]);

  // 筛选和排序模板
  const filteredTemplates = () => {
    let filtered = templates.filter(t => 
      (search === '' || 
        t.template.name.toLowerCase().includes(search.toLowerCase()) ||
        t.template.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.template.code.toLowerCase().includes(search.toLowerCase()) ||
        t.template.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
    );

    switch (sortMode) {
      case 'favorites':
        filtered = filtered.filter(t => t.is_favorite);
        break;
      case 'popular':
        filtered = [...filtered].sort((a, b) => b.usage_count - a.usage_count);
        break;
      case 'recent':
        filtered = [...filtered].sort((a, b) => 
          new Date(b.template.updated_at).getTime() - new Date(a.template.updated_at).getTime()
        );
        break;
      default:
        filtered = [...filtered].sort((a, b) => {
          if (a.template.is_default && !b.template.is_default) return -1;
          if (!a.template.is_default && b.template.is_default) return 1;
          return a.template.sort_order - b.template.sort_order;
        });
    }

    return filtered;
  };

  // 切换收藏
  const toggleFavorite = async (template: Template) => {
    if (!user?.id) return;
    try {
      const result = await templateService.toggleFavorite(template.id, user.id);
      // 更新本地状态
      setTemplates(templates.map(t => 
        t.template.id === template.id 
          ? { ...t, is_favorite: result.is_favorite }
          : t
      ));
    } catch (error) {
      console.error("切换收藏失败:", error);
    }
  };

  // 使用模板
  const handleSelectTemplate = (template: Template) => {
    try {
      // 记录使用
      templateService.recordUsage({
        template_id: template.id,
        used_by: user?.id,
      });

      // 应用模板并返回
      const content = applyTemplate(template, {});
      
      if (onSelect) {
        onSelect(template, content);
      }
      
      setOpen(false);
    } catch (error) {
      console.error("应用模板失败:", error);
    }
  };

  // 保存当前表单为模板
  const handleSaveAsTemplate = () => {
    // 这个功能需要结合具体表单实现
    console.log("保存为模板功能待实现");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className={className}>
          <BookOpen className="h-4 w-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>选择模板</DialogTitle>
          <DialogDescription>
            选择一个模板快速开始，或保存当前表单为模板以便下次使用
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 搜索和筛选 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索模板名称、描述、标签..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 筛选标签 */}
          <Tabs value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="default" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                默认
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                收藏
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                热门
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                最近
              </TabsTrigger>
            </TabsList>

            <TabsContent value={sortMode} className="flex-1 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    加载中...
                  </div>
                ) : filteredTemplates().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <BookOpen className="h-10 w-10 mb-3 opacity-50" />
                    <p>没有找到匹配的模板</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredTemplates().map((item) => (
                      <TemplateCard
                        key={item.template.id}
                        item={item}
                        onSelect={handleSelectTemplate}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleSaveAsTemplate}>
            <BookOpen className="h-4 w-4 mr-2" />
            保存当前为模板
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            取消
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 模板卡片组件
function TemplateCard({
  item,
  onSelect,
  onToggleFavorite,
}: {
  item: TemplateWithStats;
  onSelect: (template: Template) => void;
  onToggleFavorite: (template: Template) => void;
}) {
  const { template, usage_count, is_favorite } = item;
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.is_default && (
                <Badge variant="secondary" className="text-xs">默认</Badge>
              )}
              {template.is_system && (
                <Badge variant="outline" className="text-xs">系统</Badge>
              )}
            </div>
            <CardDescription>
              {template.description || `${getCategoryLabel(template.category)} · ${getTypeLabel(template.category, template.template_type)}`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(template);
            }}
          >
            <Star 
              className={`h-4 w-4 ${is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
            />
          </Button>
        </div>
      </CardHeader>
      
      {template.tags.length > 0 && (
        <CardContent className="pb-3">
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {usage_count} 次使用
          </span>
          <span className="text-xs">v{template.version}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
          <Button size="sm" onClick={() => onSelect(template)}>
            <Check className="h-4 w-4 mr-1" />
            使用
          </Button>
        </div>
      </CardFooter>

      {/* 预览对话框 */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{template.name}</DialogTitle>
            <DialogDescription>
              {template.description || `版本: ${template.version}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{getCategoryLabel(template.category)}</Badge>
              <Badge variant="outline">{getTypeLabel(template.category, template.template_type)}</Badge>
              {template.tags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">模板内容</h4>
              <div className="bg-muted p-4 rounded-md">
                <pre className="text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(template.content, null, 2)}
                </pre>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => setShowPreview(false)}>
              关闭
            </Button>
            <Button onClick={() => {
              setShowPreview(false);
              onSelect(template);
            }}>
              使用此模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
