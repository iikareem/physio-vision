package store

import (
	"context"
	"fmt"
	"time"

	"physio-vision/backend/internal/model"
)

// ListAppointmentsInRange returns all appointments for a workspace overlapping [start, end).
func (s *Store) ListAppointmentsInRange(
	ctx context.Context,
	ownerID string,
	workspace model.Workspace,
	start, end time.Time,
) ([]model.Appointment, error) {
	const q = `
		SELECT id, owner_id, patient_id, workspace, starts_at, status, type, summary, created_at, updated_at
		FROM appointments
		WHERE owner_id = $1
		  AND workspace = $2
		  AND starts_at >= $3
		  AND starts_at < $4
		ORDER BY starts_at ASC
	`
	rows, err := s.pool.Query(ctx, q, ownerID, string(workspace), start, end)
	if err != nil {
		return nil, fmt.Errorf("list appointments in range: %w", err)
	}
	defer rows.Close()

	var out []model.Appointment
	for rows.Next() {
		a, err := scanAppointment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// ListPatientsForWorkspace returns every patient in a workspace (for analytics joins).
func (s *Store) ListPatientsForWorkspace(
	ctx context.Context,
	ownerID string,
	workspace model.Workspace,
) ([]model.Patient, error) {
	return s.ListPatients(ctx, ownerID, ListPatientsFilter{Workspace: workspace})
}
