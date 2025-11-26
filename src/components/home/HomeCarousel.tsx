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
import { CarouselModule, CarouselContext, CustomCard } from "@/types/carousel";
import { TrainingCamp } from "@/types/trainingCamp";
import CustomCarouselCard from "./CustomCarouselCard";
import { calculatePriority, calculateCustomCardPriority, shouldShowReminder } from "./carouselUtils";

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
  const [customCards, setCustomCards] = useState<CustomCard[]>([]);

  // Load user settings and custom cards
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

      // Load custom cards
      const { data: cards } = await supabase
        .from("custom_carousel_cards")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (cards) {
        setCustomCards(cards as CustomCard[]);
      }
    };

    loadSettings();
  }, [user]);

  // Calculate priority and sort modules
  const sortedModules = useCallback(() => {
    const enabledModules = modules.filter((m) => m.enabled);
    
    // Add custom cards as modules
    const customCardModules = customCards.map((card, index) => ({
      id: `custom_${card.id}` as any,
      enabled: card.is_active,
      order: 100 + index,
      priority: calculateCustomCardPriority(card, context),
      hasUpdate: card.has_reminder && shouldShowReminder(card),
    }));

    const allModules = [...enabledModules, ...customCardModules];
    
    return allModules
      .map((module) => ({
        ...module,
        priority:
          module.priority !== undefined
            ? module.priority
            : calculatePriority(module.id as any, context),
      }))
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.order - b.order;
      });
  }, [modules, customCards, context]);

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
  const renderModule = (module: CarouselModule & { priority?: number; hasUpdate?: boolean }) => {
    // Handle custom cards
    if (typeof module.id === "string" && module.id.startsWith("custom_")) {
      const cardId = module.id.replace("custom_", "");
      const card = customCards.find((c) => c.id === cardId);
      if (!card) return null;

      return (
        <CustomCarouselCard
          title={card.title}
          subtitle={card.subtitle}
          description={card.description}
          emoji={card.emoji}
          backgroundType={card.background_type}
          backgroundValue={card.background_value}
          textColor={card.text_color}
          imageUrl={card.image_url}
          imagePosition={card.image_position}
          actionText={card.action_text}
          onAction={() => {
            if (card.action_type === "chat") {
              window.location.href = "/";
            }
          }}
        />
      );
    }

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

  const handleSettingsSave = async (
    newModules: CarouselModule[],
    newAutoPlay: boolean,
    newInterval: number
  ) => {
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

  const refreshCustomCards = async () => {
    if (!user) return;

    const { data: cards } = await supabase
      .from("custom_carousel_cards")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (cards) {
      setCustomCards(cards as CustomCard[]);
    }
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
              <CarouselItem key={typeof module.id === "string" ? module.id : module.id}>
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
          className="text-muted-foreground hover:text-foreground"
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
        onRefreshCustomCards={refreshCustomCards}
      />
    </div>
  );
}
