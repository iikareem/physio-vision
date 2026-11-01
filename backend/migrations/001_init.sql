-- Physio Vision v1
-- One therapist (owner). Clinic | Private workspaces.
-- Sessions live in appointments only (no separate visits table).
-- Frontend Visit.summary maps to appointments.summary.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    workspace   TEXT NOT NULL CHECK (workspace IN ('clinic', 'private')),
    name        TEXT NOT NULL,
    phone       TEXT,
    condition   TEXT NOT NULL,
    status      TEXT NOT NULL CHECK (
        status IN ('active', 'terminated', 'transferred', 'discharged')
    ),
    referred_by TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT patients_referred_by_when_transferred CHECK (
        status <> 'transferred' OR (referred_by IS NOT NULL AND referred_by <> '')
    )
);

CREATE INDEX patients_owner_workspace_status_idx
    ON patients (owner_id, workspace, status);

CREATE INDEX patients_owner_workspace_name_idx
    ON patients (owner_id, workspace, name);

-- ---------------------------------------------------------------------------
-- appointments (sessions)
-- Clinical visit summary is appointments.summary — not a separate visits table.
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    workspace  TEXT NOT NULL CHECK (workspace IN ('clinic', 'private')),
    starts_at  TIMESTAMPTZ NOT NULL,
    status     TEXT NOT NULL CHECK (
        status IN ('scheduled', 'checked_in', 'done', 'no_show')
    ),
    type       TEXT NOT NULL,
    summary    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX appointments_owner_workspace_starts_at_idx
    ON appointments (owner_id, workspace, starts_at);

CREATE INDEX appointments_patient_starts_at_idx
    ON appointments (patient_id, starts_at DESC);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
CREATE TABLE notes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    patient_id     UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
    body           TEXT NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notes_patient_created_at_idx
    ON notes (patient_id, created_at DESC);

CREATE INDEX notes_appointment_id_idx
    ON notes (appointment_id)
    WHERE appointment_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- documents (file bytes live in object storage; DB holds metadata only)
-- ---------------------------------------------------------------------------
CREATE TABLE documents (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    patient_id     UUID NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments (id) ON DELETE SET NULL,
    label          TEXT NOT NULL,
    type           TEXT NOT NULL,
    file_name      TEXT NOT NULL,
    storage_key    TEXT NOT NULL,
    content_type   TEXT,
    byte_size      BIGINT,
    uploaded_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX documents_patient_uploaded_at_idx
    ON documents (patient_id, uploaded_at DESC);

CREATE INDEX documents_appointment_id_idx
    ON documents (appointment_id)
    WHERE appointment_id IS NOT NULL;
