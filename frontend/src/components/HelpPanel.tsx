import { useState } from 'react';
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  Send,
  MessageSquare,
  Search,
  FileText,
  Sparkles,
  Minimize2,
  Maximize2,
  BookOpen,
} from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';

interface HelpArticle {
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  articles: HelpArticle[];
}

const materialLibraryHelp: HelpCategory = {
  id: 'material-library',
  name: 'Material Library',
  icon: <BookOpen className="h-5 w-5" />,
  description: 'Material collection, management and application',
  articles: [
    {
      title: 'Create Material',
      slug: 'create-material',
      excerpt: 'How to create and manage your material resources',
      content: '1. Click the "Create Material" button in the top right\n2. Fill in the material name and select type (article/image/template)\n3. Add category, tags and description\n4. Click save',
    },
    {
      title: 'Smart Crawl',
      slug: 'smart-crawl',
      excerpt: 'Use AI to smart crawl web content',
      content: '1. Click the "Smart Crawl" button\n2. Enter the target web URL\n3. The system automatically crawls title, content and images\n4. Edit manually and save',
    },
    {
      title: 'Material Organization',
      slug: 'organize',
      excerpt: 'How to effectively organize and manage materials',
      content: '1. Use categories to organize different types of materials\n2. Add tags to improve search accuracy\n3. Favorite important materials for quick access\n4. Clean up outdated materials regularly',
    },
    {
      title: 'Search Materials',
      slug: 'search',
      excerpt: 'Quickly find the materials you need',
      content: '1. Use the top search bar\n2. Filter by type (article/image/template)\n3. Filter by category\n4. Combine multiple filters',
    },
  ],
};

const contentManagementHelp: HelpCategory = {
  id: 'content-management',
  name: 'Content Management',
  icon: <FileText className="h-5 w-5" />,
  description: 'Article publishing and review',
  articles: [
    {
      title: 'Create Article',
      slug: 'create-article',
      excerpt: 'How to publish new article content',
      content: '1. Go to Content Management module\n2. Click "Create Article"\n3. Select category, fill in title and content\n4. Submit for review',
    },
    {
      title: 'Review Process',
      slug: 'review-process',
      excerpt: 'Article review operation steps',
      content: '1. Submitted articles enter pending review status\n2. Reviewers can view in the pending list\n3. Can approve or reject applications\n4. Approved articles will be publicly published',
    },
  ],
};

const workflowHelp: HelpCategory = {
  id: 'workflow',
  name: 'Approval Workflow',
  icon: <MessageSquare className="h-5 w-5" />,
  description: 'Approval related operation guide',
  articles: [
    {
      title: 'Submit Approval',
      slug: 'submit-approval',
      excerpt: 'How to submit various approval requests',
      content: '1. Go to Approval Management module\n2. Select approval type (leave/reimbursement etc.)\n3. Fill in the request information\n4. Submit and wait for approval',
    },
    {
      title: 'Process Approval',
      slug: 'handle-approval',
      excerpt: 'How to handle requests as an approver',
      content: '1. View tasks in my pending approvals\n2. View request details\n3. Select approve or reject\n4. Can add approval comments',
    },
  ],
};

const helpCategories: Record<string, HelpCategory> = {
  'material-library': materialLibraryHelp,
  'content-management': contentManagementHelp,
  'workflow': workflowHelp,
};

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  embedded?: boolean;
}

