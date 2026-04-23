# Security Configuration

## 1. Row Level Security (Neon PostgreSQL)

RLS is configured via `prisma/rls.sql`. Run it **once** in the Neon SQL Editor:

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project → **SQL Editor**
3. Paste the contents of `prisma/rls.sql` and click **Run**

This enables RLS on all tables and grants full access to `neondb_owner` (the app's DB role).
Any direct DB connection that isn't authenticated as `neondb_owner` will be blocked at the
database level, independent of application logic.

## 2. CORS

Public API routes (`/api/verificar/*`, `/api/encuestas/*/publica`, `/api/encuestas/*/validar-rut`,
`/api/encuestas/*/responder`) respond with `Access-Control-Allow-Origin` only for origins listed
in `lib/cors.ts`:

- `NEXT_PUBLIC_BASE_URL` (from env)
- `https://certicap.vercel.app`
- `http://localhost:3000`

All authenticated routes are unaffected — they rely on NextAuth session cookies.

## 3. Security Headers

Applied to all routes via `next.config.js`:

| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | See `next.config.js` |
| `Permissions-Policy` | Blocks camera, mic, geolocation |

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Random secret ≥ 32 chars for JWT signing |
| `NEXTAUTH_URL` | Full app URL (e.g. `https://certicap.vercel.app`) |
| `NEXT_PUBLIC_BASE_URL` | Same as above (public) |
| `DATABASE_URL` | Neon connection string |
