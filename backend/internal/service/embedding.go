package service

import (
	"hash/fnv"
	"html"
	"math"
	"regexp"
	"strings"
	"unicode"

	"backend/internal/model"
	"backend/pkg/database"

	"github.com/pgvector/pgvector-go"
)

const embeddingDim = 384

// Common stop words (Indonesian + English) to filter out for better embeddings.
var stopWords = map[string]bool{
	// Indonesian
	"dan": true, "di": true, "ke": true, "dari": true, "yang": true,
	"ini": true, "itu": true, "dengan": true, "untuk": true, "pada": true,
	"adalah": true, "atau": true, "juga": true, "akan": true, "sudah": true,
	"tidak": true, "ada": true, "bisa": true, "lebih": true, "sangat": true,
	"saya": true, "kamu": true, "dia": true, "mereka": true, "kita": true,
	"apa": true, "bagaimana": true, "mengapa": true, "kapan": true,
	"oleh": true, "dalam": true, "sebagai": true, "antara": true,
	"setelah": true, "sebelum": true, "maka": true, "jika": true,
	"telah": true, "bagi": true, "secara": true, "saat": true,
	// English
	"the": true, "a": true, "an": true, "is": true, "are": true,
	"was": true, "were": true, "be": true, "been": true, "being": true,
	"have": true, "has": true, "had": true, "do": true, "does": true,
	"did": true, "will": true, "would": true, "could": true, "should": true,
	"may": true, "might": true, "can": true, "shall": true,
	"of": true, "in": true, "to": true, "for": true, "with": true,
	"on": true, "at": true, "by": true, "from": true, "as": true,
	"and": true, "or": true, "but": true, "not": true, "this": true,
	"that": true, "it": true, "its": true, "if": true, "then": true,
}

var htmlTagRegexp = regexp.MustCompile(`<[^>]*>`)

// Precompiled regexps for stripping script/style blocks (RE2-compatible, no backreferences).
var scriptBlockRe = regexp.MustCompile(`(?is)<script[^>]*>.*?</script>`)
var styleBlockRe = regexp.MustCompile(`(?is)<style[^>]*>.*?</style>`)

// StripHTML removes HTML tags and decodes entities from text.
// Security: strips all tags, decodes entities, normalizes whitespace.
func StripHTML(s string) string {
	// Remove script and style blocks entirely (security)
	text := scriptBlockRe.ReplaceAllString(s, "")
	text = styleBlockRe.ReplaceAllString(text, "")

	// Remove all HTML tags
	text = htmlTagRegexp.ReplaceAllString(text, " ")

	// Decode HTML entities
	text = html.UnescapeString(text)

	// Remove any remaining control characters (security)
	text = strings.Map(func(r rune) rune {
		if unicode.IsControl(r) && r != '\n' && r != '\t' {
			return -1
		}
		return r
	}, text)

	// Normalize whitespace
	text = strings.Join(strings.Fields(text), " ")
	return strings.TrimSpace(text)
}

// tokenize splits text into lowercase word tokens, filtering stop words.
func tokenize(text string) []string {
	text = strings.ToLower(text)
	words := strings.FieldsFunc(text, func(r rune) bool {
		return !unicode.IsLetter(r) && !unicode.IsDigit(r)
	})

	tokens := make([]string, 0, len(words))
	for _, w := range words {
		if len(w) < 2 || stopWords[w] {
			continue
		}
		tokens = append(tokens, w)
	}
	return tokens
}

// hashToken maps a token to a vector index using FNV hash.
func hashToken(token string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(token))
	return h.Sum32()
}

