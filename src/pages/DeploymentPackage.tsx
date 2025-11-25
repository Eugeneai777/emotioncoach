import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, FileText, FolderOpen, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { deploymentFiles, fileCategories } from '@/data/deploymentPackageFiles';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DeploymentPackage = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAllFiles = async () => {
    try {
      setIsDownloading(true);
      toast.loading('正在打包文件...', { id: 'download' });

      const zip = new JSZip();

      // 添加核心文件
      zip.file('proxy.js', deploymentFiles['proxy.js']);
      zip.file('package.json', deploymentFiles['package.json']);
      zip.file('ecosystem.config.js', deploymentFiles['ecosystem.config.js']);
      
      // 添加配置文件
      zip.file('.env.example', deploymentFiles['.env.example']);
      
      // 添加脚本文件
      const scriptsFolder = zip.folder('scripts');
      if (scriptsFolder) {
        scriptsFolder.file('setup.sh', deploymentFiles['scripts/setup.sh']);
        scriptsFolder.file('deploy.sh', deploymentFiles['scripts/deploy.sh']);
        scriptsFolder.file('generate-token.sh', deploymentFiles['scripts/generate-token.sh']);
        scriptsFolder.file('test-proxy.sh', deploymentFiles['scripts/test-proxy.sh']);
        scriptsFolder.file('monitor.sh', deploymentFiles['scripts/monitor.sh']);
        scriptsFolder.file('get-ip.sh', deploymentFiles['scripts/get-ip.sh']);
        scriptsFolder.file('update.sh', deploymentFiles['scripts/update.sh']);
      }
      
      // 添加文档
      const docsFolder = zip.folder('docs');
      if (docsFolder) {
        docsFolder.file('aliyun-guide.md', deploymentFiles['docs/aliyun-guide.md']);
        docsFolder.file('wechat-config.md', deploymentFiles['docs/wechat-config.md']);
        docsFolder.file('security.md', deploymentFiles['docs/security.md']);
      }
      
      zip.file('README.md', deploymentFiles['README.md']);
      zip.file('DEPLOYMENT.md', deploymentFiles['DEPLOYMENT.md']);
      zip.file('TROUBLESHOOTING.md', deploymentFiles['TROUBLESHOOTING.md']);

      // 生成 ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // 触发下载
      saveAs(blob, 'wechat-proxy-deployment-package.zip');
      
      toast.success('下载完成！', { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('下载失败，请重试', { id: 'download' });
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadSingleFile = (fileName: string) => {
    const content = deploymentFiles[fileName];
    if (!content) {
      toast.error('文件不存在');
      return;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const displayName = fileName.split('/').pop() || fileName;
    saveAs(blob, displayName);
    toast.success(`已下载: ${displayName}`);
  };

  const FileList = ({ files, category }: { files: typeof fileCategories.core, category: string }) => (
    <div className="space-y-2">
      {files.map((file) => (
        <div 
          key={file.name}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name.split('/').pop()}</p>
              <p className="text-xs text-muted-foreground truncate">{file.description}</p>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">{file.size}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => downloadSingleFile(file.name)}
            className="ml-2 flex-shrink-0"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Server className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">微信API代理服务器</h1>
          <p className="text-lg text-muted-foreground">阿里云部署包下载</p>
        </div>

        {/* Quick Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              部署包说明
            </CardTitle>
            <CardDescription>
              解决微信公众号 API 调用 IP 白名单限制问题的完整解决方案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">一键部署</p>
                  <p className="text-sm text-muted-foreground">5分钟快速安装，零配置复杂度</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">自动运维</p>
                  <p className="text-sm text-muted-foreground">PM2守护进程，开机自启</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">安全加固</p>
                  <p className="text-sm text-muted-foreground">令牌认证，防止未授权访问</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">完整文档</p>
                  <p className="text-sm text-muted-foreground">中文说明、故障排查、最佳实践</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Download Button */}
        <div className="mb-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">下载完整部署包</h3>
                <p className="text-muted-foreground">
                  包含所有必需文件、脚本和文档（共17个文件）
                </p>
                <Button 
                  size="lg" 
                  onClick={downloadAllFiles}
                  disabled={isDownloading}
                  className="min-w-[200px]"
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isDownloading ? '正在打包...' : '一键下载 ZIP'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  wechat-proxy-deployment-package.zip · 约 95 KB
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              文件列表
            </CardTitle>
            <CardDescription>
              展开查看各类别文件并支持单独下载
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="core">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">核心文件</Badge>
                    <span className="text-sm text-muted-foreground">3 个文件</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FileList files={fileCategories.core} category="core" />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="config">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">配置文件</Badge>
                    <span className="text-sm text-muted-foreground">1 个文件</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FileList files={fileCategories.config} category="config" />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scripts">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">脚本文件</Badge>
                    <span className="text-sm text-muted-foreground">7 个文件</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FileList files={fileCategories.scripts} category="scripts" />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="docs">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Badge>文档</Badge>
                    <span className="text-sm text-muted-foreground">6 个文件</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <FileList files={fileCategories.docs} category="docs" />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              快速部署指南
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">下载部署包</h4>
                  <p className="text-sm text-muted-foreground">点击上方按钮下载 ZIP 文件</p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">上传到服务器</h4>
                  <p className="text-sm text-muted-foreground mb-2">使用 scp 或 SFTP 工具上传到阿里云服务器</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    scp -r deployment-package root@your-server-ip:/opt/
                  </code>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">运行安装脚本</h4>
                  <p className="text-sm text-muted-foreground mb-2">SSH 登录服务器后执行</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    cd /opt/deployment-package<br />
                    chmod +x scripts/*.sh<br />
                    sudo ./scripts/setup.sh
                  </code>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">配置并部署</h4>
                  <p className="text-sm text-muted-foreground mb-2">生成令牌并启动服务</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    ./scripts/generate-token.sh<br />
                    ./scripts/deploy.sh
                  </code>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold flex-shrink-0">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">配置微信白名单</h4>
                  <p className="text-sm text-muted-foreground">
                    将服务器IP添加到微信公众平台的IP白名单，然后在应用中配置代理服务器地址和认证令牌
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">📚 需要帮助？</p>
              <p className="text-sm text-muted-foreground">
                下载的部署包中包含完整的文档，包括详细部署说明（DEPLOYMENT.md）、故障排查指南（TROUBLESHOOTING.md）以及阿里云和微信平台的配置指南。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeploymentPackage;
