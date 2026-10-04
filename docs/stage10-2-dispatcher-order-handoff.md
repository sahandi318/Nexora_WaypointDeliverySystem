# Stage 10.2 — Store Manager → Dispatcher Order Handoff

This stage connects the completed Store Manager order workflow to Dispatcher planning without creating a second order table.

## Canonical flow

```text
Store Manager creates StoreOrder
        |
        v
SUBMITTED / DEFERRED (4 PM cutoff)
        |
        v
Dispatcher order API (depot-scoped)
        |
        +--> CONFIRMED --> Stage 10.1 DeliveryAllocation --> LiveTripStop
        |
        +--> DEFERRED  --> reason + next effective delivery date
```

## Security rules

- Dispatcher identity, role and depot are loaded from the authenticated MySQL user.
- A Dispatcher can read or act only on orders whose Outlet belongs to that Dispatcher's depot.
- `depotCode` from the browser cannot expand a Dispatcher's scope.
- ADMIN may optionally query a depot for support/oversight.
- Store Managers cannot call Dispatcher order endpoints.
- Order outlet/depot values are never accepted from decision request bodies.

## Endpoints

All endpoints are under `/api/dispatcher` and require `DISPATCHER` or `ADMIN` plus completed password change.

### List orders

`GET /api/dispatcher/orders`

Optional query parameters:

- `status=SUBMITTED|DEFERRED|CONFIRMED|CANCELLED|ALL` (default `SUBMITTED`)
- `date=YYYY-MM-DD` — filters effective dispatch date
- `search=` — order code, outlet code, brand or district
- `page=`
- `pageSize=` (max 100)
- `depotCode=` — ADMIN filter; Dispatcher can only request their own depot

### Order details

`GET /api/dispatcher/orders/:orderCode`

Returns order, outlet constraints, product lines, current active allocation and Dispatcher decision history.

### Confirm

`POST /api/dispatcher/orders/:orderCode/confirm`

Allowed:

- `SUBMITTED -> CONFIRMED`
- `DEFERRED -> CONFIRMED`

A retry on an already-confirmed order is idempotent and does not create a duplicate audit decision.

### Defer

`POST /api/dispatcher/orders/:orderCode/defer`

Body:

```json
{
  "reason": "Vehicle capacity is unavailable for this run.",
  "nextDeliveryDate": "2026-10-06"
}
```

Rules:

- reason is required, max 500 characters
- next date must be later than the current effective dispatch date
- `SUBMITTED -> DEFERRED` is allowed
- `CONFIRMED -> DEFERRED` is allowed only before an active DeliveryAllocation exists
- a currently DEFERRED order must be confirmed before another manual deferral is recorded

## Decision audit history

`store_order_decisions` records:

- StoreOrder
- Dispatcher/Admin who made the decision
- CONFIRMED or DEFERRED
- previous status
- resulting status
- reason (for deferral)
- effective delivery date at the decision
- timestamp

The current operational state remains on `StoreOrder.status`; the decision table is an audit trail, not a duplicate order lifecycle.

## Migration

`20261004093000_add_dispatcher_order_decisions`

After applying this stage:

```powershell
npx prisma migrate dev
npx prisma generate
```

## Tests

```powershell
npm run test:dispatcher-order-handoff
```

The test verifies:

1. Store Manager cannot use Dispatcher order APIs.
2. Dispatcher sees only orders from the authenticated depot.
3. Browser depot override is rejected.
4. Another depot's order is hidden.
5. SUBMITTED order can be confirmed.
6. Confirm retry is idempotent.
7. Deferral requires a reason and later delivery date.
8. Deferred order can later be confirmed for its future run.
9. Active DeliveryAllocation blocks deferral until allocation is cancelled/replanned.

Run the existing Store Manager and Stage 10.1 regression tests after this test.
