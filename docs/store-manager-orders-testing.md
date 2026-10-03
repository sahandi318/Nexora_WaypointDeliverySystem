# Store Manager Orders — Stage 9.1 Testing

## Purpose

Stage 9.1 adds the backend/database foundation for the Store Manager order workflow.

It provides:

- an application-owned demo product catalogue,
- outlet-isolated Store Manager orders,
- order items,
- backend-only 4 PM cutoff evaluation in `Asia/Colombo`,
- order list/detail/create APIs,
- HTTP/database isolation tests.

## Data provenance

The organizer dataset does **not** provide a product catalogue or product prices.

For that reason:

- seeded products use `source = APPLICATION_DEMO`,
- no product prices are stored,
- no estimated order value is calculated.

## Apply the migration

From `backend`:

```powershell
npm run prisma:generate
npx prisma migrate dev
npm run prisma:generate
```

If Prisma reports that the pending migration was applied, continue.

## Seed the demo catalogue

```powershell
npm run seed:store-manager-catalog
```

Expected: 8 active demo products.

## Run existing security tests

```powershell
npm test
npx tsx src/scripts/testRoleMiddleware.js
npx tsx src/scripts/testStoreManagerMiddleware.js
```

## Run Stage 9.1 order tests

```powershell
npm run test:store-manager-orders
```

Expected:

```text
Passed 7/7 tests
```

## API endpoints

All endpoints are below the existing Store Manager security middleware pipeline.

### Catalog

```http
GET /api/store-manager/catalog
```

### Orders list

```http
GET /api/store-manager/orders
```

The backend automatically filters to the authenticated Store Manager's assigned outlet.

### Order details

```http
GET /api/store-manager/orders/:orderCode
```

An order belonging to another outlet returns `404`.

### Create order

```http
POST /api/store-manager/orders
Content-Type: application/json
Authorization: Bearer <token>
```

Example body:

```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 4
    },
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}
```

Do not send an outlet selector from the frontend.

Even if a client sends `outletId`, `outletCode`, `role`, or `userId`, the order service ignores those values and uses `req.storeManagerContext`.

## 4 PM rule

The server evaluates the submission time in:

```text
Asia/Colombo
```

Before `16:00`:

```text
cutoffDecision = ON_TIME
status = SUBMITTED
effective processing = next calendar day
```

At or after `16:00`:

```text
cutoffDecision = AFTER_CUTOFF
status = DEFERRED
effective processing = following calendar day/run
```

The frontend clock is never trusted.

## Scope note

Stage 9.1 implements the cutoff foundation using calendar-day offsets.

Organizer calendar/holiday/peak-day planning data belongs to the later dispatcher/planning integration. When that planning module is connected, `effectiveDispatchDate` can be upgraded to the next valid service run without changing Store Manager outlet isolation.
