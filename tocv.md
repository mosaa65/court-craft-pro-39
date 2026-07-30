Viewed README.md:1-12

# 1. Project Overview

* **Project Name:** Court Craft Pro (ملاعب)
* **Project Type:** Web-based Sports Court Booking & Operations Management Platform
* **Business Domain:** Sports Facility Operations, Scheduling, Financial Management & Customer Relations
* **Primary Purpose:** To provide sports facility operators with a real-time, conflict-free court reservation system, automated customer notifications via WhatsApp/SMS, integrated payment and invoice tracking, and daily operational dashboards.
* **Target Users:** Sports facility owners, branch managers, and front-desk receptionists.
* **Main Business Value:** Prevents double-bookings through server-side time-slot validation, automates multi-channel customer confirmations, accelerates payment collection with full invoice lifecycle tracking, and delivers real-time occupancy and revenue insights through a mobile-first Arabic interface.

---

# 2. Resume Summary (Very Important)

* Engineered a full-stack sports facility management platform using React 19, TypeScript, TanStack Start, and Supabase PostgreSQL to streamline court scheduling and operational workflows.
* Implemented server-side time-slot validation and atomic multi-week recurring booking logic (`createServerFn` + Zod), eliminating scheduling conflicts across single and recurring reservations.
* Developed an automated dual-channel messaging pipeline integrating Twilio via gateway proxy to dispatch booking confirmations and invoices with automatic WhatsApp-to-SMS fallback.
* Designed a mobile-first Arabic (RTL) interface featuring an hourly visual calendar, real-time KPI dashboards, payment tracking (cash/transfer/card), CSV invoice exporting, and custom SSR error normalization.

---

# 3. Core Features

* **Conflict-Aware Scheduling:** Real-time overlap validation for single and multi-week recurring court reservations (2–52 weeks) with atomic pre-flight checks.
* **Hourly Visual Calendar:** Day-by-day court schedule grid with hour-level granularity, court tabs, color-coded booking slots, and direct detail navigation.
* **Dual-Channel Customer Messaging:** Automated WhatsApp and SMS booking confirmations and invoice delivery using phone number E.164 normalization and intelligent fallback.
* **Payment & Invoice Management:** Status tracking for cash, bank transfer, and card payments; invoice drawer with detailed breakdown; date-filtered CSV invoice exports.
* **Customer Registry:** Dedicated customer directory enforcing phone number uniqueness, name/phone search, and quick-pick integration during reservation creation.
* **Operational Dashboard:** Real-time KPIs for daily revenue, booking counts, occupancy rates, active court counts, live court availability carousel, and upcoming booking feeds.
* **Notification Center:** Event-driven operational alerts for booking creation, cancellation, payment receipt, and invoice delivery with bulk mark-as-read functionality.

---

# 4. Technical Stack

### Programming Languages
* TypeScript (^5.8.3)

### Frontend
* React (^19.2.0)
* TanStack Start (^1.168.26)
* TanStack Router (^1.170.16)

### UI & Styling
* Tailwind CSS v4 (^4.2.1)
* shadcn/ui (New York Configuration)
* Radix UI Primitives (Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Popover, Select, Tabs, Tooltip, etc.)
* Lucide React (^0.575.0)
* Vaul (^1.1.2) — Drawer primitive
* Embla Carousel React (^8.6.0)
* cmdk (^1.1.1) — Command palette

### Backend & Server Runtime
* TanStack Start Server Functions (`createServerFn`)
* Nitro (^3.0.260603-beta)
* Custom SSR Server Entry (`src/server.ts`)

### Database & Cloud
* PostgreSQL (via Supabase)
* Supabase JavaScript Client (`@supabase/supabase-js` ^2.110.2)
* Supabase Storage (`court-images` bucket)

### State Management & Queries
* TanStack React Query (^5.101.1)
* React Hooks (`useState`, `useMemo`, `useEffect`)

### Validation & Forms
* Zod (^3.24.2)
* React Hook Form (^7.71.2)
* `@hookform/resolvers` (^5.2.2)

