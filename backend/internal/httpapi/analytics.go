package httpapi

import (
	"errors"
	"net/http"
	"time"

	"physio-vision/backend/internal/analytics"
)

func (s *Server) handleAnalytics(w http.ResponseWriter, r *http.Request) {
	workspace, err := parseWorkspace(r.URL.Query().Get("workspace"))
	if err != nil {
		badRequest(w, err)
		return
	}

	period := analytics.Period(r.URL.Query().Get("period"))
	if period == "" {
		period = analytics.PeriodDay
	}
	if !period.Valid() {
		badRequest(w, errors.New("period must be day, month, or year"))
		return
	}

	rawDate := r.URL.Query().Get("date")
	if rawDate == "" {
		rawDate = time.Now().UTC().Format("2006-01-02")
	}
	selected, err := time.ParseInLocation("2006-01-02", rawDate, time.Local)
	if err != nil {
		badRequest(w, errors.New("date must be YYYY-MM-DD"))
		return
	}

	start, end, _, _ := analytics.SelectedRange(period, selected)
	ownerID := ownerIDFrom(r.Context())

	appointments, err := s.store.ListAppointmentsInRange(r.Context(), ownerID, workspace, start, end)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load appointments")
		return
	}
	patients, err := s.store.ListPatientsForWorkspace(r.Context(), ownerID, workspace)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to load patients")
		return
	}

	summary := analytics.Compute(appointments, patients, period, selected)
	writeJSON(w, http.StatusOK, summary)
}
