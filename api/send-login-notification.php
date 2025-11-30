<?php
/**
 * Gmail SMTP Email Handler for Login Notifications
 * Uses Gmail's SMTP server for reliable email delivery
 * 
 * SETUP INSTRUCTIONS:
 * 1. Get a Gmail App Password:
 *    - Go to Google Account → Security → 2-Step Verification → App passwords
 *    - Generate a new app password for "Mail"
 * 2. Replace YOUR_GMAIL_HERE and YOUR_APP_PASSWORD_HERE below
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (empty($input['data']['email']) || empty($input['data']['name'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields: email and name']);
    exit();
}

// Email Configuration - UPDATE THESE VALUES
$smtp_host = 'smtp.gmail.com';
$smtp_port = 587;
$smtp_username = 'YOUR_GMAIL_HERE@gmail.com';  // Your Gmail address
$smtp_password = 'YOUR_APP_PASSWORD_HERE';      // Your App Password (no spaces)
// Generate at: https://myaccount.google.com/apppasswords

// Get recipient email (admin email if provided, otherwise user's email)
$toEmail = !empty($input['to']) ? $input['to'] : $input['data']['email'];

// Sanitize data
$userEmail = htmlspecialchars(trim($input['data']['email']), ENT_QUOTES, 'UTF-8');
$userName = htmlspecialchars(trim($input['data']['name']), ENT_QUOTES, 'UTF-8');
$loginTime = !empty($input['data']['timestamp']) 
    ? date('Y-m-d H:i:s', strtotime($input['data']['timestamp']))
    : date('Y-m-d H:i:s');
$deviceType = htmlspecialchars(trim($input['data']['device_type'] ?? 'Unknown'), ENT_QUOTES, 'UTF-8');
$userAgent = htmlspecialchars(trim($input['data']['user_agent'] ?? 'Not available'), ENT_QUOTES, 'UTF-8');

$subject = !empty($input['subject']) ? $input['subject'] : 'Fewtalks - Login Notification';

// Log submission
$logFile = __DIR__ . '/login-notifications.json';
$notifications = [];
if (file_exists($logFile)) {
    $notifications = json_decode(file_get_contents($logFile), true) ?: [];
}

$logData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'user_email' => $userEmail,
    'user_name' => $userName,
    'device_type' => $deviceType,
    'notification_sent_to' => $toEmail
];
$notifications[] = $logData;
// Keep only last 100 notifications
if (count($notifications) > 100) {
    $notifications = array_slice($notifications, -100);
}
file_put_contents($logFile, json_encode($notifications, JSON_PRETTY_PRINT));

// Create email message
$emailMessage = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header { 
            background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%); 
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .header h2 { 
            margin: 0; 
            font-size: 24px; 
            font-weight: 600;
        }
        .content { 
            padding: 30px 20px; 
        }
        .field { 
            margin: 20px 0; 
            padding: 15px; 
            background: #f8fafc; 
            border-left: 4px solid #1DA1F2; 
            border-radius: 4px;
        }
        .label { 
            font-weight: 600; 
            color: #1DA1F2; 
            margin-bottom: 8px; 
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .value { 
            color: #333; 
            font-size: 16px; 
            margin-top: 5px;
        }
        .highlight { 
            color: #1DA1F2; 
            font-weight: 600; 
        }
        .footer { 
            text-align: center; 
            padding: 20px; 
            color: #777; 
            font-size: 12px; 
            background: #f9f9f9;
            border-top: 1px solid #eee;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h2>🔐 Login Notification</h2>
            <p style='margin: 10px 0 0 0; opacity: 0.9;'>Fewtalks AI Content Suite</p>
        </div>
        <div class='content'>
            <div class='info-box'>
                <strong>New user login detected</strong>
            </div>
            
            <div class='field'>
                <div class='label'>👤 User Name</div>
                <div class='value highlight'>$userName</div>
            </div>
            
            <div class='field'>
                <div class='label'>📧 User Email</div>
                <div class='value'>$userEmail</div>
            </div>
            
            <div class='field'>
                <div class='label'>⏰ Login Time</div>
                <div class='value'>$loginTime</div>
            </div>
            
            <div class='field'>
                <div class='label'>📱 Device Type</div>
                <div class='value'>$deviceType</div>
            </div>
            
            <div class='field'>
                <div class='label'>🌐 User Agent</div>
                <div class='value' style='font-size: 12px; word-break: break-all;'>$userAgent</div>
            </div>
        </div>
        <div class='footer'>
            <p>This is an automated notification from Fewtalks</p>
            <p>&copy; " . date('Y') . " Fewtalks. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
";

// Function to send email via SMTP socket
function sendEmailViaSMTP($to, $subject, $message, $from, $smtp_host, $smtp_port, $smtp_user, $smtp_pass, $replyTo = null) {
    try {
        // Connect to SMTP server
        $socket = fsockopen($smtp_host, $smtp_port, $errno, $errstr, 30);
        if (!$socket) {
            return false;
        }
        
        // Read initial response
        fgets($socket);
        
        // Send EHLO
        fputs($socket, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
        $response = '';
        while($line = fgets($socket)) {
            $response .= $line;
            if(substr($line, 3, 1) == ' ') break;
        }
        
        // Start TLS
        fputs($socket, "STARTTLS\r\n");
        fgets($socket);
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        
        // EHLO again after TLS
        fputs($socket, "EHLO " . $_SERVER['HTTP_HOST'] . "\r\n");
        while($line = fgets($socket)) {
            if(substr($line, 3, 1) == ' ') break;
        }
        
        // AUTH LOGIN
        fputs($socket, "AUTH LOGIN\r\n");
        fgets($socket);
        
        fputs($socket, base64_encode($smtp_user) . "\r\n");
        fgets($socket);
        
        fputs($socket, base64_encode($smtp_pass) . "\r\n");
        $auth_response = fgets($socket);
        
        if (strpos($auth_response, '235') === false) {
            fclose($socket);
            return false;
        }
        
        // Send email
        fputs($socket, "MAIL FROM: <$from>\r\n");
        fgets($socket);
        
        fputs($socket, "RCPT TO: <$to>\r\n");
        fgets($socket);
        
        fputs($socket, "DATA\r\n");
        fgets($socket);
        
        $replyToEmail = $replyTo ? $replyTo : $from;
        $headers = "From: $from\r\n";
        $headers .= "Reply-To: $replyToEmail\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Subject: $subject\r\n";
        
        fputs($socket, $headers . "\r\n" . $message . "\r\n.\r\n");
        fgets($socket);
        
        fputs($socket, "QUIT\r\n");
        fclose($socket);
        
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// Check if configuration is set up
if ($smtp_password === 'YOUR_APP_PASSWORD_HERE' || $smtp_username === 'YOUR_GMAIL_HERE@gmail.com') {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login notification logged. Please configure Gmail SMTP to enable email notifications.',
        'notification_logged' => true,
        'email_sent' => false,
        'note' => 'Configure Gmail App Password in send-login-notification.php'
    ]);
    exit();
}

// Get reply-to email if provided
$replyTo = !empty($input['reply_to']) ? $input['reply_to'] : $userEmail;

// Send email
if (sendEmailViaSMTP($toEmail, $subject, $emailMessage, $smtp_username, $smtp_host, $smtp_port, $smtp_username, $smtp_password, $replyTo)) {
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login notification sent successfully',
        'notification_logged' => true,
        'email_sent' => true
    ]);
} else {
    http_response_code(200);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to send email, but notification was logged',
        'notification_logged' => true,
        'email_sent' => false
    ]);
}
?>

