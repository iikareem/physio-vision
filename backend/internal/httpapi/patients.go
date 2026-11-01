package httpapi

import (
	"errors"
	"net/http"
	"strings"

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
	WorkspaceID string  `json:"workspaceId"`
	Name        string  `json:"name"`
	Phone       *string `json:"phone"`
	Condition   string  `json:"condition"`
	Status      string  `json:"status"`
	ReferredBy  *string `json:"referredBy"`
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
	req.Condition = strings.TrimSpace(req.Condition)
	if req.Name == "" || req.Condition == "" {
		badRequest(w, errors.New("name and condition are required"))
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
	if status == model.PatientTransferred {
		if req.ReferredBy == nil || strings.TrimSpace(*req.ReferredBy) == "" {
			badRequest(w, errors.New("referredBy is required when status is transferred"))
			return
		}
	}

	p, err := s.store.CreatePatient(r.Context(), ownerIDFrom(r.Context()), store.CreatePatientInput{
		Workspace:  workspace,
		Name:       req.Name,
		Phone:      trimPtr(req.Phone),
		Condition:  req.Condition,
		Status:     status,
		ReferredBy: trimPtr(req.ReferredBy),
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
	Name       *string `json:"name"`
	Phone      *string `json:"phone"`
	Condition  *string `json:"condition"`
	Status     *string `json:"status"`
	ReferredBy *string `json:"referredBy"`
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
		if v == "" {
			badRequest(w, errors.New("condition cannot be empty"))
			return
		}
		in.Condition = &v
	}
	if req.Phone != nil {
		if strings.TrimSpace(*req.Phone) == "" {
			in.ClearPhone = true
		} else {
			in.Phone = trimPtr(req.Phone)
		}
	}
	if req.Status != nil {
		st := model.PatientStatus(*req.Status)
		if !st.Valid() {
			badRequest(w, errors.New("invalid status"))
			return
		}
		in.Status = &st
	}
	if req.ReferredBy != nil {
		if strings.TrimSpace(*req.ReferredBy) == "" {
			in.ClearRef = true
		} else {
			in.ReferredBy = trimPtr(req.ReferredBy)
		}
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
