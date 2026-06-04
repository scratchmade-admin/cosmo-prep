# Melissa — California Cosmetology Exam-Prep Site

Static prep site for the California cosmetology written exam. **The live deliverable is the
[`site/`](site/) folder** — it's self-contained (relative links only) and runs from anywhere:

```bash
cd site && python3 -m http.server 8000   # then open http://localhost:8000
```

`site/` contents: `index.html` (landing), `quiz.html` (rotating 20-question engine),
`study-guide.html` (8 modules), `faq.html`, `styles.css`, `quiz-data-rotation.json` (live quiz
bank, 60 questions — quiz.html fetches this).

## Docs at root

**Planning / strategy (current):**
- `site-plan.md` — the north-star strategy (positioning, audience, 5 pillars).
- `launch-plan.md` — phased roadmap (Phase 1 MVP shipped).
- `next-improvements-plan.md` — prioritized backlog; items #1–3 are highest-leverage.
- `quiz-sets-rotation-plan.md` — the daily-practice rotation rationale behind the quiz engine.

**Source content (drafts behind the live site):**
- `study-modules-draft.md` — the 8 modules; integrated into `site/study-guide.html` (keep as source).
- `study-guide-expansion-draft.md` — richer Module 3–4 teaching content.
- `quiz-bank-100-draft.md` — 100 drafted questions.

## Pending work (don't lose this)

1. ✅ **DONE — Quiz bank migrated.** All 100 drafted questions are now live: `quiz-data-rotation.json`
   holds **102 questions across 9 topics** (IDs 201–302). This added the previously-missing
   **Skin & Nails** (8) and **Anatomy & Chemistry** (10) topics; the quiz engine's `targetMix` and
   `topicLabels` in `site/quiz.html` were rebalanced to a 20-question spread across all 9 topics.
2. **Integrate `study-guide-expansion-draft.md`** into `site/study-guide.html` (deeper Module 3–4
   content not yet on the live site).
3. **Work `next-improvements-plan.md` items #1–3** (post-quiz "what to study next", anchor links
   from results → study guide, home-page funnel clarity).
4. **Deploy** — site is host-ready (Netlify/Vercel/GitHub Pages drag-and-drop) but not yet live.

Superseded drafts and old versions live in [`archive/`](archive/) — see its README.
