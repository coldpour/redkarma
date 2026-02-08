# Shows Build Step Design

## Goals
- Make `shows.txt` the single source of truth for all shows.
- Generate `index.html` and `shows.html` from `shows.txt` on each change.
- Hide past shows on `index.html` and hide future shows on `shows.html` using JS + CSS.
- Keep GitHub Pages deployment simple and automatic.

## Data Format
- `shows.txt` is a list of paragraphs separated by blank lines.
- Each paragraph lines map to:
  1. `YYYY-MM-DD` date
  2. venue name
  3. city/state
  4. optional link

## Build Script
- Add a Node script (`scripts/build-shows.mjs`) that:
  - Parses `shows.txt` into show objects.
  - Sorts all shows by date ascending.
  - Renders `.show-item` blocks with `data-date="YYYY-MM-DD"`.
  - Inserts full show lists into `index.html` and `shows.html` in the existing shows sections.
  - Only renders a link button when a link is present.

## Runtime Filtering
- Add a small JS snippet shared by both pages.
- On DOMContentLoaded, compare each `data-date` to today in local time.
- Mark past or future shows by adding a class (`is-past` / `is-future`).
- CSS hides `is-past` on `index.html` and `is-future` on `shows.html`.
- A show on today's date is treated as upcoming.

## GitHub Actions
- Add `.github/workflows/build-shows.yml`:
  - Trigger on pushes to `main` when `shows.txt` changes.
  - Run `node scripts/build-shows.mjs`.
  - Commit updated `index.html` and `shows.html` back to `main`.
- GitHub Pages stays on branch deployment (`main` / root).

## Risks / Notes
- If JS is disabled, all shows will render (acceptable fallback).
- Build step should avoid mutating unrelated sections of HTML.

