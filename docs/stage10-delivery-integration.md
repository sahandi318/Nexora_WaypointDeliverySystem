# Stage 10.1 — Shared Delivery Integration Foundation

## Purpose

Stage 10.1 creates the database bridge that connects the existing Store Manager order system to the existing Dispatcher/Driver live delivery monitoring system without creating a second delivery system.

The canonical relationship is:

```text
StoreOrder
   |
   v
DeliveryAllocation
   |
   v
LiveTripStop
   |
   v
LiveTrip
```

`StoreOrder` remains the business order record. `LiveTrip` and `LiveTripStop` remain the transport execution records. `DeliveryAllocation` only connects them.

## Why a bridge model is used

A direct `StoreOrder -> LiveTripStop` foreign key would make the transport layer own the business order and would make re-planning difficult. The bridge allows:

- several store orders to share one outlet stop;
- cancellation and re-allocation without deleting an order;
- future Loader integration without redesigning StoreOrder;
- future receipt/discrepancy records to reference one shared delivery allocation;
- Store Manager delivery pages to query trusted order + trip information together.

## Stage 10.1 integrity rules

1. Only `CONFIRMED` StoreOrders can be allocated.
2. The LiveTripStop `outletCode` must match the order's trusted `Outlet.outletCode`.
3. When both records have a depot, the trip depot must match the outlet depot.
4. A StoreOrder may have only one active allocation (`ALLOCATED` or `PUBLISHED`) at a time.
5. Repeating the same allocation is idempotent.
6. `allocatedUnits` is copied from `StoreOrder.totalUnits` on the server. It is never trusted from the browser.
7. Cancelling an allocation releases the order for a later Dispatcher re-plan.

## Store Manager delivery status projection

No duplicate delivery status column is introduced. The Store Manager status is derived from the shared states:

| Shared state | Store Manager status |
| --- | --- |
| StoreOrder `SUBMITTED` | `AWAITING_DISPATCHER` |
| StoreOrder `DEFERRED` | `DEFERRED` |
| StoreOrder `CONFIRMED`, no active allocation | `AWAITING_PLAN` |
| Allocation `ALLOCATED` | `PLANNING` |
| Allocation `PUBLISHED` / trip `PLANNED` | `SCHEDULED` |
| Trip `VEHICLE_READY` | `READY_FOR_DISPATCH` |
| Trip `ON_ROUTE` / `OFFLINE` | `IN_TRANSIT` |
| Stop `NEXT_STOP` | `ARRIVING` |
| Stop `ARRIVED` | `ARRIVED` |
| Outcome `DELIVERED_FULL` | `DELIVERED` |
| Outcome `PARTIAL_DELIVERY` | `PARTIAL` |
| Outcome `UNABLE_TO_DELIVER` | `EXCEPTION` |

Driver online/offline remains separate metadata. An offline driver does not mean the delivery itself has failed.

## Files added/changed

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20261004090000_add_delivery_allocation_bridge/migration.sql`
- `backend/src/services/deliveryIntegrationService.js`
- `backend/src/scripts/testDeliveryIntegrationFoundation.js`
- `backend/package.json`
- `docs/stage10-delivery-integration.md`

## Apply locally

From `backend`:

```powershell
npm run prisma:migrate
npm run prisma:generate
npm run test:delivery-integration
```

When Prisma asks for a migration name during `prisma migrate dev`, the SQL migration is already included in the project. If the migration is detected as pending, apply it normally; do not create a duplicate migration with the same change.

Then run the existing regression suite:

```powershell
npm test
npm run test:store-manager-orders
npm run test:store-manager-catalog
npm run test:store-manager-catalog-advanced
```

## What Stage 10.1 intentionally does not do

- It does not add a Store Manager Deliveries UI yet.
- It does not expose a Dispatcher confirm/defer API yet.
- It does not change Driver UI or Driver mock execution logic.
- It does not make Loader mock state a dependency.
- It does not add Store Manager Socket.IO rooms yet.

Those are subsequent Stage 10 parts built on this bridge.
