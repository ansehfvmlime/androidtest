# AGENTS.md

## Project workflow

- Always read these files before editing code:
  - ai/CONTEXT.md
  - ai/RULES.md
  - docs/tasks/\*.md
- Create a short implementation plan before making changes.
- Prefer minimal diffs.
- Implement one step at a time.
- Keep data parsing logic in services.
- Keep rendering logic in views.
- Avoid changing unrelated files.

## Review rules

- Check null-safe handling.
- Check compatibility with existing templates.
- Avoid unnecessary refactors.
- Suggest manual test cases after each step.

## Output style

- First show the plan.
- Then implement only the requested step.
- After changes, summarize:
  1. modified files
  2. what changed
  3. risks
  4. manual test checklist
