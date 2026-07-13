package service

import (
	"reflect"
	"testing"
)

func TestStudentDashboardComputedFieldsAreIgnoredByGORM(t *testing.T) {
	statsType := reflect.TypeOf(StudentDashboardStats{})
	for _, fieldName := range []string{"UpcomingDeadlines", "RecentActivities"} {
		t.Run(fieldName, func(t *testing.T) {
			field, ok := statsType.FieldByName(fieldName)
			if !ok {
				t.Fatalf("field %s not found", fieldName)
			}
			if got := field.Tag.Get("gorm"); got != "-" {
				t.Fatalf("gorm tag = %q, want -", got)
			}
		})
	}
}

func TestAdminDashboardComputedFieldsAreIgnoredByGORM(t *testing.T) {
	statsType := reflect.TypeOf(AdminDashboardStats{})
	for _, fieldName := range []string{"WeeklyActivity", "ProgressBreakdown"} {
		t.Run(fieldName, func(t *testing.T) {
			field, ok := statsType.FieldByName(fieldName)
			if !ok {
				t.Fatalf("field %s not found", fieldName)
			}
			if got := field.Tag.Get("gorm"); got != "-" {
				t.Fatalf("gorm tag = %q, want -", got)
			}
		})
	}
}
