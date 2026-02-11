import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { createUxTracker } from "@/lib/uxAnomalyTracker";
import { useAuth } from "@/hooks/useAuth";
import { 
  useUserEnrollment, 
  useEnrollFreeSession, 
  useCancelEnrollment,
  TeamCoachingSession 
} from "@/hooks/useTeamCoaching";
import { TeamCoachingPayDialog } from "./TeamCoachingPayDialog";

interface EnrollButtonProps {
  session: TeamCoachingSession;
  className?: string;
}

export function EnrollButton({ session, className }: EnrollButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: enrollment, isLoading: checkingEnrollment } = useUserEnrollment(session.id, user?.id);
  const enrollFree = useEnrollFreeSession();
  const cancelEnrollment = useCancelEnrollment();
  const [showPayDialog, setShowPayDialog] = useState(false);

  const isFull = (session.current_count || 0) >= session.max_participants;
  const isEnrolled = !!enrollment;
  const isPending = enrollment?.payment_status === 'pending';

  const handleClick = () => {
    if (!user) {
      navigate('/auth', { state: { from: `/team-coaching/${session.id}` } });
      return;
    }

    if (isEnrolled && !isPending) {
      // 已报名，可以取消（仅免费课程）
      if (enrollment.payment_status === 'free') {
        cancelEnrollment.mutate({ enrollmentId: enrollment.id, sessionId: session.id });
      }
      return;
    }

    if (session.is_free) {
      // 免费课程直接报名
      const tracker = createUxTracker('team_coaching_enroll', { sessionId: session.id });
      enrollFree.mutate(session.id, {
        onSuccess: () => tracker.success(),
        onError: (e: any) => tracker.fail(e?.message || '报名失败'),
      });
    } else {
      // 付费课程打开支付对话框
      setShowPayDialog(true);
    }
  };

  const getButtonContent = () => {
    if (checkingEnrollment) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    if (isEnrolled) {
      if (isPending) {
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            等待支付
          </>
        );
      }
      return (
        <>
          <Check className="w-4 h-4 mr-2" />
          已报名
        </>
      );
    }

    if (isFull) {
      return (
        <>
          <X className="w-4 h-4 mr-2" />
          已满员
        </>
      );
    }

    if (enrollFree.isPending) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }

    return session.is_free ? '免费报名' : '立即报名';
  };

  const isDisabled = checkingEnrollment || isFull || (isEnrolled && !isPending) || enrollFree.isPending;

  return (
    <>
      <Button
        className={className}
        onClick={handleClick}
        disabled={isDisabled}
        variant={isEnrolled ? "secondary" : "default"}
      >
        {getButtonContent()}
      </Button>

      <TeamCoachingPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        session={session}
      />
    </>
  );
}
