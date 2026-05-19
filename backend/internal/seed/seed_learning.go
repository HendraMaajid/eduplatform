package seed

import (
	"fmt"
	"log"
	"time"

	"backend/internal/model"
	"backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

func seedLearning(ctx *seedContext) error {
	rng := ctx.Cfg.RNG
	courses := ctx.Courses.Courses

	// Early return: if quizzes already seeded, just load existing data
	var quizCount int64
	database.DB.Model(&model.Quiz{}).Count(&quizCount)
	if quizCount >= int64(len(courses)*2) {
		log.Printf("[seed] learning: skipped (already %d quizzes exist)", quizCount)
		var allQuizzes []model.Quiz
		database.DB.Find(&allQuizzes)
		var allQuestions []model.Question
		database.DB.Find(&allQuestions)
		var allAssignments []model.Assignment
		database.DB.Find(&allAssignments)
		quizzesByCourse := make(map[uuid.UUID][]model.Quiz)
		questionsByQuiz := make(map[uuid.UUID][]model.Question)
		assignmentsByCourse := make(map[uuid.UUID][]model.Assignment)
		for i := range allQuizzes {
			quizzesByCourse[allQuizzes[i].CourseID] = append(quizzesByCourse[allQuizzes[i].CourseID], allQuizzes[i])
		}
		for i := range allQuestions {
			questionsByQuiz[allQuestions[i].QuizID] = append(questionsByQuiz[allQuestions[i].QuizID], allQuestions[i])
		}
		for i := range allAssignments {
			assignmentsByCourse[allAssignments[i].CourseID] = append(assignmentsByCourse[allAssignments[i].CourseID], allAssignments[i])
		}
		ctx.Learning = &seededLearning{
			Quizzes: allQuizzes, Questions: allQuestions, Assignments: allAssignments,
			QuizzesByCourse: quizzesByCourse, QuestionsByQuiz: questionsByQuiz, AssignmentsByCourse: assignmentsByCourse,
		}
		return nil
	}

	quizzesByCourse := make(map[uuid.UUID][]model.Quiz)
	questionsByQuiz := make(map[uuid.UUID][]model.Question)
	assignmentsByCourse := make(map[uuid.UUID][]model.Assignment)

	// Build quizzes
	allQuizzes := make([]model.Quiz, 0, len(courses)*2)
	for _, c := range courses {
		for qi := 1; qi <= 2; qi++ {
			allQuizzes = append(allQuizzes, model.Quiz{
				CourseID:     c.ID,
				Title:        fmt.Sprintf("Quiz %d: %s", qi, c.Title),
				Description:  fmt.Sprintf("Quiz untuk menguji pemahaman materi %s bagian %d.", c.Title, qi),
				PassingScore: 70,
				TimeLimit:    15,
				IsPublished:  true,
			})
		}
	}

	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allQuizzes, 50).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch quizzes to get IDs
	allQuizzes = nil
	database.DB.Find(&allQuizzes)
	for i := range allQuizzes {
		quizzesByCourse[allQuizzes[i].CourseID] = append(quizzesByCourse[allQuizzes[i].CourseID], allQuizzes[i])
	}

	// Build questions
	allQuestions := make([]model.Question, 0, len(allQuizzes)*5)
	for _, q := range allQuizzes {
		var category string
		for _, c := range courses {
			if c.ID == q.CourseID {
				category = c.Category
				break
			}
		}
		pool := questionPoolByCategory[category]
		picked := pickN(rng, pool, 5)
		for order, qt := range picked {
			allQuestions = append(allQuestions, model.Question{
				QuizID:        q.ID,
				Type:          qt.Type,
				Text:          qt.Text,
				Options:       model.StringArray(qt.Options),
				CorrectAnswer: qt.CorrectAnswer,
				Points:        10,
				Order:         order + 1,
			})
		}
	}

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allQuestions, 200).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch questions
	allQuestions = nil
	database.DB.Find(&allQuestions)
	for i := range allQuestions {
		questionsByQuiz[allQuestions[i].QuizID] = append(questionsByQuiz[allQuestions[i].QuizID], allQuestions[i])
	}

	// Build assignments
	allAssignments := make([]model.Assignment, 0, len(courses)*2)
	for _, c := range courses {
		templates := assignmentTemplatesByCategory[c.Category]
		picked := pickN(rng, templates, 2)
		for ai, at := range picked {
			deadline := time.Now().Add(time.Duration(14+ai*16) * 24 * time.Hour)
			allAssignments = append(allAssignments, model.Assignment{
				CourseID:     c.ID,
				Title:        at.Title,
				Description:  at.Description,
				Instructions: at.Instructions,
				Deadline:     deadline,
				MaxScore:     100,
				IsPublished:  true,
			})
		}
	}

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allAssignments, 50).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch assignments
	allAssignments = nil
	database.DB.Find(&allAssignments)
	for i := range allAssignments {
		assignmentsByCourse[allAssignments[i].CourseID] = append(assignmentsByCourse[allAssignments[i].CourseID], allAssignments[i])
	}

	ctx.Learning = &seededLearning{
		Quizzes:             allQuizzes,
		Questions:           allQuestions,
		Assignments:         allAssignments,
		QuizzesByCourse:     quizzesByCourse,
		QuestionsByQuiz:     questionsByQuiz,
		AssignmentsByCourse: assignmentsByCourse,
	}

	log.Printf("[seed] quizzes: %d, questions: %d, assignments: %d",
		len(allQuizzes), len(allQuestions), len(allAssignments))
	return nil
}
