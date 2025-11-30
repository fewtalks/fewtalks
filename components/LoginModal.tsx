import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './icons/GoogleIcon';

// Detect if device is iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const buttonRenderedRef = useRef(false);

  useEffect(() => {
    if (isLoginModalOpen && googleButtonRef.current && !buttonRenderedRef.current) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      if (clientId && window.google?.accounts?.id) {
        try {
          // Clear any existing button
          googleButtonRef.current.innerHTML = '';
          
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
            locale: 'en',
          });

          // Set up the callback for iOS compatibility
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential: string }) => {
              if (response?.credential) {
                setError(null);
                setIsLoading(true);
                try {
                  await signIn();
                } catch (err: any) {
                  setError(err?.message || 'Sign in failed. Please try again.');
                } finally {
                  setIsLoading(false);
                }
              }
            },
            error_callback: (error: any) => {
              console.error('Google sign-in error:', error);
              setError('Sign in failed. Please try again.');
              setIsLoading(false);
            },
          });

          buttonRenderedRef.current = true;
        } catch (err) {
          console.error('Failed to render Google button:', err);
        }
      }
    }

    // Reset when modal closes
    if (!isLoginModalOpen) {
      buttonRenderedRef.current = false;
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = '';
      }
    }
  }, [isLoginModalOpen, signIn]);

  if (!isLoginModalOpen) {
    return null;
  }

  const handleButtonClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signIn();
    } catch (err: any) {
      setError(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
        onClick={closeLoginModal}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 sm:p-8 m-4 max-w-md w-full text-center border border-slate-200 dark:border-slate-700 transform transition-transform duration-300 scale-95 animate-modal-pop max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <div className="flex justify-end mb-2">
          <button 
            onClick={closeLoginModal} 
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 touch-manipulation" 
            aria-label="Close login modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-[-0.5rem] mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Unlock Full Access</h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Please sign in to continue creating content.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Google Sign-In Button Container */}
        <div className="w-full mb-4">
          {isIOS() ? (
            // For iOS, use custom button that triggers the sign-in flow
            <button
              onClick={handleButtonClick}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-800 font-bold px-6 py-3 rounded-lg hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
            >
              <GoogleIcon />
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>
          ) : (
            // For other devices, try to use Google's rendered button
            <div ref={googleButtonRef} className="w-full flex justify-center">
              {!buttonRenderedRef.current && (
                <button
                  onClick={handleButtonClick}
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-3 bg-white text-slate-800 font-bold px-6 py-3 rounded-lg hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
                >
                  <GoogleIcon />
                  {isLoading ? 'Signing in...' : 'Sign in with Google'}
                </button>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
            By signing in, you agree to our terms of service.
        </p>
      </div>
       <style>{`
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes modalPop {
            from { transform: scale(0.95); opacity: 0.8; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop {
             animation: modalPop 0.3s ease-out forwards;
        }
        .touch-manipulation {
            touch-action: manipulation;
        }
       `}</style>
    </div>
  );
};

export default LoginModal;