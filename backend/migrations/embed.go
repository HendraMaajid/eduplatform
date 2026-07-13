// Package migrations embeds PostgreSQL migrations into the migration binary.
package migrations

import "embed"

// Files contains every versioned SQL migration.
//
//go:embed *.sql
var Files embed.FS
