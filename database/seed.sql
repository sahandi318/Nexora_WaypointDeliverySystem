-- Nexora / Waypoint Group — Driver normal scenario demo seed
USE nexora_waypoint;

-- Demo-only password hash placeholder. The current mock backend authenticates
-- driver@nexora.test / Nexora@123 without reading MySQL yet.
INSERT INTO users (user_id, email, username, password_hash, role, full_name)
VALUES ('USR-DRV-001', 'driver@nexora.test', 'driver', 'MOCK_ONLY_REPLACE_WITH_BCRYPT', 'DRIVER', 'Ruwan Fernando');

INSERT INTO vehicles (vehicle_id, type, temp, depot, weight_cap_kg, volume_cap_m3)
VALUES ('VEH015', 'truck', 'ambient', 'Peliyagoda', 5000.00, 24.00);

INSERT INTO driver_assignments (driver_user_id, vehicle_id, assignment_date)
VALUES ('USR-DRV-001', 'VEH015', '2026-09-28');

-- IMPORTANT: latitude/longitude below are DEMO-ONLY coordinates. They are not present in organiser outlets.csv.
INSERT INTO outlets (outlet_id, outlet_name, brand, district, depot, dock_type, parking_constraint, mall_window, window_open_time, window_close_time, latitude, longitude, coordinate_source) VALUES
('OUT015', 'Waypoint Style OUT015', 'Style', 'Colombo', 'Peliyagoda', 'rear_dock', 'normal', NULL, '09:00:00', '11:00:00', 6.9344000, 79.8428000, 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA'),
('OUT019', 'Waypoint Style OUT019', 'Style', 'Colombo', 'Peliyagoda', 'street', 'normal', NULL, '09:00:00', '17:00:00', 6.9258000, 79.8524000, 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA'),
('OUT018', 'Waypoint Style OUT018', 'Style', 'Colombo', 'Peliyagoda', 'mall_bay', 'mall_dock', '10:30-12:30', '10:30:00', '12:30:00', 6.9187000, 79.8554000, 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA'),
('OUT016', 'Waypoint Style OUT016', 'Style', 'Colombo', 'Peliyagoda', 'rear_dock', 'normal', NULL, '08:00:00', '11:00:00', 6.9069000, 79.8626000, 'DEMO_ONLY_NOT_IN_ORGANIZER_DATA');



-- Organiser-provided district_travel.csv values for Colombo / Peliyagoda.
INSERT INTO district_travel_reference (
  district, depot, road_class, free_flow_kmh,
  depot_to_district_km, depot_to_district_freeflow_min,
  inter_stop_km, inter_stop_freeflow_min
) VALUES ('Colombo', 'Peliyagoda', 'urban', 30.0, 12.0, 24, 4.0, 8);

INSERT INTO orders (order_id, outlet_id, temp_requirement, expected_units, order_weight_kg, order_volume_m3, status) VALUES
('ORD0009683', 'OUT015', 'ambient', 18, 220.00, 2.50, 'CONFIRMED'),
('ORD0009684', 'OUT019', 'ambient', 16, 200.00, 2.20, 'CONFIRMED'),
('ORD0009685', 'OUT018', 'ambient', 23, 280.00, 3.10, 'CONFIRMED'),
('ORD0009686', 'OUT016', 'ambient', 14, 175.00, 1.90, 'CONFIRMED');

INSERT INTO trips (
  trip_id, trip_number, vehicle_id, driver_user_id, brand, district, trip_date,
  planned_start_time, planned_end_time, dispatcher_plan_status, loader_status,
  driver_execution_status, completed_at
) VALUES
('TRIP000', 2, 'VEH015', 'USR-DRV-001', 'Style', 'Colombo', '2026-09-27', '08:10:00', '11:48:00', 'PUBLISHED', 'VEHICLE_READY', 'COMPLETED', '2026-09-27 11:48:00'),
('TRIP001', 1, 'VEH015', 'USR-DRV-001', 'Style', 'Colombo', '2026-09-28', '09:05:00', '12:09:00', 'PUBLISHED', 'VEHICLE_READY', 'IN_PROGRESS', NULL),
('TRIP002', 2, 'VEH015', 'USR-DRV-001', 'Style', 'Colombo', '2026-09-28', '13:00:00', '16:30:00', 'PUBLISHED', 'VEHICLE_READY', 'NOT_STARTED', NULL);

INSERT INTO trip_stops (stop_id, trip_id, order_id, stop_position, planned_arrival_time, loaded_units, stop_status, arrival_time, completed_at) VALUES
('STOP001', 'TRIP001', 'ORD0009683', 1, '09:45:00', 18, 'COMPLETED', '09:45:00', '2026-09-28 09:50:00'),
('STOP002', 'TRIP001', 'ORD0009684', 2, '10:20:00', 16, 'COMPLETED', '10:20:00', '2026-09-28 10:25:00'),
('STOP003', 'TRIP001', 'ORD0009685', 3, '11:00:00', 23, 'NEXT', NULL, NULL),
('STOP004', 'TRIP001', 'ORD0009686', 4, '11:40:00', 14, 'PENDING', NULL, NULL);

INSERT INTO delivery_records (stop_id, outcome, delivered_quantity, recorded_at) VALUES
('STOP001', 'DELIVERED_FULL', 18, '2026-09-28 09:49:00'),
('STOP002', 'DELIVERED_FULL', 16, '2026-09-28 10:24:00');

INSERT INTO proof_of_delivery (stop_id, receiver_name, photo_path, delivery_note, recorded_at) VALUES
('STOP001', 'Amal Silva', 'pod-stop1.jpg', 'Received in good condition.', '2026-09-28 09:50:00'),
('STOP002', 'Kamal Perera', 'pod-stop2.jpg', 'Received in good condition.', '2026-09-28 10:25:00');