export default function HelpPanel({ isOpen, onClose, context = 'material-library', embedded = false }: HelpPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'docs' | 'ai' | 'faq'>('docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I am your material library assistant. How can I help you?',
    },
  ]);

  const currentCategory = helpCategories[context] || materialLibraryHelp;

  const filteredArticles = currentCategory.articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQuickAnswer = (question: string) => {
    const q = question.toLowerCase();

    if (q.includes('create') || q.includes('new')) {
      return 'Creating material is easy:\n1. Click "Create Material" in the top right\n2. Fill in name and type\n3. Add content and tags\n4. Save';
    }

    if (q.includes('crawl') || q.includes('spider') || q.includes('web')) {
      return 'Smart crawl function:\n1. Click "Smart Crawl"\n2. Enter target URL\n3. System automatically extracts content\n4. Edit and save';
    }

    if (q.includes('category') || q.includes('tag') || q.includes('organize')) {
      return 'Material organization tips:\n1. Use categories to distinguish material types\n2. Add multiple tags for easy search\n3. Favorite important materials\n4. Clean up regularly';
    }

    return 'Hello! I am your smart assistant.\n\nYou can ask me:\n- How to create a material?\n- How to use smart crawl?\n- How to organize materials?';
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || isLoading) return;

    const userMessage = {
      id: chatMessages.length + 1,
      role: 'user',
      content: chatMessage,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    const userQuestion = chatMessage;
    setChatMessage('');

    setTimeout(() => {
      const answer = getQuickAnswer(userQuestion);
      const aiMessage = {
        id: chatMessages.length + 2,
        role: 'assistant',
        content: answer,
      };
      setChatMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 500);
  };

  if (!isOpen) return null;

  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-gray-800">Help Panel</span>
            <Badge variant="outline" className="text-xs">
              {currentCategory.name}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'docs' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('docs')}
          >
            Docs
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('ai')}
          >
            AI Assistant
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === 'faq' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
            }`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'docs' && (
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <div key={article.slug} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                      onClick={() =>
                        setExpandedArticle(expandedArticle === article.slug ? null : article.slug)
                      }
                    >
                      <div>
                        <h4 className="font-medium text-sm">{article.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{article.excerpt}</p>
                      </div>
                      {expandedArticle === article.slug ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {expandedArticle === article.slug && article.content && (
                      <div className="px-3 pb-3 text-sm text-gray-600 whitespace-pre-line bg-gray-50">
                        {article.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-line ${
                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <Sparkles className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleSendMessage} disabled={isLoading}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">How to create a material?</p>
                  <p className="text-muted-foreground mt-1">Click "Create Material", fill in info and save.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">What is smart crawl?</p>
                  <p className="text-muted-foreground mt-1">Enter URL, system automatically extracts web content.</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-800">How to organize materials?</p>
                  <p className="text-muted-foreground mt-1">Use categories and tags to organize your materials.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ${
        isMinimized ? 'translate-y-full h-16' : ''
      }`}
    >
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold text-gray-800">Help Center</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'docs' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('docs')}
        >
          📚 Docs
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'ai' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI Assistant
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === 'faq' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
          }`}
          onClick={() => setActiveTab('faq')}
        >
          ❓ FAQ
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'docs' && (
          <div className="p-4 space-y-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <p className="text-sm text-primary font-medium">{currentCategory.name}</p>
              <p className="text-xs text-primary mt-1">{currentCategory.description}</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <div key={article.slug} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50"
                    onClick={() =>
                      setExpandedArticle(expandedArticle === article.slug ? null : article.slug)
                    }
                  >
                    <div className="flex items-center gap-2">
                      {currentCategory.icon}
                      <div>
                        <h4 className="font-medium text-sm">{article.title}</h4>
                        <p className="text-xs text-muted-foreground">{article.excerpt}</p>
                      </div>
                    </div>
                    {expandedArticle === article.slug ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  {expandedArticle === article.slug && article.content && (
                    <div className="px-3 pb-3 text-sm text-gray-600 whitespace-pre-line bg-gray-50">
                      {article.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-line ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Sparkles className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex gap-2">
              <Input
                placeholder="Ask a question... (e.g., how to create material?)"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="p-4 space-y-3">
            {[
              { q: 'How to create a material?', a: 'Click "Create Material", fill in name, type, content and save.' },
              { q: 'How to use smart crawl?', a: 'Enter target web URL, system automatically extracts title, content and images.' },
              { q: 'How to organize materials?', a: 'Use categories to distinguish types, add tags for search, favorite important materials.' },
              { q: 'What types of materials are supported?', a: 'Supports article, image, template and other four types.' },
            ].map((faq, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800 text-sm">{faq.q}</p>
                <p className="text-muted-foreground text-sm mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
