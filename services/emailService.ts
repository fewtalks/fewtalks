import { User } from '../types';

// Email service configuration
// This can be configured to use EmailJS, SendGrid, or any other email service
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || '';
// Admin email to receive login notifications (leave empty to send to user's email)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

interface LoginInfo {
  email: string;
  name: string;
  timestamp: string;
  userAgent: string;
  ipAddress?: string;
  deviceType: string;
}

// Detect device type
const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'iOS';
  }
  if (/Android/.test(ua)) {
    return 'Android';
  }
  if (/Windows/.test(ua)) {
    return 'Windows';
  }
  if (/Mac/.test(ua)) {
    return 'macOS';
  }
  if (/Linux/.test(ua)) {
    return 'Linux';
  }
  return 'Unknown';
};

// Send login notification email
export const sendLoginNotification = async (user: User): Promise<void> => {
  try {
    const loginInfo: LoginInfo = {
      email: user.email,
      name: user.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
    };

    // Prepare data for PHP endpoint
    const emailData = {
      email: loginInfo.email,
      name: loginInfo.name,
      timestamp: loginInfo.timestamp,
      device_type: loginInfo.deviceType,
      user_agent: loginInfo.userAgent,
    };

    // If email service URL is configured, use it
    if (EMAIL_SERVICE_URL) {
      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ADMIN_EMAIL || user.email, // Send to admin email if configured, otherwise to user
          reply_to: user.email, // Include user's email as reply-to
          subject: 'Fewtalks - Login Notification',
          template: 'login-notification',
          data: emailData, // Send formatted data for PHP endpoint
        }),
      });

      if (!response.ok) {
        throw new Error(`Email service returned ${response.status}`);
      }
    } else {
      // Fallback: Use EmailJS if configured
      const emailjsServiceId = process.env.EMAILJS_SERVICE_ID;
      const emailjsTemplateId = process.env.EMAILJS_TEMPLATE_ID;
      const emailjsPublicKey = process.env.EMAILJS_PUBLIC_KEY;
      
      if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
        // Check if EmailJS is loaded, if not try to load it
        if (!window.emailjs) {
          // Try to load EmailJS script
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
          script.async = true;
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          
          // Initialize EmailJS
          if (window.emailjs) {
            window.emailjs.init(emailjsPublicKey);
          }
        }
        
        if (window.emailjs) {
          try {
            await window.emailjs.send(
              emailjsServiceId,
              emailjsTemplateId,
              {
                to_email: ADMIN_EMAIL || user.email, // Send to admin email if configured, otherwise to user
                to_name: ADMIN_EMAIL ? 'Admin' : user.name,
                user_email: user.email, // Always include user's email in the template
                user_name: user.name,
                login_time: new Date().toLocaleString(),
                device_type: loginInfo.deviceType,
                user_agent: loginInfo.userAgent,
              }
            );
            return; // Success, exit early
          } catch (emailjsError) {
            console.error('EmailJS send failed:', emailjsError);
            // Fall through to localStorage storage
          }
        }
      }
      
      // If no email service is configured or all attempts failed, log to console (for development)
      console.log('Login notification (email service not configured):', loginInfo);
      
      // Store login info in localStorage for manual retrieval if needed
      const loginHistory = JSON.parse(localStorage.getItem('fewtalks_login_history') || '[]');
      loginHistory.push(loginInfo);
      // Keep only last 10 logins
      if (loginHistory.length > 10) {
        loginHistory.shift();
      }
      localStorage.setItem('fewtalks_login_history', JSON.stringify(loginHistory));
    }
  } catch (error) {
    // Don't fail login if email fails - just log the error
    console.error('Failed to send login notification email:', error);
  }
};

// Declare EmailJS types if using EmailJS
declare global {
  interface Window {
    emailjs?: {
      init: (publicKey: string) => void;
      send: (
        serviceId: string,
        templateId: string,
        templateParams: Record<string, any>
      ) => Promise<any>;
    };
  }
}

