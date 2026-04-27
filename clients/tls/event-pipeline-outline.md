Event page pipeline — outline

Purpose
- Create a repeatable, human‑assisted agent pipeline that turns public event listings into rich, on‑site event pages for The Local Stack. Output lives under `site/the-local-stack/drafts/{slug}` and is picked up by editors for final publication.

Goals
- Keep visitors on-site by offering richer, localised pages than organiser pages: short analysis, speaker bios, programme, local context, links and tickets.
- Maintain high trust: only public, non-paywalled sources; explicit sourcing for every factual claim.
- Human in the loop: agents produce drafts; final publishing after human review.

High-level flow (agents)
1. Researcher
  - Input: event URL(s) or event title + date
  - Output: `research.json` with canonical fields and array of source URLs; only facts, no opinions
2. Writer
  - Input: `research.json`
  - Output: `article.html` (HTML fragment per site writer spec) + `<figure>` placeholders
3. Media
  - Input: `article.html`
  - Output: `image-prompts.txt` (one prompt per `<figure>`) and optional `images/` if images are produced manually
4. Controller
  - Input: `research.json`, `article.html`
  - Output: `review.txt` with fact checks, missing sources, flagged claims, and a publish recommendation
5. Human editor
  - Picks up `drafts/{slug}`, verifies, runs images if needed, renames images to `secX.jpg`, and publishes

Minimal data model (JSON fields)
- title, slug, short_lead, date, start_time, end_time, location{name, address, geo?}, organiser{name,url}, ticket_url, price, programme:[{time, title, description, speakers}], speakers:[{name, org, profiles:[url], bio_sources:[url]}], figures:[{id, alt, suggested_filename}], sources:[url], last_checked, status (draft|ready|published|rejected)

Draft folder layout (per event)
- `drafts/{slug}/`
  - `research.json`  -- canonical facts + sources
  - `article.html`   -- writer output (HTML fragment, no <head>/<body>)
  - `image-prompts.txt`
  - `images/`        -- manual or downloaded images (UUID names until approved)
  - `review.txt`     -- controller notes
  - `meta.json`      -- small metadata (created_by, timestamps)

Proposed repo placement
- Keep the pipeline and scripts within the working group folder:
  - `e:/NEVEN/ron/site/the-local-stack/pipeline.py`  <-- orchestrator for local-stack events
  - `e:/NEVEN/ron/site/the-local-stack/agents/`     <-- local copies of agent prompts and specs
  - `e:/NEVEN/ron/site/the-local-stack/drafts/`     <-- output during runs

Agent guardrails and rules
- Researcher: only return facts with exact source URLs. If no primary source, return `{"error":"no_verified_sources"}`.
- Writer: annotate sentences derived from weak sources with `[source:N]` inline comments (for Controller to verify).
- Controller: must flag any speaker claim lacking a direct public profile link.
- Media: must avoid copyrighted logos/faces; prompts must specify "no logos, no text, no faces".

Human review checklist (Controller → editor)
- Every speaker statement has >=1 primary source link.
- Ticket/price/venue verified against organiser page.
- No paywalled or scraped content reproduced verbatim.
- Image prompts checked for IP risk; hero chosen and image files named `sec1.jpg`..`secN.jpg`.
- Set `status: ready` only after manual approval.

Operations
- Run cadence: on-demand or scheduled crawl for upcoming events (cron weekly).
- `pipeline.py` run: `python pipeline.py --event-url "<url>"` or `python pipeline.py --slug "nlp-seminar"`
- Keep `last_checked` timestamps; automated re-run for drafts with `status:draft` if event date > now and sources changed.

Testing and QA
- Start with one manual event (NLP seminar) to prove flow end‑to‑end.
- Track assertion failure rate: percent of sentences Controller flags.
- Maintain a small sample of approved event pages as templates.

Next steps (once aligned)
1. Agree folder layout and `meta.json` fields.
2. Create local agent prompts (Researcher/Writer/Media/Controller) and place in `agents/`.
3. Implement `pipeline.py` in `site/the-local-stack/` and test with the `card-nlp-seminar` event.

Notes
- Do not ingest paywalled content. Only public profiles and organiser pages.
- Images: keep manual-by-default; later add BFL integration if we accept cost and API key management.

