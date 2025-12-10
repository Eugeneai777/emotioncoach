import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GratitudeJournal from "@/components/tools/GratitudeJournal";

const GratitudeHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-rose-600 hover:bg-rose-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-rose-800">我的感恩日记</h1>
            <p className="text-sm text-rose-600/70">看见日常微光，点亮内心力量</p>
          </div>
        </div>

        {/* Gratitude Journal Component */}
        <GratitudeJournal />
      </div>
    </div>
  );
};

export default GratitudeHistory;
