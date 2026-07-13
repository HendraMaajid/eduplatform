package handler

import "testing"

func TestParsePositiveInt(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name     string
		value    string
		fallback int
		want     int
	}{
		{name: "valid", value: "9", fallback: 1, want: 9},
		{name: "surrounding whitespace", value: " 20 ", fallback: 10, want: 20},
		{name: "empty", value: "", fallback: 10, want: 10},
		{name: "not a number", value: "abc", fallback: 10, want: 10},
		{name: "zero", value: "0", fallback: 10, want: 10},
		{name: "negative", value: "-4", fallback: 10, want: 10},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if got := parsePositiveInt(test.value, test.fallback); got != test.want {
				t.Fatalf("parsePositiveInt(%q, %d) = %d, want %d", test.value, test.fallback, got, test.want)
			}
		})
	}
}
