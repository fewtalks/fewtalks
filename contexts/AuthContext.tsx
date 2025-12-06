
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import { sendLoginNotification } from '../services/emailService';
import { trackSignIn, trackSignOut } from '../utils/analytics';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isUpgradeModalOpen: boolean;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  isContactModalOpen: boolean;
  openContactModal: () => void;
  closeContactModal: () => void;
  upgradeToPro: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const persistedUser = authService.getCurrentUser();
    if (persistedUser) {
      setUser(persistedUser);
    }
    setLoading(false);
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);
  
  const openUpgradeModal = () => setIsUpgradeModalOpen(true);
  const closeUpgradeModal = () => setIsUpgradeModalOpen(false);
  
  const openContactModal = () => setIsContactModalOpen(true);
  const closeContactModal = () => setIsContactModalOpen(false);

  const signIn = async () => {
    try {
      const loggedInUser = await authService.signInWithGoogle();
      setUser(loggedInUser);
      trackSignIn('google');
      closeLoginModal();
      
      // Send login notification email (non-blocking)
      sendLoginNotification(loggedInUser).catch((emailError) => {
        // Don't fail login if email fails
        console.error('Failed to send login email:', emailError);
      });
    } catch (error: any) {
      console.error("Sign in failed:", error);
      setUser(null);
      // Re-throw the error so the LoginModal can display it
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    trackSignOut();
    setUser(null);
  };
  
  const upgradeToPro = () => {
    if (user) {
      const upgradedUser = authService.upgradeUserToPro(user.email);
      if (upgradedUser) {
        setUser(upgradedUser);
      }
      closeUpgradeModal();
    }
  };

  const value = { user, loading, signIn, signOut, isLoginModalOpen, openLoginModal, closeLoginModal, isUpgradeModalOpen, openUpgradeModal, closeUpgradeModal, isContactModalOpen, openContactModal, closeContactModal, upgradeToPro };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};