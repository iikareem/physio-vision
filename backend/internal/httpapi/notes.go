package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"

	"physio-vision/backend/internal/store"
)

func (s *Server) handleListNotes(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	items, err := s.store.ListNotesForPatient(r.Context(), ownerIDFrom(r.Context()), patientID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to list notes")
		return
	}
	writeJSON(w, http.StatusOK, toNoteDTOs(items))
}

type createNoteRequest struct {
	Body          string  `json:"body"`
	AppointmentID *string `json:"appointmentId"`
}

func (s *Server) handleCreateNote(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	var req createNoteRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}
	body := strings.TrimSpace(req.Body)
	if body == "" {
		badRequest(w, errors.New("body is required"))
		return
	}

	n, err := s.store.CreateNote(r.Context(), ownerIDFrom(r.Context()), store.CreateNoteInput{
		PatientID:     patientID,
		AppointmentID: trimPtr(req.AppointmentID),
		Body:          body,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient or appointment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create note")
		return
	}
	writeJSON(w, http.StatusCreated, toNoteDTO(*n))
}
