# CLAUDE.md — HeyMax Design Tools

This is a Figma plugin organised as a multi-tool suite. Today it ships **Image Generator**; the architecture is built to grow into more (video gen, etc.).

**Read [AGENTS.md](AGENTS.md) first.** That file is the canonical guide to the project's conventions, file layout, build pipeline, and the patterns you must follow when adding a feature, a tool, or an image provider. Everything below is Claude-Code-specific operational notes that complement (don't replace) AGENTS.md.

---

## Quick orientation

- **Two execution contexts**: main thread (`src/main/code.ts`, Figma sandbox) and UI thread (`src/ui/**`, React iframe). Communicate via typed `postMessage` (see `src/shared/messages.ts`).
- **One state store** — zustand, in `src/ui/state/store.ts`. No Context, no per-feature stores.
- **One file per provider** — image-gen providers live in `src/ui/providers/`. Each one implements the `ImageProvider` interface.
- **Tools are top-level views** — see `src/ui/views/`. Adding a new tool follows the checklist in AGENTS.md.

## Operational notes

- **Package manager: pnpm.** Don't run `npm install` or `yarn` — the lockfile is `pnpm-lock.yaml` and Corepack pins the version via `package.json#packageManager`.
- **Build commands**:
  ```bash
  pnpm install
  pnpm typecheck   # both UI + main configs
  pnpm build       # produces dist/code.js and dist/ui.html
  pnpm dev         # watch-rebuild
  ```
- **Standalone UI preview** is configured in `.claude/launch.json` (port 5180, serves `dist/`). Use it for visual checks without relaunching Figma. The UI auto-initialises with default settings after ~400 ms when no Figma main thread responds.
- **Verify in both light and dark mode** for any UI change — color tokens are mapped to Figma's `--figma-color-*` variables and the standalone preview supports `prefers-color-scheme`.
- **`pnpm build` reads `.env.production`** for build-time defaults (e.g. `REPLICATE_PROXY`). Vite's `envPrefix` is set to `['VITE_', 'REPLICATE_']` — new env vars must use one of those prefixes and have a type entry in `src/ui/vite-env.d.ts`.

## Things not to do

- Don't change the `figma.clientStorage` key (`heymax-design-tools:v1`) without a migration — it'll wipe everyone's saved API keys and window size.
- Don't swap pnpm for npm/yarn, or remove the `packageManager` field.
- Don't add hardcoded colors — go through Tailwind tokens which map to Figma CSS variables.
- Don't ship a provider whose API doesn't return CORS headers without a documented proxy. The plugin runs in a browser iframe; CORS still applies even with `networkAccess.allowedDomains` set.
- Don't add comments that explain what the code does — only what's surprising. See AGENTS.md → "Coding style".
- Don't write `text-onbrand` — the class is `text-text-onbrand` (Tailwind drops invalid nested-color shortcuts silently).

## When you make a change

1. Type-check: `pnpm typecheck`.
2. Build: `pnpm build`.
3. If the UI changed, screenshot it in the standalone preview in **both** light and dark mode.
4. If the change touches `figma.*` or canvas behavior, close & re-launch the plugin in Figma to verify (`Cmd+Option+P` re-runs the last plugin).
5. Bump `version` in `package.json` for user-facing changes — it's shown on the home view (`v…`) via `__APP_VERSION__` defined in `vite.config.ts`.

For everything else, defer to **[AGENTS.md](AGENTS.md)**.
