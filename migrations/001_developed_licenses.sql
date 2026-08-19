CREATE TABLE IF NOT EXISTS developed_licenses.sources (
  id uuid PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  source_type text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.import_batches (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES developed_licenses.sources(id),
  status text NOT NULL,
  total_records integer NOT NULL DEFAULT 0,
  accepted_records integer NOT NULL DEFAULT 0,
  rejected_records integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.source_licenses (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES developed_licenses.sources(id),
  import_batch_id uuid REFERENCES developed_licenses.import_batches(id),
  license_number text NOT NULL,
  source_updated_at timestamptz,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.licenses (
  id uuid PRIMARY KEY,
  license_number text NOT NULL,
  source_id uuid NOT NULL REFERENCES developed_licenses.sources(id),
  department text,
  dependency text,
  status text NOT NULL,
  closure_request_status text,
  contractor text,
  consultant text,
  owner_entity text,
  project_name text,
  street_name text,
  route_name text,
  municipality text,
  district text,
  latitude numeric,
  longitude numeric,
  closure_order_number text,
  processing_deadline timestamptz,
  closure_date timestamptz,
  status_date timestamptz,
  rejection_reason text,
  manual_classification text,
  manual_department text,
  source_updated_at timestamptz,
  extra_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.status_history (
  id uuid PRIMARY KEY,
  license_id uuid REFERENCES developed_licenses.licenses(id),
  license_number text NOT NULL,
  status text NOT NULL,
  closure_request_status text,
  rejection_reason text,
  source text NOT NULL,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.closure_events (
  id uuid PRIMARY KEY,
  license_id uuid NOT NULL REFERENCES developed_licenses.licenses(id),
  license_number text NOT NULL,
  decision text NOT NULL,
  rejection_reason text,
  decided_by text,
  decided_at timestamptz NOT NULL,
  previous_status text,
  new_status text,
  previous_closure_request_status text,
  new_closure_request_status text,
  source_system text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.analysis_results (
  id uuid PRIMARY KEY,
  license_id uuid NOT NULL REFERENCES developed_licenses.licenses(id),
  license_number text NOT NULL,
  dependency text,
  department text,
  matched_route text,
  matched_street text,
  matched_bridge text,
  match_method text,
  distance_meters numeric,
  confidence_score numeric,
  analysis_settings_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  analyzed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.collector_jobs (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES developed_licenses.sources(id),
  status text NOT NULL CHECK (status IN ('waiting_for_login','discovering','collecting','collecting_details','updating_statuses','syncing','analyzing','completed','partial','failed','paused','cancelled')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  counters jsonb NOT NULL DEFAULT '{}'::jsonb,
  heartbeat_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS developed_licenses.sync_runs (
  id uuid PRIMARY KEY,
  source_id uuid REFERENCES developed_licenses.sources(id),
  import_batch_id uuid REFERENCES developed_licenses.import_batches(id),
  direction text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text
);

CREATE TABLE IF NOT EXISTS developed_licenses.sync_map (
  id uuid PRIMARY KEY,
  license_number text NOT NULL,
  old_license_id text,
  developed_license_id uuid REFERENCES developed_licenses.licenses(id),
  last_sync_at timestamptz,
  last_sync_source text,
  sync_status text NOT NULL,
  sync_error text,
  old_updated_at timestamptz,
  developed_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.sync_events (
  id uuid PRIMARY KEY,
  license_number text NOT NULL,
  source_system text NOT NULL,
  target_system text NOT NULL,
  field_name text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  event_type text NOT NULL,
  sync_status text NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS source_licenses_license_number_uidx ON developed_licenses.source_licenses (license_number);
CREATE UNIQUE INDEX IF NOT EXISTS licenses_license_number_uidx ON developed_licenses.licenses (license_number);
CREATE UNIQUE INDEX IF NOT EXISTS sync_map_license_number_uidx ON developed_licenses.sync_map (license_number);
CREATE INDEX IF NOT EXISTS source_licenses_source_id_idx ON developed_licenses.source_licenses (source_id);
CREATE INDEX IF NOT EXISTS source_licenses_source_updated_at_idx ON developed_licenses.source_licenses (source_updated_at DESC);
CREATE INDEX IF NOT EXISTS source_licenses_updated_at_idx ON developed_licenses.source_licenses (updated_at DESC);
CREATE INDEX IF NOT EXISTS licenses_department_idx ON developed_licenses.licenses (department);
CREATE INDEX IF NOT EXISTS licenses_status_idx ON developed_licenses.licenses (status);
CREATE INDEX IF NOT EXISTS licenses_closure_request_status_idx ON developed_licenses.licenses (closure_request_status);
CREATE INDEX IF NOT EXISTS licenses_processing_deadline_idx ON developed_licenses.licenses (processing_deadline);
CREATE INDEX IF NOT EXISTS licenses_updated_at_idx ON developed_licenses.licenses (updated_at DESC);
CREATE INDEX IF NOT EXISTS licenses_contractor_idx ON developed_licenses.licenses (contractor);
CREATE INDEX IF NOT EXISTS licenses_owner_entity_idx ON developed_licenses.licenses (owner_entity);
CREATE INDEX IF NOT EXISTS licenses_closure_queue_idx ON developed_licenses.licenses (department, closure_request_status, status, processing_deadline);
CREATE INDEX IF NOT EXISTS status_history_license_occurred_idx ON developed_licenses.status_history (license_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS status_history_number_occurred_idx ON developed_licenses.status_history (license_number, occurred_at DESC);
CREATE INDEX IF NOT EXISTS closure_events_license_decided_idx ON developed_licenses.closure_events (license_id, decided_at DESC);
CREATE INDEX IF NOT EXISTS closure_events_number_decided_idx ON developed_licenses.closure_events (license_number, decided_at DESC);
CREATE INDEX IF NOT EXISTS sync_map_status_idx ON developed_licenses.sync_map (sync_status);
CREATE INDEX IF NOT EXISTS sync_events_number_created_idx ON developed_licenses.sync_events (license_number, created_at DESC);
CREATE INDEX IF NOT EXISTS sync_events_status_idx ON developed_licenses.sync_events (sync_status);
CREATE INDEX IF NOT EXISTS collector_jobs_status_created_idx ON developed_licenses.collector_jobs (status, created_at DESC);
