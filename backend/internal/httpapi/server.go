package httpapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"physio-vision/backend/internal/auth"
	"physio-vision/backend/internal/files"
	"physio-vision/backend/internal/store"
)

type Server struct {
	store       *store.Store
	auth        *auth.Service
	files       *files.Storage
	corsOrigins []string
}

func NewServer(st *store.Store, authSvc *auth.Service, fileStore *files.Storage, corsOrigins []string) *Server {
	return &Server{
		store:       st,
		auth:        authSvc,
		files:       fileStore,
		corsOrigins: corsOrigins,
	}
}

func (s *Server) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(corsMiddleware(s.corsOrigins))

	r.Get("/healthz", s.handleHealthz)
	r.Post("/auth/login", s.handleLogin)

	r.Group(func(pr chi.Router) {
		pr.Use(s.requireAuth)
		pr.Get("/me", s.handleMe)
		pr.Get("/analytics", s.handleAnalytics)

		pr.Get("/patients", s.handleListPatients)
		pr.Post("/patients", s.handleCreatePatient)
		pr.Get("/patients/{id}", s.handleGetPatient)
		pr.Patch("/patients/{id}", s.handleUpdatePatient)

		pr.Get("/patients/{id}/notes", s.handleListNotes)
		pr.Post("/patients/{id}/notes", s.handleCreateNote)
		pr.Get("/patients/{id}/documents", s.handleListDocuments)
		pr.Post("/patients/{id}/documents", s.handleCreateDocument)

		pr.Get("/documents/{id}/file", s.handleDownloadDocument)

		pr.Get("/appointments", s.handleListAppointments)
		pr.Post("/appointments", s.handleCreateAppointment)
		pr.Get("/appointments/{id}", s.handleGetAppointment)
		pr.Patch("/appointments/{id}", s.handleUpdateAppointment)
	})

	return r
}

func (s *Server) handleHealthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
