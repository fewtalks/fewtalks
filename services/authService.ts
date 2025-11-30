import { User } from '../types';

const USER_STORAGE_KEY = 'fewtalks_user';

// Store the initialization state
let isGoogleInitialized = false;

// Declare Google Identity Services types (FedCM compatible)
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
            }) => void;
            error_callback?: (error: any) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (notificationCallback?: (notification: {
            getNotDisplayedReason?: () => string;
            getSkippedReason?: () => string;
            getDismissedReason?: () => string;
            isNotDisplayed?: () => boolean;
            isSkippedMoment?: () => boolean;
            isDismissedMoment?: () => boolean;
          }) => void) => void;
          renderButton: (element: HTMLElement, config: {
            type?: string;
            theme?: string;
            size?: string;
            text?: string;
            shape?: string;
            logo_alignment?: string;
            width?: string;
            locale?: string;
          }) => void;
        };
      };
    };
  }
}

// Detect if device is iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Real Google Sign-In using Google Identity Services
export const signInWithGoogle = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      reject(new Error('Google Client ID is not configured'));
      return;
    }

    // Set a timeout to reject if sign-in takes too long
    const timeout = setTimeout(() => {
      reject(new Error('Sign-in timed out. Please try again.'));
    }, 60000); // 60 seconds timeout

    // Wait for Google Identity Services to load
    const checkGoogle = () => {
      if (window.google?.accounts?.id) {
        // Initialize Google Identity Services only once
        if (!isGoogleInitialized) {
          try {
            // For iOS, use a more compatible configuration
            const iosDevice = isIOS();
            
            window.google.accounts.id.initialize({
              client_id: clientId,
              use_fedcm_for_prompt: false, // Disable FedCM due to CORS issues and iOS compatibility
              callback: async (response: { credential: string }) => {
                clearTimeout(timeout);
                
                if (!response || !response.credential) {
                  reject(new Error('No credential received from Google'));
                  return;
                }

                try {
                  // Decode the JWT token to get user info
                  const parts = response.credential.split('.');
                  if (parts.length !== 3) {
                    throw new Error('Invalid JWT token format');
                  }

                  // Decode the payload (second part of JWT)
                  const payload = JSON.parse(atob(parts[1]));
                  
                  // Validate required fields
                  if (!payload.email) {
                    throw new Error('Email not found in token');
                  }
                  
                  // Check for existing user data to persist pro status
                  let existingUser = getCurrentUser();
                  const isPro = existingUser?.isPro || false;
                  
                  const user: User = {
                    name: payload.name || payload.given_name || 'User',
                    email: payload.email,
                    avatarUrl: payload.picture || `https://api.dicebear.com/8.x/avataaars/svg?seed=${payload.email}`,
                    isPro: isPro,
                  };
                  
                  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
                  resolve(user);
                } catch (error: any) {
                  console.error('Error processing Google sign-in:', error);
                  console.error('Response credential:', response.credential?.substring(0, 50) + '...');
                  reject(new Error(`Failed to process sign-in: ${error.message || 'Unknown error'}`));
                }
              },
              error_callback: (error: any) => {
                clearTimeout(timeout);
                console.error('Google sign-in error callback:', error);
                const errorMessage = error?.message || error?.type || 'Google sign-in failed';
                // Provide more helpful error messages for iOS
                if (isIOS() && errorMessage.includes('popup')) {
                  reject(new Error('Please allow popups in your browser settings and try again.'));
                } else {
                  reject(new Error(errorMessage));
                }
              },
            });
            
            isGoogleInitialized = true;
          } catch (error: any) {
            clearTimeout(timeout);
            console.error('Failed to initialize Google Identity Services:', error);
            reject(new Error(`Failed to initialize Google sign-in: ${error.message || 'Unknown error'}`));
            return;
          }
        }
        
        // For iOS devices, skip One Tap and rely on button click
        // One Tap has known issues on iOS Safari
        if (!isIOS()) {
          // Use One Tap prompt for non-iOS devices
          setTimeout(() => {
            try {
              window.google.accounts.id.prompt((notification: any) => {
                if (notification) {
                  const notDisplayedReason = notification.getNotDisplayedReason?.();
                  const skippedReason = notification.getSkippedReason?.();
                  const dismissedReason = notification.getDismissedReason?.();
                  
                  if (notDisplayedReason) {
                    console.log('One Tap not displayed:', notDisplayedReason);
                  }
                  if (skippedReason) {
                    console.log('One Tap skipped:', skippedReason);
                  }
                  if (dismissedReason) {
                    console.log('One Tap dismissed:', dismissedReason);
                  }
                }
              });
            } catch (error: any) {
              console.error('Failed to show Google sign-in prompt:', error);
              // Don't reject - button click will still work
            }
          }, 100);
        } else {
          // For iOS, trigger the sign-in flow directly via button render
          // This will be handled by the LoginModal component
          console.log('iOS device detected - using button-based sign-in');
        }
      } else {
        // Retry after a short delay if Google Identity Services hasn't loaded yet
        // But limit retries to avoid infinite loop
        const maxRetries = 50; // 5 seconds max wait
        let retryCount = 0;
        const retryCheck = () => {
          retryCount++;
          if (window.google?.accounts?.id) {
            checkGoogle();
          } else if (retryCount < maxRetries) {
            setTimeout(retryCheck, 100);
          } else {
            clearTimeout(timeout);
            reject(new Error('Google Identity Services failed to load. Please refresh the page.'));
          }
        };
        setTimeout(retryCheck, 100);
      }
    };

    // Start checking for Google Identity Services
    if (document.readyState === 'complete') {
      checkGoogle();
    } else {
      window.addEventListener('load', checkGoogle);
    }
  });
};

// Mock function to sign out
export const signOut = (): Promise<void> => {
  return new Promise((resolve) => {
    localStorage.removeItem(USER_STORAGE_KEY);
    resolve();
  });
};

// Function to get current user from localStorage
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
};

// Function to upgrade a user to pro
export const upgradeUserToPro = (userEmail: string): User | null => {
  const user = getCurrentUser();
  if (user && user.email === userEmail) {
    const upgradedUser = { ...user, isPro: true };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(upgradedUser));
    return upgradedUser;
  }
  return null;
};
