import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(username, password);
      toast.success('登录成功');
      
      // 检查是否需要修改密码
      if (user?.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      if ((err as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '');
      } else if ((err as Error)?.message) {
        toast.error((err as Error).message);
      } else {
        toast.error('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">欢迎登录</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">请输入您的账号和密码</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="请输入用户名" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="pl-10" 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="请输入密码" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-10 pr-10" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
          <div className="flex items-center justify-center pt-4">
            <span className="text-sm text-muted-foreground">
              还没有账号？{' '}
              <button onClick={() => navigate('/register')} className="text-primary hover:underline">
                立即注册
              </button>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
