# Stage 10.3 — Store Manager Deliveries Backend API

This stage exposes the shared StoreOrder -> DeliveryAllocation -> LiveTripStop -> LiveTrip workflow to the authenticated Store Manager without creating a second delivery table.

## Endpoints

All endpoints are protected by the existing Store Manager security pipeline and use the outlet resolved from the authenticated database user.

- `GET /api/store-manager/deliveries`
- `GET /api/store-manager/deliveries/:orderCode`
- `GET /api/store-manager/deliveries/:orderCode/tracking`

## Delivery projection

The API derives Store Manager-friendly delivery states from the existing order, allocation, trip and stop state. Confirmed orders can therefore appear as `AWAITING_PLAN` before a Dispatcher publishes a trip, while published trips progress through scheduled, in-transit, arriving and delivery outcome states.

## Outlet isolation

The browser never supplies a trusted outlet identifier. Every query is constrained by `req.storeManagerContext.outletDatabaseId`.

A delivery belonging to another outlet is returned as not found.

## Tracking privacy

The tracking endpoint intentionally returns only:

- own order and outlet context
- assigned trip code
- driver and vehicle information after plan publication
- current vehicle position
- own stop status and ETA
- number of unfinished stops before the Store Manager outlet

It does not return the identities, stop codes, coordinates or sequence details of other outlets on the route.

## Test

Run:

```powershell
npm run test:store-manager-deliveries
```

The test verifies outlet isolation, awaiting-plan/deferred projection, cross-outlet detail protection, publication requirements and safe tracking output.
