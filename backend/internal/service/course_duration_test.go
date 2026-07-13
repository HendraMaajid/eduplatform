package service

import "testing"

func TestValidateCourseDuration(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{name: "one week", value: "1 Minggu"},
		{name: "multiple weeks", value: "12 Minggu"},
		{name: "missing unit", value: "8", wantErr: true},
		{name: "wrong unit", value: "8 Jam", wantErr: true},
		{name: "zero", value: "0 Minggu", wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			err := validateCourseDuration(test.value)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateCourseDuration(%q) error = %v, wantErr %t", test.value, err, test.wantErr)
			}
		})
	}
}

func TestValidateModuleDuration(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{name: "one hour", value: "1 Jam"},
		{name: "multiple hours", value: "3 Jam"},
		{name: "missing unit", value: "2", wantErr: true},
		{name: "wrong unit", value: "2 Minggu", wantErr: true},
		{name: "zero", value: "0 Jam", wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			err := validateModuleDuration(test.value)
			if (err != nil) != test.wantErr {
				t.Fatalf("validateModuleDuration(%q) error = %v, wantErr %t", test.value, err, test.wantErr)
			}
		})
	}
}
