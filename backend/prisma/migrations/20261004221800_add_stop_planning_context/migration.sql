ALTER TABLE `live_trip_stops`
  ADD COLUMN `planning_context` JSON NULL AFTER `actualArrival`;
