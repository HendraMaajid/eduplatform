package seed

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"backend/internal/model"
	"backend/internal/service"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const javaCourseSlug = "java-dasar"

type moduleSeed struct {
	Title       string
	Description string
	Duration    string
	Content     string
}

type questionSeed struct {
	Text          string
	Options       []string
	CorrectAnswer string
	Points        int
}

type quizSeed struct {
	Title        string
	Description  string
	PassingScore int
	TimeLimit    int
	Questions    []questionSeed
}

type assignmentSeed struct {
	Title        string
	Description  string
	Instructions string
	DueAfter     time.Duration
}

type javaCourseResult struct {
	CourseID    uuid.UUID
	Title       string
	Modules     int
	Quizzes     int
	Questions   int
	Assignments int
}

func seedJavaCourse(tx *gorm.DB, teacher *model.User) (javaCourseResult, error) {
	modules := javaModuleSeeds()
	quizzes := javaQuizSeeds()
	assignments := javaAssignmentSeeds()
	if err := validateJavaCurriculum(modules, quizzes, assignments); err != nil {
		return javaCourseResult{}, err
	}

	course, err := upsertJavaCourse(tx, teacher.ID)
	if err != nil {
		return javaCourseResult{}, err
	}
	if err := ensureJavaCurriculumReplaceable(tx, course.ID); err != nil {
		return javaCourseResult{}, err
	}
	if err := clearJavaCurriculum(tx, course.ID); err != nil {
		return javaCourseResult{}, err
	}

	for index, item := range modules {
		module := model.Module{
			ID:          uuid.New(),
			CourseID:    course.ID,
			Title:       item.Title,
			Description: item.Description,
			Content:     item.Content,
			Order:       index + 1,
			Duration:    item.Duration,
			IsPublished: true,
		}
		if err := tx.Create(&module).Error; err != nil {
			return javaCourseResult{}, fmt.Errorf("create Java module %q: %w", item.Title, err)
		}
		plainText := service.StripHTML(module.Title + " " + module.Description + " " + module.Content)
		embedding := model.ModuleEmbedding{
			ID:        uuid.New(),
			ModuleID:  module.ID,
			CourseID:  course.ID,
			Content:   plainText,
			Embedding: service.GenerateEmbedding(plainText),
		}
		if err := tx.Create(&embedding).Error; err != nil {
			return javaCourseResult{}, fmt.Errorf("create embedding for module %q: %w", item.Title, err)
		}
	}

	questionCount := 0
	for _, item := range quizzes {
		quiz := model.Quiz{
			ID:           uuid.New(),
			CourseID:     course.ID,
			Title:        item.Title,
			Description:  item.Description,
			PassingScore: item.PassingScore,
			TimeLimit:    item.TimeLimit,
			IsPublished:  true,
		}
		if err := tx.Create(&quiz).Error; err != nil {
			return javaCourseResult{}, fmt.Errorf("create Java quiz %q: %w", item.Title, err)
		}
		for index, questionItem := range item.Questions {
			question := model.Question{
				ID:            uuid.New(),
				QuizID:        quiz.ID,
				Type:          "multiple_choice",
				Text:          questionItem.Text,
				Options:       model.StringArray(questionItem.Options),
				CorrectAnswer: questionItem.CorrectAnswer,
				Points:        questionItem.Points,
				Order:         index + 1,
			}
			if err := tx.Create(&question).Error; err != nil {
				return javaCourseResult{}, fmt.Errorf("create question for quiz %q: %w", item.Title, err)
			}
			questionCount++
		}
	}

	now := time.Now().UTC()
	for _, item := range assignments {
		assignment := model.Assignment{
			ID:           uuid.New(),
			CourseID:     course.ID,
			Title:        item.Title,
			Description:  item.Description,
			Instructions: item.Instructions,
			Deadline:     now.Add(item.DueAfter),
			MaxScore:     100,
			IsPublished:  true,
		}
		if err := tx.Create(&assignment).Error; err != nil {
			return javaCourseResult{}, fmt.Errorf("create Java assignment %q: %w", item.Title, err)
		}
	}

	return javaCourseResult{
		CourseID:    course.ID,
		Title:       course.Title,
		Modules:     len(modules),
		Quizzes:     len(quizzes),
		Questions:   questionCount,
		Assignments: len(assignments),
	}, nil
}

