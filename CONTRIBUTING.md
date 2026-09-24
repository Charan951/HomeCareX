# Contributing to HomeCareX

**Maintainer / admin:** @Charan951. Only the admin merges into `develop` and `main`. Every other member works through pull requests.

## Branches
| Branch | Purpose | Who can push |
|---|---|---|
| `main` | Production. Updated from `develop` after each Friday demo | Admin only (via PR) |
| `develop` | Integration branch; every feature PR targets it | Nobody pushes directly. Changes arrive only as PRs merged by the admin |
| `feature/<name>-<task>` | Your work, e.g. `feature/suresh-home-hero` | You |

Direct pushes and force pushes to `main` and `develop` are blocked by branch protection.

## Daily workflow
```bash
# 1. Start from the latest develop
git checkout develop
git pull origin develop

# 2. Create your branch for the issue
git checkout -b feature/<name>-<task>

# 3. Commit small, meaningful changes
git add <files>
git commit -m "feat(public): add home hero search (#12)"

# 4. Before pushing, bring in the latest develop and fix conflicts locally
git pull origin develop          # or: git rebase origin/develop

# 5. Push your branch
git push -u origin feature/<name>-<task>

# 6. Open a PR on GitHub: base = develop, compare = your branch
#    Fill in the template and link the issue with "Closes #<issue>"
```
After your PR is merged, delete the branch and start the next task from a fresh `develop` (step 1).

## Commit messages
`type(scope): summary` with type = `feat | fix | refactor | style | docs | test | chore`.
Examples: `feat(rbac): add requirePermissions middleware`, `fix(customer): booking slot timezone`.

## Pull request rules
- One issue per PR, and keep it small (ideally under 400 changed lines).
- Title in commit format. The description links the issue (`Closes #N`) and includes screenshots for UI changes.
- Frontend: `npm run build` and `npm run lint` pass. Backend: `npm run build` and `npm test` pass.
- 1 approval from the admin is required. Resolve every review comment before the merge.
- Don't commit `.env`, secrets, `node_modules`, or build output.
- The admin squash-merges. Don't merge your own PR.

## Issues & project board
- Each member has one issue per week, with a day-by-day checklist (see `docs/PROJECT_PLAN.md`).
- Tick off the days as you finish them. Move the card: **Todo → In Progress → In Review (PR open) → Done**.
- If you're blocked, comment on the issue and mention the person you depend on.

## Definition of Done
Works at 360 / 768 / 1280 px · has loading, empty and error states · typed (no `any`) · lint clean · permission-gated where needed · PR approved and merged.
