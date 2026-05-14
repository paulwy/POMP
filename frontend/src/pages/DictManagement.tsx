import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  RefreshCw,
  CheckCircle,
  XCircle,
  Save,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  dictService,
  DictType,
  DictItem,
  CreateDictType,
  CreateDictItem,
  UpdateDictType,
  UpdateDictItem,
} from '@/services/dict';
import { AIAssistant } from '@/components/AIAssistant';

const DICT_CATEGORIES = [
  { value: 'ALL', label: '全部' },
  { value: 'ORGANIZATION', label: '组织架构' },
  { value: 'PRODUCT', label: '产品管理' },
  { value: 'PROJECT', label: '工程项目' },
  { value: 'CUSTOMER', label: '客户供应商' },
  { value: 'CONTRACT', label: '合同管理' },
  { value: 'APPROVAL', label: '审批流程' },
];

const DictManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dictTypes, setDictTypes] = useState<DictType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [dictItemsMap, setDictItemsMap] = useState<Record<string, DictItem[]>>({});

  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingType, setEditingType] = useState<DictType | null>(null);
  const [editingItem, setEditingItem] = useState<DictItem | null>(null);
  const [currentTypeId, setCurrentTypeId] = useState<string | null>(null);

  const [typeForm, setTypeForm] = useState<CreateDictType>({
    code: '',
    name: '',
    description: '',
    category: 'ORGANIZATION',
    sort_order: 0,
  });

  const [itemForm, setItemForm] = useState<CreateDictItem>({
    dict_type_id: '',
    code: '',
    name: '',
    value: '',
    sort_order: 0,
  });

  useEffect(() => {
    fetchDictTypes();
  }, [selectedCategory]);

  const fetchDictTypes = async () => {
    setLoading(true);
    try {
      const category = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const types = await dictService.getDictTypes(category, true);
      setDictTypes(types);
    } catch (error) {
      console.error('获取字典类型失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDictItems = async (typeId: string) => {
    try {
      const items = await dictService.getDictItems(typeId);
      setDictItemsMap((prev) => ({ ...prev, [typeId]: items }));
    } catch (error) {
      console.error('获取字典项失败:', error);
    }
  };

  const toggleExpand = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
      if (!dictItemsMap[typeId]) {
        fetchDictItems(typeId);
      }
    }
    setExpandedTypes(newExpanded);
  };

  const filteredDictTypes = dictTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateType = () => {
    setEditingType(null);
    setTypeForm({
      code: '',
      name: '',
      description: '',
      category: selectedCategory === 'ALL' ? 'ORGANIZATION' : selectedCategory,
      sort_order: 0,
    });
    setShowTypeDialog(true);
  };

  const handleEditType = (type: DictType) => {
    setEditingType(type);
    setTypeForm({
      code: type.code,
      name: type.name,
      description: type.description || '',
      category: type.category,
      sort_order: type.sort_order,
    });
    setShowTypeDialog(true);
  };

  const handleSaveType = async () => {
    try {
      if (editingType) {
        await dictService.updateDictType(editingType.id, typeForm as UpdateDictType);
      } else {
        await dictService.createDictType(typeForm);
      }
      setShowTypeDialog(false);
      fetchDictTypes();
    } catch (error) {
      console.error('保存字典类型失败:', error);
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm('确定要删除该字典类型吗？')) return;
    try {
      await dictService.deleteDictType(id);
      fetchDictTypes();
    } catch (error) {
      console.error('删除字典类型失败:', error);
    }
  };

  const handleCreateItem = (typeId: string) => {
    setCurrentTypeId(typeId);
    setEditingItem(null);
    setItemForm({
      dict_type_id: typeId,
      code: '',
      name: '',
      value: '',
      sort_order: 0,
    });
    setShowItemDialog(true);
  };

  const handleEditItem = (item: DictItem) => {
    setCurrentTypeId(item.dict_type_id);
    setEditingItem(item);
    setItemForm({
      dict_type_id: item.dict_type_id,
      code: item.code,
      name: item.name,
      value: item.value || '',
      sort_order: item.sort_order,
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = async () => {
    try {
      if (editingItem) {
        await dictService.updateDictItem(editingItem.id, itemForm as UpdateDictItem);
      } else {
        await dictService.createDictItem(itemForm);
      }
      setShowItemDialog(false);
      if (currentTypeId) {
        fetchDictItems(currentTypeId);
      }
    } catch (error) {
      console.error('保存字典项失败:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('确定要删除该字典项吗？')) return;
    try {
      await dictService.deleteDictItem(id);
      if (currentTypeId) {
        fetchDictItems(currentTypeId);
      }
    } catch (error) {
      console.error('删除字典项失败:', error);
    }
  };

  const handleInitDefaults = async () => {
    try {
      await dictService.initDefaultDicts();
      fetchDictTypes();
      alert('初始化成功！');
    } catch (error) {
      console.error('初始化默认字典失败:', error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">字典管理</h1>
          <p className="text-muted-foreground mt-1">管理系统中的各类字典数据</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleInitDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            初始化默认字典
          </Button>
          <Button onClick={handleCreateType}>
            <Plus className="h-4 w-4 mr-2" />
            新建字典类型
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>字典分类</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索字典..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {DICT_CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory}>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : filteredDictTypes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无字典数据
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDictTypes.map((dictType) => (
                    <div
                      key={dictType.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div
                        className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleExpand(dictType.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedTypes.has(dictType.id) ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                          <FolderOpen className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">{dictType.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {dictType.code} - {dictType.description || '无描述'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={dictType.is_system ? 'default' : 'secondary'}>
                            {dictType.is_system ? '系统' : '自定义'}
                          </Badge>
                          <Badge variant="outline">
                            {dictItemsMap[dictType.id]?.length || 0} 项
                          </Badge>
                          {!dictType.is_system && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateItem(dictType.id);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditType(dictType);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteType(dictType.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {expandedTypes.has(dictType.id) && (
                        <div className="border-t">
                          <table className="w-full">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  编码
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  名称
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  值
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  排序
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  默认
                                </th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                  状态
                                </th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">
                                  操作
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {(dictItemsMap[dictType.id] || []).map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm font-mono">
                                    {item.code}
                                  </td>
                                  <td className="px-4 py-2 text-sm">{item.name}</td>
                                  <td className="px-4 py-2 text-sm text-muted-foreground">
                                    {item.value || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-sm">{item.sort_order}</td>
                                  <td className="px-4 py-2">
                                    {item.is_default ? (
                                      <CheckCircle className="h-5 w-5 text-success" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-gray-300" />
                                    )}
                                  </td>
                                  <td className="px-4 py-2">
                                    <Badge
                                      variant={item.is_active ? 'default' : 'secondary'}
                                    >
                                      {item.is_active ? '启用' : '禁用'}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-2 text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditItem(item)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteItem(item.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                              {(dictItemsMap[dictType.id] || []).length === 0 && (
                                <tr>
                                  <td
                                    colSpan={7}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                  >
                                    暂无字典项
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingType ? '编辑字典类型' : '新建字典类型'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">编码</label>
              <div className="flex gap-2">
                <Input
                  value={typeForm.code}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, code: e.target.value })
                  }
                  placeholder="如: DEPT"
                  disabled={!!editingType}
                  className="flex-1"
                />
                <AIAssistant
                  value={typeForm.code}
                  onChange={(val) => setTypeForm({ ...typeForm, code: val })}
                  type="field_code"
                  sourceFieldValue={typeForm.name}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">名称</label>
              <Input
                value={typeForm.name}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, name: e.target.value })
                }
                placeholder="如: 部门分类"
              />
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <div className="flex gap-2">
                <Input
                  value={typeForm.description}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, description: e.target.value })
                  }
                  placeholder="字典类型描述"
                  className="flex-1"
                />
                <AIAssistant
                  value={typeForm.description || ''}
                  onChange={(val) => setTypeForm({ ...typeForm, description: val })}
                  type="description"
                  sourceFieldValue={typeForm.description}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">分类</label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={typeForm.category}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, category: e.target.value })
                }
                disabled={!!editingType}
              >
                {DICT_CATEGORIES.filter((c) => c.value !== 'ALL').map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input
                type="number"
                value={typeForm.sort_order}
                onChange={(e) =>
                  setTypeForm({
                    ...typeForm,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveType}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? '编辑字典项' : '新建字典项'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">编码</label>
              <div className="flex gap-2">
                <Input
                  value={itemForm.code}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, code: e.target.value })
                  }
                  placeholder="如: EXEC"
                  disabled={!!editingItem}
                  className="flex-1"
                />
                <AIAssistant
                  value={itemForm.code}
                  onChange={(val) => setItemForm({ ...itemForm, code: val })}
                  type="field_code"
                  sourceFieldValue={itemForm.name}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">名称</label>
              <Input
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
                placeholder="如: 执行委员会"
              />
            </div>
            <div>
              <label className="text-sm font-medium">值</label>
              <div className="flex gap-2">
                <Input
                  value={itemForm.value}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, value: e.target.value })
                  }
                  placeholder="附加数值（可选）"
                  className="flex-1"
                />
                <AIAssistant
                  value={itemForm.value || ''}
                  onChange={(val) => setItemForm({ ...itemForm, value: val })}
                  type="field_code"
                  sourceFieldValue={itemForm.name}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input
                type="number"
                value={itemForm.sort_order}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              <X className="h-4 w-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveItem}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DictManagement;