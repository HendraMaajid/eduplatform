package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

// AIProvider defines the interface for AI chat providers.
// Implement this interface to add new providers (OpenAI, Anthropic, etc.)
type AIProvider interface {
	StreamChat(ctx context.Context, messages []groqMessage, writer io.Writer) error
}

// groqMessage is the message format for Groq/OpenAI-compatible APIs.
type groqMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// groqRequest is the request body for Groq API.
type groqRequest struct {
	Model       string         `json:"model"`
	Messages    []groqMessage  `json:"messages"`
	Stream      bool           `json:"stream"`
	Temperature float64        `json:"temperature"`
	MaxTokens   int            `json:"max_tokens"`
}

// groqStreamChunk represents a single SSE chunk from Groq.
type groqStreamChunk struct {
	Choices []struct {
		Delta struct {
			Content string `json:"content"`
		} `json:"delta"`
		FinishReason *string `json:"finish_reason"`
	} `json:"choices"`
}

// GroqProvider implements AIProvider for Groq's OpenAI-compatible API.
type GroqProvider struct {
	APIKey  string
	Model   string
	BaseURL string
}

// NewGroqProvider creates a new Groq AI provider from environment variables.
func NewGroqProvider() *GroqProvider {
	model := os.Getenv("AI_MODEL")
	if model == "" {
		model = "llama-3.3-70b-versatile"
	}

	baseURL := os.Getenv("AI_BASE_URL")
	if baseURL == "" {
		baseURL = "https://api.groq.com/openai/v1"
	}

	return &GroqProvider{
		APIKey:  os.Getenv("GROQ_API_KEY"),
		Model:   model,
		BaseURL: baseURL,
	}
}

// StreamChat sends messages to Groq and streams the response.
func (g *GroqProvider) StreamChat(ctx context.Context, messages []groqMessage, writer io.Writer) error {
	if g.APIKey == "" {
		return fmt.Errorf("GROQ_API_KEY is not configured")
	}

	reqBody := groqRequest{
		Model:       g.Model,
		Messages:    messages,
		Stream:      true,
		Temperature: 0.7,
		MaxTokens:   2048,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", g.BaseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+g.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call Groq API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Groq API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse SSE stream from Groq and forward to client
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()

		if !strings.HasPrefix(line, "data: ") {
			continue
		}

		data := strings.TrimPrefix(line, "data: ")

		if data == "[DONE]" {
			fmt.Fprintf(writer, "data: [DONE]\n\n")
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
			break
		}

		var chunk groqStreamChunk
		if err := json.Unmarshal([]byte(data), &chunk); err != nil {
			continue
		}

		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			// Send simplified SSE to client
			content := chunk.Choices[0].Delta.Content
			sseData, _ := json.Marshal(map[string]string{"content": content})
			fmt.Fprintf(writer, "data: %s\n\n", sseData)
			if flusher, ok := writer.(http.Flusher); ok {
				flusher.Flush()
			}
		}
	}

	return scanner.Err()
}

// GetAIProvider returns the configured AI provider.
func GetAIProvider() AIProvider {
	provider := os.Getenv("AI_PROVIDER")
	switch provider {
	case "groq", "":
		return NewGroqProvider()
	default:
		log.Printf("Unknown AI_PROVIDER '%s', falling back to groq", provider)
		return NewGroqProvider()
	}
}

// RunRAGPipeline executes the full RAG pipeline: retrieve → augment → generate.
func RunRAGPipeline(ctx context.Context, req dto.ChatRequest, writer http.ResponseWriter) error {
	// 1. Ensure embeddings exist for this course
	if err := EnsureModuleEmbeddings(req.CourseID); err != nil {
		log.Printf("Warning: failed to ensure embeddings: %v", err)
	}

	// 2. Get course info
	var course model.Course
	if err := database.DB.First(&course, "id = ?", req.CourseID).Error; err != nil {
		return fmt.Errorf("course not found: %w", err)
	}

	// 3. Search for relevant modules
	relevantModules, err := SearchSimilarModules(req.CourseID, req.Message, 3)
	if err != nil {
		log.Printf("Vector search failed, falling back to keyword search: %v", err)
		relevantModules = keywordFallbackSearch(req.CourseID, req.Message)
	}

	// 4. Build the messages array with RAG context
	messages := buildRAGMessages(course.Title, relevantModules, req)

	// 5. Stream response from AI provider
	provider := GetAIProvider()

	// Set SSE headers
	writer.Header().Set("Content-Type", "text/event-stream")
	writer.Header().Set("Cache-Control", "no-cache")
	writer.Header().Set("Connection", "keep-alive")
	writer.Header().Set("X-Accel-Buffering", "no") // Disable nginx buffering

	return provider.StreamChat(ctx, messages, writer)
}

