# OpenClaw Control UI Extra Assets Design

## Goal

Replace the previous "patch OpenClaw's shipped Control UI bundle" approach with a managed, uninstall-friendly integration that:

- keeps the FirstClaw right rail visually companion to OpenClaw Control UI
- never depends on the FirstClaw repo or worktree path at runtime
- installs entirely into the user's OpenClaw-managed directories
- supports a clean uninstall path on Windows, Linux, and macOS
- requires only a very small change to OpenClaw itself

This design intentionally does **not** introduce a general Control UI plugin system yet. It adds only the minimum capability needed for FirstClaw.

## Background

The investigation on March 30, 2026 established the current state:

- historical right-rail UI injection was done by directly modifying OpenClaw's installed `dist/control-ui/index.html`
- historical UI assets lived inside OpenClaw's installed `dist/control-ui/assets/`
- that approach is fragile across upgrades and makes uninstall difficult
- the current managed FirstClaw plugin install already proves that runtime code can live entirely under `~/.openclaw`
- the current right-rail UI code already exists; the core problem is not UI implementation but delivery and lifecycle management

Related investigation notes:

- `docs/install-investigation/2026-03-30-openclaw-clean-uninstall.md`
- `docs/install-investigation/2026-03-30-openclaw-managed-install.md`

## Non-Goals

- No general extension discovery or manifest scanning
- No new public front-end plugin API for Control UI
- No changes to OpenClaw's agent or hook systems
- No support for arbitrary user-supplied static directories
- No attempt in this phase to redesign the existing FirstClaw UI itself

## Proposed Approach

Add two optional OpenClaw configuration fields:

- `gateway.controlUi.extraCss`
- `gateway.controlUi.extraJs`

If set, OpenClaw will inject one extra stylesheet and one extra module script into the Control UI HTML response. The underlying files will be read from user-managed local paths, but they will be exposed to the browser through fixed internal read-only routes controlled by OpenClaw.

This gives FirstClaw a stable way to add its companion right rail without modifying OpenClaw's installed bundle and without needing a full extension framework.

## Why This Approach

### Option A: General extension manifest system

Pros:

- more future-proof
- reusable for multiple Control UI extensions

Cons:

- requires directory scanning, manifest parsing, and generic static asset hosting
- more invasive in OpenClaw
- broader rollback and compatibility surface

### Option B: Small extra-assets injection surface

Pros:

- smallest OpenClaw change that solves the real problem
- uninstall is easy to reason about
- no package patching
- no manifest compatibility burden

Cons:

- specialized rather than general
- still based on DOM companion UI injection rather than a formal front-end extension API

### Option C: Continue patching `dist/control-ui`

Pros:

- already proven to work

Cons:

- brittle across OpenClaw upgrades
- difficult to uninstall cleanly
- directly mutates installed application files

Recommendation: choose Option B now. If OpenClaw later needs multiple companion UI integrations, this can evolve into a manifest-based system from a clean starting point.

## OpenClaw Changes

### 1. Config Contract

Add two optional string settings under `gateway.controlUi`:

- `extraCss`
- `extraJs`

Expected semantics:

- absent or empty: no extra asset injected
- present: interpreted as a local filesystem path to a single asset file
- path must be resolved to an absolute path before use
- path must point to an existing regular file

Failure behavior:

- if the path is invalid or unreadable, OpenClaw should log a warning and skip injection
- invalid extra assets must not prevent Control UI from loading

### 2. Internal Asset Serving

Expose two fixed internal read-only routes:

- `/__control_ui_extra__/extra.css`
- `/__control_ui_extra__/extra.js`

Behavior:

- if `gateway.controlUi.extraCss` is configured and valid, `/__control_ui_extra__/extra.css` serves that file as CSS
- if `gateway.controlUi.extraJs` is configured and valid, `/__control_ui_extra__/extra.js` serves that file as JavaScript
- if unset or invalid, those routes should return `404`

Important constraints:

- do not expose arbitrary filesystem directories
- do not accept path segments from the request
- do not create a generic file server

### 3. Control UI HTML Injection

When OpenClaw serves the Control UI entry HTML:

- inject `<link rel="stylesheet" href="/__control_ui_extra__/extra.css">` if extra CSS is configured and valid
- inject `<script type="module" src="/__control_ui_extra__/extra.js"></script>` if extra JS is configured and valid

Injection requirements:

- injection must happen at response time, not by modifying the packaged `index.html` on disk
- base Control UI behavior must remain unchanged when both settings are absent
- if only one of CSS or JS is configured, inject only that one

## FirstClaw Runtime Layout

FirstClaw should install its companion runtime assets under the user's OpenClaw home.

Windows example:

