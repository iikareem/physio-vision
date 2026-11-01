package files

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

type Storage struct {
	root string
}

func New(root string) (*Storage, error) {
	if err := os.MkdirAll(root, 0o755); err != nil {
		return nil, fmt.Errorf("create upload dir: %w", err)
	}
	return &Storage{root: root}, nil
}

func (s *Storage) Root() string {
	return s.root
}

// Save writes the file under ownerID/ and returns a relative storage key.
func (s *Storage) Save(ownerID, originalName string, r io.Reader) (key string, size int64, err error) {
	safe := sanitizeFileName(originalName)
	id, err := randomID()
	if err != nil {
		return "", 0, err
	}
	key = filepath.ToSlash(filepath.Join(ownerID, id+"_"+safe))
	abs := filepath.Join(s.root, filepath.FromSlash(key))
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", 0, err
	}

	f, err := os.Create(abs)
	if err != nil {
		return "", 0, err
	}
	defer f.Close()

	n, err := io.Copy(f, r)
	if err != nil {
		_ = os.Remove(abs)
		return "", 0, err
	}
	return key, n, nil
}

func (s *Storage) Open(key string) (*os.File, error) {
	clean := filepath.Clean(filepath.FromSlash(key))
	if strings.HasPrefix(clean, "..") || filepath.IsAbs(clean) {
		return nil, fmt.Errorf("invalid storage key")
	}
	abs := filepath.Join(s.root, clean)
	rel, err := filepath.Rel(s.root, abs)
	if err != nil || strings.HasPrefix(rel, "..") {
		return nil, fmt.Errorf("invalid storage key")
	}
	return os.Open(abs)
}

func randomID() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func sanitizeFileName(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, " ", "_")
	var b strings.Builder
	for _, r := range name {
		switch {
		case r >= 'a' && r <= 'z',
			r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9',
			r == '.', r == '-', r == '_':
			b.WriteRune(r)
		}
	}
	out := b.String()
	if out == "" || out == "." || out == ".." {
		return "file"
	}
	return out
}
