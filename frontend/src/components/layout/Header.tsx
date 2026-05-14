import { useNavigate } from 'react-router-dom';
import { Bell, Search, User, LogOut, Home, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import useAuthStore from '@/store/useAuthStore';
import useViewStore from '@/store/useViewStore';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { currentView, setView, isInitialized } = useViewStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSwitchToWorkbench = () => {
    if (!isInitialized) return;
    if (currentView !== 'workbench') {
      setView('workbench');
    }
    navigate('/');
  };

  const handleSwitchToPortal = () => {
    if (!isInitialized) return;
    if (currentView !== 'portal') {
      setView('portal');
    }
    navigate('/');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        {/* 视图切换 */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={currentView === 'workbench' ? 'default' : 'ghost'}
            size="sm"
            onClick={handleSwitchToWorkbench}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            工作台
          </Button>
          <Button
            variant={currentView === 'portal' ? 'default' : 'ghost'}
            size="sm"
            onClick={handleSwitchToPortal}
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            公司门户
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            className="pl-10 w-64"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <Dropdown
            trigger={
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-70">
                <Avatar>
                  <AvatarImage src={user?.avatar} alt={user?.name || '用户'} />
                  <AvatarFallback>
                    {getInitials(user?.name || user?.username || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <div className="font-medium">{user?.name || user?.username || '用户'}</div>
                  <div className="text-muted-foreground text-xs">
                    {user?.is_superuser ? '系统管理员' : '普通用户'}
                  </div>
                </div>
              </div>
            }
          >
            <div className="py-1">
              <DropdownItem onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-3" />
                个人资料
              </DropdownItem>
              <DropdownItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-3" />
                退出登录
              </DropdownItem>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
