import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  FileText,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Switch } from '@/components/ui/Switch';
import scheduleApi, { ScheduleEvent, CreateScheduleEventRequest, UpdateScheduleEventRequest } from '@/services/schedule';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import useAuthStore from '@/store/useAuthStore';
import MeetingMinutesAI from '@/components/MeetingMinutesAI';

type ScheduleManagementProps = {
  defaultTab?: 'my' | 'all';
};

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ defaultTab = 'my' }) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  const [eventForm, setEventForm] = useState<CreateScheduleEventRequest>({
    title: '',
    description: '',
    event_type: 'meeting',
    start_time: dayjs().add(1, 'hour').toISOString(),
    end_time: dayjs().add(2, 'hour').toISOString(),
    is_all_day: false,
    location: '',
    organizer_id: user?.id || '',
    participant_ids: [],
    reminder_minutes: 30,
    is_recurring: false,
    color: '#3B82F6',
  });

  const COLORS = [
    { value: '#3B82F6', label: '蓝色' },
    { value: '#10B981', label: '绿色' },
    { value: '#F59E0B', label: '橙色' },
    { value: '#EF4444', label: '红色' },
    { value: '#8B5CF6', label: '紫色' },
    { value: '#EC4899', label: '粉色' },
  ];

  const EVENT_TYPES = [
    { value: 'meeting', label: '会议' },
    { value: 'task', label: '任务' },
    { value: 'reminder', label: '提醒' },
  ];

  useEffect(() => {
    fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await scheduleApi.getEvents({
        organizer_id: activeTab === 'my' ? user?.id : undefined,
        page: 1,
        page_size: 50,
      });
      setEvents(data.data || []);
    } catch (error) {
      console.error('获取日程失败:', error);
      toast.error('获取日程列表失败');
    } finally {
      setLoading(false);
    }
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      event_type: 'meeting',
      start_time: dayjs().add(1, 'hour').toISOString(),
      end_time: dayjs().add(2, 'hour').toISOString(),
      is_all_day: false,
      location: '',
      organizer_id: user?.id || '',
      participant_ids: [],
      reminder_minutes: 30,
      is_recurring: false,
      color: '#3B82F6',
    });
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim()) {
      toast.error('请输入日程标题');
      return;
    }

    try {
      await scheduleApi.createEvent(eventForm);
      toast.success('日程创建成功');
      setShowEventDialog(false);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error('创建日程失败:', error);
      toast.error('创建日程失败');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    try {
      const updateData: UpdateScheduleEventRequest = {
        title: eventForm.title,
        description: eventForm.description,
        event_type: eventForm.event_type,
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        is_all_day: eventForm.is_all_day,
        location: eventForm.location,
        participant_ids: eventForm.participant_ids,
        reminder_minutes: eventForm.reminder_minutes,
        is_recurring: eventForm.is_recurring,
        recurrence_rule: eventForm.recurrence_rule,
        color: eventForm.color,
      };
      await scheduleApi.updateEvent(editingEvent.id, updateData);
      toast.success('日程更新成功');
      setShowEventDialog(false);
      setEditingEvent(null);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error('更新日程失败:', error);
      toast.error('更新日程失败');
    }
  };

  const handleDeleteEvent = async (event: ScheduleEvent) => {
    if (!confirm(`确定要删除日程"${event.title}"吗?`)) return;

    try {
      await scheduleApi.deleteEvent(event.id);
      toast.success('日程删除成功');
      fetchEvents();
    } catch (error) {
      console.error('删除日程失败:', error);
      toast.error('删除日程失败');
    }
  };

  const openEventDialog = (event?: ScheduleEvent) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_time: event.start_time,
        end_time: event.end_time,
        is_all_day: event.is_all_day,
        location: event.location || '',
        organizer_id: event.organizer_id,
        participant_ids: event.participant_ids,
        reminder_minutes: event.reminder_minutes,
        is_recurring: event.is_recurring,
        recurrence_rule: event.recurrence_rule,
        color: event.color,
      });
    } else {
      setEditingEvent(null);
      resetEventForm();
    }
    setShowEventDialog(true);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'task':
        return <FileText className="h-4 w-4" />;
      case 'reminder':
        return <Bell className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: '进行中', variant: 'default' },
      cancelled: { label: '已取消', variant: 'destructive' },
      completed: { label: '已完成', variant: 'secondary' },
    };
    const config = statusConfig[status.toLowerCase()] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (datetime: string, isAllDay: boolean) => {
    if (isAllDay) {
      return dayjs(datetime).format('YYYY-MM-DD');
    }
    return dayjs(datetime).format('YYYY-MM-DD HH:mm');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">日程管理</h1>
          <p className="text-muted-foreground mt-1">管理您的日程安排和会议</p>
        </div>
        <Button onClick={() => openEventDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增日程
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="my" className="gap-2">
            <Calendar className="h-4 w-4" />
            我的日程
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Calendar className="h-4 w-4" />
            全部日程
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无日程</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-2 h-12 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getEventTypeIcon(event.event_type)}
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              {getStatusBadge(event.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(event.start_time, event.is_all_day)}
                                {!event.is_all_day && ` - ${dayjs(event.end_time).format('HH:mm')}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              )}
                              {event.participant_ids.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {event.participant_ids.length} 人参与
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {event.event_type === 'meeting' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // 打开编辑对话框并自动填充会议信息到会议纪要助手
                                openEventDialog(event);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                              会议纪要
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => openEventDialog(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleDeleteEvent(event)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardContent className="space-y-4 pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">暂无日程</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className="w-2 h-12 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getEventTypeIcon(event.event_type)}
                              <h3 className="font-semibold text-lg">{event.title}</h3>
                              {getStatusBadge(event.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatDateTime(event.start_time, event.is_all_day)}
                                {!event.is_all_day && ` - ${dayjs(event.end_time).format('HH:mm')}`}
                              </span>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? '编辑日程' : '新增日程'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">标题 *</Label>
              <Input 
                id="event-title" 
                value={eventForm.title} 
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} 
                placeholder="请输入日程标题" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">类型</Label>
                <select 
                  id="event-type" 
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  value={eventForm.event_type} 
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                >
                  {EVENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-color">颜色</Label>
                <div className="flex gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setEventForm({ ...eventForm, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        eventForm.color === color.value ? 'border-black' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="event-start">开始时间</Label>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="all-day" 
                    checked={eventForm.is_all_day ?? false} 
                    onCheckedChange={(checked) => setEventForm({ ...eventForm, is_all_day: checked })}
                  />
                  <Label htmlFor="all-day">全天</Label>
                </div>
              </div>
              <Input 
                id="event-start" 
                type={(eventForm.is_all_day ?? false) ? "date" : "datetime-local"} 
                value={
                  (eventForm.is_all_day ?? false) 
                    ? dayjs(eventForm.start_time).format('YYYY-MM-DD') 
                    : dayjs(eventForm.start_time).format('YYYY-MM-DDTHH:mm')
                } 
                onChange={(e) => {
                  let newStartTime = e.target.value;
                  if ((eventForm.is_all_day ?? false)) {
                    newStartTime = dayjs(newStartTime).startOf('day').toISOString();
                  } else {
                    newStartTime = dayjs(newStartTime).toISOString();
                  }
                  setEventForm({ ...eventForm, start_time: newStartTime });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-end">结束时间</Label>
              <Input 
                id="event-end" 
                type={(eventForm.is_all_day ?? false) ? "date" : "datetime-local"} 
                value={
                  (eventForm.is_all_day ?? false) 
                    ? dayjs(eventForm.end_time).format('YYYY-MM-DD') 
                    : dayjs(eventForm.end_time).format('YYYY-MM-DDTHH:mm')
                } 
                onChange={(e) => {
                  let newEndTime = e.target.value;
                  if ((eventForm.is_all_day ?? false)) {
                    newEndTime = dayjs(newEndTime).endOf('day').toISOString();
                  } else {
                    newEndTime = dayjs(newEndTime).toISOString();
                  }
                  setEventForm({ ...eventForm, end_time: newEndTime });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">地点</Label>
              <Input 
                id="event-location" 
                value={eventForm.location || ''} 
                onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} 
                placeholder="请输入地点" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">描述</Label>
              <textarea 
                id="event-desc" 
                className="w-full h-20 px-3 py-2 border rounded-md"
                value={eventForm.description || ''} 
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} 
                placeholder="请输入日程描述" 
              />
            </div>

            {/* AI会议纪要助手 */}
            {eventForm.event_type === 'meeting' && (
              <MeetingMinutesAI
                initialTitle={eventForm.title}
                initialDate={dayjs(eventForm.start_time).format('YYYY-MM-DD')}
                onMinutesGenerated={(minutes) => {
                  setEventForm({ ...eventForm, description: minutes });
                }}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-reminder">提前提醒（分钟）</Label>
                <Input 
                  id="event-reminder" 
                  type="number" 
                  value={eventForm.reminder_minutes || ''} 
                  onChange={(e) => setEventForm({ ...eventForm, reminder_minutes: parseInt(e.target.value) || 0 })} 
                  placeholder="30" 
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>取消</Button>
            <Button onClick={editingEvent ? handleUpdateEvent : handleCreateEvent}>
              {editingEvent ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagement;
