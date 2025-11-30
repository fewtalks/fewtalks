import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './icons/GoogleIcon';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';

type View = 'main' | 'profile';

interface HeaderProps {
    setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ setView }) => {
  const { user, loading, openLoginModal, signOut: authSignOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setView('profile');
    setIsDropdownOpen(false);
  }

  const handleSignOut = async () => {
    await authSignOut();
    setView('main');
    setIsDropdownOpen(false);
  };

  const renderAuthControls = () => {
    if (loading) {
      return <div className="w-28 h-9 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse"></div>;
    }

    if (user) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
            className="flex items-center gap-2 touch-manipulation min-h-[44px] px-2 sm:px-0"
            aria-label="User menu"
          >
            <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-slate-300 dark:border-slate-600" />
            <span className="hidden sm:inline font-semibold text-slate-800 dark:text-white text-sm sm:text-base">{user.name}</span>
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-brand-light rounded-lg shadow-lg py-1 z-50 border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleProfileClick}
                className="block w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation min-h-[44px] flex items-center"
              >
                My Profile
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation min-h-[44px] flex items-center"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        onClick={openLoginModal}
        className="flex items-center gap-2 bg-white text-slate-800 font-semibold px-3 sm:px-4 py-2 rounded-lg hover:bg-slate-200 active:bg-slate-300 transition-colors border border-slate-300 touch-manipulation min-h-[44px] text-sm sm:text-base"
      >
        <GoogleIcon />
        <span className="hidden xs:inline">Login with Google</span>
        <span className="xs:hidden">Login</span>
      </button>
    );
  };

  return (
    <header className="bg-slate-100/80 dark:bg-brand-light/50 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50">
      <nav className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div 
          className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white touch-manipulation" 
          onClick={() => setView('main')} 
          style={{ cursor: 'pointer' }}
        >
          Few<span className="text-brand-primary">talks</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle theme"
            >
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            {renderAuthControls()}
        </div>
      </nav>
    </header>
  );
};

export default Header;