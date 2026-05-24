# BookYourStay

Production-style multi-platform hotel booking platform built as a Full Stack Apps with AI capstone project.

The project implements:

* Next.js full-stack Web platform
* Expo React Native mobile application
* PostgreSQL database with Drizzle ORM
* Stripe payment integration
* Role-based dashboards
* Cloudflare R2 object storage
* GitHub Actions CI and automated backups

---

# Live Projects

## Web Application

[WEB_PROJECT_URL]

## Expo Web Build

[EXPO_WEB_URL]

## Android APK

The Android APK build is available in the repository Releases section.

GitHub → Releases

---

# Demo Credentials

## Client Account

Email: [peter@abv.bg](mailto:peter@abv.bg)
Password: 123456

## Partner Account

Email: [maya.santoso@nusantarasummit.com](mailto:maya.santoso@nusantarasummit.com)
Password: 123456

## Admin Account

Email: [admin@abv.bg](mailto:admin@abv.bg)
Password: 123456

All login forms also include quick demo account buttons for easier testing.

---

# Stripe Test Card

Stripe test payments can be completed with:

Card number:

4242 4242 4242 4242

Additional fields:

* Any future expiration date
* Any CVC
* Any ZIP/postal code

---

# Project Overview

BookYourStay is a production-oriented hotel booking platform that supports:

* hotel discovery
* advanced search
* booking management
* online payments
* role-based dashboards
* analytics
* reviews
* image uploads
* mobile booking flows

The platform is implemented as a Node.js monorepo with:

* Next.js backend + Web client
* Expo React Native mobile client

The Web and Mobile clients share the same backend services and database.

---

# Architecture

## Monorepo Structure

```text
apps/
  web/      -> Next.js backend + Web platform
  mobile/   -> Expo React Native mobile app
```

## Backend Stack

* Next.js
* TypeScript
* Drizzle ORM
* Neon PostgreSQL
* Auth.js JWT authentication
* RESTful API endpoints
* Cloudflare R2 object storage

## Frontend Stack

### Web

* Next.js
* React
* Tailwind CSS

### Mobile

* React Native
* Expo
* Expo Router

---

# Client Panel

The client panel implements a complete end-to-end hotel booking workflow.

Clients can:

* register and authenticate
* search hotels
* filter by destination, dates, guests, and price
* view hotel details
* browse room types and amenities
* create bookings
* complete Stripe payments
* manage favorites
* manage profile information and avatars
* cancel bookings
* submit hotel reviews
* track active and completed reservations

The booking flow performs real availability checks based on:

* room inventory
* room capacity
* overlapping confirmed bookings
* temporary booking holds

Supported payment methods:

* Stripe Checkout
* Cash on Arrival

---

# Partner Panel

The partner panel provides hotel-management functionality for property owners and operators.

Partners can:

* create and manage hotels
* upload hotel and room images
* manage room types
* configure pricing and room capacity
* monitor reservations
* manage booking statuses
* review analytics
* monitor occupancy statistics
* respond to guest reviews
* manage company/account information

The partner dashboard includes:

* revenue analytics
* booking summaries
* review summaries
* booking calendar visibility
* operational metrics

---

# Admin Panel

The admin panel acts as a platform operations dashboard.

Admin users can:

* manage users
* manage partners
* manage bookings
* moderate reviews
* review payment-related booking states
* access operational reports
* monitor system analytics
* review platform metrics

The admin dashboard aggregates platform-wide operational information across the entire system.

---

# Booking, Payment, and Review Lifecycle

The platform implements a complete booking lifecycle shared between the Web and Mobile applications.

Flow overview:

1. Client searches hotel availability
2. Availability checks validate:

   * room inventory
   * room capacity
   * overlapping reservations
   * pending booking holds
3. Temporary booking hold is created
4. Client selects payment method
5. Stripe or cash booking flow completes
6. Booking status updates automatically
7. Completed stays become review-eligible
8. Reviews become visible on hotel pages

Supported booking states:

