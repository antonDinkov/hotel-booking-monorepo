# BookYourStay

## Live Access

### Web Application

https://bookyourstay.netlify.app

### Mobile Web Application

https://bookyourstaymobile.netlify.app

### Android APK

APK build in progress — link will be added shortly.

## Project Overview

BookYourStay is a production-style hotel booking platform built as a full-stack monorepo. The project includes a Next.js web application, a Next.js REST API backend, an Expo React Native mobile client, and a shared TypeScript package for cross-app contracts.

The platform supports client, partner, and admin roles. Clients can search hotels, reserve rooms, manage bookings, review stays, save favorites, and maintain profile data. Partners can manage hotels, rooms, images, bookings, reviews, calendars, analytics, and settings. Admin users can manage platform users, partners, hotels, bookings, reviews, payments, reports, analytics, and system status.

## Features

- Role-based authentication with Auth.js / NextAuth JWT sessions
- Separate client, partner, and admin web flows
- Mobile client authentication using backend-issued bearer JWTs
- Hotel discovery, search, details, availability, room selection, and booking holds
- Booking lifecycle support for pending payment, confirmed, completed, cancelled, and expired states
- Stripe Checkout integration with webhook handling and refund status updates
- Cash-on-arrival booking confirmation flow
- Client profile management with avatar upload/removal
- Cloudflare R2-compatible image storage for uploaded avatars and hotel images
- Partner hotel, room, image, booking, review, calendar, analytics, and settings tools
- Admin dashboards for operational data, users, partners, bookings, reviews, payments, reports, and system status
- Drizzle migrations, seed data, and large-volume seed script for scalability validation
- Shared TypeScript contracts through `@repo/types`

## Architecture

```text
Next.js Web App
  Server Components -> service layer -> Drizzle ORM -> Neon PostgreSQL
  Client Components -> REST API routes for user-triggered mutations

Expo Mobile App
  React Native screens -> REST API routes -> same service layer/database

Shared Package
  packages/types -> API, auth, hotel, room, booking, review, payment, and user contracts
```

The web app owns both the browser UI and the backend API. Server-side web pages call service functions directly instead of calling internal API routes. The mobile app communicates with the same backend through REST endpoints configured by `EXPO_PUBLIC_API_BASE_URL`.

## Monorepo Structure

```text
.
+-- apps
|   +-- web                  # Next.js 16 web app and API backend
|   |   +-- src/app          # App Router pages, layouts, route handlers, proxy
|   |   +-- src/server       # Server-only services and integrations
|   |   +-- src/db           # Drizzle schema, DB client, seed scripts
|   |   +-- drizzle          # Committed SQL migrations and snapshots
|   +-- mobile               # Expo React Native app for Android, iOS, and Web
|       +-- src/app          # Expo Router screens
|       +-- src/lib          # API/auth/session clients
|       +-- eas.json         # EAS build profiles
+-- packages
|   +-- types                # Shared TypeScript-only package
+-- docs                     # Deployment notes
+-- AGENTS.md                # AI agent architecture instructions
+-- package.json             # npm workspace scripts
```

## Tech Stack

- Monorepo: npm workspaces
- Web/backend: Next.js 16.2.3, React 19, TypeScript, Tailwind CSS
- Mobile: Expo SDK 55, React Native 0.83, Expo Router
- Database: Neon PostgreSQL, Drizzle ORM, Drizzle Kit migrations
- Authentication: Auth.js / NextAuth credentials and GitHub provider, JWT sessions
- Payments: Stripe Checkout and Stripe webhooks
- File storage: Cloudflare R2-compatible S3 API
- Testing: Jest and Testing Library in the web app
- Deployment: Netlify for web and Expo Web export, EAS profile for Android APK builds

## Authentication

The web application uses Auth.js / NextAuth with JWT session strategy. Credentials-based login validates hashed passwords with `bcryptjs` and enforces role-specific access for client, partner, and admin areas. The mobile app uses `/api/auth/mobile-login` to receive a bearer access token and sends it on API requests through the `Authorization` header.

Demo seed credentials:

```text
Client:  peter@abv.bg / 123456
Admin:   admin@abv.bg / 123456
Partner: maya.santoso@nusantarasummit.com / 123456
```

## Web Application

The Next.js app uses the App Router and separates server-rendered pages from client interaction components. Public, client, partner, and admin routes are grouped separately. Protected route checks are enforced with `src/proxy.ts` and server-side authorization helpers.

Web areas include:

- Public landing, login, register, about, privacy, terms, listings, listing details, date picking, reservation, and review pages
- Client dashboard, bookings, booking confirmation, profile, favorites, and personal reviews
- Partner dashboard, hotel/room management, bookings, reviews, calendar, analytics, and settings
- Admin dashboard, users, partners, hotels, bookings, reviews, payments, reports, analytics, system, and settings

