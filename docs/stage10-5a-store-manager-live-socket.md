# Stage 10.5A — Store Manager Live Socket Security Foundation

## Purpose

Connect Store Manager delivery tracking to the existing Dispatcher/Driver Socket.IO infrastructure without allowing a browser to choose another outlet's room.

## Trusted socket authorization

A Store Manager socket connection is authorized as:

`JWT -> current database user -> active account -> completed password change -> current STORE_MANAGER role -> current active outlet assignment -> outlet:<OUTLET_CODE>`

The room name is never accepted from socket auth payloads, query parameters, local storage, or route state.

## Event model

Existing Dispatcher updates continue on:

`monitoring:update` -> room `dispatchers`

Existing Driver room behavior remains:

`driver:<database-user-id>`

Store Managers receive only a small invalidation event:

`store-manager:delivery-update` -> room `outlet:<OUTLET_CODE>`

The event contains only:

- timestamp
- update reason
- trip code

It intentionally does not contain another outlet's stop identity, coordinates, route geometry, POD evidence, or downstream route details. The Store Manager frontend must refetch the existing outlet-isolated REST tracking endpoint for actual data.

## Which Store Manager rooms receive an update?

Only outlets that have a **PUBLISHED** `DeliveryAllocation` on the affected `LiveTrip` are targeted. This keeps real-time refresh signals aligned with the shared StoreOrder -> DeliveryAllocation -> LiveTripStop -> LiveTrip model.

## Test

From `backend`:

```bash
npm run test:store-manager-live-socket
```

The test checks:

- current DB outlet controls the Store Manager room
- forged outlet/room values are ignored
- invalid tokens are rejected
- Store Managers without an active outlet cannot join live monitoring
- Dispatcher and Driver room behavior remains unchanged
- Store Manager socket payloads do not expose stop/route/POD details
- published allocations resolve server-side outlet room targets when test data exists

No Prisma migration is required for Stage 10.5A.
