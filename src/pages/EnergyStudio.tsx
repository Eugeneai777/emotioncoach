import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import PageHeader from "@/components/PageHeader";
import AudienceHub from "@/components/energy-studio/AudienceHub";

const EnergyStudio = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#coach") {
      navigate("/coach-space");
    }
  }, [location.hash, navigate]);

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <DynamicOGMeta pageKey="energyStudio" />
      <PageHeader title="有劲生活馆" />

      <main className="container max-w-2xl mx-auto px-4 py-4">
        <AudienceHub showExploreEntry />
      </main>
    </div>
  );
};

export default EnergyStudio;
