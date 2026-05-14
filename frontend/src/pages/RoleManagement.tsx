import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { roleApi, Role, CreateRoleRequest, UpdateRoleRequest, PERMISSION_GROUPS, PERMISSION_TEMPLATES } from '@/services/role';
import { toast } from 'sonner';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const [roleForm, setRoleForm] = useState<CreateRoleRequest>({
    name: '',
    code: '',
    description: '',
    sort_order: 0,
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchRoles();
  }, [currentPage]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleApi.getRoles(currentPage, 10);
      setRoles(data.data);
      setTotal(data.total);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error('获取角色列表失败:', error);
      toast.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!roleForm.name.trim() || !roleForm.code.trim()) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      await roleApi.createRole(roleForm);
      toast.success('角色创建成功');
      setShowRoleDialog(false);
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      console.error('创建角色失败:', error);
      toast.error('创建角色失败');
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const updateData: UpdateRoleRequest = {
        name: roleForm.name,
        description: roleForm.description,
        sort_order: roleForm.sort_order,
      };
      await roleApi.updateRole(editingRole.id, updateData);
      toast.success('角色更新成功');
      setShowRoleDialog(false);
      setEditingRole(null);
      resetRoleForm();
      fetchRoles();
    } catch (error) {
      console.error('更新角色失败:', error);
      toast.error('更新角色失败');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    if (role.is_system) {
      toast.error('系统角色不能删除');
      return;
    }

    if (!confirm(`确定要删除角色"${role.name}"吗？`)) return;

    try {
      await roleApi.deleteRole(role.id);
      toast.success('角色删除成功');
      fetchRoles();
    } catch (error) {
      console.error('删除角色失败:', error);
      toast.error('删除角色失败');
    }
  };

  const handleToggleRoleStatus = async (role: Role) => {
    if (role.is_system) {
      toast.error('系统角色不能停用');
      return;
    }

    try {
      await roleApi.updateRoleStatus(role.id, !role.is_active);
      toast.success(`角色${role.is_active ? '停用' : '启用'}成功`);
      fetchRoles();
    } catch (error) {
      console.error('更新角色状态失败:', error);
      toast.error('更新角色状态失败');
    }
  };

  const openRoleDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({
        name: role.name,
        code: role.code,
        description: role.description || '',
        sort_order: role.sort_order || 0,
      });
    } else {
      setEditingRole(null);
      resetRoleForm();
    }
    setShowRoleDialog(true);
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      code: '',
      description: '',
      sort_order: 0,
    });
  };

  const openPermissionDialog = async (role: Role) => {
    setSelectedRoleId(role.id);
    setSelectedPermissions([]);
    setShowPermissionDialog(true);

    try {
      const permissions = await roleApi.getRolePermissions(role.id);
      const permissionCodes = permissions.map(p => p.code);
      setSelectedPermissions(permissionCodes);
    } catch (error) {
      console.error('获取角色权限失败:', error);
    }
  };

  const handlePermissionChange = (code: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions([...selectedPermissions, code]);
    } else {
      setSelectedPermissions(selectedPermissions.filter(p => p !== code));
    }
  };

  const handleSelectTemplate = (templateKey: keyof typeof PERMISSION_TEMPLATES) => {
    const template = PERMISSION_TEMPLATES[templateKey];
    if (template.permissions[0] === '*') {
      const allPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions).map(p => p.code);
      setSelectedPermissions(allPermissions);
    } else {
      setSelectedPermissions(template.permissions as string[]);
    }
    toast.info(`已应用"${template.name}"权限模板`);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;

    try {
      await roleApi.assignRolePermissions(selectedRoleId, selectedPermissions);
      toast.success('权限保存成功');
      setShowPermissionDialog(false);
    } catch (error) {
      console.error('保存权限失败:', error);
      toast.error('保存权限失败');
    }
  };

  const handleSelectAll = () => {
    const allPermissions = PERMISSION_GROUPS.flatMap(g => g.permissions).map(p => p.code);
    setSelectedPermissions(allPermissions);
  };

  const handleSelectNone = () => {
    setSelectedPermissions([]);
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">角色管理</h1>
          <p className="text-muted-foreground mt-1">管理系统角色和权限配置</p>
        </div>
        <Button onClick={() => openRoleDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增角色
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索角色..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暂无角色数据</p>
          ) : (
            <div className="space-y-3">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      role.is_system ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{role.name}</span>
                        {role.is_system && (
                          <Badge variant="secondary" className="text-xs">系统</Badge>
                        )}
                        {role.is_active ? (
                          <Badge variant="default" className="text-xs bg-green-500">启用</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">停用</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{role.code}</span>
                        {role.description && (
                          <>
                            <span>•</span>
                            <span>{role.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPermissionDialog(role)}
                      title="分配权限"
                    >
                      <Shield className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRoleDialog(role)}
                      disabled={role.is_system}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={role.is_active ? 'outline' : 'default'}
                      onClick={() => handleToggleRoleStatus(role)}
                      disabled={role.is_system}
                    >
                      {role.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRole(role)}
                      disabled={role.is_system}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                共 {total} 条，第 {currentPage}/{totalPages} 页
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">角色名称 *</Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="如：管理员"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-code">角色代码 *</Label>
              <Input
                id="role-code"
                value={roleForm.code}
                onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                placeholder="如：admin"
                disabled={!!editingRole}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">描述</Label>
              <textarea
                id="role-desc"
                className="w-full h-20 px-3 py-2 border rounded-md"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="请输入角色描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-order">排序</Label>
              <Input
                id="role-order"
                type="number"
                value={roleForm.sort_order}
                onChange={(e) => setRoleForm({ ...roleForm, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>取消</Button>
            <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
              {editingRole ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>分配权限</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 pb-4 border-b">
            <span className="text-sm text-muted-foreground">快速选择：</span>
            <Button size="sm" variant="outline" onClick={handleSelectAll}>全选</Button>
            <Button size="sm" variant="outline" onClick={handleSelectNone}>清空</Button>
            <div className="h-6 w-px bg-border mx-1" />
            {Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => (
              <Button
                key={key}
                size="sm"
                variant="secondary"
                onClick={() => handleSelectTemplate(key as keyof typeof PERMISSION_TEMPLATES)}
              >
                {template.name}
              </Button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.group} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{group.group}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const groupPerms = group.permissions.map(p => p.code);
                      const allSelected = groupPerms.every(p => selectedPermissions.includes(p));
                      if (allSelected) {
                        setSelectedPermissions(selectedPermissions.filter(p => !groupPerms.includes(p)));
                      } else {
                        setSelectedPermissions([...selectedPermissions, ...groupPerms.filter(p => !selectedPermissions.includes(p))]);
                      }
                    }}
                  >
                    {group.permissions.every(p => selectedPermissions.includes(p.code)) ? '取消' : '全选'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {group.permissions.map((permission) => (
                    <label
                      key={permission.code}
                      className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                    >
                      <Checkbox
                        id={permission.code}
                        checked={selectedPermissions.includes(permission.code)}
                        onCheckedChange={(checked: boolean) => handlePermissionChange(permission.code, checked)}
                      />
                      <span className="text-sm">{permission.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{permission.code}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedPermissions.length} 项权限
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSavePermissions}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoleManagement;
