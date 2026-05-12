package seed

import (
	"log"
	"strings"
	"time"

	"backend/internal/model"
	"backend/pkg/database"

	"gorm.io/gorm/clause"
)

func seedNotifications(ctx *seedContext) error {
	rng := ctx.Cfg.RNG
	courses := ctx.Courses.Courses

	// Build course title lookup by teacher
	coursesByTeacher := map[string][]model.Course{}
	for _, c := range courses {
		coursesByTeacher[c.TeacherID.String()] = append(coursesByTeacher[c.TeacherID.String()], c)
	}

	// Build enrolled course titles per student
	enrolledCoursesByStudent := map[string][]model.Course{}
	for _, e := range ctx.Enrollments.Enrollments {
		for _, c := range courses {
			if c.ID == e.CourseID {
				enrolledCoursesByStudent[e.StudentID.String()] = append(enrolledCoursesByStudent[e.StudentID.String()], c)
				break
			}
		}
	}

	var allNotifs []model.Notification

	// Student notifications
	for _, student := range ctx.Users.Students {
		n := randomInRange(rng, 3, 5)
		enrolled := enrolledCoursesByStudent[student.ID.String()]
		for i := 0; i < n; i++ {
			tmpl := studentNotifTemplates[rng.Intn(len(studentNotifTemplates))]
			title := tmpl.Title
			msg := tmpl.Message
			link := tmpl.Link

			// Substitute placeholders
			if len(enrolled) > 0 {
				c := enrolled[rng.Intn(len(enrolled))]
				msg = strings.ReplaceAll(msg, "{courseTitle}", c.Title)
				link = strings.ReplaceAll(link, "{courseId}", c.ID.String())
				msg = strings.ReplaceAll(msg, "{score}", "85")
			}

			allNotifs = append(allNotifs, model.Notification{
				UserID:    student.ID,
				Title:     title,
				Message:   msg,
				Type:      tmpl.Type,
				IsRead:    rng.Float64() < 0.4,
				Link:      link,
				CreatedAt: time.Now().Add(-time.Duration(randomInRange(rng, 0, 30)) * 24 * time.Hour),
			})
		}
	}

	// Teacher notifications
	for _, teacher := range ctx.Users.Teachers {
		n := randomInRange(rng, 3, 5)
		tCourses := coursesByTeacher[teacher.ID.String()]
		for i := 0; i < n; i++ {
			tmpl := teacherNotifTemplates[rng.Intn(len(teacherNotifTemplates))]
			title := tmpl.Title
			msg := tmpl.Message
			link := tmpl.Link

			if len(tCourses) > 0 {
				c := tCourses[rng.Intn(len(tCourses))]
				msg = strings.ReplaceAll(msg, "{courseTitle}", c.Title)
			}

			allNotifs = append(allNotifs, model.Notification{
				UserID:    teacher.ID,
				Title:     title,
				Message:   msg,
				Type:      tmpl.Type,
				IsRead:    rng.Float64() < 0.4,
				Link:      link,
				CreatedAt: time.Now().Add(-time.Duration(randomInRange(rng, 0, 30)) * 24 * time.Hour),
			})
		}
	}

	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allNotifs, 200).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	log.Printf("[seed] notifications: %d", len(allNotifs))
	return nil
}
