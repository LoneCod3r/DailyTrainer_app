# events module (not yet implemented)

This folder is a placeholder reserved by the Foundation Phase architecture.

Per the current instructions, the **events** module is intentionally **not**
implemented yet. It exists as an empty module boundary so that a future
instruction (e.g. "Now build the events module") can be implemented here
without restructuring the rest of the application.

When implemented, this module should follow the same pattern as the
existing foundation modules (`modules/users`, `modules/content`, ...):

- `*.service.ts` — business logic, no framework/HTTP concerns
- Prisma models added to `prisma/schema.prisma` with a migration
- Routes under `app/api/events/...`
- Admin UI under `app/admin/events/...` (nav entry already scaffolded)
- Tests under `tests/events/`
