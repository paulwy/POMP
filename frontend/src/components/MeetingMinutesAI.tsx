import React, { useState } from 'react';
import { Sparkles, Loader2, Check, Lightbulb, FileText, Copy, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { meetingMinutesApi, MeetingMinutesResponse } from '@/services/meeting-minutes';
import { toast } from 'sonner';

interface MeetingMinutesAIProps {
  initialTitle?: string;
  initialDate?: string;
  initialAttendees?: string[];
  onMinutesGenerated?: (minutes: string) => void;
  onClose?: () => void;
}

export const MeetingMinutesAI: React.FC<MeetingMinutesAIProps> = ({
  initialTitle = '',
  initialDate = '',
  initialAttendees = [],
  onMinutesGenerated,
  onClose,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [style, setStyle] = useState<'formal' | 'brief' | 'detailed'>('formal');
  const [includeActionItems, setIncludeActionItems] = useState(true);
  const [includeDecisions, setIncludeDecisions] = useState(true);
  const [meetingTitle, setMeetingTitle] = useState(initialTitle);
  const [meetingDate, setMeetingDate] = useState(initialDate);
  const [attendeesInput, setAttendeesInput] = useState(
    initialAttendees.join('、')
  );
  const [meetingContent, setMeetingContent] = useState('');
  const [aiResult, setAiResult] = useState<MeetingMinutesResponse | null>(null);

  const handleGenerate = async () => {
    if (!meetingTitle.trim()) {
      toast.error('请输入会议主题');
      return;
    }
    if (!meetingContent.trim()) {
      toast.error('请输入会议内容');
      return;
    }

    setIsGenerating(true);
    try {
      const attendees = attendeesInput
        .split(/[、，,]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const result = await meetingMinutesApi.generateMinutes({
        meeting_title: meetingTitle,
        meeting_date: meetingDate || undefined,
        attendees: attendees.length > 0 ? attendees : undefined,
        meeting_content: meetingContent,
        style,
        include_action_items: includeActionItems,
        include_decisions: includeDecisions,
      });
      setAiResult(result);
      toast.success('会议纪要已生成');
    } catch (error) {
      console.error('生成会议纪要失败:', error);
      toast.error('生成会议纪要失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimize = async () => {
    if (!aiResult?.summary.trim()) {
      toast.error('请先生成会议纪要');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimized = await meetingMinutesApi.optimizeMinutes(
        aiResult.summary,
        style
      );
      if (aiResult) {
        setAiResult({ ...aiResult, summary: optimized });
      }
      toast.success('会议纪要已优化');
    } catch (error) {
      console.error('优化会议纪要失败:', error);
      toast.error('优化会议纪要失败，请稍后重试');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopyMinutes = async () => {
    if (!aiResult?.summary) return;
    try {
      await navigator.clipboard.writeText(aiResult.summary);
      toast.success('会议纪要已复制到剪贴板');
    } catch (error) {
      toast.error('复制失败，请手动复制');
    }
  };

  const handleUseMinutes = () => {
    if (!aiResult?.summary) return;
    if (onMinutesGenerated) {
      onMinutesGenerated(aiResult.summary);
    }
    setShowAIPanel(false);
    toast.success('会议纪要已应用');
  };

  const getStyleLabel = (s: string) => {
    switch (s) {
      case 'formal':
        return '正式';
      case 'brief':
        return '简洁';
      case 'detailed':
        return '详细';
      default:
        return s;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">AI会议纪要助手</Label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAIPanel(!showAIPanel)}
          className="text-primary hover:text-primary/80 hover:bg-primary/10"
        >
          {showAIPanel ? '隐藏AI助手' : '显示AI助手'}
        </Button>
      </div>

      {showAIPanel && (
        <Card className="border-purple-200 bg-primary/10/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI智能会议纪要
              </CardTitle>
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 会议信息输入 */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs">会议主题</Label>
                <Input
                  type="text"
                  placeholder="请输入会议主题"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">会议日期</Label>
                  <Input
                    type="text"
                    placeholder="2024-01-01"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">参会人员</Label>
                  <Input
                    type="text"
                    placeholder="张三、李四、王五"
                    value={attendeesInput}
                    onChange={(e) => setAttendeesInput(e.target.value)}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">会议内容</Label>
                <Textarea
                  placeholder="请输入会议讨论的内容要点..."
                  value={meetingContent}
                  onChange={(e) => setMeetingContent(e.target.value)}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
            </div>

            {/* 选项设置 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">输出风格</Label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as 'formal' | 'brief' | 'detailed')}
                  className="w-full border rounded-md p-2 h-8 text-sm"
                >
                  <option value="formal">📝 正式</option>
                  <option value="brief">📋 简洁</option>
                  <option value="detailed">📚 详细</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">包含内容</Label>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">行动项</span>
                    <Switch
                      checked={includeActionItems}
                      onCheckedChange={setIncludeActionItems}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs">决策内容</span>
                    <Switch
                      checked={includeDecisions}
                      onCheckedChange={setIncludeDecisions}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成纪要
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleOptimize}
                disabled={isOptimizing || !aiResult}
                variant="outline"
                size="sm"
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    优化中...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    优化纪要
                  </>
                )}
              </Button>
            </div>

            {/* 生成结果 */}
            {aiResult && (
              <div className="space-y-3 pt-3 border-t border-purple-200">
                {/* 会议摘要 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      会议纪要
                    </Label>
                    <Badge className="text-xs bg-primary/10 text-primary">
                      {getStyleLabel(style)}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-md p-3 text-sm border border-purple-200 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{aiResult.summary}</pre>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCopyMinutes}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      复制
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUseMinutes}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      应用
                    </Button>
                  </div>
                </div>

                {/* 关键要点 */}
                {aiResult.key_points.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      关键要点
                    </Label>
                    <div className="space-y-1">
                      {aiResult.key_points.map((point, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs bg-white rounded p-2 border border-gray-200"
                        >
                          <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 行动项 */}
                {aiResult.action_items.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Check className="h-3 w-3 text-primary" />
                      行动项
                    </Label>
                    <div className="space-y-1">
                      {aiResult.action_items.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs bg-blue-50 rounded p-2 border border-blue-200"
                        >
                          <Check className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 决策内容 */}
                {aiResult.decisions.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Check className="h-3 w-3 text-warning" />
                      会议决策
                    </Label>
                    <div className="space-y-1">
                      {aiResult.decisions.map((decision, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs bg-orange-50 rounded p-2 border border-orange-200"
                        >
                          <Check className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                          <span>{decision}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 下次会议建议 */}
                {aiResult.next_meeting && (
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      后续安排
                    </Label>
                    <div className="text-xs bg-gray-50 rounded p-2 border border-gray-200">
                      {aiResult.next_meeting}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};export default MeetingMinutesAI;