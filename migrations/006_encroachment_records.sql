CREATE TABLE IF NOT EXISTS developed_licenses.encroachment_records (
  kind text NOT NULL,
  report_number text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, report_number)
);
CREATE INDEX IF NOT EXISTS encroachment_records_kind_updated_idx ON developed_licenses.encroachment_records(kind, updated_at DESC);
