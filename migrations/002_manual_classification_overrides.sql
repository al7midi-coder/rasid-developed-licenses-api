CREATE TABLE IF NOT EXISTS developed_licenses.manual_classification_overrides (
  license_number text PRIMARY KEY,
  dependency text NOT NULL CHECK (dependency IN ('تابع','غير تابع')),
  department text,
  actor text NOT NULL DEFAULT 'rasid',
  source text NOT NULL DEFAULT 'developed-upload-map',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION developed_licenses.apply_manual_classification_override()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE override_row developed_licenses.manual_classification_overrides%ROWTYPE;
BEGIN
  SELECT * INTO override_row FROM developed_licenses.manual_classification_overrides WHERE license_number = NEW.license_number;
  IF FOUND THEN
    NEW.dependency := override_row.dependency;
    NEW.department := override_row.department;
    NEW.manual_classification := override_row.actor;
    NEW.manual_department := override_row.department;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_apply_manual_classification_override ON developed_licenses.licenses;
CREATE TRIGGER trg_apply_manual_classification_override
BEFORE INSERT OR UPDATE OF dependency, department ON developed_licenses.licenses
FOR EACH ROW EXECUTE FUNCTION developed_licenses.apply_manual_classification_override();
