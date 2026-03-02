import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { AdminRole } from "@/components/admin/AdminLayout";

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<AdminRole | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'content_admin', 'partner_admin']);

      if (!roles || roles.length === 0) {
        navigate("/");
        return;
      }

      // 优先级: admin > partner_admin > content_admin
      const hasAdmin = roles.some(r => r.role === 'admin');
      const hasPartnerAdmin = roles.some(r => r.role === 'partner_admin');
      setUserRole(hasAdmin ? 'admin' : hasPartnerAdmin ? 'partner_admin' : 'content_admin');
      setChecking(false);
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  if (!userRole) {
    return null;
  }

  return <AdminLayout userRole={userRole} />;
}
