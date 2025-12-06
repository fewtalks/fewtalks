import { User } from '../types';

// Email service configuration
// Uses PHP endpoint for sending login notifications
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || '';
// Admin email to receive login notifications (leave empty to send to user's email)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fewtalks007@gmail.com';

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
          to: ADMIN_EMAIL || user.email,
          reply_to: user.email,
          subject: 'Fewtalks - Login Notification',
          data: emailData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email service returned ${response.status}`);
      }
      return; // Success, exit early
    } else {
      // No email service configured - just log
      console.log('Login notification (email service not configured):', loginInfo);
    }
  } catch (error) {
    // Don't fail login if email fails - just log the error
    console.error('Failed to send login notification email:', error);
  }
};

