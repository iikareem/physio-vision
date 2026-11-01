package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL  string
	AuthEmail    string
	AuthPassword string
	AuthName     string
	JWTSecret    string
	HTTPAddr     string
	CORSOrigins  []string
	UploadDir    string
}

func Load() (Config, error) {
	cfg := Config{
		DatabaseURL:  os.Getenv("DATABASE_URL"),
		AuthEmail:    os.Getenv("AUTH_EMAIL"),
		AuthPassword: os.Getenv("AUTH_PASSWORD"),
		AuthName:     envOr("AUTH_NAME", "Therapist"),
		JWTSecret:    os.Getenv("JWT_SECRET"),
		HTTPAddr:     envOr("HTTP_ADDR", ":8080"),
		CORSOrigins:  splitCSV(envOr("CORS_ORIGINS", "http://localhost:3000")),
		UploadDir:    envOr("UPLOAD_DIR", "/data/uploads"),
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.AuthEmail == "" {
		missing = append(missing, "AUTH_EMAIL")
	}
	if cfg.AuthPassword == "" {
		missing = append(missing, "AUTH_PASSWORD")
	}
	if cfg.JWTSecret == "" {
		missing = append(missing, "JWT_SECRET")
	}
	if len(missing) > 0 {
		return Config{}, fmt.Errorf("missing required env: %s", strings.Join(missing, ", "))
	}
	return cfg, nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}
