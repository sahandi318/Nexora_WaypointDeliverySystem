# Nexora Waypoint Delivery System

A full-stack delivery planning and operations platform developed for the **Tech-Triathlon 2026 Hackathon – Waypoint Group challenge**.

Nexora connects the complete depot-to-store delivery workflow in one system:

**Store Manager → Dispatcher → Loader → Driver → Store Manager**

The platform supports secure role-based access, order planning, loading operations, live delivery tracking, issue handling, multilingual UI, light/dark themes, and deployment-ready database migrations and seed accounts.

---

## 1. Project Overview

Waypoint operates deliveries from depots to stores/outlets. The purpose of Nexora is to bring the major operational roles into one connected workflow so that orders, plans, loading, delivery progress, receipt confirmation, and operational issues are handled through a single system.

### Main objectives

- Connect store replenishment orders with depot delivery planning.
- Enforce role-based access and outlet/depot isolation.
- Support the 4 PM order cut-off workflow.
- Provide Dispatcher planning with real vehicles, drivers, outlets, and constraints.
- Connect published plans to Store Manager delivery tracking.
- Support Loader verification and handover workflows.
- Support Driver trip execution, delivery outcomes, and live updates.
- Allow Store Managers to confirm receipt and report real operational issues.
- Support English, Sinhala, and Tamil.
- Support responsive light and dark themes.
- Provide deployment-ready migrations, seed accounts, and environment templates.

---

## 2. Core Workflow

```text
Store Manager
    |
    | Create replenishment order
    v
Dispatcher
    |
    | Confirm / defer order
    | Create delivery plan
    | Assign vehicle + driver
    | Publish plan
    v
Loader
    |
    | Prepare trip
    | Load goods
    | Verify loading
    | Report loading issues
    | Handover to driver
    v
Driver
    |
    | Start trip
    | Navigate stops
    | Update live progress
    | Record Delivered / Partial / Exception
    v
Store Manager
    |
    | Track delivery
    | Confirm receipt
    | Report issue if required
    v
Issue Lifecycle
OPEN -> RESOLVED
```

---

## 3. User Roles

### Administrator

The Administrator manages high-level system configuration and staff access.

Main responsibilities:

- Manage users and roles.
- Manage outlet/depot assignments.
- Access administrative functionality.
- Maintain operational access configuration.

### Store Manager

The Store Manager represents a single outlet and is restricted to that outlet.

Main responsibilities:

- Create replenishment orders.
- View submitted and processed orders.
- Track expected deliveries.
- View live delivery progress and ETA information.
- Confirm delivered or partial deliveries as received.
- Report delivery-related issues.
- Track real `OPEN` and `RESOLVED` issues.

### Dispatcher

The Dispatcher is restricted to the authenticated user's depot.

Main responsibilities:

- View Store Manager orders for the assigned depot.
- Confirm or defer submitted orders.
- Provide deferral reason/date where required.
- Create delivery plans.
- Select real vehicles and active drivers.
- Sequence trip stops.
- Publish plans.
- Create the delivery bridge used by Store Manager tracking.

### Loader

The Loader handles pre-departure preparation.

Main responsibilities:

- View published trip/loading information.
- Track expected and loaded quantities.
- Record loading issues.
- Perform verification checks.
- Complete loader-to-driver handover.

### Driver

The Driver executes the delivery trip using a mobile-focused interface.

Main responsibilities:

- View assigned trips and stops.
- View delivery windows and store constraints.
- Progress through the delivery lifecycle.
- Record Delivered / Partial / Exception outcomes.
- Send live progress updates.
- Support reconnect/offline-aware operational flows.

---

## 4. Important Business Rules

### 4 PM Cut-off Rule

Orders submitted before the configured cut-off can be considered for the next delivery cycle. Orders submitted after the cut-off are handled for a later effective dispatch date.

### Outlet Isolation

A Store Manager cannot select or switch outlet context from the client. Outlet context is derived from the authenticated database user.

### Depot Isolation

A Dispatcher cannot widen access by sending another depot or `ALL` from the client. Depot scope is derived from the authenticated database user. Administrator access remains broader where explicitly allowed.

### Published Delivery Bridge

When a Dispatcher publishes a delivery plan, the system links:

```text
StoreOrder -> DeliveryAllocation -> LiveTripStop -> LiveTrip
```

This allows the Store Manager to see and track the correct published delivery without exposing unrelated route details.

---

## 5. Store Manager Delivery Lifecycle

The Store Manager delivery experience supports the following projected states:

