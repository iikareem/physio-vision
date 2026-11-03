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

func (s *Server) handleListAppointments(w http.ResponseWriter, r *http.Request) {
	workspace, err := parseWorkspace(r.URL.Query().Get("workspace"))
	if err != nil {
		badRequest(w, err)
		return
	}

	f := store.ListAppointmentsFilter{Workspace: workspace}
	if pid := strings.TrimSpace(r.URL.Query().Get("patientId")); pid != "" {
		f.PatientID = &pid
	}
	if raw := r.URL.Query().Get("date"); raw != "" {
		day, err := time.Parse("2006-01-02", raw)
		if err != nil {
			badRequest(w, errors.New("date must be YYYY-MM-DD"))
			return
		}
		f.Date = &day
	}

	items, err := s.store.ListAppointments(r.Context(), ownerIDFrom(r.Context()), f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list appointments")
		return
	}
	writeJSON(w, http.StatusOK, toAppointmentDTOs(items))
}

type createAppointmentRequest struct {
	WorkspaceID string    `json:"workspaceId"`
	PatientID   string    `json:"patientId"`
	StartsAt    time.Time `json:"startsAt"`
	Type        string    `json:"type"`
}

func (s *Server) handleCreateAppointment(w http.ResponseWriter, r *http.Request) {
	var req createAppointmentRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}

	workspace, err := parseWorkspace(req.WorkspaceID)
	if err != nil {
		badRequest(w, err)
		return
	}
	req.PatientID = strings.TrimSpace(req.PatientID)
	req.Type = strings.TrimSpace(req.Type)
	if req.PatientID == "" || req.Type == "" || req.StartsAt.IsZero() {
		badRequest(w, errors.New("patientId, startsAt, and type are required"))
		return
	}

	a, err := s.store.CreateAppointment(r.Context(), ownerIDFrom(r.Context()), store.CreateAppointmentInput{
		PatientID: req.PatientID,
		Workspace: workspace,
		StartsAt:  req.StartsAt.UTC(),
		Type:      req.Type,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create appointment")
		return
	}
	writeJSON(w, http.StatusCreated, toAppointmentDTO(*a))
}

func (s *Server) handleGetAppointment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	a, err := s.store.GetAppointment(r.Context(), ownerIDFrom(r.Context()), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "appointment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get appointment")
		return
	}
	writeJSON(w, http.StatusOK, toAppointmentDTO(*a))
}

type updateAppointmentRequest struct {
	StartsAt *time.Time `json:"startsAt"`
	Status   *string    `json:"status"`
	Type     *string    `json:"type"`
	Summary  *string    `json:"summary"`
}

func (s *Server) handleUpdateAppointment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateAppointmentRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}

	in := store.UpdateAppointmentInput{}
	if req.StartsAt != nil {
		t := req.StartsAt.UTC()
		in.StartsAt = &t
	}
	if req.Type != nil {
		v := strings.TrimSpace(*req.Type)
		if v == "" {
			badRequest(w, errors.New("type cannot be empty"))
			return
		}
		in.Type = &v
	}
	if req.Status != nil {
		st := model.AppointmentStatus(*req.Status)
		if !st.Valid() {
			badRequest(w, errors.New("invalid status"))
			return
		}
		in.Status = &st
	}
	if req.Summary != nil {
		if strings.TrimSpace(*req.Summary) == "" {
			in.ClearSum = true
		} else {
			in.Summary = trimPtr(req.Summary)
		}
	}

	a, err := s.store.UpdateAppointment(r.Context(), ownerIDFrom(r.Context()), id, in)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "appointment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update appointment")
		return
	}
	writeJSON(w, http.StatusOK, toAppointmentDTO(*a))
}

func (s *Server) handleDeleteAppointment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := s.store.DeleteAppointment(r.Context(), ownerIDFrom(r.Context()), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "appointment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to delete appointment")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
