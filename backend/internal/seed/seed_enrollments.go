package seed

import (
	"log"
	"time"

	"backend/internal/model"
	"backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

func seedEnrollments(ctx *seedContext) error {
	rng := ctx.Cfg.RNG
	students := ctx.Users.Students
	courses := ctx.Courses.Courses
	modulesByCourse := ctx.Courses.ModulesByCourse
	quizzesByCourse := ctx.Learning.QuizzesByCourse
	questionsByQuiz := ctx.Learning.QuestionsByQuiz
	assignmentsByCourse := ctx.Learning.AssignmentsByCourse

	// Early return: if enrollments already seeded, just load and skip
	var enrollmentCount int64
	database.DB.Model(&model.Enrollment{}).Count(&enrollmentCount)
	if enrollmentCount >= int64(len(students)*3) {
		log.Printf("[seed] enrollments: skipped (already %d enrollments exist)", enrollmentCount)
		// Still populate ctx for downstream seeders
		var existingEnrollments []model.Enrollment
		database.DB.Find(&existingEnrollments)
		var existingCerts []model.Certificate
		database.DB.Find(&existingCerts)
		ctx.Enrollments = &seededEnrollments{
			Enrollments:  existingEnrollments,
			Certificates: existingCerts,
			CountByState: map[string]int{},
		}
		return nil
	}

	// Load existing enrollments to skip duplicates
	var existingEnrollments []model.Enrollment
	database.DB.Select("student_id", "course_id").Find(&existingEnrollments)
	enrolledSet := make(map[string]bool, len(existingEnrollments))
	for _, e := range existingEnrollments {
		enrolledSet[e.StudentID.String()+"|"+e.CourseID.String()] = true
	}

	// Filter published courses
	published := make([]model.Course, 0)
	for _, c := range courses {
		if c.Status == "published" {
			published = append(published, c)
		}
	}

	states := []string{"completed", "in_progress", "new", "abandoned"}
	weights := []float64{0.30, 0.40, 0.20, 0.10}
	countByState := map[string]int{}

	var allEnrollments []model.Enrollment
	var allPayments []model.Payment
	var allAttempts []model.QuizAttempt
	var allAnswers []model.QuizAnswer
	var allSubmissions []model.Submission
	var allCertificates []model.Certificate

	for _, student := range students {
		numCourses := randomInRange(rng, 3, 6)
		if numCourses > len(published) {
			numCourses = len(published)
		}
		picked := pickN(rng, published, numCourses)

		for _, course := range picked {
			// Skip if already enrolled
			if enrolledSet[student.ID.String()+"|"+course.ID.String()] {
				continue
			}

			state := states[weightedPick(rng, weights)]
			countByState[state]++

			var enrolledAt time.Time
			switch state {
			case "completed":
				enrolledAt = randomTimeWithin(rng, 30, 120)
			case "in_progress":
				enrolledAt = randomTimeWithin(rng, 7, 60)
			case "new":
				enrolledAt = randomTimeWithin(rng, 0, 7)
			case "abandoned":
				enrolledAt = randomTimeWithin(rng, 60, 180)
			}

			discount := float64(randomInRange(rng, 0, 20)) / 100
			paymentAmount := int(float64(course.Price) * (1 - discount))

			modules := modulesByCourse[course.ID]
			quizzes := quizzesByCourse[course.ID]
			assignments := assignmentsByCourse[course.ID]

			var completedModules model.StringArray
			var passedQuizzes, gradedAssignments int
			enrollStatus := "active"

			switch state {
			case "completed":
				for _, m := range modules {
					completedModules = append(completedModules, m.ID.String())
				}
				// All quizzes passed
				for _, quiz := range quizzes {
					questions := questionsByQuiz[quiz.ID]
					attemptID := uuid.New()
					score := randomInRange(rng, 75, 95)
					// Determine correct answers based on score
					numCorrect := score / 10 // out of 5 questions × 10 pts
					if numCorrect > len(questions) {
						numCorrect = len(questions)
					}
					totalPts := numCorrect * 10
					attempt := model.QuizAttempt{
						ID:          attemptID,
						QuizID:      quiz.ID,
						StudentID:   student.ID,
						Score:       totalPts,
						TotalPoints: 50,
						Passed:      true,
						CompletedAt: enrolledAt.Add(time.Duration(randomInRange(rng, 1, 20)) * 24 * time.Hour),
					}
					allAttempts = append(allAttempts, attempt)
					for qi, q := range questions {
						correct := qi < numCorrect
						ans := q.CorrectAnswer
						pts := 10
						if !correct {
							ans = "wrong"
							pts = 0
						}
						allAnswers = append(allAnswers, model.QuizAnswer{
							AttemptID:  attemptID,
							QuestionID: q.ID,
							Answer:     ans,
							IsCorrect:  correct,
							Points:     pts,
						})
					}
					passedQuizzes++
				}
				// All assignments graded ≥80
				for _, a := range assignments {
					score := randomInRange(rng, 80, 100)
					allSubmissions = append(allSubmissions, model.Submission{
						AssignmentID: a.ID,
						StudentID:    student.ID,
						FileURL:      "/uploads/submission-placeholder.pdf",
						FileName:     "tugas-submission.pdf",
						Description:  "Submission tugas",
						Score:        score,
						Feedback:     feedbackTemplates[rng.Intn(len(feedbackTemplates))],
						Status:       "passed",
						SubmittedAt:  enrolledAt.Add(time.Duration(randomInRange(rng, 5, 25)) * 24 * time.Hour),
					})
					gradedAssignments++
				}
				enrollStatus = "certified"
				// Certificate
				allCertificates = append(allCertificates, model.Certificate{
					StudentID:         student.ID,
					CourseID:          course.ID,
					CertificateNumber: genCertificateNumber(),
					IssuedAt:          enrolledAt.Add(time.Duration(randomInRange(rng, 25, 60)) * 24 * time.Hour),
				})

			case "in_progress":
				numMods := randomInRange(rng, 2, 4)
				if numMods > len(modules) {
					numMods = len(modules)
				}
				for _, m := range modules[:numMods] {
					completedModules = append(completedModules, m.ID.String())
				}
				// 1 quiz attempt
				if len(quizzes) > 0 {
					quiz := quizzes[0]
					questions := questionsByQuiz[quiz.ID]
					attemptID := uuid.New()
					passed := rng.Intn(2) == 0
					var score int
					if passed {
						score = randomInRange(rng, 70, 90)
						passedQuizzes++
					} else {
						score = randomInRange(rng, 40, 65)
					}
					numCorrect := score / 10
					if numCorrect > len(questions) {
						numCorrect = len(questions)
					}
					totalPts := numCorrect * 10
					allAttempts = append(allAttempts, model.QuizAttempt{
						ID:          attemptID,
						QuizID:      quiz.ID,
						StudentID:   student.ID,
						Score:       totalPts,
						TotalPoints: 50,
						Passed:      passed,
						CompletedAt: enrolledAt.Add(time.Duration(randomInRange(rng, 3, 20)) * 24 * time.Hour),
					})
					for qi, q := range questions {
						correct := qi < numCorrect
						ans := q.CorrectAnswer
						pts := 10
						if !correct {
							ans = "wrong"
							pts = 0
						}
						allAnswers = append(allAnswers, model.QuizAnswer{
							AttemptID:  attemptID,
							QuestionID: q.ID,
							Answer:     ans,
							IsCorrect:  correct,
							Points:     pts,
						})
					}
				}
				// 0-1 assignment submission
				if len(assignments) > 0 && rng.Intn(2) == 0 {
					a := assignments[0]
					if rng.Intn(2) == 0 {
						// Graded
						score := randomInRange(rng, 75, 95)
						allSubmissions = append(allSubmissions, model.Submission{
							AssignmentID: a.ID,
							StudentID:    student.ID,
							FileURL:      "/uploads/submission-placeholder.pdf",
							FileName:     "tugas-submission.pdf",
							Description:  "Submission tugas",
							Score:        score,
							Feedback:     feedbackTemplates[rng.Intn(len(feedbackTemplates))],
							Status:       "passed",
							SubmittedAt:  enrolledAt.Add(time.Duration(randomInRange(rng, 5, 20)) * 24 * time.Hour),
						})
						if score >= 80 {
							gradedAssignments++
						}
					} else {
						// Submitted but not graded
						allSubmissions = append(allSubmissions, model.Submission{
							AssignmentID: a.ID,
							StudentID:    student.ID,
							FileURL:      "/uploads/submission-placeholder.pdf",
							FileName:     "tugas-submission.pdf",
							Description:  "Submission tugas",
							Status:       "submitted",
							SubmittedAt:  enrolledAt.Add(time.Duration(randomInRange(rng, 5, 20)) * 24 * time.Hour),
						})
					}
				}

			case "new":
				if rng.Intn(2) == 0 && len(modules) > 0 {
					completedModules = append(completedModules, modules[0].ID.String())
				}

			case "abandoned":
				if rng.Intn(2) == 0 && len(modules) > 0 {
					completedModules = append(completedModules, modules[0].ID.String())
				}
				// Optional failed quiz attempt
				if len(quizzes) > 0 && rng.Intn(2) == 0 {
					quiz := quizzes[0]
					questions := questionsByQuiz[quiz.ID]
					attemptID := uuid.New()
					score := randomInRange(rng, 20, 50)
					numCorrect := score / 10
					if numCorrect > len(questions) {
						numCorrect = len(questions)
					}
					totalPts := numCorrect * 10
					allAttempts = append(allAttempts, model.QuizAttempt{
						ID:          attemptID,
						QuizID:      quiz.ID,
						StudentID:   student.ID,
						Score:       totalPts,
						TotalPoints: 50,
						Passed:      false,
						CompletedAt: enrolledAt.Add(time.Duration(randomInRange(rng, 1, 10)) * 24 * time.Hour),
					})
					for qi, q := range questions {
						correct := qi < numCorrect
						ans := q.CorrectAnswer
						pts := 10
						if !correct {
							ans = "wrong"
							pts = 0
						}
						allAnswers = append(allAnswers, model.QuizAnswer{
							AttemptID:  attemptID,
							QuestionID: q.ID,
							Answer:     ans,
							IsCorrect:  correct,
							Points:     pts,
						})
					}
				}
				enrollStatus = "inactive"
			}

			progress := calcProgress(len(completedModules), len(modules), passedQuizzes, len(quizzes), gradedAssignments, len(assignments))

			allEnrollments = append(allEnrollments, model.Enrollment{
				CourseID:         course.ID,
				StudentID:        student.ID,
				PaymentAmount:    paymentAmount,
				Progress:         progress,
				CompletedModules: completedModules,
				Status:           enrollStatus,
				EnrolledAt:       enrolledAt,
			})

			allPayments = append(allPayments, model.Payment{
				CourseID:  course.ID,
				StudentID: student.ID,
				Amount:    paymentAmount,
				PaidAt:    enrolledAt,
			})
		}
	}

	// Batch insert per entity type — ON CONFLICT DO NOTHING to skip duplicates
	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "course_id"}, {Name: "student_id"}},
		DoNothing: true,
	}).CreateInBatches(&allEnrollments, 100).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "course_id"}, {Name: "student_id"}},
		DoNothing: true,
	}).CreateInBatches(&allPayments, 100).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	if len(allAttempts) > 0 {
		tx = database.DB.Begin()
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allAttempts, 100).Error; err != nil {
			tx.Rollback()
			return err
		}
		tx.Commit()
	}

	if len(allAnswers) > 0 {
		tx = database.DB.Begin()
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allAnswers, 500).Error; err != nil {
			tx.Rollback()
			return err
		}
		tx.Commit()
	}

	if len(allSubmissions) > 0 {
		tx = database.DB.Begin()
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "assignment_id"}, {Name: "student_id"}},
			DoNothing: true,
		}).CreateInBatches(&allSubmissions, 100).Error; err != nil {
			tx.Rollback()
			return err
		}
		tx.Commit()
	}

	if len(allCertificates) > 0 {
		tx = database.DB.Begin()
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "certificate_number"}},
			DoNothing: true,
		}).CreateInBatches(&allCertificates, 50).Error; err != nil {
			tx.Rollback()
			return err
		}
		tx.Commit()
	}

	ctx.Enrollments = &seededEnrollments{
		Enrollments:  allEnrollments,
		Certificates: allCertificates,
		CountByState: countByState,
	}

	log.Printf("[seed] enrollments: %d (completed=%d, in_progress=%d, new=%d, abandoned=%d), payments: %d, quiz_attempts: %d, quiz_answers: %d, submissions: %d, certificates: %d",
		len(allEnrollments), countByState["completed"], countByState["in_progress"], countByState["new"], countByState["abandoned"],
		len(allPayments), len(allAttempts), len(allAnswers), len(allSubmissions), len(allCertificates))
	return nil
}
