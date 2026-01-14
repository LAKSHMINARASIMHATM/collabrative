# Email Service Setup for Collaboration Invitations

## Overview
The collaboration invitation system now includes proper email sending functionality with multiple fallback options.

## Architecture

### 1. Email Service (`lib/collaboration/email-service.ts`)
Handles the logic for sending collaboration invitations:
- Primary: API backend call
- Fallback: mailto link
- Last resort: Copy link to clipboard

### 2. API Route (`app/api/send-invite/route.ts`)
Backend endpoint for sending emails:
- Validates email addresses
- Integrates with email service providers
- Returns success/error responses

### 3. Integration
The collaborators panel uses the email service to send invitations when users enter an email address.

## Setup Instructions

### Option 1: Using SendGrid (Recommended)

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Get API Key:**
   - Sign up at https://sendgrid.com
   - Create an API key
   - Verify a sender email

3. **Add Environment Variables:**
   Create `.env.local`:
   ```bash
   SENDGRID_API_KEY=your_api_key_here
   SENDER_EMAIL=noreply@yourdomain.com
   ```

4. **Uncomment SendGrid Code:**
   In `app/api/send-invite/route.ts`, uncomment the SendGrid integration section.

### Option 2: Using Resend

1. **Install Resend:**
   ```bash
   npm install resend
   ```

2. **Setup:**
   ```typescript
   import { Resend } from 'resend'
   const resend = new Resend(process.env.RESEND_API_KEY)
   
   await resend.emails.send({
     from: 'onboarding@resend.dev',
     to: email,
     subject: 'Join my coding session',
     html: `<p>Click to join: <a href="${link}">${link}</a></p>`
   })
   ```

### Option 3: Using AWS SES

1. **Install AWS SDK:**
   ```bash
   npm install @aws-sdk/client-ses
   ```

2. **Configure:**
   ```typescript
   import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
   
   const client = new SESClient({ region: "us-east-1" })
   const command = new SendEmailCommand({
     Source: process.env.SENDER_EMAIL,
     Destination: { ToAddresses: [email] },
     Message: {
       Subject: { Data: subject },
       Body: { Html: { Data: htmlBody } }
     }
   })
   
   await client.send(command)
   ```

## How It Works

### 1. User Invites Collaborator
```
User enters email → Click "Send Invite"
```

### 2. Email Service Flow
```
1. Validate email format
2. Check not inviting self
3. Try API backend (/api/send-invite)
   ├─ Success → Email sent via provider
   └─ Fail → Open mailto link
4. Show success/error toast
5. Display "Sent" confirmation
```

### 3. Email Content
The invitation email includes:
- Sender's name and email
- Collaboration link
- Instructions to join
- What collaborators can do

## Testing

### Development Mode
Without email service configured:
- Opens default email client (mailto)
- Link is copied to clipboard as fallback
- Shows appropriate error messages

### Production Mode
With email service configured:
- Sends actual emails
- Professional HTML templates
- Delivery tracking
- Error handling

## Email Template

The email includes:
```
Subject: [Sender Name] invited you to collaborate

Body:
Hi there!

[Sender Name] ([sender@email.com]) has invited you to join 
a real-time coding collaboration session.

🔗 Join the session:
[Collaboration Link]

What you can do:
• Edit code together in real-time
• See each other's cursors and selections
• Chat and communicate
• Share your screen

Click the link above to start collaborating!
```

## Troubleshooting

### Emails Not Sending
1. Check API key is correct
2. Verify sender email is verified
3. Check API route logs
4. Test with mailto fallback

### mailto Not Opening
- Browser may block popups
- User needs default email client configured
- Link is copied to clipboard as backup

### Rate Limits
- SendGrid free: 100 emails/day
- Resend free: 100 emails/day
- AWS SES: Pay per email

## Security

- Email addresses are validated
- API route checks for required fields
- No sensitive data in URLs
- Session IDs are unique and secure

## Future Enhancements

- [ ] Email templates with HTML/CSS
- [ ] Track email delivery status
- [ ] Resend failed invitations
- [ ] Batch invitations
- [ ] Custom invitation messages
- [ ] Expiring collaboration links
