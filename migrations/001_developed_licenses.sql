CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE developed_license_source (
  id bigserial PRIMARY KEY,
  license_number text NOT NULL,
  source_name text NOT NULL DEFAULT 'manual',
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  collected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (license_number, source_name)
);
CREATE TABLE developed_licenses (
  id bigserial PRIMARY KEY,
  license_number text NOT NULL UNIQUE,
  source_id bigint REFERENCES developed_license_source(id),
  dependency text NOT NULL DEFAULT 'غير تابع' CHECK (dependency IN ('تابع','غير تابع')),
  department text,
  internal_status text NOT NULL DEFAULT 'تحت الإجراء',
  closure_request_status text NOT NULL DEFAULT 'غير مقدم',
  contractor text,
  owner_entity text,
  consultant text,
  road_name text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  processing_deadline timestamptz,
  closure_date timestamptz,
  manual_classification boolean NOT NULL DEFAULT false,
  return_count integer NOT NULL DEFAULT 0,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE developed_license_status_history (
  id bigserial PRIMARY KEY, license_id bigint NOT NULL REFERENCES developed_licenses(id),
  internal_status text, closure_request_status text, reason text, changed_by text, changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE developed_license_closure_events (
  id bigserial PRIMARY KEY, license_id bigint NOT NULL REFERENCES developed_licenses(id), decision text NOT NULL, reason text, decided_by text, decided_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE developed_license_sync_runs (id bigserial PRIMARY KEY, direction text NOT NULL, status text NOT NULL DEFAULT 'pending', started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, detail jsonb NOT NULL DEFAULT '{}'::jsonb);
CREATE TABLE developed_license_sync_map (id bigserial PRIMARY KEY, developed_license_id bigint NOT NULL REFERENCES developed_licenses(id), current_license_id bigint, license_number text NOT NULL UNIQUE, synced_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE developed_license_import_batches (id bigserial PRIMARY KEY, source text NOT NULL, status text NOT NULL DEFAULT 'pending', total_rows integer NOT NULL DEFAULT 0, accepted_rows integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE developed_license_analysis_results (id bigserial PRIMARY KEY, source_id bigint NOT NULL REFERENCES developed_license_source(id), is_dependent boolean NOT NULL, department text, rule_version text, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE developed_license_collector_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), status text NOT NULL DEFAULT 'waiting_for_login', source text NOT NULL DEFAULT 'chrome-extension', expected_rows integer, received_rows integer NOT NULL DEFAULT 0, last_heartbeat_at timestamptz, error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX developed_licenses_dependency_idx ON developed_licenses(dependency);
CREATE INDEX developed_licenses_department_idx ON developed_licenses(department);
CREATE INDEX developed_licenses_internal_status_idx ON developed_licenses(internal_status);
CREATE INDEX developed_licenses_closure_status_idx ON developed_licenses(closure_request_status);
CREATE INDEX developed_licenses_contractor_idx ON developed_licenses(contractor);
CREATE INDEX developed_licenses_owner_idx ON developed_licenses(owner_entity);
CREATE INDEX developed_licenses_deadline_idx ON developed_licenses(processing_deadline);
CREATE INDEX developed_licenses_coordinates_idx ON developed_licenses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
