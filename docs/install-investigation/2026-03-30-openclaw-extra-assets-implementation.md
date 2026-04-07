# 2026-03-30 OpenClaw Extra Assets Implementation Notes

## What Changed

This round implemented the first code-backed version of the managed Control UI companion path:

- restored a formal FirstClaw plugin distribution under `plugins/firstclaw`
- restored managed right-rail assets under `openclaw/control-ui`
- added cross-platform installer and uninstaller entry points:
  - `scripts/openclaw_install.py`
  - `scripts/openclaw_uninstall.py`
- patched the locally installed OpenClaw package to accept:
  - `gateway.controlUi.extraCss`
  - `gateway.controlUi.extraJs`
- patched the locally installed OpenClaw gateway Control UI handler so it can:
  - inject extra CSS/JS into Control UI HTML at response time
  - serve `extra.css`
  - serve `extra.js`
  - serve sibling `assets/*` relative to `extra.js`

## Verified Successes

### Repo-level

- Python packaging and asset tests passed:
  - `tests/openclaw/test_setup_assets.py`
  - `tests/openclaw/test_control_ui_release_contract.py`
  - `tests/openclaw/test_openclaw_install_scripts.py`
- Node plugin tests passed:
  - `plugins/firstclaw/src/write_guidance_state_tool.test.js`

### Local machine state

- `scripts/openclaw_install.py` completed successfully on Windows
- `C:\Users\99786\.openclaw\openclaw.json` now contains:
  - `gateway.controlUi.extraCss`
  - `gateway.controlUi.extraJs`
  - `plugins.entries.firstclaw.config.firstclaw.outputPath`
- managed runtime assets now exist under:
  - `C:\Users\99786\.openclaw\firstclaw\control-ui`
  - `C:\Users\99786\.openclaw\extensions\firstclaw`

## Important Failure Modes Discovered

### 1. `openclaw config set` hangs when invoked directly under PowerShell in this environment

Observed behavior:

- running `openclaw config set ...` through the PowerShell command wrapper timed out instead of returning

Workable path:

- wrapping the command as `cmd /c openclaw config set ...` returned normally

Installer impact:

- Windows installer should invoke OpenClaw CLI through `cmd /c`

### 2. Parallel config writes can overwrite each other

Observed behavior:

- writing `gateway.controlUi.extraCss` and `extraJs` in parallel caused only one key to survive in `openclaw.json`

Conclusion:

- OpenClaw config writes must be serialized
- installer should never issue parallel `config set` operations against the same config file

### 3. `openclaw config get gateway.controlUi` behaved inconsistently

Observed behavior:

- `config set` for `gateway.controlUi.extraCss` and `extraJs` succeeded
- direct inspection of `openclaw.json` confirmed the fields were written
- but `openclaw config get gateway.controlUi` still reported path not found in one run

Conclusion:

- for verification, reading `openclaw.json` directly is more reliable than trusting only `config get` output

### 4. Gateway management on this Windows machine is still unstable

Observed behavior:

- `openclaw gateway status` reported:
  - Scheduled Task registered
  - dashboard URL `http://127.0.0.1:18789/`
  - runtime unknown
  - RPC probe failed with websocket close `1006`
- direct HTTP requests to `127.0.0.1:18789` failed with connection refused
- `openclaw gateway restart` timed out

Current interpretation:

- this appears to be a local gateway/service-management issue on top of the new extra-assets work
- no startup syntax error from the new extra-assets patch was found in the log inspected during this round

Impact:

- the HTML injection route is implemented, but full browser-level verification is still blocked by the local gateway runtime state

## Local OpenClaw Files Backed Up Before Patch

- `docs/install-investigation/backups/20260330-openclaw-extra-assets/daemon-cli.js.bak`
- `docs/install-investigation/backups/20260330-openclaw-extra-assets/gateway-cli-vk3t7zJU.js.bak`
- `docs/install-investigation/backups/20260330-openclaw-extra-assets/gateway-cli-CuFEx2ht.js.bak`

## Follow-up Work

1. Verify whether the gateway Windows Scheduled Task is launching the same patched OpenClaw build that the CLI is modifying
2. Manually launch a foreground gateway process with the patched package and confirm:
   - Control UI root loads
   - injected tags appear in HTML
   - `/__control_ui_extra__/extra.js`
   - `/__control_ui_extra__/extra.css`
   - `/__control_ui_extra__/assets/current_guidance.json`
3. After the local gateway is reachable, verify that the right rail renders in the browser
