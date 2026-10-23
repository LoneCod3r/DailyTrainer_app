# Home page imagery — sourcing & license

Placeholder photography for the Home page hero and Explore section, used until
real KUKO WAY practice photography/video is available. All from Pexels,
licensed under the [Pexels License](https://www.pexels.com/license/) (free
for commercial and personal use, no attribution required, modification
permitted). Attribution is included below anyway as a courtesy and so the
source is traceable if any of these need to be swapped out later.

| File | Source | Used for |
|---|---|---|
| `home-page-banner-bg.webp` | supplied directly by the client (not from Pexels) — `19.10.2026/Pictures/заглавна страница.png` re-encoded as WebP, pixels unchanged | Hero banner, Bulgarian locale (finished artwork with embedded text) |
| `home-page-banner-en.webp` | derived from the client's Bulgarian banner above: only the embedded text was replaced (erased and re-set in matching typefaces — EB Garamond and Open Sans, both SIL OFL); artwork, logo, photo, colors, layout and size unchanged. English wording is the client's own, from `19.10.2026/Pictures/Fascial_Maneuvers_A4_.docx` | Hero banner, English locale |
| `home-page.webp` | supplied directly by the client (not from Pexels) | unused (kept on disk; earlier hero photo) |
| `hero-todays-practice.jpg` | https://www.pexels.com/photo/4056723/ | unused (kept on disk; earlier hero photo) |
| `start-here-full-twist.jpg` | supplied directly by the client (not from Pexels) — the client's own photograph of "Пълно усукване", Part 2, from `KUKO_WAY_Fascia for beginners.pdf`, printed page 16 (PDF page 17); the embedded JPEG copied out byte-for-byte (`pdfimages -j`), 1086×1448, not re-encoded or edited | "Start Here" row (home) and the "Start Here" tile on `/practices` (focal point `object-[50%_15%]`) |
| `feel-better-now-antigravity.jpg` | supplied directly by the client (not from Pexels) — the client's own photograph of "Антигравитация", from `KUKO_WAY_Fascia for beginners.pdf`, printed page 17 (PDF page 18); the embedded JPEG copied out byte-for-byte (`pdfimages -j`), 1024×1536, not re-encoded or edited | "Feel Better Now" row (home) and the "Feel Better Now" tile on `/practices` (focal point `object-[50%_28%]`) |
| `explore-start-here.jpg` | https://www.pexels.com/photo/6975774/ | unused (kept on disk; replaced by `start-here-full-twist.jpg`) |
| `explore-feel-better-now.jpg` | https://www.pexels.com/photo/6926019/ | unused (kept on disk; replaced by `feel-better-now-antigravity.jpg`) |
| `explore-library.jpg` | https://www.pexels.com/photo/6339388/ | unused (kept on disk; earlier hero photo) |
| `library.jpeg` | supplied directly by the client (not from Pexels) | "Library" row |

Replace any of these with real KUKO WAY photography/video stills whenever
it becomes available — the components referencing them
(`app/(app)/page.tsx`) don't need to change, just the files here.
