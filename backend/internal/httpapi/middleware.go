package httpapi

import (
	"context"
	"net/http"
	"strings"
)

type ctxKey int

const ownerIDKey ctxKey = 1

func ownerIDFrom(ctx context.Context) string {
	v, _ := ctx.Value(ownerIDKey).(string)
	return v
}

func (s *Server) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing bearer token")
			return
		}
		token := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		claims, err := s.auth.ParseToken(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := context.WithValue(r.Context(), ownerIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
