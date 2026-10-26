-- 003: المحاضر التنسيقية (coordination minutes) — requests, minutes, templates, people, referrals, audit.
-- Files are stored as bytea (the existing API has no external file storage); size is capped by CHECK (20 MB).
CREATE SCHEMA IF NOT EXISTS developed_licenses;

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coordination roles per Rasid user (Rasid Admin is implicitly coordination_admin).
CREATE TABLE IF NOT EXISTS developed_licenses.coordination_user_roles (
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('coordination_admin','unblocking_coordinator','internal_reviewer','template_admin','read_only')),
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, role)
);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,                       -- المحاور الرئيسية | محاور النقل العام | الجسور والأنفاق
  scope_part integer CHECK (scope_part IS NULL OR scope_part BETWEEN 1 AND 20),
  signer_title text NOT NULL,                     -- job title shown on the minutes
  name text NOT NULL,
  company text,
  party_kind text NOT NULL DEFAULT 'AMANA' CHECK (party_kind IN ('AMANA','CONTRACTOR','CONSULTANT','OWNER')),
  user_email text,                                -- links the person to a Rasid account (referral inbox)
  email text,
  phone text,
  party_key text,                                 -- electricity|floods|roads|manager|services|contractor|consultant (maps to template party slots)
  is_signer boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE developed_licenses.coordination_people ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE developed_licenses.coordination_people ADD COLUMN IF NOT EXISTS phone text;
