package model

// Workspace isolates Clinic vs Private caseloads for one therapist.
type Workspace string

const (
	WorkspaceClinic  Workspace = "clinic"
	WorkspacePrivate Workspace = "private"
)

func (w Workspace) Valid() bool {
	return w == WorkspaceClinic || w == WorkspacePrivate
}
