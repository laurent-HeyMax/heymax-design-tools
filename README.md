# HeyMax Design Tools

A unified Figma plugin for design utilities. Each tool is independently navigable from a root home view; today it ships **Image Generator**, with more tools planned.

## Tools

### 🖼 Image Generator
Generate images from prompts using **fal.ai**, **Replicate** (via a CORS proxy), **OpenAI**, or **Google Gemini** (Imagen / nano-banana / Gemini 3.x Image).

- HD by default; Desktop / Phone / Tablet / Square form factors or custom W×H
- **Presets** — pick a city composition (Tokyo, Paris, Helsinki, Singapore, London) and a single editorial style (Documentary Flash, City Architecture, Business Class, Night City)
- **Scene variants** — None, Sunrise, Afternoon, Sunset, Night — generated as a parallel batch in one click
- Drop in a reference image (file or URL) for models that support it
- Local color adjustments — saturation, contrast, brightness, hue, tinted overlay with blend modes — applied to the displayed bytes before the image goes onto the canvas
- Per-result actions: add to canvas, download (full-resolution PNG with adjustments baked in), open in new tab (browser preview only)
- "Add all" tiles every result around the viewport center with descriptive node names
- Customisable default prompt template and default negative prompt — sent natively to fal.ai/Replicate/Imagen as `negative_prompt`, appended as `Avoid: …` for nano-banana and OpenAI

## Requirements

