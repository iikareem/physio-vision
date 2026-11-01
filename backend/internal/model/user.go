package model

import "time"

// User is the single therapist who owns all patient data.
type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash string
	CreatedAt    time.Time
}
