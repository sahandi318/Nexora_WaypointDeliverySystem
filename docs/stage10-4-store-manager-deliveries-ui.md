# Stage 10.4 — Store Manager Deliveries UI

## Purpose

Connect the Store Manager frontend to the outlet-isolated delivery APIs completed in Stage 10.3 without introducing a second delivery data model.

## Routes

- `/store-manager/deliveries`
- `/store-manager/deliveries/:orderCode`

Both routes remain protected by the existing `STORE_MANAGER` role guard and backend trusted-outlet middleware.

## Deliveries workspace

The list page uses `GET /api/store-manager/deliveries` and provides:

- Upcoming, in-transit, completed and attention summaries
- Search by order, trip or vehicle
- Delivery-stage, order-type and delivery-date filters
- Desktop operational table and responsive mobile cards
- Real backend delivery status projection
- Published trip/vehicle/ETA data when available
- Clear loading, empty and error states

No outlet identifier is sent from the browser.

## Delivery details

The details page uses `GET /api/store-manager/deliveries/:orderCode` and shows:

- Delivery status and progress
- Delivery date and planned ETA
- Outlet receiving window and mall window when applicable
- Trip, vehicle, driver and depot assignment when published
- Linked order type, requested/effective dates and cutoff decision
- Product lines, quantities and logistics weight
- Store Manager order note
- Deferred/partial/exception attention state when relevant

The page deliberately does not add a live map. Outlet-safe live tracking and Socket.IO updates remain Stage 10.5 work.

## Localization

All fixed delivery UI text is provided in the existing static translation system for:

- English (`en`)
- Sinhala (`si`)
- Tamil (`ta`)

## Security boundaries preserved

- Frontend never sends or selects the Store Manager outlet.
- Delivery lookup remains keyed by order code but backend outlet isolation is authoritative.
- No other outlet route or stop data is displayed.
- No fake trip, vehicle, driver or ETA values are generated when the backend has not assigned them.

## Verification

After applying the patch:

```powershell
cd frontend
npm run build
```

Then run the backend delivery regression suite:

```powershell
cd ..\backend
npm run test:store-manager-deliveries
npm run test:dispatcher-order-handoff
npm run test:delivery-integration
npm test
npm run test:store-manager-orders
npm run test:store-manager-catalog
npm run test:store-manager-catalog-advanced
```
