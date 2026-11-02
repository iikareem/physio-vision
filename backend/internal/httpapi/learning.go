package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"physio-vision/backend/internal/store"
)

func (s *Server) handleListLearning(w http.ResponseWriter, r *http.Request) {
	// Learning is shared across clinic + private; workspace query is ignored if present.
	f := store.ListLearningFilter{}
	if pid := strings.TrimSpace(r.URL.Query().Get("patientId")); pid != "" {
		f.PatientID = &pid
	} else if r.URL.Query().Get("scope") == "general" {
		f.General = true
	}
	if raw := r.URL.Query().Get("done"); raw == "true" || raw == "false" {
		done := raw == "true"
		f.Done = &done
	}

	items, err := s.store.ListLearningItems(r.Context(), ownerIDFrom(r.Context()), f)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list learning items")
		return
	}
	writeJSON(w, http.StatusOK, toLearningDTOs(items))
}

func (s *Server) handleListPatientLearning(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	items, err := s.store.ListLearningItemsForPatient(r.Context(), ownerIDFrom(r.Context()), patientID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to list learning items")
		return
	}
	writeJSON(w, http.StatusOK, toLearningDTOs(items))
}

type createLearningRequest struct {
	WorkspaceID string  `json:"workspaceId"`
	PatientID   *string `json:"patientId"`
	Body        string  `json:"body"`
}

func (s *Server) handleCreateLearning(w http.ResponseWriter, r *http.Request) {
	var req createLearningRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}

	workspace, err := parseWorkspace(req.WorkspaceID)
	if err != nil {
		badRequest(w, err)
		return
	}
	body := strings.TrimSpace(req.Body)
	if body == "" {
		badRequest(w, errors.New("body is required"))
		return
	}

	item, err := s.store.CreateLearningItem(r.Context(), ownerIDFrom(r.Context()), store.CreateLearningInput{
		Workspace: workspace,
		PatientID: trimPtr(req.PatientID),
		Body:      body,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create learning item")
		return
	}
	writeJSON(w, http.StatusCreated, toLearningDTO(*item))
}

func (s *Server) handleCreatePatientLearning(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	var req struct {
		Body string `json:"body"`
	}
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}
	body := strings.TrimSpace(req.Body)
	if body == "" {
		badRequest(w, errors.New("body is required"))
		return
	}

	patient, err := s.store.GetPatient(r.Context(), ownerIDFrom(r.Context()), patientID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load patient")
		return
	}

	item, err := s.store.CreateLearningItem(r.Context(), ownerIDFrom(r.Context()), store.CreateLearningInput{
		Workspace: patient.Workspace,
		PatientID: &patientID,
		Body:      body,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create learning item")
		return
	}
	writeJSON(w, http.StatusCreated, toLearningDTO(*item))
}

type updateLearningRequest struct {
	Body *string `json:"body"`
	Done *bool   `json:"done"`
}

func (s *Server) handleUpdateLearning(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req updateLearningRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}
	if req.Body == nil && req.Done == nil {
		badRequest(w, errors.New("body or done is required"))
		return
	}

	in := store.UpdateLearningInput{Done: req.Done}
	if req.Body != nil {
		trimmed := strings.TrimSpace(*req.Body)
		if trimmed == "" {
			badRequest(w, errors.New("body cannot be empty"))
			return
		}
		in.Body = &trimmed
	}

	item, err := s.store.UpdateLearningItem(r.Context(), ownerIDFrom(r.Context()), id, in)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "learning item not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update learning item")
		return
	}
	writeJSON(w, http.StatusOK, toLearningDTO(*item))
}

func (s *Server) handleDeleteLearning(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	err := s.store.DeleteLearningItem(r.Context(), ownerIDFrom(r.Context()), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "learning item not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to delete learning item")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
