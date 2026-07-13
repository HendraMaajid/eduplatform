package service

import "testing"

func TestCanAssignRole(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name      string
		actorRole string
		target    string
		want      bool
	}{
		{"super admin creates super admin", "super_admin", "super_admin", true},
		{"super admin creates teacher", "super_admin", "teacher", true},
		{"admin creates teacher", "admin", "teacher", true},
		{"admin creates student", "admin", "student", true},
		{"admin cannot create admin", "admin", "admin", false},
		{"admin cannot create super admin", "admin", "super_admin", false},
		{"teacher cannot assign role", "teacher", "student", false},
	}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if got := canAssignRole(test.actorRole, test.target); got != test.want {
				t.Fatalf("canAssignRole(%q, %q) = %t, want %t", test.actorRole, test.target, got, test.want)
			}
		})
	}
}

func TestIsSafeResourceURL(t *testing.T) {
	t.Parallel()
	tests := []struct {
		value string
		want  bool
	}{
		{"", true},
		{"https://example.com/course.png", true},
		{"http://localhost:8080/uploads/course.png", true},
		{"/uploads/course.png", true},
		{"/uploads/../secrets.txt", false},
		{"javascript:alert(1)", false},
		{"data:image/svg+xml,<svg onload=alert(1)>", false},
		{"//example.com/file", false},
		{"https://user:password@example.com/file", false},
	}
	for _, test := range tests {
		test := test
		t.Run(test.value, func(t *testing.T) {
			t.Parallel()
			if got := isSafeResourceURL(test.value); got != test.want {
				t.Fatalf("isSafeResourceURL(%q) = %t, want %t", test.value, got, test.want)
			}
		})
	}
}
