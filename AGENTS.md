# AGENTS.md – Booking Platform MVP

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

### Auth
* JWT-based authentication (or NextAuth if used later)

---

## 🧱 Architecture Rules
* ❗ Do NOT create a separate backend server (no Express, no NestJS)
* All backend logic must live inside:
  /apps/web/src/app/api
* Use REST API (no GraphQL)
* Mobile app MUST consume the same API

---

## 🔌 API Guidelines
* Always return JSON
* Use clear route structure:
/api/auth/login
/api/auth/register
/api/hotels
/api/rooms
/api/bookings
/api/payments
* Validate all inputs
* Handle errors properly

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

## 🏁 Goal
Build a scalable