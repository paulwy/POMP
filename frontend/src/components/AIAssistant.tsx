import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { englishAiService } from '../services/english_ai';
import { toast } from 'sonner';

interface AIAssistantProps {
  value: string;
  onChange: (value: string) => void;
  type?: 'field_name' | 'field_code' | 'description' | 'api_path' | 'general';
  sourceFieldValue?: string;
  autoMode?: boolean;
  placeholder?: string;
}

interface AssistantData {
  translated_text?: string;
  camel_case?: string;
  snake_case?: string;
  pascal_case?: string;
  kebab_case?: string;
  description?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  value,
  onChange,
  type = 'general',
  sourceFieldValue,
  autoMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [assistantData, setAssistantData] = useState<AssistantData | null>(null);
  const [lastProcessedSource, setLastProcessedSource] = useState<string>('');

  useEffect(() => {
    if (autoMode && sourceFieldValue && sourceFieldValue !== lastProcessedSource && !value) {
      handleAssist(true);
      setLastProcessedSource(sourceFieldValue);
    }
  }, [sourceFieldValue, autoMode, value, lastProcessedSource]);

  const handleAssist = async (autoApply = false) => {
    if (!value && !sourceFieldValue) {
      if (!autoApply) toast.warning('请输入要辅助的内容');
      return;
    }

    const textToProcess = value || sourceFieldValue || '';
    setLoading(true);
    if (!autoApply) setAssistantData(null);

    try {
      let result;
      
      if (type === 'description') {
        result = await englishAiService.generateDescription({
          chinese_description: textToProcess,
          style: 'technical',
        });
      } else if (type === 'field_name' || type === 'field_code') {
        const [translateResult, namingResult] = await Promise.all([
          englishAiService.translate({
            text: textToProcess,
            context: type,
          }),
          englishAiService.suggestNaming({
            text: textToProcess,
            type,
          }),
        ]);
        result = { ...translateResult, ...namingResult };
      } else {
        result = await englishAiService.translate({
          text: textToProcess,
          context: type,
        });
      }

      setAssistantData(result);

      if (autoApply) {
        let applyValue = '';
        const resultAny = result as AssistantData;
        if (type === 'description' && resultAny.description) {
          applyValue = resultAny.description;
        } else if (type === 'field_code' || type === 'field_name') {
          if (resultAny.camel_case) {
            applyValue = resultAny.camel_case;
          } else if (resultAny.translated_text) {
            applyValue = resultAny.translated_text;
          }
        } else if (resultAny.translated_text) {
          applyValue = resultAny.translated_text;
        }
        
        if (applyValue) {
          onChange(applyValue);
          toast.success(type === 'field_code' || type === 'field_name' ? '已自动生成英文代码' : '已自动生成描述');
        }
      }
    } catch (error) {
      console.error('辅助失败:', error);
      if (!autoApply) toast.error('获取辅助内容失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string | undefined, id: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleApply = (text: string | undefined) => {
    if (text) {
      onChange(text);
      setIsOpen(false);
      toast.success('已应用');
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !assistantData) {
            handleAssist();
          }
        }}
        className="h-8 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200"
        title="AI助手"
      >
        <Sparkles className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[100]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-800">AI助手</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-600 animate-spin mr-2" />
                <span className="text-gray-600 font-medium">正在智能生成...</span>
              </div>
            )}

            {!loading && assistantData && (
              <div className="space-y-4">
                {assistantData.translated_text && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">标准翻译</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(assistantData.translated_text, 'translated')}
                          className="h-7 px-2 text-xs"
                        >
                          {copied === 'translated' ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copied === 'translated' ? '已复制' : '复制'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApply(assistantData.translated_text)}
                          className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          应用
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm font-mono break-all">
                      {assistantData.translated_text}
                    </div>
                  </div>
                )}

                {assistantData.camel_case && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700 block mb-3">命名规范建议</span>
                    <div className="space-y-2">
                      {[
                        { label: '驼峰式', value: assistantData.camel_case, id: 'camel', recommended: true },
                        { label: '下划线式', value: assistantData.snake_case, id: 'snake' },
                        { label: '帕斯卡式', value: assistantData.pascal_case, id: 'pascal' },
                        { label: '短横线式', value: assistantData.kebab_case, id: 'kebab' },
                      ].map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            item.recommended ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.recommended && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                推荐
                              </span>
                            )}
                            <span className="text-xs text-gray-600 w-16">{item.label}</span>
                            <span className="text-sm font-mono font-medium text-gray-800">{item.value}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(item.value, item.id)}
                              className="h-6 px-2 text-xs"
                            >
                              {copied === item.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApply(item.value)}
                              className={`h-6 px-2 text-xs ${
                                item.recommended ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'
                              }`}
                            >
                              应用
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assistantData.description && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">描述</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(assistantData.description, 'description')}
                          className="h-7 px-2 text-xs"
                        >
                          {copied === 'description' ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          {copied === 'description' ? '已复制' : '复制'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleApply(assistantData.description)}
                          className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          应用
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm break-all">
                      {assistantData.description}
                    </div>
                  </div>
                )}

                {!loading && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssist()}
                      className="w-full text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重新生成
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
