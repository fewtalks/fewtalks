<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cTTgH0uqUMp8-qJZ4W0IqOpINe4rEX7F

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set environment variables in `.env.local`:
   - `GEMINI_API_KEY` - Your Gemini API key (required)
   - `GOOGLE_CLIENT_ID` - Your Google OAuth Client ID (required for login)
   - `ADMIN_EMAIL` - (Optional) Email address to receive login notifications. If not set, notifications will be sent to the user's email
   - `EMAIL_SERVICE_URL` - (Optional) Your email service API endpoint for login notifications
   - `EMAILJS_SERVICE_ID` - (Optional) EmailJS service ID (alternative to custom email service)
   - `EMAILJS_TEMPLATE_ID` - (Optional) EmailJS template ID
   - `EMAILJS_PUBLIC_KEY` - (Optional) EmailJS public key
3. Run the app:
   `npm run dev`

## Email Notifications

The app sends email notifications when users log in. You can configure this using one of the following methods:

### Option 1: PHP Email Endpoint (Recommended)
Use the included PHP endpoint (`api/send-login-notification.php`) with Gmail SMTP:

1. Configure Gmail App Password in `api/send-login-notification.php`
2. Upload the `api` folder to your web server
3. Set in `.env.local`:
   ```env
   EMAIL_SERVICE_URL=https://fewtalks.com/api/send-login-notification.php
   ADMIN_EMAIL=fewtalks007@gmail.com
   ```

See `api/README.md` for detailed setup instructions.

### Option 2: Custom Email Service API
Set `EMAIL_SERVICE_URL` to use your own email service API.

### Option 3: EmailJS
Set `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, and `EMAILJS_PUBLIC_KEY` to use EmailJS.

### Option 4: Development Mode
If no email service is configured, login information will be logged to the console and stored in localStorage for development purposes.

## Mobile Optimizations

The app has been optimized for mobile devices, especially iOS:
- Improved touch targets (minimum 44px)
- Better mobile layout and spacing
- iOS-specific login flow improvements
- Responsive design for all screen sizes
