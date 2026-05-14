import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Building2,
  Briefcase,
  Factory,
  TrendingUp,
  Users,
  Award,
  FileText,
  Calendar,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { cmsApi, Article } from '@/services/cms';

const quickEntries = [
  { title: '产品展示', icon: Factory, path: '/portal/category/products', desc: '了解我们的产品', color: 'text-primary' },
  { title: '工程项目', icon: Briefcase, path: '/portal/category/projects', desc: '查看项目案例', color: 'text-success' },
  { title: '科研活动', icon: TrendingUp, path: '/portal/category/research', desc: '技术研发动态', color: 'text-info' },
  { title: '营销活动', icon: TrendingUp, path: '/portal/category/marketing', desc: '市场活动', color: 'text-warning' },
  { title: '商务会谈', icon: Users, path: '/portal/category/business', desc: '商务合作', color: 'text-destructive' },
  { title: '公司概况', icon: Building2, path: '/portal/category/about', desc: '了解我们', color: 'text-muted-foreground' },
  { title: '资质荣誉', icon: Award, path: '/portal/category/honors', desc: '企业资质', color: 'text-warning' }
];

const Portal = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newsArticles, setNewsArticles] = useState<Article[]>([]);
  const [aboutArticles, setAboutArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [news, about] = await Promise.all([
        cmsApi.getPublicArticles('news'),
        cmsApi.getPublicArticles('about')
      ]);
      setNewsArticles(news);
      setAboutArticles(about);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const companyIntro = aboutArticles.length > 0 
    ? aboutArticles[0].summary || '了解更多公司信息，请查看公司概况栏目。'
    : '欢迎访问企业门户，了解公司动态，获取最新资讯。';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="relative bg-muted">
            <div className="relative h-80 bg-gradient-to-r from-blue-900 to-blue-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-4xl font-bold mb-4">欢迎访问企业门户</h1>
                  <p className="text-lg opacity-90">了解公司动态，获取最新资讯</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {[0, 1, 2].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlide === index ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4">快速入口</h3>
              <div className="grid grid-cols-7 gap-4">
                {quickEntries.map((entry, index) => {
                  const Icon = entry.icon;
                  return (
                    <Link key={index} to={entry.path}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer hover:-translate-y-1 transition-transform">
                        <CardContent className="p-6 text-center">
                          <div className="p-3 rounded-full mx-auto w-fit mb-3 bg-gray-100">
                            <Icon className={`h-8 w-8 ${entry.color}`} />
                          </div>
                          <h4 className="font-medium">{entry.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{entry.desc}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <Card className="col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    新闻公告
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/portal/category/news">
                      更多 <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : newsArticles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">暂无新闻公告</p>
                  ) : (
                    <div className="space-y-3">
                      {newsArticles.slice(0, 5).map((article) => (
                        <Link key={article.id} to={`/portal/articles/${article.id}`} className="block">
                          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-3">
                              {article.isTop && (
                                <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded">置顶</span>
                              )}
                              <span className="font-medium">{article.title}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '-'}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    公司简介
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{companyIntro}</p>
                  <Button variant="ghost" className="w-full mt-4" asChild>
                    <Link to="/portal/category/about">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      了解更多
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-info" />
                  近期活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { title: '技术交流研讨会', date: '2024-01-20', status: '即将开始' },
                    { title: '年度总结大会', date: '2024-01-25', status: '报名中' },
                    { title: '客户答谢会', date: '2024-02-01', status: '筹备中' },
                    { title: '新春年会', date: '2024-02-10', status: '计划中' }
                  ].map((event, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border">
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.date}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-success/10 text-success text-xs rounded">
                        {event.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Portal;