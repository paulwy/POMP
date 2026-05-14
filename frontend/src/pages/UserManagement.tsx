import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, Mail, Phone, Calendar, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  approveUser,
  getPendingUsers,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type ApproveUserRequest
} from '@/services/auth';

interface UserFormData {
  username: string;
  email: string;
  password: string;
  name?: string;
  phone?: string;
  is_active: boolean;
  is_superuser: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    is_active: true,
    is_superuser: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers(currentPage, 10);
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const pending = await getPendingUsers();
      setPendingUsers(pending);
    } catch (error) {
      console.error('获取待审批用户失败:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    // 初始化时加载待审批用户
    fetchPendingUsers();
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      is_active: true,
      is_superuser: false,
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      name: user.name || '',
      phone: user.phone || '',
      is_active: user.is_active,
      is_superuser: user.is_superuser,
    });
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.username || !formData.email) {
      toast.error('请填写必填项');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('请设置密码');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUser) {
        const updateData: UpdateUserRequest = {
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          is_active: formData.is_active,
          is_superuser: formData.is_superuser,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateUser(editingUser.id, updateData);
        toast.success('用户更新成功');
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          is_superuser: formData.is_superuser,
        };
        await createUser(createData);
        toast.success('用户创建成功');
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('保存用户失败:', error);
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || '保存用户失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('确定要删除此用户吗？')) return;
    
    try {
      await deleteUser(userId);
      toast.success('用户删除成功');
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      toast.error('删除用户失败');
    }
  };

  const handleApproveUser = async (userId: string, approved: boolean) => {
    try {
      const request: ApproveUserRequest = {
        user_id: userId,
        approved,
      };
      await approveUser(request);
      toast.success(approved ? '用户已批准' : '用户已拒绝');
      fetchUsers();
      fetchPendingUsers();
    } catch (error) {
      console.error('审批用户失败:', error);
      toast.error('审批用户失败');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />已批准</Badge>;
      case 'pending':
        return <Badge variant="warning" className="flex items-center gap-1"><Clock className="h-3 w-3" />待审批</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />已拒绝</Badge>;
      case 'archived':
        return <Badge variant="secondary">已归档</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">用户管理</h2>
            <p className="text-muted-foreground mt-1">管理系统用户账号</p>
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? '' : 'bg-background hover:bg-accent'}
            >
              <Users className="h-4 w-4 mr-2" />
              全部用户 ({users.length})
            </Button>
            <Button
              variant={activeTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pending')}
              className={activeTab === 'pending' ? '' : 'bg-background hover:bg-accent'}
            >
              <Clock className="h-4 w-4 mr-2" />
              待审批 ({pendingUsers.length})
            </Button>
          </div>

          {activeTab === 'pending' && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5" />
                  待审批用户
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">暂无待审批用户</div>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{user.name || user.username}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email && <p>{user.email}</p>}
                            <p>注册时间: {formatDate(user.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleApproveUser(user.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            拒绝
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleApproveUser(user.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            批准
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                用户列表
              </CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-72 h-9"
                  />
                </div>
                <Button onClick={handleAddUser} className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  添加用户
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">暂无用户数据</div>
              ) : (
                <>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-sm">用户</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">联系方式</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">角色</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">状态</th>
                          <th className="text-left py-3 px-4 font-medium text-sm">创建时间</th>
                          <th className="text-right py-3 px-4 font-medium text-sm">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b border-border hover:bg-accent/30 transition-colors">
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-medium">{user.name || user.username}</p>
                                <p className="text-sm text-muted-foreground">@{user.username}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {user.email}
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {user.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={user.is_superuser ? 'default' : 'secondary'}>
                                {user.is_superuser ? '管理员' : '普通用户'}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(user.status)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(user.created_at)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)} className="h-8 px-2">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="h-8 px-2">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      显示 {filteredUsers.length} / {total} 条记录
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-9"
                      >
                        上一页
                      </Button>
                      <span className="text-sm px-2">
                        第 {currentPage} / {Math.ceil(total / 10)} 页
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / 10), p + 1))}
                        disabled={currentPage === Math.ceil(total / 10)}
                        className="h-9"
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingUser ? '编辑用户' : '添加用户'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-2 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">用户名 *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={!!editingUser}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">邮箱 *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">{editingUser ? '新密码（可选）' : '密码 *'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-10"
                placeholder={editingUser ? '留空则不修改密码' : ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">姓名</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">电话</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="is_superuser" className="text-sm font-medium">管理员权限</Label>
                <p className="text-xs text-muted-foreground">授予完整系统管理权限</p>
              </div>
              <Switch
                id="is_superuser"
                checked={formData.is_superuser}
                onCheckedChange={(checked) => setFormData({ ...formData, is_superuser: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-10 px-4">
              取消
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving} className="h-10 px-4">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
