# Environment Variables Setup

Copy these to your `.env.local` file and fill in the values.

## Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role Key (for admin operations)
# Get this from: Supabase Dashboard > Settings > API > service_role key
# ⚠️ NEVER expose this in the browser!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URL (used for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## OTP / SMS Configuration

```bash
# Mock OTP Mode (set to "true" for development)
# When true: All OTP codes are "123456" and no SMS is sent
# When false: Real SMS sent via Twilio
MOCK_OTP=true

# Twilio Configuration (only needed when MOCK_OTP=false)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

## How to Get These Values

### Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Settings** > **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Twilio (when ready for production SMS)
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your Account SID and Auth Token on the dashboard
3. Get a phone number from **Phone Numbers** > **Manage** > **Buy a Number**
4. Copy the values to your `.env.local`

## Development vs Production

### Development (recommended)
```bash
MOCK_OTP=true
# Twilio vars not needed
```

### Production
```bash
MOCK_OTP=false
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

## Running the Migration

After setting up your environment variables, run the database migration:

```bash
# Option 1: Using Supabase CLI (if installed)
supabase db push

# Option 2: Manual - copy contents of supabase/migrations/004_phone_otp.sql
# and run in Supabase Dashboard > SQL Editor
```

