// Before/after check-in vocabularies (KUKO WAY concept §8 "Before you start —
// what do you notice?" and §9 "Take a moment — how does your body feel
// now?"). Stable machine values; labels live in the i18n dictionaries
// (`practiceSession.pre.*` / `practiceSession.post.*`). Shared by the API
// validation and the UI so the two can never drift apart.

export const PRE_FEELINGS = ['tension', 'pressure', 'fatigue', 'restlessness'] as const;
export type PreFeeling = (typeof PRE_FEELINGS)[number];

export const POST_FEELINGS = ['better', 'calmer', 'more-open', 'same', 'more-tension'] as const;
export type PostFeeling = (typeof POST_FEELINGS)[number];

// Private free-text reflections ("What did you notice?") — capped so a
// journal entry stays a note, not a document.
export const REFLECTION_NOTE_MAX = 1000;
