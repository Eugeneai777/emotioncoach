import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import CarouselIndicator from "./CarouselIndicator";
import CarouselSettingsDialog from "./CarouselSettingsDialog";
import EmotionStepsCard from "./EmotionStepsCard";
import DailyReminder from "@/components/DailyReminder";
import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { CarouselModule, CarouselContext } from "@/types/carousel";
import { TrainingCamp } from "@/types/trainingCamp";

interface HomeCarouselProps {
  context: CarouselContext;
  activeCamp?: TrainingCamp;
  onStartReminder: () => void;
  onDismissReminder: () => void;
  onCheckIn: () => void;
}

export default function HomeCarousel({
  context,
  activeCamp,
  onStartReminder,
  onDismissReminder,
  onCheckIn,
}: HomeCarouselProps) {
  const { user } = useAuth();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modules, setModules] = useState<CarouselModule[]>([
    { id: "emotion_steps", enabled: true, order: 1 },
    { id: "daily_reminder", enabled: true, order: 2 },
    { id: "training_camp", enabled: true, order: 3 },
  ]);
  const [autoPlay, setAutoPlay] = useState(true);
  const [interval, setInterval] = useState(5000);

  // Load user settings
  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("carousel_modules, carousel_auto_play, carousel_interval")
        .eq("id", user.id)
        .single();

      if (data) {
        if (data.carousel_modules) setModules(data.carousel_modules as unknown as CarouselModule[]);
        if (data.carousel_auto_play !== null) setAutoPlay(data.carousel_auto_play);
        if (data.carousel_interval) setInterval(data.carousel_interval);
      }
    };

    loadSettings();
  }, [user]);

  // Calculate priority and sort modules
  const sortedModules = useCallback(() => {
    return [...modules]
      .map((module) => {
        let priority = module.order;
        let hasUpdate = false;

        switch (module.id) {
          case "daily_reminder":
            if (context.hasReminder) {
              priority = 0;
              hasUpdate = true;
            }
            break;
          case "training_camp":
            if (context.campHasMilestone) {
              priority = 1;
              hasUpdate = true;
            } else if (context.hasActiveCamp) {
              priority = 2;
            }
            break;
          case "goal_progress":
            if (context.hasGoalUpdate) {
              priority = 1;
              hasUpdate = true;
            }
            break;
        }

        return { ...module, priority, hasUpdate };
      })
      .filter((m) => m.enabled)
      .sort((a, b) => (a.priority || a.order) - (b.priority || b.order));
  }, [modules, context]);

  const activeModules = sortedModules();

  // Auto-play functionality
  useEffect(() => {
    if (!api || !autoPlay || activeModules.length <= 1) return;

    const timer = window.setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [api, autoPlay, interval, activeModules.length]);

  // Sync current slide
  useEffect(() => {
    if (!api) return;

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Render module content
  const renderModule = (module: CarouselModule) => {
    switch (module.id) {
      case "emotion_steps":
        return <EmotionStepsCard />;
      case "daily_reminder":
        return context.hasReminder ? (
          <DailyReminder onStart={onStartReminder} onDismiss={onDismissReminder} />
        ) : null;
      case "training_camp":
        return activeCamp ? (
          <TrainingCampCard camp={activeCamp} onCheckIn={onCheckIn} />
        ) : null;
      default:
        return null;
    }
  };

  const handleSettingsSave = async (newModules: CarouselModule[], newAutoPlay: boolean, newInterval: number) => {
    if (!user) return;

    setModules(newModules);
    setAutoPlay(newAutoPlay);
    setInterval(newInterval);

    await supabase
      .from("profiles")
      .update({
        carousel_modules: newModules as any,
        carousel_auto_play: newAutoPlay,
        carousel_interval: newInterval,
      })
      .eq("id", user.id);
  };

  if (activeModules.length === 0) return null;

  return (
    <div className="space-y-4">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {activeModules.map((module) => {
            const content = renderModule(module);
            if (!content) return null;

            return (
              <CarouselItem key={module.id}>
                {content}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {activeModules.length > 1 && (
          <>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </>
        )}
      </Carousel>

      {activeModules.length > 1 && (
        <CarouselIndicator
          total={activeModules.length}
          current={current}
          hasUpdate={activeModules.map((m) => m.hasUpdate || false)}
          onSelect={(index) => api?.scrollTo(index)}
        />
      )}

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSettingsOpen(true)}
          className="text-healing-forestGreen/60 hover:text-healing-forestGreen"
        >
          <Settings className="h-4 w-4 mr-2" />
          轮播设置
        </Button>
      </div>

      <CarouselSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        modules={modules}
        autoPlay={autoPlay}
        interval={interval}
        onSave={handleSettingsSave}
      />
    </div>
  );
}
