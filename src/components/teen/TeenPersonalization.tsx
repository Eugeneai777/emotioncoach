import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// 头像选项
const AVATARS = [
  { id: 'star', emoji: '⭐', name: '小星星' },
  { id: 'moon', emoji: '🌙', name: '小月亮' },
  { id: 'cat', emoji: '🐱', name: '小猫咪' },
  { id: 'rabbit', emoji: '🐰', name: '小兔子' },
  { id: 'bear', emoji: '🐻', name: '小熊熊' },
  { id: 'flower', emoji: '🌸', name: '小花朵' },
  { id: 'cloud', emoji: '☁️', name: '小云朵' },
  { id: 'rainbow', emoji: '🌈', name: '小彩虹' },
];

// 预设问候语
const GREETING_PRESETS = [
  '有什么想聊的吗？',
  '今天过得怎么样？',
  '说说你的心事吧～',
  '我在这里陪你',
];

interface TeenPersonalizationProps {
  initialNickname?: string;
  onComplete: (data: {
    nickname: string;
    avatar: string;
    greeting: string;
  }) => void;
}

export default function TeenPersonalization({
  initialNickname,
  onComplete
}: TeenPersonalizationProps) {
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState(initialNickname || '');
  const [selectedAvatar, setSelectedAvatar] = useState('star');
  const [greeting, setGreeting] = useState(GREETING_PRESETS[0]);
  const [customGreeting, setCustomGreeting] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        nickname: nickname || '朋友',
        avatar: selectedAvatar,
        greeting: customGreeting || greeting
      });
    }
  };

  const selectedAvatarData = AVATARS.find(a => a.id === selectedAvatar);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center px-6">
      <motion.div 
        className="bg-white/80 backdrop-blur rounded-3xl p-8 max-w-sm w-full shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 进度指示 */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-violet-500' : i < step ? 'bg-violet-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step 1: 选择头像 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">选择你的头像</h2>
            <p className="text-sm text-muted-foreground mb-6">挑一个代表你的小图标</p>
            
            <div className="grid grid-cols-4 gap-3 mb-6">
              {AVATARS.map(avatar => (
                <motion.button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${
                    selectedAvatar === avatar.id
                      ? 'bg-violet-100 ring-2 ring-violet-500 ring-offset-2'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {avatar.emoji}
                </motion.button>
              ))}
            </div>

            {selectedAvatarData && (
              <p className="text-sm text-violet-600 mb-6">
                {selectedAvatarData.name}
              </p>
            )}
          </motion.div>
        )}

        {/* Step 2: 设置昵称 */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-4xl mb-4">{selectedAvatarData?.emoji}</div>
            <h2 className="text-xl font-bold text-foreground mb-2">怎么称呼你？</h2>
            <p className="text-sm text-muted-foreground mb-6">给自己起个小名字吧</p>
            
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="输入昵称..."
              maxLength={10}
              className="text-center text-lg h-12 rounded-xl border-violet-200 focus:border-violet-500"
            />
            
            <p className="text-xs text-muted-foreground mt-2">
              不填也可以，我会叫你"朋友"
            </p>
          </motion.div>
        )}

        {/* Step 3: 自定义问候语 */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-4xl mb-4">{selectedAvatarData?.emoji}</div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {nickname || '朋友'}，你好！
            </h2>
            <p className="text-sm text-muted-foreground mb-6">选择开场问候语</p>
            
            <div className="space-y-2 mb-4">
              {GREETING_PRESETS.map((g, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setGreeting(g);
                    setCustomGreeting('');
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-sm transition-all ${
                    greeting === g && !customGreeting
                      ? 'bg-violet-100 text-violet-700 font-medium'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="relative">
              <Input
                value={customGreeting}
                onChange={(e) => setCustomGreeting(e.target.value)}
                placeholder="或者自己写一句..."
                maxLength={30}
                className="text-center rounded-xl border-violet-200"
              />
            </div>
          </motion.div>
        )}

        {/* 下一步按钮 */}
        <Button
          onClick={handleNext}
          className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600"
        >
          {step < 3 ? '下一步' : '开始聊天 ✨'}
        </Button>

        {/* 跳过按钮 */}
        {step === 1 && (
          <button
            onClick={() => onComplete({
              nickname: initialNickname || '朋友',
              avatar: 'star',
              greeting: GREETING_PRESETS[0]
            })}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            跳过设置
          </button>
        )}
      </motion.div>
    </div>
  );
}
