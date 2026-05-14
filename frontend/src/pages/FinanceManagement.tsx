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
  erpFinanceApi, 
  Account, 
  Voucher, 
  Payment,
  CreateAccountRequest
} from '@/services/erp';

const FinanceManagement = () => {
  const [activeTab, setActiveTab] = useState('accounts');
  const [searchText, setSearchText] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newAccount, setNewAccount] = useState<CreateAccountRequest>({
    account_code: '',
    account_name: '',
    account_type: 'asset',
    parent_id: '',
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsData, vouchersData, paymentsData] = await Promise.all([
        erpFinanceApi.getAccounts(),
        erpFinanceApi.getVouchers(),
        erpFinanceApi.getPayments(),
      ]);
      setAccounts(accountsData);
      setVouchers(vouchersData);
      setPayments(paymentsData);
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

  const handleCreateAccount = async () => {
    try {
      await erpFinanceApi.createAccount(newAccount);
      setIsAccountDialogOpen(false);
      setNewAccount({
        account_code: '',
        account_name: '',
        account_type: 'asset',
        parent_id: '',
      });
      toast.success('科目创建成功');
      loadData();
    } catch (error) {
      console.error('Failed to create account:', error);
      toast.error('创建科目失败');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await erpFinanceApi.deleteAccount(id);
      toast.success('科目删除成功');
      loadData();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('删除科目失败');
    }
  };

  const getAccountTypeText = (type: string) => {
    switch (type) {
      case 'asset': return '资产';
      case 'liability': return '负债';
      case 'equity': return '权益';
      case 'revenue': return '收入';
      case 'expense': return '费用';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">草稿</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">已审核</span>;
      case 'posted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">已过账</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-800 text-xs">已取消</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{status}</span>;
    }
  };

  const filteredAccounts = accounts.filter(item => {
    const matchSearch = item.account_name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.account_code.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const filteredVouchers = vouchers.filter(item => {
    const matchSearch = item.voucher_no.toLowerCase().includes(searchText.toLowerCase());
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
                财务管理
              </CardTitle>
              <Button onClick={() => activeTab === 'accounts' && setIsAccountDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新增科目
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
            <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="accounts">会计科目</TabsTrigger>
                <TabsTrigger value="vouchers">凭证管理</TabsTrigger>
                <TabsTrigger value="payments">收付款</TabsTrigger>
              </TabsList>

              <TabsContent value="accounts">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">科目编码</th>
                        <th className="px-4 py-3 text-left font-medium">科目名称</th>
                        <th className="px-4 py-3 text-left font-medium">科目类型</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{account.account_code}</td>
                          <td className="px-4 py-3">{account.account_name}</td>
                          <td className="px-4 py-3">{getAccountTypeText(account.account_type)}</td>
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
                                onClick={() => handleDeleteAccount(account.id)}
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

              <TabsContent value="vouchers">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">凭证编号</th>
                        <th className="px-4 py-3 text-left font-medium">凭证日期</th>
                        <th className="px-4 py-3 text-left font-medium">摘要</th>
                        <th className="px-4 py-3 text-left font-medium">状态</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredVouchers.map((voucher) => (
                        <tr key={voucher.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{voucher.voucher_no}</td>
                          <td className="px-4 py-3">{voucher.voucher_date}</td>
                          <td className="px-4 py-3">{voucher.description || '-'}</td>
                          <td className="px-4 py-3">{getStatusBadge(voucher.status || '')}</td>
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

              <TabsContent value="payments">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">单据编号</th>
                        <th className="px-4 py-3 text-left font-medium">类型</th>
                        <th className="px-4 py-3 text-left font-medium">日期</th>
                        <th className="px-4 py-3 text-right font-medium">金额</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{payment.payment_no}</td>
                          <td className="px-4 py-3">{payment.payment_type === 'receive' ? '收款' : '付款'}</td>
                          <td className="px-4 py-3">{payment.payment_date}</td>
                          <td className="px-4 py-3 text-right">¥{payment.amount?.toFixed(2)}</td>
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
            </Tabs>
          </Card>
        </main>
      </div>

      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增会计科目</DialogTitle>
            <DialogDescription>填写会计科目信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="account_code">科目编码</Label>
              <Input
                id="account_code"
                value={newAccount.account_code}
                onChange={(e) => setNewAccount({ ...newAccount, account_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account_name">科目名称</Label>
              <Input
                id="account_name"
                value={newAccount.account_name}
                onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account_type">科目类型</Label>
              <select
                id="account_type"
                value={newAccount.account_type}
                onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="asset">资产</option>
                <option value="liability">负债</option>
                <option value="equity">权益</option>
                <option value="revenue">收入</option>
                <option value="expense">费用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAccountDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateAccount}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceManagement;
