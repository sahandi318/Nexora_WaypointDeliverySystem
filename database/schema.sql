-- Nexora / Waypoint Group — Driver normal scenario database schema
-- Designed for MySQL 8+

CREATE DATABASE IF NOT EXISTS nexora_waypoint;
CREATE DATABASE IF NOT EXISTS nexora_waypoint_shadow;
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE nexora_waypoint;

CREATE TABLE users (
  user_id VARCHAR(32) PRIMARY KEY,
  email VARCHAR(120) NOT NULL UNIQUE,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
  vehicle_id VARCHAR(20) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  temp VARCHAR(20) NOT NULL,
  depot VARCHAR(40) NOT NULL,
  weight_cap_kg DECIMAL(10,2) NULL,
  volume_cap_m3 DECIMAL(10,2) NULL
);

CREATE TABLE driver_assignments (
  driver_user_id VARCHAR(32) NOT NULL,
  vehicle_id VARCHAR(20) NOT NULL,
  assignment_date DATE NOT NULL,
  PRIMARY KEY (driver_user_id, assignment_date),
  CONSTRAINT fk_assignment_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id),
  CONSTRAINT fk_assignment_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id)
);

CREATE TABLE outlets (
  outlet_id VARCHAR(20) PRIMARY KEY,
  outlet_name VARCHAR(120) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  district VARCHAR(60) NOT NULL,
  depot VARCHAR(40) NOT NULL,
  dock_type VARCHAR(40) NOT NULL,
  parking_constraint VARCHAR(40) NOT NULL,
  mall_window VARCHAR(40) NULL,
  window_open_time TIME NOT NULL,
  window_close_time TIME NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  coordinate_source VARCHAR(80) NULL
);



CREATE TABLE district_travel_reference (
  district VARCHAR(60) NOT NULL,
  depot VARCHAR(40) NOT NULL,
  road_class VARCHAR(30) NOT NULL,
  free_flow_kmh DECIMAL(8,2) NOT NULL,
  depot_to_district_km DECIMAL(8,2) NOT NULL,
  depot_to_district_freeflow_min INT NOT NULL,
  inter_stop_km DECIMAL(8,2) NOT NULL,
  inter_stop_freeflow_min INT NOT NULL,
  PRIMARY KEY (district, depot)
);

CREATE TABLE orders (
  order_id VARCHAR(32) PRIMARY KEY,
  outlet_id VARCHAR(20) NOT NULL,
  temp_requirement VARCHAR(20) NOT NULL,
  expected_units INT NOT NULL,
  order_weight_kg DECIMAL(10,2) NULL,
  order_volume_m3 DECIMAL(10,3) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
  CONSTRAINT fk_order_outlet FOREIGN KEY (outlet_id) REFERENCES outlets(outlet_id)
);

CREATE TABLE trips (
  trip_id VARCHAR(32) PRIMARY KEY,
  trip_number INT NOT NULL,
  vehicle_id VARCHAR(20) NOT NULL,
  driver_user_id VARCHAR(32) NOT NULL,
  brand VARCHAR(30) NOT NULL,
  district VARCHAR(60) NOT NULL,
  trip_date DATE NOT NULL,
  planned_start_time TIME NULL,
  planned_end_time TIME NULL,
  dispatcher_plan_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  loader_status VARCHAR(30) NOT NULL DEFAULT 'NOT_READY',
  driver_execution_status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
  completed_at DATETIME NULL,
  CONSTRAINT fk_trip_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  CONSTRAINT fk_trip_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id)
);

CREATE TABLE trip_stops (
  stop_id VARCHAR(32) PRIMARY KEY,
  trip_id VARCHAR(32) NOT NULL,
  order_id VARCHAR(32) NOT NULL,
  stop_position INT NOT NULL,
  planned_arrival_time TIME NULL,
  loaded_units INT NOT NULL,
  stop_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  arrival_time TIME NULL,
  completed_at DATETIME NULL,
  UNIQUE KEY uq_trip_position (trip_id, stop_position),
  CONSTRAINT fk_stop_trip FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  CONSTRAINT fk_stop_order FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

CREATE TABLE delivery_records (
  delivery_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stop_id VARCHAR(32) NOT NULL UNIQUE,
  outcome VARCHAR(30) NOT NULL,
  delivered_quantity INT NOT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_delivery_stop FOREIGN KEY (stop_id) REFERENCES trip_stops(stop_id)
);

CREATE TABLE delivery_exceptions (
  exception_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stop_id VARCHAR(32) NOT NULL UNIQUE,
  reason VARCHAR(80) NOT NULL,
  notes TEXT NULL,
  photo_path VARCHAR(255) NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exception_stop FOREIGN KEY (stop_id) REFERENCES trip_stops(stop_id)
);

CREATE TABLE proof_of_delivery (
  pod_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  stop_id VARCHAR(32) NOT NULL UNIQUE,
  receiver_name VARCHAR(120) NOT NULL,
  photo_path VARCHAR(255) NULL,
  delivery_note TEXT NULL,
  recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pod_stop FOREIGN KEY (stop_id) REFERENCES trip_stops(stop_id)
);

-- Offline/recovery audit records. The browser queue itself is held in IndexedDB/Dexie;
-- these tables are available when the final MySQL-backed API persists sync metadata.
CREATE TABLE driver_sync_events (
  sync_event_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_user_id VARCHAR(32) NOT NULL,
  stop_id VARCHAR(32) NULL,
  client_action_id VARCHAR(80) NOT NULL UNIQUE,
  action_type VARCHAR(40) NOT NULL,
  sync_status VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
  created_offline_at DATETIME NULL,
  synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sync_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id),
  CONSTRAINT fk_sync_stop FOREIGN KEY (stop_id) REFERENCES trip_stops(stop_id)
);

CREATE TABLE driver_sync_sessions (
  sync_session_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_user_id VARCHAR(32) NOT NULL,
  synced_record_count INT NOT NULL DEFAULT 0,
  connection_restored_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sync_session_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id)
);
