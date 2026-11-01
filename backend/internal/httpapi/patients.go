package httpapi

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"physio-vision/backend/internal/model"
	"physio-vision/backend/internal/store"
)

func parseWorkspace(raw string) (model.Workspace, error) {
	w := model.Workspace(strings.TrimSpace(raw))
	if !w.Valid() {
		return "", errors.New("workspace must be clinic or private")
	}
	return w, nil
}

func (s *Server) handleListPatients(w http.ResponseWriter, r *http.Request) {
	workspace, err := parseWorkspace(r.URL.Query().Get("workspace"))
	if err != nil {
		badRequest(w, err)
		return
	}

	f := store.ListPatientsFilter{Workspace: workspace}
	if r.URL.Query().Get("board") == "true" {
		f.BoardOnly = true
	} else if raw := r.URL.Query().Get("status"); raw != "" {
		st := model.PatientStatus(raw)
		if !st.Valid() {
			badRequest(w, errors.New("invalid status"))
			return
		}
		f.Status = &st
	}

	items, err := s.store.ListPatients(r.Context(), ownerIDFrom(r.Context()), f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list patients")
		return
	}
	writeJSON(w, http.StatusOK, toPatientDTOs(items))
}

type createPatientRequest struct {
	WorkspaceID    string  `json:"workspaceId"`
	Name           string  `json:"name"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	DateOfBirth    *string `json:"dateOfBirth"`
	Occupation     *string `json:"occupation"`
	Condition      string  `json:"condition"`
	Diagnosis      *string `json:"diagnosis"`
	ChiefComplaint *string `json:"chiefComplaint"`
	PTEvaluation   *string `json:"ptEvaluation"`
	MedicalHistory *string `json:"medicalHistory"`
	Precautions    *string `json:"precautions"`
	TreatmentGoals *string `json:"treatmentGoals"`
	Status         string  `json:"status"`
	ReferredBy     *string `json:"referredBy"`
}

func (s *Server) handleCreatePatient(w http.ResponseWriter, r *http.Request) {
	var req createPatientRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}

	workspace, err := parseWorkspace(req.WorkspaceID)
	if err != nil {
		badRequest(w, err)
		return
	}
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		badRequest(w, errors.New("name is required"))
		return
	}

	status := model.PatientStatus(req.Status)
	if status == "" {
		status = model.PatientActive
	}
	if !status.Valid() {
		badRequest(w, errors.New("invalid status"))
		return
	}

	dob, err := parseOptionalDate(req.DateOfBirth)
	if err != nil {
		badRequest(w, err)
		return
	}

	p, err := s.store.CreatePatient(r.Context(), ownerIDFrom(r.Context()), store.CreatePatientInput{
		Workspace:      workspace,
		Name:           req.Name,
		Phone:          trimPtr(req.Phone),
		Email:          trimPtr(req.Email),
		DateOfBirth:    dob,
		Occupation:     trimPtr(req.Occupation),
		Condition:      strings.TrimSpace(req.Condition),
		Diagnosis:      trimPtr(req.Diagnosis),
		ChiefComplaint: trimPtr(req.ChiefComplaint),
		PTEvaluation:   trimPtr(req.PTEvaluation),
		MedicalHistory: trimPtr(req.MedicalHistory),
		Precautions:    trimPtr(req.Precautions),
		TreatmentGoals: trimPtr(req.TreatmentGoals),
		Status:         status,
		ReferredBy:     trimPtr(req.ReferredBy),
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create patient")
		return
	}
	writeJSON(w, http.StatusCreated, toPatientDTO(*p))
}

func (s *Server) handleGetPatient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	p, err := s.store.GetPatient(r.Context(), ownerIDFrom(r.Context()), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get patient")
		return
	}
	writeJSON(w, http.StatusOK, toPatientDTO(*p))
}

type updatePatientRequest struct {
	Name           *string `json:"name"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	DateOfBirth    *string `json:"dateOfBirth"`
	Occupation     *string `json:"occupation"`
	Condition      *string `json:"condition"`
	Diagnosis      *string `json:"diagnosis"`
	ChiefComplaint *string `json:"chiefComplaint"`
	PTEvaluation   *string `json:"ptEvaluation"`
	MedicalHistory *string `json:"medicalHistory"`
	Precautions    *string `json:"precautions"`
	TreatmentGoals *string `json:"treatmentGoals"`
	Status         *string `json:"status"`
	ReferredBy     *string `json:"referredBy"`
}

func (s *Server) handleUpdatePatient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updatePatientRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}

	in := store.UpdatePatientInput{}
	if req.Name != nil {
		v := strings.TrimSpace(*req.Name)
		if v == "" {
			badRequest(w, errors.New("name cannot be empty"))
			return
		}
		in.Name = &v
	}
	if req.Condition != nil {
		v := strings.TrimSpace(*req.Condition)
		in.Condition = &v
	}
	if req.Phone != nil {
		in.Phone = optionalTextFromPtr(req.Phone)
	}
	if req.Email != nil {
		in.Email = optionalTextFromPtr(req.Email)
	}
	if req.Occupation != nil {
		in.Occupation = optionalTextFromPtr(req.Occupation)
	}
	if req.Diagnosis != nil {
		in.Diagnosis = optionalTextFromPtr(req.Diagnosis)
	}
	if req.ChiefComplaint != nil {
		in.ChiefComplaint = optionalTextFromPtr(req.ChiefComplaint)
	}
	if req.PTEvaluation != nil {
		in.PTEvaluation = optionalTextFromPtr(req.PTEvaluation)
	}
	if req.MedicalHistory != nil {
		in.MedicalHistory = optionalTextFromPtr(req.MedicalHistory)
	}
	if req.Precautions != nil {
		in.Precautions = optionalTextFromPtr(req.Precautions)
	}
	if req.TreatmentGoals != nil {
		in.TreatmentGoals = optionalTextFromPtr(req.TreatmentGoals)
	}
	if req.ReferredBy != nil {
		in.ReferredBy = optionalTextFromPtr(req.ReferredBy)
	}
	if req.DateOfBirth != nil {
		dob, err := parseOptionalDate(req.DateOfBirth)
		if err != nil {
			badRequest(w, err)
			return
		}
		in.DateOfBirth = store.OptionalDate{Set: true, Value: dob}
	}
	if req.Status != nil {
		st := model.PatientStatus(*req.Status)
		if !st.Valid() {
			badRequest(w, errors.New("invalid status"))
			return
		}
		in.Status = &st
	}

	p, err := s.store.UpdatePatient(r.Context(), ownerIDFrom(r.Context()), id, in)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update patient")
		return
	}
	writeJSON(w, http.StatusOK, toPatientDTO(*p))
}

func trimPtr(v *string) *string {
	if v == nil {
		return nil
	}
	t := strings.TrimSpace(*v)
	if t == "" {
		return nil
	}
	return &t
}

func optionalTextFromPtr(v *string) store.OptionalText {
	return store.OptionalText{Set: true, Value: trimPtr(v)}
}

func parseOptionalDate(raw *string) (*time.Time, error) {
	if raw == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*raw)
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil, errors.New("dateOfBirth must be YYYY-MM-DD")
	}
	return &t, nil
}
