import React, { useState, useEffect } from 'react';
import { Search, Book, FileText, Eye, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import ReactMarkdown from 'react-markdown';

interface HelpCategory {
  id: string;
  code: string;
  name: string;
  icon?: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface HelpArticle {
  id: string;
  category_id: string;
  slug: string;
  title: string;
  content: string;
  author?: string;
  tags?: string;
  view_count: number;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}



const iconMap: Record<string, React.ReactNode> = {
  Rocket: <span className="text-2xl">🚀</span>,
  Building: <span className="text-2xl">🏢</span>,
  Users: <span className="text-2xl">👥</span>,
  Factory: <span className="text-2xl">🏭</span>,
  HardHat: <span className="text-2xl">⛑️</span>,
  Map: <span className="text-2xl">🗺️</span>,
};

const HelpCenter: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<HelpArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchArticlesByCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/help/categories');
      const result = await response.json();
      if (result.success && result.data) {
        setCategories(result.data);
        if (result.data.length > 0 && !selectedCategory) {
          setSelectedCategory(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('获取帮助分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticlesByCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/v1/help/articles?category_id=${categoryId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setArticles(result.data);
      }
    } catch (error) {
      console.error('获取帮助文章失败:', error);
    }
  };

  const fetchArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/v1/help/articles/${articleId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setSelectedArticle(result.data);
      }
    } catch (error) {
      console.error('获取文章详情失败:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/v1/help/search?keyword=${encodeURIComponent(searchTerm)}`);
      const result = await response.json();
      if (result.success && result.data) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitDefaults = async () => {
    try {
      const response = await fetch('/api/v1/help/init-defaults', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        fetchCategories();
        alert('初始化成功！');
      }
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const getCategoryIcon = (icon?: string) => {
    return iconMap[icon || ''] || <Book className="h-6 w-6" />;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 左侧分类导航 */}
      <div className="w-80 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <h2 className="text-lg font-semibold mb-4">帮助中心</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索帮助文档..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={handleInitDefaults}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            初始化帮助内容
          </Button>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无帮助分类
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className={`p-3 rounded-lg cursor-pointer mb-1 transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSelectedArticle(null);
                }}
              >
                <div className="flex items-center gap-3">
                  {getCategoryIcon(category.icon)}
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {category.description}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 中间文章列表 */}
      <div className="w-80 border-r bg-white overflow-y-auto">
        {searchTerm ? (
          <div className="p-4">
            <h3 className="font-semibold mb-4">搜索结果</h3>
            {isSearching ? (
              <div className="text-center py-8 text-muted-foreground">搜索中...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                未找到相关文章
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((article) => (
                  <div
                    key={article.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedArticle?.id === article.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedArticle(article);
                      fetchArticle(article.id);
                    }}
                  >
                    <div className="font-medium">{article.title}</div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{article.view_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <h3 className="font-semibold mb-4">
              {categories.find((c) => c.id === selectedCategory)?.name || '文章列表'}
            </h3>
            {articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                该分类下暂无文章
              </div>
            ) : (
              <div className="space-y-2">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedArticle?.id === article.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedArticle(article);
                      fetchArticle(article.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{article.title}</div>
                      {article.is_featured && (
                        <Badge variant="default" className="text-xs">
                          精选
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{article.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 右侧文章内容 */}
      <div className="flex-1 bg-white overflow-y-auto">
        {selectedArticle ? (
          <div className="max-w-4xl mx-auto p-8">
            <div className="mb-6 pb-6 border-b">
              <h1 className="text-3xl font-bold mb-4">{selectedArticle.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {selectedArticle.author && (
                  <span>作者: {selectedArticle.author}</span>
                )}
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{selectedArticle.view_count} 次阅读</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedArticle.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {selectedArticle.tags && (
                <div className="flex gap-2 mt-4">
                  {selectedArticle.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="prose prose-blue max-w-none">
              <ReactMarkdown>{selectedArticle.content}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>选择一篇文章查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpCenter;