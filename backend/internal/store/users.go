package store

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"physio-vision/backend/internal/model"
)

func (s *Store) EnsureUser(ctx context.Context, email, name, passwordHash string) (*model.User, error) {
	const q = `
		INSERT INTO users (email, name, password_hash)
		VALUES ($1, $2, $3)
		ON CONFLICT (email) DO UPDATE
			SET name = EXCLUDED.name,
			    password_hash = EXCLUDED.password_hash
		RETURNING id, email, name, password_hash, created_at
	`
	var u model.User
	err := s.pool.QueryRow(ctx, q, email, name, passwordHash).Scan(
		&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("ensure user: %w", err)
	}
	return &u, nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	const q = `
		SELECT id, email, name, password_hash, created_at
		FROM users
		WHERE email = $1
	`
	var u model.User
	err := s.pool.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (s *Store) GetUserByID(ctx context.Context, id string) (*model.User, error) {
	const q = `
		SELECT id, email, name, password_hash, created_at
		FROM users
		WHERE id = $1
	`
	var u model.User
	err := s.pool.QueryRow(ctx, q, id).Scan(
		&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}
