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
	ID              string
	OwnerID         string
	Workspace       Workspace
	Name            string
	Phone           *string
	Email           *string
	DateOfBirth     *time.Time
	Occupation      *string
	Condition       string
	Diagnosis       *string
	ChiefComplaint  *string
	PTEvaluation    *string
	MedicalHistory  *string
	Precautions     *string
	TreatmentGoals  *string
	Status          PatientStatus
	ReferredBy      *string // optional when Status is transferred
	CreatedAt       time.Time
	UpdatedAt       time.Time
}