func upsertJavaCourse(tx *gorm.DB, teacherID uuid.UUID) (*model.Course, error) {
	const (
		title            = "Java Dasar: Fondasi Pemrograman untuk Pemula"
		description      = `<h2>Belajar Java secara bertahap dan terarah</h2><p>Course ini membawa pemula dari memahami cara kerja Java hingga mampu menyusun aplikasi terminal yang rapi. Setiap modul memiliki tujuan belajar, penjelasan konsep, contoh kode, latihan bertahap, dan checklist.</p><p>Kamu akan mempelajari sintaks dasar, percabangan, perulangan, method, array, String, object-oriented programming, collections, dan penanganan error. Di akhir course, seluruh konsep digabungkan dalam proyek aplikasi kasir mini.</p>`
		shortDescription = "Belajar Java dari nol melalui contoh, latihan, kuis, dan dua proyek bertahap."
		thumbnail        = "/uploads/java-dasar-thumbnail.svg"
		category         = "Pemrograman"
		level            = "beginner"
		status           = "published"
		duration         = "8 Minggu"
	)
	values := map[string]any{
		"title":             title,
		"description":       description,
		"short_description": shortDescription,
		"thumbnail":         thumbnail,
		"category":          category,
		"level":             level,
		"status":            status,
		"teacher_id":        teacherID,
		"duration":          duration,
		"rating":            0,
		"total_reviews":     0,
		"deleted_at":        nil,
	}

	var course model.Course
	err := tx.Unscoped().Where("slug = ?", javaCourseSlug).First(&course).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		course = model.Course{
			ID:               uuid.New(),
			Title:            title,
			Slug:             javaCourseSlug,
			Description:      description,
			ShortDescription: shortDescription,
			Thumbnail:        thumbnail,
			Category:         category,
			Level:            level,
			Status:           status,
			TeacherID:        teacherID,
			Duration:         duration,
		}
		if err := tx.Create(&course).Error; err != nil {
			return nil, fmt.Errorf("create Java course: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("find Java course: %w", err)
	} else if err := tx.Unscoped().Model(&course).Updates(values).Error; err != nil {
		return nil, fmt.Errorf("update Java course: %w", err)
	}
	if err := tx.First(&course, "id = ?", course.ID).Error; err != nil {
		return nil, fmt.Errorf("reload Java course: %w", err)
	}
	return &course, nil
}

// ensureJavaCurriculumReplaceable prevents a development seed from silently
// discarding learner results when the Java course has already been used.
func ensureJavaCurriculumReplaceable(tx *gorm.DB, courseID uuid.UUID) error {
	checks := []struct {
		name  string
		query string
	}{
		{"learning progress", `SELECT COUNT(*) FROM learning_progresses WHERE course_id = ?`},
		{"certificates", `SELECT COUNT(*) FROM certificates WHERE course_id = ?`},
		{"ratings", `SELECT COUNT(*) FROM ratings WHERE course_id = ?`},
		{"quiz attempts", `SELECT COUNT(*) FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id WHERE q.course_id = ?`},
		{"assignment submissions", `SELECT COUNT(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.course_id = ?`},
	}
	for _, check := range checks {
		var count int64
		if err := tx.Raw(check.query, courseID).Scan(&count).Error; err != nil {
			return fmt.Errorf("check Java course %s: %w", check.name, err)
		}
		if count > 0 {
			return fmt.Errorf(
				"refusing to replace Java curriculum: course has %d %s record(s); seed a fresh development database instead",
				count,
				check.name,
			)
		}
	}
	return nil
}

func clearJavaCurriculum(tx *gorm.DB, courseID uuid.UUID) error {
	statements := []struct {
		query string
		args  []any
	}{
		{`DELETE FROM questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE course_id = ?)`, []any{courseID}},
		{`DELETE FROM quizzes WHERE course_id = ?`, []any{courseID}},
		{`DELETE FROM assignments WHERE course_id = ?`, []any{courseID}},
		{`DELETE FROM module_embeddings WHERE course_id = ?`, []any{courseID}},
		{`DELETE FROM attachments WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)`, []any{courseID}},
		{`DELETE FROM modules WHERE course_id = ?`, []any{courseID}},
	}
	for _, statement := range statements {
		if err := tx.Exec(statement.query, statement.args...).Error; err != nil {
			return fmt.Errorf("clear Java curriculum: %w", err)
		}
	}
	return nil
}

func validateJavaCurriculum(
	modules []moduleSeed,
	quizzes []quizSeed,
	assignments []assignmentSeed,
) error {
	if len(modules) < 10 {
		return fmt.Errorf("java curriculum requires at least 10 modules, got %d", len(modules))
	}
	moduleTitles := make(map[string]struct{}, len(modules))
	for _, module := range modules {
		if strings.TrimSpace(module.Title) == "" || strings.TrimSpace(module.Description) == "" {
			return errors.New("every Java module requires a title and description")
		}
		if _, exists := moduleTitles[module.Title]; exists {
			return fmt.Errorf("duplicate Java module title %q", module.Title)
		}
		moduleTitles[module.Title] = struct{}{}
		durationValue := strings.TrimSuffix(module.Duration, " Jam")
		durationHours, err := strconv.Atoi(durationValue)
		if durationValue == module.Duration || err != nil || durationHours <= 0 {
			return fmt.Errorf("module %q duration must use hours", module.Title)
		}
		for _, marker := range []string{"<h2>Tujuan", "<pre><code>", "<h2>Latihan", "<h2>Checklist"} {
			if !strings.Contains(module.Content, marker) {
				return fmt.Errorf("module %q is missing content marker %q", module.Title, marker)
			}
		}
	}

	if len(quizzes) < 3 {
		return fmt.Errorf("java curriculum requires at least 3 quizzes, got %d", len(quizzes))
	}
	for _, quiz := range quizzes {
		if strings.TrimSpace(quiz.Title) == "" || strings.TrimSpace(quiz.Description) == "" {
			return errors.New("every Java quiz requires a title and description")
		}
		if quiz.PassingScore < 1 || quiz.PassingScore > 100 {
			return fmt.Errorf("quiz %q passing score must be between 1 and 100", quiz.Title)
		}
		if quiz.TimeLimit <= 0 {
			return fmt.Errorf("quiz %q time limit must be positive", quiz.Title)
		}
		if len(quiz.Questions) < 5 {
			return fmt.Errorf("quiz %q requires at least 5 questions", quiz.Title)
		}
		totalPoints := 0
		for _, question := range quiz.Questions {
			if strings.TrimSpace(question.Text) == "" || len(question.Options) < 2 {
				return fmt.Errorf("quiz %q contains an incomplete question", quiz.Title)
			}
			if question.Points <= 0 {
				return fmt.Errorf("quiz %q question points must be positive", quiz.Title)
			}
			answerFound := false
			uniqueOptions := make(map[string]struct{}, len(question.Options))
			for _, option := range question.Options {
				if strings.TrimSpace(option) == "" {
					return fmt.Errorf("quiz %q contains an empty option", quiz.Title)
				}
				if _, exists := uniqueOptions[option]; exists {
					return fmt.Errorf("quiz %q contains a duplicate option", quiz.Title)
				}
				uniqueOptions[option] = struct{}{}
				if option == question.CorrectAnswer {
					answerFound = true
					break
				}
			}
			if !answerFound {
				return fmt.Errorf("quiz %q has an answer outside its options", quiz.Title)
			}
			totalPoints += question.Points
		}
		if totalPoints != 100 {
			return fmt.Errorf("quiz %q points total %d, want 100", quiz.Title, totalPoints)
		}
	}

	if len(assignments) < 2 {
		return fmt.Errorf("java curriculum requires at least 2 assignments, got %d", len(assignments))
	}
	for _, assignment := range assignments {
		if strings.TrimSpace(assignment.Title) == "" || strings.TrimSpace(assignment.Description) == "" {
			return errors.New("every Java assignment requires a title and description")
		}
		if assignment.DueAfter <= 0 {
			return fmt.Errorf("assignment %q deadline must be in the future", assignment.Title)
		}
		if !strings.Contains(assignment.Instructions, "<h2>") ||
			!strings.Contains(assignment.Instructions, "<ul>") {
			return fmt.Errorf("assignment %q requires structured HTML instructions", assignment.Title)
		}
	}
	return nil
}
