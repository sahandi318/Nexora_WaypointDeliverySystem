# Dispatcher Planning Real-Data Integration

This checkpoint connects the existing Dispatcher planning screens to persisted Store Manager orders and the shared `DeliveryAllocation -> LiveTripStop -> LiveTrip` transport model.

## Real workflow

1. Store Manager creates a `SUBMITTED` order.
2. Dispatcher sees the order in `/dispatcher/planning` and confirms it through the existing secured handoff endpoint.
3. The order moves into the Delivery Planner as a confirmed, unallocated order.
4. Dispatcher chooses an active depot Driver and a vehicle code observed in persisted `LiveTrip` records (or enters a known code when no observed vehicle exists).
5. The backend creates a persisted draft `LiveTrip` and exact outlet `LiveTripStop`, then creates the `DeliveryAllocation` using the shared integration service.
6. Review & Publish publishes all active allocations on the trip.
7. The Store Manager Deliveries API now projects the published order as a scheduled delivery, and Stage 10.5C/10.5D can refresh/show the tracking workspace.

## Security and integrity

- Dispatcher depot scope is resolved from the authenticated current database user.
- Browser depot values cannot expand a Dispatcher's scope.
- The selected Driver must be active and assigned to the same depot.
- Order/outlet identity is resolved from the persisted `StoreOrder`; the browser cannot supply a different outlet.
- Shared allocation validation still enforces confirmed-order, outlet, depot, and one-active-allocation rules.
- No new Prisma model or migration is introduced.
- No outlet GPS coordinates are fabricated. If organizer/application data has no coordinates, the Store Manager map correctly remains unavailable until real position data exists.

## Vehicle data limitation

The current Prisma schema does not contain a vehicle master table. The Fleet Availability screen therefore shows vehicle codes already observed in persisted `LiveTrip` records instead of inventing fleet availability. Delivery Planner permits a known operational vehicle code when no observed vehicle exists.

## API additions

- `GET /api/dispatcher/planning/workspace`
- `POST /api/dispatcher/planning/orders/:orderCode/allocate`
- `POST /api/dispatcher/planning/trips/:tripCode/publish`

Existing confirm/defer endpoints remain unchanged.

## Verification

Run:

```bash
cd backend
npm run test:dispatcher-planning
npm run test:dispatcher-order-handoff
npm run test:delivery-integration
npm run test:store-manager-deliveries
npm run test:store-manager-live-socket
npm run test:store-manager-live-event-bridge
npm test
```

Then:

```bash
cd frontend
npm run build
```

Manual end-to-end smoke test:

`Store Manager order -> Dispatcher confirm -> Delivery Planner allocation -> Review & Publish -> Store Manager Deliveries -> Delivery details/live tracking`.
