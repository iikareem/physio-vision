package model

import "time"

// AppointmentStatus is the schedule lifecycle for a session.
type AppointmentStatus string

const (
	AppointmentScheduled AppointmentStatus = "scheduled"
	AppointmentCheckedIn AppointmentStatus = "checked_in"
	AppointmentDone      AppointmentStatus = "done"
	AppointmentNoShow    AppointmentStatus = "no_show"
)

func (s AppointmentStatus) Valid() bool {
	switch s {
	case AppointmentScheduled, AppointmentCheckedIn, AppointmentDone, AppointmentNoShow:
		return true
	default:
		return false
	}
}

// Appointment is one session (schedule + optional clinical summary).
// There is no separate Visit entity — Summary replaces frontend Visit.summary.
type Appointment struct {
	ID        string
	OwnerID   string
	PatientID string
	Workspace Workspace
	StartsAt  time.Time
	Status    AppointmentStatus
	Type      string  // e.g. Follow-up, Rehab session
	Summary   *string // clinical write-up after / during the session
	CreatedAt time.Time
	UpdatedAt time.Time
}
