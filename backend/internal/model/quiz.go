package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StringArray is a custom type for storing JSON string arrays in PostgreSQL
type StringArray []string

func (s StringArray) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	return string(b), err
}

func (s *StringArray) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		str, ok := value.(string)
		if !ok {
			*s = []string{}
			return nil
		}
		bytes = []byte(str)
	}
	return json.Unmarshal(bytes, s)
}

type Quiz struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"courseId"`
	Title        string         `gorm:"size:255;not null" json:"title"`
	Description  string         `gorm:"type:text" json:"description"`
	PassingScore int            `gorm:"default:70" json:"passingScore"`
	TimeLimit    int            `gorm:"default:15" json:"timeLimit"`
	IsPublished  bool           `gorm:"default:false" json:"isPublished"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"-"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Questions     []Question    `gorm:"foreignKey:QuizID" json:"questions"`
	QuizAttempts  []QuizAttempt `gorm:"foreignKey:QuizID" json:"quizAttempts"`
	TotalAttempts int           `gorm:"-" json:"totalAttempts"`
	AverageScore  float64       `gorm:"-" json:"averageScore"`
}

type Question struct {
	ID            uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	QuizID        uuid.UUID   `gorm:"type:uuid;not null;index" json:"quizId"`
	Type          string      `gorm:"size:20;not null" json:"type"`
	Text          string      `gorm:"type:text;not null" json:"text"`
	Options       StringArray `gorm:"type:jsonb" json:"options,omitempty"`
	CorrectAnswer string      `gorm:"size:500;not null" json:"correctAnswer"`
	Points        int         `gorm:"default:10" json:"points"`
	Order         int         `gorm:"default:0" json:"order"`
}

type QuizAttempt struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	QuizID      uuid.UUID `gorm:"type:uuid;not null;index;index:idx_attempt_student_quiz" json:"quizId"`
	Quiz        *Quiz     `gorm:"foreignKey:QuizID" json:"quiz,omitempty"`
	StudentID   uuid.UUID `gorm:"type:uuid;not null;index;index:idx_attempt_student_quiz" json:"studentId"`
	Student     *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Score       int       `gorm:"default:0" json:"score"`
	TotalPoints int       `gorm:"default:0" json:"totalPoints"`
	Passed      bool      `gorm:"default:false" json:"passed"`
	CompletedAt time.Time `json:"completedAt"`

	Answers []QuizAnswer `gorm:"foreignKey:AttemptID" json:"answers"`
}

type QuizAnswer struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AttemptID  uuid.UUID `gorm:"type:uuid;not null;index" json:"attemptId"`
	QuestionID uuid.UUID `gorm:"type:uuid;not null" json:"questionId"`
	Answer     string    `gorm:"type:text" json:"answer"`
	IsCorrect  bool      `gorm:"default:false" json:"isCorrect"`
	Points     int       `gorm:"default:0" json:"points"`
}
