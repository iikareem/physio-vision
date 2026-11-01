package store

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"

	"physio-vision/backend/internal/model"
)

type ListPatientsFilter struct {
	Workspace model.Workspace
	Status    *model.PatientStatus
	BoardOnly bool
}

func (s *Store) ListPatients(ctx context.Context, ownerID string, f ListPatientsFilter) ([]model.Patient, error) {
	var b strings.Builder
	args := []any{ownerID, string(f.Workspace)}
	b.WriteString(`
		SELECT id, owner_id, workspace, name, phone, condition, status, referred_by, created_at, updated_at
		FROM patients
		WHERE owner_id = $1 AND workspace = $2
	`)
	if f.BoardOnly {
		b.WriteString(` AND status IN ('active', 'transferred')`)
	} else if f.Status != nil {
		args = append(args, string(*f.Status))
		fmt.Fprintf(&b, ` AND status = $%d`, len(args))
	}
	b.WriteString(` ORDER BY name ASC`)

	rows, err := s.pool.Query(ctx, b.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("list patients: %w", err)
	}
	defer rows.Close()

	var out []model.Patient
	for rows.Next() {
		p, err := scanPatient(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (s *Store) GetPatient(ctx context.Context, ownerID, id string) (*model.Patient, error) {
	const q = `
		SELECT id, owner_id, workspace, name, phone, condition, status, referred_by, created_at, updated_at
		FROM patients
		WHERE owner_id = $1 AND id = $2
	`
	row := s.pool.QueryRow(ctx, q, ownerID, id)
	p, err := scanPatient(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get patient: %w", err)
	}
	return &p, nil
}

type CreatePatientInput struct {
	Workspace  model.Workspace
	Name       string
	Phone      *string
	Condition  string
	Status     model.PatientStatus
	ReferredBy *string
}

func (s *Store) CreatePatient(ctx context.Context, ownerID string, in CreatePatientInput) (*model.Patient, error) {
	const q = `
		INSERT INTO patients (owner_id, workspace, name, phone, condition, status, referred_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, owner_id, workspace, name, phone, condition, status, referred_by, created_at, updated_at
	`
	row := s.pool.QueryRow(ctx, q,
		ownerID, string(in.Workspace), in.Name, in.Phone, in.Condition, string(in.Status), in.ReferredBy,
	)
	p, err := scanPatient(row)
	if err != nil {
		return nil, fmt.Errorf("create patient: %w", err)
	}
	return &p, nil
}

type UpdatePatientInput struct {
	Name       *string
	Phone      *string
	ClearPhone bool
	Condition  *string
	Status     *model.PatientStatus
	ReferredBy *string
	ClearRef   bool
}

func (s *Store) UpdatePatient(ctx context.Context, ownerID, id string, in UpdatePatientInput) (*model.Patient, error) {
	existing, err := s.GetPatient(ctx, ownerID, id)
	if err != nil {
		return nil, err
	}

	name := existing.Name
	if in.Name != nil {
		name = *in.Name
	}
	phone := existing.Phone
	if in.ClearPhone {
		phone = nil
	} else if in.Phone != nil {
		phone = in.Phone
	}
	condition := existing.Condition
	if in.Condition != nil {
		condition = *in.Condition
	}
	status := existing.Status
	if in.Status != nil {
		status = *in.Status
	}
	ref := existing.ReferredBy
	if in.ClearRef {
		ref = nil
	} else if in.ReferredBy != nil {
		ref = in.ReferredBy
	}

	const q = `
		UPDATE patients
		SET name = $3,
		    phone = $4,
		    condition = $5,
		    status = $6,
		    referred_by = $7,
		    updated_at = now()
		WHERE owner_id = $1 AND id = $2
		RETURNING id, owner_id, workspace, name, phone, condition, status, referred_by, created_at, updated_at
	`
	row := s.pool.QueryRow(ctx, q, ownerID, id, name, phone, condition, string(status), ref)
	p, err := scanPatient(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update patient: %w", err)
	}
	return &p, nil
}

type patientScanner interface {
	Scan(dest ...any) error
}

func scanPatient(row patientScanner) (model.Patient, error) {
	var p model.Patient
	var workspace, status string
	err := row.Scan(
		&p.ID, &p.OwnerID, &workspace, &p.Name, &p.Phone, &p.Condition,
		&status, &p.ReferredBy, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return model.Patient{}, err
	}
	p.Workspace = model.Workspace(workspace)
	p.Status = model.PatientStatus(status)
	return p, nil
}
