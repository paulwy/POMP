import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, Settings, Workflow as WorkflowIcon, Database, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { workflowApi, Workflow, WorkflowNode, CreateWorkflowRequest, UpdateWorkflowRequest, CreateWorkflowNodeRequest, UpdateWorkflowNodeRequest, User } from '@/services/workflow';
import { toast } from 'sonner';
import { templateService } from '@/services/templates';

const WorkflowManagement: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [showNodeDialog, setShowNodeDialog] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);

  const [workflowForm, setWorkflowForm] = useState<CreateWorkflowRequest>({ name: '', description: '' });
  const [nodeForm, setNodeForm] = useState<CreateWorkflowNodeRequest>({
    workflow_id: '',
    name: '',
    node_type: 'approval',
    node_order: 1,
    approver_user: '',
    timeout_days: 7,
  });

  const [showSaveAsTemplateDialog, setShowSaveAsTemplateDialog] = useState(false);
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [saveAsTemplateCode, setSaveAsTemplateCode] = useState('');
  const [saveAsTemplateDescription, setSaveAsTemplateDescription] = useState('');
  const [saveAsTemplateTags, setSaveAsTemplateTags] = useState('');

  useEffect(() => {
    fetchWorkflows();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedWorkflow) {
      fetchNodes(selectedWorkflow.id);
    }
  }, [selectedWorkflow]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data } = await workflowApi.getWorkflows();
      setWorkflows(data);
      if (data.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(data[0]);
      }
    } catch (error) {
      console.error('获取工作流失败:', error);
      toast.error('获取工作流列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInitDefaults = async () => {
    try {
      await workflowApi.initDefaultWorkflows();
      toast.success('默认工作流初始化成功');
      fetchWorkflows();
    } catch (error) {
      console.error('初始化失败:', error);
      toast.error('初始化失败');
    }
  };

  const fetchNodes = async (workflowId: string) => {
    if (!workflowId || workflowId === 'undefined') {
      console.warn('Invalid workflow ID, skipping fetchNodes');
      setNodes([]);
      return;
    }
    try {
      const data = await workflowApi.getWorkflowNodes(workflowId);
      setNodes(data);
    } catch (error) {
      console.error('获取节点失败:', error);
      toast.error('获取工作流节点失败');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await workflowApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('获取用户失败:', error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!saveAsTemplateName || !saveAsTemplateCode || !selectedWorkflow) {
      toast.error('请填写模板信息并选择工作流');
      return;
    }

    try {
      const content = {
        workflow: {
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
        },
        nodes: nodes.map(node => ({
          name: node.name,
          node_type: node.node_type,
          node_order: node.node_order,
          approver_role: node.approver_role,
          approver_user: node.approver_user,
          is_multiple: node.is_multiple,
          min_approve: node.min_approve,
          timeout_days: node.timeout_days,
        })),
      };

      await templateService.createTemplate({
        code: saveAsTemplateCode,
        name: saveAsTemplateName,
        description: saveAsTemplateDescription || undefined,
        category: '工作流',
        template_type: 'workflow',
        content,
        tags: saveAsTemplateTags ? saveAsTemplateTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        is_active: true,
        is_default: false,
      });

      toast.success('工作流模板保存成功');
      setShowSaveAsTemplateDialog(false);
      setSaveAsTemplateName('');
      setSaveAsTemplateCode('');
      setSaveAsTemplateDescription('');
      setSaveAsTemplateTags('');
    } catch (error) {
      console.error('保存模板失败:', error);
      toast.error('保存模板失败');
    }
  };

  const handleCreateWorkflow = async () => {
    if (!workflowForm.name.trim()) {
      toast.error('请输入工作流名称');
      return;
    }
    try {
      await workflowApi.createWorkflow(workflowForm);
      toast.success('工作流创建成功');
      setShowWorkflowDialog(false);
      setWorkflowForm({ name: '', description: '' });
      fetchWorkflows();
    } catch (error) {
      console.error('创建工作流失败:', error);
      toast.error('创建工作流失败');
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow || !workflowForm.name.trim()) {
      toast.error('请输入工作流名称');
      return;
    }
    try {
      const request: UpdateWorkflowRequest = {
        name: workflowForm.name,
        description: workflowForm.description,
        is_active: editingWorkflow.is_active,
      };
      await workflowApi.updateWorkflow(editingWorkflow.id, request);
      toast.success('工作流更新成功');
      setShowWorkflowDialog(false);
      setEditingWorkflow(null);
      setWorkflowForm({ name: '', description: '' });
      fetchWorkflows();
      if (selectedWorkflow?.id === editingWorkflow.id) {
        setSelectedWorkflow({ ...selectedWorkflow, name: workflowForm.name, description: workflowForm.description });
      }
    } catch (error) {
      console.error('更新工作流失败:', error);
      toast.error('更新工作流失败');
    }
  };

  const handleDeleteWorkflow = async (workflow: Workflow) => {
    if (!confirm(`确定要删除工作流"${workflow.name}"吗？`)) return;
    try {
      await workflowApi.deleteWorkflow(workflow.id);
      toast.success('工作流删除成功');
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow(null);
        setNodes([]);
      }
      fetchWorkflows();
    } catch (error) {
      console.error('删除工作流失败:', error);
      toast.error('删除工作流失败');
    }
  };

  const handleToggleWorkflowStatus = async (workflow: Workflow) => {
    try {
      const request: UpdateWorkflowRequest = {
        name: workflow.name,
        description: workflow.description,
        is_active: !workflow.is_active,
      };
      await workflowApi.updateWorkflow(workflow.id, request);
      toast.success(`工作流已${!workflow.is_active ? '启用' : '禁用'}`);
      fetchWorkflows();
      if (selectedWorkflow?.id === workflow.id) {
        setSelectedWorkflow({ ...selectedWorkflow, is_active: !workflow.is_active });
      }
    } catch (error) {
      console.error('更新工作流状态失败:', error);
      toast.error('更新工作流状态失败');
    }
  };

  const handleCreateNode = async () => {
    if (!nodeForm.name.trim() || !selectedWorkflow) {
      toast.error('请输入节点名称');
      return;
    }
    try {
      await workflowApi.createWorkflowNode(nodeForm);
      toast.success('节点创建成功');
      setShowNodeDialog(false);
      resetNodeForm();
      fetchNodes(selectedWorkflow.id);
    } catch (error) {
      console.error('创建节点失败:', error);
      toast.error('创建节点失败');
    }
  };

  const handleUpdateNode = async () => {
    if (!editingNode) {
      toast.error('请选择要更新的节点');
      return;
    }
    try {
      const request: UpdateWorkflowNodeRequest = {
        name: nodeForm.name,
        node_type: nodeForm.node_type,
        node_order: nodeForm.node_order,
        approver_role: nodeForm.approver_role,
        approver_user: nodeForm.approver_user,
        is_multiple: nodeForm.is_multiple,
        min_approve: nodeForm.min_approve,
        timeout_days: nodeForm.timeout_days,
      };
      await workflowApi.updateWorkflowNode(editingNode.id, request);
      toast.success('节点更新成功');
      setShowNodeDialog(false);
      setEditingNode(null);
      resetNodeForm();
      if (selectedWorkflow) {
        fetchNodes(selectedWorkflow.id);
      }
    } catch (error) {
      console.error('更新节点失败:', error);
      toast.error('更新节点失败');
    }
  };

  const handleDeleteNode = async (node: WorkflowNode) => {
    if (!confirm(`确定要删除节点"${node.name}"吗？`)) return;
    try {
      await workflowApi.deleteWorkflowNode(node.id);
      toast.success('节点删除成功');
      if (selectedWorkflow) {
        fetchNodes(selectedWorkflow.id);
      }
    } catch (error) {
      console.error('删除节点失败:', error);
      toast.error('删除节点失败');
    }
  };

  const resetNodeForm = () => {
    setNodeForm({
      workflow_id: selectedWorkflow?.id || '',
      name: '',
      node_type: 'approval',
      node_order: nodes.length + 1,
      approver_user: '',
      timeout_days: 7,
    });
  };

  const openWorkflowDialog = (workflow?: Workflow) => {
    if (workflow) {
      setEditingWorkflow(workflow);
      setWorkflowForm({ name: workflow.name, description: workflow.description || '' });
    } else {
      setEditingWorkflow(null);
      setWorkflowForm({ name: '', description: '' });
    }
    setShowWorkflowDialog(true);
  };

  const openNodeDialog = (node?: WorkflowNode) => {
    if (node) {
      setEditingNode(node);
      setNodeForm({
        workflow_id: node.workflow_id,
        name: node.name,
        node_type: node.node_type,
        node_order: node.node_order,
        approver_role: node.approver_role,
        approver_user: node.approver_user,
        is_multiple: node.is_multiple,
        min_approve: node.min_approve,
        timeout_days: node.timeout_days,
      });
    } else {
      setEditingNode(null);
      resetNodeForm();
    }
    setShowNodeDialog(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">工作流设置</h1>
          <p className="text-muted-foreground mt-1">管理审批工作流及其节点</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openWorkflowDialog()} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            新建工作流
          </Button>
          <Button onClick={handleInitDefaults} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            初始化默认工作流
          </Button>
          <Button onClick={() => fetchWorkflows()} variant="outline">
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WorkflowIcon className="h-5 w-5" />
                工作流列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : workflows.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">暂无工作流</p>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedWorkflow?.id === workflow.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedWorkflow(workflow)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">{workflow.name}</span>
                        </div>
                        <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                          {workflow.is_active ? '启用' : '禁用'}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className={`text-xs mt-1 ${selectedWorkflow?.id === workflow.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {workflow.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedWorkflow ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {selectedWorkflow.name}
                    <Badge variant={selectedWorkflow.is_active ? 'default' : 'secondary'}>
                      {selectedWorkflow.is_active ? '启用' : '禁用'}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleToggleWorkflowStatus(selectedWorkflow)}>
                      {selectedWorkflow.is_active ? '禁用' : '启用'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setSaveAsTemplateName(`${selectedWorkflow.name} 模板`);
                      setSaveAsTemplateCode(`workflow_${selectedWorkflow.name.toLowerCase().replace(/\s/g, '_')}`);
                      setShowSaveAsTemplateDialog(true);
                    }}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openWorkflowDialog(selectedWorkflow)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteWorkflow(selectedWorkflow)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {selectedWorkflow.description && (
                  <p className="text-sm text-muted-foreground mt-2">{selectedWorkflow.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">审批节点</h3>
                  <Button size="sm" onClick={() => openNodeDialog()}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加节点
                  </Button>
                </div>

                {nodes.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暂无节点，请添加审批节点</p>
                ) : (
                  <div className="space-y-3">
                    {nodes.map((node, index) => (
                      <div key={node.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{node.name}</span>
                                <Badge variant="outline">{node.node_type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                审批人: {node.approver_user
                                  ? users.find(u => u.id === node.approver_user)?.name || users.find(u => u.id === node.approver_user)?.username || node.approver_user
                                  : '未设置'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                超时时间: {node.timeout_days || 7} 天
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openNodeDialog(node)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteNode(node)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {index < nodes.length - 1 && (
                          <div className="flex justify-center mt-3">
                            <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <WorkflowIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">请选择一个工作流进行编辑</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkflow ? '编辑工作流' : '新建工作流'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">工作流名称</Label>
              <Input
                id="workflow-name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder="请输入工作流名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-desc">描述</Label>
              <Input
                id="workflow-desc"
                value={workflowForm.description || ''}
                onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                placeholder="请输入工作流描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
              取消
            </Button>
            <Button onClick={editingWorkflow ? handleUpdateWorkflow : handleCreateWorkflow}>
              {editingWorkflow ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNodeDialog} onOpenChange={setShowNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingNode ? '编辑节点' : '添加节点'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="node-name">节点名称</Label>
              <Input
                id="node-name"
                value={nodeForm.name}
                onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                placeholder="如：部门经理审批"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-type">节点类型</Label>
              <select
                id="node-type"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={nodeForm.node_type}
                onChange={(e) => setNodeForm({ ...nodeForm, node_type: e.target.value })}
              >
                <option value="approval">审批</option>
                <option value="condition">条件</option>
                <option value="action">操作</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-order">节点顺序</Label>
              <Input
                id="node-order"
                type="number"
                min={1}
                value={nodeForm.node_order}
                onChange={(e) => setNodeForm({ ...nodeForm, node_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-approver">审批人</Label>
              <select
                id="node-approver"
                className="w-full h-10 px-3 border rounded-md bg-background"
                value={nodeForm.approver_user || ''}
                onChange={(e) => setNodeForm({ ...nodeForm, approver_user: e.target.value })}
              >
                <option value="">请选择审批人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.username} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="node-timeout">超时天数</Label>
              <Input
                id="node-timeout"
                type="number"
                min={1}
                value={nodeForm.timeout_days || 7}
                onChange={(e) => setNodeForm({ ...nodeForm, timeout_days: parseInt(e.target.value) || 7 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNodeDialog(false)}>
              取消
            </Button>
            <Button onClick={editingNode ? handleUpdateNode : handleCreateNode}>
              {editingNode ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveAsTemplateDialog} onOpenChange={setShowSaveAsTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存工作流为模板</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">模板名称 *</Label>
              <Input
                id="template-name"
                value={saveAsTemplateName}
                onChange={(e) => setSaveAsTemplateName(e.target.value)}
                placeholder="输入模板名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-code">模板编码 *</Label>
              <Input
                id="template-code"
                value={saveAsTemplateCode}
                onChange={(e) => setSaveAsTemplateCode(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="输入模板编码（小写字母和下划线）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-desc">描述</Label>
              <textarea
                id="template-desc"
                className="w-full h-20 px-3 py-2 border rounded-md"
                value={saveAsTemplateDescription}
                onChange={(e) => setSaveAsTemplateDescription(e.target.value)}
                placeholder="输入模板描述"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-tags">标签（逗号分隔）</Label>
              <Input
                id="template-tags"
                value={saveAsTemplateTags}
                onChange={(e) => setSaveAsTemplateTags(e.target.value)}
                placeholder="如: 工作流, 审批"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveAsTemplateDialog(false)}>取消</Button>
            <Button onClick={handleSaveAsTemplate}>
              <Save className="h-4 w-4 mr-2" />
              保存模板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowManagement;