package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/pgvector/pgvector-go"
)

// ModuleEmbedding stores vector embeddings of module content for RAG search.
type ModuleEmbedding struct {
	ID        uuid.UUID       `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ModuleID  uuid.UUID       `gorm:"type:uuid;not null;uniqueIndex" json:"moduleId"`
	CourseID  uuid.UUID       `gorm:"type:uuid;not null;index" json:"courseId"`
	Content   string          `gorm:"type:text" json:"content"` // Plain text (HTML-stripped)
	Embedding pgvector.Vector `gorm:"type:vector(384)" json:"-"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}
