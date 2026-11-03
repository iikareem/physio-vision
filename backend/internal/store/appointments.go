package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"

	"physio-vision/backend/internal/model"
)

type ListAppointmentsFilter struct {
	Workspace model.Workspace
	PatientID *string
	Date      *time.Time // calendar day in UTC
}

func (s *Store) ListAppointments(ctx context.Context, ownerID string, f ListAppointmentsFilter) ([]model.Appointment, error) {
	var b strings.Builder
	args := []any{ownerID, string(f.Workspace)}
	b.WriteString(`
		SELECT id, owner_id, patient_id, workspace, starts_at, status, type, summary, created_at, updated_at
		FROM appointments
		WHERE owner_id = $1 AND workspace = $2
	`)
	if f.PatientID != nil {
		args = append(args, *f.PatientID)
		fmt.Fprintf(&b, ` AND patient_id = $%d`, len(args))
	}
	if f.Date != nil {
		start := time.Date(f.Date.Year(), f.Date.Month(), f.Date.Day(), 0, 0, 0, 0, time.UTC)
		end := start.Add(24 * time.Hour)
		args = append(args, start, end)
		fmt.Fprintf(&b, ` AND starts_at >= $%d AND starts_at < $%d`, len(args)-1, len(args))
	}
	b.WriteString(` ORDER BY starts_at ASC`)

	rows, err := s.pool.Query(ctx, b.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("list appointments: %w", err)
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

func (s *Store) GetAppointment(ctx context.Context, ownerID, id string) (*model.Appointment, error) {
	const q = `
		SELECT id, owner_id, patient_id, workspace, starts_at, status, type, summary, created_at, updated_at
		FROM appointments
		WHERE owner_id = $1 AND id = $2
	`
	row := s.pool.QueryRow(ctx, q, ownerID, id)
	a, err := scanAppointment(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get appointment: %w", err)
	}
	return &a, nil
}

type CreateAppointmentInput struct {
	PatientID string
	Workspace model.Workspace
	StartsAt  time.Time
	Type      string
}

func (s *Store) CreateAppointment(ctx context.Context, ownerID string, in CreateAppointmentInput) (*model.Appointment, error) {
	// Ensure patient belongs to owner and workspace matches.
	patient, err := s.GetPatient(ctx, ownerID, in.PatientID)
	if err != nil {
		return nil, err
	}
	if patient.Workspace != in.Workspace {
		return nil, fmt.Errorf("%w: patient workspace mismatch", ErrNotFound)
	}

	const q = `
		INSERT INTO appointments (owner_id, patient_id, workspace, starts_at, status, type)
		VALUES ($1, $2, $3, $4, 'done', $5)
		RETURNING id, owner_id, patient_id, workspace, starts_at, status, type, summary, created_at, updated_at
	`
	row := s.pool.QueryRow(ctx, q, ownerID, in.PatientID, string(in.Workspace), in.StartsAt, in.Type)
	a, err := scanAppointment(row)
	if err != nil {
		return nil, fmt.Errorf("create appointment: %w", err)
	}
	return &a, nil
}

type UpdateAppointmentInput struct {
	StartsAt *time.Time
	Status   *model.AppointmentStatus
	Type     *string
	Summary  *string
	ClearSum bool
}

func (s *Store) UpdateAppointment(ctx context.Context, ownerID, id string, in UpdateAppointmentInput) (*model.Appointment, error) {
	existing, err := s.GetAppointment(ctx, ownerID, id)
	if err != nil {
		return nil, err
	}

	startsAt := existing.StartsAt
	if in.StartsAt != nil {
		startsAt = *in.StartsAt
	}
	status := existing.Status
	if in.Status != nil {
		status = *in.Status
	}
	typ := existing.Type
	if in.Type != nil {
		typ = *in.Type
	}
	summary := existing.Summary
	if in.ClearSum {
		summary = nil
	} else if in.Summary != nil {
		summary = in.Summary
	}

	const q = `
		UPDATE appointments
		SET starts_at = $3,
		    status = $4,
		    type = $5,
		    summary = $6,
		    updated_at = now()
		WHERE owner_id = $1 AND id = $2
		RETURNING id, owner_id, patient_id, workspace, starts_at, status, type, summary, created_at, updated_at
	`
	row := s.pool.QueryRow(ctx, q, ownerID, id, startsAt, string(status), typ, summary)
	a, err := scanAppointment(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update appointment: %w", err)
	}
	return &a, nil
}

func (s *Store) DeleteAppointment(ctx context.Context, ownerID, id string) error {
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM appointments WHERE owner_id = $1 AND id = $2`,
		ownerID, id,
	)
	if err != nil {
		return fmt.Errorf("delete appointment: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

type appointmentScanner interface {
	Scan(dest ...any) error
}

func scanAppointment(row appointmentScanner) (model.Appointment, error) {
	var a model.Appointment
	var workspace, status string
	err := row.Scan(
		&a.ID, &a.OwnerID, &a.PatientID, &workspace, &a.StartsAt,
		&status, &a.Type, &a.Summary, &a.CreatedAt, &a.UpdatedAt,
	)
	if err != nil {
		return model.Appointment{}, err
	}
	a.Workspace = model.Workspace(workspace)
	a.Status = model.AppointmentStatus(status)
	return a, nil
}
