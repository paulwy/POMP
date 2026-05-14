import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Camera,
  Mic,
  Plus,
  Eye,
  Trash2,
  Check,
  X,
  Clock,
  Map,
  Image,
  Volume2,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@/components/ui';
import SafeImage from '@/components/ui/SafeImage';
import { fieldService, FieldRecord, PhotoEvidence, AudioEvidence, CreateRecordRequest } from '@/services/field';

function FieldManagement() {
  const [records, setRecords] = useState<FieldRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<FieldRecord | null>(null);
  const [photos, setPhotos] = useState<PhotoEvidence[]>([]);
  const [audios, setAudios] = useState<AudioEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, address: '' });
  const [formData, setFormData] = useState<CreateRecordRequest>({
    task_title: '',
    task_description: '',
    latitude: 0,
    longitude: 0,
    location_name: '',
    address: '',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    loadRecords();
  }, []);

  useEffect(() => {
    if (isRecording && timerRef.current === null) {
      timerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } else if (!isRecording && timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const data = await fieldService.getUserRecords();
      setRecords(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecord = async () => {
    if (!formData.task_title.trim()) {
      toast.error('请输入任务标题');
      return;
    }

    try {
      setIsCreating(true);
      const request: CreateRecordRequest = {
        task_title: formData.task_title,
        task_description: formData.task_description,
        latitude: location.latitude,
        longitude: location.longitude,
        location_name: formData.location_name,
        address: formData.address,
      };
      await fieldService.createRecord(request);
      toast.success('外勤记录创建成功');
      loadRecords();
      setFormData({
        task_title: '',
        task_description: '',
        latitude: 0,
        longitude: 0,
        location_name: '',
        address: '',
      });
      setIsCreating(false);
    } catch (error) {
      toast.error((error as Error).message);
      setIsCreating(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      const loc = await fieldService.getCurrentLocation();
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: `纬度: ${loc.latitude.toFixed(6)}, 经度: ${loc.longitude.toFixed(6)}`,
      });
      setFormData((prev) => ({
        ...prev,
        latitude: loc.latitude,
        longitude: loc.longitude,
        address: `纬度: ${loc.latitude.toFixed(6)}, 经度: ${loc.longitude.toFixed(6)}`,
      }));
      toast.success('位置获取成功');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleViewDetail = async (record: FieldRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
    loadEvidences(record.id);
  };

  const loadEvidences = async (_recordId: string) => {
    try {
      setPhotos([]);
      setAudios([]);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedRecord || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    try {
      await fieldService.uploadPhoto(
        selectedRecord.id,
        file,
        undefined,
        selectedRecord.latitude,
        selectedRecord.longitude
      );
      toast.success('照片上传成功');
      e.target.value = '';
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleStartRecording = async () => {
    if (!selectedRecord) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          await fieldService.uploadAudio(
            selectedRecord!.id,
            file,
            recordDuration,
            undefined,
            selectedRecord!.latitude,
            selectedRecord!.longitude
          );
          toast.success('录音上传成功');
        } catch (error) {
          toast.error((error as Error).message);
        }

        setRecordDuration(0);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('确定要删除这条外勤记录吗？')) return;

    try {
      await fieldService.deleteRecord(id);
      toast.success('删除成功');
      loadRecords();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      in_progress: { label: '进行中', variant: 'secondary' as const },
      completed: { label: '已完成', variant: 'success' as const },
      pending: { label: '待处理', variant: 'outline' as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">外勤管理</h1>
          <p className="text-muted-foreground mt-1">记录现场位置、拍照和录音举证</p>
        </div>
        <Button className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4" />
          新建外勤记录
        </Button>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                新建外勤记录
              </DialogTitle>
              <DialogDescription>填写外勤任务信息并获取当前位置</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="task_title">任务标题 *</Label>
                <Input
                  id="task_title"
                  placeholder="请输入任务标题"
                  value={formData.task_title}
                  onChange={(e) => setFormData({ ...formData, task_title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task_description">任务描述</Label>
                <Textarea
                  id="task_description"
                  placeholder="请输入任务描述"
                  value={formData.task_description}
                  onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">当前位置</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    readOnly
                    value={location.address || '未获取位置'}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleGetLocation}
                    className="gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    获取位置
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location_name">地点名称</Label>
                  <Input
                    id="location_name"
                    placeholder="如：XX工地"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">详细地址</Label>
                  <Input
                    id="address"
                    placeholder="详细地址"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateRecord} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  创建记录
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              外勤记录列表
            </CardTitle>
            <CardDescription>共 {records.length} 条记录</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">暂无外勤记录</p>
              <p className="text-sm text-muted-foreground mt-2">点击上方按钮创建第一条记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{record.task_title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Map className="w-3 h-3" />
                          {record.location_name || '未知位置'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(record.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(record.status)}
                    <Button variant="ghost" size="icon" onClick={() => handleViewDetail(record)} title="查看详情">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-destructive hover:bg-destructive/10"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {selectedRecord?.task_title}
            </DialogTitle>
            <DialogDescription>外勤记录详情</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
            {selectedRecord && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Label className="text-sm text-muted-foreground">位置</Label>
                    <p className="font-medium mt-1">
                      {selectedRecord.location_name || '未设置'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRecord.address || `${selectedRecord.latitude.toFixed(6)}, ${selectedRecord.longitude.toFixed(6)}`}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Label className="text-sm text-muted-foreground">状态</Label>
                    <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      创建时间：{formatTime(selectedRecord.created_at)}
                    </p>
                  </div>
                </div>

                {selectedRecord.task_description && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Label className="text-sm text-muted-foreground">任务描述</Label>
                    <p className="font-medium mt-1">{selectedRecord.task_description}</p>
                  </div>
                )}

                <Tabs defaultValue="photos">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="photos" className="gap-2">
                      <Image className="w-4 h-4" />
                      照片举证 ({photos.length})
                    </TabsTrigger>
                    <TabsTrigger value="audios" className="gap-2">
                      <Volume2 className="w-4 h-4" />
                      录音举证 ({audios.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="photos" className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-muted cursor-pointer hover:border-blue-500 transition-colors">
                        <Camera className="w-5 h-5" />
                        <span>上传照片</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadPhoto}
                          className="hidden"
                        />
                      </label>
                      <Button variant="outline" className="gap-2">
                        <Camera className="w-4 h-4" />
                        拍照
                      </Button>
                    </div>
                    {photos.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                        <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">暂无照片证据</p>
                        <p className="text-sm text-muted-foreground mt-2">点击上方按钮上传或拍照</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <SafeImage
                              src={`/v1/field/photos/${photo.id}`}
                              alt={photo.description || '照片证据'}
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="audios" className="mt-4 space-y-4">
                    <div className="flex gap-3">
                      <Button
                        variant={isRecording ? 'destructive' : 'outline'}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className="gap-2"
                      >
                        {isRecording ? (
                          <>
                            <Check className="w-4 h-4" />
                            停止录音
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            开始录音
                          </>
                        )}
                      </Button>
                      {isRecording && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive">
                          <span className="w-2 h-2 rounded-full bg-destructive/100 animate-pulse" />
                          录音中: {formatDuration(recordDuration)}
                        </div>
                      )}
                    </div>
                    {audios.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                        <Volume2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">暂无录音证据</p>
                        <p className="text-sm text-muted-foreground mt-2">点击上方按钮开始录音</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {audios.map((audio) => (
                          <div
                            key={audio.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-full bg-blue-100">
                                <Volume2 className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{audio.file_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {audio.duration ? formatDuration(audio.duration) : '未知时长'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Volume2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FieldManagement;