import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArrowRight, HelpCircle, Settings, Workflow as WorkflowIcon, Building2, Users, BookOpen, Download, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { organizationApi, departmentApi } from '@/services/organization';
import { workflowApi, Workflow as WorkflowType } from '@/services/workflow';
import { Department, Position, ApprovalRule } from '@/services/organization';

interface ConfigOverview {
  workflows: WorkflowType[];
  systemWorkflows: number;
  customWorkflows: number;
  approvalRules: ApprovalRule[];
  departments: Department[];
  positions: Position[];
}

export default function ConfigurationCenter() {
  const [config, setConfig] = useState<ConfigOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [workflows, deptResult, positions, rules] = await Promise.all([
        workflowApi.getWorkflows(),
        departmentApi.getDepartments(1, 100),
        organizationApi.getPositions(),
        organizationApi.getApprovalRules(),
      ]);
      
      setConfig({
        workflows: workflows.data || [],
        systemWorkflows: (workflows.data || []).filter(w => w.is_system).length,
        customWorkflows: (workflows.data || []).filter(w => !w.is_system).length,
        approvalRules: rules,
        departments: deptResult.data || [],
        positions: positions,
      });
    } catch (error) {
      console.error('获取配置数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!config) return;
    const exportData = {
      exportTime: new Date().toISOString(),
      workflows: config.workflows,
      approvalRules: config.approvalRules,
      departments: config.departments,
      positions: config.positions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const _data = JSON.parse(event.target?.result as string);
        alert('配置数据导入成功！请注意：此功能目前仅支持数据预览，实际导入需要后端支持。');
      } catch (error) {
        alert('导入失败，请确保文件是有效的JSON格式。');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据配置中心</h1>
          <p className="text-muted-foreground mt-1">统一管理系统配置数据，查看配置概览</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
          <Button 
            onClick={() => document.getElementById('import-file')?.click()} 
            variant="outline"
          >
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button onClick={fetchConfig} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-primary/10">
                <WorkflowIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">工作流总数</p>
                <p className="text-2xl font-bold">{config?.workflows.length || 0}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="text-xs">系统工作流: {config?.systemWorkflows}</Badge>
              <Badge variant="outline" className="text-xs">自定义: {config?.customWorkflows}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-success/10">
                <BookOpen className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">审批规则</p>
                <p className="text-2xl font-bold">{config?.approvalRules.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-info/20 bg-info/5">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-info/10">
                <Building2 className="h-6 w-6 text-info" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">部门数量</p>
                <p className="text-2xl font-bold">{config?.departments.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-warning/10">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">职位数量</p>
                <p className="text-2xl font-bold">{config?.positions.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <WorkflowIcon className="h-5 w-5 mr-2" />
                  工作流配置
                </CardTitle>
                <CardDescription>查看和管理工作流定义</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/workflow-settings">
                  管理 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config?.workflows.slice(0, 5).map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center">
                    {workflow.is_system && (
                      <Badge variant="secondary" className="mr-2 text-xs">系统</Badge>
                    )}
                    <span className="font-medium">{workflow.name}</span>
                  </div>
                  <Badge variant={workflow.is_active ? 'default' : 'destructive'} className="text-xs">
                    {workflow.is_active ? '启用' : '禁用'}
                  </Badge>
                </div>
              ))}
              {config?.workflows.length === 0 && (
                <p className="text-muted-foreground text-center py-8">暂无工作流</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  组织架构
                </CardTitle>
                <CardDescription>查看部门和职位配置</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/organization?tab=rules">
                  管理 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config?.departments.slice(0, 5).map((dept) => (
                <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-medium">{dept.name}</span>
                  <Badge variant={dept.is_active ? 'default' : 'destructive'} className="text-xs">
                    {dept.is_active ? '启用' : '禁用'}
                  </Badge>
                </div>
              ))}
              {config?.departments.length === 0 && (
                <p className="text-muted-foreground text-center py-8">暂无部门</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  审批规则
                </CardTitle>
                <CardDescription>配置审批类型和模式</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/organization">
                  管理 <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config?.approvalRules.slice(0, 5).map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center">
                    <span className="font-medium">{rule.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{rule.approval_mode}</Badge>
                  </div>
                  <Badge variant={rule.is_active ? 'default' : 'destructive'} className="text-xs">
                    {rule.is_active ? '启用' : '禁用'}
                  </Badge>
                </div>
              ))}
              {config?.approvalRules.length === 0 && (
                <p className="text-muted-foreground text-center py-8">暂无审批规则</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="h-5 w-5 mr-2 text-amber-500" />
              配置说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start">
                <span className="font-medium text-foreground mr-2">1.</span>
                <p><strong>工作流</strong>：定义审批流程的步骤和流转规则，分为系统工作流（不可删除）和自定义工作流（可自由创建）</p>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-foreground mr-2">2.</span>
                <p><strong>审批规则</strong>：配置每个审批步骤的审批人分配方式、审批模式（任意/全部/多数）</p>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-foreground mr-2">3.</span>
                <p><strong>组织架构</strong>：管理部门层级、职位和职位级别，用于审批人自动分配</p>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-foreground mr-2">4.</span>
                <p><strong>字典配置</strong>：管理系统枚举值（如状态码），当前暂未配置</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}