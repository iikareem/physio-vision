package model

import "time"

// Note is free-text clinical writing for a patient, optionally tied to a session.
type Note struct {
	ID            string
	OwnerID       string
	PatientID     string
	AppointmentID *string
	Body          string
	CreatedAt     time.Time
}
