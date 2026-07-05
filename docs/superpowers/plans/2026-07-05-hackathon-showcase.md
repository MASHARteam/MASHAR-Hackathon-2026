# Hackathon Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Hebrew RTL website that showcases hackathon 2026 project outputs from the DOCX extraction and links to available deliverables.

**Architecture:** A dependency-free static site keeps the empty repository easy to run and avoids package installation. The site uses a curated content model derived from `source/docx-extraction.md`, static assets under `public/`, and a single interactive details view for richer project information.

**Tech Stack:** HTML, CSS, JavaScript, local static assets.

---

### Task 1: Source Content And Assets

**Files:**
- Preserve: `source/docx-extraction.md`
- Preserve: `source/docx-extraction.json`
- Copy: `public/assets/extracted/image1.jpeg`
- Copy: `public/projects/tal-silverwater/index.html`

- [x] Extract DOCX content into Markdown and JSON.
- [x] Copy the embedded DOCX image for website runtime use.
- [x] Copy Tal Silverwater's HTML deliverable into the public project folder.

### Task 2: Static Showcase

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `script.js`
- Create: `content.js`

- [ ] Create a Hebrew RTL shell with title, intro, and project count.
- [ ] Render cards for every DOCX-derived project.
- [ ] Show representative visuals using generated visual panels or real available assets.
- [ ] Link Tal Silverwater's card to the copied product page.
- [ ] Show details inline for projects that have source detail.

### Task 3: Verification

**Files:**
- Create: `docs/handoff-note.md`

- [ ] Verify direct file/runtime asset paths.
- [ ] Run a static local server and inspect the page.
- [ ] Confirm Hebrew RTL rendering, Tal link, image rendering, and responsive layout.
- [ ] Document the run path and known content limitations.