* pending
* confirmed
* completed
* cancelled
* expired
* refunded
* refund-pending
* refund-denied

---

# Mobile Application

The project includes a dedicated Expo React Native mobile application connected to the same backend API used by the Web platform.

The mobile application supports:

* authentication
* hotel search
* hotel details
* availability checks
* booking creation
* Stripe checkout flow
* booking history
* booking cancellation
* reviews
* profile management

The mobile application focuses on the primary end-user booking workflow and intentionally omits some secondary administrative functionality available in the Web platform.

---

# Database

The project uses:

* Neon PostgreSQL
* Drizzle ORM
* Drizzle migrations

The database schema includes relational entities such as:

* users
* hotels
* rooms
* bookings
* reviews
* payments
* favorites
* images

Database migrations are fully committed in the repository.

---

# Scalability and Large Seed Data

The project includes a dedicated large-scale seed system designed to validate scalability and operational workloads.

The large seed dataset generates:

* 4,500 users
* 15,000 bookings
* 10,050 reviews
* active bookings
* cancelled bookings
* pending booking holds
* future reservations
* fully booked hotel scenarios

The platform implements:

* server-side pagination
* optimized database queries
* indexed relational queries
* scalable booking retrieval
* analytics aggregation

The dataset is designed to simulate realistic production-style operational load.

---

# Authentication and Authorization

Authentication is implemented with:

* Auth.js
* JWT-based sessions
* secure password hashing

Authorization is enforced through:

* middleware
* API access checks
* role-based route protection
* protected server-side components

Supported roles:

* Client
* Partner
* Admin

---

# File Storage

The platform uses Cloudflare R2 object storage for:

* hotel images
* room images
* profile avatars
* uploaded media assets

---

# Automated Testing

The project includes automated testing for critical functionality.

Implemented test categories:

* unit tests
* integration-oriented service tests

The automated test suite runs through GitHub Actions CI.

---

# GitHub Actions CI

The repository includes automated GitHub Actions workflows.

CI workflow features:

* dependency installation
* automated test execution
* workflow validation on push and pull request

Main CI command:

```bash
npm run test --workspace=web
```

Workflow location:

```text
.github/workflows/node.js.yml
```

The workflow history can be inspected from the repository Actions tab.

---

# Automated PostgreSQL Backups

Automated PostgreSQL backups are implemented through GitHub Actions and Cloudflare R2 object storage.

The backup workflow:

* runs daily
* supports manual execution
* creates compressed PostgreSQL dumps
* uploads timestamped backups to Cloudflare R2

Workflow location:

```text
.github/workflows/backup.yml
```

---

# Deployment

## Web Platform

Deployed as a Next.js production application.

## Database

Hosted on Neon PostgreSQL.

## Object Storage

Hosted on Cloudflare R2.

## Mobile Application

Built with Expo and connected to the deployed backend APIs.

## APK Distribution

Android APK builds are distributed through GitHub Releases.

---

# Repository Structure

```text
apps/
  web/
    src/
    public/
    drizzle/
    tests/

  mobile/
    src/
    assets/

docs/
```

---

# Local Development Setup

## Clone the repository

```bash
git clone [REPO_URL]
```

## Install dependencies

```bash
npm install
```

## Run the Web application

```bash
npm run dev:web
```

## Run the Mobile application

```bash
npm run dev:mobile
```

---

# AI-Assisted Development

The project was developed using modern AI-assisted workflows with:

* GitHub Copilot
* AI agent workflows
* structured iterative development
* AGENTS.md project instructions

The repository includes a dedicated AGENTS.md file describing:

* architectural patterns
* database workflow requirements
* project conventions
* AI agent development guidelines

---

# Capstone Project Coverage

This project fulfills the Full Stack Apps with AI capstone requirements through:

* full-stack architecture
* multi-platform support
* backend API services
* database persistence
* authentication and authorization
* role-based dashboards
* scalable database operations
* responsive Web platform
* mobile application
* object storage integration
* automated testing
* GitHub Actions CI
* automated database backups
* production deployment
* APK distribution

---