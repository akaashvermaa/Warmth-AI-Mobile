# Render Environment Variables - CRITICAL SETUP

## Required Environment Variables

### Z.ai Configuration

```
ZAI_API_KEY=<your-z.ai-api-key>
```

### Supabase Configuration

**CRITICAL:** The variable name MUST match exactly what the backend expects.

```
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>
```

> [!IMPORTANT] > **Variable Name:** The backend expects `SUPABASE_SERVICE_KEY` (NOT `SUPABASE_SERVICE_ROLE_KEY`)
>
> **Value:** Must be the **service role key**, NOT the anon key
>
> **Where to find it:** Supabase Dashboard → Settings → API → service_role key (secret)

### Other Configuration

```
FLASK_SECRET_KEY=<random-secret-key>
ENABLE_AUTH=true
ALLOWED_ORIGINS=*
```

## How to Verify

After deployment, check Render logs for:

```
SUPABASE_SERVICE_KEY loaded: eyJhbGciOiJIUzI1NiIs...
```

If you see "SUPABASE_SERVICE_KEY is NOT set!" then:

1. Check the variable name is exactly `SUPABASE_SERVICE_KEY`
2. Check the value is the service role key (starts with `eyJ...`)
3. Redeploy after fixing

## RPC Authentication

The Supabase Python client automatically adds the correct headers when initialized with the service role key:

- `Authorization: Bearer <service-role-key>`
- `apikey: <service-role-key>`

No manual header configuration needed in the code.
