import React from 'react';
import { motion } from 'framer-motion';

interface ThinkingAnimationProps {
  text?: string;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ 
  text = "AI 正在為您生成創意..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      <div className="relative w-24 h-24">
        {/* 核心光暈 */}
        <motion.div
          className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* 旋轉的外圈 */}
        <motion.div
          className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* 反向旋轉的內圈 */}
        <motion.div
          className="absolute inset-4 border-4 border-purple-500/30 border-b-purple-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* 中心脈衝點 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 bg-gradient-to-r from-primary to-purple-500 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>

      {/* 動態文字 */}
      <div className="flex flex-col items-center space-y-2">
        <motion.h3
          className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {text}
        </motion.h3>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary/50 rounded-full"
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThinkingAnimation;

