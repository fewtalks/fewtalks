# API Endpoints

## Login Notification Endpoint

### File: `send-login-notification.php`

This endpoint sends email notifications when users log in to the Fewtalks application.

### Setup Instructions

1. **Get a Gmail App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled
   - Go to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password (no spaces)

2. **Configure the PHP file:**
   - Open `api/send-login-notification.php`
   - Replace `YOUR_GMAIL_HERE@gmail.com` with your Gmail address
   - Replace `YOUR_APP_PASSWORD_HERE` with your Gmail App Password

3. **Upload to your server:**
   - Upload the `api` folder to your web server
   - Ensure PHP has write permissions for the `login-notifications.json` log file

### Environment Variables

In your `.env.local` file for the frontend:

```env
EMAIL_SERVICE_URL=https://fewtalks.com/api/send-login-notification.php
ADMIN_EMAIL=fewtalks007@gmail.com
```

### API Request Format

```json
{
  "to": "admin@example.com",
  "reply_to": "user@example.com",
  "subject": "Fewtalks - Login Notification",
  "template": "login-notification",
  "data": {
    "email": "user@example.com",
    "name": "User Name",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "device_type": "iOS",
    "user_agent": "Mozilla/5.0..."
  }
}
```

### API Response

**Success:**
```json
{
  "success": true,
  "message": "Login notification sent successfully",
  "notification_logged": true,
  "email_sent": true
}
```

**Failure (but logged):**
```json
{
  "success": false,
  "message": "Failed to send email, but notification was logged",
  "notification_logged": true,
  "email_sent": false
}
```

### Logging

All login attempts are logged to `api/login-notifications.json` (last 100 entries) for audit purposes.

### Security Notes

- The endpoint uses CORS headers to allow requests from your frontend domain
- Consider restricting `Access-Control-Allow-Origin` to your specific domain in production
- The Gmail App Password should be kept secure and never committed to version control
- Consider using environment variables or a config file outside the web root for credentials

