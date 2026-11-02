package model

import "time"

// LearningItem is a free-form “need to learn” entry, optionally tied to a patient.
type LearningItem struct {
	ID          string
	OwnerID     string
	Workspace   Workspace
	PatientID   *string
	PatientName *string
	Body        string
	Done        bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
