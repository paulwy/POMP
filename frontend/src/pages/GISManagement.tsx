import React, { useState, useEffect } from 'react';
import GISMap from '@/components/GISMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { MapPin, Users, Building, Warehouse, HardHat, RefreshCw, Eye, Navigation } from 'lucide-react';
import {
  gisApi,
  GisCustomer,
  GisProject,
  GisWarehouse,
  GisPersonnel,
} from '@/services/gis';
import { toast } from 'sonner';

interface MapMarker {
  id: string;
  longitude: number;
  latitude: number;
  name: string;
  type: 'customer' | 'supplier' | 'warehouse' | 'project' | 'personnel';
  info?: string;
  status?: string;
}

interface MarkerDetail {
  id: string;
  name: string;
  type: string;
  position: string;
  status: string;
  lastUpdate: string;
}

const GISManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [markerDetails, setMarkerDetails] = useState<MarkerDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [customers, setCustomers] = useState<GisCustomer[]>([]);
  const [projects, setProjects] = useState<GisProject[]>([]);
  const [warehouses, setWarehouses] = useState<GisWarehouse[]>([]);
  const [personnel, setPersonnel] = useState<GisPersonnel[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterMarkers();
  }, [activeTab, customers, projects, warehouses, personnel]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [customersData, projectsData, warehousesData, personnelData] = await Promise.all([
        gisApi.getCustomers(),
        gisApi.getProjects(),
        gisApi.getWarehouses(),
        gisApi.getPersonnel(),
      ]);
      setCustomers(customersData);
      setProjects(projectsData);
      setWarehouses(warehousesData);
      setPersonnel(personnelData);
    } catch (error) {
      console.error('加载GIS数据失败:', error);
      toast.error('加载地图数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMarkers = () => {
    switch (activeTab) {
      case 'customers':
        setMarkers(customers.map(c => ({
          id: c.id,
          longitude: c.longitude,
          latitude: c.latitude,
          name: c.name,
          type: 'customer' as const,
          info: c.level || c.customer_type || '正常',
          status: c.status,
        })));
        setMarkerDetails(customers.map(c => ({
          id: c.id,
          name: c.name,
          type: '客户',
          position: `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`,
          status: c.level || c.customer_type || '正常',
          lastUpdate: new Date(c.updated_at).toLocaleString(),
        })));
        break;
      case 'projects':
        setMarkers(projects.map(p => ({
          id: p.id,
          longitude: p.longitude,
          latitude: p.latitude,
          name: p.name,
          type: 'project' as const,
          info: p.project_type || '工程项目',
          status: p.status === 'in_progress' ? '施工中' : p.status === 'planning' ? '准备阶段' : p.status,
        })));
        setMarkerDetails(projects.map(p => ({
          id: p.id,
          name: p.name,
          type: '工程项目',
          position: `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
          status: p.status === 'in_progress' ? '施工中' : p.status === 'planning' ? '准备阶段' : p.status,
          lastUpdate: new Date(p.updated_at).toLocaleString(),
        })));
        break;
      case 'warehouses':
        setMarkers(warehouses.map(w => ({
          id: w.id,
          longitude: w.longitude,
          latitude: w.latitude,
          name: w.name,
          type: 'warehouse' as const,
          info: w.capacity || '正常',
          status: w.status,
        })));
        setMarkerDetails(warehouses.map(w => ({
          id: w.id,
          name: w.name,
          type: '仓库',
          position: `${w.latitude.toFixed(4)}, ${w.longitude.toFixed(4)}`,
          status: w.capacity || '正常',
          lastUpdate: new Date(w.updated_at).toLocaleString(),
        })));
        break;
      case 'personnel':
        setMarkers(personnel.map(p => ({
          id: p.id,
          longitude: p.longitude,
          latitude: p.latitude,
          name: p.name,
          type: 'personnel' as const,
          info: p.position || p.department || '外勤人员',
          status: p.status === 'active' ? '在场' : p.status,
        })));
        setMarkerDetails(personnel.map(p => ({
          id: p.id,
          name: p.name,
          type: '外勤人员',
          position: `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`,
          status: p.position || p.department || '未知',
          lastUpdate: p.last_location_time ? new Date(p.last_location_time).toLocaleString() : '未知',
        })));
        break;
      default:
        setMarkers([
          ...customers.map(c => ({
            id: c.id,
            longitude: c.longitude,
            latitude: c.latitude,
            name: c.name,
            type: 'customer' as const,
            info: c.level || c.customer_type || '正常',
            status: c.status,
          })),
          ...projects.map(p => ({
            id: p.id,
            longitude: p.longitude,
            latitude: p.latitude,
            name: p.name,
            type: 'project' as const,
            info: p.project_type || '工程项目',
            status: p.status,
          })),
          ...warehouses.map(w => ({
            id: w.id,
            longitude: w.longitude,
            latitude: w.latitude,
            name: w.name,
            type: 'warehouse' as const,
            info: w.capacity || '正常',
            status: w.status,
          })),
          ...personnel.map(p => ({
            id: p.id,
            longitude: p.longitude,
            latitude: p.latitude,
            name: p.name,
            type: 'personnel' as const,
            info: p.position || p.department || '外勤人员',
            status: p.status,
          })),
        ]);
        setMarkerDetails([]);
    }
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GIS地图管理</h1>
          <p className="text-muted-foreground mt-1">企业资源空间可视化管理系统</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadAllData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">客户总数</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Building className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">在建项目</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.status === 'in_progress').length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <HardHat className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">仓库数量</p>
                <p className="text-2xl font-bold">{warehouses.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Warehouse className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">在场人员</p>
                <p className="text-2xl font-bold">{personnel.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>地图视图</CardTitle>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  <MapPin className="h-4 w-4 mr-2" />
                  全部
                </TabsTrigger>
                <TabsTrigger value="customers">
                  <Building className="h-4 w-4 mr-2" />
                  客户
                </TabsTrigger>
                <TabsTrigger value="projects">
                  <HardHat className="h-4 w-4 mr-2" />
                  项目
                </TabsTrigger>
                <TabsTrigger value="warehouses">
                  <Warehouse className="h-4 w-4 mr-2" />
                  仓库
                </TabsTrigger>
                <TabsTrigger value="personnel">
                  <Users className="h-4 w-4 mr-2" />
                  人员
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <GISMap
                markers={markers}
                selectedMarker={selectedMarker || undefined}
                onMarkerClick={handleMarkerClick}
                height="600px"
                center={[116.4074, 39.9042]}
                zoom={11}
              />
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  标注详情
                </h3>
                {selectedMarker ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            selectedMarker.type === 'customer' ? '#3498db' :
                            selectedMarker.type === 'project' ? '#27ae60' :
                            selectedMarker.type === 'warehouse' ? '#f39c12' :
                            selectedMarker.type === 'personnel' ? '#9b59b6' : '#95a5a6',
                        }}
                      />
                      <span className="font-medium">{selectedMarker.name}</span>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">类型:</span>
                        <span>{selectedMarker.type === 'customer' && '客户'}
                          {selectedMarker.type === 'project' && '工程项目'}
                          {selectedMarker.type === 'warehouse' && '仓库'}
                          {selectedMarker.type === 'personnel' && '外勤人员'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">经度:</span>
                        <span className="font-mono">{selectedMarker.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">纬度:</span>
                        <span className="font-mono">{selectedMarker.latitude.toFixed(6)}</span>
                      </div>
                      {selectedMarker.info && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">备注:</span>
                          <span>{selectedMarker.info}</span>
                        </div>
                      )}
                      {selectedMarker.status && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">状态:</span>
                          <Badge variant={selectedMarker.status === '施工中' || selectedMarker.status === '在场' || selectedMarker.status === 'active' ? 'default' : 'secondary'}>
                            {selectedMarker.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="pt-3 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Navigation className="h-4 w-4 mr-2" />
                        导航到此位置
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>点击地图上的标注查看详情</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-h-80 overflow-y-auto">
                <h3 className="font-semibold mb-4">标注列表</h3>
                <div className="space-y-2">
                  {markerDetails.length > 0 ? (
                    markerDetails.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedMarker?.id === item.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          const marker = markers.find(m => m.id === item.id);
                          if (marker) setSelectedMarker(marker);
                        }}
                      >
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{item.status}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      选择筛选类别查看列表
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GISManagement;
