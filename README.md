# Marketplace

> A modern, mobile-first marketplace combining the convenience of online shopping with the excitement of real-time auctions.

## 📌 Project Overview

Marketplace is a mobile-first buying and selling platform designed to make online commerce simpler, faster, safer, and more engaging.

The platform combines:

* 🛒 Buy Now listings
* 🔨 Real-time auctions
* 💬 Buyer-seller messaging
* ❤️ Watchlists and saved searches
* 🤖 AI-assisted listing creation
* ⭐ Seller reputation and reviews
* 🔔 Real-time notifications
* 📦 Orders and delivery
* 🛡️ Marketplace moderation and trust features

The long-term vision is to create a marketplace that combines the strongest ideas from traditional online marketplaces with a modern mobile-first user experience.

---

## 🎯 Vision

Create a marketplace where:

**Selling is effortless.**
**Buying is simple.**
**Auctions are engaging.**
**Transactions are trustworthy.**

---

## 🧩 Core Problem

Traditional marketplaces can make buying and selling unnecessarily difficult.

Common problems include:

* Complicated listing creation
* Poor search and discovery
* Difficult-to-use auction systems
* Unclear seller reputation
* Scams and suspicious listings
* Fragmented buyer-seller communication
* Poor mobile experiences
* Too much friction between discovering an item and completing a transaction

This project aims to address these problems through a simpler UX, stronger trust mechanisms, realtime functionality, and intelligent automation.

---

# 🚀 Core Features

## 🛒 Marketplace

Users can:

* Browse listings
* Search for products
* Filter by category, price, condition, and other attributes
* View detailed listings
* Save/favorite listings
* Buy items directly
* Make offers
* View seller profiles

---

## 🔨 Auctions

Sellers can create auctions with:

* Starting price
* Minimum bid increment
* Auction duration
* Optional Buy Now price
* Automatic/proxy bidding
* Realtime bid updates
* Countdown timers
* Outbid notifications
* Auction history
* Auction winner determination

### Auction protection

The auction system will eventually support:

* Server-side bid validation
* Concurrent bid handling
* Anti-sniping extensions
* Prevention of invalid/duplicate bids
* Secure auction closing
* Server-authoritative winner selection

The mobile application will never be trusted to determine the final winner.

---

## 🤖 AI Listing Assistant

A seller can upload an image and provide basic information.

The system can assist with:

* Product identification
* Category suggestions
* Listing titles
* Descriptions
* Tags
* Price-range suggestions

AI-generated information must remain editable and subject to seller confirmation.

---

## 💬 Messaging

Buyers and sellers can communicate through realtime chat.

Future functionality may include:

* Listing-linked conversations
* Offer discussions
* Transaction-related messages
* Read status
* Notifications
* Report/block functionality

---

## ⭐ Trust & Reputation

The platform will eventually provide:

* Seller ratings
* Buyer ratings
* Verified transactions
* Completed transaction counts
* Response-time indicators
* Seller reliability information
* Listing reports
* User reports
* Moderation tools

The goal is to provide useful information about marketplace participants rather than relying on a single rating number.

---

## 🔔 Notifications

Users may receive notifications for:

* New messages
* Being outbid
* Auctions ending soon
* Winning auctions
* Saved-search matches
* Price changes
* Order updates
* Delivery updates

---

## 📦 Orders & Delivery

Future functionality:

* Checkout
* Payment processing
* Order management
* Seller fulfilment
* Delivery options
* Tracking
* Pickup
* Transaction completion
* Reviews after completed transactions

---

# 📱 Applications

The platform will consist of multiple applications.

## Customer Mobile App

Built with:

**React Native + Expo + TypeScript**

Used by buyers and sellers.

Primary areas:

```text
Home
Browse
Search
Listing
Sell
Auctions
Chats
Orders
Profile
```

---

## 🖥️ Admin Dashboard

A separate web application built with:

**Next.js + TypeScript**

Used by authorized marketplace administrators.

Admin functionality will include:

* User management
* Listing moderation
* Reports
* Auction monitoring
* Transaction management
* Dispute management
* Platform analytics
* Moderation actions
* System management

Administrative permissions must be enforced server-side and must never rely solely on frontend restrictions.

---

# 🏗️ Technology Stack

## Mobile

* React Native
* Expo
* TypeScript
* Expo Router
* NativeWind
* Zustand
* React Hook Form
* Zod

## Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* Supabase Realtime

## Admin

* Next.js
* TypeScript

## Future Services

* Typesense for advanced search
* OpenAI API for AI functionality
* Mapbox for location features
* Payment provider integration
* Push notifications
* Courier/delivery APIs
* PostHog for analytics

---

# 🏛️ High-Level Architecture

```text
                         ┌──────────────────┐
                         │  React Native    │
                         │   Mobile App     │
                         └────────┬─────────┘
                                  │
                                  │
                         ┌────────▼─────────┐
                         │     Supabase     │
                         │                  │
                         │ Authentication   │
                         │ PostgreSQL       │
                         │ Storage          │
                         │ Realtime         │
                         └────────┬─────────┘
                                  │
               ┌──────────────────┼──────────────────┐
               │                  │                  │
               ▼                  ▼                  ▼
            Search              AI              Payments
               │
               ▼
       Marketplace Data


                         ┌──────────────────┐
                         │     Next.js      │
                         │  Admin Dashboard │
                         └────────┬─────────┘
                                  │
                                  ▼
                              Supabase
                                  │
                                  ▼
                              PostgreSQL
```

---

# 🗄️ Core Data Model

Initial entities are expected to include:

