import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Building2, Award, Users, Target, History, TrendingUp, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

const milestones = [
  { year: '1998', title: '公司成立', description: '河北三楷深发科技股份有限公司正式成立' },
  { year: '2005', title: '技术突破', description: '获得多项国家专利，产品技术达到国际先进水平' },
  { year: '2010', title: '市场拓展', description: '产品销售覆盖全国30个省市自治区' },
  { year: '2016', title: '上市挂牌', description: '公司在新三板成功挂牌上市' },
  { year: '2020', title: '智能转型', description: '推出智能建筑监测系统，进军物联网领域' },
  { year: '2024', title: '创新发展', description: '持续技术创新，引领行业发展新方向' },
];

const values = [
  { icon: Target, title: '企业使命', description: '以科技创新推动绿色建筑发展，为客户创造价值' },
  { icon: TrendingUp, title: '核心价值观', description: '诚信、创新、品质、服务、共赢' },
  { icon: Globe, title: '企业愿景', description: '成为国内领先的建筑材料与智能解决方案供应商' },
];

const AboutPage = () => {
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
              <h1 className="text-2xl font-bold">公司概况</h1>
              <p className="text-muted-foreground mt-1">
                了解河北三楷深发科技股份有限公司
              </p>
            </div>

            {/* Hero */}
            <Card className="mb-8 bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-10 w-10" />
                      <h2 className="text-3xl font-bold">河北三楷深发科技股份有限公司</h2>
                    </div>
                    <p className="text-blue-100 text-lg mb-6">
                      成立于1998年，是一家专注于建筑材料研发、生产、销售及智能建筑解决方案的高新技术企业。
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                        <span className="font-semibold">26+</span>
                        <span className="ml-1 text-blue-100 text-sm">年行业经验</span>
                      </div>
                      <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                        <span className="font-semibold">50+</span>
                        <span className="ml-1 text-blue-100 text-sm">项专利技术</span>
                      </div>
                      <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                        <span className="font-semibold">30+</span>
                        <span className="ml-1 text-blue-100 text-sm">省市覆盖</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <Award className="h-32 w-32 text-blue-300 opacity-50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 企业核心 */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <Card key={idx}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">{value.title}</CardTitle>
                      </div>
                      <CardDescription>{value.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 发展历程 */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <CardTitle>发展历程</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                  <div className="space-y-8">
                    {milestones.map((milestone, idx) => (
                      <div key={idx} className="relative pl-12">
                        <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-sm font-semibold rounded mb-2">
                            {milestone.year}
                          </span>
                          <h4 className="font-semibold mb-1">{milestone.title}</h4>
                          <p className="text-muted-foreground text-sm">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 团队介绍 */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle>团队力量</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">研发团队</h4>
                    <p className="text-muted-foreground">
                      公司拥有一支专业的研发团队，其中博士2人，硕士8人，本科及以上学历占比80%。
                      我们与多所高校建立长期合作关系，持续开展产学研合作。
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">服务团队</h4>
                    <p className="text-muted-foreground">
                      专业的技术支持和售后服务团队，为客户提供从产品咨询、技术指导到
                      售后维护的全方位服务，确保客户满意。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">期待与您合作</h3>
                <p className="text-gray-300 mb-6">
                  了解更多关于我们的产品和服务
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button variant="secondary" asChild>
                    <Link to="/portal/category/products">查看产品</Link>
                  </Button>
                  <Button variant="ghost" className="border-gray-600" asChild>
                    <Link to="/portal/contact">联系我们</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AboutPage;
