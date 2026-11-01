package model

import "time"

// PatientStatus is the care lifecycle for a patient.
type PatientStatus string

const (
	PatientActive      PatientStatus = "active"
	PatientTerminated  PatientStatus = "terminated"
	PatientTransferred PatientStatus = "transferred"
	PatientDischarged  PatientStatus = "discharged"
)

func (s PatientStatus) Valid() bool {
	switch s {
	case PatientActive, PatientTerminated, PatientTransferred, PatientDischarged:
		return true
	default:
		return false
	}
}

// OnBoard is true for patients shown on the Today / patient board.
func (s PatientStatus) OnBoard() bool {
	return s == PatientActive || s == PatientTransferred
}

// Patient is a person under care in one workspace.
type Patient struct {
	ID         string
	OwnerID    string
	Workspace  Workspace
	Name       string
	Phone      *string
	Condition  string
	Status     PatientStatus
	ReferredBy *string // set when Status is transferred
	CreatedAt  time.Time
	UpdatedAt  time.Time
}
