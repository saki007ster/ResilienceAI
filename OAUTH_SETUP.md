# Google OAuth Setup Guide for ResilienceAI

## Quick Setup Instructions

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" or select existing project
3. Name it "ResilienceAI" (or your preferred name)

### 2. Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable:
   - **Google Calendar API**
   - **Google+ API** (for user profile info)

### 3. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Configure:
   - **Application type**: Web application
   - **Name**: ResilienceAI
   - **Authorized JavaScript origins**: `http://localhost:4200`
   - **Authorized redirect URIs**: `http://localhost:4200/auth/callback`

### 4. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (for testing)
3. Fill required fields:
   - **App name**: ResilienceAI
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Add scopes:
   - `../auth/calendar`
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (your email address)

### 5. Update Application

1. Copy your **Client ID** from the credentials page
2. Go to the Schedule tab in ResilienceAI
3. Paste the Client ID in the setup form
4. Click "Save & Continue"

## Example Client ID Format
```
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## Troubleshooting

- **Error 401: invalid_client** → Check Client ID is correct
- **Error 400: redirect_uri_mismatch** → Verify redirect URI matches exactly
- **Access blocked** → Add your email to test users in OAuth consent screen

## Production Setup

For production deployment:
1. Update redirect URIs with your production domain
2. Complete OAuth consent screen verification process
3. Set environment variables instead of localStorage 