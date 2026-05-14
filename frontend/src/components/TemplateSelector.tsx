import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, Eye } from 'lucide-react';
import { templateService, Template } from '@/services/templates';

interface TemplateSelectorProps {
  category: string;
  templateType: string;
  onSelect?: (template: Template) => void;
  placeholder?: string;
  buttonLabel?: string;
}

export default function TemplateSelector({
  category,
  templateType,
  onSelect,
  placeholder = '选择模板',
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [category, templateType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await templateService.getTemplates({
        category,
        template_type: templateType,
        is_active: true,
      });
      setTemplates(data);
    } catch (error) {
      console.error('加载模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && onSelect) {
      onSelect(template);
    }
  };

  const handleView = (template: Template) => {
    setViewingTemplate(template);
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedTemplateId} onValueChange={handleSelect}>
        <SelectTrigger className="w-[250px]">
          <BookOpen className="h-4 w-4 mr-2" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>加载中...</SelectItem>
          ) : templates.length === 0 ? (
            <SelectItem value="none" disabled>暂无模板</SelectItem>
          ) : (
            templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                  {template.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">默认</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {selectedTemplateId && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) handleView(template);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {viewingTemplate && (
        <Dialog open={!!viewingTemplate} onOpenChange={() => setViewingTemplate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingTemplate.name}</DialogTitle>
              <DialogDescription>模板编码: {viewingTemplate.code}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewingTemplate.description && (
                <div>
                  <p className="text-sm text-muted-foreground">描述</p>
                  <p>{viewingTemplate.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-2">模板内容</p>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64">
                  {JSON.stringify(viewingTemplate.content, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
