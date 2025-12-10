import { ArrowLeft, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GratitudeJournal } from "@/components/tools/GratitudeJournal";
import { GratitudeDashboard } from "@/components/gratitude/GratitudeDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GratitudeHistory = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto p-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">我的感恩日记</h1>
            <p className="text-sm text-muted-foreground">看见日常微光，点亮内心力量</p>
          </div>
        </div>

        <Tabs defaultValue="journal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="journal">📝 感恩记录</TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal">
            <GratitudeJournal />
          </TabsContent>

          <TabsContent value="dashboard">
            <GratitudeDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GratitudeHistory;
