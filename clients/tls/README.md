The Local Stack — event pipeline

This folder contains tooling for The Local Stack event-page pipeline.

Structure
- `agents/` — agent prompt templates and `agents.json.sample` (fill with real agent IDs when available).
- `drafts/` — output folder for generated drafts. Each event goes into `drafts/{slug}/`.
- `pipeline.py` — minimal pipeline stub to create the draft layout and later orchestrate agent calls.

Quick start
1. Edit `agents/agents.json` with your Mistral agent IDs.
2. Run the pipeline to create a draft folder:

```bash
cd e:\NEVEN\ron\site\the-local-stack
python pipeline.py --slug nlp-seminar --title "NLP & Text Mining Seminar" --date 2026-03-31
```

Next steps
- Replace the `pipeline.py` stub with orchestrator logic that calls Mistral agents in sequence (Researcher → Writer → Media → Controller).
- Keep the human review step: editors pick up `drafts/{slug}` and publish after approval.
