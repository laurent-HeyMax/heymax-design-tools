# AGENTS.md — Conventions for working on HeyMax Design Tools

Read this file before adding a feature, refactoring, or making non-trivial changes. The patterns here are deliberate — most exist because the alternative was tried and didn't work.

If you're an agent, also see [README.md](README.md) for user-facing context.

---

## What this repo is

A Figma plugin that bundles multiple design tools behind a root home page. Today there is one tool — Image Generator — but the architecture is built for adding more (video gen, etc.) without each tool stepping on the others.

Two execution contexts that talk via `postMessage`:

| Context | File | Capabilities |
|---|---|---|
| Main thread (Figma sandbox) | `src/main/code.ts` | Read/write canvas nodes, `figma.createImage`, `figma.clientStorage`, resize iframe |
| UI thread (browser iframe) | `src/ui/**` (React + TS) | DOM, `fetch` to allow-listed domains, all visible UI |

Messages between the two are typed in `src/shared/messages.ts` (discriminated unions). **Do not use `any` postMessage payloads** — extend the union and let the compiler enforce both ends.

---

## Tech stack (don't deviate without a reason)

- **React 18** + **Vite** (two configs: UI bundles to single-file HTML via `vite-plugin-singlefile`; main bundles to IIFE for the Figma sandbox)
- **TypeScript strict** — both `tsconfig.json` (UI) and `tsconfig.main.json` (main thread, no DOM lib)
- **Tailwind CSS** — colors mapped to Figma's `--figma-color-*` CSS variables for theme switching
- **Zustand** for UI state — single `useStore` in `src/ui/state/store.ts`
- **lucide-react** for icons (consistent stroke width)
- **pnpm** as the package manager (`packageManager` field in `package.json` pins the version via Corepack)

---

## File layout

```
src/
├── main/code.ts            # Figma sandbox entry — keep small, mostly switch on UiToMain
├── shared/                 # types & static config used by both threads
│   ├── messages.ts
│   └── presets.ts          # form factors, scenes, cities, styles, default settings
└── ui/
    ├── App.tsx             # router only — view selection, init, no UI logic
    ├── views/              # one file per top-level "tool"
    ├── components/         # feature components (panels, cards, pickers)
    │   └── ui/             # primitives (Button, Input, Select, Section, Switch, Chip, ResizeHandle…)
    ├── providers/          # one file per image provider implementing ImageProvider
    ├── lib/                # tiny utilities (messaging, concurrency, colorAdjust, imageBytes, useGenerate)
    └── state/store.ts      # zustand store; one place for global UI state
```

When adding a file, place it according to its responsibility — don't put feature logic into `lib/`, don't make `components/` know about providers, etc.

---

## Coding style

