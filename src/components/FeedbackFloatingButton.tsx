import { useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import FeedbackDialog from "@/components/FeedbackDialog";

interface FeedbackFloatingButtonProps {
  className?: string;
}

export default function FeedbackFloatingButton({ className }: FeedbackFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className={`fixed z-50 ${className}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 px-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Lightbulb className="w-5 h-5 mr-2" />
          <span className="font-medium">提建议</span>
        </Button>
      </motion.div>

      {/* Feedback Dialog */}
      <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
