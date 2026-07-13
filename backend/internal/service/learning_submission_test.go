package service

import "testing"

func TestCalculateWeightedProgress(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name    string
		modules int
		counts  learningRequirementCounts
		want    int
	}{
		{"nothing completed", 0, learningRequirementCounts{TotalModules: 4, TotalQuizzes: 2, TotalAssignments: 1}, 0},
		{"half modules", 2, learningRequirementCounts{TotalModules: 4, TotalQuizzes: 2, TotalAssignments: 1}, 25},
		{"modules and quiz", 4, learningRequirementCounts{TotalModules: 4, TotalQuizzes: 2, CompletedQuizzes: 2, TotalAssignments: 1}, 75},
		{"all requirements", 4, learningRequirementCounts{TotalModules: 4, TotalQuizzes: 2, CompletedQuizzes: 2, TotalAssignments: 1, GradedAssignments: 1}, 100},
		{"empty optional categories", 1, learningRequirementCounts{TotalModules: 1}, 100},
		{"caps duplicate completion", 8, learningRequirementCounts{TotalModules: 2, TotalQuizzes: 1, CompletedQuizzes: 2, TotalAssignments: 1, GradedAssignments: 2}, 100},
	}
	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if got := calculateWeightedProgress(test.modules, test.counts); got != test.want {
				t.Fatalf("calculateWeightedProgress() = %d, want %d", got, test.want)
			}
		})
	}
}