CREATE INDEX IF NOT EXISTS coordination_people_dept_idx ON developed_licenses.coordination_people (department, active, sort_order);
CREATE INDEX IF NOT EXISTS coordination_people_email_idx ON developed_licenses.coordination_people (lower(user_email));

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner_key text,
  owner_label text,
  dig_types text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'single' CHECK (mode IN ('single','merged','both')),
  logos jsonb NOT NULL DEFAULT '{}'::jsonb,
  intro_single text,
  intro_merged text,
  status text NOT NULL DEFAULT 'مرفوع',
  version integer NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,       -- full template object (extra engine fields)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_template_clauses (
  id text PRIMARY KEY,
  template_id text NOT NULL REFERENCES developed_licenses.coordination_templates(id) ON DELETE CASCADE,
  number integer,
  text text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  ord integer NOT NULL DEFAULT 0,
  applicable_dig_types text[] NOT NULL DEFAULT '{*}',
  is_mandatory boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,          -- key, bold, layer ... (engine fields)
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_template_clauses_tpl_idx ON developed_licenses.coordination_template_clauses (template_id, ord);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_template_parties (
  id text PRIMARY KEY,
  template_id text NOT NULL REFERENCES developed_licenses.coordination_templates(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'owner',
  role_title text,
  label text,
  ord integer NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS coordination_template_parties_tpl_idx ON developed_licenses.coordination_template_parties (template_id, ord);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text NOT NULL UNIQUE,                 -- centerRequestId|licenseNumber (idempotent sync)
  center_request_id text,
  license_number text NOT NULL,
  status text NOT NULL DEFAULT 'RECEIVED' CHECK (status IN
    ('RECEIVED','MISSING_DOCUMENTS','DOCUMENTS_COMPLETE','REFERRED','UNDER_REVIEW','RETURNED','APPROVED','REJECTED','WAITING_MINUTES_SIGNATURE','WAITING_ORIGINAL_MINUTES','COMPLETED')),
  center_status text,                              -- read only mirror of the Center status; never changed here
  department text,
  classification jsonb NOT NULL DEFAULT '{}'::jsonb,
  contractor text,
  consultant text,
  owner text,
  road text,
  project text,
  dig_type text,
  length_m numeric,
  works_description text,
  form jsonb NOT NULL DEFAULT '{}'::jsonb,         -- applicant/coordinator form fields
  row_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  final_decision text CHECK (final_decision IS NULL OR final_decision IN ('accept','return')),
  final_reason text,
  final_by text,
  final_at timestamptz,
  minutes_id uuid,
  rejection_reason text,
  rejection jsonb,                                 -- {reason, allowedStatements[], requiredFixes[]} shown to the applicant
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_requests_license_idx ON developed_licenses.coordination_requests (license_number);
CREATE INDEX IF NOT EXISTS coordination_requests_center_idx ON developed_licenses.coordination_requests (center_request_id);
CREATE INDEX IF NOT EXISTS coordination_requests_status_idx ON developed_licenses.coordination_requests (status);
CREATE INDEX IF NOT EXISTS coordination_requests_dept_idx ON developed_licenses.coordination_requests (department);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_request_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES developed_licenses.coordination_requests(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  dig_type text,
  road text,
  length_m numeric,
  project text,
  contractor text,
  owner text,
  UNIQUE (request_id, license_number)
);
CREATE INDEX IF NOT EXISTS coordination_request_licenses_lic_idx ON developed_licenses.coordination_request_licenses (license_number);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES developed_licenses.coordination_requests(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'OTHER',          -- EXEC_DRAWINGS | WORKPATH_KMZ | SITE_PHOTO_REPORT | OTHER ...
  visibility text NOT NULL DEFAULT 'INTERNAL_ONLY' CHECK (visibility IN ('PUBLIC_TO_APPLICANT','INTERNAL_ONLY','MINUTES_FILE','SIGNED_MINUTES','FINAL_MINUTES')),
  filename text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes integer NOT NULL CHECK (size_bytes >= 0 AND size_bytes <= 20971520),
  data bytea NOT NULL,
  source text NOT NULL DEFAULT 'internal' CHECK (source IN ('internal','public')),
  uploaded_by text,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_request_attachments_req_idx ON developed_licenses.coordination_request_attachments (request_id, doc_type) WHERE NOT deleted;

CREATE SEQUENCE IF NOT EXISTS developed_licenses.coordination_minutes_seq;
CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_counter (
  year integer PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);
CREATE OR REPLACE FUNCTION developed_licenses.next_coordination_minutes_number() RETURNS text AS $$
DECLARE y integer := extract(year FROM now())::int; n integer;
BEGIN
  INSERT INTO developed_licenses.coordination_minutes_counter AS c (year, last_value) VALUES (y, 1)
  ON CONFLICT (year) DO UPDATE SET last_value = c.last_value + 1
  RETURNING c.last_value INTO n;
  RETURN 'CM-' || y || '-' || lpad(n::text, 6, '0');
END $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq bigint NOT NULL DEFAULT nextval('developed_licenses.coordination_minutes_seq'),
  number text NOT NULL UNIQUE DEFAULT developed_licenses.next_coordination_minutes_number(),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN
    ('DRAFT','UNDER_INTERNAL_REVIEW','RETURNED_INTERNAL','APPROVED_INTERNAL','WAITING_EXTERNAL_SIGNATURES','SIGNED_EXTERNAL_UPLOADED','WAITING_ORIGINAL_DELIVERY','ORIGINAL_RECEIVED','COMPLETED','CANCELLED')),
  template_id text,
  template_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,   -- template frozen at creation; later edits do not affect it
  template_reason text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,             -- engine minutes object (clauses/parties are overlaid from child tables)
  department text,
  contractor text,
  owner text,
  merged boolean NOT NULL DEFAULT false,
  minutes_date date NOT NULL DEFAULT current_date,
  version integer NOT NULL DEFAULT 1,
  cancel_reason text,
  original_received_at timestamptz,
  original_received_by text,
  completed_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_minutes_status_idx ON developed_licenses.coordination_minutes (status);

ALTER TABLE developed_licenses.coordination_requests
  DROP CONSTRAINT IF EXISTS coordination_requests_minutes_fk;
ALTER TABLE developed_licenses.coordination_requests
  ADD CONSTRAINT coordination_requests_minutes_fk FOREIGN KEY (minutes_id) REFERENCES developed_licenses.coordination_minutes(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  license_number text NOT NULL,
  dig_type text,
  road text,
  length_m numeric,
  project text,
  contractor text,
  owner text,
  request_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (minutes_id, license_number)
);
CREATE INDEX IF NOT EXISTS coordination_minutes_licenses_lic_idx ON developed_licenses.coordination_minutes_licenses (license_number);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_requests (
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES developed_licenses.coordination_requests(id) ON DELETE CASCADE,
  PRIMARY KEY (minutes_id, request_id)
);
CREATE INDEX IF NOT EXISTS coordination_minutes_requests_req_idx ON developed_licenses.coordination_minutes_requests (request_id);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_clauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  number integer,
  text text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  ord integer NOT NULL DEFAULT 0,
  is_mandatory boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'template' CHECK (source IN ('template','user','recipient')),
  approval_status text NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('APPROVED','PENDING')),
  added_by text,
  approved_by text,
  approved_at timestamptz,
  template_clause_id text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,           -- engine fields (key, bold, layer ...)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_minutes_clauses_min_idx ON developed_licenses.coordination_minutes_clauses (minutes_id, ord);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('owner','amana')),
  role_title text,
  name text,
  company text,
  person_id uuid REFERENCES developed_licenses.coordination_people(id) ON DELETE SET NULL,
  ord integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS coordination_minutes_parties_min_idx ON developed_licenses.coordination_minutes_parties (minutes_id, section, ord);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  version integer NOT NULL,
  action text NOT NULL,
  reason text,
  changed_by text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  summary text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (minutes_id, version)
);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_minutes_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id uuid NOT NULL REFERENCES developed_licenses.coordination_minutes(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('PDF','SIGNED','FINAL')),
  visibility text NOT NULL DEFAULT 'MINUTES_FILE' CHECK (visibility IN ('PUBLIC_TO_APPLICANT','INTERNAL_ONLY','MINUTES_FILE','SIGNED_MINUTES','FINAL_MINUTES')),
  filename text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  size_bytes integer NOT NULL CHECK (size_bytes >= 0 AND size_bytes <= 20971520),
  data bytea NOT NULL,
  source text NOT NULL DEFAULT 'internal' CHECK (source IN ('internal','public')),
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_minutes_files_min_idx ON developed_licenses.coordination_minutes_files (minutes_id, kind, created_at DESC);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_ids uuid[] NOT NULL,
  minutes_id uuid REFERENCES developed_licenses.coordination_minutes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','DECIDED','CLOSED')),
  recommendation text CHECK (recommendation IS NULL OR recommendation IN ('UNBLOCK','RETURN_REQUEST')),
  note text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX IF NOT EXISTS coordination_referrals_status_idx ON developed_licenses.coordination_referrals (status);
