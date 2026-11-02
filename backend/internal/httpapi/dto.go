package httpapi

import (
	"time"

	"physio-vision/backend/internal/model"
)

type userDTO struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"createdAt"`
}

func toUserDTO(u model.User) userDTO {
	return userDTO{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		CreatedAt: u.CreatedAt,
	}
}

type patientDTO struct {
	ID             string    `json:"id"`
	WorkspaceID    string    `json:"workspaceId"`
	Name           string    `json:"name"`
	Phone          *string   `json:"phone,omitempty"`
	DateOfBirth    *string   `json:"dateOfBirth,omitempty"`
	Occupation     *string   `json:"occupation,omitempty"`
	Condition      string    `json:"condition"`
	Diagnosis      *string   `json:"diagnosis,omitempty"`
	ChiefComplaint *string   `json:"chiefComplaint,omitempty"`
	PTEvaluation   *string   `json:"ptEvaluation,omitempty"`
	MedicalHistory *string   `json:"medicalHistory,omitempty"`
	Precautions    *string   `json:"precautions,omitempty"`
	TreatmentGoals *string   `json:"treatmentGoals,omitempty"`
	Status         string    `json:"status"`
	ReferredBy     *string   `json:"referredBy,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func formatDatePtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format("2006-01-02")
	return &s
}

func toPatientDTO(p model.Patient) patientDTO {
	return patientDTO{
		ID:             p.ID,
		WorkspaceID:    string(p.Workspace),
		Name:           p.Name,
		Phone:          p.Phone,
		DateOfBirth:    formatDatePtr(p.DateOfBirth),
		Occupation:     p.Occupation,
		Condition:      p.Condition,
		Diagnosis:      p.Diagnosis,
		ChiefComplaint: p.ChiefComplaint,
		PTEvaluation:   p.PTEvaluation,
		MedicalHistory: p.MedicalHistory,
		Precautions:    p.Precautions,
		TreatmentGoals: p.TreatmentGoals,
		Status:         string(p.Status),
		ReferredBy:     p.ReferredBy,
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
	}
}

func toPatientDTOs(items []model.Patient) []patientDTO {
	out := make([]patientDTO, 0, len(items))
	for _, p := range items {
		out = append(out, toPatientDTO(p))
	}
	return out
}

type appointmentDTO struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	PatientID   string    `json:"patientId"`
	StartsAt    time.Time `json:"startsAt"`
	Status      string    `json:"status"`
	Type        string    `json:"type"`
	Summary     *string   `json:"summary,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func toAppointmentDTO(a model.Appointment) appointmentDTO {
	return appointmentDTO{
		ID:          a.ID,
		WorkspaceID: string(a.Workspace),
		PatientID:   a.PatientID,
		StartsAt:    a.StartsAt,
		Status:      string(a.Status),
		Type:        a.Type,
		Summary:     a.Summary,
		CreatedAt:   a.CreatedAt,
		UpdatedAt:   a.UpdatedAt,
	}
}

func toAppointmentDTOs(items []model.Appointment) []appointmentDTO {
	out := make([]appointmentDTO, 0, len(items))
	for _, a := range items {
		out = append(out, toAppointmentDTO(a))
	}
	return out
}

type noteDTO struct {
	ID            string    `json:"id"`
	PatientID     string    `json:"patientId"`
	AppointmentID *string   `json:"appointmentId,omitempty"`
	Body          string    `json:"body"`
	CreatedAt     time.Time `json:"createdAt"`
}

func toNoteDTO(n model.Note) noteDTO {
	return noteDTO{
		ID:            n.ID,
		PatientID:     n.PatientID,
		AppointmentID: n.AppointmentID,
		Body:          n.Body,
		CreatedAt:     n.CreatedAt,
	}
}

func toNoteDTOs(items []model.Note) []noteDTO {
	out := make([]noteDTO, 0, len(items))
	for _, n := range items {
		out = append(out, toNoteDTO(n))
	}
	return out
}

type documentDTO struct {
	ID            string    `json:"id"`
	PatientID     string    `json:"patientId"`
	AppointmentID *string   `json:"appointmentId,omitempty"`
	Label         string    `json:"label"`
	Type          string    `json:"type"`
	FileName      string    `json:"fileName"`
	StorageKey    string    `json:"storageKey"`
	ContentType   *string   `json:"contentType,omitempty"`
	ByteSize      *int64    `json:"byteSize,omitempty"`
	UploadedAt    time.Time `json:"uploadedAt"`
}

func toDocumentDTO(d model.Document) documentDTO {
	return documentDTO{
		ID:            d.ID,
		PatientID:     d.PatientID,
		AppointmentID: d.AppointmentID,
		Label:         d.Label,
		Type:          d.Type,
		FileName:      d.FileName,
		StorageKey:    d.StorageKey,
		ContentType:   d.ContentType,
		ByteSize:      d.ByteSize,
		UploadedAt:    d.UploadedAt,
	}
}

func toDocumentDTOs(items []model.Document) []documentDTO {
	out := make([]documentDTO, 0, len(items))
	for _, d := range items {
		out = append(out, toDocumentDTO(d))
	}
	return out
}

type learningDTO struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspaceId"`
	PatientID   *string   `json:"patientId,omitempty"`
	PatientName *string   `json:"patientName,omitempty"`
	Body        string    `json:"body"`
	Done        bool      `json:"done"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func toLearningDTO(item model.LearningItem) learningDTO {
	return learningDTO{
		ID:          item.ID,
		WorkspaceID: string(item.Workspace),
		PatientID:   item.PatientID,
		PatientName: item.PatientName,
		Body:        item.Body,
		Done:        item.Done,
		CreatedAt:   item.CreatedAt,
		UpdatedAt:   item.UpdatedAt,
	}
}

func toLearningDTOs(items []model.LearningItem) []learningDTO {
	out := make([]learningDTO, 0, len(items))
	for _, item := range items {
		out = append(out, toLearningDTO(item))
	}
	return out
}
