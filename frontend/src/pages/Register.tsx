import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { register } from '@/services/auth';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registered, setRegistered] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setErrorMessage('两次输入的密码不一致');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('密码长度至少为6位');
      return;
    }
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      await register({
        username,
        email: email || undefined,
        password,
      });
      setRegistered(true);
    } catch (err) {
      if ((err as { response?: { data?: { message?: string } } })?.response?.data?.message) {
        setErrorMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message || '');
      } else if ((err as Error)?.message) {
        setErrorMessage((err as Error).message || '');
      } else {
        setErrorMessage('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="space-y-6 text-center py-12">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold">注册成功</h2>
            <p className="text-muted-foreground">
              您的账号已创建，需要等待管理员审批后才能登录。
            </p>
            <Button onClick={() => navigate('/login')} className="mt-6">
              返回登录页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">用户注册</CardTitle>
          <p className="text-muted-foreground text-sm mt-2">创建您的新账号</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorMessage && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md text-center">
              {errorMessage}
            </div>
          )}
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
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="请输入邮箱" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
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
                    placeholder="请输入密码（至少6位）" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pl-10 pr-10" 
                    required 
                    minLength={6}
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="confirmPassword" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="请再次输入密码" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="pl-10" 
                    required 
                    minLength={6}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>
          <div className="flex items-center justify-center pt-4">
            <span className="text-sm text-muted-foreground">
              已有账号？{' '}
              <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                立即登录
              </button>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
