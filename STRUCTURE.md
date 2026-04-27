# The Daily Stack — Staging Structure

The Daily Stack is a **universal staging environment**, not a publication platform.
Every pipeline run for every client lands here first. The client reviews here. Approval happens here. Only after approval does content go upstream to the live site.

---

## Purpose

```
Pipeline run → deploy-cache → GitHub Pages → Client reviews visually → Approves → Upstream (FTP / git push)
```

The Daily Stack on GitHub Pages is the review URL Ron (or any client) shares to approve content.
What they see here is **1:1 the destination site** — same design, same structure, same fonts, same CSS.
If it looks right here, it looks right live.

---

## Folder structure

```
deploy-cache/thedailystack/
│
├── index.html                    ← Dashboard: aggregates all clients, all output types
├── article-template.html         ← Legacy Daily Stack style template (pre-client-folder era)
├── STRUCTURE.md                  ← This file
│
└── clients/
    ├── {client-id}/              ← One folder per client
    │   ├── index.html            ← Client landing page (replica of destination site index)
    │   ├── {css/assets}          ← Client-specific stylesheets (copied from source site)
    │   └── {content-type}/       ← One subfolder per content type
    │       ├── index.html        ← Content type index (updated per run)
    │       └── {slug}.html       ← Individual output pages
    │
    ├── ronspoelstra/             ← ronspoelstra.be / The Great Return
    │   ├── index.html            ← TGR series index (cream serif, ronspoelstra.be style)
    │   └── articles/
    │       └── {slug}.html
    │
    ├── tls/                      ← The Local Stack
    │   ├── index.html            ← TLS homepage (chalk.css style)
    │   ├── chalk.css             ← Copied from source site, not modified
    │   └── events/
    │       ├── index.html        ← Events index (updated per run)
    │       └── {slug}.html       ← Individual event pages
    │
    └── bpo/                      ← BPO client (future)
        └── index.html
```

---

## The dashboard (index.html)

The root `index.html` is the editorial dashboard. It shows every piece of output across all clients as a card in reverse-chronological order.

Each card shows:
- Coloured dot identifying the client/publication (`.card-pub.pub-{id}`)
- Content type badge (article, event, news brief)
- Title (links into the client subfolder — the visual replica)
- Deck / excerpt
- Date + read time

Client dot colours (defined in `index.html` CSS):
| Client | Class | Colour |
|--------|-------|--------|
| The Great Return (ronspoelstra) | `.pub-tgr` | `#7aadcc` (steel blue) |
| The Local Stack | `.pub-tls` | `#5abfa0` (chalk green) |
| BPO | `.pub-bpo` | `#3b82f6` (blue) |

Adding a new client = add a dot colour + add a `pub-{id}` class. The card HTML pattern is the same for every client.

---

## Client folder rules

### 1. The client folder mirrors the destination site exactly

The design inside `clients/{id}/` must match the live destination site as closely as possible:
- Copy the CSS file from the source site as-is — do not rewrite it
- Use the same fonts, same variable names, same layout structure
- The only difference: back-links point to the dashboard (`../../index.html`) instead of the live domain

### 2. Content type subfolders

Each client can have multiple content type subfolders:

| Client | Content type | Subfolder |
|--------|-------------|-----------|
| ronspoelstra | TGR articles | `articles/` |
| tls | Event pages | `events/` |
| tls | News briefs (future) | `news/` |

### 3. Index files per content type

Each subfolder has an `index.html` that lists all staged items in that content type, in reverse date order.
The Site Builder skill updates this file on every run.

### 4. The client root `index.html`

The client root `index.html` is the replica of the destination site's homepage. It shows the full site design — nav, hero, article/event list — populated with whatever is staged.

---

## Pipeline → staging contract

There are two separate locations involved. Do not confuse them.

### 1. Workspace site folder — where pipeline skills write

```
/workspace/clients/{client-id}/site/      ← Publisher / Site Builder writes here
```

This is the working copy inside the editorial-nanobot container. All pipeline output (HTML pages, updated indexes, CSS) is written here. This folder is the **source of truth** for the site.

| Client | Workspace site folder |
|--------|----------------------|
| ronspoelstra (TGR) | `clients/ronspoelstra/site/` |
| The Local Stack | `clients/tls/site/the-local-stack/` |

### 2. deploy-cache — the git-hosted staging copy

```
deploy-cache/thedailystack/clients/{client-id}/    ← git repo pushed to GitHub Pages
```

This folder mirrors the workspace site folder. It is a separate git repo (`deploy-cache/thedailystack/.git`). Content is synced here by the **Deploy step**, then git-committed and pushed.

### Full pipeline → live flow

```
Pipeline skill
  └─ writes to /workspace/clients/{id}/site/{content-type}/{slug}.html
  └─ updates /workspace/clients/{id}/site/{content-type}/index.html
  └─ writes meta.json  status: "staged"

Deploy step (daily-stack UI or manual)
  └─ syncs workspace site folder → deploy-cache/thedailystack/clients/{id}/
  └─ git add + commit + push
  └─ GitHub Pages serves the updated site automatically
  └─ updates meta.json  status: "staged-review-ready"
  └─ TLSbot posts review URL to Ron on Discord

Post-approval (manual)
  └─ FTP upload from workspace site folder to live host
  └─ append slug to published_events.txt / published_articles.txt
```

The pipeline does NOT touch `published_events.txt` or the live FTP target. That is a manual post-approval step.

---

## Review and approval flow

```
1. Site Builder pushes to GitHub Pages
2. TLSbot posts the review URL to Ron on Discord
3. Ron opens the link — sees the page exactly as it will look live
4. Ron approves (Discord reply or UI button)
5. Manual: FTP upload of the approved file to the live host
6. Manual: append slug to published_events.txt (or published_articles.txt)
```

Optional step between 3 and 4: a larger LLM (e.g. Grok 4) does a code + content review on the staged HTML. TLSbot posts the review summary alongside the preview link so Ron can read both at once.

---

## Adding a new client

1. Create `clients/{new-id}/` in deploy-cache
2. Copy the destination site's CSS to `clients/{new-id}/{stylesheet}.css`
3. Create `clients/{new-id}/index.html` — replica of the destination homepage, with placeholder content
4. Add a dot colour class `.pub-{new-id}` to the dashboard `index.html` CSS
5. Add the client to `workspaces/editorial/clients/{new-id}/profile.json` with correct `site_dir` pointing here
6. Document content types and subfolders in the client profile

---

## Current client status

| Client | Workspace site folder | Deploy-cache folder | Status |
|--------|-----------------------|--------------------|---------|
| ronspoelstra (TGR) | `clients/ronspoelstra/site/` | `clients/ronspoelstra/` | Active — 24 articles in workspace, 1 in deploy-cache (needs sync) |
| The Local Stack | `clients/tls/site/the-local-stack/` | `clients/tls/` | Stub — deploy-cache needs seeding from workspace |
| BPO | `clients/bpo/site/` | `clients/bpo/` | Stub |
