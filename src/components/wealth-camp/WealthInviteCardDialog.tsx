import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, Copy, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WealthAssessmentShareCard from './WealthAssessmentShareCard';
import WealthCampShareCard from './WealthCampShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';

interface UserInfo {
  avatarUrl?: string;
  displayName?: string;
  currentDay?: number;
  totalDays?: number;
}

interface WealthInviteCardDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: 'assessment' | 'camp';
  onGenerate?: () => void;
  campId?: string;
  currentDay?: number;
}

const WealthInviteCardDialog: React.FC<WealthInviteCardDialogProps> = ({
  trigger,
  defaultTab = 'assessment',
  onGenerate,
  campId,
  currentDay: propCurrentDay,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessment' | 'camp'>(defaultTab);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  
  const assessmentCardRef = useRef<HTMLDivElement>(null);
  const campCardRef = useRef<HTMLDivElement>(null);

  const assessmentUrl = `${getPromotionDomain()}/wealth-block`;
  const campUrl = `${getPromotionDomain()}/wealth-camp-intro`;

  // Fetch user profile and camp progress
  useEffect(() => {
    if (!open) return;
    
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();

      // Get camp progress if campId provided
      let currentDay = propCurrentDay;
      let totalDays = 21;

      if (campId && !propCurrentDay) {
        const { data: camp } = await supabase
          .from('training_camps')
          .select('start_date, duration_days')
          .eq('id', campId)
          .single();

        if (camp?.start_date) {
          const startDate = new Date(camp.start_date);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          currentDay = Math.min(Math.max(1, diffDays), camp.duration_days || 21);
          totalDays = camp.duration_days || 21;
        }
      }

      setUserInfo({
        avatarUrl: profile?.avatar_url || undefined,
        displayName: profile?.display_name || '财富觉醒者',
        currentDay: currentDay || undefined,
        totalDays,
      });
    };

    fetchUserInfo();
  }, [open, campId, propCurrentDay]);


  const handleDownload = async () => {
    const cardRef = activeTab === 'assessment' ? assessmentCardRef : campCardRef;
    const cardName = activeTab === 'assessment' ? '财富卡点测评邀请卡' : '21天财富训练营邀请卡';
    
    if (!cardRef.current) {
      console.error('Card ref not found');
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    try {
      // Clone the element to avoid transform issues
      const originalElement = cardRef.current;
      const clonedElement = originalElement.cloneNode(true) as HTMLElement;
      
      // Set up the cloned element for rendering
      clonedElement.style.position = 'fixed';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '0';
      clonedElement.style.transform = 'none';
      clonedElement.style.zIndex = '-9999';
      
      document.body.appendChild(clonedElement);

      const canvas = await html2canvas(clonedElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      // Remove cloned element
      document.body.removeChild(clonedElement);

      // Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${cardName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('卡片已保存');
      onGenerate?.();
    } catch (error) {
      console.error('Failed to generate card:', error);
      toast.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = activeTab === 'assessment' ? assessmentUrl : campUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
      onGenerate?.();
    } catch (error) {
      toast.error('复制失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Image className="h-4 w-4" />
            生成邀请卡片
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生成邀请卡片</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'assessment' | 'camp')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assessment">财富测评</TabsTrigger>
            <TabsTrigger value="camp">训练营</TabsTrigger>
          </TabsList>

          <TabsContent value="assessment" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <WealthAssessmentShareCard 
                  ref={assessmentCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camp" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <WealthCampShareCard 
                  ref={campCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  currentDay={userInfo.currentDay}
                  totalDays={userInfo.totalDays}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            {generating ? '生成中...' : '下载卡片'}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            复制链接
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          下载卡片发送给朋友，或复制链接直接分享
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WealthInviteCardDialog;
