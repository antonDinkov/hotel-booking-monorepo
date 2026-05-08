# AGENTS.md – Booking Platform MVP

## ⚠️ IMPORTANT: Next.js Version Compatibility

This project uses a **new / recent version of Next.js**.  
Before making any changes, you MUST first read and follow the official documentation for the exact installed version from:

- `node_modules/next/`
- `package.json`
- lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`)

Do NOT assume compatibility with older Next.js patterns or APIs.

Mandatory before starting:
1. Detect the exact installed Next.js version.
2. Read the relevant docs/changelog/migration notes for that version.
3. Verify App Router, Server Actions, caching, routing, middleware, and config behavior against the installed version.
4. Avoid deprecated patterns unless already intentionally used in the codebase.
5. Follow the existing project architecture and conventions.

If uncertain about framework behavior, inspect the installed package source/types in `node_modules` first instead of guessing.

---

## 🧠 Project Overview
This is a full-stack **Hotel Booking Platform MVP** consisting of:

* Web application (Next.js)
* Mobile application (Expo / React Native)
* Shared backend (Next.js API routes - serverless)

The project follows a **monorepo architecture**.

---

## 📦 Project Structure
/apps
  /web        → Next.js (frontend + backend API)
  /mobile     → Expo React Native app

/packages     → shared logic (db, utils, ui)

/docs         → documentation (README, schema diagrams)

/AGENTS.md    → global AI instructions

---

## Component File Naming Convention**

All React/Next.js component files must use **PascalCase** and match the name of the default exported component. For example, a component exported as `UserProfile` must be defined in a file named `UserProfile.tsx`. This improves readability, consistency, and developer experience across the codebase. While Next.js does not strictly enforce file naming, React requires component names to be capitalized, and aligning file names with component names is considered best practice. Exceptions apply only to framework-reserved files such as `page.tsx`, `layout.tsx`, and `loading.tsx`, which must follow Next.js conventions.

---

## 🧪 Testing Rules (Jest) – MANDATORY

### 📌 General Principle
The agent MUST use **Jest** for all unit tests.

- Unit tests are required **whenever there is an objective need to verify business logic**
- The agent MUST NOT assume tests are optional for critical logic (e.g. booking, availability, pricing, authentication, validation)

---

### ⚙️ Test Confirmation Workflow (STRICT)

Before writing any unit test, the agent MUST:

1. Identify the need for a test (e.g. business logic, utility function, service layer)
2. Propose:
   - what will be tested
   - why it is needed
   - what cases will be covered
3. WAIT for explicit user confirmation before writing the test

❌ The agent MUST NOT write unit tests without confirmation.

---

### 🧪 Unit Test Rules (Jest)

- Use **Jest**
- Tests MUST be:
  - simple
  - readable
  - minimal
  - focused on one behavior per test

- Prefer:
  - `describe` blocks per feature/function
  - clear `it()` statements in plain English

### Testing file organization rule:

- Use EXACTLY ONE test file per component/module.
- NEVER create additional files like:
  - additions.test.tsx
  - extra.test.tsx
  - coverage.test.tsx
  - new.test.tsx
duplicate test suites for the same component.

### Required structure:

- All tests for a component must live in a single file:
  Component.tsx
  Component.test.tsx

- When adding new tests:
  extend the existing test file
  refactor/merge setup if needed
  reuse existing mocks and helpers
  organize tests with nested describe() blocks instead of creating new files

### Example style:
- “should return available rooms for given date range”
- “should reject booking when no availability”

---

### 🧠 What MUST be unit tested

The agent SHOULD suggest unit tests for:

- booking logic (availability, date overlap)
- pricing calculations
- authentication utilities
- validation logic (Zod schemas, helpers)
- service layer functions (`/server/services/*`)
- payment status handling logic

---

### 🔗 Integration Test Suggestions (IMPORTANT)

The agent MUST also suggest **integration test scenarios** when:

- multiple services interact (e.g. booking + payment + availability)
- API routes depend on service + DB
- authentication flows are involved
- critical user flows exist (search → booking → payment)

⚠️ The agent MUST ONLY suggest integration tests unless explicitly asked to implement them.

---

### 🚫 Forbidden

- ❌ No automatic test creation without confirmation
- ❌ No complex testing frameworks beyond Jest unless requested
- ❌ No over-engineered test setups
- ❌ No testing UI unless explicitly required (focus backend logic first)

---

### 🧠 Agent Behavior Rule (Testing)

When generating or modifying code:

- The agent MUST actively check if the logic introduced requires a test
- If yes → propose unit test + wait for approval
- If system-level → suggest integration test scenarios
- The agent MUST treat testing as part of the development workflow, not optional

---

## ⚙️ Tech Stack
### Web & Backend
* Next.js (App Router)
* TypeScript
* Tailwind CSS
* Serverless API routes

### Database
* PostgreSQL (Neon)
* Drizzle ORM

### Mobile
* Expo (React Native)

### Payments
* Stripe

---

## 🔐 Authentication (MANDATORY)

- Use Auth.js for authentication
- Use JWT session strategy (stateless)

- Do NOT implement custom authentication logic unless explicitly requested

- Requirements:
  - secure login/register
  - session handling via JWT
  - protected API routes

---

## 🧱 Architecture Rules
* ❗ Do NOT create a separate backend server (no Express, no NestJS)
* All backend logic must live inside:
  /apps/web/src/app/api
* Use REST API (no GraphQL)
* Mobile app MUST consume the same API

---

## 🧭 Routing & Route Groups (STRICT)

- Route groups `(…)` are for organization ONLY and DO NOT affect URLs.

### Public Routes
- Location: /app/(client)/*
- Accessible without authentication
- Includes:
  - landing page (/)
  - hotels listing (/hotels)
  - hotel details (/hotels/:id)
  - login/register (/login, /register)

### Client Routes
- Location: /app/(client)/*
- URLs:
  - /dashboard
  - /bookings
- MUST be accessible ONLY to users with role = "client"

### Partner Routes
- Location: /app/(partner)/partner/*
- URLs MUST be prefixed with /partner/*
  - /partner/dashboard
  - /partner/hotels
- MUST be accessible ONLY to users with role = "partner"

### Admin Routes
- Location: /app/admin/*
- URLs:
  - /admin
  - /admin/dashboard
- MUST be accessible ONLY to users with role = "admin"

---

### 🚫 Forbidden
- ❌ Do NOT create duplicate routes (e.g. two /dashboard routes)
- ❌ Do NOT rely on route groups for URL separation
- ❌ Do NOT mix multiple roles in a single route

---

## 🔌 API Architecture (STRICT)

### Design Principle
- API MUST be resource-based, NOT role-based

### Correct Structure
- /api/auth/*
- /api/hotels
- /api/hotels/:id
- /api/rooms
- /api/bookings
- /api/reviews
- /api/users

### Optional (admin-only)
- /api/admin/*

---

### 🚫 Forbidden
- ❌ Do NOT create role-based APIs:
  - /api/client/*
  - /api/partner/*
- ❌ Do NOT duplicate endpoints per role

---

### Authorization
- Access control MUST be handled inside the API using user roles

Example:
- POST /api/hotels
  - client → 403
  - partner → allowed
  - admin → allowed

---

### Architecture Rule
- API routes MUST be thin
- They MUST call service layer functions
- They MUST NOT contain business logic

---

## 🔐 Authentication & Routing

- Login and register pages MUST be in /app/(public)
- Use a single auth system for all roles

After login, users MUST be redirected based on role:

- client → /dashboard
- partner → /partner/dashboard
- admin → /admin/dashboard

---

### 🚫 Forbidden
- ❌ Do NOT create separate auth flows per role
- ❌ Do NOT duplicate login/register pages unnecessarily

---

## 🚦 Access Control (MANDATORY)

- All protected routes MUST verify user role before rendering

Rules:
- (client) routes → role = "client"
- (partner) routes → role = "partner"
- admin routes → role = "admin"

If unauthorized:
- redirect to "/login" OR "/"

---

## 🔌 API Guidelines (STRICT)

### Response Format
All API routes MUST return JSON in a consistent structure:

✅ Success:
{
  "data": ...
}

❌ Error:
{
  "error": {
    "message": "Human readable message",
    "code": "ERROR_CODE"
  }
}

---

### HTTP Status Codes
- 200 → success
- 201 → created
- 400 → validation error
- 401 → unauthorized
- 403 → forbidden
- 404 → not found
- 500 → server error

---

### Validation
- All inputs MUST be validated
- Use a validation library (e.g. Zod)
- NEVER trust client input

---

### Error Handling
- Do NOT throw raw errors to the client
- Always return structured error responses
- Log internal errors on the server

---

### Route Structure
Use RESTful naming:

GET    /api/hotels
GET    /api/hotels/:id
POST   /api/bookings
PATCH  /api/bookings/:id
DELETE /api/bookings/:id

---

### Architecture Rule
- API routes MUST be thin
- They MUST call service layer functions
- They MUST NOT contain business logic

---

### 🚫 Forbidden
- ❌ No internal fetch("/api/...") calls
- ❌ No business logic inside route.ts
- ❌ No inconsistent response shapes

---

## 🔐 Authentication & Roles
* Use secure password hashing (bcrypt)
* Use JWT for authentication
* Protect private endpoints
* Roles:
  - **Client** – browse hotels, book rooms, leave reviews
  - **Partner** – add/manage hotels and rooms, view bookings
  - **Admin** – manage users, hotels, rooms, bookings, reviews
* Separate panels for each role:
  - Web: Client, Partner, Admin
  - Mobile: Client, Partner

---

## 💳 Payments
* Use Stripe Checkout
* Handle webhook events:
  * checkout.session.completed
* Update booking status after payment

---

## 🧩 Database Rules
* Use Drizzle ORM (no raw SQL unless necessary)
* Define schema clearly
* Example tables and relations:
  - Users (role: client, partner, admin)
  - Hotels (owned by partners)
  - Rooms (linked to hotels)
  - Bookings (linked to users and rooms)
  - Reviews (linked to users and hotels)
* Use migrations for schema changes
* Commit migration scripts to GitHub

---

## 🧱 Database Migration Rules (CRITICAL)

- ALL database schema changes MUST go through Drizzle migrations.

### ✅ Allowed
- npx drizzle-kit generate
- npx drizzle-kit migrate

### ❌ Forbidden
- ❌ Direct SQL execution for schema changes
- ❌ Automatic schema sync (db push)
- ❌ Creating tables via runtime code
- ❌ Modifying database schema outside migrations

---

### Migration Workflow (MANDATORY)

1. Modify schema files (Drizzle schema)
2. Generate migration:
   npx drizzle-kit generate
3. Review generated SQL (REQUIRED)
4. Apply migration:
   npx drizzle-kit migrate
5. Verify:
   - migration exists in drizzle.__drizzle_migrations
   - schema matches expected state

---

### 🚫 Critical Rule

The agent MUST NEVER:

- execute schema-changing code directly against the database
- create tables outside migration flow

---

### 🔍 Drift Prevention

Before applying a new migration, ALWAYS:

- check drizzle.__drizzle_migrations table
- ensure migration history is in sync

If drift is detected:
- STOP
- notify the user
- DO NOT proceed automatically

---

### 🧪 Verification Step (MANDATORY)

After every migration:

Run:
SELECT * FROM drizzle.__drizzle_migrations;

Ensure:
- number of records matches number of migration files

---

### 🔐 Environment Safety

- Database credentials MUST NOT be used automatically by the agent
- Any command that connects to the database MUST require explicit user approval

---

### 🛑 Failure Handling

If migration fails:
- DO NOT retry blindly
- DO NOT modify DB manually
- report error and wait for user decision

---

## 🖥️ Web App Rules
* Use App Router (NOT pages router)
* Keep components modular
* Use server components where possible
* Use Tailwind for styling
* Panels:
  - Client: register, login, hotel list, booking, reviews
  - Partner: add/edit hotels & rooms, view bookings
  - Admin: manage users, hotels, rooms, bookings, reviews

---

## 📱 Mobile App Rules
* Use Expo
* Do NOT duplicate backend logic
* Only call API endpoints
* Store JWT securely
* Panels:
  - Client: login, hotel list, booking
  - Partner: add/edit hotels & rooms, view bookings

---

## 🚫 What NOT to do
* ❌ Do not create separate backend project
* ❌ Do not mix business logic inside UI components
* ❌ Do not use local-only state instead of API
* ❌ Do not duplicate logic between web and mobile

---

## ✅ Best Practices
* Keep code clean and modular
* Use TypeScript everywhere
* Use environment variables properly
* Test API endpoints before using in UI
* Follow AI dev loop: prompt → implement → test → refine → commit
* Maintain at least 15 commits across 3 different days

---

## 🧠 AI Agent Instructions
When generating code:
* Follow project structure strictly
* Reuse existing logic where possible
* Prefer simplicity over complexity
* Always consider both web and mobile usage
* Generate production-ready code

---

## 🎨 Styling Rules per Panel

* Client Panel:
  - All client-facing pages MUST share one unified style.
  - Friendly, welcoming design with bright colors and inviting imagery.
  - Focus on search and booking flow.

* Partner Panel:
  - All partner-facing pages MUST share one unified style.
  - Professional, business-oriented design with neutral colors.
  - Dashboard-like layout focused on property management.

* Admin Panel:
  - All admin-facing pages MUST share one unified style.
  - Functional, utilitarian design with minimalistic components.
  - Clear typography, focus on data tables and controls.

---

## 🧠 Backend Architecture (MANDATORY)

The backend MUST follow a 3-layer architecture:

1. API Layer (HTTP)
   - Location: /apps/web/src/app/api/*
   - Responsibility: request/response handling ONLY
   - MUST NOT contain business logic

2. Service Layer (Business Logic)
   - Location: /apps/web/src/server/services/*
   - Responsibility:
     - database access (Drizzle)
     - business rules
     - data transformations

3. UI / Server Components
   - MUST call service functions directly
   - MUST NOT call internal API routes via fetch

❗ STRICT RULE:
- NEVER call fetch("/api/...") from server-side code

---

## 🔐 Server vs Client Rules (STRICT)

- Files under /server/* are SERVER-ONLY
- They MUST NOT be imported into client components

- Client components ("use client"):
  - MUST NOT import:
    - database code
    - service layer
    - server utilities

- Shared safe code:
  - /lib/* can be used both client and server

  ---

  ## 🧹 Code Quality Rules (STRICT)

- Functions MUST be small (max ~30 lines)
- Avoid nested logic deeper than 2 levels
- Use clear naming:
  - ✅ getHotelPanelData
  - ❌ getData, handleStuff

- Each file MUST have a single responsibility
- API routes MUST be thin (max ~20-30 lines)

- Avoid:
  - unnecessary abstractions
  - over-engineering

  ---

  ## 🚫 Internal API Calls (CRITICAL)

- Server-side code MUST NOT call internal API routes using fetch()

❌ BAD:
fetch("/api/hotels")

✅ GOOD:
import { getHotels } from "@/server/services/hotels"

---

## 🧠 Agent Workflow (MANDATORY)

Before writing code, the agent MUST:

1. Explain the plan
2. List files to modify
3. Explain architectural decisions

After implementation:
4. Review code against AGENTS.md
5. List violations (if any)
6. Fix them

---

## 🧩 Architectural Principles

* Separation of Concerns (SoC):
  - Each module, feature, and panel MUST have a clear responsibility.
  - Client, Partner, and Admin panels MUST be separated in structure, styling, and logic.
  - Shared components (buttons, inputs, modals) MUST be placed in /components and reused.

* Do Not Repeat Yourself (DRY):
  - Common logic MUST be abstracted into utilities (/lib) or shared hooks.
  - Shared UI MUST be centralized in /components.
  - No duplication of API calls, validation, or business logic across panels.

---

## 📝 Type System Rules

* All TypeScript types and interfaces MUST be defined in dedicated files under `/types`.
* Types MUST be grouped logically (e.g., `User`, `Booking`, `Hotel`, `Room`, `Payment`).
* File naming convention: lowercase with hyphens (e.g., `user.ts`, `booking.ts`).
* Type names MUST use PascalCase (e.g., `UserProfile`, `BookingRequest`).
* Shared types MUST be centralized in `/types` and imported where needed — no duplication.
* Each type file MUST export its definitions explicitly for easy discovery.
* Complex types MUST be documented with comments explaining their purpose and usage.

---

## 🚦 Execution Discipline
* The AI agent MUST only implement what is explicitly requested by the user.
* The agent MUST NOT add extra features, screens, or logic unless the user confirms.
* If the agent detects a conflict between user prompt and AGENTS.md, it MUST notify the user and wait for confirmation before proceeding.
* The agent MUST build step by step, following user instructions strictly.

---

## ⚠️ Conflict Resolution Rules

* If a user prompt conflicts with the instructions in AGENTS.md:
  - The AI agent MUST notify the user about the conflict.
  - The agent MUST pause and wait for explicit user confirmation before proceeding.
  - No code or implementation should be generated until the user confirms how to resolve the conflict.

---

## 🏁 Goal
Build a scalable, clean, and production-ready hotel booking platform with shared backend and two clients (web + mobile), supporting Client, Partner, and Admin roles.
