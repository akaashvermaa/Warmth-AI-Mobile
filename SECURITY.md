# Security & Environment Variables

## 🔐 Sensitive Data Protection

This project uses environment variables to protect sensitive information like API keys, database credentials, and secret keys.

### ⚠️ NEVER commit these files:
- `.env`
- `.env.local`
- `.env.production`
- Any file containing actual API keys or secrets

These are already protected by `.gitignore`.

---

## Backend Setup

### 1. Create `.env` file in `/backend`

```bash
cd backend
cp .env.example .env
```

### 2. Fill in your actual values:

```env
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# OpenAI
OPENAI_API_KEY=sk-your_openai_key_here

# Security
FLASK_SECRET_KEY=your_random_secret_key_here
```

**Generate a secure Flask secret key:**
```bash
python -c "import os; print(os.urandom(32).hex())"
```

---

## Frontend Setup

### 1. Create `.env.local` file in `/warmth-app`

```bash
cd warmth-app
cp .env.example .env.local
```

### 2. Configure API URL:

**For local development:**
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:5001
```

**For production:**
```env
EXPO_PUBLIC_API_URL=https://your-production-api.com
```

---

## How It Works

### Backend
- All sensitive config is in `backend/app/config.py`
- Uses `os.getenv()` to read from environment variables
- Falls back to safe defaults for non-sensitive values

### Frontend
- Configuration managed in `src/config/env.js`
- Reads from `EXPO_PUBLIC_API_URL` or `REACT_APP_API_URL`
- Falls back to `http://127.0.0.1:5001` for development

---

## Security Checklist

- [ ] Created `.env` files from `.env.example` templates
- [ ] Filled in actual API keys and secrets
- [ ] Verified `.env` files are in `.gitignore`
- [ ] Never shared `.env` files or committed them to git
- [ ] Used strong, random values for `FLASK_SECRET_KEY`
- [ ] Rotated API keys if accidentally exposed

---

## Getting API Keys

### Supabase
1. Go to https://supabase.com
2. Create a project
3. Go to Settings → API
4. Copy `URL`, `anon/public key`, and `service_role key`

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy and save it (you won't see it again!)

---

## Production Deployment

For production, set environment variables through your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Heroku**: `heroku config:set VARIABLE_NAME=value`
- **Railway**: Variables tab in project settings
- **AWS/GCP**: Use Secrets Manager or similar service

**Never** hardcode production keys in your code!
