# Stage 10.5D — Store Manager Live Tracking Workspace

## Goal

Turn the secure live-tracking data added in Stages 10.5A–10.5C into a useful Store Manager delivery workspace without exposing the rest of the trip.

## UI added

The Store Manager delivery detail page now contains a live tracking workspace with:

- live/planned ETA
- stops remaining before the Store Manager's own outlet
- assigned vehicle and vehicle type
- assigned driver and driver online/offline state
- receiving window
- current delivery/trip/stop state
- last driver update, synchronization time, and client refresh time
- OpenStreetMap map showing only:
  - the current delivery vehicle position, when available
  - the authenticated Store Manager's own outlet stop

## Privacy boundary

The frontend consumes only the existing privacy-filtered Store Manager tracking endpoint.

The map deliberately does **not** display:

- other outlet names or codes
- other outlet coordinates
- downstream route details
- full trip stop sequence
- POD content
- exception details belonging to another outlet

No outlet identifier or socket room is supplied by the browser.

## Tracking states

The workspace handles:

- loading
- awaiting trip allocation
- awaiting dispatcher publication
- live tracking available
- driver offline / latest synchronized data
- genuine tracking request failure

Semantic colors are used consistently:

- success/live: green
- information/pending: blue
- delayed/warning: amber (via the existing live connection badge/status system)
- error: red
- offline/neutral: gray

## Map implementation

The project already uses `react-leaflet` + Leaflet + OpenStreetMap for current Dispatcher/Driver maps. Stage 10.5D reuses that existing dependency rather than introducing a second map runtime during integration.

## Files changed

- `frontend/src/components/storeManager/deliveries/StoreManagerLiveTrackingPanel.jsx`
- `frontend/src/pages/storeManager/StoreManagerDeliveryDetailsPage.jsx`
- `frontend/src/i18n/staticTranslations.js`
- `docs/stage10-5d-store-manager-live-tracking-workspace.md`

## Verification

Run:

```powershell
cd frontend
npm run build
cd ..
```

Then run the existing backend regressions:

```powershell
cd backend
npm run test:store-manager-live-event-bridge
npm run test:store-manager-live-socket
npm run test:store-manager-deliveries
npm run test:dispatcher-order-handoff
npm run test:delivery-integration
npm test
cd ..
```

Manual checks:

1. Open a Store Manager delivery detail page.
2. Confirm pre-publication deliveries show an informational waiting state, not an error.
3. For a published delivery, confirm ETA, vehicle, driver, stops remaining, status, and map appear from real API data.
4. Confirm the map never shows another outlet.
5. Confirm Driver live updates refresh the tracking data without a page reload.
6. Check light and dark themes plus desktop/mobile widths.
