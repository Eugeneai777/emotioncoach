import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import {
  BLIND_SPOT_BY_DIMENSION,
  FALLBACK_BLIND_SPOTS,
  type VitalityDimensionKey,
} from "@/config/maleMidlifeVitalityCopy";

interface Props {
  weakestKey: VitalityDimensionKey | null;
  weakestLabel?: string;
}

export function BlindSpotActionCard({ weakestKey, weakestLabel }: Props) {
  const items = (weakestKey && BLIND_SPOT_BY_DIMENSION[weakestKey]) || FALLBACK_BLIND_SPOTS;
  return (
    <Card className="border-amber-300/40 bg-gradient-to-br from-amber-50/80 via-card to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 shadow-sm overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-bold text-sm text-foreground">3 个你可能没说出口的盲区</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3 ml-8">
          {weakestLabel ? `基于你最弱的「${weakestLabel}」维度` : "基于中年男性最常见的状态"}
        </p>
        <ul className="space-y-2">
          {items.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-card/60 border border-amber-100/60 dark:border-amber-900/30"
            >
              <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90">{t}</span>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