- **Default to no comments.** Add a comment only when the *why* is non-obvious (a workaround for a specific quirk, a non-default tradeoff, an invariant that isn't visible from reading the code). Don't narrate what the code does.
- **No JSDoc walls of text.** A short `//` line above the surprising thing is enough.
- **Don't add error handling, fallbacks, or validation for cases that can't happen.** Trust internal callers. Validate at boundaries (provider responses, user input).
- **Don't add abstractions ahead of need.** Three similar lines are fine. Refactor when a third caller actually appears.
- **Don't introduce backwards-compatibility shims.** This is a plugin, not a public API — change the call site and move on.

---

## UI conventions (Figma-native)

The plugin must look and feel like part of Figma. Two consequences:

1. **Use Figma's CSS variables**, not hardcoded colors. Tailwind tokens are mapped to them in [`tailwind.config.js`](tailwind.config.js):
   - `bg-bg`, `bg-bg-subtle`, `bg-bg-tertiary` → backgrounds (theme-switching)
   - `text-text`, `text-text-muted`, `text-text-faint` → text colors
   - `border-border`, `border-border-strong`, `border-border-brand`
   - `bg-brand`, `bg-brand-hover`, `text-text-onbrand` → primary buttons
   - **Gotcha**: nested color groups need the full path. The white-on-brand text class is **`text-text-onbrand`**, not `text-onbrand` — Tailwind silently drops the latter.
2. **Use Figma's compact sizing scale**:
   - Inputs / selects: `h-8` (32 px), `text-xs` (11 px)
   - Primary CTAs: `h-9` (36 px), `text-sm` (12 px)
   - Chip / icon buttons: `h-6 size-6` (24 px)
   - Section header text: `text-2xs` (10 px), uppercase, `tracking-wide`, `text-text-muted`
   - Border radius: `rounded` (5 px) or `rounded-md` (5 px), `rounded-lg` for tile-like surfaces
   - Section padding: `px-3 py-2` for headers, `px-3 py-2.5` for content
3. **Sections are collapsible by default** for anything that isn't the first / primary control. Pattern:
   ```tsx
   <Section title="Reference image" defaultOpen={false} collapsible> … </Section>
   ```
4. **Light mode and dark mode are not optional.** When adding any new color, verify it reads in both. The standalone preview supports `prefers-color-scheme` so you can test without re-launching Figma.

---

## State management

- **One store** (`src/ui/state/store.ts`) for everything UI-side. No React Context, no per-feature stores.
- **Selectors are simple property reads** — `useStore(s => s.prompt)`. Don't compute in selectors unless memoised; do that in the consuming component instead.
- **Store actions update settings in-memory immediately**; persistence to `clientStorage` happens in the main thread on `save-settings` messages.
- **Tool-specific state** lives at the top level today because there's only one tool. When you add a second tool, *first* refactor settings to nest under `tools.{toolId}` in `PluginSettings` (`src/shared/messages.ts`) — keep tools' API keys, defaults, and proxies isolated.

---

## Adding a new tool

Use this checklist when introducing the next tool (e.g. Video Generator):

1. **Tool id**: extend `ToolId` union in `src/ui/state/store.ts`.
2. **View component**: create `src/ui/views/<NewTool>View.tsx`. Mirror `ImageGenView.tsx`:
   - Top header (36 px) with a back-arrow that calls `setView('home')` — **only show the back arrow when on the tool's main tab**, hide it when in the tool's settings sub-view.
   - Main content area is a vertical stack of `Section`s.
   - Footer with a primary CTA + small `⚙ Settings` icon button.
3. **Tile**: append a `{ id, name, description, icon, available: true }` entry to `TOOLS` in `src/ui/views/HomeView.tsx`.
4. **Route**: add `if (view === '<new-tool>') return <NewToolView />;` to `App.tsx`.
5. **Settings refactor** (do this *before* the tool's PR lands if it has its own keys/defaults):
   - In `src/shared/messages.ts`, change `PluginSettings.defaults` shape from flat to `tools: { imageGen: ImageGenSettings; videoGen?: VideoGenSettings }`.
   - Migrate the `loadSettings` merge in `src/main/code.ts` so existing user data isn't lost (read the old shape, copy into `tools.imageGen`).
6. **README**: add the new tool to the **Tools** section.

---

## Adding a new image provider

For Image Generator, providers live in `src/ui/providers/`. To add one:

1. Implement the `ImageProvider` interface in `src/ui/providers/<id>.ts`. Keep the file flat — submit, poll if needed, decode bytes, return.
2. Map provider quirks **inside the provider**, not in `useGenerate.ts`:
   - If the provider doesn't accept `negative_prompt` natively, append `Avoid: …` to the prompt text inside the provider.
   - If aspect ratio uses a different scheme (`"16:9"` vs `{width, height}`), translate inside the provider.
3. Add the new provider to `PROVIDERS` and `PROVIDER_LIST` in `src/ui/providers/registry.ts`.
4. Add the provider's id to the `ProviderId` union in `src/shared/messages.ts`.
5. Add `apiKeys.<id>` reveal-state to `SettingsPanel.tsx`.
6. **CORS**: if the provider doesn't return CORS headers, do **not** ship a half-broken integration. Either:
   - Document a worker proxy in `scripts/<provider>-proxy.js`, plumb a `<provider>ProxyUrl` setting through, and add the worker domain to `manifest.json`'s `allowedDomains`, or
   - Drop the provider with a clear note explaining why.
7. Add the provider's API host(s) and CDN host(s) to `manifest.json`'s `allowedDomains`. Image-output URLs are subject to CORS too — if the provider's CDN doesn't return `Access-Control-Allow-Origin`, route the download through your proxy as well.

---

## Settings & persistence

- Storage key: `heymax-design-tools:v1`. **Do not change this** without a migration — it'll wipe everyone's saved API keys.
- The window size is persisted (debounced) and restored before `figma.showUI()` so the plugin opens at whatever size the user left it.
- The `inFigma: boolean` flag is set when the main thread responds with `init`. Use it to gate Figma-only features (e.g. the "Open in new tab" button is hidden inside Figma because the iframe sandbox blocks `window.open`).

---

## Distribution model (hybrid CDN auto-updates)

Figma Professional plan can't publish private plugins, so the repo runs a hybrid:

- `dist/code.js` (Figma sandbox code) is imported once via `manifest.json` and only re-imported when main-thread code or the manifest itself changes.
- `dist/ui.html` is fetched from `UI_CDN_URL` (in `.env.production`) at every plugin launch with a 3 s timeout, falling back to the baked-in `__html__` if the CDN is unreachable.
- A GitHub Action (`.github/workflows/deploy-ui.yml`) builds and pushes `dist/` to Cloudflare Pages on every push to `main`, propagating UI changes to all installed copies of the plugin.

**Practical implications for your work:**

- **Pushing a UI change is automatic** — merge to `main`, coworkers get it on next plugin launch.
- **Pushing a `code.ts` change** still requires coworkers to re-import the manifest. Bump `version` in `package.json` so the home view's `v…` changes and they know to re-import.
- **Adding a new fetch host** in either thread? Add the domain to `manifest.json#networkAccess.allowedDomains` AND ensure coworkers re-import (manifest changes don't auto-propagate via CDN).
- **Don't move main-thread logic into the UI thread just to get auto-updates.** Keep responsibilities correct (canvas writes, `clientStorage`, resize → main thread). The cost of an occasional re-import is small.

## Build, network, and the manifest

- `manifest.json` `networkAccess.allowedDomains` is a **strict allowlist**. Any new HTTP host you `fetch` from must be added here, or Figma's iframe will block the request.
- The Cloudflare Worker proxy uses `https://*.workers.dev` — if you switch to a custom domain, add it.
- Build-time secrets / defaults live in `.env.production`. To expose a new var to the UI bundle, prefix it with `VITE_` or `REPLICATE_` (see `vite.config.ts` `envPrefix`). Add a TypeScript declaration in `src/ui/vite-env.d.ts`.
- The plugin version shown on the home view comes from `package.json#version`, injected via `__APP_VERSION__` defined in `vite.config.ts`. Bump `version` when shipping a meaningful change.

---

## Verifying changes

Always do these before considering a change done:

```bash
pnpm typecheck   # both UI and main configs
pnpm build       # produces dist/code.js + dist/ui.html
```

For UI changes, also visually verify in **both light and dark mode** in the standalone preview (`.claude/launch.json` configures `python3 -m http.server 5180 --directory dist`). The preview server is wired into Claude Code's preview tooling — when working with an agent, ask it to take screenshots in both schemes.

For changes that need to run in Figma (anything touching `figma.*` API or canvas), close & re-launch the plugin in Figma after `pnpm build`.

---

## Common pitfalls (don't repeat history)

- **Don't trust providers' marketing for free tiers.** Verify by attempting a real call. Gemini image gen is paid only despite the generous text tier.
- **Don't try Pollinations as a "no-key" provider.** Their Cloudflare Turnstile blocks browser requests regardless of token; only server-to-server works.
- **`text-onbrand` is not a class.** Use `text-text-onbrand`. Same pattern for any nested color: `<utility>-<topLevelGroup>-<key>`.
- **CSS Grid stretches by default.** Use `items-start` on the result grid so cards keep their own height instead of inheriting the tallest row.
- **Browser CORS applies inside Figma plugin iframes.** `networkAccess.allowedDomains` only controls *which* hosts you may attempt — the response still needs `Access-Control-Allow-Origin` headers from the host. Replicate's API and CDN don't have them, hence the proxy.
- **Don't put bearer tokens in the manifest or in committed files.** Build-time defaults (like the Replicate worker URL in `.env.production`) are fine — those aren't secrets.

---

## When in doubt

Match the existing patterns in the codebase. If a pattern feels wrong, propose a change in a small PR rather than introducing a parallel pattern alongside it.
