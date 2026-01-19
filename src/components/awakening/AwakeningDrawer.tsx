import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Loader2, Send, X } from "lucide-react";
import { AwakeningDimension, InputMode, inputModes, LifeCard } from "@/config/awakeningConfig";
import AwakeningQuickSelect from "./AwakeningQuickSelect";
import AwakeningInputForm from "./AwakeningInputForm";
import AwakeningLifeCard from "./AwakeningLifeCard";
import { useAwakeningAnalysis } from "@/hooks/useAwakeningAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AwakeningDrawerProps {
  dimension: AwakeningDimension | null;
  isOpen: boolean;
  onClose: () => void;
}

const AwakeningDrawer: React.FC<AwakeningDrawerProps> = ({
  dimension,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState<InputMode>('template');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [detailedValue, setDetailedValue] = useState('');
  const [lifeCard, setLifeCard] = useState<LifeCard | null>(null);
  
  const { analyze, isAnalyzing } = useAwakeningAnalysis();

  const resetForm = () => {
    setInputMode('template');
    setSelectedWords([]);
    setValue1('');
    setValue2('');
    setDetailedValue('');
    setLifeCard(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleWordSelect = (word: string) => {
    setSelectedWords(prev => 
      prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const buildInputText = (): string => {
    if (!dimension) return '';
    
    if (inputMode === 'quick') {
      return selectedWords.join('、');
    } else if (inputMode === 'detailed') {
      return detailedValue;
    } else {
      // template mode
      const { templateParts } = dimension;
      let text = templateParts.prefix + (value1 || '...');
      if (templateParts.middle) {
        text += templateParts.middle + (value2 || '...');
      }
      if (templateParts.suffix) {
        text += templateParts.suffix;
      }
      return text;
    }
  };

  const canSubmit = (): boolean => {
    if (inputMode === 'quick') return selectedWords.length > 0;
    if (inputMode === 'detailed') return detailedValue.trim().length > 0;
    return value1.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!dimension || !canSubmit()) return;
    
    const inputText = buildInputText();
    
    try {
      const result = await analyze({
        type: dimension.id,
        input: inputText,
        userId: user?.id
      });
      
      if (result) {
        setLifeCard(result);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('分析失败，请稍后重试');
    }
  };

  const handleContinueChat = () => {
    if (!dimension) return;
    handleClose();
    navigate(dimension.coachRoute);
  };

  const handleGetTool = () => {
    if (!dimension) return;
    handleClose();
    navigate(dimension.toolRoute || dimension.coachRoute);
  };

  if (!dimension) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{dimension.emoji}</span>
              <DrawerTitle className="text-xl">{dimension.title}觉察</DrawerTitle>
            </div>
            <DrawerDescription>
              {dimension.template}
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-8 space-y-4 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="wait">
              {lifeCard ? (
              <motion.div
                key="lifecard"
                initial={{ opacity: 0.01, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.01, y: -20 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                >
                  <AwakeningLifeCard
                    lifeCard={lifeCard}
                    dimension={dimension}
                    onContinueChat={handleContinueChat}
                    onGetTool={handleGetTool}
                    onClose={handleClose}
                  />
                </motion.div>
              ) : (
              <motion.div
                key="input"
                initial={{ opacity: 0.01, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.01, y: -20 }}
                style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                  className="space-y-4"
                >
                  {/* 输入模式切换 */}
                  <div className="flex gap-2 justify-center">
                    {inputModes.map((mode) => (
                      <Button
                        key={mode.id}
                        variant={inputMode === mode.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInputMode(mode.id)}
                        className={cn(
                          "flex-1",
                          inputMode === mode.id && `bg-gradient-to-r ${dimension.gradient} text-white border-0`
                        )}
                      >
                        <span className="font-medium">{mode.label}</span>
                        <span className="ml-1 text-xs opacity-70">{mode.description}</span>
                      </Button>
                    ))}
                  </div>

                  {/* 输入区域 */}
                  <div className="min-h-[150px]">
                    {inputMode === 'quick' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          点选关键词，可多选：
                        </p>
                        <AwakeningQuickSelect
                          words={dimension.quickWords}
                          selectedWords={selectedWords}
                          onSelect={handleWordSelect}
                          primaryColor={dimension.primaryColor}
                        />
                        {selectedWords.length > 0 && (
                          <p className="text-sm text-foreground mt-3">
                            已选择：{selectedWords.join('、')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <AwakeningInputForm
                        dimension={dimension}
                        inputMode={inputMode}
                        value1={value1}
                        value2={value2}
                        detailedValue={detailedValue}
                        onChange1={setValue1}
                        onChange2={setValue2}
                        onDetailedChange={setDetailedValue}
                      />
                    )}
                  </div>

                  {/* 提交按钮 */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit() || isAnalyzing}
                    className={cn(
                      "w-full bg-gradient-to-r text-white",
                      dimension.gradient
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        正在分析...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        获取生命卡片
                      </>
                    )}
                  </Button>

                  {/* 未登录提示 */}
                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      登录后可保存记录，追踪成长轨迹
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AwakeningDrawer;