```text
AWAITING_PLAN
SCHEDULED
READY_FOR_DISPATCH
IN_TRANSIT
ARRIVING
ARRIVED
DELIVERED
PARTIAL
DEFERRED
EXCEPTION
RECEIVED
```

### Receipt Confirmation

A Store Manager can confirm a delivery as received only when the delivery is in a valid final state.

- `DELIVERED` can be confirmed directly.
- `PARTIAL` requires explicit partial-delivery acknowledgement.
- Repeated confirmation is idempotent.
- Receipt confirmation stores the confirming user, time, and optional note.

### Issue Lifecycle

Store Manager issues are persisted in the database.

Issue categories include:

- Delivery shortfall
- Damaged goods
- Late delivery
- Delivery exception
- Order problem
- Other

Lifecycle:

```text
OPEN -> RESOLVED
```

The Store Manager sidebar badge uses the real number of open issue records.

---

## 6. Live Delivery Tracking

The live-monitoring foundation uses secure server-side context and Socket.IO.

Key behavior:

- Store Manager socket room is derived from the current DB outlet assignment.
- Invalid or unauthenticated socket tokens are rejected.
- Store Managers do not receive unrelated route, POD, or outlet-sensitive information.
- Driver updates can invalidate/refetch Store Manager delivery tracking safely.
- Initial tracking data is loaded through REST.
- Socket updates, reconnect handling, polling fallback, and debounced refresh are supported.
- Final states preserve useful last-known delivery information.

---

## 7. Authentication and Login

Nexora uses a shared staff login for operational roles.

```text
/login
```

The user enters a User ID or registered email and password. The backend determines the user's role and redirects the user to the correct workspace.

Administrator login is available separately:

```text
/admin/login
```

The login experience includes:

- User ID or email login.
- JWT authentication.
- Role-based route protection.
- Forgot-password flow.
- OTP email verification.
- Password reset authorization token.
- Language selector.
- Light/dark mode control.
- Clean auth-only layout without the public landing navbar/footer.

---

## 8. Internationalization

The interface supports:

- English
- Sinhala
- Tamil

The project uses a translation-service architecture and also contains static translations for important application UI.

Local translation settings are provided for the NLLB model.

---

## 9. Technology Stack

### Frontend

- React
- JavaScript
- Vite
- Tailwind CSS
- React Router
- PWA support
- IndexedDB/Dexie architecture for offline workflows
- Socket.IO client
- MapLibre / OpenStreetMap based mapping architecture
- Inter Variable typography

### Backend

- Node.js
- Express.js
- Prisma ORM
- MySQL / MariaDB-compatible adapter
- JWT authentication
- RBAC middleware
- Socket.IO
- Password-reset OTP flow
- SMTP email support

### Testing

The project includes backend regression/integration scripts and frontend production-build verification.

---

## 10. Project Structure

