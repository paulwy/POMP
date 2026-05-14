import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Package
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { 
  erpInventoryApi, 
  Product, 
  Warehouse,
  Inventory,
  CreateProductRequest,
  CreateWarehouseRequest
} from '@/services/erp';

const InventoryManagement = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [searchText, setSearchText] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newProduct, setNewProduct] = useState<CreateProductRequest>({
    product_code: '',
    name: '',
    description: '',
    category: '',
    unit: '',
    spec: '',
    purchase_price: 0,
    sale_price: 0,
    min_stock: 0,
    max_stock: 0,
  });

  const [newWarehouse, setNewWarehouse] = useState<CreateWarehouseRequest>({
    warehouse_code: '',
    name: '',
    location: '',
    manager_id: '',
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, warehousesData, inventoryData] = await Promise.all([
        erpInventoryApi.getProducts(),
        erpInventoryApi.getWarehouses(),
        erpInventoryApi.getInventory(),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setInventory(inventoryData);
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

  const handleCreateProduct = async () => {
    try {
      await erpInventoryApi.createProduct(newProduct);
      setIsProductDialogOpen(false);
      setNewProduct({
        product_code: '',
        name: '',
        description: '',
        category: '',
        unit: '',
        spec: '',
        purchase_price: 0,
        sale_price: 0,
        min_stock: 0,
        max_stock: 0,
      });
      toast.success('产品创建成功');
      loadData();
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('创建产品失败');
    }
  };

  const handleCreateWarehouse = async () => {
    try {
      await erpInventoryApi.createWarehouse(newWarehouse);
      setIsWarehouseDialogOpen(false);
      setNewWarehouse({
        warehouse_code: '',
        name: '',
        location: '',
        manager_id: '',
      });
      toast.success('仓库创建成功');
      loadData();
    } catch (error) {
      console.error('Failed to create warehouse:', error);
      toast.error('创建仓库失败');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await erpInventoryApi.deleteProduct(id);
      toast.success('产品删除成功');
      loadData();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('删除产品失败');
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    try {
      await erpInventoryApi.deleteWarehouse(id);
      toast.success('仓库删除成功');
      loadData();
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
      toast.error('删除仓库失败');
    }
  };

  const getStatusBadge = (product: Product) => {
    const productInventory = inventory.filter(inv => inv.product_id === product.id);
    const totalQuantity = productInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    
    if (totalQuantity < product.min_stock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
          库存偏低
        </span>
      );
    } else if (product.max_stock && totalQuantity > product.max_stock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
          库存充足
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
          正常
        </span>
      );
    }
  };

  const getProductTotalQuantity = (productId: string) => {
    return inventory.filter(inv => inv.product_id === productId).reduce((sum, inv) => sum + inv.quantity, 0);
  };

  const filteredProducts = products.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchText.toLowerCase());
    return matchSearch;
  });

  const filteredWarehouses = warehouses.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.warehouse_code.toLowerCase().includes(searchText.toLowerCase());
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
                <Package className="h-6 w-6 text-primary" />
                库存管理
              </CardTitle>
              <Button onClick={() => activeTab === 'products' ? setIsProductDialogOpen(true) : setIsWarehouseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {activeTab === 'products' ? '新增产品' : '新增仓库'}
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
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="products">产品管理</TabsTrigger>
                <TabsTrigger value="warehouses">仓库管理</TabsTrigger>
                <TabsTrigger value="inventory">库存查询</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">产品编码</th>
                        <th className="px-4 py-3 text-left font-medium">产品名称</th>
                        <th className="px-4 py-3 text-left font-medium">规格型号</th>
                        <th className="px-4 py-3 text-left font-medium">单位</th>
                        <th className="px-4 py-3 text-left font-medium">库存数量</th>
                        <th className="px-4 py-3 text-left font-medium">库存范围</th>
                        <th className="px-4 py-3 text-right font-medium">采购价</th>
                        <th className="px-4 py-3 text-right font-medium">销售价</th>
                        <th className="px-4 py-3 text-left font-medium">状态</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{product.product_code}</td>
                          <td className="px-4 py-3">{product.name}</td>
                          <td className="px-4 py-3">{product.spec || '-'}</td>
                          <td className="px-4 py-3">{product.unit || '-'}</td>
                          <td className="px-4 py-3">{getProductTotalQuantity(product.id)}</td>
                          <td className="px-4 py-3">{product.min_stock} - {product.max_stock || '-'}</td>
                          <td className="px-4 py-3 text-right">¥{product.purchase_price?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">¥{product.sale_price?.toFixed(2)}</td>
                          <td className="px-4 py-3">{getStatusBadge(product)}</td>
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
                                onClick={() => handleDeleteProduct(product.id)}
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

              <TabsContent value="warehouses">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">仓库编码</th>
                        <th className="px-4 py-3 text-left font-medium">仓库名称</th>
                        <th className="px-4 py-3 text-left font-medium">位置</th>
                        <th className="px-4 py-3 text-left font-medium">状态</th>
                        <th className="px-4 py-3 text-left font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredWarehouses.map((warehouse) => (
                        <tr key={warehouse.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{warehouse.warehouse_code}</td>
                          <td className="px-4 py-3">{warehouse.name}</td>
                          <td className="px-4 py-3">{warehouse.location || '-'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              warehouse.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {warehouse.is_active ? '启用' : '停用'}
                            </span>
                          </td>
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
                                onClick={() => handleDeleteWarehouse(warehouse.id)}
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

              <TabsContent value="inventory">
                {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">产品编码</th>
                        <th className="px-4 py-3 text-left font-medium">产品名称</th>
                        <th className="px-4 py-3 text-left font-medium">仓库</th>
                        <th className="px-4 py-3 text-left font-medium">库存数量</th>
                        <th className="px-4 py-3 text-left font-medium">可用数量</th>
                        <th className="px-4 py-3 text-left font-medium">预留数量</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {inventory.map((inv) => (
                        <tr key={inv.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">{inv.product_code || '-'}</td>
                          <td className="px-4 py-3">{inv.product_name || '-'}</td>
                          <td className="px-4 py-3">{inv.warehouse_name || '-'}</td>
                          <td className="px-4 py-3">{inv.quantity}</td>
                          <td className="px-4 py-3">{inv.available_quantity}</td>
                          <td className="px-4 py-3">{inv.reserved_quantity}</td>
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

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增产品</DialogTitle>
            <DialogDescription>填写产品信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product_code">产品编码</Label>
              <Input
                id="product_code"
                value={newProduct.product_code}
                onChange={(e) => setNewProduct({ ...newProduct, product_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">产品名称</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">单位</Label>
                <Input
                  id="unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="spec">规格型号</Label>
              <Input
                id="spec"
                value={newProduct.spec}
                onChange={(e) => setNewProduct({ ...newProduct, spec: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchase_price">采购价</Label>
                <Input
                  type="number"
                  id="purchase_price"
                  value={newProduct.purchase_price}
                  onChange={(e) => setNewProduct({ ...newProduct, purchase_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sale_price">销售价</Label>
                <Input
                  type="number"
                  id="sale_price"
                  value={newProduct.sale_price}
                  onChange={(e) => setNewProduct({ ...newProduct, sale_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min_stock">最小库存</Label>
                <Input
                  type="number"
                  id="min_stock"
                  value={newProduct.min_stock}
                  onChange={(e) => setNewProduct({ ...newProduct, min_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_stock">最大库存</Label>
                <Input
                  type="number"
                  id="max_stock"
                  value={newProduct.max_stock}
                  onChange={(e) => setNewProduct({ ...newProduct, max_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsProductDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateProduct}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增仓库</DialogTitle>
            <DialogDescription>填写仓库信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="warehouse_code">仓库编码</Label>
              <Input
                id="warehouse_code"
                value={newWarehouse.warehouse_code}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, warehouse_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">仓库名称</Label>
              <Input
                id="name"
                value={newWarehouse.name}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">位置</Label>
              <Input
                id="location"
                value={newWarehouse.location}
                onChange={(e) => setNewWarehouse({ ...newWarehouse, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsWarehouseDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateWarehouse}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryManagement;
