package seed

import (
	"strings"
	"testing"
)

func TestConfigValidate(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		config  Config
		wantErr string
	}{
		{
			name: "valid",
			config: Config{
				SuperAdminName:     "Hendra Latief Ulum",
				SuperAdminEmail:    DefaultSuperAdminEmail,
				SuperAdminPassword: "local-password-only",
			},
		},
		{
			name: "missing name",
			config: Config{
				SuperAdminEmail:    DefaultSuperAdminEmail,
				SuperAdminPassword: "local-password-only",
			},
			wantErr: "name is required",
		},
		{
			name: "unexpected email",
			config: Config{
				SuperAdminName:     "Admin",
				SuperAdminEmail:    "other@example.com",
				SuperAdminPassword: "local-password-only",
			},
			wantErr: DefaultSuperAdminEmail,
		},
		{
			name: "short password",
			config: Config{
				SuperAdminName:     "Admin",
				SuperAdminEmail:    DefaultSuperAdminEmail,
				SuperAdminPassword: "short",
			},
			wantErr: "8 to 72",
		},
		{
			name: "bcrypt limit exceeded",
			config: Config{
				SuperAdminName:     "Admin",
				SuperAdminEmail:    DefaultSuperAdminEmail,
				SuperAdminPassword: strings.Repeat("x", 73),
			},
			wantErr: "8 to 72",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			err := test.config.validate()
			if test.wantErr == "" {
				if err != nil {
					t.Fatalf("validate() error = %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("validate() error = %v, want substring %q", err, test.wantErr)
			}
		})
	}
}

func TestJavaCurriculumQuality(t *testing.T) {
	t.Parallel()

	modules := javaModuleSeeds()
	quizzes := javaQuizSeeds()
	assignments := javaAssignmentSeeds()
	if err := validateJavaCurriculum(modules, quizzes, assignments); err != nil {
		t.Fatalf("validateJavaCurriculum() error = %v", err)
	}

	if got, want := len(modules), 10; got != want {
		t.Fatalf("module count = %d, want %d", got, want)
	}
	if got, want := len(quizzes), 3; got != want {
		t.Fatalf("quiz count = %d, want %d", got, want)
	}
	questionCount := 0
	for _, quiz := range quizzes {
		questionCount += len(quiz.Questions)
	}
	if got, want := questionCount, 15; got != want {
		t.Fatalf("question count = %d, want %d", got, want)
	}
	if got, want := len(assignments), 2; got != want {
		t.Fatalf("assignment count = %d, want %d", got, want)
	}
}

func TestValidateJavaCurriculumRejectsInvalidData(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name    string
		mutate  func([]moduleSeed, []quizSeed, []assignmentSeed)
		wantErr string
	}{
		{
			name: "module without title",
			mutate: func(modules []moduleSeed, _ []quizSeed, _ []assignmentSeed) {
				modules[0].Title = ""
			},
			wantErr: "title and description",
		},
		{
			name: "non numeric module duration",
			mutate: func(modules []moduleSeed, _ []quizSeed, _ []assignmentSeed) {
				modules[0].Duration = "Dua Jam"
			},
			wantErr: "duration must use hours",
		},
		{
			name: "answer outside options",
			mutate: func(_ []moduleSeed, quizzes []quizSeed, _ []assignmentSeed) {
				quizzes[0].Questions[0].CorrectAnswer = "Jawaban yang tidak tersedia"
			},
			wantErr: "outside its options",
		},
		{
			name: "quiz points not one hundred",
			mutate: func(_ []moduleSeed, quizzes []quizSeed, _ []assignmentSeed) {
				quizzes[0].Questions[0].Points = 10
			},
			wantErr: "want 100",
		},
		{
			name: "assignment without structure",
			mutate: func(_ []moduleSeed, _ []quizSeed, assignments []assignmentSeed) {
				assignments[0].Instructions = "Tulis program."
			},
			wantErr: "structured HTML",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			modules := javaModuleSeeds()
			quizzes := javaQuizSeeds()
			assignments := javaAssignmentSeeds()
			test.mutate(modules, quizzes, assignments)

			err := validateJavaCurriculum(modules, quizzes, assignments)
			if err == nil || !strings.Contains(err.Error(), test.wantErr) {
				t.Fatalf("validateJavaCurriculum() error = %v, want substring %q", err, test.wantErr)
			}
		})
	}
}
