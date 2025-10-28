# Supabase Email Templates

This folder contains professional email templates for Vox-Operis authentication emails.

## Setup Instructions

### 1. Access Supabase Email Templates

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **vqwroeglrokmqvixiudb**
3. Navigate to: **Authentication** → **Email Templates**

### 2. Configure Confirm Signup Email

1. Click on the **"Confirm signup"** template
2. Replace the existing HTML with the content from `confirm-signup.html`
3. Click **Save**

### Email Template Features

✨ **Professional Design**
- Vox-Operis branding with logo
- Orange gradient header matching your brand colors
- Clean, modern layout
- Responsive design for all devices

🎨 **Visual Elements**
- Your logo: `https://ai-stream-solutions.s3.us-east-1.amazonaws.com/VO.png`
- Brand colors: Orange gradient (#f97316 to #ea580c)
- Clear call-to-action button
- Alternative text link for accessibility

📧 **Content Includes**
- Welcome message
- Confirmation button with `{{ .ConfirmationURL }}`
- Alternative text link
- What's next section with helpful steps
- Security notice (24-hour expiration)
- Professional footer

### Available Template Variables

Supabase provides these variables you can use in email templates:

- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

### Testing the Template

1. After saving the template in Supabase
2. Register a new test account in your app
3. Check the email inbox for the confirmation email
4. Verify the styling and logo display correctly

### Customization

You can customize:
- Colors in the gradient (currently orange theme)
- Logo size (currently `height: 60px`)
- Button text
- Content sections
- Footer information

### Other Email Templates

You may want to create similar professional templates for:
- **Magic Link** - Passwordless login emails
- **Change Email Address** - Email change confirmation
- **Reset Password** - Password reset emails

Copy the same design structure from `confirm-signup.html` and adjust the content as needed.

## Support

If you need help with email templates, refer to:
- [Supabase Email Templates Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
