# ============================================
# Stage 1: Build the Go binary
# ============================================
FROM golang:1.26-alpine AS builder

WORKDIR /app

# Install git (needed for some Go modules)
RUN apk add --no-cache git

# Copy go mod files first for layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary with optimizations
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server ./cmd/main.go

# ============================================
# Stage 2: Run the binary in a minimal image
# ============================================
FROM alpine:3.21

WORKDIR /app

# Install ca-certificates for HTTPS connections (Supabase)
RUN apk add --no-cache ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/server .

# Copy public directory for static files (uploads)
COPY --from=builder /app/public ./public

# Copy .env.example as reference (actual env vars set via Railway)
COPY --from=builder /app/.env.example .

# Create uploads directory
RUN mkdir -p /app/public/uploads

# Expose port (Railway sets PORT env var automatically)
EXPOSE 8080

# Run the binary
CMD ["./server"]