- `C:\Users\99786\.openclaw\extensions\firstclaw\`
- `C:\Users\99786\.openclaw\firstclaw\control-ui\firstclaw-control-ui.css`
- `C:\Users\99786\.openclaw\firstclaw\control-ui\firstclaw-control-ui.js`
- `C:\Users\99786\.openclaw\firstclaw\control-ui\assets\current_guidance.json`
- `C:\Users\99786\.openclaw\firstclaw\bootstrap\FIRSTCLAW_MEMORY.md`

Linux/macOS equivalent:

- `~/.openclaw/extensions/firstclaw/`
- `~/.openclaw/firstclaw/control-ui/firstclaw-control-ui.css`
- `~/.openclaw/firstclaw/control-ui/firstclaw-control-ui.js`
- `~/.openclaw/firstclaw/control-ui/assets/current_guidance.json`
- `~/.openclaw/firstclaw/bootstrap/FIRSTCLAW_MEMORY.md`

Design rule: once installed, OpenClaw must reference only files under `~/.openclaw`, never files from the FirstClaw repo checkout.

## FirstClaw UI Behavior

The existing right-rail UI assets become managed runtime assets.

Responsibilities:

- `firstclaw-control-ui.js`
  - detect that it is running inside OpenClaw Control UI
  - add the companion right rail DOM
  - fetch and render `assets/current_guidance.json`
  - fail softly if the JSON is missing or malformed

- `firstclaw-control-ui.css`
  - style the companion rail
  - resize or offset the main OpenClaw UI as needed
  - remain isolated enough that removing the stylesheet restores the base layout

The JS should compute the JSON URL relative to its own served URL when possible, so the asset relationship stays stable after installation.

## FirstClaw Plugin Behavior

The existing FirstClaw plugin remains responsible for producing structured guidance data, but the target path must be made explicit and stable.

Desired output path:

- `~/.openclaw/firstclaw/control-ui/assets/current_guidance.json`

This should not rely on accidental relative-path behavior from the plugin install location. The plugin distribution and schema should be updated so that the output path is either:

- configurable through a valid plugin config schema, or
- deterministically derived from OpenClaw home in a documented and tested way

Preferred direction: support an explicit output path in plugin config and set it during install.

## Install Flow

### Managed install steps

1. Copy the FirstClaw plugin distribution into `~/.openclaw/extensions/firstclaw`
2. Copy the bootstrap payload into `~/.openclaw/firstclaw/bootstrap/`
3. Copy companion Control UI assets into `~/.openclaw/firstclaw/control-ui/`
4. Enable the FirstClaw plugin in OpenClaw config
5. Configure the plugin to write guidance JSON to the managed Control UI asset path
6. Enable bootstrap-extra-files hook pointing to the managed bootstrap file
7. Set:
   - `gateway.controlUi.extraCss`
   - `gateway.controlUi.extraJs`
8. Verify that:
   - OpenClaw config contains no repo/worktree paths
   - Control UI loads with the right rail
   - guidance JSON is written to the managed path

### Install guarantees

- no modification of OpenClaw package files
- no dependency on FirstClaw repo path after install
- install can be repeated safely
- existing non-FirstClaw OpenClaw configuration should be preserved

## Uninstall Flow

### Managed uninstall steps

1. Unset `gateway.controlUi.extraCss`
2. Unset `gateway.controlUi.extraJs`
3. Disable or uninstall the `firstclaw` plugin
4. Disable bootstrap hook entries added for FirstClaw
5. Delete `~/.openclaw/firstclaw/`
6. Delete `~/.openclaw/extensions/firstclaw/` if plugin uninstall left it behind
7. Verify that:
   - Control UI no longer injects FirstClaw assets
   - no FirstClaw paths remain in OpenClaw config
   - no repo/worktree paths were reintroduced

### Uninstall guarantees

- base OpenClaw Control UI works without FirstClaw
- uninstall does not touch unrelated OpenClaw plugins or user config
- if a CLI uninstall command is partial, manual cleanup steps are deterministic and documented

## Failure Modes and Pitfalls

### Windows-specific

- CLI commands that require interactive confirmation may hang unattended
- inline JSON for config updates is fragile in PowerShell quoting
- file deletion may fail due to policy or process locks
- immediate file existence checks can race shortly after writes

Mitigation:

- prefer field-by-field config writes over complex inline JSON
- document `cmd /c rmdir /s /q` fallback where appropriate
- add retry loops for verification reads after plugin writes

### Linux/macOS-specific

- path expansion must correctly resolve `~/.openclaw`
- permissions may differ depending on install user
- shell quoting differs from PowerShell and should not share identical inline examples

Mitigation:

- normalize to absolute paths before writing config
- provide shell-specific install snippets or make the installer do path resolution internally

### Shared risks

- if OpenClaw Control UI DOM structure changes, companion JS/CSS may require updates
- if the plugin schema remains inconsistent, install cannot configure output path reliably
- if OpenClaw injects extra assets without soft-fail behavior, a broken FirstClaw asset could degrade Control UI startup

## Testing Strategy

### OpenClaw

- config accepts and persists `gateway.controlUi.extraCss` and `extraJs`
- invalid paths do not break Control UI startup
- internal routes serve configured files and 404 otherwise
- injected HTML contains zero, one, or two extra tags according to config

### FirstClaw install/uninstall

- clean install from zero on Windows
- clean install from zero on Linux/macOS
- uninstall after successful install
- reinstall after uninstall
- verification that no repo/worktree paths remain in config after install

### Companion UI

- right rail renders when JSON exists
- right rail soft-fails when JSON is absent
- removing config removes UI injection without needing to patch package files

## Open Questions

1. Where in OpenClaw's current gateway/control-ui serving chain should the HTML response-time injection happen?
2. What is the cleanest way for the FirstClaw plugin to learn the managed JSON output path across all platforms?
3. Should OpenClaw support only absolute asset paths, or allow relative paths resolved against OpenClaw home?

Recommendation:

- inject only absolute paths in config
- have the installer resolve platform-specific OpenClaw home and write absolute paths

## Acceptance Criteria

This design is complete when all of the following are true:

- FirstClaw right rail appears in OpenClaw Control UI without patching OpenClaw package files
- all installed FirstClaw runtime assets live under `~/.openclaw`
- uninstall removes the right rail by removing config and managed files only
- Windows and Linux/macOS use the same conceptual install model with platform-specific path handling
- OpenClaw changes are limited to config acceptance, controlled asset serving, and HTML response-time injection

## Recommended Next Step

Create an implementation plan that splits work into:

1. OpenClaw minimal support for extra Control UI assets
2. FirstClaw packaging cleanup for plugin + companion UI assets
3. cross-platform install and uninstall scripts
4. verification matrix for Windows and Linux/macOS
