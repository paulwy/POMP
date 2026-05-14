import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Portal from '@/pages/Portal';
import UserManagement from '@/pages/UserManagement';
import RoleManagement from '@/pages/RoleManagement';
import ApprovalTasks from '@/pages/ApprovalTasks';
import ApprovalDetail from '@/pages/ApprovalDetail';
import NewApproval from '@/pages/NewApproval';
import ApprovalHistory from '@/pages/ApprovalHistory';
import WorkflowManagement from '@/pages/WorkflowManagement';
import Profile from '@/pages/Profile';
import ContentManagement from '@/pages/ContentManagement';
import WebsiteManagement from '@/pages/WebsiteManagement';
import HrManagement from '@/pages/HrManagement';
import DictManagement from '@/pages/DictManagement';
import OrganizationManagement from '@/pages/OrganizationManagement';
import ConfigurationCenter from '@/pages/ConfigurationCenter';
import ProductionDocsManagement from '@/pages/ProductionDocsManagement';
import HelpCenter from '@/pages/HelpCenter';
import DocumentAiAssistant from '@/components/DocumentAiAssistant';
import ScheduleManagement from '@/pages/ScheduleManagement';
import CategoryPage from '@/pages/portal/CategoryPage';
import ArticleDetailPage from '@/pages/portal/ArticleDetailPage';
import ProductsPage from '@/pages/portal/ProductsPage';
import AboutPage from '@/pages/portal/AboutPage';
import HonorsPage from '@/pages/portal/HonorsPage';
import ContactPage from '@/pages/portal/ContactPage';
import ChangePassword from '@/pages/ChangePassword';
import FieldManagement from '@/pages/FieldManagement';
import ContractManagement from '@/pages/ContractManagement';
import MaterialLibrary from '@/pages/MaterialLibrary';
import InventoryManagement from '@/pages/InventoryManagement';
import PurchaseManagement from '@/pages/PurchaseManagement';
import SalesManagement from '@/pages/SalesManagement';
import FinanceManagement from '@/pages/FinanceManagement';
import TemplateManagement from '@/pages/TemplateManagement';
import GISManagement from '@/pages/GISManagement';
import useAuthStore from '@/store/useAuthStore';
import useViewStore from '@/store/useViewStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const currentView = useViewStore((state) => state.currentView);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 当视图切换时强制重新渲染主内容
  const renderMainContent = useCallback(() => {
    if (currentView === 'workbench') {
      return <Home key="workbench" />;
    } else {
      return <Portal key="portal" />;
    }
  }, [currentView]);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {renderMainContent()}
            </ProtectedRoute>
          }
        />
        {/* 工作台路由 */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/content-management"
          element={
            <ProtectedRoute requireAdmin>
              <ContentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/website-management"
          element={
            <ProtectedRoute requireAdmin>
              <WebsiteManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <ProtectedRoute>
              <ApprovalTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/pending"
          element={
            <ProtectedRoute>
              <ApprovalTasks defaultTab="pending" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/my-requests"
          element={
            <ProtectedRoute>
              <ApprovalTasks defaultTab="initiated" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/history"
          element={
            <ProtectedRoute>
              <ApprovalHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/new"
          element={
            <ProtectedRoute>
              <NewApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/approvals/:taskId"
          element={
            <ProtectedRoute>
              <ApprovalDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workflow-settings"
          element={
            <ProtectedRoute requireAdmin>
              <WorkflowManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr"
          element={
            <ProtectedRoute>
              <HrManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/employees"
          element={
            <ProtectedRoute>
              <HrManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/attendance"
          element={
            <ProtectedRoute>
              <HrManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/leave"
          element={
            <ProtectedRoute>
              <HrManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <ScheduleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule/my"
          element={
            <ProtectedRoute>
              <ScheduleManagement defaultTab="my" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule/meetings"
          element={
            <ProtectedRoute>
              <ScheduleManagement defaultTab="all" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/config-center"
          element={
            <ProtectedRoute requireAdmin>
              <ConfigurationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/dict"
          element={
            <ProtectedRoute requireAdmin>
              <DictManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/roles"
          element={
            <ProtectedRoute requireAdmin>
              <RoleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system/templates"
          element={
            <ProtectedRoute requireAdmin>
              <TemplateManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute requireAdmin>
              <OrganizationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-docs"
          element={
            <ProtectedRoute requireAdmin>
              <ProductionDocsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-docs/documents"
          element={
            <ProtectedRoute requireAdmin>
              <ProductionDocsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-docs/standards"
          element={
            <ProtectedRoute requireAdmin>
              <ProductionDocsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-docs/safety"
          element={
            <ProtectedRoute requireAdmin>
              <ProductionDocsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-docs/quality"
          element={
            <ProtectedRoute requireAdmin>
              <ProductionDocsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/document-ai"
          element={
            <ProtectedRoute requireAdmin>
              <DocumentAiAssistant />
            </ProtectedRoute>
          }
        />
        {/* 外勤管理路由 */}
        <Route
          path="/field"
          element={
            <ProtectedRoute>
              <FieldManagement />
            </ProtectedRoute>
          }
        />
        {/* GIS地图路由 */}
        <Route
          path="/gis"
          element={
            <ProtectedRoute>
              <GISManagement />
            </ProtectedRoute>
          }
        />
        {/* 合同管理路由 */}
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <ContractManagement />
            </ProtectedRoute>
          }
        />
        {/* 物料库路由 */}
        <Route
          path="/materials"
          element={
            <ProtectedRoute>
              <MaterialLibrary />
            </ProtectedRoute>
          }
        />
        {/* ERP库存管理路由 */}
        <Route
          path="/warehouse/inventory"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />
        {/* ERP采购管理路由 */}
        <Route
          path="/warehouse/purchase"
          element={
            <ProtectedRoute>
              <PurchaseManagement />
            </ProtectedRoute>
          }
        />
        {/* ERP销售管理路由 */}
        <Route
          path="/warehouse/sales"
          element={
            <ProtectedRoute>
              <SalesManagement />
            </ProtectedRoute>
          }
        />
        {/* ERP财务管理路由 */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <FinanceManagement />
            </ProtectedRoute>
          }
        />
        {/* 门户专用页面（优先级高于通配符） */}
        <Route
          path="/portal/category/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/category/about"
          element={
            <ProtectedRoute>
              <AboutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/category/honors"
          element={
            <ProtectedRoute>
              <HonorsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/category/news"
          element={
            <ProtectedRoute>
              <CategoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/contact"
          element={
            <ProtectedRoute>
              <ContactPage />
            </ProtectedRoute>
          }
        />
        {/* 门户通用路由 */}
        <Route
          path="/portal/category/:categoryCode"
          element={
            <ProtectedRoute>
              <CategoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/articles/:articleId"
          element={
            <ProtectedRoute>
              <ArticleDetailPage />
            </ProtectedRoute>
          }
        />
            <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
