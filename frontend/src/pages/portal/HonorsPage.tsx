import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Award, Shield, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const honors = [
  {
    id: 1,
    title: '国家高新技术企业',
    issuer: '科技部',
    year: '2023',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 2,
    title: 'ISO9001质量体系认证',
    issuer: '国际标准化组织',
    year: '2022',
    icon: CheckCircle2,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 3,
    title: 'ISO14001环境体系认证',
    issuer: '国际标准化组织',
    year: '2022',
    icon: Shield,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 4,
    title: 'AAA级信用企业',
    issuer: '中国企业联合会',
    year: '2023',
    icon: TrendingUp,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    id: 5,
    title: '绿色建材产品认证',
    issuer: '住建部',
    year: '2023',
    icon: Shield,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 6,
    title: '专精特新中小企业',
    issuer: '河北省工信厅',
    year: '2022',
    icon: Award,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
];

const patents = [
  '一种新型保温材料及其制备方法',
  '一种防火涂料及其制备工艺',
  '智能建筑监测系统V1.0',
  '一种环保型内墙乳胶漆',
  '一种轻质隔墙板及其安装方法',
  '一种屋面防水系统',
  '一种建筑节能监测装置',
  '一种保温材料生产设备',
];

const HonorsPage = () => {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
                <ChevronLeft className="h-4 w-4" />
                返回门户首页
              </Link>
              <h1 className="text-2xl font-bold">资质荣誉</h1>
              <p className="text-muted-foreground mt-1">
                我们的资质证书与荣誉成就
              </p>
            </div>

            {/* 资质证书 */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                企业资质
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {honors.map((honor) => {
                  const Icon = honor.icon;
                  return (
                    <Card key={honor.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${honor.bgColor} shrink-0`}>
                            <Icon className={`h-8 w-8 ${honor.color}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {honor.year}
                              </span>
                            </div>
                            <h3 className="font-semibold mb-1">{honor.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              颁发机构：{honor.issuer}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 专利技术 */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-info" />
                    <CardTitle>专利技术</CardTitle>
                  </div>
                  <CardDescription>
                    我们拥有的自主知识产权与专利技术
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {patents.map((patent, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="p-1 bg-purple-100 rounded">
                          <CheckCircle2 className="h-4 w-4 text-info" />
                        </div>
                        <span className="text-sm">{patent}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 品牌实力 */}
            <Card className="mb-8 bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">26+</div>
                    <div className="text-muted-foreground mt-1">年行业经验</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-success">50+</div>
                    <div className="text-muted-foreground mt-1">项专利技术</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-info">30+</div>
                    <div className="text-muted-foreground mt-1">省市覆盖</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-warning">1000+</div>
                    <div className="text-muted-foreground mt-1">合作伙伴</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 联系咨询 */}
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-semibold mb-2">了解更多信息</h3>
                <p className="text-muted-foreground mb-4">
                  如果您想了解更多关于我们的资质和技术，欢迎随时联系我们
                </p>
                <Button asChild>
                  <Link to="/portal/contact">联系我们</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HonorsPage;
