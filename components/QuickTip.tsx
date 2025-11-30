import React, { useState, useEffect } from 'react';
import { LightBulbIcon } from './icons/LightBulbIcon';

const tips = [
  "Stuck for ideas? Use the 'Trending News' feature to generate tweets about current events.",
  "When generating images, be descriptive! Try adding details like 'digital painting' or 'photorealistic'.",
  "Transform a key quote from your blog post into a powerful, standalone tweet for maximum impact.",
  "Experiment with different tones like 'Professional', 'Casual', or 'Witty' to find your brand's unique voice.",
  "Your creation history is saved to your profile. Revisit your best ideas anytime!",
  "Coming soon: Instantly generate engaging short videos from just a text prompt.",
];

const QuickTip: React.FC = () => {
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentTip(prevTip => {
          const currentIndex = tips.indexOf(prevTip);
          const nextIndex = (currentIndex + 1) % tips.length;
          return tips[nextIndex];
        });
        setIsFading(false);
      }, 500); // fade out duration
    }, 7000); // 7 seconds per tip

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="container mx-auto px-6 -mt-10 mb-10">
      <div className="bg-slate-200/50 dark:bg-brand-light/50 backdrop-blur-sm p-4 rounded-xl border border-slate-300 dark:border-slate-700 max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400/20 p-2 rounded-full">
            <LightBulbIcon />
          </div>
          <p 
            className={`text-sm text-slate-700 dark:text-slate-300 transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
          >
            <strong className="font-semibold text-slate-800 dark:text-slate-200">Quick Tip:</strong> {currentTip}
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickTip;