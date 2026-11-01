package analytics

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"physio-vision/backend/internal/model"
)

type Period string

const (
	PeriodDay   Period = "day"
	PeriodMonth Period = "month"
	PeriodYear  Period = "year"
)

func (p Period) Valid() bool {
	return p == PeriodDay || p == PeriodMonth || p == PeriodYear
}

type Bucket struct {
	Key            string `json:"key"`
	Label          string `json:"label"`
	Sessions       int    `json:"sessions"`
	UniquePatients int    `json:"uniquePatients"`
	Done           int    `json:"done"`
}

type TypeBreakdown struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
	Pct   int    `json:"pct"`
}

type TopPatient struct {
	PatientID string `json:"patientId"`
	Name      string `json:"name"`
	Condition string `json:"condition"`
	Sessions  int    `json:"sessions"`
	Done      int    `json:"done"`
}

type Summary struct {
	Period         Period          `json:"period"`
	RangeLabel     string          `json:"rangeLabel"`
	ChartLabel     string          `json:"chartLabel"`
	TotalSessions  int             `json:"totalSessions"`
	UniquePatients int             `json:"uniquePatients"`
	DoneSessions   int             `json:"doneSessions"`
	NewPatients    int             `json:"newPatients"`
	Buckets        []Bucket        `json:"buckets"`
	ByType         []TypeBreakdown `json:"byType"`
	TopPatients    []TopPatient    `json:"topPatients"`
}

func SelectedRange(period Period, selected time.Time) (start, end time.Time, label, chartLabel string) {
	y, m, d := selected.Date()
	loc := selected.Location()

	switch period {
	case PeriodDay:
		start = time.Date(y, m, d, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 0, 1)
		label = start.Format("Monday, January 2, 2006")
		chartLabel = "By status"
	case PeriodMonth:
		start = time.Date(y, m, 1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 1, 0)
		label = start.Format("January 2006")
		chartLabel = "Sessions by day"
	default:
		start = time.Date(y, time.January, 1, 0, 0, 0, 0, loc)
		end = start.AddDate(1, 0, 0)
		label = fmt.Sprintf("%d", y)
		chartLabel = "Sessions by month"
	}
	return start, end, label, chartLabel
}

func Compute(
	appointments []model.Appointment,
	patients []model.Patient,
	period Period,
	selected time.Time,
) Summary {
	start, end, rangeLabel, chartLabel := SelectedRange(period, selected)
	buckets := buildBuckets(period, selected)
	bucketIndex := map[string]int{}
	for i, b := range buckets {
		bucketIndex[b.Key] = i
	}
	patientsInBucket := map[string]map[string]struct{}{}

	inWindow := make([]model.Appointment, 0)
	for _, a := range appointments {
		if !a.StartsAt.Before(start) && a.StartsAt.Before(end) {
			inWindow = append(inWindow, a)
		}
	}

	for _, a := range inWindow {
		key := bucketKeyFor(period, a)
		idx, ok := bucketIndex[key]
		if !ok {
			continue
		}
		buckets[idx].Sessions++
		if a.Status == model.AppointmentDone {
			buckets[idx].Done++
		}
		set := patientsInBucket[key]
		if set == nil {
			set = map[string]struct{}{}
			patientsInBucket[key] = set
		}
		set[a.PatientID] = struct{}{}
	}
	for i := range buckets {
		buckets[i].UniquePatients = len(patientsInBucket[buckets[i].Key])
	}

	unique := map[string]struct{}{}
	doneSessions := 0
	for _, a := range inWindow {
		unique[a.PatientID] = struct{}{}
		if a.Status == model.AppointmentDone {
			doneSessions++
		}
	}

	newPatients := 0
	for _, p := range patients {
		if !p.CreatedAt.Before(start) && p.CreatedAt.Before(end) {
			newPatients++
		}
	}

	typeCounts := map[string]int{}
	for _, a := range inWindow {
		t := strings.TrimSpace(a.Type)
		if t == "" {
			t = "Session"
		}
		typeCounts[t]++
	}
	totalForType := len(inWindow)
	if totalForType == 0 {
		totalForType = 1
	}
	byType := make([]TypeBreakdown, 0, len(typeCounts))
	for t, c := range typeCounts {
		byType = append(byType, TypeBreakdown{
			Type:  t,
			Count: c,
			Pct:   int(float64(c)/float64(totalForType)*100 + 0.5),
		})
	}
	sort.Slice(byType, func(i, j int) bool { return byType[i].Count > byType[j].Count })

	patientCounts := map[string]struct{ sessions, done int }{}
	for _, a := range inWindow {
		cur := patientCounts[a.PatientID]
		cur.sessions++
		if a.Status == model.AppointmentDone {
			cur.done++
		}
		patientCounts[a.PatientID] = cur
	}
	byID := map[string]model.Patient{}
	for _, p := range patients {
		byID[p.ID] = p
	}
	top := make([]TopPatient, 0, len(patientCounts))
	for id, stats := range patientCounts {
		p := byID[id]
		name := p.Name
		if name == "" {
			name = "Unknown patient"
		}
		top = append(top, TopPatient{
			PatientID: id,
			Name:      name,
			Condition: p.Condition,
			Sessions:  stats.sessions,
			Done:      stats.done,
		})
	}
	sort.Slice(top, func(i, j int) bool {
		if top[i].Sessions != top[j].Sessions {
			return top[i].Sessions > top[j].Sessions
		}
		return top[i].Name < top[j].Name
	})
	if len(top) > 8 {
		top = top[:8]
	}

	return Summary{
		Period:         period,
		RangeLabel:     rangeLabel,
		ChartLabel:     chartLabel,
		TotalSessions:  len(inWindow),
		UniquePatients: len(unique),
		DoneSessions:   doneSessions,
		NewPatients:    newPatients,
		Buckets:        buckets,
		ByType:         byType,
		TopPatients:    top,
	}
}

func buildBuckets(period Period, selected time.Time) []Bucket {
	y, m, _ := selected.Date()
	loc := selected.Location()

	switch period {
	case PeriodDay:
		return []Bucket{
			{Key: "done", Label: "Finished"},
			{Key: "open", Label: "Open"},
			{Key: "no_show", Label: "Skipped"},
		}
	case PeriodMonth:
		days := time.Date(y, m+1, 0, 0, 0, 0, 0, loc).Day()
		out := make([]Bucket, 0, days)
		for day := 1; day <= days; day++ {
			d := time.Date(y, m, day, 0, 0, 0, 0, loc)
			out = append(out, Bucket{
				Key:   fmt.Sprintf("%d", day),
				Label: d.Format("Mon 2"),
			})
		}
		return out
	default:
		out := make([]Bucket, 0, 12)
		for month := time.January; month <= time.December; month++ {
			d := time.Date(y, month, 1, 0, 0, 0, 0, loc)
			out = append(out, Bucket{
				Key:   fmt.Sprintf("%d", int(month)-1),
				Label: d.Format("Jan"),
			})
		}
		return out
	}
}

func bucketKeyFor(period Period, a model.Appointment) string {
	switch period {
	case PeriodDay:
		switch a.Status {
		case model.AppointmentDone:
			return "done"
		case model.AppointmentNoShow:
			return "no_show"
		default:
			return "open"
		}
	case PeriodMonth:
		return fmt.Sprintf("%d", a.StartsAt.Day())
	default:
		return fmt.Sprintf("%d", int(a.StartsAt.Month())-1)
	}
}
