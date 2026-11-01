package model

import "time"

// Document is file metadata. Bytes live in object storage at StorageKey.
type Document struct {
	ID            string
	OwnerID       string
	PatientID     string
	AppointmentID *string
	Label         string
	Type          string // e.g. MRI, PDF, X-ray
	FileName      string
	StorageKey    string
	ContentType   *string
	ByteSize      *int64
	UploadedAt    time.Time
}
