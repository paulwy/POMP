import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2,
  Users,
  User,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Layout,
  Shield,
  GitBranch,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Save,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import HelpTooltip from '@/components/HelpTooltip';
import {
  organizationApi,
  departmentApi,
  PositionLevel,
  Position,
  ApprovalRule,
  Department,
  CreatePositionLevelRequest,
  CreatePositionRequest,
  CreateApprovalRuleRequest,
  CreateDepartmentRequest,
  POSITION_LEVEL_TEMPLATES,
  POSITION_TEMPLATES,
  DEPARTMENT_TEMPLATES,
  APPROVAL_RULE_TEMPLATES,
  RULE_TYPES,
  APPROVAL_MODES,
} from '@/services/organization';
import { hrApi, Employee } from '@/services/hr';
import { AIAssistant } from '@/components/AIAssistant';
import { toast } from 'sonner';
import { templateService } from '@/services/templates';

const OrganizationManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'departments';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [positionLevels, setPositionLevels] = useState<PositionLevel[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [approvalRules, setApprovalRules] = useState<ApprovalRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [showPositionLevelDialog, setShowPositionLevelDialog] = useState(false);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [showApprovalRuleDialog, setShowApprovalRuleDialog] = useState(false);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);

  const [editingLevel, setEditingLevel] = useState<PositionLevel | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const [deptTemplates, setDeptTemplates] = useState<{ id: string; name: string; code: string; description: string; sort_order: number }[]>([]);
  const [levelTemplates, setLevelTemplates] = useState<{ id: string; name: string; code: string; level_order: number; description: string }[]>([]);
  const [positionTemplates, setPositionTemplates] = useState<{ id: string; title: string; code: string; description: string; is_leader: boolean }[]>([]);
  const [ruleTemplates, setRuleTemplates] = useState<{ id: string; name: string; code: string; rule_type: string; approval_mode: string; min_approvers: number; workflow_type: string; condition_expression: string }[]>([]);

  const [positionLevelForm, setPositionLevelForm] = useState<CreatePositionLevelRequest>({
    code: '',
    name: '',
    level_order: 1,
    description: '',
  });

  const [positionForm, setPositionForm] = useState<CreatePositionRequest>({
    title: '',
    code: '',
    position_level_id: '',
    department_id: '',
    description: '',
    is_leader: false,
    sort_order: 0,
  });

  const [approvalRuleForm, setApprovalRuleForm] = useState<CreateApprovalRuleRequest>({
    name: '',
    workflow_type: '',
    node_order: 1,
    rule_type: 'any_approver',
    min_approvers: 1,
    approval_mode: 'any',
    condition_expression: '',
  });

  const [departmentForm, setDepartmentForm] = useState<CreateDepartmentRequest>({
    name: '',
    code: '',
    description: '',
    sort_order: 0,
    parent_id: '',
    manager_id: '',
  });

  const [selectedDeptTemplate, setSelectedDeptTemplate] = useState('');
  const [selectedLevelTemplate, setSelectedLevelTemplate] = useState('');
  const [selectedPositionTemplate, setSelectedPositionTemplate] = useState('');
  const [selectedRuleTemplate, setSelectedRuleTemplate] = useState('');

  const [showSaveAsTemplateDialog, setShowSaveAsTemplateDialog] = useState(false);
  const [saveAsTemplateType, setSaveAsTemplateType] = useState<'department' | 'position' | 'position_level' | 'approval_rule'>('department');
  const [saveAsTemplateName, setSaveAsTemplateName] = useState('');
  const [saveAsTemplateCode, setSaveAsTemplateCode] = useState('');
  const [saveAsTemplateDescription, setSaveAsTemplateDescription] = useState('');
  const [saveAsTemplateTags, setSaveAsTemplateTags] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [levels, pos, rules, deptResult, employeesData] = await Promise.all([
        organizationApi.getPositionLevels(),
        organizationApi.getPositions(),
        organizationApi.getApprovalRules(),
        departmentApi.getDepartments(1, 100),
        hrApi.getEmployees(1, 100),
      ]);

      setPositionLevels(Array.isArray(levels) ? levels : []);
      setPositions(Array.isArray(pos) ? pos : []);
      setApprovalRules(Array.isArray(rules) ? rules : []);
      setDepartments(deptResult.data || []);
      setEmployees(employeesData.data || []);
    } catch (error) {
      console.error('获取组织架构数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      let deptTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'department' });
      let levelTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'position_level' });
      let positionTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'position' });
      let ruleTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'approval_rule' });

      // 如果职级模板为空，初始化默认模板
      if (levelTemplatesData.length === 0) {
        try {
          await templateService.initDefaults();
          // 重新获取模板
          levelTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'position_level' });
          deptTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'department' });
          positionTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'position' });
          ruleTemplatesData = await templateService.getTemplates({ category: '组织架构', template_type: 'approval_rule' });
        } catch (initError) {
          console.error('初始化默认模板失败:', initError);
        }
      }

      setDeptTemplates(deptTemplatesData.map(t => ({
        id: t.template.id,
        name: t.template.content.name || t.template.name,
        code: t.template.content.code || t.template.code,
        description: t.template.content.description || t.template.description || '',
        sort_order: t.template.sort_order,
      })));

      setLevelTemplates(levelTemplatesData.map(t => ({
        id: t.template.id,
        name: t.template.content.name || t.template.name,
        code: t.template.content.code || t.template.code,
        level_order: t.template.content.level_order || 1,
        description: t.template.content.description || t.template.description || '',
      })));

      setPositionTemplates(positionTemplatesData.map(t => ({
        id: t.template.id,
        title: t.template.content.name || t.template.name,
        code: t.template.content.code || t.template.code,
        description: t.template.content.description || t.template.description || '',
        is_leader: t.template.content.is_leader || false,
      })));

      setRuleTemplates(ruleTemplatesData.map(t => ({
        id: t.template.id,
        name: t.template.content.name || t.template.name,
        code: t.template.content.code || t.template.code,
        rule_type: t.template.content.rule_type || 'any_approver',
        approval_mode: t.template.content.approval_mode || 'any',
        min_approvers: t.template.content.min_approvers || 1,
        workflow_type: t.template.content.workflow_type || '',
        condition_expression: t.template.content.condition_expression || '',
      })));
    } catch (error) {
      console.error('获取模板数据失败:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // 智能代码生成 - 中文到英文的映射
  const generateCode = (name: string): string => {
    // 中文到英文的关键词映射
    const keywordMap: Record<string, string> = {
      '经理': 'manager',
      '主管': 'supervisor',
      '总监': 'director',
      '助理': 'assistant',
      '专员': 'specialist',
      '出纳': 'cashier',
      '会计': 'accountant',
      '财务': 'finance',
      '销售': 'sales',
      '市场': 'marketing',
      '研发': 'rd',
      '技术': 'tech',
      '工程师': 'engineer',
      '产品': 'product',
      '运营': 'operation',
      '行政': 'admin',
      '人事': 'hr',
      '客服': 'support',
      '采购': 'purchase',
      '仓库': 'warehouse',
      '生产': 'production',
      '质量': 'quality',
      '项目': 'project',
      '总': 'general',
      '副': 'deputy',
      '高级': 'senior',
      '资深': 'senior',
      '初级': 'junior',
      '首席': 'chief',
      '部门': 'department',
      '员工': 'employee',
      '职位': 'position',
      '公司': 'company',
      '企业': 'enterprise',
      '集团': 'group',
    };

    let result = name;
    
    // 替换中文关键词为英文
    for (const [zh, en] of Object.entries(keywordMap)) {
      result = result.replace(new RegExp(zh, 'g'), en);
    }

    // 如果结果仍然包含中文字符，使用拼音转换作为备选
    const hasChinese = /[\u4e00-\u9fa5]/.test(result);
    if (hasChinese) {
      // 简单的拼音转换（实际项目中会使用专业的拼音库）
      const pinyinMap: Record<string, string> = {
        '出': 'chu',
        '纳': 'na',
        '财': 'cai',
        '务': 'wu',
        '经': 'jing',
        '理': 'li',
        '主': 'zhu',
        '管': 'guan',
        '总': 'zong',
        '监': 'jian',
        '助': 'zhu',
        '专': 'zhuan',
        '会': 'hui',
        '计': 'ji',
        '销': 'xiao',
        '售': 'shou',
        '市': 'shi',
        '场': 'chang',
        '研': 'yan',
        '发': 'fa',
        '技': 'ji',
        '术': 'shu',
        '工': 'gong',
        '程': 'cheng',
        '师': 'shi',
        '产': 'chan',
        '品': 'pin',
        '运': 'yun',
        '营': 'ying',
        '行': 'xing',
        '政': 'zheng',
        '人': 'ren',
        '事': 'shi',
        '客': 'ke',
        '服': 'fu',
        '采': 'cai',
        '购': 'gou',
        '仓': 'cang',
        '库': 'ku',
        '生': 'sheng',
        '质': 'zhi',
        '量': 'liang',
        '项': 'xiang',
        '目': 'mu',
        '副': 'fu',
        '高': 'gao',
        '级': 'ji',
        '资': 'zi',
        '深': 'shen',
        '初': 'chu',
        '首': 'shou',
        '席': 'xi',
        '部': 'bu',
        '门': 'men',
        '公': 'gong',
        '司': 'si',
        '企': 'qi',
        '业': 'ye',
        '集': 'ji',
        '团': 'tuan',
      };

      let pinyinResult = '';
      for (const char of result) {
        if (pinyinMap[char]) {
          pinyinResult += pinyinMap[char];
        } else if (/[\u4e00-\u9fa5]/.test(char)) {
          pinyinResult += char.charCodeAt(0).toString(36);
        } else {
          pinyinResult += char;
        }
      }
      result = pinyinResult;
    }

    // 转换为下划线命名
    return result
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const generateLevelCode = (name: string) => generateCode(name);
  const generatePositionCode = (name: string) => generateCode(name);
  const generateDepartmentCode = (name: string) => generateCode(name);

  // 检查重复
  const checkCodeDuplicate = (code: string, type: 'level' | 'position' | 'department' | 'rule'): boolean => {
    switch (type) {
      case 'level':
        return positionLevels.some(l => l.code === code);
      case 'position':
        return positions.some(p => p.code === code);
      case 'department':
        return departments.some(d => d.code === code);
      case 'rule':
        return approvalRules.some(r => r.name === code);
      default:
        return false;
    }
  };

  // 搜索过滤
  const filteredPositionLevels = useMemo(() => {
    if (!searchQuery) return positionLevels;
    const query = searchQuery.toLowerCase();
    return positionLevels.filter(level =>
      level.name.toLowerCase().includes(query) ||
      level.code.toLowerCase().includes(query)
    );
  }, [positionLevels, searchQuery]);

  const filteredPositions = useMemo(() => {
    if (!searchQuery) return positions;
    const query = searchQuery.toLowerCase();
    return positions.filter(pos =>
      pos.name.toLowerCase().includes(query) ||
      pos.code.toLowerCase().includes(query)
    );
  }, [positions, searchQuery]);

  const filteredDepartments = useMemo(() => {
    if (!searchQuery) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter(dept =>
      dept.name.toLowerCase().includes(query) ||
      dept.code.toLowerCase().includes(query)
    );
  }, [departments, searchQuery]);

  const filteredApprovalRules = useMemo(() => {
    if (!searchQuery) return approvalRules;
    const query = searchQuery.toLowerCase();
    return approvalRules.filter(rule =>
      rule.name.toLowerCase().includes(query) ||
      rule.rule_type.toLowerCase().includes(query)
    );
  }, [approvalRules, searchQuery]);

  const handleCreatePositionLevel = async () => {
    if (!positionLevelForm.name || !positionLevelForm.code) {
      toast.error('请填写必填字段');
      return;
    }
    try {
      await organizationApi.createPositionLevel(positionLevelForm);
      toast.success('职位级别创建成功');
      setShowPositionLevelDialog(false);
      resetLevelForm();
      fetchData();
    } catch (error) {
      console.error('创建职位级别失败:', error);
      toast.error('创建职位级别失败');
    }
  };

  const handleUpdatePositionLevel = async () => {
    if (!editingLevel) return;
    try {
      await organizationApi.updatePositionLevel(editingLevel.id, {
        name: positionLevelForm.name,
        description: positionLevelForm.description,
        level_order: positionLevelForm.level_order,
      });
      toast.success('职位级别更新成功');
      setShowPositionLevelDialog(false);
      setEditingLevel(null);
      resetLevelForm();
      fetchData();
    } catch (error) {
      console.error('更新职位级别失败:', error);
      toast.error('更新职位级别失败');
    }
  };

  const handleDeletePositionLevel = async (level: PositionLevel) => {
    if (!confirm(`确定要删除职位级别"${level.name}"吗？`)) return;
    try {
      await organizationApi.deletePositionLevel(level.id);
      toast.success('职位级别删除成功');
      fetchData();
    } catch (error) {
      console.error('删除职位级别失败:', error);
      toast.error('删除职位级别失败');
    }
  };

  const handleCreatePosition = async () => {
    if (!positionForm.title || !positionForm.code) {
      toast.error('请填写必填字段');
      return;
    }
    try {
      await organizationApi.createPosition(positionForm);
      toast.success('职位创建成功');
      setShowPositionDialog(false);
      resetPositionForm();
      fetchData();
    } catch (error) {
      console.error('创建职位失败:', error);
      toast.error('创建职位失败');
    }
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition) return;
    try {
      await organizationApi.updatePosition(editingPosition.id, {
        title: positionForm.title,
        position_level_id: positionForm.position_level_id,
        description: positionForm.description,
        is_leader: positionForm.is_leader,
        sort_order: positionForm.sort_order,
      });
      toast.success('职位更新成功');
      setShowPositionDialog(false);
      setEditingPosition(null);
      resetPositionForm();
      fetchData();
    } catch (error) {
      console.error('更新职位失败:', error);
      toast.error('更新职位失败');
    }
  };

  const handleDeletePosition = async (pos: Position) => {
    if (!confirm(`确定要删除职位"${pos.name}"吗？`)) return;
    try {
      await organizationApi.deletePosition(pos.id);
      toast.success('职位删除成功');
      fetchData();
    } catch (error) {
      console.error('删除职位失败:', error);
      toast.error('删除职位失败');
    }
  };

  const handleCreateApprovalRule = async () => {
    if (!approvalRuleForm.name) {
      toast.error('请填写必填字段');
      return;
    }
    try {
      await organizationApi.createApprovalRule(approvalRuleForm);
      toast.success('审批规则创建成功');
      setShowApprovalRuleDialog(false);
      resetRuleForm();
      fetchData();
    } catch (error) {
      console.error('创建审批规则失败:', error);
      toast.error('创建审批规则失败');
    }
  };

  const handleUpdateApprovalRule = async () => {
    if (!editingRule) return;
    try {
      await organizationApi.updateApprovalRule(editingRule.id, {
        name: approvalRuleForm.name,
        workflow_type: approvalRuleForm.workflow_type,
        rule_type: approvalRuleForm.rule_type,
        min_approvers: approvalRuleForm.min_approvers,
        approval_mode: approvalRuleForm.approval_mode,
        condition_expression: approvalRuleForm.condition_expression,
      });
      toast.success('审批规则更新成功');
      setShowApprovalRuleDialog(false);
      setEditingRule(null);
      resetRuleForm();
      fetchData();
    } catch (error) {
      console.error('更新审批规则失败:', error);
      toast.error('更新审批规则失败');
    }
  };

  const handleDeleteApprovalRule = async (rule: ApprovalRule) => {
    if (!confirm(`确定要删除审批规则"${rule.name}"吗？`)) return;
    try {
      await organizationApi.deleteApprovalRule(rule.id);
      toast.success('审批规则删除成功');
      fetchData();
    } catch (error) {
      console.error('删除审批规则失败:', error);
      toast.error('删除审批规则失败');
    }
  };

  const applyLevelTemplate = (template: typeof POSITION_LEVEL_TEMPLATES[0]) => {
    setPositionLevelForm({ ...template });
  };

  const resetLevelForm = () => {
    setPositionLevelForm({
      code: '',
      name: '',
      level_order: 1,
      description: '',
    });
    setSelectedLevelTemplate('');
  };

  const resetPositionForm = () => {
    setPositionForm({
      title: '',
      code: '',
      position_level_id: '',
      department_id: '',
      description: '',
      is_leader: false,
      sort_order: 0,
    });
    setSelectedPositionTemplate('');
  };

  const resetRuleForm = () => {
    setApprovalRuleForm({
      name: '',
      workflow_type: '',
      node_order: 1,
      rule_type: 'any_approver',
      min_approvers: 1,
      approval_mode: 'any',
      condition_expression: '',
    });
    setSelectedRuleTemplate('');
  };

  const openLevelDialog = (level?: PositionLevel) => {
    if (level) {
      setEditingLevel(level);
      setPositionLevelForm({
        code: level.code,
        name: level.name,
        level_order: level.level_order,
        description: level.description || '',
      });
    } else {
      setEditingLevel(null);
      resetLevelForm();
    }
    setShowPositionLevelDialog(true);
  };

  const openPositionDialog = (pos?: Position) => {
    if (pos) {
      setEditingPosition(pos);
      setPositionForm({
        title: pos.name,
        code: pos.code,
        position_level_id: pos.position_level_id || '',
        department_id: pos.department_id || '',
        description: pos.description || '',
        is_leader: pos.is_leader,
        sort_order: pos.sort_order || 0,
      });
    } else {
      setEditingPosition(null);
      resetPositionForm();
    }
    setShowPositionDialog(true);
  };

  const handleCreateDepartment = async () => {
    if (!departmentForm.name || !departmentForm.code) {
      toast.error('请填写必填字段');
      return;
    }
    try {
      await departmentApi.createDepartment(departmentForm);
      toast.success('部门创建成功');
      setShowDepartmentDialog(false);
      resetDepartmentForm();
      fetchData();
    } catch (error) {
      console.error('创建部门失败:', error);
      toast.error('创建部门失败');
    }
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;
    try {
      await departmentApi.updateDepartment(editingDepartment.id, {
        name: departmentForm.name,
        code: departmentForm.code,
        parent_id: departmentForm.parent_id || undefined,
        manager_id: departmentForm.manager_id || undefined,
        description: departmentForm.description,
        sort_order: departmentForm.sort_order,
      });
      toast.success('部门更新成功');
      setShowDepartmentDialog(false);
      setEditingDepartment(null);
      resetDepartmentForm();
      fetchData();
    } catch (error) {
      console.error('更新部门失败:', error);
      toast.error('更新部门失败');
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!confirm(`确定要删除部门"${dept.name}"吗？`)) return;
    try {
      await departmentApi.deleteDepartment(dept.id);
      toast.success('部门删除成功');
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) {
        toast.success('部门已删除');
        fetchData();
      } else {
        console.error('删除部门失败:', error);
        toast.error('删除部门失败');
      }
    }
  };

  const handleToggleDepartmentStatus = async (dept: Department) => {
    try {
      await departmentApi.updateDepartmentStatus(dept.id, !dept.is_active);
      toast.success(`部门${dept.is_active ? '停用' : '启用'}成功`);
      fetchData();
    } catch (error) {
      console.error('更新部门状态失败:', error);
      toast.error('更新部门状态失败');
    }
  };

  const openSaveAsTemplateDialog = (type: 'department' | 'position' | 'position_level' | 'approval_rule') => {
    setSaveAsTemplateType(type);
    setSaveAsTemplateName('');
    setSaveAsTemplateCode('');
    setSaveAsTemplateDescription('');
    setSaveAsTemplateTags('');
    setShowSaveAsTemplateDialog(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!saveAsTemplateName || !saveAsTemplateCode) {
      toast.error('请填写模板名称和编码');
      return;
    }

    try {
      let content: any = {};
      let category = '';

      switch (saveAsTemplateType) {
        case 'department':
          content = {
            name: departmentForm.name,
            code: departmentForm.code,
            description: departmentForm.description,
            sort_order: departmentForm.sort_order,
            parent_id: departmentForm.parent_id,
            manager_id: departmentForm.manager_id,
          };
          category = '组织架构';
          break;
        case 'position':
          content = {
            title: positionForm.title,
            code: positionForm.code,
            description: positionForm.description,
            is_leader: positionForm.is_leader,
            sort_order: positionForm.sort_order,
          };
          category = '组织架构';
          break;
        case 'position_level':
          content = {
            name: positionLevelForm.name,
            code: positionLevelForm.code,
            description: positionLevelForm.description,
            level_order: positionLevelForm.level_order,
          };
          category = '组织架构';
          break;
        case 'approval_rule':
          content = {
            name: approvalRuleForm.name,
            workflow_type: approvalRuleForm.workflow_type,
            node_order: approvalRuleForm.node_order,
            rule_type: approvalRuleForm.rule_type,
            min_approvers: approvalRuleForm.min_approvers,
            approval_mode: approvalRuleForm.approval_mode,
            condition_expression: approvalRuleForm.condition_expression,
          };
          category = '组织架构';
          break;
      }

      await templateService.createTemplate({
        code: saveAsTemplateCode,
        name: saveAsTemplateName,
        description: saveAsTemplateDescription || undefined,
        category,
        template_type: saveAsTemplateType,
        content,
        tags: saveAsTemplateTags ? saveAsTemplateTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        is_active: true,
        is_default: false,
      });

      toast.success('模板保存成功');
      setShowSaveAsTemplateDialog(false);
    } catch (error) {
      console.error('保存模板失败:', error);
      toast.error('保存模板失败');
    }
  };

  const applyDepartmentTemplate = (template: typeof DEPARTMENT_TEMPLATES[0]) => {
    setDepartmentForm({ ...template });
  };

  const applyPositionTemplate = (template: typeof POSITION_TEMPLATES[0]) => {
    setPositionForm({
      title: template.title,
      code: template.code,
      description: template.description,
      is_leader: template.is_leader,
      position_level_id: '',
      department_id: '',
    });
    setShowPositionDialog(true);
    toast.success(`已应用模板: ${template.title}`);
  };

  const resetDepartmentForm = () => {
    setDepartmentForm({
      name: '',
      code: '',
      description: '',
      sort_order: 0,
      parent_id: '',
      manager_id: '',
    });
    setSelectedDeptTemplate('');
  };

  const openDepartmentDialog = (dept?: Department) => {
    if (dept) {
      setEditingDepartment(dept);
      setDepartmentForm({
        name: dept.name,
        code: dept.code,
        description: dept.description || '',
        sort_order: dept.sort_order,
        parent_id: dept.parent_id || '',
        manager_id: dept.manager_id || '',
      });
    } else {
      setEditingDepartment(null);
      resetDepartmentForm();
    }
    setShowDepartmentDialog(true);
  };

  const applyRuleTemplate = (template: typeof APPROVAL_RULE_TEMPLATES[0]) => {
    setApprovalRuleForm({
      name: template.name,
      workflow_type: template.workflow_type || '',
      node_order: 1,
      rule_type: template.rule_type,
      min_approvers: template.min_approvers || 1,
      approval_mode: template.approval_mode || 'any',
      condition_expression: template.condition_expression || '',
    });
    setShowApprovalRuleDialog(true);
    toast.success(`已应用模板: ${template.name}`);
  };

  const openRuleDialog = (rule?: ApprovalRule) => {
    if (rule) {
      setEditingRule(rule);
      setApprovalRuleForm({
        name: rule.name,
        workflow_type: rule.workflow_type || '',
        node_order: rule.node_order || 1,
        rule_type: rule.rule_type,
        position_level_id: rule.position_level_id || '',
        department_id: rule.department_id || '',
        specific_user_id: rule.specific_user_id || '',
        min_approvers: rule.min_approvers || 1,
        approval_mode: rule.approval_mode || 'any',
        condition_expression: rule.condition_expression || '',
      });
    } else {
      setEditingRule(null);
      resetRuleForm();
    }
    setShowApprovalRuleDialog(true);
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };



  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">组织架构管理</h1>
          <p className="text-muted-foreground mt-1">管理公司组织架构、职位体系和审批规则</p>
        </div>
        {loading && (
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full animate-pulse bg-blue-500"></div>
            加载中...
          </Badge>
        )}
      </div>

      {/* 智能搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="搜索部门、职位、职级或审批规则..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8"
            onClick={() => setSearchQuery('')}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="h-4 w-4" />
            部门管理
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-2">
            <GitBranch className="h-4 w-4" />
            职位体系
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Shield className="h-4 w-4" />
            审批规则
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2">
            <Layout className="h-4 w-4" />
            组织架构图
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">部门列表</h2>
              <p className="text-sm text-muted-foreground">管理公司所有部门，支持层级结构</p>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const template = deptTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setDepartmentForm({
                        name: template.name,
                        code: template.code,
                        description: template.description,
                        sort_order: template.sort_order,
                        parent_id: '',
                        manager_id: '',
                      });
                      setShowDepartmentDialog(true);
                    }
                  }
                }}
              >
                <option value="">从模板创建</option>
                {deptTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <Button onClick={() => openDepartmentDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                新增部门
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left p-4 font-medium">序号</th>
                    <th className="text-left p-4 font-medium">部门名称</th>
                    <th className="text-left p-4 font-medium">代码</th>
                    <th className="text-left p-4 font-medium">描述</th>
                    <th className="text-left p-4 font-medium">状态</th>
                    <th className="text-left p-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((dept, index) => (
                      <tr key={dept.id} className="border-b hover:bg-accent/30">
                        <td className="p-4">
                          <Badge variant="outline">{index + 1}</Badge>
                        </td>
                        <td className="p-4 font-medium">{dept.name}</td>
                        <td className="p-4 text-muted-foreground">{dept.code}</td>
                        <td className="p-4 text-sm text-muted-foreground">{dept.description}</td>
                        <td className="p-4">
                          {dept.is_active ? (
                            <Badge className="bg-green-500">启用</Badge>
                          ) : (
                            <Badge variant="destructive">停用</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openDepartmentDialog(dept)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={dept.is_active ? 'outline' : 'default'}
                              onClick={() => handleToggleDepartmentStatus(dept)}
                            >
                              {dept.is_active ? <Shield className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDepartment(dept)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {filteredDepartments.length === 0 && searchQuery && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        未找到匹配的部门
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>组织架构图</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedNodes(new Set(departments.map(d => d.id)))}
                  >
                    全部展开
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedNodes(new Set())}
                  >
                    全部收起
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
                  <span>加载组织架构...</span>
                </div>
              ) : departments.length === 0 ? (
                <div className="text-muted-foreground text-center py-12">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无部门数据</p>
                  <p className="text-sm mt-1">点击"部门管理"标签页添加部门</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {(() => {
                      const rootDepartments = departments
                        .filter(dept => dept.parent_id === null)
                        .sort((a, b) => a.sort_order - b.sort_order);
                      if (rootDepartments.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>未找到顶级部门，请在"部门管理"中添加部门</p>
                          </div>
                        );
                      }
                      // 递归渲染部门节点
                      const renderNode = (dept: Department, level: number = 0) => {
                        const children = departments
                          .filter(d => d.parent_id === dept.id)
                          .sort((a, b) => a.sort_order - b.sort_order);
                        const deptEmployees = employees.filter(emp => emp.department_id === dept.id);
                        const hasChildren = children.length > 0 || deptEmployees.length > 0;
                        const isExpanded = expandedNodes.has(dept.id);
                        return (
                          <div key={dept.id} className="mb-2">
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-primary/50 cursor-pointer ${
                                dept.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
                              }`}
                              style={{ marginLeft: `${level * 24}px` }}
                              onClick={() => hasChildren && toggleNode(dept.id)}
                            >
                              <div className="flex-shrink-0">
                                {hasChildren ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNode(dept.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                ) : (
                                  <div className="w-6" />
                                )}
                              </div>
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  dept.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-foreground truncate">{dept.name}</h4>
                                  {!dept.is_active && <Badge variant="outline" className="text-xs">已停用</Badge>}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                  {dept.description || `代码: ${dept.code}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {deptEmployees.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    {deptEmployees.length}人
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDepartmentDialog(dept);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-2">
                                {children.map(child => renderNode(child, level + 1))}
                                {deptEmployees.length > 0 && (
                                  <div className="mt-2 ml-8">
                                    {deptEmployees.map(emp => (
                                      <div
                                        key={emp.id}
                                        className="flex items-center gap-3 p-2 pl-6 rounded border border-muted hover:bg-muted/50"
                                      >
                                        <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center flex-shrink-0">
                                          <User className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium text-foreground text-sm">{emp.name}</p>
                                          <p className="text-xs text-muted-foreground">{emp.position_name || emp.email}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      };
                      return <div>{rootDepartments.map(dept => renderNode(dept))}</div>;
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">职位级别</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => openLevelDialog()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredPositionLevels
                    .sort((a, b) => a.level_order - b.level_order)
                    .map((level) => (
                      <div key={level.id} className="flex items-center justify-between p-3 border rounded hover:bg-accent/50">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{level.level_order}</Badge>
                          <span className="font-medium">{level.name}</span>
                          <span className="text-sm text-muted-foreground">{level.code}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openLevelDialog(level)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeletePositionLevel(level)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {filteredPositionLevels.length === 0 && searchQuery && (
                    <div className="text-center py-4 text-gray-500">未找到匹配的职级</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">职位列表</CardTitle>
                    <div className="flex gap-1 mt-2">
                      {POSITION_TEMPLATES.slice(0, 3).map((template) => (
                        <Button
                          key={template.code}
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2"
                          onClick={() => applyPositionTemplate(template)}
                        >
                          +{template.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => openPositionDialog()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredPositions.map((pos) => (
                    <div key={pos.id} className="flex items-center justify-between p-3 border rounded hover:bg-accent/50">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pos.name}</span>
                        {pos.level_name && (
                          <Badge variant="outline" className="text-xs">{pos.level_name}</Badge>
                        )}
                        {pos.is_leader && (
                          <Badge variant="default" className="text-xs bg-blue-500">主管</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openPositionDialog(pos)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePosition(pos)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredPositions.length === 0 && searchQuery && (
                    <div className="text-center py-4 text-gray-500">未找到匹配的职位</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">职位级别</h2>
              <p className="text-sm text-muted-foreground">定义公司的职级体系</p>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const template = levelTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setPositionLevelForm({
                        name: template.name,
                        code: template.code,
                        level_order: template.level_order,
                        description: template.description,
                      });
                      setShowPositionLevelDialog(true);
                    }
                  }
                }}
              >
                <option value="">从模板创建</option>
                {levelTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <Button onClick={() => openLevelDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                新增级别
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left p-4 font-medium">级别</th>
                    <th className="text-left p-4 font-medium">名称</th>
                    <th className="text-left p-4 font-medium">代码</th>
                    <th className="text-left p-4 font-medium">描述</th>
                    <th className="text-left p-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {positionLevels
                    .sort((a, b) => a.level - b.level)
                    .map((level) => (
                      <tr key={level.id} className="border-b hover:bg-accent/30">
                        <td className="p-4">
                          <Badge variant="outline">{level.level}</Badge>
                        </td>
                        <td className="p-4 font-medium">{level.name}</td>
                        <td className="p-4 text-muted-foreground">{level.code}</td>
                        <td className="p-4 text-sm text-muted-foreground">{level.description}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openLevelDialog(level)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeletePositionLevel(level)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mb-4 mt-8">
            <div>
              <h2 className="text-xl font-semibold">职位列表</h2>
              <p className="text-sm text-muted-foreground">定义公司的具体职位</p>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const template = positionTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setPositionForm({
                        title: template.title,
                        code: template.code,
                        description: template.description,
                        is_leader: template.is_leader,
                        position_level_id: '',
                        department_id: '',
                        sort_order: 0,
                      });
                      setShowPositionDialog(true);
                    }
                  }
                }}
              >
                <option value="">从模板创建</option>
                {positionTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.title}</option>
                ))}
              </select>
              <Button onClick={() => openPositionDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                新增职位
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left p-4 font-medium">职位名称</th>
                    <th className="text-left p-4 font-medium">代码</th>
                    <th className="text-left p-4 font-medium">职级</th>
                    <th className="text-left p-4 font-medium">是否主管</th>
                    <th className="text-left p-4 font-medium">描述</th>
                    <th className="text-left p-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPositions.map((pos) => (
                    <tr key={pos.id} className="border-b hover:bg-accent/30">
                      <td className="p-4 font-medium">{pos.name}</td>
                      <td className="p-4 text-muted-foreground">{pos.code}</td>
                      <td className="p-4">
                        {pos.level_id && <Badge variant="outline">{positionLevels.find(level => level.id === pos.level_id)?.name || pos.level_id}</Badge>}
                      </td>
                      <td className="p-4">
                        {pos.is_leader ? (
                          <Badge className="bg-blue-500">是</Badge>
                        ) : (
                          <Badge variant="outline">否</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{pos.description}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openPositionDialog(pos)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeletePosition(pos)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPositions.length === 0 && searchQuery && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        未找到匹配的职位
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">审批规则</h2>
              <p className="text-sm text-muted-foreground">定义工作流的审批规则</p>
            </div>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const template = ruleTemplates.find(t => t.id === e.target.value);
                    if (template) {
                      setApprovalRuleForm({
                        name: template.name,
                        workflow_type: template.workflow_type,
                        rule_type: template.rule_type,
                        approval_mode: template.approval_mode,
                        min_approvers: template.min_approvers,
                        node_order: 1,
                        condition_expression: template.condition_expression,
                      });
                      setShowApprovalRuleDialog(true);
                    }
                  }
                }}
              >
                <option value="">从模板创建</option>
                {ruleTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <Button onClick={() => openRuleDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                新增规则
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="text-left p-4 font-medium">规则名称</th>
                    <th className="text-left p-4 font-medium">规则类型</th>
                    <th className="text-left p-4 font-medium">审批模式</th>
                    <th className="text-left p-4 font-medium">最小审批人</th>
                    <th className="text-left p-4 font-medium">状态</th>
                    <th className="text-left p-4 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovalRules.map((rule) => (
                    <tr key={rule.id} className="border-b hover:bg-accent/30">
                      <td className="p-4 font-medium">{rule.name}</td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {RULE_TYPES.find(t => t.value === rule.rule_type)?.label || rule.rule_type}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {APPROVAL_MODES.find(m => m.value === rule.approval_mode)?.label || rule.approval_mode}
                      </td>
                      <td className="p-4">{rule.min_approvers} 人</td>
                      <td className="p-4">
                        {rule.is_active ? (
                          <Badge className="bg-green-500">启用</Badge>
                        ) : (
                          <Badge variant="destructive">停用</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openRuleDialog(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteApprovalRule(rule)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredApprovalRules.length === 0 && searchQuery && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        未找到匹配的审批规则
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPositionLevelDialog} onOpenChange={setShowPositionLevelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLevel ? '编辑职位级别' : '新增职位级别'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="level-name">级别名称</Label>
              <div className="flex gap-2">
                <Input
                  id="level-name"
                  value={positionLevelForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setPositionLevelForm({ 
                      ...positionLevelForm, 
                      name: newName,
                      code: !editingLevel ? generateLevelCode(newName) : positionLevelForm.code 
                    });
                  }}
                  placeholder="如: 经理"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={() => {
                    const newCode = generateLevelCode(positionLevelForm.name);
                    setPositionLevelForm({ ...positionLevelForm, code: newCode });
                  }}
                  title="智能生成代码"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="level-code">级别代码</Label>
                {!editingLevel && positionLevelForm.code && checkCodeDuplicate(positionLevelForm.code, 'level') && (
                  <span className="text-sm text-destructive">代码已存在</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="level-code"
                  value={positionLevelForm.code}
                  onChange={(e) => setPositionLevelForm({ ...positionLevelForm, code: e.target.value })}
                  placeholder="如: manager"
                  disabled={!!editingLevel}
                  className={`flex-1 ${
                    !editingLevel && positionLevelForm.code && checkCodeDuplicate(positionLevelForm.code, 'level') 
                      ? 'border-red-500' 
                      : ''
                  }`}
                />
                <AIAssistant
                  value={positionLevelForm.code}
                  onChange={(val) => setPositionLevelForm({ ...positionLevelForm, code: val })}
                  type="field_code"
                  sourceFieldValue={positionLevelForm.name}
                  autoMode={!editingLevel}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-order">级别顺序</Label>
              <Input
                id="level-order"
                type="number"
                value={positionLevelForm.level_order}
                onChange={(e) => setPositionLevelForm({ ...positionLevelForm, level_order: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level-desc">描述</Label>
              <div className="flex gap-2">
                <textarea
                  id="level-desc"
                  className="flex-1 h-20 px-3 py-2 border rounded-md"
                  value={positionLevelForm.description}
                  onChange={(e) => setPositionLevelForm({ ...positionLevelForm, description: e.target.value })}
                  placeholder="请输入描述"
                />
                <AIAssistant
                  value={positionLevelForm.description || ''}
                  onChange={(val) => setPositionLevelForm({ ...positionLevelForm, description: val })}
                  type="description"
                  sourceFieldValue={positionLevelForm.name}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPositionLevelDialog(false)}>取消</Button>
            <Button onClick={editingLevel ? handleUpdatePositionLevel : handleCreatePositionLevel}>
              {editingLevel ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPositionDialog} onOpenChange={setShowPositionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPosition ? '编辑职位' : '新增职位'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pos-title">职位名称</Label>
              <div className="flex gap-2">
                <Input
                  id="pos-title"
                  value={positionForm.title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setPositionForm({ 
                      ...positionForm, 
                      title: newTitle,
                      code: !editingPosition ? generatePositionCode(newTitle) : positionForm.code 
                    });
                  }}
                  placeholder="如: 产品经理"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={() => {
                    const newCode = generatePositionCode(positionForm.title);
                    setPositionForm({ ...positionForm, code: newCode });
                  }}
                  title="智能生成代码"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pos-code">职位代码</Label>
                {!editingPosition && positionForm.code && checkCodeDuplicate(positionForm.code, 'position') && (
                  <span className="text-sm text-destructive">代码已存在</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="pos-code"
                  value={positionForm.code}
                  onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                  placeholder="如: product_manager"
                  disabled={!!editingPosition}
                  className={`flex-1 ${
                    !editingPosition && positionForm.code && checkCodeDuplicate(positionForm.code, 'position') 
                      ? 'border-red-500' 
                      : ''
                  }`}
                />
                <AIAssistant
                  value={positionForm.code}
                  onChange={(val) => setPositionForm({ ...positionForm, code: val })}
                  type="field_code"
                  sourceFieldValue={positionForm.title}
                  autoMode={!editingPosition}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-level">职位级别</Label>
              <select
                id="pos-level"
                className="w-full px-3 py-2 border rounded-md"
                value={positionForm.position_level_id}
                onChange={(e) => setPositionForm({ ...positionForm, position_level_id: e.target.value })}
              >
                <option value="">请选择</option>
                {positionLevels.map((level) => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-sort-order">排序序号</Label>
              <Input
                id="pos-sort-order"
                type="number"
                value={positionForm.sort_order}
                onChange={(e) => setPositionForm({ ...positionForm, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="同一级别内的排序序号"
                min="0"
                max="999"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pos-leader"
                checked={positionForm.is_leader}
                onChange={(e) => setPositionForm({ ...positionForm, is_leader: e.target.checked })}
              />
              <Label htmlFor="pos-leader">是否为主管职位</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pos-desc">描述</Label>
              <div className="flex gap-2">
                <textarea
                  id="pos-desc"
                  className="flex-1 h-20 px-3 py-2 border rounded-md"
                  value={positionForm.description}
                  onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                  placeholder="请输入描述"
                />
                <AIAssistant
                  value={positionForm.description || ''}
                  onChange={(val) => setPositionForm({ ...positionForm, description: val })}
                  type="description"
                  sourceFieldValue={positionForm.title}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPositionDialog(false)}>取消</Button>
            <Button onClick={editingPosition ? handleUpdatePosition : handleCreatePosition}>
              {editingPosition ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showApprovalRuleDialog} onOpenChange={setShowApprovalRuleDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑审批规则' : '新增审批规则'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">规则名称</Label>
              <Input
                id="rule-name"
                value={approvalRuleForm.name}
                onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, name: e.target.value })}
                placeholder="如: 部门经理审批"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-type">规则类型</Label>
              <select
                id="rule-type"
                className="w-full px-3 py-2 border rounded-md"
                value={approvalRuleForm.rule_type}
                onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, rule_type: e.target.value })}
              >
                {RULE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-workflow">工作流类型</Label>
                <Input
                  id="rule-workflow"
                  value={approvalRuleForm.workflow_type}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, workflow_type: e.target.value })}
                  placeholder="如: leave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rule-node">节点顺序</Label>
                <Input
                  id="rule-node"
                  type="number"
                  value={approvalRuleForm.node_order}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, node_order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rule-min">最小审批人数</Label>
                <Input
                  id="rule-min"
                  type="number"
                  value={approvalRuleForm.min_approvers}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, min_approvers: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="rule-mode">审批模式</Label>
                  <HelpTooltip content="any:任意一人审批即可通过；all:所有人必须同意才能通过；majority:超过半数同意即可通过" />
                </div>
                <select
                  id="rule-mode"
                  className="w-full px-3 py-2 border rounded-md"
                  value={approvalRuleForm.approval_mode}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, approval_mode: e.target.value })}
                >
                  {APPROVAL_MODES.map((mode) => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {approvalRuleForm.rule_type === 'position_level' && (
              <div className="space-y-2">
                <Label htmlFor="rule-level">职位级别</Label>
                <select
                  id="rule-level"
                  className="w-full px-3 py-2 border rounded-md"
                  value={approvalRuleForm.position_level_id}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, position_level_id: e.target.value })}
                >
                  <option value="">请选择</option>
                  {positionLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
            )}
            {approvalRuleForm.rule_type === 'specific_user' && (
              <div className="space-y-2">
                <Label htmlFor="rule-user">指定人员</Label>
                <select
                  id="rule-user"
                  className="w-full px-3 py-2 border rounded-md"
                  value={approvalRuleForm.specific_user_id}
                  onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, specific_user_id: e.target.value })}
                >
                  <option value="">请选择</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="rule-condition">条件表达式 (可选)</Label>
                <HelpTooltip content="用于条件分支审批，如: amount > 1000 表示金额超过1000时触发此规则" />
              </div>
              <textarea
                id="rule-condition"
                className="w-full h-20 px-3 py-2 border rounded-md"
                value={approvalRuleForm.condition_expression}
                onChange={(e) => setApprovalRuleForm({ ...approvalRuleForm, condition_expression: e.target.value })}
                placeholder="如: amount > 10000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalRuleDialog(false)}>取消</Button>
            <Button onClick={editingRule ? handleUpdateApprovalRule : handleCreateApprovalRule}>
              {editingRule ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDepartmentDialog} onOpenChange={setShowDepartmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? '编辑部门' : '新增部门'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">部门名称</Label>
              <div className="flex gap-2">
                <Input
                  id="dept-name"
                  value={departmentForm.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setDepartmentForm({ 
                      ...departmentForm, 
                      name: newName,
                      code: !editingDepartment ? generateDepartmentCode(newName) : departmentForm.code 
                    });
                  }}
                  placeholder="如: 技术部"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={() => {
                    const newCode = generateDepartmentCode(departmentForm.name);
                    setDepartmentForm({ ...departmentForm, code: newCode });
                  }}
                  title="智能生成代码"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dept-code">部门代码</Label>
                {!editingDepartment && departmentForm.code && checkCodeDuplicate(departmentForm.code, 'department') && (
                  <span className="text-sm text-destructive">代码已存在</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="dept-code"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="如: tech"
                  disabled={!!editingDepartment}
                  className={`flex-1 ${
                    !editingDepartment && departmentForm.code && checkCodeDuplicate(departmentForm.code, 'department') 
                      ? 'border-red-500' 
                      : ''
                  }`}
                />
                <AIAssistant
                  value={departmentForm.code}
                  onChange={(val) => setDepartmentForm({ ...departmentForm, code: val.toLowerCase().replace(/\s/g, '_') })}
                  type="field_code"
                  sourceFieldValue={departmentForm.name}
                  autoMode={!editingDepartment}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dept-parent">上级部门</Label>
                <select
                  id="dept-parent"
                  className="w-full px-3 py-2 border rounded-md"
                  value={departmentForm.parent_id || ''}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, parent_id: e.target.value || undefined })}
                >
                  <option value="">无（顶级部门）</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-order">排序</Label>
                <Input
                  id="dept-order"
                  type="number"
                  value={departmentForm.sort_order}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-manager">部门经理</Label>
              <select
                id="dept-manager"
                className="w-full px-3 py-2 border rounded-md"
                value={departmentForm.manager_id || ''}
                onChange={(e) => setDepartmentForm({ ...departmentForm, manager_id: e.target.value || undefined })}
              >
                <option value="">请选择</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-desc">描述</Label>
              <div className="flex gap-2">
                <textarea
                  id="dept-desc"
                  className="flex-1 h-20 px-3 py-2 border rounded-md"
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  placeholder="请输入部门描述"
                />
                <AIAssistant
                  value={departmentForm.description || ''}
                  onChange={(val) => setDepartmentForm({ ...departmentForm, description: val })}
                  type="description"
                  sourceFieldValue={departmentForm.name}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepartmentDialog(false)}>取消</Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDepartmentDialog(false);
                openSaveAsTemplateDialog('department');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              保存为模板
            </Button>
            <Button onClick={editingDepartment ? handleUpdateDepartment : handleCreateDepartment}>
              {editingDepartment ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveAsTemplateDialog} onOpenChange={setShowSaveAsTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>保存为新模板</DialogTitle>
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
                placeholder="如: 组织, 部门"
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">
                模板类型: <span className="font-medium">{saveAsTemplateType}</span>
              </p>
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

export default OrganizationManagement;
