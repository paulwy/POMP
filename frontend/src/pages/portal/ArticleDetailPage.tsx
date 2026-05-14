import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SafeImage from '@/components/ui/SafeImage';
import { ArrowLeft, Calendar, Eye } from 'lucide-react';
import { cmsApi, Article } from '@/services/cms';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const data = await cmsApi.getPublicArticle(articleId!);
      setArticle(data);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </main>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto text-center py-12">
              <h2 className="text-xl font-semibold mb-4">文章不存在</h2>
              <Button asChild>
                <Link to="/">返回门户</Link>
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回门户
                </Link>
              </Button>
            </div>

            <Card>
              {article.coverImage && (
                <SafeImage
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {article.isTop && (
                    <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded">
                      置顶
                    </span>
                  )}
                </div>
                <CardTitle className="text-2xl">{article.title}</CardTitle>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.viewCount} 次浏览
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {article.summary && (
                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <p className="text-muted-foreground">{article.summary}</p>
                  </div>
                )}
                {article.content && (
                  <div 
                    className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ArticleDetailPage;
