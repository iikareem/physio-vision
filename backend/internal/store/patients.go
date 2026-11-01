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

const patientSelectCols = `
	id, owner_id, workspace, name, phone, date_of_birth, occupation,
	condition, diagnosis, chief_complaint, pt_evaluation, medical_history,
	precautions, treatment_goals, status, referred_by, created_at, updated_at
`

type ListPatientsFilter struct {
	Workspace model.Workspace
	Status    *model.PatientStatus
	BoardOnly bool
}

func (s *Store) ListPatients(ctx context.Context, ownerID string, f ListPatientsFilter) ([]model.Patient, error) {
	var b strings.Builder
	args := []any{ownerID, string(f.Workspace)}
	fmt.Fprintf(&b, `
		SELECT %s
		FROM patients
		WHERE owner_id = $1 AND workspace = $2
	`, patientSelectCols)
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
	q := fmt.Sprintf(`
		SELECT %s
		FROM patients
		WHERE owner_id = $1 AND id = $2
	`, patientSelectCols)
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
	Workspace      model.Workspace
	Name           string
	Phone          *string
	DateOfBirth    *time.Time
	Occupation     *string
	Condition      string
	Diagnosis      *string
	ChiefComplaint *string
	PTEvaluation   *string
	MedicalHistory *string
	Precautions    *string
	TreatmentGoals *string
	Status         model.PatientStatus
	ReferredBy     *string
}

func (s *Store) CreatePatient(ctx context.Context, ownerID string, in CreatePatientInput) (*model.Patient, error) {
	const q = `
		INSERT INTO patients (
			owner_id, workspace, name, phone, date_of_birth, occupation,
			condition, diagnosis, chief_complaint, pt_evaluation, medical_history,
			precautions, treatment_goals, status, referred_by
		)
		VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11,
			$12, $13, $14, $15
		)
		RETURNING ` + patientSelectCols
	row := s.pool.QueryRow(ctx, q,
		ownerID, string(in.Workspace), in.Name, in.Phone, in.DateOfBirth, in.Occupation,
		in.Condition, in.Diagnosis, in.ChiefComplaint, in.PTEvaluation, in.MedicalHistory,
		in.Precautions, in.TreatmentGoals, string(in.Status), in.ReferredBy,
	)
	p, err := scanPatient(row)
	if err != nil {
		return nil, fmt.Errorf("create patient: %w", err)
	}
	return &p, nil
}

// OptionalText is a patch for a nullable text column.
// Set=false leaves the existing value; Set=true writes Value (nil clears).
type OptionalText struct {
	Set   bool
	Value *string
}

// OptionalDate is a patch for a nullable date column.
type OptionalDate struct {
	Set   bool
	Value *time.Time
}

type UpdatePatientInput struct {
	Name           *string
	Phone          OptionalText
	DateOfBirth    OptionalDate
	Occupation     OptionalText
	Condition      *string
	Diagnosis      OptionalText
	ChiefComplaint OptionalText
	PTEvaluation   OptionalText
	MedicalHistory OptionalText
	Precautions    OptionalText
	TreatmentGoals OptionalText
	Status         *model.PatientStatus
	ReferredBy     OptionalText
}

func applyOptionalText(existing *string, patch OptionalText) *string {
	if !patch.Set {
		return existing
	}
	return patch.Value
}

func applyOptionalDate(existing *time.Time, patch OptionalDate) *time.Time {
	if !patch.Set {
		return existing
	}
	return patch.Value
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
	condition := existing.Condition
	if in.Condition != nil {
		condition = *in.Condition
	}
	status := existing.Status
	if in.Status != nil {
		status = *in.Status
	}

	phone := applyOptionalText(existing.Phone, in.Phone)
	dob := applyOptionalDate(existing.DateOfBirth, in.DateOfBirth)
	occupation := applyOptionalText(existing.Occupation, in.Occupation)
	diagnosis := applyOptionalText(existing.Diagnosis, in.Diagnosis)
	chief := applyOptionalText(existing.ChiefComplaint, in.ChiefComplaint)
	ptEval := applyOptionalText(existing.PTEvaluation, in.PTEvaluation)
	history := applyOptionalText(existing.MedicalHistory, in.MedicalHistory)
	precautions := applyOptionalText(existing.Precautions, in.Precautions)
	goals := applyOptionalText(existing.TreatmentGoals, in.TreatmentGoals)
	ref := applyOptionalText(existing.ReferredBy, in.ReferredBy)

	const q = `
		UPDATE patients
		SET name = $3,
		    phone = $4,
		    date_of_birth = $5,
		    occupation = $6,
		    condition = $7,
		    diagnosis = $8,
		    chief_complaint = $9,
		    pt_evaluation = $10,
		    medical_history = $11,
		    precautions = $12,
		    treatment_goals = $13,
		    status = $14,
		    referred_by = $15,
		    updated_at = now()
		WHERE owner_id = $1 AND id = $2
		RETURNING ` + patientSelectCols
	row := s.pool.QueryRow(ctx, q,
		ownerID, id, name, phone, dob, occupation,
		condition, diagnosis, chief, ptEval, history,
		precautions, goals, string(status), ref,
	)
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
		&p.ID, &p.OwnerID, &workspace, &p.Name, &p.Phone, &p.DateOfBirth, &p.Occupation,
		&p.Condition, &p.Diagnosis, &p.ChiefComplaint, &p.PTEvaluation, &p.MedicalHistory,
		&p.Precautions, &p.TreatmentGoals, &status, &p.ReferredBy, &p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return model.Patient{}, err
	}
	p.Workspace = model.Workspace(workspace)
	p.Status = model.PatientStatus(status)
	return p, nil
}
