# Legal documents: open items before publication

> INTERNAL. Not for publication. Never served by the website (files in
> `modules/` are not public), never part of a document, never translated for
> the site.

## Latest status (24.10.2026, supersedes the rows below where they differ)

**Published.** Client decision (24.10.2026): publish the shortened BG and
EN texts now, on the non-launched progress site, and refine them in later
versions. All three documents are `status: 'published'`, version `1.0`,
effective 24.10.2026. They are served once `LEGAL_DOCUMENTS_PUBLISHED=true`
is set in the deployment. A changed text needs a new version.

What the published texts say, matching production (`c25d9f2` / `e37e850`):

- No contact email: the six clauses that referred to one (Terms 3.3, 5.4,
  5.5; Privacy §4, §8, §10) say "the contact details in clause/section 1"
  (address and phone).
- Privacy §2/§4 describe the optional before/after check-ins and personal
  notes as they exist today: stored for signed-in users, visible only to the
  author. There is no consent mechanism, so the texts make no consent or
  withdrawal claim. §3 has no separate line for them; they fall under the
  existing "saving progress" line (Art. 6(1)(b)).
- Privacy §9: check-ins and notes are kept with the account data, "as long
  as the account exists". Nothing is deleted automatically.

Open, for later versions (known limitations of version 1.0):

1. **Legal basis for check-ins and notes (lawyer).** They may reveal health
   information. The lawyer's source (`02_Politika_poveritelnost.docx` §3)
   says such data needs an Art. 9 exception, e.g. explicit consent, or the
   feature should not collect it. Version 1.0 does not settle Art. 9. Terms
   2.3 ("not consent to the processing of health data") belongs in the same
   review. If the labels or notes are removed from the product, update §2,
   §4 and §9.
2. **Contact email** (ЗЕТ чл. 4, Directive 2000/31 Art. 5(1)(c), DSA
   Art. 12): required before public launch. Set it in `company.ts`, add it
   to the provider clauses and point the six clauses back to it (new
   version).
3. **Manual processes** the texts promise (section C below): account
   deletion on request, access/portability requests, report decisions,
   notice of changes.
4. **Not verifiable without production access:** whether `STRIPE_SECRET_KEY`
   is set in production (B, donation test checkout vs. Terms 6 and Privacy 7).
5. `modules/consent/` (uncommitted) and its retention purge are not part of
   version 1.0 and are not described by it.

## Earlier notes

Status 24.10.2026: an earlier note here recorded that the lawyer had
approved all six texts in `content/` (BG and EN). That approval is **not
independently confirmed**, and the English files were marked "not yet
legally reviewed" at the time. Reconfirm it in writing before publication.
Two changes were made after that note, so any earlier approval does not
cover them:

- **Privacy §9:** the check-ins and notes retention line is now a placeholder
  in both languages (A4).
- **Terms 3.2 (EN only):** "available on all your devices" became "on
  different devices", to match the Bulgarian „от различни устройства“.

The texts contain public wording only: no team notes or draft status lines.
The English versions are connected to the registry (`documents.ts`).

The documents remain `draft` and unpublished. Activation is refused by
`legal.service.ts` for three reasons: the draft status, the unset
`{contactEmail}` and the bracketed §9 field. That guard is intentional and
must not be bypassed.

Confirmed, do not ask again: provider „3Д ЛУК ООД“, UIC 175172901, VAT
number BG175172901, address „ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2“,
phone 0895720370. Everything the lawyer approved as written: the controller
named as 3Д ЛУК ООД, "3DLOOK LTD" in EN, minimum age 18, reCAPTCHA as
necessary, recipients by category, the general transfer clause, retention by
criteria, the BG-prevails clause and „медицинско изделие“.

## A. Still blocks publication

