import React, { useState, useEffect, useCallback } from 'react';
import TweetGenerator from './components/TweetGenerator';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import ToolSelector from './components/ToolSelector';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import LoginModal from './components/LoginModal';
import ProfilePage from './components/ProfilePage';
import { useAuth } from './hooks/useAuth';
import * as historyService from './services/historyService';
import { HistoryItem } from './types';
import QuickTip from './components/QuickTip';
import { ThemeProvider } from './contexts/ThemeContext';
import Pricing from './components/Pricing';
import UpgradeModal from './components/UpgradeModal';
import Chat from './components/Chat';
import Vision from './components/Vision';
import LiveTalk from './components/LiveTalk';
import { trackToolSelection, trackMainView, trackProfileView } from './utils/analytics';


export type Tool = 'Tweets' | 'Images' | 'Videos' | 'Chat' | 'Vision' | 'Live';
type View = 'main' | 'profile';

const Hero: React.FC = () => (
  <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center">
    <div className="container mx-auto">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
        Your All-in-One{' '}
        <span className="text-brand-primary">AI Content Suite</span>
      </h1>
      <p className="mt-4 text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto px-4">
        Effortlessly generate engaging tweets, stunning images, and dynamic videos. Chat with AI, analyze images, and have real-time voice conversations.
      </p>
      <a
        href="#generator"
        className="mt-6 sm:mt-8 inline-block bg-brand-primary text-white font-bold px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg hover:bg-brand-accent active:bg-brand-accent/90 transition-all transform hover:scale-105 active:scale-95 touch-manipulation min-h-[48px] flex items-center justify-center"
      >
        Start Creating for Free
      </a>
    </div>
  </section>
);


const Footer: React.FC = () => (
  <footer className="bg-slate-200 dark:bg-brand-light mt-20">
    <div className="container mx-auto px-6 py-8 text-center text-slate-600 dark:text-slate-400">
      <p>&copy; {new Date().getFullYear()} Fewtalks. All rights reserved.</p>
      <p className="mt-2 text-sm">Transforming ideas into engaging social media content.</p>
    </div>
  </footer>
);

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState<Tool>('Tweets');
  const [view, setView] = useState<View>('main');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refreshHistory = useCallback(() => {
    if (user) {
      setHistory(historyService.getHistory(user.email));
    } else {
      setHistory([]);
    }
  }, [user]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Track view changes
  useEffect(() => {
    if (view === 'main') {
      trackMainView();
    } else if (view === 'profile') {
      trackProfileView();
    }
  }, [view]);

  // Track tool selection changes
  useEffect(() => {
    trackToolSelection(activeTool);
  }, [activeTool]);


  const renderActiveTool = () => {
    switch (activeTool) {
      case 'Tweets':
        return <TweetGenerator onHistoryChange={refreshHistory} />;
      case 'Images':
        return <ImageGenerator onHistoryChange={refreshHistory} />;
      case 'Videos':
        return <VideoGenerator onHistoryChange={refreshHistory} />;
      case 'Chat':
        return <Chat />;
      case 'Vision':
        return <Vision />;
      case 'Live':
        return <LiveTalk />;
      default:
        return <TweetGenerator onHistoryChange={refreshHistory} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-brand-dark font-sans text-slate-800 dark:text-slate-100">
      <Header setView={setView} />
      <main>
        {view === 'main' ? (
          <>
            <Hero />
            <QuickTip />
            <section id="generator" className="container mx-auto px-4 sm:px-6 py-6 sm:py-10">
              <ToolSelector activeTool={activeTool} setActiveTool={setActiveTool} />
              <div className="mt-6 sm:mt-8">
                {renderActiveTool()}
              </div>
            </section>
            <Pricing />
          </>
        ) : (
          <ProfilePage setView={setView} history={history} onHistoryChange={refreshHistory} />
        )}
      </main>
      <Footer />
      <LoginModal />
      <UpgradeModal />
    </div>
  );
};


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;