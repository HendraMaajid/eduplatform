# PostgreSQL migrations

Migrations are embedded into `cmd/migrate` and tracked by `golang-migrate`.

```bash
MIGRATION_DATABASE_URL='postgresql://edu_migrator:.../eduplatform' go run ./cmd/migrate up
MIGRATION_DATABASE_URL='postgresql://edu_migrator:.../eduplatform' go run ./cmd/migrate version
MIGRATION_DATABASE_URL='postgresql://edu_migrator:.../eduplatform' go run ./cmd/migrate down
MIGRATION_DATABASE_URL='postgresql://edu_migrator:.../eduplatform' go run ./cmd/migrate down 1
MIGRATION_DATABASE_URL='postgresql://edu_migrator:.../eduplatform' go run ./cmd/migrate force 2
```

`DATABASE_URL` is accepted as a fallback only outside production. The migration
role needs DDL rights. The API role should be a non-superuser with only
`SELECT`, `INSERT`, `UPDATE`, and `DELETE` on application tables plus sequence
usage where applicable.

Before migration `000001`, take a PostgreSQL backup and enable maintenance or
read-only mode. That migration intentionally clears historic student activity
and removes payments/enrollments. Its down migration restores the old schema,
not the deleted data. Restore the backup if that data must be recovered.

Migrations `000003` through `000012` each contain one concurrent index command.
Keeping one statement per file avoids the implicit transaction that PostgreSQL
drivers create for multi-statement execution. If a build fails, inspect invalid
indexes, fix the cause, and use `force` only after confirming the schema state.

Migration `000013` adds the English public platform description. The existing
`description` column remains the Indonesian description for backward-compatible
data migration.

Migration `000014` snapshots the configured certificate issuer on every issued
certificate, so later branding changes do not alter historical certificates.