```text
Nexora_WaypointDeliverySystem/
|
|-- backend/
|   |-- prisma/
|   |   |-- migrations/
|   |   `-- schema.prisma
|   |-- src/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- scripts/
|   |   |-- services/
|   |   `-- generated/
|   |-- .env
|   |-- .env.example
|   |-- .env.production.example
|   |-- package.json
|   `-- server.js
|
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- i18n/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- assets/
|   |-- .env.production.example
|   |-- package.json
|   `-- vite.config.*
|
|-- data/
|-- database/
|-- docs/
`-- README.md
```

---

## 11. Organizer Dataset Usage

The system is designed around the provided Waypoint operational data.

### Outlets

The outlet dataset is used for operational context such as:

- Outlet identity
- Brand
- District
- Depot
- Dock type
- Parking/access constraints
- Mall windows
- Delivery opening/closing windows

The dataset contains 120 outlets split across the Peliyagoda and Kandy depot contexts.

### Vehicles

Vehicle data supports planning information such as:

- Vehicle identity
- Vehicle type
- Temperature capability
- Weight capacity
- Volume capacity
- Fuel information
- Depot assignment

### Complete General Data integration

The planning and delivery flow now uses all seven organizer General Data files at runtime:

- `outlets.csv` — outlet/depot context, dock type, access constraints, mall windows and delivery windows
- `vehicles.csv` — capacity, temperature capability, fuel type, km/L and weekly fuel quota
- `calendar.csv` — operating-day and monsoon context
- `district_travel.csv` — depot-to-district and inter-stop distance/free-flow time
- `traffic_speed.csv` — district/hour/monsoon traffic speed index
- `road_conditions.csv` — district/date disruption index
- `service_allowance.csv` — brand + dock service/unloading allowance

Dispatcher suggestions calculate planned distance, adjusted travel time, service time, fuel use and delivery-window warnings from the organizer data. Publication recalculates the estimate server-side and stores the safe per-stop planning context with the published `LiveTripStop`. The same published context then reaches Loader and Driver workflows, while Store Managers receive only their own stop's safe planning/ETA information.

Because the supplied calendar ends on `2026-06-28`, requests after the source range use an explicit seasonal/weekday fallback and expose the source date instead of silently pretending the organizer file contains current-day records. See `docs/general-data-integration.md`.

---

## 12. Local Development Setup

### Prerequisites

Install:

- Node.js
- npm
- MySQL or Docker
- Git

### Clone

```bash
git clone https://github.com/sahandi318/Nexora_WaypointDeliverySystem.git
cd Nexora_WaypointDeliverySystem
git switch dev
```

### Backend setup

```bash
cd backend
npm install
```

Create the real environment file from the template:

```bash
copy .env.example .env
```

Update `.env` with your local database and secret values.

Apply migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start backend:

```bash
npm run dev
```

Default local backend URL:

```text
http://localhost:5000
```

### Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Default local frontend URL:

```text
http://localhost:5173
```

---

## 13. Environment Configuration

Real secrets must be stored only in `.env` or the hosting provider's secret/environment manager.

Never commit:

```text
backend/.env
frontend/.env
```

Safe templates:

```text
backend/.env.example
backend/.env.production.example
frontend/.env.production.example
```

Important environment groups include:

- Database connection
- JWT signing
- Password reset OTP
- Password reset authorization token
- SMTP
- Translation service
- Admin registration
- Deployment/demo seed accounts

---

## 14. Deployment Seed Accounts

The project contains a deployment seed script that creates or verifies one account for each major role.

Run from the backend directory:

```bash
npm run seed:deployment-accounts
```

### Demo login accounts

The following credentials are intentionally provided for the competition/demo environment so evaluators and team members can quickly access every role.

| Role | User ID | Demo Password | Assignment |
|---|---|---|---|
| Administrator | `ADMIN001` | `Admin12345!` | Global administrator |
| Store Manager | `SM001` | `Store12345!` | `OUT001` |
| Dispatcher | `DSP001` | `Dispatch123!` | `PELIYAGODA` |
| Loader | `LDR001` | `Loader12345!` | `PELIYAGODA` |
| Driver | `DRV001` | `Driver12345!` | `PELIYAGODA` |

> **Demo credentials only:** these passwords are intentionally simple for evaluation and demonstration. Do not reuse them for personal accounts or a real production deployment. Rotate them before any public/long-term deployment.

### Password handling

Seed passwords are read from backend environment variables. The seed script never prints the password values to the console.

For the demo environment:

```env
ADMIN_SEED_PASSWORD=Admin12345!
STORE_MANAGER_SEED_PASSWORD=Store12345!
DISPATCHER_SEED_PASSWORD=Dispatch123!
LOADER_SEED_PASSWORD=Loader12345!
DRIVER_SEED_PASSWORD=Driver12345!
```

To intentionally apply/reset these passwords for existing seeded accounts:

```env
SEED_RESET_EXISTING_PASSWORDS=true
```

Run the seed once, confirm all five accounts, and then immediately restore:

```env
SEED_RESET_EXISTING_PASSWORDS=false
```

This prevents later seed runs from unexpectedly changing account passwords.

---

## 15. Database Migrations

Production/deployment database setup:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Current migrations include support for areas such as:

- Core system data
- Store Manager orders
- Dispatcher planning
- Delivery allocation bridge
- Loader workflow
- Live trip stop order linking
- Store Manager receipt confirmation
- Store Manager issue lifecycle

Always run `prisma migrate deploy` on the deployment database before starting the deployed backend.

---

## 16. Important Regression Tests

Run from `backend/`.

### Store Manager receipt confirmation

```bash
npm run test:store-manager-receive
```

### Store Manager issue lifecycle

```bash
npm run test:store-manager-issues
```

### Store Manager live socket security

```bash
npm run test:store-manager-live-socket
```

### Driver-to-Store-Manager event bridge

```bash
npm run test:store-manager-live-event-bridge
```

### Dispatcher publish bridge

```bash
npm run test:dispatcher-publish-bridge
```

### Store Manager delivery API

```bash
npm run test:store-manager-deliveries
```

### Dispatcher order handoff

```bash
npm run test:dispatcher-order-handoff
```

### Dispatcher planning

```bash
npm run test:dispatcher-planning
```

### Organizer General Data calculations

```bash
npm run test:organizer-data
```

This verifies all seven General Data files, travel/traffic/road/service calculations, fuel estimation and post-range calendar fallback behavior.

The final integrated development branch was verified with these regression suites after applying the latest database migrations.

---

## 17. Frontend Production Build

From `frontend/`:

```bash
npm run build
```

The generated production build is placed in:

```text
frontend/dist/
```

A Vite large-chunk warning may be displayed during build. It is a performance optimization warning and does not indicate a failed build.

---

## 18. Deployment Checklist

Before deployment:

1. Pull the latest `dev` branch.
2. Configure production environment variables.
3. Never upload the real `.env` file to Git.
4. Install backend/frontend dependencies.
5. Run `npx prisma migrate deploy`.
6. Run `npx prisma generate`.
7. Seed deployment/demo accounts if required.
8. Set `SEED_RESET_EXISTING_PASSWORDS=false` after intentional seeding.
9. Build the frontend.
10. Start the backend using the deployment platform's process configuration.
11. Verify allowed frontend/backend origins.
12. Test authentication for each role.
13. Test the complete operational flow.

Recommended smoke-test flow:

```text
Store Manager creates order
-> Dispatcher confirms
-> Dispatcher plans + publishes
-> Loader prepares trip
-> Driver executes trip
-> Store Manager sees delivery
-> Store Manager confirms receipt
-> Issue OPEN / RESOLVED flow if required
```

---

## 19. Security Notes

- JWT signing secrets must not be committed.
- SMTP application passwords must not be committed.
- Password-reset secrets must not be committed.
- Admin registration secrets must not be committed.
- Demo account passwords must not be stored in README files.
- Store Manager outlet access is derived server-side.
- Dispatcher depot access is derived server-side.
- Store Manager live socket payloads are intentionally restricted.
- Existing seeded passwords are preserved unless explicit reset is enabled.

If a secret is accidentally exposed publicly, rotate it before deployment.

---

## 20. Git Workflow

The primary integration branch is:

```text
dev
```

Recommended workflow:

```bash
git switch dev
git pull --ff-only origin dev

