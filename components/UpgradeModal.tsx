import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { SparklesIcon } from './icons/SparklesIcon';
import { trackUpgradeToPro } from '../utils/analytics';

const UpgradeModal: React.FC = () => {
  const { isUpgradeModalOpen, closeUpgradeModal, upgradeToPro } = useAuth();

  if (!isUpgradeModalOpen) {
    return null;
  }

  const handleConfirm = () => {
    // In a real app, this would redirect to a payment provider.
    // Here, we'll just mock the successful upgrade.
    trackUpgradeToPro();
    upgradeToPro();
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        onClick={closeUpgradeModal}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full text-center border border-slate-200 dark:border-slate-700 transform transition-transform duration-300 scale-95 animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button onClick={closeUpgradeModal} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close upgrade modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-[-1rem] mb-6">
            <div className="flex justify-center text-brand-primary mb-4">
                <SparklesIcon className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Upgrade to Pro</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">You're about to unlock unlimited content creation power!</p>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-left mb-6">
            <div className="flex justify-between items-center text-slate-800 dark:text-white">
                <span className="font-semibold">Fewtalks Pro Plan</span>
                <span className="font-bold">$10.00</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Billed monthly. Cancel anytime.</p>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full inline-flex items-center justify-center gap-3 bg-brand-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-brand-accent transition-colors transform hover:scale-105"
        >
          Confirm & Pay (Mock)
        </button>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            This is a demo. No payment will be processed.
        </p>
      </div>
       {/* Re-using animations from LoginModal */}
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes modalPop { from { transform: scale(0.95); opacity: 0.8; } to { transform: scale(1); opacity: 1; } }
        .animate-modal-pop { animation: modalPop 0.3s ease-out forwards; }
       `}</style>
    </div>
  );
};

export default UpgradeModal;