```text
Users
Listings
ListingImages
Categories
Auctions
Bids
Favorites
Conversations
Messages
Orders
Payments
Reviews
Notifications
Reports
```

The exact schema will be designed during the database phase.

---

# 🛠️ Development Increments

The product is built in **agile vertical slices**. Every increment ships something usable end-to-end
(database → API → app), is demoed on a real phone, passes CI, and is tagged (`v0.N`).
Payments are settled off-platform until the Monetization increment so real users can start early.

## Increment 0 — Foundation (`v0.0`)

* [x] pnpm monorepo (`apps/`, `packages/`, `supabase/`)
* [x] Expo (SDK 58) + Expo Router + TypeScript app with 5 tabs
* [x] Supabase project config, first migration (`profiles` + RLS) and pgTAP tests
* [x] Typed Supabase client + backend health check on Home
* [x] Shared types package (`@marketplace/shared`)
* [x] ESLint, Jest + Testing Library, GitHub Actions CI

## Increment 1 — Accounts (`v0.1`)

* [ ] Sign up / log in (email OTP, Google, Apple) with secure session storage
* [ ] Profile auto-created on signup; edit name, avatar, region
* [ ] Protected routes and auth state

## Increment 2 — Listings v1, closed beta (`v0.2`)

* [ ] Categories, create / edit / delete listings with photos
* [ ] Home feed, category browse, listing detail, mark as sold
* [ ] Styling system decision (NativeWind / Uniwind vs. theme tokens)
* [ ] Internal EAS build to first 10–20 testers

## Increment 3 — Discovery (`v0.3`)

* [ ] Full-text search with category / price / condition / region filters
* [ ] Favorites / watchlist, seller profile pages, infinite scroll

## Increment 4 — Auctions v1 (`v0.4`)

* [ ] Auctions with start / reserve / Buy Now price and bid increments
* [ ] Server-side `place_bid` with row locking and validation
* [ ] Anti-sniping, scheduled server-side closing and winner selection
* [ ] Realtime price + countdown, bid history, concurrency tests

## Increment 5 — Messaging & notifications (`v0.5`)

* [ ] Listing-linked realtime chat with read status
* [ ] Push notifications: messages, outbid, ending soon, won

## Increment 6 — Trust, safety & public launch (`v1.0`)

* [ ] Report / block, rate limiting
* [ ] Next.js admin: moderation queue, users, auction monitor (server-side roles)
* [ ] Terms, privacy policy, in-app account deletion
* [ ] Crash reporting + product analytics
* [ ] App Store / Play Store release

## Increment 7 — Monetization (`v1.1`)

* [ ] Buy Now checkout and orders via payment provider webhooks
* [ ] Success fees and featured / boosted listings
* [ ] Reviews tied to completed transactions

## Increment 8+ — Growth backlog

AI listing assistant, proxy bidding, saved searches, offers, seller storefronts,
delivery integrations, advanced search, recommendations — prioritised by analytics.

---

# 💻 Getting Started

Requirements: Node 22.13+, pnpm 10, and Docker (for the local Supabase stack).

```bash
pnpm install

# Backend (Docker required)
pnpm db:start        # starts local Supabase, applies migrations + seed; prints API URL and anon key
pnpm db:test         # runs pgTAP database tests
pnpm db:types        # regenerates packages/shared/src/database.types.ts after schema changes

# App
cp apps/mobile/.env.example apps/mobile/.env   # then paste the URL + anon key
pnpm dev             # starts Expo; scan the QR code with Expo Go
```

On a physical phone, use your computer's LAN IP instead of `127.0.0.1` in `EXPO_PUBLIC_SUPABASE_URL`.

Quality checks (also run in CI): `pnpm lint`, `pnpm typecheck`, `pnpm test`.

```text
apps/mobile/        Expo app (routes in src/app, components, hooks, lib)
packages/shared/    Shared TypeScript types (generated database types)
supabase/           config.toml, migrations/, seed.sql, tests/database/ (pgTAP)
.github/workflows/  CI
```

---

# 🧪 Development Philosophy

The project will be built **phase-by-phase**.

Each phase follows:

```text
Understand
    ↓
Design
    ↓
Implement
    ↓
Test
    ↓
Review
    ↓
Commit
    ↓
Next Phase
```

We will avoid building large amounts of functionality without testing the underlying architecture.

Important concepts will be explained while implementing them so that the project is understood rather than simply assembled.

---

# 🔐 Security Principles

Security is a core requirement rather than a final-stage addition.

Important principles include:

* Never trust the client
* Validate input
* Enforce authorization server-side
* Protect secrets
* Never commit credentials
* Use environment variables
* Apply database access policies
* Validate auction bids server-side
* Protect sensitive user information
* Rate-limit sensitive operations
* Log important security events

---

# 📈 Long-Term Vision

The MVP is only the foundation.

The long-term platform could evolve into a complete marketplace ecosystem featuring:

```text
Marketplace
    │
    ├── Buy Now
    ├── Auctions
    ├── Offers
    ├── AI
    ├── Social Discovery
    ├── Seller Stores
    ├── Payments
    ├── Delivery
    ├── Reputation
    └── Analytics
```

The platform should remain modular so that new capabilities can be introduced without rewriting the core system.

---

# 📌 Current Status

**Status:** In development

**Current Increment:** Increment 0 — Foundation (complete)

**Next Step:** Increment 1 — Accounts.

---

## Development Rule

> Build deliberately. Understand the architecture. Test every phase. Commit meaningful changes. Never sacrifice security or maintainability for speed.