git switch -c feature/<feature-name>
```

After implementation and verification:

```bash
git add <changed-files>
git commit -m "feat: describe the change"
git push origin feature/<feature-name>
```

Then merge into `dev` only after required regression tests and builds pass.

---

## 21. Troubleshooting

### `EADDRINUSE: port 5000`

Another backend instance is already listening on port 5000.

Windows PowerShell:

```powershell
netstat -ano | findstr :5000
tasklist /FI "PID eq <PID>"
Stop-Process -Id <PID> -Force
```

### Prisma reports a missing column

Check migration status:

```bash
npx prisma migrate status
```

Apply pending migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

### Deployment seed says an email is already used

Each seeded account must have a unique email address. Update the environment values so that no two users share the same email.

### Seed password validation error

Deployment seed passwords must satisfy the validation rules configured by the seed script. Use a sufficiently long password and required character classes.

---

## 22. Current Integrated Capabilities

The integrated `dev` branch includes:

- Shared role-aware staff authentication
- Separate administrator authentication
- Password recovery
- Multilingual UI
- Light/dark mode
- Store Manager order workflow
- Dispatcher Store Manager order handoff
- Dispatcher planning and depot isolation
- Published delivery allocation bridge
- Store Manager delivery tracking
- Secure Store Manager live socket updates
- Store Manager receipt confirmation
- Real Store Manager issue lifecycle
- Loader database-backed workflow
- Loader verification/handover data model
- Live trip stop/order linking
- Deployment account seed script
- Production/local environment templates

---

## 23. Final System Flow

```text
                    NEXORA WAYPOINT DELIVERY SYSTEM

                             ADMIN
                               |
                               | manages access
                               v
STORE MANAGER -> DISPATCHER -> LOADER -> DRIVER -> STORE MANAGER
     |               |            |         |            |
     | order         | plan       | load    | deliver    | receive
     |               | publish    | verify  | update     | issue
     v               v            v         v            v
  StoreOrder   DeliveryPlan   LoaderState  LiveTrip   Receipt/Issue
                      |
                      v
             DeliveryAllocation
                      |
                      v
                 LiveTripStop
```

---

## 24. Project Status

The main Store Manager, Dispatcher integration, Loader integration foundation, live delivery tracking, receipt confirmation, issue lifecycle, authentication polish, database migrations, and deployment seed-account setup have been integrated into the `dev` branch and verified through regression tests and production frontend builds.

---

## License / Competition Use

This repository was developed as a competition/academic project for the Waypoint delivery operations challenge. Organizer-provided datasets should be handled according to the competition's data-sharing rules and should not be redistributed publicly unless permission allows it.
