# Shows Ordering And Links Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sort past shows newest-first on `shows.html` and remove all links from `shows.html` output while keeping `index.html` upcoming shows ascending with links.

**Architecture:** Update the build script to render two separate show lists: one sorted ascending with optional links for `index.html`, and one sorted descending without links for `shows.html`. Re-run the build to regenerate HTML.

**Tech Stack:** Node.js script, static HTML, Git.

### Task 1: Update build script to render per-page output

**Files:**
- Modify: `scripts/build-shows.mjs`

**Step 1: Add per-page rendering helpers**
- Create a rendering function that accepts a `includeLink` flag.
- Create two sorted lists: ascending and descending by date.

**Step 2: Update injections**
- Inject ascending list into `index.html`.
- Inject descending list into `shows.html` using `includeLink: false`.

**Step 3: Run build script**
- Run: `node scripts/build-shows.mjs`
- Expected: HTML lists update without errors.

**Step 4: Commit**
- Run: `git add scripts/build-shows.mjs index.html shows.html`
- Run: `git commit -m "Sort past shows newest-first and remove links"`

### Task 2: Verify output

**Files:**
- Review: `index.html`
- Review: `shows.html`

**Step 1: Quick validation**
- Confirm `index.html` is ascending by date.
- Confirm `shows.html` has no link buttons and is descending.

**Step 2: Commit (if needed)**
- Run: `git add index.html shows.html`
- Run: `git commit -m "Verify shows ordering"`

