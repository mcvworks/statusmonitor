# 027 — Git Cleanup & Final Push

## Status: queued

## Objective
Review all commits, ensure clean git history, and push the complete project to the remote repository.

## Requirements
- Review git log for the full project:
  - Ensure commit messages are clear and follow conventional format
  - Verify no sensitive data in any commit (API keys, secrets, .env files)
  - Check `.gitignore` covers: node_modules, .env, .next, data/, *.db, *.db-journal
- Verify build passes:
  - `npm run lint` — no errors
  - `npm run build` — successful production build
  - `docker compose up --build` — container starts and serves
  - Hit `/api/health` — returns 200 OK
- Clean up:
  - Remove any debug routes (`/api/debug/*`) or test code
  - Remove `.gitkeep` files from directories that now have content
  - Ensure all TODO comments are resolved
- Final commit with any cleanup changes
- Push to remote:
  - Ensure remote is set up (`git remote -v`)
  - Push main branch: `git push -u origin main`
  - Verify push succeeded

## Acceptance Criteria
- [ ] No sensitive data in git history
- [ ] `.gitignore` comprehensive
- [ ] Lint passes
- [ ] Build passes
- [ ] Docker build passes
- [ ] Health endpoint returns 200
- [ ] Debug/test code removed
- [ ] All code pushed to remote
- [ ] Commit: "chore: cleanup and prepare for production"

## Completion Notes
_(to be filled after task completion)_
