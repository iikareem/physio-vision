package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"physio-vision/backend/internal/auth"
	"physio-vision/backend/internal/store"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	Token string  `json:"token"`
	User  userDTO `json:"user"`
}

func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := readJSON(r, &req); err != nil {
		badRequest(w, errors.New("invalid json body"))
		return
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		badRequest(w, errors.New("email and password are required"))
		return
	}

	user, err := s.store.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusUnauthorized, auth.ErrInvalidCredentials.Error())
			return
		}
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}
	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, auth.ErrInvalidCredentials.Error())
		return
	}

	token, err := s.auth.IssueToken(user.ID, user.Email)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "login failed")
		return
	}
	writeJSON(w, http.StatusOK, loginResponse{
		Token: token,
		User:  toUserDTO(*user),
	})
}

func (s *Server) handleMe(w http.ResponseWriter, r *http.Request) {
	user, err := s.store.GetUserByID(r.Context(), ownerIDFrom(r.Context()))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusUnauthorized, "user not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to load user")
		return
	}
	writeJSON(w, http.StatusOK, toUserDTO(*user))
}
