// Google Analytics utility functions

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Track page views (for SPA navigation)
export const trackPageView = (page_path: string, page_title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-PNESQ229L4', {
      page_path,
      page_title: page_title || document.title,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventCategory: string,
  eventLabel?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel,
      value: value,
    });
  }
};

// Track tool selection
export const trackToolSelection = (tool: string) => {
  trackEvent('tool_selected', 'Navigation', tool);
  trackPageView(`/tools/${tool.toLowerCase()}`, `${tool} - Fewtalks`);
};

// Track user sign in
export const trackSignIn = (method: string = 'google') => {
  trackEvent('sign_in', 'Authentication', method);
};

// Track user sign out
export const trackSignOut = () => {
  trackEvent('sign_out', 'Authentication');
};

// Track content generation
export const trackContentGeneration = (contentType: 'tweet' | 'image' | 'video', success: boolean) => {
  trackEvent(
    success ? 'content_generated' : 'content_generation_failed',
    'Content Creation',
    contentType,
    success ? 1 : 0
  );
};

// Track upgrade to Pro
export const trackUpgradeToPro = () => {
  trackEvent('upgrade_to_pro', 'Conversion', 'pro_upgrade', 1);
};

// Track profile view
export const trackProfileView = () => {
  trackPageView('/profile', 'Profile - Fewtalks');
};

// Track main view
export const trackMainView = () => {
  trackPageView('/', 'Fewtalks - AI Content Suite');
};

