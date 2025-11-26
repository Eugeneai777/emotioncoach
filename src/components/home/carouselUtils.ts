import { ModuleId, CarouselContext, CustomCard } from "@/types/carousel";

export const calculatePriority = (
  moduleId: ModuleId,
  context: CarouselContext
): number => {
  let priority = 0;

  switch (moduleId) {
    case "daily_reminder":
      if (context.hasReminder) priority = 100;
      break;
    case "training_camp":
      if (context.hasActiveCamp) {
        priority = 80;
        if (context.campHasMilestone) priority = 90;
      }
      break;
    case "goal_progress":
      if (context.hasGoalUpdate) priority = 70;
      break;
    case "emotion_steps":
      priority = 50;
      break;
    case "today_progress":
      priority = 40;
      break;
  }

  return priority;
};

export const calculateCustomCardPriority = (
  card: CustomCard,
  context: CarouselContext
): number => {
  let priority = 60; // Default priority for custom cards

  // Boost priority if card has reminder and should show
  if (card.has_reminder && shouldShowReminder(card)) {
    priority = 95; // Higher than most built-in modules
  }

  return priority;
};

export const shouldShowReminder = (card: CustomCard): boolean => {
  if (!card.has_reminder || !card.reminder_time) return false;

  const now = new Date();
  const lastShown = card.last_reminder_shown
    ? new Date(card.last_reminder_shown)
    : null;

  // Check if already shown today
  if (
    lastShown &&
    lastShown.toDateString() === now.toDateString()
  ) {
    return false;
  }

  // Check if current time matches reminder time
  const [hours, minutes] = card.reminder_time.split(":").map(Number);
  const reminderTime = new Date();
  reminderTime.setHours(hours, minutes, 0, 0);

  const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // Show reminder if within 2 hours of reminder time
  return hoursDiff <= 2;
};
