import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { CheckIcon } from './icons/CheckIcon';
import { FREE_GENERATION_LIMIT } from '../services/historyService';

const Pricing: React.FC = () => {
  const { user, openLoginModal, openUpgradeModal } = useAuth();

  const handleUpgradeClick = () => {
    if (!user) {
      openLoginModal();
    } else if (!user.isPro) {
      openUpgradeModal();
    }
  };

  const buttonText = user ? (user.isPro ? 'You are Pro!' : 'Upgrade to Pro') : 'Upgrade to Pro';
  const isButtonDisabled = user?.isPro;

  return (
    <section id="pricing" className="py-20 px-6" style={{ display: 'none' }}>
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white text-center">
          Choose Your Plan
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-center">
          Start for free and upgrade when you need more power.
        </p>

        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="bg-white dark:bg-brand-light rounded-2xl shadow-lg p-8 border border-slate-200 dark:border-slate-700 flex flex-col">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Free</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">For getting started</p>
            <p className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
              $0<span className="text-lg font-medium text-slate-500 dark:text-slate-400">/month</span>
            </p>
            <ul className="mt-6 space-y-3 text-slate-600 dark:text-slate-300 flex-grow">
              <li className="flex items-center gap-3"><CheckIcon /> {FREE_GENERATION_LIMIT} Content Generations</li>
              <li className="flex items-center gap-3"><CheckIcon /> Tweet & Image Tools</li>
              <li className="flex items-center gap-3"><CheckIcon /> Basic Support</li>
            </ul>
            <button className="mt-8 w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-lg cursor-default">
              Your Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-8 border-2 border-brand-primary relative flex flex-col">
             <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                <span className="bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold text-brand-primary">Pro</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">For power users</p>
            <p className="mt-6 text-4xl font-bold text-slate-900 dark:text-white">
              $10<span className="text-lg font-medium text-slate-500 dark:text-slate-400">/month</span>
            </p>
            <ul className="mt-6 space-y-3 text-slate-600 dark:text-slate-300 flex-grow">
              <li className="flex items-center gap-3"><CheckIcon /> Unlimited Generations</li>
              <li className="flex items-center gap-3"><CheckIcon /> All Content Tools</li>
              <li className="flex items-center gap-3"><CheckIcon /> Access to Video (Soon)</li>
              <li className="flex items-center gap-3"><CheckIcon /> Priority Support</li>
            </ul>
             <button
              onClick={handleUpgradeClick}
              disabled={isButtonDisabled}
              className="mt-8 w-full bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
