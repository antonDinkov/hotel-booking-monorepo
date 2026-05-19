# Deployment Preparation

This monorepo contains:

- `apps/web`: Next.js 16.2.3 web app and REST API backend
- `apps/mobile`: Expo app for Android, iOS, and Web
- `packages/types`: shared TypeScript-only API/domain contracts

No deployment should import mobile code into the web app or web server code into the mobile app.

## Local Development

Install dependencies from the repository root:

```bash
npm install
```

Run the web app locally:

```bash
npm run dev:web
```

The default Next.js dev URL is `http://localhost:3000`.

Run the mobile app locally:

```bash
npm run dev:mobile
```

Useful mobile alternatives:

```bash
npm run start --workspace=mobile
npm run start:lan --workspace=mobile
npm run web --workspace=mobile
```

For default local development, set the mobile API URL to the local web app:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

The mobile app still supports older local aliases:

```env
EXPO_PUBLIC_API_URL=http://your-lan-ip:3000
EXPO_PUBLIC_WEB_API_URL=http://localhost:3000
```

## Web Deployment

Deploy `apps/web` as the Next.js app. The app contains both the frontend and REST API routes under `src/app/api`.

Recommended pre-deployment commands:

```bash
npm run typecheck:web
npm run build:web
```

Required production environment variables:

```env
DATABASE_URL=
NEXTAUTH_URL=https://your-web-domain.com
NEXTAUTH_SECRET=
BCRYPT_SALT_ROUNDS=12
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=https://your-web-domain.com
MOBILE_CORS_ORIGINS=https://your-mobile-web-domain.com
R2_ENDPOINT=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
NEXT_PUBLIC_R2_PUBLIC_URL=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

Optional variables:

```env
GITHUB_ID=
GITHUB_SECRET=
MOBILE_APP_SCHEME=mobile
AUTH_DEBUG_SESSION=false
REVIEWS_DEBUG_BADGE=false
```

Do not run Drizzle migrations during deployment preparation unless explicitly approved. Schema changes must go through the migration workflow described in `AGENTS.md`.

## Mobile Web Deployment

The Expo app consumes the Next.js backend only through REST API endpoints. For production builds, configure:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-web-domain.com
```

Build/export Expo Web from `apps/mobile`:

```bash
npm run build:mobile:web
```

The exported static web output is written to `apps/mobile/dist-web`.

## Boundaries

Do not:

- Import from `apps/web` inside `apps/mobile`
- Import Next.js server files, API route handlers, Drizzle schema, or service code into mobile
- Hardcode production API URLs in mobile source code
- Create a second backend for mobile
- Move business logic into `packages/types`
- Put Next.js, Drizzle, React components, or runtime logic in `packages/types`

## Pre-Deployment Checklist

- `npm install` has been run from the repo root
- `apps/web/.env.example` and `apps/mobile/.env.example` match hosting env configuration
- `npm run typecheck:web` passes
- `npm run typecheck:mobile` passes
- `npm run build:web` passes
- `npm run build:mobile:web` passes
- Production `EXPO_PUBLIC_API_BASE_URL` points to the deployed web/API domain
- `MOBILE_CORS_ORIGINS` includes the deployed Expo Web origin
- No production database migrations are run without explicit approval
