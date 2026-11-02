package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"physio-vision/backend/internal/model"
)

type ListLearningFilter struct {
	Workspace model.Workspace
	PatientID *string
	General   bool // only items with no patient
	Done      *bool
}

func (s *Store) ListLearningItems(ctx context.Context, ownerID string, f ListLearningFilter) ([]model.LearningItem, error) {
	q := `
		SELECT
			l.id, l.owner_id, l.workspace, l.patient_id, p.name,
			l.body, l.done, l.created_at, l.updated_at
		FROM learning_items l
		LEFT JOIN patients p ON p.id = l.patient_id
		WHERE l.owner_id = $1 AND l.workspace = $2
	`
	args := []any{ownerID, string(f.Workspace)}
	argN := 3

	if f.PatientID != nil {
		q += fmt.Sprintf(` AND l.patient_id = $%d`, argN)
		args = append(args, *f.PatientID)
		argN++
	} else if f.General {
		q += ` AND l.patient_id IS NULL`
	}

	if f.Done != nil {
		q += fmt.Sprintf(` AND l.done = $%d`, argN)
		args = append(args, *f.Done)
	}

	q += `
		ORDER BY l.done ASC, l.created_at DESC
	`

	rows, err := s.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list learning items: %w", err)
	}
	defer rows.Close()

	var out []model.LearningItem
	for rows.Next() {
		item, err := scanLearningItem(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (s *Store) ListLearningItemsForPatient(ctx context.Context, ownerID, patientID string) ([]model.LearningItem, error) {
	patient, err := s.GetPatient(ctx, ownerID, patientID)
	if err != nil {
		return nil, err
	}
	return s.ListLearningItems(ctx, ownerID, ListLearningFilter{
		Workspace: patient.Workspace,
		PatientID: &patientID,
	})
}

type CreateLearningInput struct {
	Workspace model.Workspace
	PatientID *string
	Body      string
}

func (s *Store) CreateLearningItem(ctx context.Context, ownerID string, in CreateLearningInput) (*model.LearningItem, error) {
	if in.PatientID != nil {
		patient, err := s.GetPatient(ctx, ownerID, *in.PatientID)
		if err != nil {
			return nil, err
		}
		if patient.Workspace != in.Workspace {
			return nil, fmt.Errorf("%w: patient workspace mismatch", ErrNotFound)
		}
	}

	const q = `
		INSERT INTO learning_items (owner_id, workspace, patient_id, body)
		VALUES ($1, $2, $3, $4)
		RETURNING id, owner_id, workspace, patient_id, body, done, created_at, updated_at
	`
	var item model.LearningItem
	var workspace string
	err := s.pool.QueryRow(ctx, q, ownerID, string(in.Workspace), in.PatientID, in.Body).Scan(
		&item.ID, &item.OwnerID, &workspace, &item.PatientID, &item.Body, &item.Done, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create learning item: %w", err)
	}
	item.Workspace = model.Workspace(workspace)

	if item.PatientID != nil {
		patient, err := s.GetPatient(ctx, ownerID, *item.PatientID)
		if err == nil {
			name := patient.Name
			item.PatientName = &name
		}
	}
	return &item, nil
}

type UpdateLearningInput struct {
	Body *string
	Done *bool
}

func (s *Store) UpdateLearningItem(ctx context.Context, ownerID, id string, in UpdateLearningInput) (*model.LearningItem, error) {
	existing, err := s.GetLearningItem(ctx, ownerID, id)
	if err != nil {
		return nil, err
	}

	body := existing.Body
	if in.Body != nil {
		body = *in.Body
	}
	done := existing.Done
	if in.Done != nil {
		done = *in.Done
	}

	const q = `
		UPDATE learning_items
		SET body = $3, done = $4, updated_at = now()
		WHERE owner_id = $1 AND id = $2
		RETURNING id, owner_id, workspace, patient_id, body, done, created_at, updated_at
	`
	var item model.LearningItem
	var workspace string
	err = s.pool.QueryRow(ctx, q, ownerID, id, body, done).Scan(
		&item.ID, &item.OwnerID, &workspace, &item.PatientID, &item.Body, &item.Done, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("update learning item: %w", err)
	}
	item.Workspace = model.Workspace(workspace)
	item.PatientName = existing.PatientName
	return &item, nil
}

func (s *Store) DeleteLearningItem(ctx context.Context, ownerID, id string) error {
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM learning_items WHERE owner_id = $1 AND id = $2`,
		ownerID, id,
	)
	if err != nil {
		return fmt.Errorf("delete learning item: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) GetLearningItem(ctx context.Context, ownerID, id string) (*model.LearningItem, error) {
	const q = `
		SELECT
			l.id, l.owner_id, l.workspace, l.patient_id, p.name,
			l.body, l.done, l.created_at, l.updated_at
		FROM learning_items l
		LEFT JOIN patients p ON p.id = l.patient_id
		WHERE l.owner_id = $1 AND l.id = $2
	`
	rows, err := s.pool.Query(ctx, q, ownerID, id)
	if err != nil {
		return nil, fmt.Errorf("get learning item: %w", err)
	}
	defer rows.Close()
	if !rows.Next() {
		return nil, ErrNotFound
	}
	item, err := scanLearningItem(rows)
	if err != nil {
		return nil, err
	}
	return &item, rows.Err()
}

type learningScanner interface {
	Scan(dest ...any) error
}

func scanLearningItem(row learningScanner) (model.LearningItem, error) {
	var item model.LearningItem
	var workspace string
	err := row.Scan(
		&item.ID, &item.OwnerID, &workspace, &item.PatientID, &item.PatientName,
		&item.Body, &item.Done, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return item, fmt.Errorf("scan learning item: %w", err)
	}
	item.Workspace = model.Workspace(workspace)
	return item, nil
}
