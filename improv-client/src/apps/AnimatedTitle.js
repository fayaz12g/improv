import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedTitle = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const title = "IMPROVIMANIA";

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="text-center">
        <div className="mb-8">
          {title.split('').map((letter, index) => (
            <motion.span
              key={index}
              className="inline-block text-6xl font-bold text-yellow-400"
              initial={{ opacity: 0, scale: 0.5, x: -100 }}
              animate={{
                opacity: 1,
                scale: [1, 1.2, 1],
                x: 0,
                y: isAnimating ? [0, -20, 0] : 0,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                y: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 5 + 5,
                  ease: "easeInOut"
                }
              }}
            >
              {letter}
            </motion.span>
          ))}
        </div>
        <button className="px-6 py-3 bg-yellow-400 text-gray-900 rounded-full text-xl font-semibold hover:bg-yellow-300 transition-colors">
          Play Now
        </button>
      </div>
    </div>
  );
};

export default AnimatedTitle;