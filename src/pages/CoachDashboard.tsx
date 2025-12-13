import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCoachProfile } from "@/hooks/useCoachDashboard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  Wallet, 
  Star, 
  Settings,
  ArrowLeft,
  Menu,
  X,
  Bell,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CoachDashboardOverview } from "@/components/coach-dashboard/CoachDashboardOverview";
import { CoachTimeManagement } from "@/components/coach-dashboard/CoachTimeManagement";
import { CoachAppointmentManagement } from "@/components/coach-dashboard/CoachAppointmentManagement";
import { CoachIncomeManagement } from "@/components/coach-dashboard/CoachIncomeManagement";
import { CoachReviewManagement } from "@/components/coach-dashboard/CoachReviewManagement";
import { CoachProfileSettings } from "@/components/coach-dashboard/CoachProfileSettings";
import { CoachNotificationCenter } from "@/components/coach-dashboard/CoachNotificationCenter";
import { CoachAppointmentCalendar } from "@/components/coach-dashboard/CoachAppointmentCalendar";
import { CoachCallHistory } from "@/components/coach-dashboard/CoachCallHistory";
import { useCoachNotifications } from "@/hooks/useCoachNotifications";

const menuItems = [
  { id: 'overview', label: '数据概览', icon: LayoutDashboard },
  { id: 'notifications', label: '消息中心', icon: Bell },
  { id: 'calendar', label: '预约日历', icon: Calendar },
  { id: 'time', label: '时间管理', icon: Calendar },
  { id: 'appointments', label: '预约管理', icon: ClipboardList },
  { id: 'calls', label: '通话记录', icon: Phone },
  { id: 'income', label: '收入管理', icon: Wallet },
  { id: 'reviews', label: '评价管理', icon: Star },
  { id: 'settings', label: '个人设置', icon: Settings },
];

export default function CoachDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: coachProfile, isLoading: profileLoading } = useCoachProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useCoachNotifications(coachProfile?.id);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!coachProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">您还不是认证教练</p>
          <Button onClick={() => navigate('/human-coach')}>
            了解真人教练
          </Button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CoachDashboardOverview coachId={coachProfile.id} />;
      case 'notifications':
        return <CoachNotificationCenter coachId={coachProfile.id} onNavigate={setActiveTab} />;
      case 'calendar':
        return <CoachAppointmentCalendar coachId={coachProfile.id} />;
      case 'time':
        return <CoachTimeManagement coachId={coachProfile.id} />;
      case 'appointments':
        return <CoachAppointmentManagement coachId={coachProfile.id} />;
      case 'calls':
        return <CoachCallHistory userId={coachProfile.user_id} isCoach />;
      case 'income':
        return <CoachIncomeManagement coachId={coachProfile.id} />;
      case 'reviews':
        return <CoachReviewManagement coachId={coachProfile.id} />;
      case 'settings':
        return <CoachProfileSettings coach={coachProfile} />;
      default:
        return <CoachDashboardOverview coachId={coachProfile.id} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={coachProfile.avatar_url || ''} />
                  <AvatarFallback>{coachProfile.name?.charAt(0) || 'C'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{coachProfile.name}</p>
                  <p className="text-xs text-muted-foreground">{coachProfile.title}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const showBadge = item.id === 'notifications' && unreadCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Back button */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">
            {menuItems.find(item => item.id === activeTab)?.label}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
