# courses module (not yet implemented)

This folder is a placeholder reserved by the Foundation Phase architecture.

Per the current instructions, the **courses** module is intentionally **not**
implemented yet. It exists as an empty module boundary so that a future
instruction (e.g. "Now build the courses module") can be implemented here
without restructuring the rest of the application.

When implemented, this module should follow the same pattern as the
existing foundation modules (`modules/users`, `modules/content`, ...):

- `*.service.ts` — business logic, no framework/HTTP concerns
- Prisma models added to `prisma/schema.prisma` with a migration
- Routes under `app/api/courses/...`
- Admin UI under `app/admin/courses/...` (nav entry already scaffolded)
- Tests under `tests/courses/`
