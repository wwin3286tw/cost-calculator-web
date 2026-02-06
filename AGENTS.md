# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the single-page app entry; it wires the calculator UI and loads assets.
- `assets/app.js` contains all calculator logic, presets, URL param handling, and DOM rendering (vanilla JS, no build step).
- `assets/style.css` holds layout and theme styles; keep selectors semantic to match the markup in `index.html`.
- `docker/` supplies server images: `nginx/` (with `default.conf`), `apache/`, and `httpd/` (Alpine). Use these for packaging the static site.
- `docker-compose.yml` provides ready-made services: `web-nginx` (default), plus `web-apache` and `web-httpd` behind profiles. Ports map to 8080/8081/8082.

## Build, Test, and Development Commands
- Quick preview (no dependencies): `python3 -m http.server 8000` from the repo root, then open `http://localhost:8000/index.html`.
- Docker build/run examples:
  - Nginx: `docker build -f docker/nginx/Dockerfile -t cost-calculator-web:nginx .` then `docker run --rm -p 8080:80 cost-calculator-web:nginx`.
  - Apache: `docker build -f docker/apache/Dockerfile -t cost-calculator-web:apache .` then `docker run --rm -p 8081:80 cost-calculator-web:apache`.
- Compose (preferred for local parity): `docker compose up web-nginx`; enable other servers with `--profile apache` or `--profile httpd`.

## Coding Style & Naming Conventions
- JavaScript: ES2020+, prefer `const`/`let`, arrow functions, template literals, and semicolons. Use 2-space indentation and keep functions small and pure where practical.
- CSS: 2-space indentation; group related blocks; favor utility-like class names matching the existing semantic labels (e.g., `.results`, `.result-actions`).
- HTML: keep markup in `index.html` declarative; avoid inline scripts/styles. Use lowercase attributes and double quotes.
- File naming: keep new assets in `assets/` with lowercase-kebab names (e.g., `print-preview.js`).

## Testing Guidelines
- No automated test suite today; verify changes by loading `index.html` (or the Docker/Compose service) and exercising common flows: selecting printer/material, toggling custom material price, copying/share actions, and resetting.
- When adding logic, prefer small pure helpers in `app.js` that can be manually invoked in the browser console for spot checks.

## Commit & Pull Request Guidelines
- Commit messages: use short, imperative subjects (e.g., "Add docker-compose.yml"), ≤72 characters.
- Pull requests should include: brief summary of behavior change, manual test notes (browser/command used), screenshots or GIFs for UI tweaks, and references to issues or tasks when applicable.
- Keep diffs minimal and focused; note any config or default value changes in the description so reviewers can validate assumptions.

## Security & Configuration Tips
- No secrets are stored or required; images are static. If adding analytics or external calls, gate them behind clear opt-in flags and document defaults in `README.md`.
- Container builds assume internet access for base images only; avoid adding runtime package installs unless necessary for serving static files.
