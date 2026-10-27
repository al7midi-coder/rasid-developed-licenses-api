ALTER TABLE developed_licenses.coordination_referrals ADD COLUMN IF NOT EXISTS withdrawn_by text;
ALTER TABLE developed_licenses.coordination_referrals ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE developed_licenses.coordination_referrals ADD COLUMN IF NOT EXISTS withdraw_reason text;
