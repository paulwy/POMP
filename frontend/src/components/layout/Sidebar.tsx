import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  CheckCircle,
  FileText,
  Calendar,
  Settings,
  Users,
  Shield,
  ChevronDown,
  ChevronRight,
  Building2,
  Factory,
  Award,
  LogOut,
  ShoppingCart,
  BarChart3,
  Edit3,
  Globe,
  LayoutDashboard,
  HelpCircle,
  Sparkles,
  MapPin,
  FileCheck,
  Package,
  ClipboardList,
  BookOpen,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import useAuthStore from '@/store/useAuthStore';
import useViewStore from '@/store/useViewStore';
import { MenuItem } from '@/types';

// 工作台菜单
const workbenchMenuItems: MenuItem[] = [
  { icon: <Home className="h-5 w-5" />, label: '工作台', path: '/' },
  {
    icon: <CheckCircle className="h-5 w-5" />,
    label: '审批管理',
    path: '/approvals',
    children: [
      { icon: <Plus className="h-4 w-4" />, label: '发起审批', path: '/approvals/new' },
      { icon: <FileText className="h-4 w-4" />, label: '待我审批', path: '/approvals' },
      { icon: <FileText className="h-4 w-4" />, label: '我发起的', path: '/approvals/my-requests' },
      { icon: <FileText className="h-4 w-4" />, label: '审批历史', path: '/approvals/history' },
    ],
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    label: '日程安排',
    path: '/schedule',
    children: [
      { icon: <FileText className="h-4 w-4" />, label: '我的日程', path: '/schedule/my' },
      { icon: <FileText className="h-4 w-4" />, label: '会议安排', path: '/schedule/meetings' },
    ],
  },
  {
    icon: <Edit3 className="h-5 w-5" />,
    label: '内容管理',
    path: '/content-management',
    requireAdmin: true,
  },
  {
    icon: <Globe className="h-5 w-5" />,
    label: '网站管理',
    path: '/website-management',
    requireAdmin: true,
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    label: 'AI文档助手',
    path: '/document-ai',
    requireAdmin: true,
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    label: '组织架构',
    path: '/organization',
    requireAdmin: true,
  },
  {
    icon: <Factory className="h-5 w-5" />,
    label: '生产管理',
    path: '/production-docs',
    children: [
      { icon: <FileText className="h-4 w-4" />, label: '文档管理', path: '/production-docs/documents' },
      { icon: <FileText className="h-4 w-4" />, label: '技术标准', path: '/production-docs/standards' },
      { icon: <FileText className="h-4 w-4" />, label: '安全规程', path: '/production-docs/safety' },
      { icon: <FileText className="h-4 w-4" />, label: '质量标准', path: '/production-docs/quality' },
    ],
  },
  {
    icon: <ClipboardList className="h-5 w-5" />,
    label: '外勤管理',
    path: '/field',
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: 'GIS地图',
    path: '/gis',
  },
  {
    icon: <FileCheck className="h-5 w-5" />,
    label: '合同管理',
    path: '/contracts',
  },
  {
    icon: <Package className="h-5 w-5" />,
    label: '素材库',
    path: '/materials',
  },
  {
    icon: <ShoppingCart className="h-5 w-5" />,
    label: '仓储物流',
    path: '/warehouse/inventory',
    children: [
      { icon: <FileText className="h-4 w-4" />, label: '库存管理', path: '/warehouse/inventory' },
      { icon: <FileText className="h-4 w-4" />, label: '采购管理', path: '/warehouse/purchase' },
      { icon: <FileText className="h-4 w-4" />, label: '销售管理', path: '/warehouse/sales' },
    ],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    label: '财务管理',
    path: '/finance',
    requireAdmin: true,
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: '人力资源',
    path: '/hr',
    children: [
      { icon: <FileText className="h-4 w-4" />, label: '员工管理', path: '/hr/employees' },
      { icon: <FileText className="h-4 w-4" />, label: '考勤管理', path: '/hr/attendance' },
      { icon: <FileText className="h-4 w-4" />, label: '请假管理', path: '/hr/leave' },
    ],
  },
  { 
    icon: <Settings className="h-5 w-5" />, 
    label: '系统设置', 
    path: '/system/config-center',
    requireAdmin: true,
    children: [
      { icon: <Users className="h-4 w-4" />, label: '用户管理', path: '/users', requireAdmin: true },
      { icon: <Shield className="h-4 w-4" />, label: '角色管理', path: '/system/roles', requireAdmin: true },
      { icon: <LayoutDashboard className="h-4 w-4" />, label: '配置中心', path: '/system/config-center', requireAdmin: true },
      { icon: <Settings className="h-4 w-4" />, label: '工作流设置', path: '/workflow-settings', requireAdmin: true },
      { icon: <FileText className="h-4 w-4" />, label: '字典管理', path: '/system/dict', requireAdmin: true },
      { icon: <BookOpen className="h-4 w-4" />, label: '模板管理', path: '/system/templates', requireAdmin: true },
    ]
  },
  { 
    icon: <HelpCircle className="h-5 w-5" />, 
    label: '帮助中心', 
    path: '/help'
  },
];

