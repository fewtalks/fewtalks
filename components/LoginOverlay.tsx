import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './icons/GoogleIcon';

interface LoginOverlayProps {
  title: string;
  description: string;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ title, description }) => {
  const { signIn } = useAuth();

  return (
    <div className="absolute inset-0 bg-brand-light/30 flex flex-col items-center justify-center text-center p-8 rounded-2xl z-10">
      <div className="bg-brand-light p-8 rounded-xl shadow-2xl border border-slate-700">
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-slate-300 mb-6 max-w-sm">{description}</p>
        <button
          onClick={signIn}
          className="inline-flex items-center justify-center gap-2 bg-white text-slate-800 font-bold px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors transform hover:scale-105"
        >
          <GoogleIcon />
          Sign in to Start Creating
        </button>
      </div>
    </div>
  );
};

export default LoginOverlay;
