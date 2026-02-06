# Supabase Email Templates

Custom email templates for AIStyleGuide authentication flows.

## Templates Created

- **confirmation.html** - Email confirmation after signup
- **invite.html** - User invitation emails
- **recovery.html** - Password reset emails
- **magic_link.html** - Passwordless sign-in links
- **email_change.html** - Email address change confirmation
- **reauthentication.html** - Reauthentication OTP codes

## How to Apply Templates

### For Hosted Supabase Projects (Production)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. For each template type:
   - Click on the template (e.g., "Confirm signup")
   - Copy the HTML content from the corresponding file in `supabase/templates/`
   - Paste it into the template editor
   - Update the subject line if needed
   - Click **Save**

### For Local Development

If you're running Supabase locally with `supabase start`:

1. The `config.toml` file is already configured
2. Restart Supabase: `supabase stop && supabase start`
3. Templates will be automatically loaded

## Template Variables

All templates support these variables:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- `{{ .Token }}` - 6-digit OTP code (for reauthentication)
- `{{ .Email }}` - User's email address
- `{{ .NewEmail }}` - New email address (email_change only)
- `{{ .SiteURL }}` - Your app's site URL

## Customization

Edit the HTML files to match your brand:
- Colors: Update `#2563eb` (blue) to your brand color
- Logo: Add your logo image URL
- Styling: Modify fonts, spacing, and layout as needed