// 公司门户菜单
const portalMenuItems: MenuItem[] = [
  { icon: <Building2 className="h-5 w-5" />, label: '门户首页', path: '/' },
  {
    icon: <Factory className="h-5 w-5" />,
    label: '产品中心',
    path: '/portal/category/products',
  },
  {
    icon: <Award className="h-5 w-5" />,
    label: '公司概况',
    path: '/portal/category/about',
  },
  {
    icon: <FileText className="h-5 w-5" />,
    label: '新闻公告',
    path: '/portal/category/news',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    label: '资质荣誉',
    path: '/portal/category/honors',
  },
  {
    icon: <Users className="h-5 w-5" />,
    label: '联系我们',
    path: '/portal/contact',
  },
];

const filterMenuItems = (items: MenuItem[], isAdmin: boolean): MenuItem[] => {
  return items
    .filter(item => {
      if (item.requireAdmin && !isAdmin) return false;
      return true;
    })
    .map(item => ({
      ...item,
      children: item.children ? filterMenuItems(item.children, isAdmin) : undefined
    }))
    .filter(item => {
      if (item.children) {
        return item.children.length > 0;
      }
      return true;
    });
};

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const location = useLocation();
  const { user, logout, fetchUserInfo } = useAuthStore();
  const { currentView } = useViewStore();
  const isAdmin = user?.is_superuser || false;

  useEffect(() => {
    if (user && !user.email) {
      fetchUserInfo();
    }
  }, [user, fetchUserInfo]);

  // 根据当前视图选择菜单
  const allMenuItems = currentView === 'workbench' ? workbenchMenuItems : portalMenuItems;
  const menuItems = filterMenuItems(allMenuItems, isAdmin);

  const toggleMenu = (label: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedMenus(newExpanded);
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = hasChildren && expandedMenus.has(item.label);
    const isActive = location.pathname === item.path;

    return (
      <div key={item.path}>
        {hasChildren ? (
          <button
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              depth > 0 ? 'pl-8' : ''
            }`}
            onClick={() => toggleMenu(item.label)}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <Link
            to={item.path}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
              depth > 0 ? 'pl-8' : ''
            } ${isActive ? 'bg-accent text-accent-foreground' : ''}`}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
          </Link>
        )}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {item.children!.map((child: MenuItem) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-background border-r border-border h-screen flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">SKSF-EMS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {currentView === 'workbench' ? '企业管理系统' : '企业门户网站'}
        </p>
        {user && (
          <p className="text-xs text-muted-foreground mt-2">
            {user.name || user.username} 
            {user.is_superuser && <span className="ml-1 text-xs text-primary">(管理员)</span>}
          </p>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
