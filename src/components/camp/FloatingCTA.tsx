import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface FloatingCTAProps {
  onClick: () => void;
}

export function FloatingCTA({ onClick }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 300px
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <Button
        size="lg"
        onClick={onClick}
        className="shadow-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 hover:scale-105 transition-all duration-300 gap-2 px-6 py-6 text-lg rounded-full"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        立即加入训练营
      </Button>
    </div>
  );
}