// buildRAGMessages constructs the full message array for the AI.
func buildRAGMessages(courseTitle string, modules []model.ModuleEmbedding, req dto.ChatRequest) []groqMessage {
	// Build context from retrieved modules
	var contextParts []string
	for i, mod := range modules {
		// Truncate content to ~2000 chars per module for token efficiency
		content := mod.Content
		if len(content) > 2000 {
			content = content[:2000] + "..."
		}
		contextParts = append(contextParts, fmt.Sprintf("=== Materi %d ===\n%s", i+1, content))
	}

	contextText := strings.Join(contextParts, "\n\n")
	if contextText == "" {
		contextText = "(Tidak ada materi yang ditemukan untuk pertanyaan ini)"
	}

	systemPrompt := fmt.Sprintf(`Kamu adalah AI Teman Belajar yang membantu siswa memahami materi kursus "%s".

ATURAN:
1. Jawab pertanyaan siswa berdasarkan materi kursus yang diberikan di bawah.
2. Jelaskan dengan bahasa yang mudah dipahami, ramah, dan supportif.
3. Gunakan contoh jika memungkinkan untuk memperjelas penjelasan.
4. Jika pertanyaan tidak berkaitan dengan materi kursus, sampaikan dengan sopan bahwa kamu hanya bisa membantu seputar materi kursus ini.
5. Jika materi tidak mencakup jawaban, katakan bahwa informasi tersebut belum ada di materi dan sarankan bertanya ke pengajar.
6. Gunakan format Markdown untuk response (bold, list, code block, dll) agar mudah dibaca.
7. Jawab dalam bahasa yang sama dengan pertanyaan siswa (Indonesia/English).

MATERI KURSUS:
%s`, courseTitle, contextText)

	messages := []groqMessage{
		{Role: "system", Content: systemPrompt},
	}

	// Add chat history
	for _, h := range req.History {
		messages = append(messages, groqMessage{
			Role:    h.Role,
			Content: h.Content,
		})
	}

	// Add current user message
	messages = append(messages, groqMessage{
		Role:    "user",
		Content: req.Message,
	})

	return messages
}

// keywordFallbackSearch provides a simple ILIKE-based search as fallback
// when pgvector is unavailable or returns an error.
func keywordFallbackSearch(courseID string, query string) []model.ModuleEmbedding {
	words := strings.Fields(strings.ToLower(query))
	if len(words) == 0 {
		return nil
	}

	var modules []model.Module
	q := database.DB.Where("course_id = ?", courseID)

	// Search in title, description, and content
	conditions := make([]string, 0)
	args := make([]interface{}, 0)
	for _, word := range words {
		if len(word) < 3 {
			continue
		}
		conditions = append(conditions, "(LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(content) LIKE ?)")
		pattern := "%" + word + "%"
		args = append(args, pattern, pattern, pattern)
	}

	if len(conditions) > 0 {
		q = q.Where(strings.Join(conditions, " OR "), args...)
	}

	q.Limit(3).Find(&modules)

	// Convert to ModuleEmbedding format
	results := make([]model.ModuleEmbedding, 0, len(modules))
	for _, mod := range modules {
		results = append(results, model.ModuleEmbedding{
			ModuleID: mod.ID,
			CourseID: mod.CourseID,
			Content:  StripHTML(mod.Title + " " + mod.Description + " " + mod.Content),
		})
	}

	return results
}
