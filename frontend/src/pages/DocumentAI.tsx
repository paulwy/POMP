import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  MessageSquare,
  Chain,
  Play,
  Save,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  FolderOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/Tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { templateService, Template, TEMPLATE_CATEGORIES, getCategoryLabel } from '@/services/templates';

interface PromptTemplate {
  id: string;
  name: string;
  code: string;
  content: string;
  variables: { name: string; type: string; default?: string }[];
  category: string;
}

interface ChainStep {
  templateId: string;
  template: Template | null;
  variables: Record<string, string>;
}

const AIAssistant: React.FC = () => {
  const [prompts, setPrompts] = useState<Template[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Template | null>(null);
  const [chainSteps, setChainSteps] = useState<ChainStep[]>([]);
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChainDialog, setShowChainDialog] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Template | null>(null);

  const [promptForm, setPromptForm] = useState({
    name: '',
    code: '',
    description: '',
    content: '',
    variables: '[]',
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const data = await templateService.getTemplates({ category: 'AI助手' });
      setPrompts(data.map(t => t.template));
    } catch (error) {
      console.error('加载提示词模板失败:', error);
    }
  };

  const handleCreatePrompt = async () => {
    if (!promptForm.name || !promptForm.code) {
      toast.error('请填写名称和编码');
      return;
    }

    try {
      let variables: any[];
      try {
        variables = promptForm.variables.trim() ? JSON.parse(promptForm.variables) : [];
      } catch {
        toast.error('变量格式错误');
        return;
      }

      await templateService.createTemplate({
        code: promptForm.code,
        name: promptForm.name,
        description: promptForm.description || undefined,
        category: 'AI助手',
        template_type: 'ai_prompt',
        content: {
          prompt: promptForm.content,
          variables,
        },
        tags: ['AI', 'prompt'],
        is_active: true,
        is_default: false,
      });

      toast.success('提示词模板创建成功');
      setShowCreateDialog(false);
      resetForm();
      loadPrompts();
    } catch (error) {
      toast.error('创建失败');
      console.error(error);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('确定要删除此模板吗？')) return;
    try {
      await templateService.deleteTemplate(id);
      toast.success('删除成功');
      loadPrompts();
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleCopyPrompt = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('已复制到剪贴板');
  };

  const handleAddToChain = (template: Template) => {
    const newStep: ChainStep = {
      templateId: template.id,
      template,
      variables: {},
    };
    setChainSteps([...chainSteps, newStep]);
    toast.success(`已添加: ${template.name}`);
  };

  const handleRemoveFromChain = (index: number) => {
    const newSteps = chainSteps.filter((_, i) => i !== index);
    setChainSteps(newSteps);
  };

  const handleUpdateStepVariables = (index: number, variables: Record<string, string>) => {
    const newSteps = [...chainSteps];
    newSteps[index].variables = variables;
    setChainSteps(newSteps);
  };

  const handleExecuteChain = async () => {
    if (chainSteps.length === 0) {
      toast.error('请先添加提示词到链式调用');
      return;
    }

    setIsGenerating(true);
    try {
      let result = '';
      for (const step of chainSteps) {
        if (!step.template) continue;
        
        const content = step.template.content as { prompt: string; variables?: { name: string }[] };
        let prompt = content.prompt || '';
        
        // 替换变量
        const variables = step.variables;
        Object.entries(variables).forEach(([key, value]) => {
          prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        result += `=== ${step.template.name} ===\n${prompt}\n\n`;
      }

      setOutput(result);
      toast.success('链式调用完成');
    } catch (error) {
      toast.error('执行失败');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveChainAsTemplate = async () => {
    if (chainSteps.length === 0) {
      toast.error('请先构建链式调用');
      return;
    }

    const chainName = `链式调用_${Date.now()}`;
    const chainCode = `chain_${Date.now()}`;
    
    const chainContent = {
      steps: chainSteps.map(step => ({
        template_id: step.templateId,
        template_name: step.template?.name,
        variables: step.variables,
      })),
    };

    try {
      await templateService.createTemplate({
        code: chainCode,
        name: chainName,
        description: '链式调用模板',
        category: 'AI助手',
        template_type: 'ai_optimize',
        content: chainContent,
        tags: ['AI', 'chain', 'prompt'],
        is_active: true,
        is_default: false,
      });
      toast.success('链式调用模板已保存');
    } catch (error) {
      toast.error('保存失败');
    }
  };

  const resetForm = () => {
    setPromptForm({
      name: '',
      code: '',
      description: '',
      content: '',
      variables: '[]',
    });
    setEditingPrompt(null);
  };

  const openCreateDialog = (template?: Template) => {
    if (template) {
      setEditingPrompt(template);
      const content = template.content as { prompt: string; variables?: any[] };
      setPromptForm({
        name: template.name,
        code: template.code,
        description: template.description || '',
        content: content.prompt || '',
        variables: JSON.stringify(content.variables || [], null, 2),
      });
    } else {
      resetForm();
    }
    setShowCreateDialog(true);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  AI 文档助手
                </h1>
                <p className="text-muted-foreground mt-1">管理提示词模板和链式调用</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setChainSteps([]);
                    setOutput('');
                    setShowChainDialog(true);
                  }}
                >
                  <Chain className="h-4 w-4 mr-2" />
                  新建链式调用
                </Button>
                <Button onClick={() => openCreateDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  新建提示词
                </Button>
              </div>
            </div>

            <Tabs defaultValue="prompts" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="prompts">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  提示词模板
                </TabsTrigger>
                <TabsTrigger value="chain">
                  <Chain className="h-4 w-4 mr-2" />
                  链式调用
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prompts">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prompts.length === 0 ? (
                    <Card className="col-span-3">
                      <CardContent className="p-12 text-center text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>暂无提示词模板</p>
                        <p className="text-sm">点击右上角按钮创建</p>
                      </CardContent>
                    </Card>
                  ) : (
                    prompts.map((prompt) => (
                      <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                <h3 className="font-medium">{prompt.name}</h3>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {prompt.code}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleAddToChain(prompt)}>
                                  <Chain className="h-4 w-4 mr-2" />
                                  添加到链式调用
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openCreateDialog(prompt)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyPrompt(prompt.content as string, prompt.id)}
                                >
                                  {copiedId === prompt.id ? (
                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4 mr-2" />
                                  )}
                                  复制内容
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeletePrompt(prompt.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {prompt.description || '无描述'}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline">{getCategoryLabel(prompt.category)}</Badge>
                            <Badge variant="outline">{prompt.template_type}</Badge>
                            {prompt.is_default && (
                              <Badge className="bg-blue-100 text-blue-800">默认</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => setSelectedPrompt(prompt)}
                          >
                            <FolderOpen className="h-4 w-4 mr-2" />
                            查看详情
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="chain">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Chain className="h-5 w-5" />
                      链式调用构建器
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chainSteps.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Chain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>暂无链式调用步骤</p>
                        <p className="text-sm">从左侧提示词模板中选择添加</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chainSteps.map((step, index) => (
                          <div
                            key={`${step.templateId}-${index}`}
                            className="border rounded-lg p-4 bg-muted/50"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-primary">{index + 1}</Badge>
                                <span className="font-medium">
                                  {step.template?.name || '未知模板'}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFromChain(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            {step.template && (
                              <div className="space-y-2">
                                <Textarea
                                  value={step.template.content as string}
                                  readOnly
                                  className="bg-background"
                                  rows={4}
                                />
                                {(step.template.content as { variables?: { name: string }[] })
                                  ?.variables?.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>变量值</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      {(step.template.content as {
                                        variables?: { name: string; type: string; default?: string }[];
                                      }).variables?.map((varItem) => (
                                        <div key={varItem.name}>
                                          <Label className="text-xs">
                                            {varItem.name} ({varItem.type})
                                          </Label>
                                          <Input
                                            value={step.variables[varItem.name] || varItem.default || ''}
                                            onChange={(e) => {
                                              const newVariables = {
                                                ...step.variables,
                                                [varItem.name]: e.target.value,
                                              };
                                              handleUpdateStepVariables(index, newVariables);
                                            }}
                                            placeholder={`输入 ${varItem.name}`}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {index < chainSteps.length - 1 && (
                              <div className="flex justify-center mt-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <div className="w-1 h-1 rounded-full bg-primary"></div>
                                  <span className="text-sm">→</span>
                                  <div className="w-1 h-1 rounded-full bg-primary"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="flex gap-3 pt-4">
                          <Button
                            variant="outline"
                            onClick={handleSaveChainAsTemplate}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            保存为模板
                          </Button>
                          <Button onClick={handleExecuteChain} disabled={isGenerating}>
                            <Play className="h-4 w-4 mr-2" />
                            {isGenerating ? '执行中...' : '执行链式调用'}
                          </Button>
                        </div>
                        {output && (
                          <div className="mt-6">
                            <Label>输出结果</Label>
                            <Textarea
                              value={output}
                              readOnly
                              className="bg-background mt-2"
                              rows={8}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {selectedPrompt && (
        <Dialog open={!!selectedPrompt} onOpenChange={() => setSelectedPrompt(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPrompt.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">编码</Label>
                  <p className="font-mono text-sm">{selectedPrompt.code}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">类型</Label>
                  <p>{selectedPrompt.template_type}</p>
                </div>
              </div>
              {selectedPrompt.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">描述</Label>
                  <p>{selectedPrompt.description}</p>
                </div>
              )}
              <div>
                <Label className="text-sm text-muted-foreground">内容</Label>
                <Textarea
                  value={JSON.stringify(selectedPrompt.content, null, 2)}
                  readOnly
                  className="bg-background mt-2 font-mono text-sm"
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedPrompt(null)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? '编辑提示词' : '新建提示词'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>名称 *</Label>
                <Input
                  value={promptForm.name}
                  onChange={(e) => setPromptForm({ ...promptForm, name: e.target.value })}
                  placeholder="提示词名称"
                />
              </div>
              <div>
                <Label>编码 *</Label>
                <Input
                  value={promptForm.code}
                  onChange={(e) => setPromptForm({ ...promptForm, code: e.target.value.toLowerCase() })}
                  placeholder="prompt_code"
                  disabled={!!editingPrompt}
                />
              </div>
            </div>
            <div>
              <Label>描述</Label>
              <Input
                value={promptForm.description}
                onChange={(e) => setPromptForm({ ...promptForm, description: e.target.value })}
                placeholder="提示词描述"
              />
            </div>
            <div>
              <Label>提示词内容</Label>
              <Textarea
                value={promptForm.content}
                onChange={(e) => setPromptForm({ ...promptForm, content: e.target.value })}
                placeholder="输入提示词内容，支持变量 {variable_name}"
                rows={6}
              />
            </div>
            <div>
              <Label>变量定义（JSON数组）</Label>
              <Textarea
                value={promptForm.variables}
                onChange={(e) => setPromptForm({ ...promptForm, variables: e.target.value })}
                placeholder='[{"name": "topic", "type": "string", "default": ""}]'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
            <Button onClick={handleCreatePrompt}>
              <Save className="h-4 w-4 mr-2" />
              {editingPrompt ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChainDialog} onOpenChange={setShowChainDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>新建链式调用</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>提示词模板</Label>
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <Button
                      key={prompt.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        handleAddToChain(prompt);
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {prompt.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>已添加的步骤 ({chainSteps.length})</Label>
                <div className="space-y-2">
                  {chainSteps.length === 0 ? (
                    <p className="text-muted-foreground text-sm">点击左侧添加步骤</p>
                  ) : (
                    chainSteps.map((step, index) => (
                      <div
                        key={`${step.templateId}-${index}`}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">
                          {index + 1}. {step.template?.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromChain(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChainDialog(false)}>取消</Button>
            <Button
              onClick={() => {
                setShowChainDialog(false);
                handleExecuteChain();
              }}
              disabled={chainSteps.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import { MoreHorizontal } from 'lucide-react';

export default AIAssistant;
