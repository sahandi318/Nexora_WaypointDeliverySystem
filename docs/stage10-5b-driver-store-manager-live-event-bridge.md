# Stage 10.5B — Driver → Store Manager Live Event Bridge

## Goal

Connect the existing Driver execution workflow to the Store Manager's secure outlet room without exposing other outlets, route geometry, coordinates, POD payloads, or downstream stop details through Socket.IO.

## Behaviour

Driver updates already persisted by `liveMonitoringService` now trigger Store Manager refresh events with tighter outlet targeting:

- route / ETA progress → affected published outlet only
- stop arrival → affected published outlet only
- delivery outcome → affected published outlet only
- POD submission → affected published outlet only
- exception → affected published outlet only
- stop completion → all published outlets on the trip may refresh because stops-remaining progress changes
- driver online/offline / trip-wide sync → all published outlets on the trip may refresh

The socket payload remains an invalidation signal only. Store Manager clients must refetch the authenticated REST tracking endpoint for current details.

## ETA correction

The Driver route-progress endpoint stores the live ETA on `LiveTrip.eta`. The Store Manager tracking API now uses that live ETA only when the Store Manager outlet is the driver's current `nextDestination`. Later outlets continue to see their published/planned ETA, preventing another stop's live ETA from being misrepresented.

No Prisma migration is required.
