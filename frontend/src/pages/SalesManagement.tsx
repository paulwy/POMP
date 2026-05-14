import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  erpSalesApi, 
  Customer, 
  SalesOrder,
  CreateCustomerRequest
} from '@/services/erp';

const SalesManagement = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [searchText, setSearchText] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newCustomer, setNewCustomer] = useState<CreateCustomerRequest>({
    customer_code: '',
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, ordersData] = await Promise.all([
        erpSalesApi.getCustomers(),
        erpSalesApi.getSalesOrders(),
      ]);
      setCustomers(customersData);
      setSalesOrders(ordersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async () => {
    try {
      await erpSalesApi.createCustomer(newCustomer);
      setIsCustomerDialogOpen(false);
      setNewCustomer({
        customer_code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
      toast.success('客户创建成功');
      loadData();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error('创建客户失败');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await erpSalesApi.deleteCustomer(id);
      toast.success('客户删除成功');
      loadData();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('删除客户失败');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">待审核</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">已审批</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">执行中</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">已完成</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">已取消</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{status}</span>;
    }
  };

  const filteredCustomers = customers.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer_code.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const filteredOrders = salesOrders.filter(item => {
    const matchSearch = item.order_no.toLowerCase().includes(searchText.toLowerCase()) ||
      item.customer_name?.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

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
                销售管理
              </CardTitle>
              <Button onClick={() => activeTab === 'customers' && setIsCustomerDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增客户
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                  style={{ maxWidth: 400 }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <Tabs defaultValue="orders" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="orders">销售订单</TabsTrigger>
                <TabsTrigger value="customers">客户管理</TabsTrigger>
                <TabsTrigger value="shipments">销售出库</TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">订单编号</th>
                        <th className="px-4 py-3 text-left font-medium">客户</th>
                        <th className="px-4 py-3 text-left font-medium">订单日期</th>
                        <th className="px-4 py-3 text-right font-medium">订单金额</th>
                        <th className="px-4 py-3 text-left font-medium">状态</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{order.order_no}</td>
                          <td className="px-4 py-3">{order.customer_name || '-'}</td>
                          <td className="px-4 py-3">{order.order_date}</td>
                          <td className="px-4 py-3 text-right">¥{order.total_amount?.toFixed(2)}</td>
                          <td className="px-4 py-3">{getStatusBadge(order.status || '')}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </TabsContent>

              <TabsContent value="customers">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">客户编码</th>
                        <th className="px-4 py-3 text-left font-medium">客户名称</th>
                        <th className="px-4 py-3 text-left font-medium">联系人</th>
                        <th className="px-4 py-3 text-left font-medium">联系电话</th>
                        <th className="px-4 py-3 text-left font-medium">邮箱</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{customer.customer_code}</td>
                          <td className="px-4 py-3">{customer.name}</td>
                          <td className="px-4 py-3">{customer.contact_person || '-'}</td>
                          <td className="px-4 py-3">{customer.phone || '-'}</td>
                          <td className="px-4 py-3">{customer.email || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit2 className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600"
                                onClick={() => handleDeleteCustomer(customer.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                删除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </TabsContent>

              <TabsContent value="shipments">
                <div className="text-center py-12 text-muted-foreground">
                  销售出库功能开发中...
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增客户</DialogTitle>
            <DialogDescription>填写客户信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_code">客户编码</Label>
              <Input
                id="customer_code"
                value={newCustomer.customer_code}
                onChange={(e) => setNewCustomer({ ...newCustomer, customer_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">客户名称</Label>
              <Input
                id="name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contact_person">联系人</Label>
                <Input
                  id="contact_person"
                  value={newCustomer.contact_person}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contact_person: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">地址</Label>
              <Input
                id="address"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCustomerDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateCustomer}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesManagement;
