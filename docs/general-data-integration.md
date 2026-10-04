# Waypoint Organizer General Data Integration

## Purpose

The application now uses the complete organizer-provided **General Data** bundle as one operational planning source instead of treating the CSV files as disconnected demo references.

The integration intentionally keeps the existing working Store Manager → Dispatcher → Loader → Driver → Store Manager workflow and adds operational calculations without widening RBAC scope.

## Source files used

| File | Rows | Runtime use |
| --- | ---: | --- |
| `outlets.csv` | 120 | Outlet/depot assignment, delivery windows, dock type, parking and mall constraints. Existing outlet import remains the database source for user/outlet RBAC. |
| `vehicles.csv` | 60 | Dispatcher fleet, capacity, temperature compatibility, fuel type, km/L and weekly fuel quota. |
| `calendar.csv` | 910 | Operating-day context and monsoon selection. |
| `district_travel.csv` | 12 | Base depot-to-district / inter-stop distance and free-flow travel time. |
| `road_conditions.csv` | 10,920 | District/date disruption adjustment. |
| `traffic_speed.csv` | 576 | District/hour/monsoon speed adjustment. |
| `service_allowance.csv` | 9 | Brand + dock unloading/service allowance. |

## Planning formula

For each proposed stop the Dispatcher planning service derives a trusted server-side estimate:

```text
adjusted travel minutes
  = free-flow minutes
  × (100 / traffic speed index)
  × (100 / road disruption index)
```

Indices are clamped to the organizer data ranges so malformed values cannot create extreme calculations.

The stop service allowance is then added after arrival. Delivery windows are respected by waiting until window open when the estimated arrival is early, and the planner emits a warning when the estimated arrival is after window close.

Vehicle fuel use is estimated from organizer `km_per_l` and compared with `weekly_fuel_quota_l`.

## Dates after the organizer calendar range

The supplied calendar ends on `2026-06-28`. The application may run after that date. It therefore uses an explicit fallback instead of failing:

1. exact requested date when available;
2. nearest seasonal row with the same weekday for calendar operating/monsoon context;
3. same month/day fallback for district road conditions;
4. latest available row only if no seasonal reference exists.

The response records the fallback source and source date so the UI/API never presents fallback context as fresh observed data.

## Cross-role flow

```text
Organizer General Data
        ↓
Dispatcher planning
  - capacity
  - travel time
  - traffic
  - road disruption
  - service time
  - fuel
        ↓
Dispatcher publish (server recalculates trusted estimate)
        ↓
LiveTripStop.planningContext
        ↓
Loader: service allowance at each stop
Driver: planned travel/road/traffic context + navigation fallback
Store Manager: own-stop ETA and safe own-stop planning context
```

No other outlet route details are added to Store Manager socket payloads.

## Database change

Migration `20261004221800_add_stop_planning_context` adds nullable JSON `live_trip_stops.planning_context` so the organizer-derived context used at publication remains attached to the published stop.

## Verification

Run:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npm run test:organizer-data
npm run test:dispatcher-planning
npm run test:dispatcher-publish-bridge
npm run test:store-manager-deliveries

cd ../frontend
npm run build
```

`test:organizer-data` verifies all seven files, exact-date calculations, post-range seasonal fallback, stop service allowances, travel adjustments, and vehicle fuel calculation.
