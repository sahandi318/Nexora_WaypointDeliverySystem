# Stage 10.5C — Store Manager live frontend integration

## Purpose

Connect the Store Manager deliveries UI to the secure Socket.IO outlet channel
introduced in Stage 10.5A and the Driver-to-Store-Manager invalidation bridge
introduced in Stage 10.5B.

## Data flow

1. A Store Manager page loads its normal outlet-isolated REST data.
2. The browser opens one authenticated Socket.IO connection using the current
   access token.
3. The browser never sends an outlet code or room name.
4. The server joins the socket to the trusted outlet room from the current DB
   assignment.
5. A `store-manager:delivery-update` event is treated only as an invalidation
   signal.
6. The frontend re-fetches the privacy-filtered REST delivery/tracking endpoint.

The socket payload is therefore never used as the source of delivery details.

## Reliability

- One shared Store Manager socket is used per mounted Store Manager workspace.
- Duplicate event listeners are removed when pages unmount.
- Reconnects trigger a REST refresh.
- Delivery details use a 30-second REST fallback poll.
- The deliveries list uses a 45-second REST fallback poll.
- Rapid socket events are debounced before re-fetching.
- The UI exposes Live / Connecting / Reconnecting / Delayed / Offline state.

## Tracking availability

The tracking endpoint can legitimately return:

- `STORE_MANAGER_DELIVERY_NOT_PLANNED`
- `STORE_MANAGER_DELIVERY_NOT_PUBLISHED`

These are treated as pending tracking states instead of frontend failures. The
fallback poll continues, so tracking can appear after Dispatcher publication.

## Security constraints preserved

- No client-supplied outlet ID.
- No client-supplied Socket.IO room.
- No cross-outlet route data.
- No POD payload over Store Manager socket events.
- No downstream stop identities from the tracking API.

Stage 10.5D can now render the Store Manager tracking workspace and map from the
`getStoreManagerDeliveryTracking` REST snapshot while retaining this real-time
refresh layer.
