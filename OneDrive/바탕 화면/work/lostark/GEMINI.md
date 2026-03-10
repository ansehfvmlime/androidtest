# GEMINI.md

## Purpose

This project is a LOSTARK web service built on Node.js, Express, and EJS.
It fetches character data from the LOSTARK OPEN API and renders dashboards and calculators.

## First Read

When Gemini CLI starts in this repository, read files in this order before making changes:

1. `ai/AGENTS.md`
2. `ai/CONTEXT.md`
3. `ai/RULES.md`
4. `package.json`
5. `app.js`

After that, only open files directly related to the current task.
Do not scan the entire repository by default.

## Project Structure

- `app.js`: Express app entry point
- `routes/`: HTTP route definitions
- `controllers/`: request handlers
- `services/`: API integration, cache, and data-processing logic
- `views/`: EJS templates
- `public/`: static assets
- `docs/spec-*.md`: feature and implementation specs
- `docs/tasks/*.md`: ordered task documents
- `ai/`: agent workflow and project rules

## Working Rules

- Keep the existing file structure unless there is a clear reason to change it.
- Prefer minimal diffs and avoid unrelated edits.
- Keep data parsing and API logic in `services/`.
- Keep rendering logic in `views/`.
- Add null-safe handling and explicit error handling for API failures.
- Do not hardcode secrets or personal data.
- Do not read or modify `.env` unless the task explicitly requires it.

## Task Flow

1. Read the startup files listed above.
2. Summarize the relevant context briefly.
3. Make a short implementation plan.
4. Inspect only the files needed for the requested task.
5. Implement one logical step at a time.
6. After changes, summarize:
   - modified files
   - what changed
   - risks
   - manual test checklist

## Task Documents

If the request maps to an existing task or spec, read only the relevant file:

- `docs/tasks/*.md` for staged work items
- `docs/spec-character-api.md`
- `docs/spec-character-dashboard.md`
- `docs/spec-character-data-processing.md`
- `docs/spec-cache.md`
- `docs/spec-crit-calculator.md`
- `docs/spec-lostark-api-integration.md`
- `docs/spec-tabs-ajax-viewer.md`

## Run Commands

- Install dependencies: `npm install`
- Start server: `npm start`
- Dev server: `npm run dev`

## Notes For Gemini CLI

- Ask for clarification only if the requirement is genuinely ambiguous.
- If a task touches routes, controllers, services, and views, inspect those layers in that order.
- If a new route or behavior is added, suggest a manual verification flow even if automated tests are missing.
- There is currently no real test suite configured in `package.json`; do not claim tests were run unless you actually add and run them.
