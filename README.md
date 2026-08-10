# Campero Promo Brief Builder

A clean, modern web app for building **Pollo Campero Marketing Promo Checklist Briefs** — multi-section form, live web preview, PDF download, and Markdown export.

## Features

- **9-step form** with sticky progress navigation  
  Overview → Messaging → Digital → IT/OLO → Paid Media → PR → In-Store → Legal → Review
- **Conditional logic** — loyalty-only promos surface loyalty legal + badge notes
- **Live character counters** on constrained paid/SMS fields
- **Legal templates** — Standard, BOGO/Loyalty, In-Store Only, EWS, Menu Item Limit
- **Fixed brand guidelines** panel (product naming, never-include list, drinks, logo, etc.)
- **Auto-save** working draft to browser `localStorage`
- **Named brief library** — save, reopen, rename, duplicate, delete for later edits
- **Export / import JSON** to back up or move briefs between browsers
- **Sample data** pre-loaded: National Fried Chicken Day (July 6)
- **Generate Brief** → web preview + PDF download + copy as Markdown

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4
- Zustand (persist)
- jsPDF for professional multi-page PDF export

## Getting started

```bash
cd campero-brief-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command       | Description        |
| ------------- | ------------------ |
| `npm run dev` | Local development  |
| `npm run build` | Production build |
| `npm run start` | Serve production |

## Deploy on Netlify

This app builds as a **static site** (`output: "export"`). No API keys or backend required.

### Option A — Drag and drop (no GitHub)

1. On your Mac, in Terminal:

```bash
cd "/Users/admin/Desktop/Client Brief/campero-brief-builder"
npm run build
```

2. In Finder, open:
   `Desktop → Client Brief → campero-brief-builder → out`
3. In Netlify: **Add new site** → **Deploy manually** → **Drag and drop**
4. Drop the entire **`out`** folder (not the parent project folder)
5. Wait until the deploy finishes and open the `*.netlify.app` URL

To update the site later: run `npm run build` again, then drag the new `out` folder onto the same site (Deploys → Deploy manually).

### Option B — Git continuous deploy

1. Push this project to GitHub/GitLab/Bitbucket.
2. Netlify → **Import an existing project**.
3. If the repo root is the parent `Client Brief` folder, set **Base directory** to `campero-brief-builder`.
4. Settings (also in `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
   - **Node:** `20`
5. Deploy.

### Config files

| File | Purpose |
| ---- | ------- |
| `next.config.ts` | `output: "export"` → builds `out/` |
| `netlify.toml` | Build command + publish `out` |
| `.nvmrc` | Node 20 |

### After deploy

- Briefs save in each user’s browser (`localStorage`).
- PDF download and form features work on the live URL.
- For team-shared drafts across devices, a backend would be needed later.

## Usage tips

1. Explore the pre-filled **National Fried Chicken Day** sample.
2. Use **Clear form** to start a blank brief (draft auto-saves).
3. Open **Brand Guidelines** (bottom-right) while filling creative notes.
4. On **Review & Generate**, create the preview, download PDF, or copy Markdown for agency handoff.
