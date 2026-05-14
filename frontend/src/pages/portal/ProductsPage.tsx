import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import SafeImage from '@/components/ui/SafeImage';
import { ChevronLeft, Factory, Search, ChevronDown, ChevronUp, Info, ArrowRight, Award, Shield, Zap, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/ui/Badge';

// 产品分类
const categories = [
  { id: 'all', name: '全部产品', icon: Factory },
  { id: 'coating', name: '建筑涂料', icon: Shield },
  { id: 'insulation', name: '保温材料', icon: Zap },
  { id: 'fireproof', name: '防火材料', icon: Shield },
  { id: 'smart', name: '智能设备', icon: Globe },
];

// 产品详情数据 - 河北三楷深发科技产品
const products = [
  {
    id: 1,
    name: 'SK-SF 新型外墙保温系统',
    category: '保温材料',
    categoryId: 'insulation',
    description: '高效节能的外墙保温系统，符合国家建筑节能标准，具有优异的保温隔热性能和防火性能。',
    features: ['A级防火', '导热系数低', '施工便捷', '使用寿命长'],
    image: '/images/products/insulation.svg',
    specifications: [
      { name: '厚度', value: '30-100mm' },
      { name: '导热系数', value: '≤0.040 W/(m·K)' },
      { name: '燃烧性能', value: 'A级不燃' },
      { name: '密度', value: '150-200 kg/m³' },
    ],
  },
  {
    id: 2,
    name: 'SK-TY 防火涂料系列',
    category: '防火材料',
    categoryId: 'fireproof',
    description: '环保型防火涂料，适用于各类建筑钢结构、混凝土表面，提供优异的防火保护。',
    features: ['环保无毒', '附着力强', '耐火时间长', '装饰性好'],
    image: '/images/products/fireproof.svg',
    specifications: [
      { name: '耐火极限', value: '1.5-3小时' },
      { name: '固体含量', value: '≥70%' },
      { name: '表干时间', value: '≤2h' },
      { name: 'VOC含量', value: '≤100g/L' },
    ],
  },
  {
    id: 3,
    name: 'SK-NZ 内墙环保乳胶漆',
    category: '建筑涂料',
    categoryId: 'coating',
    description: '绿色环保内墙涂料，零甲醛添加，净味配方，营造健康舒适的室内环境。',
    features: ['零甲醛', '净味环保', '耐擦洗', '遮盖力强'],
    image: '/images/products/coating.svg',
    specifications: [
      { name: 'VOC含量', value: '未检出' },
      { name: '耐擦洗次数', value: '≥10000次' },
      { name: '干燥时间', value: '表干2h，实干24h' },
      { name: '保质期', value: '18个月' },
    ],
  },
  {
    id: 4,
    name: 'SK-ZN 智能建筑监测系统',
    category: '智能设备',
    categoryId: 'smart',
    description: '基于物联网技术的建筑智能监测系统，实时监控建筑结构安全与环境参数。',
    features: ['实时监测', '数据云端', '智能预警', '移动端管理'],
    image: '/images/products/smart.svg',
    specifications: [
      { name: '监测参数', value: '温度、湿度、沉降、位移' },
      { name: '通信方式', value: '4G/NB-IoT' },
      { name: '采集频率', value: '1-60分钟可调' },
      { name: '工作温度', value: '-20°C ~ +70°C' },
    ],
  },
  {
    id: 5,
    name: 'SK-WM 屋面防水系统',
    category: '建筑涂料',
    categoryId: 'coating',
    description: '高性能屋面防水系统，有效解决屋面渗漏问题，耐候性优异。',
    features: ['高弹性', '耐紫外线', '抗老化', '施工简单'],
    image: '/images/products/waterproof.svg',
    specifications: [
      { name: '断裂伸长率', value: '≥800%' },
      { name: '低温柔性', value: '-20°C无裂纹' },
      { name: '不透水性', value: '0.3MPa，30min不透水' },
      { name: '厚度', value: '1.5-2.0mm' },
    ],
  },
  {
    id: 6,
    name: 'SK-QH 轻质隔墙板',
    category: '保温材料',
    categoryId: 'insulation',
    description: '新型轻质隔墙材料，重量轻、强度高、隔音保温效果好，绿色环保。',
    features: ['轻质高强', '隔音隔热', '防火防潮', '安装便捷'],
    image: '/images/products/partition.svg',
    specifications: [
      { name: '面密度', value: '≤80kg/m²' },
      { name: '隔音量', value: '≥45dB' },
      { name: '抗压强度', value: '≥5.0MPa' },
      { name: '耐火极限', value: '≥3h' },
    ],
  },
];

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  // 筛选产品
  const filteredProducts = products.filter((product) => {
    const matchCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {/* 页面头部 */}
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ChevronLeft className="h-4 w-4" />
              返回门户首页
            </Link>
            <div className="flex items-center gap-3">
              <Factory className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">产品中心</h2>
            </div>
            <p className="text-muted-foreground mt-1">
              河北三楷深发科技股份有限公司 - 专业的建筑材料与智能设备供应商
            </p>
          </div>

          {/* Hero 区域 */}
          <Card className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="max-w-xl">
                  <h3 className="text-2xl font-bold mb-4">以科技创新，筑就品质未来</h3>
                  <p className="text-blue-100 mb-6">
                    我们致力于提供高品质的建筑材料和智能解决方案，助力绿色建筑与智慧城市建设。
                  </p>
                  <div className="flex gap-4">
                    <Button variant="secondary" className="bg-white text-primary hover:bg-primary/10">
                      获取产品手册
                    </Button>
                    <Button variant="ghost" className="text-white border-white hover:bg-white/10">
                      联系销售
                    </Button>
                  </div>
                </div>
                <div className="hidden md:block">
                  <Award className="h-32 w-32 text-blue-300 opacity-30" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 搜索和筛选 */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索产品名称或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 产品列表 */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">未找到相关产品，请尝试其他筛选条件</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredProducts.map((product) => {
                const isExpanded = expandedProduct === product.id;
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="md:flex">
                      <div className="md:w-1/3 h-48 md:h-auto bg-muted">
                        <SafeImage
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge className="mb-2">{product.category}</Badge>
                              <CardTitle className="text-xl">{product.name}</CardTitle>
                              <CardDescription className="mt-2">{product.description}</CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* 产品特性 */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {product.features.map((feature, idx) => (
                              <Badge key={idx} variant="secondary">
                                {feature}
                              </Badge>
                            ))}
                          </div>

                          {/* 展开详情 */}
                          {isExpanded && (
                            <div className="pt-4 border-t space-y-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                技术参数
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                {product.specifications.map((spec, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                                    <span className="text-muted-foreground">{spec.name}</span>
                                    <span className="font-medium">{spec.value}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex gap-3 pt-4">
                                <Button className="flex-1">
                                  咨询详情
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                                <Button variant="outline">下载技术手册</Button>
                              </div>
                            </div>
                          )}

                          {!isExpanded && (
                            <Button variant="ghost" size="sm" onClick={() => setExpandedProduct(product.id)}>
                              查看详情
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          )}
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;