| # | Item | Why it blocks | Ways forward (needs a decision) |
|---|---|---|---|
| A1 | **Contact email.** `info@kukoway.com` is not available yet. **Status 24.10.2026:** the client has not provided a valid address. The `{contactEmail}` placeholder stays and `COMPANY_INFO.contactEmail` stays unset. No address may be invented. | The approved texts include an email (Terms 1, Privacy 1, Cookies 2), and other clauses refer to it: account deletion, reports, rights requests, consent withdrawal. The guard keeps every document inactive while `COMPANY_INFO.contactEmail` is unset. Publishing without a working address would make those clauses unusable. | (a) Wait until the mailbox works, then set `contactEmail`. (b) The client names another address that already works today. It drops into the approved wording unchanged. (c) Remove the email from the texts: this changes approved content and needs the lawyer. |
| A2 | **Pre-consent check-in data.** Explicit consent for check-ins and notes is implemented: recorded, enforced on the server, withdrawable (section F). Check-ins and notes stored *before* the consent mechanism existed have no consent behind them. | The approved Privacy §4 says they are stored "only with your explicit consent". **Interim decision (client, 24.10.2026; the site is not yet public):** they stay in the database but the app ignores them. Implemented with an explicit `coveredByConsent` flag: existing rows default to `false` and are never shown, used, changed, deleted, backfilled or marked as consented. Practice completions still count; only the check-in data is ignored. Withdrawal and retention act on flagged rows only. The production row count is unknown (local dev DB: 16 practice sessions and 1 reflection, all one demo user). | Still needs a final decision before publication: (a) delete them (a separate, approved data operation); (b) keep them ignored indefinitely (then they count toward retention and access requests, and §4 should be checked against this); (c) something else. |
| A3 | **Production migrations** `20261024095157_add_check_in_consent` (additive: `consents`, `consent_events`) and `20261024160000_add_covered_by_consent` (additive `coveredByConsent` columns, default `false`; the reflection unique key now includes the flag). | Applied to the local dev DB only. Production has neither, so this code must not be deployed before both run. | Needs separate approval, then `.github/workflows/migrate-production.yml`. **Second audit (24.10.2026):** the second migration was not compatible with the deployed code. It is now split into `20261024160000_add_covered_by_consent` (expand) and `20261024170000_drop_old_reflection_unique_index` (contract), deployed in three groups. See `docs/check-in-consent-rollout.md` §10–§11. |
| A4 | **Privacy §9: retention of check-ins and notes. PLACEHOLDER in both languages. PROPOSED 12 months from each record's creation, NOT APPROVED.** | At the client's request (24.10.2026), the §9 line "until you withdraw your consent or your account is deleted" was replaced by `[СРОК НА СЪХРАНЕНИЕ – ПРЕДСТОИ ПОТВЪРЖДЕНИЕ]` / `[RETENTION PERIOD – TO BE CONFIRMED]`. The rest of §9 is unchanged. The bracketed field blocks activation of the Privacy Policy. A published privacy policy must state the period or the criteria for it (GDPR Art. 13(2)(a)), so it can't go live with the placeholder. An automatic purge exists (`modules/consent/retention.ts`) but is **off**: it runs only if `CHECK_IN_RETENTION_POLICY.approved` is set to true in code **and** `CHECK_IN_RETENTION_PURGE_ENABLED=true`, and nothing schedules it. It touches only rows flagged `coveredByConsent`, never pre-consent rows, and it keeps practice completions. | Client and lawyer confirm: (a) the period; (b) whether it runs from creation (as proposed) or from the last edit, which matters for editable program reflections; (c) the final §9 wording in BG and EN, which replaces the placeholder. If the period is time-based, also approve it in code, wire a scheduled job and enable the flag. If §9 keeps "until withdrawal or deletion", the purge stays off. |
| A5 | **Publication order.** Privacy §4 says check-ins and notes are stored "only with your explicit consent". | That is true only once the consent feature is live. Production (`c25d9f2`) has no consent mechanism and stores check-ins without consent. | The Privacy Policy (and with it the set of three, which belong together) must not be published before the A3 migrations have run **and** the consent code is deployed. Sequence: `docs/check-in-consent-rollout.md` §9. |
| A6 | **Text vs. app, for the lawyer.** | §4 names only email as the way to withdraw consent, but the app also offers a button in account settings (F.2). §2 does not mention the consent records the app keeps: grant/withdrawal, text version, language, source, time (F.3). Terms §6 and Privacy §7 depend on whether production exposes the Stripe *test* checkout (section B). | Decide whether §2/§4 need a sentence each (new wording, both languages). Check the production environment for the Stripe question. |

## B. Not blocking, but check before or at publication

- **Town and postcode** are missing from the address. The lawyer approved it
  as written. Adding them is recommended (the e-commerce law's provider
  details) and is a factual addition, not a wording change.