CREATE INDEX IF NOT EXISTS coordination_referrals_req_idx ON developed_licenses.coordination_referrals USING gin (request_ids);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_referral_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES developed_licenses.coordination_referrals(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES developed_licenses.coordination_people(id),
  ord integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  decided_at timestamptz,
  UNIQUE (referral_id, person_id)
);
CREATE INDEX IF NOT EXISTS coordination_referral_recipients_person_idx ON developed_licenses.coordination_referral_recipients (person_id, status);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES developed_licenses.coordination_referrals(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES developed_licenses.coordination_referral_recipients(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved','rejected')),
  reason text,
  attachment_id uuid REFERENCES developed_licenses.coordination_request_attachments(id) ON DELETE SET NULL,
  decided_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipient_id)
);

CREATE TABLE IF NOT EXISTS developed_licenses.coordination_audit_log (
  id bigserial PRIMARY KEY,
  entity text NOT NULL,                            -- request | minutes | template | person | referral | public
  entity_id text NOT NULL,
  action text NOT NULL CHECK (action IN
    ('created','updated','referred','viewed','accepted','rejected','clause_added','minutes_updated','pdf_generated','signed_pdf_uploaded','original_received','completed','cancelled',
     'synced','uploaded','deleted','returned','clause_approved','clause_removed','final_decision','lookup','form_submitted')),
  actor_email text,
  actor_name text,
  actor_role text,
  before jsonb,
  after jsonb,
  detail jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordination_audit_entity_idx ON developed_licenses.coordination_audit_log (entity, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS developed_licenses.public_request_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES developed_licenses.coordination_requests(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('FORM','UPLOAD','SIGNED_MINUTES')),
  doc_type text,
  attachment_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_request_submissions_req_idx ON developed_licenses.public_request_submissions (request_id, created_at DESC);

-- Licence duration (مدة الرخصة, days): feeds the «مدة زمنية قدرها ({duration}) يوماً» clause. Idempotent.
ALTER TABLE developed_licenses.coordination_request_licenses ADD COLUMN IF NOT EXISTS duration_days integer;
ALTER TABLE developed_licenses.coordination_minutes_licenses ADD COLUMN IF NOT EXISTS duration_days integer;

-- A request can be linked to SEVERAL departments (line shared with another department / near two scopes). Many-to-many; the primary one mirrors coordination_requests.department.
-- source 'auto' = from the scope classification, 'manual' = added/changed by the coordinator. Idempotent.
CREATE TABLE IF NOT EXISTS developed_licenses.coordination_request_departments (
  request_id uuid NOT NULL REFERENCES developed_licenses.coordination_requests(id) ON DELETE CASCADE,
  department text NOT NULL,
  scope text,
  source text NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','manual')),
  distance numeric,
  "primary" boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, department)
);
CREATE INDEX IF NOT EXISTS coordination_request_departments_dept_idx ON developed_licenses.coordination_request_departments (department, request_id);
-- once the coordinator edits the linked departments, the automatic classification of later syncs no longer replaces them
ALTER TABLE developed_licenses.coordination_requests ADD COLUMN IF NOT EXISTS departments_locked boolean NOT NULL DEFAULT false;
-- backfill: existing single-department requests become one primary link
INSERT INTO developed_licenses.coordination_request_departments (request_id, department, source, "primary")
  SELECT r.id, r.department, 'auto', true FROM developed_licenses.coordination_requests r
  WHERE r.department IS NOT NULL AND r.department <> '' AND r.department <> 'غير تابع'
    AND NOT EXISTS (SELECT 1 FROM developed_licenses.coordination_request_departments d WHERE d.request_id = r.id)
  ON CONFLICT DO NOTHING;
