import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ChevronLeft, MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSuccess(true);
      toast.success('留言提交成功！我们会尽快与您联系');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
                <ChevronLeft className="h-4 w-4" />
                返回门户首页
              </Link>
              <h1 className="text-2xl font-bold">联系我们</h1>
              <p className="text-muted-foreground mt-1">
                期待与您的合作，随时欢迎您的咨询
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>在线留言</CardTitle>
                    <CardDescription>
                      请填写以下信息，我们的工作人员会在24小时内与您联系
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isSuccess ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">提交成功！</h3>
                        <p className="text-muted-foreground">
                          感谢您的留言，我们会尽快与您联系
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">姓名 *</Label>
                            <Input
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="请输入您的姓名"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">邮箱 *</Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="请输入您的邮箱"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">电话</Label>
                            <Input
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="请输入您的联系电话"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subject">主题 *</Label>
                            <Input
                              id="subject"
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              placeholder="请输入留言主题"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">留言内容 *</Label>
                          <Textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="请详细描述您的需求或问题"
                            rows={6}
                            required
                          />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              提交中...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              提交留言
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>联系方式</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">公司地址</h4>
                        <p className="text-sm text-muted-foreground">
                          河北省石家庄市高新技术开发区
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Phone className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-medium">联系电话</h4>
                        <p className="text-sm text-muted-foreground">
                          0311-88888888
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Mail className="h-5 w-5 text-info" />
                      </div>
                      <div>
                        <h4 className="font-medium">电子邮箱</h4>
                        <p className="text-sm text-muted-foreground">
                          info@sanshen.com
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <h4 className="font-medium">工作时间</h4>
                        <p className="text-sm text-muted-foreground">
                          周一至周五 8:30-17:30
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>快速导航</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/portal/category/products">
                        查看产品
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/portal/category/about">
                        了解公司
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link to="/portal/category/honors">
                        资质荣誉
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ContactPage;
