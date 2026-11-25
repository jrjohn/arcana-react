# AGENTS.md — arcana-react

Instructions for any AI coding agent (Claude Code, Codex, Cursor, Copilot, Gemini…) working
in this repository **or in any product created from it**. `CLAUDE.md`, `GEMINI.md` and
`.github/copilot-instructions.md` all point here; this file is the single source.

> **You MUST NOT report a task as done until `tools/arch-check.sh` exits 0 and the CI lane
> (§5) is green.** Breaking the layering costs a red build: the pre-commit hook
> (`tools/githooks/pre-commit`) rejects new files outside the layer directories, `*Impl`
> imports outside `src/app/core/di/`, and data-layer imports from presentation; Jenkins stage
> "Architecture Qube" fails the merge below score 90 or on any critical violation.

## 0. First command in a fresh clone

Run `tools/install-hooks.sh` once. Git does not install hooks on clone; until you run it the
pre-commit check does not exist and only CI catches a flat layout — after the work is
written. `tools/new-app.sh` runs it for you.

## 1. Starting something new

| Situation | Do this | Never do this |
|---|---|---|
| New React product | `tools/new-app.sh <name> <dest-dir>` — copies the whole repo, renames the npm package, `<title>`, Jenkins `APP_NAME`/image, Sonar key, CI container names, storage keys and IndexedDB name, resets the version to 0.1.0, installs the hook | `npm create vite` and copy a few `src/` folders into it |
| New business feature | `tools/new-feature.sh <Name>` (PascalCase) — one vertical slice: entity + DTOs, service interface, mapper, 4-layer-cache repository, service impl, DI token + binding + `use<Name>Service()` hook, Input/Output/Effect ViewModel, list component, `Routes.<NAME>S` + lazy route, vitest tests for each | Call `apiService`/`fetch` from a component, or add `src/foo.ts` |
| Detail / form screens for a feature | Copy `features/users/user-detail` + `viewmodels/userDetailViewModel.ts` (or `user-form`) into the generated feature folder, renamed; add the route under the same `<Route path=…>` | Put form state in the component with `useState` + service calls |

Copying parts instead of `new-app.sh` loses this file, the hook and the CI gate, so nothing
tells the next agent the rules exist.

## 2. Layers — where a file goes

All paths under `src/app/` unless noted. Aliases: `@/` = `src/`, `@core/`, `@domain/`,
`@data/`, `@presentation/`, `@shared/` (see `tsconfig.app.json`).

| Layer | Path | Contains | May depend on |
|---|---|---|---|
| Entry | `src/main.tsx`, `src/App.tsx`, `src/routes/index.tsx` | bootstrap, providers, lazy routes | core, presentation components |
| Core / DI | `core/di/` (`container.ts`, `serviceConfig.ts`, `DIProvider.tsx`), `core/providers/`, `core/navigation/navGraph.ts`, `core/constants/` | `ServiceTokens` + `ServiceMap`, the composition root, `useXService()` hooks, auth/i18n/theme providers, `Routes` constants | domain; `core/di/serviceConfig.ts` is the only file that imports `data/services/impl/` |
| Presentation | `presentation/features/<feature>/<screen>/XComponent.tsx`, `presentation/features/<feature>/viewmodels/xViewModel.ts`, `presentation/layout/`, `presentation/shared/components/` | components render `output` and call `dispatch(input)`; ViewModel hooks own state (`useReducer`) and effects | domain types, `@/app/core/di` hooks, core providers/navigation — **never** `data/` |
| Domain | `domain/entities/x.model.ts`, `domain/services/xService.ts`, `domain/validators/` | entities + DTOs, service interfaces + `ServiceResult<T>`, validators, `networkStatusService`, `sanitizationService` | nothing outside `domain/` |
| Data | `data/services/impl/xServiceImpl.ts`, `data/repositories/xRepository.ts`, `data/mappers/`, `data/storage/` (memory, LRU, IndexedDB), `data/api/` (axios + interceptors), `data/sync/` | service implementations, repositories doing memory → LRU → IndexedDB → API with offline pending ops, API DTO mappers | domain, `core/constants` |

Direction: component → ViewModel → `useXService()` (domain interface) → `data/services/impl`
→ repository → storage/api. A lower layer never imports a higher one. Repositories are
concrete singletons in `data/` (there is no repository interface layer); only service impls
use them. Tests sit next to the file as `*.test.ts(x)`; `src/test/` holds setup and
integration tests.

## 3. Rules

