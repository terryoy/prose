# Repository Guidelines

## Project Structure & Module Organization
- `src/` — Application code: `scripts/` (Backbone models, views, router), `style/` (SCSS), `img/`, `fonts/`.
- `site/` — App shell and static assets served by Parcel (`index.html`, `locale.js`, `oauth.json`).
- `test/` — Browser-based Mocha tests (`spec/`, `fixtures/`, `index.html`).
- `gulpfile.js` — Legacy tasks (build-tests, css, production). Prefer Parcel for app build.
- `deprecated/`, `_build_scripts/` — Historical or migration utilities.

## Build, Test, and Development Commands
- `yarn start` or `npm run start` — Run Parcel dev server at `http://localhost:3000`.
- `yarn build` or `npm run build` — Production build via Parcel (entry: `site/index.html`).
- `yarn lint` or `npm run lint` — Lint and auto-fix JS in `src/scripts/**`.
- Tests (legacy, browser): `npx gulp build-tests` then open `test/index.html` in a browser (or `npx serve test -p 8080`).

## Coding Style & Naming Conventions
- JavaScript: ESLint with Airbnb config; 2-space indent, single quotes, semicolons.
- Modules and files: lower-case words with dashes or underscores (e.g., `import_jquery.js`); exports in `camelCase`.
- SCSS: one component per file under `src/style/`; import from `style.scss`.
- Keep functions small and pure; prefer explicit returns and early exits.

## Testing Guidelines
- Frameworks: Mocha + Chai + Sinon executed in the browser.
- Location: place specs under `test/spec/` (name as `*.spec.js`).
- Run: `npx gulp build-tests` to bundle tests, then load `test/index.html`.
- Prefer unit tests for models, views, and utilities in `src/scripts/`.

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject (≤72 chars), include scope when helpful (e.g., `router:`), reference issues (`#123`).
- PRs: clear description of intent, linked issues, before/after screenshots for UI changes, and steps to verify.
- Keep diffs focused; update docs and tests alongside code.

## Security & Configuration Tips
- Never commit secrets. `site/oauth.json` is public; use Gatekeeper for OAuth exchanges.
- Configuration lives in `site/` (e.g., `locale.js`, `oauth.json`). Document any new flags or env usage in README.
