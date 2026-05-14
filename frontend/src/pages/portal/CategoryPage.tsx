import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SafeImage from '@/components/ui/SafeImage';
import { ArrowLeft, Calendar, Eye } from 'lucide-react';
import { cmsApi, Article } from '@/services/cms';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const CategoryPage: React.FC = () => {
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  const categoryNames: Record<string, string> = {
    'products': '产品展示',
    'projects': '工程项目',
    'research': '科研活动',
    'marketing': '营销活动',
    'business': '商务会谈',
    'news': '新闻公告',
    'about': '公司概况',
    'honors': '资质荣誉'
  };

  useEffect(() => {
    if (categoryCode) {
      setCategoryName(categoryNames[categoryCode] || categoryCode);
      loadArticles();
    }
  }, [categoryCode]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await cmsApi.getPublicArticles(categoryCode);
      setArticles(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回门户
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{categoryName}</h1>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : articles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无内容
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {articles.map((article) => (
                  <Link key={article.id} to={`/portal/articles/${article.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {article.isTop && (
                                <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded">
                                  置顶
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                            {article.summary && (
                              <p className="text-muted-foreground text-sm mb-3">
                                {article.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '-'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {article.viewCount} 次浏览
                              </span>
                            </div>
                          </div>
                          {article.coverImage && (
                            <SafeImage
                              src={article.coverImage}
                              alt={article.title}
                              className="ml-4 w-32 h-24 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CategoryPage;