### Third-Party Services & Messaging
* Twilio API (via Lovable Connector Gateway Proxy)
* WhatsApp Business API & SMS Channels

### Data Visualization & Utilities
* Recharts (^2.15.4)
* date-fns (^4.1.0)
* react-day-picker (^9.14.0)
* Sonner (^2.0.7) — Toast notifications

### Build Tools & Developer Utilities
* Vite (^8.0.16)
* `@lovable.dev/vite-tanstack-config` (2.7.6)
* ESLint (^9.32.0)
* Prettier (^3.7.3)
* Bun Configuration (`bunfig.toml`, `bun.lock`)

### Hosting & Deployment
* Vercel

---

# 5. Architecture Analysis

* **Overall Architecture Style:** Modular Monolith leveraging TanStack Start file-based routing and server functions (`createServerFn`).
* **Folder Organization:** Domain-driven structure:
  * `src/routes/` — File-based route definitions (`index.tsx`, `bookings.*.tsx`, `courts.*.tsx`, `customers.*.tsx`, `finance.tsx`, `calendar.tsx`, `notifications.tsx`, `manage.tsx`, `more.tsx`).
  * `src/lib/` — Business logic, server functions (`*.functions.ts`), queries (`*.queries.ts`), server utilities (`*.server.ts`), and mock helper data.
  * `src/components/` — Feature components (`booking-sheet.tsx`, `booking-card.tsx`, `booking-payment-card.tsx`, etc.) and shadcn/ui primitives in `src/components/ui/`.
  * `src/integrations/supabase/` — Database client configurations, auth middleware, and TypeScript database definitions (`types.ts`).
  * `supabase/migrations/` — Version-controlled SQL migration scripts.
* **Separation of Concerns:** Clear demarcation between client UI components, TanStack React Query caching, Zod input validation schemas, server-side data operations (`createServerFn`), and third-party messaging integrations.
* **Recognized Architectural Patterns:**
  * **Service Layer Pattern:** Encapsulation of core CRUD and messaging logic inside server functions (`bookings.functions.ts`, `payments.functions.ts`, `customers.functions.ts`).
  * **Proxy Pattern:** Use of ES6 Proxies for lazy initialization of Supabase clients (`client.ts`, `client.server.ts`).
  * **Data Transfer Object (DTO) / Mapper Pattern:** Explicit mapping functions (`mapCourt`, `mapBooking`) converting raw PostgreSQL snake_case database rows into typed camelCase application objects.
  * **Middleware Pattern:** `requireSupabaseAuth` middleware for Bearer token validation and claim extraction.
* **Scalability & Maintainability:** Highly maintainable due to end-to-end TypeScript safety, centralized server functions, modular route boundaries, and clear separation of client and server code.

---

# 6. Software Engineering Practices

* **SOLID Principles:** Demonstrated Single Responsibility by decoupling query hooks (`*.queries.ts`), server actions (`*.functions.ts`), and UI components (`*.tsx`).
* **DRY (Don't Repeat Yourself):** Shared date/time formatters, status metadata mapping (`statusMeta`), Arabic digit conversion (`toArabicDigits`), and standardized error response handlers across all pages.
* **KISS & Clean Code:** Self-documenting server functions with concise Zod schema validations and clear async/await control flows.
* **Reusable Components:** 46 modular UI primitives built on shadcn/ui and Radix UI, alongside domain components like `BookingCard`, `BookingSheet`, `BookingPaymentCard`, and `AppShell`.
* **Error Handling:** Custom SSR entry (`src/server.ts`) normalizing catastrophic Nitro/h3 500 errors into formatted HTML responses; robust error boundaries (`ErrorComponent`, `notFoundComponent`) in route trees.
* **Validation:** Strict runtime input validation using Zod schemas for all server function invocations.
* **Configuration Management:** Environment variable isolation via `.env` with separate variables for public publishable keys and server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `TWILIO_API_KEY`).

---

# 7. Database Analysis