## Mobile Application

The Expo app is organized with Expo Router and protected client routes. It supports login, registration, dashboard, hotel search from backend data, listing details, room availability, reservation hold creation, payment flow, booking management, review submission, and profile/avatar updates.

Some secondary MVP screens still use static helper data, including the standalone mobile listings and favorites screens. Core booking and account workflows use backend REST APIs.

## API & Backend

Backend route handlers live under `apps/web/src/app/api`. Routes are resource-oriented and delegate business logic to services under `apps/web/src/server/services`.

Implemented API areas include:

- `/api/auth/*`
- `/api/hotel-panel`
- `/api/search`
- `/api/hotels`
- `/api/rooms`
- `/api/bookings`
- `/api/reviews`
- `/api/favorites`
- `/api/users`
- `/api/partners`
- `/api/calendar`
- `/api/analytics`
- `/api/reports`
- `/api/stripe/*`

Responses use a consistent JSON shape:

```json
{ "data": {} }
```

```json
{ "error": { "message": "Human readable message", "code": "ERROR_CODE" } }
```

## Database

The database layer uses Neon PostgreSQL with Drizzle ORM. The schema includes users, profiles, roles, user roles, partners, hotels, favorite hotels, hotel images, room types, hotel payment methods, bookings, and reviews.

Drizzle migration files are committed in `apps/web/drizzle` from `0000` through `0016`. Seed scripts are available for demo data and load-oriented data:

```bash
npm run seed --workspace=web
npm run seed:large --workspace=web
```

The large seed script creates thousands of users and bookings plus more than 10,000 reviews for pagination and performance validation.

## Shared Packages

`packages/types` publishes `@repo/types`, a TypeScript-only package shared by web and mobile. It centralizes API response shapes, auth models, booking contracts, hotel/listing data, payment types, review types, room availability, and user/profile types.

## Deployment

The web application is deployed as a single Next.js project containing both the web UI and REST API backend. The mobile web application is exported as static Expo Web output and deployed separately.

The repository includes deployment guidance in `docs/deployment.md`. Environment variables are expected to be configured in the hosting dashboards. No root `netlify.toml` file is committed.

Expo/EAS is configured in `apps/mobile/eas.json`. The `preview` profile builds an internal Android APK and sets:

```env
EXPO_PUBLIC_API_BASE_URL=https://bookyourstay.netlify.app
```

## Environment Variables

Web app variables are documented in `apps/web/.env.example`:

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
BCRYPT_SALT_ROUNDS=
GITHUB_ID=
GITHUB_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
MOBILE_CORS_ORIGINS=
R2_ENDPOINT=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
NEXT_PUBLIC_R2_PUBLIC_URL=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
```

Mobile variables are documented in `apps/mobile/.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=
```

## Running Locally

Install dependencies from the repository root:

```bash
npm install
```

Run the web app:

```bash
npm run dev:web
```

Run the mobile app:

```bash
npm run dev:mobile
```

For local mobile-to-web API calls, configure:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Build Commands

```bash
npm run typecheck:web
npm run typecheck:mobile
npm run build:web
npm run build:mobile:web
npm run lint --workspace=web
npm run lint --workspace=mobile
npm run test --workspace=web
```

Database commands:

```bash
npm run db:generate --workspace=web
npm run db:migrate --workspace=web
```

Run migrations only after reviewing generated SQL and verifying migration history.

## Production Notes

- Web and mobile TypeScript checks pass locally.
- Expo Web export succeeds and writes static output to `apps/mobile/dist-web`.
- Web production build requires complete production environment variables and may execute server-side database reads during prerendering.
- Web lint currently needs cleanup for React 19 hook lint rules before being used as a blocking CI gate.
- Existing Jest coverage is broad, but several suites need updates after recent API and pagination changes.

## Challenges & Solutions

- Shared backend for two clients: the service layer keeps business logic reusable while exposing REST routes for mobile.
- Role separation: route groups, proxy checks, server authorization helpers, and role-specific dashboards keep client, partner, and admin flows separated.
- Booking consistency: pending holds, expiration handling, room capacity checks, and payment status transitions are handled in the service layer.
- Cross-platform mobile auth: the mobile client uses backend-issued bearer tokens and avoids a separate mobile backend.
- File storage: uploads use the S3-compatible Cloudflare R2 API while read URLs are normalized through a shared image URL helper.

## Future Improvements

- Add the completed Android APK release link.
- Replace remaining static mobile helper screens with backend-backed favorites/listing data.
- Add GitHub Actions for lint, typecheck, test, and build validation.
- Add end-to-end tests for search, booking, payment, and role-based routing.
- Add automated database and object storage backups.
