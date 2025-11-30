import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { HistoryItem } from '../types';
import HistoryPanel from './HistoryPanel';

type View = 'main' | 'profile';

interface ProfilePageProps {
  setView: (view: View) => void;
  history: HistoryItem[];
  onHistoryChange: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ setView, history, onHistoryChange }) => {
  const { user } = useAuth();

  if (!user) {
    // This should ideally not be reached if routing is correct
    return (
      <div className="container mx-auto px-6 py-10 text-center">
        <p>Please log in to view your profile.</p>
        <button onClick={() => setView('main')} className="mt-4 bg-brand-primary text-white font-bold px-6 py-2 rounded-lg">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('main')} className="text-sm text-slate-600 dark:text-slate-300 hover:text-brand-primary mb-6">
          &larr; Back to Creator Suite
        </button>

        <div className="bg-white dark:bg-brand-light p-8 rounded-2xl shadow-xl flex items-center gap-6">
          <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
            <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>

        <div className="mt-10">
          <HistoryPanel historyItems={history} onHistoryChange={onHistoryChange} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;