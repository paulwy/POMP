import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BasePortalPageProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children?: React.ReactNode;
}

const BasePortalPage = ({ title, icon, description, children }: BasePortalPageProps) => {
  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 内容区域 */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* 面包屑导航 */}
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
              <ChevronLeft className="h-4 w-4" />
              返回门户首页
            </Link>
            <div className="flex items-center gap-3">
              {icon && <div className="text-primary">{icon}</div>}
              <h2 className="text-2xl font-bold">{title}</h2>
            </div>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>

          {children || (
            <Card>
              <CardHeader>
                <CardTitle>内容建设中</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">该栏目正在建设中，敬请期待...</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default BasePortalPage;