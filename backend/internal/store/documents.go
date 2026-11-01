package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"physio-vision/backend/internal/model"
)

func (s *Store) ListDocumentsForPatient(ctx context.Context, ownerID, patientID string) ([]model.Document, error) {
	if _, err := s.GetPatient(ctx, ownerID, patientID); err != nil {
		return nil, err
	}

	const q = `
		SELECT id, owner_id, patient_id, appointment_id, label, type, file_name,
		       storage_key, content_type, byte_size, uploaded_at
		FROM documents
		WHERE owner_id = $1 AND patient_id = $2
		ORDER BY uploaded_at DESC
	`
	rows, err := s.pool.Query(ctx, q, ownerID, patientID)
	if err != nil {
		return nil, fmt.Errorf("list documents: %w", err)
	}
	defer rows.Close()

	var out []model.Document
	for rows.Next() {
		var d model.Document
		if err := rows.Scan(
			&d.ID, &d.OwnerID, &d.PatientID, &d.AppointmentID, &d.Label, &d.Type,
			&d.FileName, &d.StorageKey, &d.ContentType, &d.ByteSize, &d.UploadedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

type CreateDocumentInput struct {
	PatientID     string
	AppointmentID *string
	Label         string
	Type          string
	FileName      string
	StorageKey    string
	ContentType   *string
	ByteSize      *int64
}

func (s *Store) CreateDocument(ctx context.Context, ownerID string, in CreateDocumentInput) (*model.Document, error) {
	if _, err := s.GetPatient(ctx, ownerID, in.PatientID); err != nil {
		return nil, err
	}
	if in.AppointmentID != nil {
		if _, err := s.GetAppointment(ctx, ownerID, *in.AppointmentID); err != nil {
			return nil, err
		}
	}

	const q = `
		INSERT INTO documents (
			owner_id, patient_id, appointment_id, label, type, file_name,
			storage_key, content_type, byte_size
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, owner_id, patient_id, appointment_id, label, type, file_name,
		          storage_key, content_type, byte_size, uploaded_at
	`
	var d model.Document
	err := s.pool.QueryRow(ctx, q,
		ownerID, in.PatientID, in.AppointmentID, in.Label, in.Type, in.FileName,
		in.StorageKey, in.ContentType, in.ByteSize,
	).Scan(
		&d.ID, &d.OwnerID, &d.PatientID, &d.AppointmentID, &d.Label, &d.Type,
		&d.FileName, &d.StorageKey, &d.ContentType, &d.ByteSize, &d.UploadedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create document: %w", err)
	}
	return &d, nil
}

func (s *Store) GetDocument(ctx context.Context, ownerID, id string) (*model.Document, error) {
	const q = `
		SELECT id, owner_id, patient_id, appointment_id, label, type, file_name,
		       storage_key, content_type, byte_size, uploaded_at
		FROM documents
		WHERE owner_id = $1 AND id = $2
	`
	var d model.Document
	err := s.pool.QueryRow(ctx, q, ownerID, id).Scan(
		&d.ID, &d.OwnerID, &d.PatientID, &d.AppointmentID, &d.Label, &d.Type,
		&d.FileName, &d.StorageKey, &d.ContentType, &d.ByteSize, &d.UploadedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	return &d, nil
}