* **Database Engine:** PostgreSQL (managed via Supabase).
* **Schema Quality:** Relational schema with strong constraints:
  * `courts` — Facility master table (`id` PK, `name`, `sport`, `price_per_hour`, `surface`, `image_key`, `image_url`).
  * `bookings` — Core transaction table with foreign key to `courts` (`ON DELETE CASCADE`), ISO timestamp bounds (`start_at`, `end_at`), payment metadata (`paid_at`, `payment_method`, `payment_note`), messaging audit (`invoice_sent_at`, `invoice_channel`), and recurrence group UUIDs.
  * `customers` — Customer directory with primary key and a partial unique index on non-empty phone numbers (`uq_customers_phone`).
  * `notifications` — Operational alert table with foreign key to `bookings` (`ON DELETE CASCADE`) and read status tracking.
* **Custom Types & Enums:** Custom PostgreSQL enum `booking_status` (`confirmed`, `pending`, `training`, `maintenance`, `cancelled`).
* **Indexing:** Targeted performance indexes:
  * `bookings_start_at_idx`, `bookings_court_id_idx`, `bookings_status_idx`, `idx_bookings_recurrence_group`.
  * `idx_customers_name`, `uq_customers_phone`.
  * `idx_notifications_created_at` (DESC), `idx_notifications_read`.
* **Data Integrity & Triggers:** PL/pgSQL function `tg_set_updated_at()` attached to `BEFORE UPDATE` triggers on `bookings` and `customers` tables.
* **ORM Usage:** No heavy ORM; uses Supabase JavaScript Client with auto-generated TypeScript schema types (`Database`).

---

# 8. Security Analysis

