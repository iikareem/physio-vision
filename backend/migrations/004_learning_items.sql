-- Learning dump: things to study, per patient or general (workspace-scoped).

CREATE TABLE learning_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    workspace   TEXT NOT NULL CHECK (workspace IN ('clinic', 'private')),
    patient_id  UUID REFERENCES patients (id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    done        BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX learning_items_owner_workspace_created_at_idx
    ON learning_items (owner_id, workspace, created_at DESC);

CREATE INDEX learning_items_patient_created_at_idx
    ON learning_items (patient_id, created_at DESC)
    WHERE patient_id IS NOT NULL;

CREATE INDEX learning_items_owner_workspace_done_idx
    ON learning_items (owner_id, workspace, done, created_at DESC);
