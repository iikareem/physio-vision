package store

import (
	"context"
	"fmt"

	"physio-vision/backend/internal/model"
)

func (s *Store) ListNotesForPatient(ctx context.Context, ownerID, patientID string) ([]model.Note, error) {
	if _, err := s.GetPatient(ctx, ownerID, patientID); err != nil {
		return nil, err
	}

	const q = `
		SELECT id, owner_id, patient_id, appointment_id, body, created_at
		FROM notes
		WHERE owner_id = $1 AND patient_id = $2
		ORDER BY created_at DESC
	`
	rows, err := s.pool.Query(ctx, q, ownerID, patientID)
	if err != nil {
		return nil, fmt.Errorf("list notes: %w", err)
	}
	defer rows.Close()

	var out []model.Note
	for rows.Next() {
		var n model.Note
		if err := rows.Scan(&n.ID, &n.OwnerID, &n.PatientID, &n.AppointmentID, &n.Body, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

type CreateNoteInput struct {
	PatientID     string
	AppointmentID *string
	Body          string
}

func (s *Store) CreateNote(ctx context.Context, ownerID string, in CreateNoteInput) (*model.Note, error) {
	if _, err := s.GetPatient(ctx, ownerID, in.PatientID); err != nil {
		return nil, err
	}
	if in.AppointmentID != nil {
		if _, err := s.GetAppointment(ctx, ownerID, *in.AppointmentID); err != nil {
			return nil, err
		}
	}

	const q = `
		INSERT INTO notes (owner_id, patient_id, appointment_id, body)
		VALUES ($1, $2, $3, $4)
		RETURNING id, owner_id, patient_id, appointment_id, body, created_at
	`
	var n model.Note
	err := s.pool.QueryRow(ctx, q, ownerID, in.PatientID, in.AppointmentID, in.Body).Scan(
		&n.ID, &n.OwnerID, &n.PatientID, &n.AppointmentID, &n.Body, &n.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create note: %w", err)
	}
	return &n, nil
}
