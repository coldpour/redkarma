# Shows Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate `index.html` and `shows.html` from `shows.txt` and hide past/future shows per page with JS + CSS.

**Architecture:** A Node script parses `shows.txt`, sorts shows by date, renders `.show-item` HTML, and injects it into both pages. A shared client-side script compares `data-date` to today and marks past/future shows for CSS to hide.

**Tech Stack:** Node.js (script), plain HTML/CSS/JS, GitHub Actions.

### Task 1: Add build script and parsing logic

**Files:**
- Create: `scripts/build-shows.mjs`
- Read: `shows.txt`

**Step 1: Write a small parsing harness (manual check)**
- Create a stub `scripts/build-shows.mjs` that reads `shows.txt` and logs parsed show counts.

**Step 2: Run the script to verify it reads data**
- Run: `node scripts/build-shows.mjs`
- Expected: prints a non-zero show count without errors.

**Step 3: Implement full parse + sort logic**
- Parse paragraphs separated by blank lines.
- Map lines to `{ date, venue, location, link? }`.
- Sort ascending by date.

**Step 4: Commit**
- Run: `git add scripts/build-shows.mjs`
- Run: `git commit -m "Add shows build script"`

### Task 2: Update HTML templates with injection markers

**Files:**
- Modify: `index.html`
- Modify: `shows.html`

**Step 1: Add build markers**
- Add HTML comments around the shows list container content to mark insertion boundaries.

**Step 2: Run build script to inject generated HTML**
- Run: `node scripts/build-shows.mjs`
- Expected: `index.html` and `shows.html` show lists replaced by generated items.

**Step 3: Commit**
- Run: `git add index.html shows.html`
- Run: `git commit -m "Generate show lists from shows.txt"`

### Task 3: Add runtime filtering JS and CSS

**Files:**
- Modify: `index.html`
- Modify: `shows.html`
- Modify: `styles.css`

**Step 1: Add a small script**
- Add or include a JS snippet that labels `.show-item` as past/future based on `data-date` vs today.

**Step 2: Add CSS rules**
- Hide `.is-past` on `index.html` and `.is-future` on `shows.html`.

**Step 3: Manual verification**
- Open `index.html` and `shows.html` and confirm the correct items are hidden for today.

**Step 4: Commit**
- Run: `git add index.html shows.html styles.css`
- Run: `git commit -m "Hide past and future shows per page"`

### Task 4: Add GitHub Actions workflow

**Files:**
- Create: `.github/workflows/build-shows.yml`

**Step 1: Write workflow**
- Trigger on pushes to `main` when `shows.txt` changes.
- Checkout, run `node scripts/build-shows.mjs`, commit updated HTML back to `main`.

**Step 2: Manual verification**
- Run: `rg "build-shows" .github/workflows/build-shows.yml`
- Expected: workflow references the script.

**Step 3: Commit**
- Run: `git add .github/workflows/build-shows.yml`
- Run: `git commit -m "Add GitHub Actions build for shows"`

