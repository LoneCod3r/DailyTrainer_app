# Practice hub imagery — sourcing & license

| File | Source | Used for |
|---|---|---|
| `welcome.webp` | supplied directly by the client (not from Pexels) — `19.10.2026/Pictures/welcome2.jpg` re-encoded as WebP (quality 88); dimensions (896×1200) and image content unchanged — no further editing on our side | "About the practice" section on `/practices`, both locales (the photo carries no text; the quote and the welcome note are page text) |

Provenance of the client's image (from its embedded C2PA Content Credentials):
an OpenAI `gpt-image` image (2026-07-21), edited with Google Generative AI —
the edits removed the earlier text card and the embedded quote and the
darkening band behind it; the floor and ceiling areas that replaced them are
AI-generated, so this is not a camera original.

The page that shows it (`app/(app)/practices/page.tsx`) uses the same file for
both languages; replacing it needs no code change as long as the name and the
896×1200 size stay the same.