- Node 18+
- [pnpm](https://pnpm.io) — `corepack enable && corepack prepare pnpm@latest --activate`, or `npm i -g pnpm`

## Install & build

```bash
pnpm install
pnpm build
```

Then in **Figma desktop**: **Plugins → Development → Import plugin from manifest…** and pick this repo's [`manifest.json`](manifest.json).

## Develop

```bash
pnpm dev   # rebuilds dist/code.js and dist/ui.html on every change
```

After a change, close & re-launch the plugin in Figma (`Cmd+Option+P` re-runs the last plugin). Plugin console: right-click in a Figma file → **Plugins → Development → Open Console**.

A standalone browser preview is configured in `.claude/launch.json` for working on UI without re-launching Figma each time. The plugin auto-initialises with default settings after ~400ms when it detects no Figma main thread (`inFigma: false`), so layout work is instant.

## Configuration

Open the plugin → click the small **⚙** button in the footer.

### API keys

| Provider | Where to get a key | Notes |
|---|---|---|
| fal.ai | <https://fal.ai/dashboard/keys> | Browser-friendly; fal.ai supports CORS |
| Replicate | <https://replicate.com/account/api-tokens> | **Requires a CORS proxy** — see below |
| OpenAI | <https://platform.openai.com/api-keys> | Browser-friendly |
| Google AI (Gemini / Imagen) | <https://aistudio.google.com/apikey> | Image models are **paid only**, not on the free tier |

Keys are stored locally via `figma.clientStorage` and only ever sent to the matching provider's API. Settings auto-save when you click **Back to Generate**.

### Default prompt template & negative prompt

- **Default prompt template** wraps every generation. Use `{prompt}` as the placeholder. Default: `{prompt}, professional photography, sharp focus, high detail, 4k`.
- **Default negative prompt** describes what to *avoid*. Default: `blurry, distorted, low quality, watermark, text, signature, deformed, bad anatomy, cropped, low resolution, jpeg artifacts, CGI, illustration, render, dark, underexposed`.

### Replicate CORS proxy

`api.replicate.com` and `replicate.delivery` don't return CORS headers, so a Figma plugin (browser iframe) cannot call them directly. Two options:

**A. Use the build-time default.** Add a `.env.production` file at the repo root with:

```sh
REPLICATE_PROXY=https://your-worker.YOUR-USERNAME.workers.dev
```

Anyone running `pnpm build` against this repo will ship a bundle pre-wired to that worker. The settings field can stay empty and the build-time value applies automatically.

**B. Override per-user.** Paste a different worker URL in **Settings → Replicate CORS proxy → Worker URL**. The user override always wins over the build-time default.

**Deploying the worker** (free, ~3 minutes):
1. <https://dash.cloudflare.com> → Workers & Pages → Create → Hello World template
2. Replace the default code with [`scripts/replicate-proxy.js`](scripts/replicate-proxy.js)
3. Click Deploy and copy the public URL (`https://<name>.<your-account>.workers.dev`)
4. Either save it to `.env.production` (option A) or paste it into the plugin's Settings (option B)

The worker proxies two hosts:
- `/v1/…` → `https://api.replicate.com/v1/…` (predictions, polling)
- `/delivery/…` → `https://replicate.delivery/…` (output image bytes)

## Architecture (high level)

A Figma plugin has two execution contexts that talk via `postMessage`:

| Context | Runs in | Code | Job |
|---|---|---|---|
| **Main thread** | Figma sandbox (no DOM, no `fetch` to most hosts) | [`src/main/code.ts`](src/main/code.ts) | Read/write nodes, `figma.createImage`, persist settings via `figma.clientStorage`, resize the iframe |
| **UI thread** | Iframe (full DOM, can `fetch` allowlisted domains) | [`src/ui/`](src/ui/) (React) | All UI, all provider HTTP calls, color post-processing, navigation |

Settings (and the chosen window size) are persisted in `figma.clientStorage` under `heymax-design-tools:v1`. Re-opening the plugin restores both.

## Repo layout

```
heymax-image-gen/
├── manifest.json
├── package.json, pnpm-lock.yaml
├── .env.production               # optional; REPLICATE_PROXY default
├── tsconfig.json, tsconfig.main.json
├── vite.config.ts                # UI build (React + tailwind, single-file)
├── vite.config.main.ts           # main-thread build (IIFE, no DOM)
├── tailwind.config.js
├── scripts/
│   └── replicate-proxy.js        # Cloudflare Worker for Replicate CORS
├── src/
│   ├── main/code.ts              # Figma sandbox entry
│   ├── shared/                   # types & presets shared across threads
│   │   ├── messages.ts           # discriminated unions (UI ↔ main)
│   │   └── presets.ts            # form factors, scenes, cities, styles, defaults
│   └── ui/
│       ├── App.tsx               # router (home view ↔ tool views)
│       ├── main.tsx, ui.html, styles.css
│       ├── vite-env.d.ts
│       ├── views/
│       │   ├── HomeView.tsx      # tool tile grid
│       │   └── ImageGenView.tsx  # image generator tool
│       ├── state/store.ts        # zustand store
│       ├── lib/
│       │   ├── messaging.ts, useGenerate.ts
│       │   ├── concurrency.ts, colorAdjust.ts, imageBytes.ts
│       ├── providers/            # one file per provider, common interface
│       │   └── types.ts, registry.ts, fal.ts, replicate.ts, openai.ts, gemini.ts
│       └── components/
│           ├── ui/               # primitives (Button, Input, Select, Section, …)
│           └── *.tsx             # feature components (PromptPanel, ResultCard, …)
└── dist/                         # build output: code.js, ui.html
```

## Scripts

- `pnpm dev` — watch-rebuild both bundles
- `pnpm build` — one-shot production build → `dist/code.js`, `dist/ui.html`
- `pnpm typecheck` — TypeScript check for both UI and main entry points

## Auto-updating UI (Cloudflare Pages + GitHub Actions)

Because Figma Professional plan can't publish private plugins, this repo ships a hybrid CDN model so coworkers don't need to re-import the plugin every time the UI changes.

**How it works:**
- `dist/code.js` (the Figma sandbox code) is loaded once when the plugin is imported. It rarely changes.
- `dist/ui.html` (the React UI) is fetched at every plugin launch from `UI_CDN_URL` (set in `.env.production`), with a 3-second timeout and a fall-back to the baked-in build if the CDN is unreachable.
- A GitHub Action ([`.github/workflows/deploy-ui.yml`](.github/workflows/deploy-ui.yml)) builds and deploys `dist/` to Cloudflare Pages on every push to `main`.

Net effect: coworkers import the plugin **once**. Every UI change you push to `main` reaches them on their next plugin launch (no re-import). Only when `code.js` itself changes (rare — main-thread logic) do they need to re-import.

### One-time setup

**1. Create a Cloudflare Pages project** (free tier is enough):
- <https://dash.cloudflare.com> → Workers & Pages → **Create → Pages → Direct Upload**
- Project name: `heymax-design-tools` (matches `--project-name` in the workflow)
- Skip the upload step — leave the project empty; the GitHub Action will push the first build

**2. Get a Cloudflare API token**:
- <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** → "Edit Cloudflare Workers" template (or custom with `Account → Cloudflare Pages → Edit`)
- Copy the token

**3. Get your Cloudflare account ID**:
- Any page in the Cloudflare dashboard shows the account ID in the right sidebar

**4. Add GitHub repository secrets** (Repo → Settings → Secrets and variables → Actions → New repository secret):

| Secret name | Value |
|---|---|
| `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 3 |
| `REPLICATE_PROXY` | your worker URL (matches `.env.production`) |
| `UI_CDN_URL` | `https://heymax-design-tools.pages.dev/ui.html` |

**5. Push to `main`**. The workflow runs, builds, and deploys to `https://heymax-design-tools.pages.dev/ui.html`. The deploy URL is also printed in the Action's summary log.

**6. Coworkers re-import the plugin once** to pick up the new `manifest.json` (`*.pages.dev` was added to the network allowlist). Future UI updates flow automatically.

### How a typical update flow looks

1. You push a UI change to `main`.
2. Action builds & deploys (~30–60 s).
3. Coworker re-launches the plugin in Figma — main thread fetches the new UI from the CDN and shows it.
4. No re-import, no manifest change.

### What still requires a manual re-import

- Edits to `src/main/code.ts` (changes the local `dist/code.js` — Figma loads this from the imported manifest path)
- Edits to `manifest.json` (`networkAccess.allowedDomains`, `editorType`, etc.)
- The plugin's id

When you do change one of those, bump `version` in `package.json` so coworkers see `v…` change on the home view and know they need to re-import.

## Adding a new tool

The plugin is set up to grow into a small suite of design utilities. The pattern:

1. Add the new tool's id to `ToolId` in [`src/ui/state/store.ts`](src/ui/state/store.ts).
2. Create `src/ui/views/<NewTool>View.tsx` (mirror [`ImageGenView`](src/ui/views/ImageGenView.tsx) for the header/footer/back-arrow conventions).
3. Add a tile to `TOOLS` in [`src/ui/views/HomeView.tsx`](src/ui/views/HomeView.tsx) with an icon, name, and short description.
4. Route in [`App.tsx`](src/ui/App.tsx): `if (view === '<new-tool>') return <NewToolView />;`.
5. When the second tool needs its own settings, restructure `PluginSettings` in [`src/shared/messages.ts`](src/shared/messages.ts) to nest tool-specific settings under `tools.{toolId}` so they stay isolated.

See [AGENTS.md](AGENTS.md) for the full set of conventions to follow.