- **Donation test checkout.** Terms 6 ("no payments or donations are
  accepted") holds for real money: `lib/stripe.ts` refuses a non-test key in
  production. But `/account/donation` lets a signed-in user open a Stripe
  *test* checkout whenever `STRIPE_SECRET_KEY` is set in production, and
  Stripe would then receive what they type in. Someone with Vercel access
  must check the production environment. If the key is set, disable the
  page, or have the lawyer add Stripe to Privacy 7.
- **Production database:** `.env.example` documents Neon (pooled URL in
  Vercel, direct URL as the GitHub secret for migrations). Privacy 7 names
  database providers only as a category, so this is for the records (Art. 28
  agreement, location, any transfer).
- **Records only, not text changes:** the actual transfer mechanism for
  Vercel and Google (DPF or SCCs), the production database and email
  providers with their Art. 28 agreements, and the real backup and log
  periods.
- **At activation:** version `1.0` and the actual publication date as
  `effectiveDate`. The new Cookie Policy version asks visitors for their
  cookie choice again.

## C. Commitments in the texts that need a manual process on day one

No tool in the app covers these. Someone must actually do them:

- Delete an account and all its data on request (Terms 3.3, Privacy 9–10).
  Only direct database access can do this today.
- Answer access and portability requests with the user's data (Privacy 10).
  There is no export.
- Handle reports sent by email, tell the person who reported the decision,
  and give authors the reasons and a way to contest (Terms 5.4–5.5, DSA
  Arts. 16–17). The app sends no such notifications.
- Notify registered users of material changes (Terms 8.1, Privacy 14).

## D. Optional (would shorten the texts or reduce risk)

- Host the YouTube thumbnails locally. The YouTube sentences in Privacy 7 and
  Cookies 4 would then go.
- Allow uploaded avatars only, with no external URLs (`lib/validations/users.ts`).
- An admin tool to delete, anonymise and export a user (covers section C).

## F. Check-in consent: implementation and open questions for the lawyer

Implemented 24.10.2026 (`modules/consent/`, `app/api/consents/check-ins`,
`components/consent/`, migration `20261024095157_add_check_in_consent`):

- **Scope:** before/after practice check-ins, selected feelings, optional
  notes and program day reflections (Privacy §2–4, §9). The text shown is in
  the i18n dictionaries (`consent.checkIns.*`, BG and EN) and is pinned to
  `CHECK_IN_CONSENT_VERSION` = `check-ins-1` by a test (a hash of the text).
  Changing the text requires a new version; a consent for an older version
  no longer counts.
- **Giving consent:** a separate, never pre-ticked checkbox and a button, in
  the practice flow ("Before you start") or in account settings. Registration,
  accepting the Terms or using the app is never treated as consent. Without
  consent, practices, completions, favourites, streaks and Journey all work.
- **Records:** `consents` (current state per user) and `consent_events`
  (append-only: grant or withdrawal, text version, language, source,
  timestamp). No IP address, user agent or other identifier. The user and
  time come from the server, never from the request.
- **Enforcement:** every write of covered data checks the consent inside the
  write's own transaction, holding the consent row lock. Without consent it
  is rejected (403 `CONSENT_REQUIRED`), never silently trimmed.
- **Coverage is explicit:** a write that passed the consent check sets
  `coveredByConsent = true` in the same transaction (practice check-ins and
  program reflections). Nothing is inferred from timestamps. Pre-consent rows
  stay `false` and are ignored by the app (A2). A consented reflection is
  stored next to, never over, a pre-consent reflection for the same day.
- **Withdrawal** (settings, after a confirmation that states what will be
  deleted, or on request by email): in one transaction, status → WITHDRAWN,
  audit event, and deletion of every flagged check-in and note, including
  those given under an older text version. Completions stay. Granting again
  restores nothing.
- **Retention:** proposed only, and switched off (A4).

Questions for the lawyer (not decided in code):

1. **Pre-consent records:** see A2.
2. **In-app withdrawal:** Privacy §4 names email as the way to withdraw. The
   settings button is an additional way (GDPR Art. 7(3): as easy to withdraw
   as to give). Confirm, or add it to §4.
3. **Retention of consent evidence:** `consent_events` is kept, as proof of
   consent (Art. 7(1)), for as long as the account exists. It is deleted with
   the account (Cascade), like `legal_agreements`. Confirm the period and its
   legal basis, or say whether it must outlive the account.
4. **The consent text itself** (`consent.checkIns.*`) follows Privacy §4 and
   adds no purpose. It should still be reviewed as the wording users consent
   to.
5. **"Skip" after a practice** now saves no check-in data at all (product
   decision, 24.10.2026).

## E. Activation steps (once section A is resolved)

1. Set `company.ts` `contactEmail` to the working address. Replace the §9
   placeholder in `content/privacy.{bg,en}.ts` with the approved wording (A4).
   Apply the lawyer's A2/A6 wording if that route is chosen.
2. ~~Connect the English texts~~: done 24.10.2026 (`documents.ts`
   `content: { bg, en }`).
3. `documents.ts`: `status: 'published'`, `version: '1.0'`, `effectiveDate`.
4. Update the tests that pin the unpublished state (`legal-documents`,
   `legal-document-page`, `legal-translations`, `e2e/legal.spec.ts`). Run the
   unit tests, typecheck, lint, E2E and a production build. For E2E, use a
   server started with `RECAPTCHA_SECRET_KEY=""` and `SMTP_HOST=""`: a
   reused dev server with the real secret fails the registration test.
5. Commit only the legal files (not the PDFs or DOCX). Push to `main`; Vercel
   deploys production. Then set `LEGAL_DOCUMENTS_PUBLISHED=true` in Vercel
   (Production) and redeploy. Setting it back to `false` unpublishes.
6. On the live site, check all three routes in BG and EN. Also check that the
   `20261002180000_add_legal_agreements` migration is applied in production
   (`.github/workflows/migrate-production.yml`).
7. `kukoway.com` currently resolves to non-Vercel addresses and does not
   serve this app (checked 24.10.2026). Verify it again after the move. The
   texts use relative links only.
