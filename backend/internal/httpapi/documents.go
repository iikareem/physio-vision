package httpapi

import (
	"errors"
	"io"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"physio-vision/backend/internal/store"
)

const maxUploadBytes = 32 << 20 // 32 MiB

func (s *Server) handleListDocuments(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	items, err := s.store.ListDocumentsForPatient(r.Context(), ownerIDFrom(r.Context()), patientID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to list documents")
		return
	}
	writeJSON(w, http.StatusOK, toDocumentDTOs(items))
}

func (s *Server) handleCreateDocument(w http.ResponseWriter, r *http.Request) {
	patientID := chi.URLParam(r, "id")
	ownerID := ownerIDFrom(r.Context())

	if err := r.ParseMultipartForm(maxUploadBytes); err != nil {
		badRequest(w, errors.New("expected multipart form with file"))
		return
	}

	label := strings.TrimSpace(r.FormValue("label"))
	docType := strings.TrimSpace(r.FormValue("type"))
	appointmentID := strings.TrimSpace(r.FormValue("appointmentId"))

	file, header, err := r.FormFile("file")
	if err != nil {
		badRequest(w, errors.New("file is required"))
		return
	}
	defer file.Close()

	if label == "" {
		label = strings.TrimSpace(header.Filename)
	}
	if label == "" {
		badRequest(w, errors.New("label is required"))
		return
	}
	if docType == "" {
		docType = "File"
	}

	var apptPtr *string
	if appointmentID != "" {
		apptPtr = &appointmentID
	}

	key, size, err := s.files.Save(ownerID, header.Filename, file)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to store file")
		return
	}

	contentType := header.Header.Get("Content-Type")
	var ctPtr *string
	if contentType != "" {
		ctPtr = &contentType
	}

	d, err := s.store.CreateDocument(r.Context(), ownerID, store.CreateDocumentInput{
		PatientID:     patientID,
		AppointmentID: apptPtr,
		Label:         label,
		Type:          docType,
		FileName:      filepath.Base(header.Filename),
		StorageKey:    key,
		ContentType:   ctPtr,
		ByteSize:      &size,
	})
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "patient or appointment not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to create document")
		return
	}
	writeJSON(w, http.StatusCreated, toDocumentDTO(*d))
}

func (s *Server) handleDownloadDocument(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	ownerID := ownerIDFrom(r.Context())

	doc, err := s.store.GetDocument(r.Context(), ownerID, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusNotFound, "document not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load document")
		return
	}

	f, err := s.files.Open(doc.StorageKey)
	if err != nil {
		writeError(w, http.StatusNotFound, "file missing")
		return
	}
	defer f.Close()

	if doc.ContentType != nil && *doc.ContentType != "" {
		w.Header().Set("Content-Type", *doc.ContentType)
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}
	w.Header().Set("Content-Disposition", `attachment; filename="`+doc.FileName+`"`)
	if doc.ByteSize != nil {
		w.Header().Set("Content-Length", strconv.FormatInt(*doc.ByteSize, 10))
	}
	_, _ = io.Copy(w, f)
}
