import { useState, useEffect } from 'react';
import { Lock, UserCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import useAuthStore from '@/store/useAuthStore';
import apiClient from '@/api/client';

const Profile = () => {
  const { user, fetchUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const updatePayload = { ...formData };
      await apiClient.put(`/v1/auth/users/${user.id}`, updatePayload);
      await fetchUserInfo();
      toast.success('个人资料更新成功');
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    
    if (passwordData.password.length < 6) {
      toast.error('密码长度至少需要6个字符');
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.put(`/v1/auth/users/${user.id}`, {
      password: passwordData.password });
      toast.success('密码修改成功');
      setPasswordData({ password: '', confirmPassword: '' });
      setShowPasswordDialog(false);
    } catch (error) {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">个人资料</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            基本信息
          </CardTitle>
          <CardDescription>
            管理您的账户和个人信息
          </CardDescription>
        </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                更新资料
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              安全设置
            </CardTitle>
            <CardDescription>
              管理您的登录密码
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setShowPasswordDialog(true)}>
              <Lock className="h-4 w-4 mr-2" />
              修改密码
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              请输入您的新密码。请确保两次输入一致。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.password}
                onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                placeholder="请输入新密码"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="请再次输入密码"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPasswordDialog(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                确认修改
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