| # | Rule | Enforced by |
|---|---|---|
| R1 | Every service is an interface in `domain/services/` implemented by a `class XServiceImpl implements XService` in `data/services/impl/`, exported as a singleton typed as the interface. | arch-qube "Interface/Impl Colocation", "Implementation Naming Convention" |
| R2 | Only `src/app/core/di/` imports from `data/services/impl/` or names a `*Impl`. Everyone else resolves the interface via `useXService()` / `useService(ServiceTokens.X)`. Tests may mock impls. | arch-qube "Only DI Container Imports Impl"; pre-commit hook |
| R3 | Components and `src/routes/` never import `data/` (repositories, storage, `apiService`); components never call a service directly — only through their ViewModel. | arch-qube "View Cannot Call Service", "Layer Direction Enforcement"; pre-commit hook |
| R4 | A ViewModel is a `useXViewModel()` hook exporting `XInput` (discriminated union), `XOutput` (interface) and `XEffect`, a pure reducer, and returning `{ output, dispatch }`; effects (navigation, timers) run in a `useEffect` on `pendingEffect`, never inside the reducer. | arch-qube "Unidirectional Data Flow"; review (arch-qube "MVVM I/O/E Structure" is AI-only, see §4) |
| R5 | Route paths are constants in `core/navigation/navGraph.ts` `Routes`; a new screen gets a constant and a lazy route in `src/routes/index.tsx`. | arch-qube "Type-Safe NavGraph" |
| R6 | A new service gets a `ServiceTokens` entry and `ServiceMap` line in `core/di/container.ts`, a `container.register` in **both** `configureServices` and `configureTestServices`, and a `useXService()` hook exported from `core/di/index.ts`. | `tsc` (ServiceMap typing); `new-feature.sh` does it |
| R7 | Reads go memory → LRU → IndexedDB → API and back-fill each layer; writes while offline are queued with `indexedDbService.addPendingOperation`. | review (arch-qube "4-Layer Progressive Cache", "Offline-First Design" are AI-only) |
| R8 | No new file under `src/` outside the directories of §2. | pre-commit hook |
| R9 | Every new mapper, repository, service impl, ViewModel and component has a vitest test next to it that mocks the layer below (as `new-feature.sh` generates). | arch-qube "Test Coverage Threshold"; SonarQube quality gate (Jenkins "SonarQube Analysis") |

## 4. Architecture check (arch-qube)

arch-qube (https://github.com/jrjohn/arcana-arch-qube) scans the source for MVVM,
layer-direction, DI and naming violations and scores it; usage guide:
https://github.com/jrjohn/arcana-skills/tree/main/arch-qube-skill. The version is pinned in
`tools/arch-qube.version`, read by both `tools/arch-check.sh` and the Jenkinsfile.

- Run: `tools/arch-check.sh` — image `ghcr.io/jrjohn/arch-qube:<version>` (public,
  multi-arch), else `arcana.boo/arcana/arch-qube:<version>`; never `:latest`. Same
  `--framework react`, `--threshold 90` and exclusions as Jenkins stage "Architecture Qube".
  Exit 0 = pass, 1 = fail, 2 = could not run (no Docker / no image) — 2 is **not** a pass.
- Without Docker, on a tree without `node_modules/`, `dist/`, `coverage/`:
  `pipx run --spec git+https://github.com/jrjohn/arcana-arch-qube.git@v0.5.7 arch-qube scan . --framework react --no-ai --format json,markdown -o arch-qube-reports --threshold 90`.
- Report: `arch-qube-reports/arch-qube.md` (summary) and `arch-qube.json` (per rule:
  `files_checked`, violations). PASS needs score ≥ threshold **and** zero violations in
  every critical rule — a 99.4 can FAIL. A rule under "Not evaluated" (here: MVVM I/O/E,
  4-Layer Cache, Offline-First, Security — AI-only) is not a pass; R4/R7 are on you. A rule
  with `files_checked: 0` checked nothing; an unlayered project scores 0 on "Layer Direction
  Enforcement". `--ci` prints nothing on failure: rerun without `--ci` to see why.
- False positive: open an issue on arcana-arch-qube with the report attached. Never lower
  `--threshold`, add exclusions, or move code to dodge a rule.

## 5. Before you say "done"

Run these, in this order, and paste the last line of each into your summary:

```bash
tools/arch-check.sh            # must print "arch-check: PASS"
npm ci && npm run build        # tsc -b && vite build — what Dockerfile.ci runs in Jenkins "Docker Compose Build"
npx vitest run --coverage      # Jenkins "Unit Tests" (docker-compose.test.yml)
npx eslint <files you changed> # not a CI stage; add no new errors (see below)
```

`npm run lint` is not a CI stage and the template starts with 15 errors (mostly
`react-refresh/only-export-components` on the `useXService()` hooks in `DIProvider.tsx`);
`new-feature.sh` adds one more of that same kind per feature. Any other new error is yours.

Without a local Node toolchain, run the identical lanes in Docker:
`docker compose -f docker-compose.test.yml run --build --rm test` (tests; exits non-zero on
a failing test) and `VERSION=dev docker compose -f docker-compose.ci.yml build` (compile).
CI also runs SonarQube, which you cannot run locally.

## 6. Reference

- Optional detail: `arcana-react-developer-skill`
  (https://github.com/jrjohn/arcana-skills/tree/main/arcana-react-developer-skill).
  This file is the source of truth: if the skill and this file disagree, this file wins.
