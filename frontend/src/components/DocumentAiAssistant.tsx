import React, { useState, useEffect } from 'react';
import { Sparkles, Edit, Code, FileText, Layout, RefreshCw, Copy, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Badge } from './ui/Badge';
import { Label } from './ui/Label';
import SafeImage from './ui/SafeImage';
import { aiService, type AiServiceStatus } from '../services/ai';

interface DocType {
  value: string;
  label: string;
}

const DOC_TYPES: DocType[] = [
  { value: 'api_endpoint', label: 'API端点文档' },
  { value: 'readme', label: 'README文档' },
  { value: 'user_guide', label: '用户指南' },
  { value: 'technical_doc', label: '技术文档' },
  { value: 'code_comment', label: '代码注释' },
];

const PROGRAMMING_LANGUAGES = [
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
];

const IMAGE_STYLES = [
  { value: 'realistic', label: '写实风格' },
  { value: 'anime', label: '动漫风格' },
  { value: 'artistic', label: '艺术风格' },
  { value: 'design', label: '设计风格' },
  { value: 'sketch', label: '素描风格' },
];

const IMAGE_SIZES = [
  { value: '800x600', label: '800×600 (标准)' },
  { value: '1024x768', label: '1024×768 (大型)' },
  { value: '1024x1024', label: '1024×1024 (正方形)' },
];

interface DocumentChange {
  change_type: string;
  description: string;
  line_number?: number;
}

// interface GeneratedImage {
//   url: string;
//   alt_text: string;
// }

interface OptimizeResult {
  suggested: string;
  changes?: DocumentChange[];
  reasoning?: string;
}

interface ApiDocResult {
  title: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
    default?: string;
  }>;
  returns?: string;
  examples?: Array<{
    name: string;
    code: string;
    description: string;
  }>;
  notes?: string;
}

interface OutlineResult {
  sections: Array<{
    title: string;
    level: number;
    content: string;
  }>;
}

interface GenerateImagesResult {
  images: Array<{
    url: string;
    alt_text: string;
  }>;
  backend: string;
}

type AiResult = OptimizeResult | ApiDocResult | OutlineResult | GenerateImagesResult | string | string[];

const DocumentAiAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('optimize');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AiServiceStatus | null>(null);

  // 文档优化状态
  const [optimizeContent, setOptimizeContent] = useState('');
  const [optimizeDocType, setOptimizeDocType] = useState('technical_doc');

  // API文档生成状态
  const [codeContent, setCodeContent] = useState('');
  const [apiDocType, setApiDocType] = useState('api_endpoint');
  const [language, setLanguage] = useState('rust');

  // 大纲生成状态
  const [outlineTopic, setOutlineTopic] = useState('');
  const [outlineDocType, setOutlineDocType] = useState('technical_doc');

  // Markdown格式化状态
  const [markdownContent, setMarkdownContent] = useState('');

  // 文生图状态
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [numImages, setNumImages] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentBackend, setCurrentBackend] = useState<string>('');

  // 获取AI服务状态
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await aiService.getStatus();
        setAiStatus(status);
      } catch (err) {
        console.error('Failed to get AI status:', err);
      }
    };
    fetchStatus();
  }, []);

  const copyToClipboard = (text: AiResult, id: string) => {
    let content: string;
    if (typeof text === 'string') {
      content = text;
    } else if (Array.isArray(text)) {
      content = text.join('\n');
    } else {
      content = JSON.stringify(text, null, 2);
    }
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const callApi = async (endpoint: string, data: unknown) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/v1/document-ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        setResult(result.data);
      } else {
        setError(result.error || '请求失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    if (!optimizeContent.trim()) {
      setError('请输入要优化的文档内容');
      return;
    }
    callApi('optimize', {
      content: optimizeContent,
      doc_type: optimizeDocType,
    });
  };

  const handleGenerateApiDoc = () => {
    if (!codeContent.trim()) {
      setError('请输入代码内容');
      return;
    }
    callApi('generate-api-doc', {
      code: codeContent,
      language: language,
      doc_type: apiDocType,
    });
  };

  const handleGenerateOutline = () => {
    if (!outlineTopic.trim()) {
      setError('请输入文档主题');
      return;
    }
    callApi('generate-outline', {
      topic: outlineTopic,
      doc_type: outlineDocType,
    });
  };

  const handleFormatMarkdown = () => {
    if (!markdownContent.trim()) {
      setError('请输入Markdown内容');
      return;
    }
    callApi('format-markdown', {
      content: markdownContent,
    });
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      setError('请输入图片描述');
      return;
    }
    setLoading(true);
    setError(null);
    setGeneratedImages([]);
    try {
      const [width, height] = imageSize.split('x').map(Number);
      const response = await aiService.generateImage({
        prompt: imagePrompt,
        width,
        height,
        num_images: numImages,
        style: imageStyle,
      });
      setGeneratedImages(response.images);
      setCurrentBackend(response.backend);
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络错误，请稍后重试');
      console.error('Image generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      grammar: '语法优化',
      clarity: '清晰度',
      structure: '结构调整',
      formatting: '格式优化',
      completeness: '完整性',
      other: '其他',
    };
    return labels[type] || type;
  };

  const getChangeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      grammar: 'bg-primary/10 text-primary',
      clarity: 'bg-success/10 text-success',
      structure: 'bg-info/10 text-info',
      formatting: 'bg-warning/10 text-warning',
      completeness: 'bg-warning/10 text-warning',
      other: 'bg-muted text-muted-foreground',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">文档AI助手</h1>
        </div>
        <p className="text-gray-600">借助AI的力量，让文档编写更高效</p>
      </div>

      {error && (
        <Card className="border-destructive/20 bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <span className="text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            文档优化
          </TabsTrigger>
          <TabsTrigger value="api-doc" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            API文档
          </TabsTrigger>
          <TabsTrigger value="outline" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            生成大纲
          </TabsTrigger>
          <TabsTrigger value="format" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Markdown格式化
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            文生图
          </TabsTrigger>
        </TabsList>

        {/* 文档优化 */}
        <TabsContent value="optimize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                文档内容优化
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>文档类型</Label>
                <select
                  value={optimizeDocType}
                  onChange={(e) => setOptimizeDocType(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  {DOC_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>文档内容</Label>
                <Textarea
                  value={optimizeContent}
                  onChange={(e) => setOptimizeContent(e.target.value)}
                  placeholder="在此粘贴要优化的文档内容..."
                  className="min-h-[200px] font-mono"
                />
              </div>
              <Button onClick={handleOptimize} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在优化...
                  </>
                ) : (
                  '优化文档'
                )}
              </Button>
            </CardContent>
          </Card>

          {result && typeof result === 'object' && !Array.isArray(result) && 'suggested' in result && (() => {
            const optimizeResult = result as OptimizeResult;
            return (
              <Card>
                <CardHeader>
                  <CardTitle>优化结果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(optimizeResult.suggested, 'optimize')}
                    >
                      {copied === 'optimize' ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied === 'optimize' ? '已复制' : '复制'}
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap">{optimizeResult.suggested}</pre>
                  </div>
                  {optimizeResult.changes && optimizeResult.changes.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">修改说明</h4>
                      <div className="space-y-2">
                        {optimizeResult.changes.map((change: DocumentChange, idx: number) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Badge className={getChangeTypeColor(change.change_type)}>
                              {getChangeTypeLabel(change.change_type)}
                            </Badge>
                            <span>{change.description}</span>
                            {change.line_number && (
                              <span className="text-gray-500 text-sm">
                                (行 {change.line_number})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {optimizeResult.reasoning && (
                    <div>
                      <h4 className="font-semibold mb-2">修改理由</h4>
                      <p className="text-gray-600">{optimizeResult.reasoning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* API文档生成 */}
        <TabsContent value="api-doc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                从代码生成API文档
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>编程语言</Label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    {PROGRAMMING_LANGUAGES.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>文档类型</Label>
                  <select
                    value={apiDocType}
                    onChange={(e) => setApiDocType(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    <option value="api_endpoint">API端点</option>
                    <option value="struct_definition">结构体定义</option>
                    <option value="function_comment">函数注释</option>
                    <option value="readme">README</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>代码内容</Label>
                <Textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  placeholder="在此粘贴要生成文档的代码..."
                  className="min-h-[200px] font-mono"
                />
              </div>
              <Button onClick={handleGenerateApiDoc} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在生成...
                  </>
                ) : (
                  '生成API文档'
                )}
              </Button>
            </CardContent>
          </Card>

          {result && typeof result === 'object' && !Array.isArray(result) && 'title' in result && (() => {
            const apiResult = result as ApiDocResult;
            return (
              <Card>
                <CardHeader>
                  <CardTitle>生成的API文档</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(apiResult, null, 2), 'api-doc')}
                    >
                      {copied === 'api-doc' ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copied === 'api-doc' ? '已复制' : '复制'}
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{apiResult.title}</h3>
                    <p className="text-gray-600 mt-2">{apiResult.description}</p>
                  </div>
                  {apiResult.parameters && Array.isArray(apiResult.parameters) && apiResult.parameters.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">参数</h4>
                      <table className="w-full border-collapse border">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border p-2 text-left">参数名</th>
                            <th className="border p-2 text-left">类型</th>
                            <th className="border p-2 text-left">描述</th>
                            <th className="border p-2 text-left">必填</th>
                            <th className="border p-2 text-left">默认值</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiResult.parameters.map((param, idx: number) => (
                            <tr key={idx}>
                              <td className="border p-2 font-mono">{param.name || ''}</td>
                              <td className="border p-2 font-mono">{param.type || ''}</td>
                              <td className="border p-2">{param.description || ''}</td>
                              <td className="border p-2">{param.required ? '是' : '否'}</td>
                              <td className="border p-2 font-mono">{param.default || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {apiResult.returns && (
                    <div>
                      <h4 className="font-semibold mb-2">返回值</h4>
                      <p>{apiResult.returns}</p>
                    </div>
                  )}
                  {apiResult.examples && Array.isArray(apiResult.examples) && apiResult.examples.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">示例</h4>
                      {apiResult.examples.map((example, idx: number) => {
                        if (typeof example === 'string') {
                          return (
                            <pre key={idx} className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
                              {example}
                            </pre>
                          );
                        }
                        const exampleObj = example as { name?: string; code?: string; description?: string };
                        return (
                          <div key={idx} className="mt-2">
                            {exampleObj.name && <h5 className="font-medium mb-1">{exampleObj.name}</h5>}
                            {exampleObj.code && (
                              <pre className="bg-gray-100 p-3 rounded overflow-x-auto font-mono">
                                {exampleObj.code}
                              </pre>
                            )}
                            {exampleObj.description && (
                              <p className="text-gray-600 text-sm mt-1">{exampleObj.description}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {apiResult.notes && (
                    <div>
                      <h4 className="font-semibold mb-2">注意事项</h4>
                      {Array.isArray(apiResult.notes) && apiResult.notes.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {apiResult.notes.map((note, idx: number) => (
                            <li key={idx}>{note as string}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-600">{apiResult.notes as string}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* 大纲生成 */}
        <TabsContent value="outline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                生成文档大纲
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>文档类型</Label>
                <select
                  value={outlineDocType}
                  onChange={(e) => setOutlineDocType(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  {DOC_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>文档主题</Label>
                <Input
                  value={outlineTopic}
                  onChange={(e) => setOutlineTopic(e.target.value)}
                  placeholder="例如：企业管理系统开发指南"
                />
              </div>
              <Button onClick={handleGenerateOutline} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在生成...
                  </>
                ) : (
                  '生成大纲'
                )}
              </Button>
            </CardContent>
          </Card>

          {result && Array.isArray(result) && (
            <Card>
              <CardHeader>
                <CardTitle>文档大纲</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result.join('\n'), 'outline')}
                  >
                    {copied === 'outline' ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied === 'outline' ? '已复制' : '复制'}
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-2">
                  {result.map((item: string, idx: number) => (
                    <li key={idx} className="py-1">{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Markdown格式化 */}
        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Markdown格式化
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Markdown内容</Label>
                <Textarea
                  value={markdownContent}
                  onChange={(e) => setMarkdownContent(e.target.value)}
                  placeholder="在此粘贴要格式化的Markdown内容..."
                  className="min-h-[200px] font-mono"
                />
              </div>
              <Button onClick={handleFormatMarkdown} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在格式化...
                  </>
                ) : (
                  '格式化Markdown'
                )}
              </Button>
            </CardContent>
          </Card>

          {result && typeof result === 'string' && (
            <Card>
              <CardHeader>
                <CardTitle>格式化结果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(result, 'markdown')}
                  >
                    {copied === 'markdown' ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copied === 'markdown' ? '已复制' : '复制'}
                  </Button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap font-mono">{result}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 文生图 */}
        <TabsContent value="image" className="space-y-4">
          {/* AI服务状态 */}
          {aiStatus && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${aiStatus.together_ai ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Together AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${aiStatus.huggingface ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Hugging Face</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    可用后端: {aiStatus.available_backends.join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                AI 文生图
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>图片描述</Label>
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="请描述您想要生成的图片，例如：'一个现代化的办公楼，蓝天白云'..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>图片风格</Label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    {IMAGE_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>图片尺寸</Label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    {IMAGE_SIZES.map((size) => (
                      <option key={size.value} value={size.value}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>生成数量</Label>
                  <select
                    value={numImages.toString()}
                    onChange={(e) => setNumImages(parseInt(e.target.value))}
                    className="w-full border rounded-md p-2"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n.toString()}>
                        {n} 张
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button onClick={handleGenerateImage} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在生成图片...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    生成图片
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {generatedImages.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>生成的图片</CardTitle>
                  {currentBackend && (
                    <Badge variant="secondary">使用后端: {currentBackend}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative group">
                      <SafeImage
                        src={imgUrl}
                        alt={`Generated image ${idx + 1}`}
                        className="w-full rounded-lg object-cover"
                        style={{ minHeight: '200px' }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(imgUrl, '_blank')}
                        >
                          查看大图
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentAiAssistant;
