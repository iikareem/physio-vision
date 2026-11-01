package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"physio-vision/backend/internal/auth"
	"physio-vision/backend/internal/config"
	"physio-vision/backend/internal/files"
	"physio-vision/backend/internal/httpapi"
	"physio-vision/backend/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	ctx := context.Background()
	pool, err := store.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer pool.Close()

	if err := store.Migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	passwordHash, err := auth.HashPassword(cfg.AuthPassword)
	if err != nil {
		log.Fatalf("hash password: %v", err)
	}

	st := store.New(pool)
	user, err := st.EnsureUser(ctx, strings.ToLower(cfg.AuthEmail), cfg.AuthName, passwordHash)
	if err != nil {
		log.Fatalf("bootstrap user: %v", err)
	}
	log.Printf("owner ready: %s (%s)", user.Email, user.ID)

	fileStore, err := files.New(cfg.UploadDir)
	if err != nil {
		log.Fatalf("uploads: %v", err)
	}
	log.Printf("uploads dir: %s", fileStore.Root())

	authSvc := auth.NewService(cfg.JWTSecret)
	server := httpapi.NewServer(st, authSvc, fileStore, cfg.CORSOrigins)

	httpServer := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           server.Router(),
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		log.Printf("listening on %s", cfg.HTTPAddr)
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = httpServer.Shutdown(shutdownCtx)
}
