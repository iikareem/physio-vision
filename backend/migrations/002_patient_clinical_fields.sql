-- Optional contact + clinical fields on patients.
-- Also relax condition / transferred referred_by requirements.

ALTER TABLE patients
    ALTER COLUMN condition SET DEFAULT '',
    DROP CONSTRAINT IF EXISTS patients_referred_by_when_transferred;

ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS email            TEXT,
    ADD COLUMN IF NOT EXISTS date_of_birth    DATE,
    ADD COLUMN IF NOT EXISTS occupation       TEXT,
    ADD COLUMN IF NOT EXISTS diagnosis        TEXT,
    ADD COLUMN IF NOT EXISTS chief_complaint  TEXT,
    ADD COLUMN IF NOT EXISTS pt_evaluation    TEXT,
    ADD COLUMN IF NOT EXISTS medical_history  TEXT,
    ADD COLUMN IF NOT EXISTS precautions      TEXT,
    ADD COLUMN IF NOT EXISTS treatment_goals  TEXT;
