import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Eye,
  Save,
  X,
  Filter,
  Wand2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import {
  contractService,
  Contract,
  CreateContract,
  UpdateContract,
} from '@/services/contract';
import {
  templateService,
  Template,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from '@/services/templates';

const CONTRACT_TYPES = [
  { value: 'ALL', label: '全部类型' },
  { value: 'SALES', label: '销售合同' },
  { value: 'PURCHASE', label: '采购合同' },
  { value: 'CONSTRUCTION', label: '工程合同' },
  { value: 'SERVICE', label: '服务合同' },
  { value: 'LABOR', label: '劳动合同' },
  { value: 'CONFIDENTIALITY', label: '保密协议' },
];

const CONTRACT_CATEGORIES = [
  { value: 'ALL', label: '全部分类' },
  { value: 'BUSINESS', label: '商业类' },
  { value: 'PROJECT', label: '项目类' },
  { value: 'HR', label: '人力资源类' },
  { value: 'LEGAL', label: '法务类' },
];

const CONTRACT_STATUS = [
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已审批' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'signed', label: '已签署' },
  { value: 'executing', label: '执行中' },
  { value: 'completed', label: '已完成' },
  { value: 'terminated', label: '已终止' },
];

const ContractManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showTemplateSelectorDialog, setShowTemplateSelectorDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  const [templateForm, setTemplateForm] = useState({
    code: '',
    name: '',
    description: '',
    contract_type: 'SALES',
    category: 'BUSINESS',
    content: '',
    variables: '[]',
    version: '1.0',
    is_active: true,
    sort_order: 0,
  });

  const [contractForm, setContractForm] = useState<CreateContract>({
    name: '',
    description: '',
    contract_type: 'SALES',
    category: 'BUSINESS',
    first_party: '',
    second_party: '',
    currency: 'CNY',
    status: 'draft',
  });

  const [contractVariables, setContractVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (activeTab === 'templates') {
      fetchTemplates();
    } else {
      fetchContracts();
    }
  }, [activeTab]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await templateService.getTemplates({ category: '合同' });
      const contractTemplates = data.map(t => t.template).filter(t => 
        (!selectedType || selectedType === 'ALL' || t.template_type === selectedType)
      );
      setTemplates(contractTemplates);
    } catch (error) {
      console.error('获取合同模板失败:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const status = selectedStatus === 'ALL' ? undefined : selectedStatus;
      const contractType = selectedType === 'ALL' ? undefined : selectedType;
      const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const data = await contractService.getContracts(status, contractType, category);
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取合同失败:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.first_party.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.second_party.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      code: '',
      name: '',
      description: '',
      contract_type: 'SALES',
      category: 'BUSINESS',
      content: '',
      variables: '[]',
      version: '1.0',
      is_active: true,
      sort_order: 0,
    });
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setTemplateForm({
      code: template.code,
      name: template.name,
      description: template.description || '',
      contract_type: template.template_type,
      category: (template.content as any)?.category || 'BUSINESS',
      content: typeof template.content === 'object' ? template.content.body || '' : template.content,
      variables: template.variables ? JSON.stringify(template.variables, null, 2) : '[]',
      version: template.version,
      is_active: template.is_active,
      sort_order: template.sort_order,
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const content = {
        category: templateForm.category,
        contract_type: templateForm.contract_type,
        body: templateForm.content,
      };
      
      const variables = templateForm.variables ? JSON.parse(templateForm.variables) : [];

      if (editingTemplate) {
        const updateData: UpdateTemplateRequest = {
          name: templateForm.name,
          description: templateForm.description || undefined,
          content,
          variables,
          version: templateForm.version,
          is_active: templateForm.is_active,
          sort_order: templateForm.sort_order,
        };
        await templateService.updateTemplate(editingTemplate.id, updateData);
      } else {
        const createData: CreateTemplateRequest = {
          code: templateForm.code,
          name: templateForm.name,
          description: templateForm.description || undefined,
          category: '合同',
          template_type: templateForm.contract_type,
          content,
          variables,
          version: templateForm.version,
          is_active: templateForm.is_active,
          sort_order: templateForm.sort_order,
        };
        await templateService.createTemplate(createData);
      }
      setShowTemplateDialog(false);
      fetchTemplates();
    } catch (error) {
      console.error('保存合同模板失败:', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除该合同模板吗？')) return;
    try {
      await templateService.deleteTemplate(id);
      fetchTemplates();
    } catch (error) {
      console.error('删除合同模板失败:', error);
    }
  };

  const handleCreateContract = () => {
    setEditingContract(null);
    setContractForm({
      name: '',
      description: '',
      contract_type: 'SALES',
      category: 'BUSINESS',
      first_party: '',
      second_party: '',
      currency: 'CNY',
      status: 'draft',
    });
    setShowContractDialog(true);
  };

  const renderVariables = (content: string, variables: Record<string, string>) => {
    let result = content;
    Object.entries(variables).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        result = result.replace(regex, value);
      }
    });
    return result;
  };

  const handleCreateFromTemplate = (template: Template) => {
    const content = template.content as any;
    const templateBody = content?.body || '';
    
    const variables: Record<string, string> = {};
    if (content?.variables) {
      content.variables.forEach((v: any) => {
        variables[v.key] = v.default || '';
      });
    }
    
    setEditingContract(null);
    setContractForm({
      name: `${template.name} - ${new Date().toLocaleDateString()}`,
      description: template.description,
      contract_type: content?.contract_type || template.template_type || 'SALES',
      category: content?.category || 'BUSINESS',
      content: templateBody,
      content_rendered: templateBody,
      template_id: template.id,
      first_party: '',
      second_party: '',
      currency: 'CNY',
      status: 'draft',
    });
    setContractVariables(variables);
    setShowContractDialog(true);
  };

  const handleAutoFillVariables = () => {
    const variables: Record<string, string> = {
      ...contractVariables,
      first_party: contractForm.first_party || '',
      second_party: contractForm.second_party || '',
      company_name: contractForm.first_party || '',
      employee_name: contractForm.second_party || '',
      amount: contractForm.amount?.toLocaleString() || '',
      currency: contractForm.currency || '',
      start_date: contractForm.start_date ? new Date(contractForm.start_date).toLocaleDateString() : '',
      end_date: contractForm.end_date ? new Date(contractForm.end_date).toLocaleDateString() : '',
      sign_date: contractForm.sign_date ? new Date(contractForm.sign_date).toLocaleDateString() : '',
      risk_level: contractForm.risk_level || '',
      description: contractForm.description || '',
    };
    
    const renderedContent = renderVariables(contractForm.content || '', variables);
    setContractForm({
      ...contractForm,
      content_rendered: renderedContent,
    });
    setShowPreview(true);
  };

  const handleVariableChange = (key: string, value: string) => {
    setContractVariables(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setContractForm({
      name: contract.name,
      description: contract.description,
      contract_type: contract.contract_type,
      category: contract.category,
      content: contract.content,
      content_rendered: contract.content_rendered,
      first_party: contract.first_party,
      second_party: contract.second_party,
      amount: contract.amount,
      currency: contract.currency,
      start_date: contract.start_date,
      end_date: contract.end_date,
      sign_date: contract.sign_date,
      project_id: contract.project_id,
      risk_level: contract.risk_level,
      status: contract.status,
    });
    setShowContractDialog(true);
  };

  const handleViewContract = (contract: Contract) => {
    setViewingContract(contract);
    setShowViewDialog(true);
  };

  const handleSaveContract = async () => {
    try {
      if (editingContract) {
        await contractService.updateContract(editingContract.id, contractForm as UpdateContract);
      } else {
        await contractService.createContract(contractForm);
      }
      setShowContractDialog(false);
      fetchContracts();
    } catch (error) {
      console.error('保存合同失败:', error);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('确定要删除该合同吗？')) return;
    try {
      await contractService.deleteContract(id);
      fetchContracts();
    } catch (error) {
      console.error('删除合同失败:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      draft: { label: '草稿', variant: 'secondary' },
      pending: { label: '待审批', variant: 'outline' },
      approved: { label: '已审批', variant: 'default' },
      rejected: { label: '已拒绝', variant: 'destructive' },
      signed: { label: '已签署', variant: 'default' },
      executing: { label: '执行中', variant: 'outline' },
      completed: { label: '已完成', variant: 'default' },
      terminated: { label: '已终止', variant: 'destructive' },
    };
    const s = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                合同管理
              </CardTitle>
              {activeTab === 'templates' ? (
                <Button onClick={handleCreateTemplate}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建模板
                </Button>
              ) : (
                <Button onClick={handleCreateContract}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建合同
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">管理合同模板和合同文档</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>{activeTab === 'templates' ? '合同模板' : '合同列表'}</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="templates">模板管理</TabsTrigger>
                  <TabsTrigger value="contracts">合同管理</TabsTrigger>
                </TabsList>

                <div className="flex flex-wrap gap-3 mb-4">
                  <select
                    className="h-10 px-3 border rounded-md"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {CONTRACT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-10 px-3 border rounded-md"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {CONTRACT_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {activeTab === 'contracts' && (
                    <select
                      className="h-10 px-3 border rounded-md"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                      <option value="ALL">全部状态</option>
                      {CONTRACT_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <TabsContent value="templates">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">加载中...</div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无合同模板
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {filteredTemplates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <h3 className="font-medium">{template.name}</h3>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {template.code} · v{template.version}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {template.description || '无描述'}
                                </p>
                                <div className="flex gap-2">
                                  <Badge variant="outline">{template.template_type}</Badge>
                                  <Badge variant="outline">合同</Badge>
                                  {template.is_system && <Badge>系统</Badge>}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleCreateFromTemplate(template)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                使用
                              </Button>
                              {!template.is_system && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditTemplate(template)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteTemplate(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="contracts">
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">加载中...</div>
                  ) : filteredContracts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无合同
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredContracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="border rounded-lg p-4 hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-5 w-5 text-success" />
                                <h3 className="font-medium">{contract.name}</h3>
                                {getStatusBadge(contract.status)}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {contract.code}
                              </div>
                              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                                <span>甲方: {contract.first_party}</span>
                                <span>乙方: {contract.second_party}</span>
                                {contract.amount && (
                                  <span>金额: {contract.amount.toLocaleString()} {contract.currency}</span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Badge variant="outline">{contract.contract_type}</Badge>
                                <Badge variant="outline">{contract.category}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewContract(contract)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditContract(contract)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContract(contract.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? '编辑合同模板' : '新建合同模板'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>编码</Label>
                    <Input
                      value={templateForm.code}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, code: e.target.value })
                      }
                      placeholder="如: SALES_CONTRACT"
                      disabled={!!editingTemplate}
                    />
                  </div>
                  <div>
                    <Label>版本</Label>
                    <Input
                      value={templateForm.version}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, version: e.target.value })
                      }
                      placeholder="1.0"
                    />
                  </div>
                </div>
                <div>
                  <Label>名称</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, name: e.target.value })
                    }
                    placeholder="如: 销售合同标准模板"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={templateForm.description}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, description: e.target.value })
                    }
                    placeholder="模板描述"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>类型</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={templateForm.contract_type}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, contract_type: e.target.value })
                      }
                    >
                      {CONTRACT_TYPES.filter((c) => c.value !== 'ALL').map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>分类</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={templateForm.category}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, category: e.target.value })
                      }
                    >
                      {CONTRACT_CATEGORIES.filter((c) => c.value !== 'ALL').map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <Label>内容（支持变量占位符，如 {`{first_party}`}）</Label>
                  <Textarea
                    value={templateForm.content}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, content: e.target.value })
                    }
                    placeholder="# 合同标题\n\n正文内容..."
                    rows={12}
                  />
                </div>
                <div>
                  <Label>变量定义（JSON数组）</Label>
                  <Textarea
                    value={templateForm.variables}
                    onChange={(e) =>
                      setTemplateForm({ ...templateForm, variables: e.target.value })
                    }
                    placeholder='["first_party", "second_party"]'
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>排序</Label>
                    <Input
                      type="number"
                      value={templateForm.sort_order}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          sort_order: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingContract ? '编辑合同' : '新建合同'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>合同名称</Label>
                    {!editingContract && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplateSelectorDialog(true)}
                        className="h-8 text-xs"
                      >
                        <Wand2 className="h-3 w-3 mr-1" />
                        从模板创建
                      </Button>
                    )}
                  </div>
                  <Input
                    value={contractForm.name}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, name: e.target.value })
                    }
                    placeholder="请输入合同名称"
                  />
                </div>
                <div>
                  <Label>描述</Label>
                  <Input
                    value={contractForm.description}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, description: e.target.value })
                    }
                    placeholder="合同描述"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>类型</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={contractForm.contract_type}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, contract_type: e.target.value })
                      }
                    >
                      {CONTRACT_TYPES.filter((c) => c.value !== 'ALL').map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>分类</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={contractForm.category}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, category: e.target.value })
                      }
                    >
                      {CONTRACT_CATEGORIES.filter((c) => c.value !== 'ALL').map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>状态</Label>
                    <select
                      className="w-full h-10 px-3 border rounded-md"
                      value={contractForm.status}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, status: e.target.value })
                      }
                    >
                      {CONTRACT_STATUS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>甲方</Label>
                    <Input
                      value={contractForm.first_party}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, first_party: e.target.value })
                      }
                      placeholder="甲方名称"
                    />
                  </div>
                  <div>
                    <Label>乙方</Label>
                    <Input
                      value={contractForm.second_party}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, second_party: e.target.value })
                      }
                      placeholder="乙方名称"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>金额</Label>
                    <Input
                      type="number"
                      value={contractForm.amount || ''}
                      onChange={(e) =>
                        setContractForm({
                          ...contractForm,
                          amount: e.target.value ? parseFloat(e.target.value) : undefined,
                        })
                      }
                      placeholder="合同金额"
                    />
                  </div>
                  <div>
                    <Label>币种</Label>
                    <Input
                      value={contractForm.currency}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, currency: e.target.value })
                      }
                      placeholder="CNY"
                    />
                  </div>
                  <div>
                    <Label>风险等级</Label>
                    <Input
                      value={contractForm.risk_level || ''}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, risk_level: e.target.value })
                      }
                      placeholder="低/中/高"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>开始日期</Label>
                    <Input
                      type="date"
                      value={contractForm.start_date?.split('T')[0] || ''}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>结束日期</Label>
                    <Input
                      type="date"
                      value={contractForm.end_date?.split('T')[0] || ''}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, end_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>签署日期</Label>
                    <Input
                      type="date"
                      value={contractForm.sign_date?.split('T')[0] || ''}
                      onChange={(e) =>
                        setContractForm({ ...contractForm, sign_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>合同内容</Label>
                  <Textarea
                    value={contractForm.content || ''}
                    onChange={(e) =>
                      setContractForm({ ...contractForm, content: e.target.value })
                    }
                    placeholder="# 合同内容"
                    rows={10}
                  />
                </div>
                
                {showPreview && contractForm.content_rendered && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">预览效果</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(false)}
                        className="h-6 text-xs"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-4 rounded border max-h-48 overflow-y-auto">
                      {contractForm.content_rendered}
                    </pre>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowContractDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
                <Button
                  variant="outline"
                  onClick={handleAutoFillVariables}
                  disabled={!contractForm.content}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  预览合同
                </Button>
                <Button onClick={handleSaveContract}>
                  <Save className="h-4 w-4 mr-2" />
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showTemplateSelectorDialog} onOpenChange={setShowTemplateSelectorDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>选择合同模板</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">加载中...</div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无合同模板
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    {templates.map((template) => {
                      const content = template.content as any;
                      return (
                        <Card
                          key={template.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            handleCreateFromTemplate(template);
                            setShowTemplateSelectorDialog(false);
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <h3 className="font-medium">{template.name}</h3>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  {template.code} · v{template.version}
                                </div>
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                  {template.description || '无描述'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">{content?.contract_type || template.template_type}</Badge>
                                  <Badge variant="outline">{content?.category || '合同'}</Badge>
                                  {template.is_system && <Badge>系统</Badge>}
                                </div>
                                {content?.variables && content.variables.length > 0 && (
                                  <div className="mt-3 text-xs text-muted-foreground">
                                    <span className="font-medium">变量：</span>
                                    {content.variables.slice(0, 3).map((v: any) => v.label).join(', ')}
                                    {content.variables.length > 3 && `...等${content.variables.length}个`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTemplateSelectorDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  取消
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{viewingContract?.name}</DialogTitle>
              </DialogHeader>
              {viewingContract && (
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">合同编号</Label>
                      <div className="font-medium">{viewingContract.code}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">状态</Label>
                      <div>{getStatusBadge(viewingContract.status)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">甲方</Label>
                      <div className="font-medium">{viewingContract.first_party}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">乙方</Label>
                      <div className="font-medium">{viewingContract.second_party}</div>
                    </div>
                  </div>
                  {viewingContract.amount && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">合同金额</Label>
                        <div className="font-medium">
                          {viewingContract.amount.toLocaleString()} {viewingContract.currency}
                        </div>
                      </div>
                      {viewingContract.risk_level && (
                        <div>
                          <Label className="text-sm text-muted-foreground">风险等级</Label>
                          <div className="font-medium">{viewingContract.risk_level}</div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    {viewingContract.start_date && (
                      <div>
                        <Label className="text-sm text-muted-foreground">开始日期</Label>
                        <div className="font-medium">
                          {new Date(viewingContract.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {viewingContract.end_date && (
                      <div>
                        <Label className="text-sm text-muted-foreground">结束日期</Label>
                        <div className="font-medium">
                          {new Date(viewingContract.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {viewingContract.sign_date && (
                      <div>
                        <Label className="text-sm text-muted-foreground">签署日期</Label>
                        <div className="font-medium">
                          {new Date(viewingContract.sign_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                  {viewingContract.content_rendered && (
                    <div>
                      <Label className="text-sm text-muted-foreground">合同内容</Label>
                      <div className="mt-2 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {viewingContract.content_rendered}
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-4">
                    创建时间: {new Date(viewingContract.created_at).toLocaleString()}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  关闭
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default ContractManagement;