// GenerateEmbedding creates a 384-dimensional vector from text using
// feature hashing (hashing trick). This is a simple, deterministic,
// and API-free embedding method. Can be swapped for neural embeddings later.
func GenerateEmbedding(text string) pgvector.Vector {
	vec := make([]float32, embeddingDim)
	tokens := tokenize(text)

	if len(tokens) == 0 {
		return pgvector.NewVector(vec)
	}

	// Unigrams
	for _, t := range tokens {
		idx := hashToken(t) % uint32(embeddingDim)
		// Use a second hash to determine sign (+1 or -1) for better distribution
		sign := float32(1.0)
		if hashToken("sign_"+t)%2 == 0 {
			sign = -1.0
		}
		vec[idx] += sign
	}

	// Bigrams for capturing word pairs
	for i := 0; i < len(tokens)-1; i++ {
		bigram := tokens[i] + "_" + tokens[i+1]
		idx := hashToken(bigram) % uint32(embeddingDim)
		sign := float32(1.0)
		if hashToken("sign_"+bigram)%2 == 0 {
			sign = -1.0
		}
		vec[idx] += sign * 0.5 // Bigrams get lower weight
	}

	// L2 normalize
	var norm float32
	for _, v := range vec {
		norm += v * v
	}
	norm = float32(math.Sqrt(float64(norm)))
	if norm > 0 {
		for i := range vec {
			vec[i] /= norm
		}
	}

	return pgvector.NewVector(vec)
}

// EnsureModuleEmbeddings generates embeddings for all modules in a course
// that don't have embeddings yet (lazy generation).
func EnsureModuleEmbeddings(courseID string) error {
	// Get all modules for the course
	var modules []model.Module
	if err := database.DB.Where("course_id = ?", courseID).Find(&modules).Error; err != nil {
		return err
	}

	// Get existing embeddings
	var existing []model.ModuleEmbedding
	database.DB.Where("course_id = ?", courseID).Find(&existing)

	existingMap := make(map[string]bool)
	for _, e := range existing {
		existingMap[e.ModuleID.String()] = true
	}

	// Generate missing embeddings
	for _, mod := range modules {
		if existingMap[mod.ID.String()] {
			continue
		}

		plainText := StripHTML(mod.Title + " " + mod.Description + " " + mod.Content)
		embedding := GenerateEmbedding(plainText)

		emb := model.ModuleEmbedding{
			ModuleID:  mod.ID,
			CourseID:  mod.CourseID,
			Content:   plainText,
			Embedding: embedding,
		}

		if err := database.DB.Create(&emb).Error; err != nil {
			return err
		}
	}

	return nil
}

// RefreshModuleEmbedding regenerates the embedding for a specific module.
// Call this when module content is updated.
func RefreshModuleEmbedding(moduleID string) error {
	var mod model.Module
	if err := database.DB.First(&mod, "id = ?", moduleID).Error; err != nil {
		return err
	}

	plainText := StripHTML(mod.Title + " " + mod.Description + " " + mod.Content)
	embedding := GenerateEmbedding(plainText)

	// Upsert: update if exists, create if not
	var existing model.ModuleEmbedding
	result := database.DB.Where("module_id = ?", moduleID).First(&existing)
	if result.Error != nil {
		// Create new
		emb := model.ModuleEmbedding{
			ModuleID:  mod.ID,
			CourseID:  mod.CourseID,
			Content:   plainText,
			Embedding: embedding,
		}
		return database.DB.Create(&emb).Error
	}

	// Update existing
	return database.DB.Model(&existing).Updates(map[string]interface{}{
		"content":   plainText,
		"embedding": embedding,
	}).Error
}

// SearchSimilarModules finds the most relevant modules for a query using
// pgvector cosine similarity search.
func SearchSimilarModules(courseID string, query string, limit int) ([]model.ModuleEmbedding, error) {
	queryEmbedding := GenerateEmbedding(query)

	var results []model.ModuleEmbedding
	err := database.DB.Raw(`
		SELECT id, module_id, course_id, content,
		       1 - (embedding <=> $1::vector) as similarity
		FROM module_embeddings
		WHERE course_id = $2
		ORDER BY embedding <=> $1::vector
		LIMIT $3
	`, queryEmbedding, courseID, limit).Scan(&results).Error

	return results, err
}