* **Authentication:** Supabase Auth support prepared via `requireSupabaseAuth` middleware with JWT Bearer token validation and claim verification (`data.claims.sub`).
* **Authorization & RLS:** PostgreSQL Row Level Security (RLS) enabled on all public tables (`courts`, `bookings`, `customers`, `notifications`) and Supabase Storage (`court-images` bucket).
* **Server-Side Secret Isolation:** Server-only modules (`client.server.ts`, `twilio.server.ts`) guarantee sensitive keys (`SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `TWILIO_API_KEY`) remain strictly on the server runtime and are never leaked to client bundles.
* **Input Sanitization & Validation:** All server function parameters are sanitized and validated using Zod (validating UUID formats, ISO timestamps, enum bounds, and text string lengths).
* **Phone Number Normalization:** RegEx-based E.164 normalization prevents injection and malformed requests to messaging APIs, with specific handling for Saudi regional formats (`05xxxxxxxx` → `+9665xxxxxxxx`).
* **Environment Variable Management:** Sensitive configuration files (`.env`) excluded via `.gitignore`.
* **Rate Limiting:** Not verified.
* **CSRF / CORS:** Handled natively by Vite, Nitro, and Supabase cloud infrastructure.

---

# 9. API Analysis

* **API Style:** RPC-style server functions (`createServerFn`) integrated into TanStack Start.
* **REST / External Integrations:** External REST calls to Lovable Connector Gateway (`https://connector-gateway.lovable.dev/twilio/Messages.json`) for Twilio messaging dispatch.
* **Versioning:** Not verified (internal server function API surface).
* **Documentation:** Self-documenting via TypeScript interfaces (`CourtRow`, `BookingRow`) and Zod input validation schemas.
* **Validation & Error Handling:** Explicit input parsing via Zod (`inputValidator`); standardized error handling throwing Arabic human-readable error messages for client toast display.
* **API Organization:** Organized logically by domain entity in `src/lib/*.functions.ts`.

---

# 10. Deployment & Infrastructure

* **Hosting Platform:** Vercel (Live at `https://court-craft-pro-39.vercel.app`).
* **Build System:** Vite (^8.0.16) with `@lovable.dev/vite-tanstack-config` plugin wrapping TanStack Start and Nitro.
* **Server Runtime:** Nitro (3.0.260603-beta) configured with Cloudflare/Vercel serverless entry points.
* **Environment Variables:** Environment variable configuration via `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `TWILIO_API_KEY`, etc.).
* **Docker / Containers:** Not verified.
* **CI/CD Pipeline:** Not verified.
* **Reverse Proxy / Nginx:** Not verified.

---

# 11. Development Quality

* **Code Organization:** Excellent. Strict separation between file-based routes, reusable UI components, database queries, and server actions.
* **Maintainability:** High. Full end-to-end TypeScript coverage, centralized state invalidation via TanStack Query, and modular UI structure.
* **Scalability:** High. Serverless-ready Nitro architecture, efficient PostgreSQL indexing, and bounded data fetching patterns.
* **Consistency:** Strict adherence to code conventions: consistent file naming, camelCase/snake_case mapping layers, uniform error handling, and standardized Arabic RTL design tokens.
* **Readability:** Clean, clean-code TypeScript without redundant abstractions or dead code.
* **Reusability:** High reusability of UI elements via shadcn/ui Radix primitives and modular component architecture.

---

# 12. Engineering Competencies Demonstrated

* **Full Stack Development:** Seamless integration of React 19 frontend with TanStack Start server functions and PostgreSQL database.
* **Software Architecture:** Design of a modular monolith with file-based routing, server functions, and layer separation.
* **Database Modeling & Design:** Creation of relational PostgreSQL schema with foreign keys, custom enums, partial unique indexes, performance indexes, and automatic timestamp triggers.
* **Server-Side Validation & Conflict Logic:** Implementation of complex time-window overlap algorithms for single and recurring booking reservations.
* **Third-Party API Integration:** Implementation of dual-channel messaging pipeline (WhatsApp + SMS) with E.164 phone normalization and automatic channel fallback.
* **State Management & Caching:** Utilization of TanStack React Query for asynchronous data fetching, cache invalidation, and route prefetching.
* **Security & Secret Management:** Isolation of server-only credentials, execution of server functions, and implementation of Row Level Security (RLS) policies.
* **Localization & Internationalization (i18n):** Engineering a native Arabic (RTL) user interface with custom date/time formatting and Arabic numeral handling.
* **Error Normalization & Resilience:** Custom SSR server entry configuration intercepting unhandled 500 responses for graceful user-facing error rendering.

---

# 13. ATS Resume Keywords

* **Frontend:** React 19, TypeScript, TanStack Start, TanStack Router, TanStack React Query, Tailwind CSS v4, shadcn/ui, Radix UI, Responsive Web Design, RTL Layouts, Recharts, Lucide React.
* **Backend & Server:** Server Functions, Nitro Engine, Node.js, SSR (Server-Side Rendering), REST APIs, RPC, Zod Schema Validation, Error Handling.
* **Database:** PostgreSQL, Supabase, Relational Database Design, Database Indexing, Foreign Keys, PL/pgSQL Triggers, Database Enums, Row Level Security (RLS).
* **Integrations & Cloud:** Twilio API, WhatsApp Business API, SMS Gateway, Vercel, Supabase Storage, Environment Secret Management.
* **Engineering Practices:** Full Stack Architecture, Software Engineering Principles, Modular Monolith, Object Mapping, Input Validation, Type Safety, Clean Code.

---

# 14. Suggested Resume Entry

### Court Craft Pro (ملاعب)
**Web-Based Sports Court Booking & Operations Platform**
* Architected a full-stack facility operations platform using React 19, TypeScript, TanStack Start, and Supabase PostgreSQL.
* Implemented server-side reservation conflict validation and multi-week recurring booking algorithms using Zod and TanStack Server Functions, eliminating double-bookings.
* Built an automated dual-channel messaging pipeline integrating Twilio via gateway proxy to deliver WhatsApp and SMS booking confirmations with automatic fallback.
* Developed a mobile-first Arabic RTL interface with an hourly visual schedule, payment lifecycle tracking (cash/transfer/card), CSV exporting, and custom SSR error normalization.
* **Technologies Used:** TypeScript, React 19, TanStack Start, TanStack Router, TanStack React Query, Tailwind CSS v4, Supabase (PostgreSQL), Zod, Twilio API, Vite, Vercel.