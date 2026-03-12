import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Pause } from "lucide-react";

const phases = [
  { start: 90, end: 61, text: "深呼吸…\n吸气 4 秒，呼气 6 秒" },
  { start: 60, end: 31, text: "整理一下你的情绪…\n你现在感觉到什么？" },
  { start: 30, end: 1, text: "想想你真正害怕失去什么…\n是这个人，不是这件事。" },
];

const UsAICalmButton = () => {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(90);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!active) return;
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer.current);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, [active]);

  const phase = phases.find((p) => seconds <= p.start && seconds >= p.end);

  const handleStart = () => {
    setActive(true);
    setDone(false);
    setSeconds(90);
  };

  return (
    <section className="px-5">
      <h2 className="text-lg font-bold text-usai-foreground mb-1 px-1">吵架冷静按钮</h2>
      <p className="text-sm text-muted-foreground mb-5 px-1">当情绪很大的时候，先暂停 90 秒。</p>

      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!active && !done && (
            <motion.button
              key="start"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="w-36 h-36 rounded-full bg-gradient-to-br from-usai-primary to-usai-accent flex flex-col items-center justify-center text-white shadow-xl shadow-usai-primary/30"
            >
              <Pause className="w-8 h-8 mb-1" />
              <span className="text-sm font-semibold">暂停 90 秒</span>
            </motion.button>
          )}

          {active && !done && (
            <motion.div
              key="timer"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-36 h-36 rounded-full bg-usai-light border-4 border-usai-primary/30 flex items-center justify-center">
                <span className="text-4xl font-bold text-usai-primary">{seconds}</span>
              </div>
              <p className="text-sm text-usai-foreground text-center whitespace-pre-line leading-relaxed">
                {phase?.text}
              </p>
            </motion.div>
          )}

          {done && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-usai-light p-5 border border-usai-primary/10 text-center space-y-3 w-full"
            >
              <p className="text-sm text-muted-foreground">💌 你可以试着发一句：</p>
              <p className="text-base text-usai-foreground font-medium italic leading-relaxed">
                "刚刚我语气有点重，其实我只是有点累，不是不在乎你。"
              </p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActive(false); setDone(false); }}
                className="text-xs text-usai-primary font-medium"
              >
                再来一次
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default UsAICalmButton;
