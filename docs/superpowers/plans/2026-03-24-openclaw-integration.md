# FirstClaw x OpenClaw Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cross-platform FirstClaw integration for OpenClaw that delivers in-session lightweight prompts plus a deep-view web panel, without depending on macOS-only Canvas.

**Architecture:** Keep the existing Python JSON-backed dashboard as the deep-view surface, and add a thin OpenClaw integration layer responsible for bootstrap injection, trigger timing, and `chat.inject` notifications. Treat Windows and macOS as equal first-class targets by making the core experience work through hooks, plugin/runtime integration, and browser UI before adding any Canvas-specific enhancement.

**Tech Stack:** Python 3 standard library, static HTML/CSS/JS, OpenClaw hooks/plugin integration layer, JSON state files, WebSocket/Gateway APIs exposed by OpenClaw for `chat.inject`.

---

## File Structure

### Existing files to keep and extend

- `agent/MEMORY.md`
  Current first-principles guardrail content. Will be split into a reusable OpenClaw bootstrap payload.
- `scripts/update_analysis.py`
  Source of truth for writing current analysis and history. Will be extended to write prompt metadata and panel URLs.
- `server/server.py`
  Existing dashboard API server. Will add lightweight endpoints for status, current prompt payload, and action callbacks.
- `ui/index.html`
  Deep-view UI shell. Will be updated to support action buttons and clearer status states.
- `ui/app.js`
  Existing client renderer. Will add status handling, action flows, and direct linking from prompt notifications.
- `install.sh`
  Existing setup entry point. Will be updated to generate OpenClaw integration templates and explain platform-specific setup.

### New files to create

- `openclaw/README.md`
  Operator-facing explanation of how the OpenClaw side is wired.
- `openclaw/bootstrap/FIRSTCLAW_MEMORY.md`
  Bootstrap payload specifically shaped for OpenClaw injection.
- `openclaw/config/hooks.example.json`
  Example OpenClaw hook/bootstrap configuration for local install.
- `openclaw/integration/firstclaw_integration.js`
  OpenClaw-facing runtime entry point for trigger handling and `chat.inject`.
- `openclaw/integration/analysis_payload.js`
  Shared serializer for mapping analysis JSON into lightweight prompt text and deep-view links.
- `openclaw/integration/gateway_client.js`
  Minimal wrapper for sending `chat.inject` payloads to OpenClaw Gateway.
- `docs/OPENCLAW_SETUP.md`
  Setup and troubleshooting instructions for the integration layer.
- `docs/OPENCLAW_MESSAGE_FLOW.md`
  Short operational doc showing bootstrap -> analysis -> inject -> deep-view flow.

### Optional later files

- `openclaw/integration/canvas_bridge.js`
  macOS-only enhancement, explicitly deferred until cross-platform MVP is stable.

---

### Task 1: Freeze the Integration Contract

**Files:**
- Create: `openclaw/README.md`
- Create: `docs/OPENCLAW_MESSAGE_FLOW.md`
- Modify: `docs/OPENCLAW_INTEGRATION_DECISIONS.md`

- [x] **Step 1: Document the system boundary**

Write down the contract between FirstClaw and OpenClaw:

- OpenClaw decides when to trigger
- FirstClaw decides what the analysis result is
- OpenClaw transcript shows only the short prompt
- FirstClaw panel shows full analysis and action buttons

- [x] **Step 2: Define the lightweight prompt payload**

Document a single JSON shape that every layer uses:

```json
{
  "session_id": "oc_session_123",
  "task": "Implement login flow",
  "complexity": 78,
  "delta": 12,
  "top_reasons": ["Added OAuth", "Assumed multi-tenant support"],
  "can_remove": ["OAuth", "multi-tenant"],
  "deep_view_url": "http://127.0.0.1:5000/?session=oc_session_123",
  "status": "updated"
}
```

- [x] **Step 3: Define notification rules**

Document exactly when `chat.inject` is allowed:

- first successful analysis in a session
- complexity increase above threshold
- major change in removable scope
- explicit user request for simplification

Document exactly when **not** to inject:

- no meaningful change
- repeated identical analysis
- stale or failed analysis

- [x] **Step 4: Commit**

```bash
git add docs/OPENCLAW_INTEGRATION_DECISIONS.md docs/OPENCLAW_MESSAGE_FLOW.md openclaw/README.md
git commit -m "docs: define openclaw integration contract"
```

---

### Task 2: Extend the Analysis Writer for Prompt Delivery

**Files:**
- Modify: `scripts/update_analysis.py`
- Test: `tests/scripts/test_update_analysis.py`

- [x] **Step 1: Write the failing test**

Add a test proving `update_analysis.py` writes prompt-ready metadata:

```python
def test_update_analysis_writes_prompt_metadata(tmp_path):
    result = write_analysis(
        task="Implement login",
        complexity=78,
        compression=40,
        can_remove="OAuth,multi-tenant",
        intent="Ship a simple login flow",
        solution="username/password + JWT",
        session_id="oc_session_123",
        status="updated",
        top_reasons="Added OAuth|Assumed multi-tenant"
    )
    assert result["prompt"]["status"] == "updated"
    assert result["prompt"]["deep_view_url"].startswith("http://")
```

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/scripts/test_update_analysis.py::test_update_analysis_writes_prompt_metadata -v`

Expected: FAIL because the writer does not yet support prompt metadata.

- [x] **Step 3: Write minimal implementation**

Extend the writer to store:

- `session_id`
- `prompt.status`
- `prompt.delta`
- `prompt.top_reasons`
- `prompt.deep_view_url`

Minimal output shape:

```python
analysis_data["prompt"] = {
    "status": args.status or "updated",
    "delta": args.delta or 0,
    "top_reasons": args.top_reasons.split("|") if args.top_reasons else [],
    "deep_view_url": build_deep_view_url(args.session_id)
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `pytest tests/scripts/test_update_analysis.py::test_update_analysis_writes_prompt_metadata -v`

Expected: PASS

- [x] **Step 5: Add validation tests**

Add tests for:

- invalid complexity range
- empty session id behavior
- empty reasons list behavior

- [x] **Step 6: Run the focused test file**

Run: `pytest tests/scripts/test_update_analysis.py -v`

Expected: all tests PASS

- [x] **Step 7: Commit**

```bash
git add scripts/update_analysis.py tests/scripts/test_update_analysis.py
git commit -m "feat: add prompt metadata to analysis writer"
```

---

### Task 3: Add Server Endpoints for Status and Actions

**Files:**
- Modify: `server/server.py`
- Test: `tests/server/test_server_api.py`

- [x] **Step 1: Write the failing test**

Add tests for:

- `GET /api/status`
- `GET /api/prompt`
- `POST /api/actions/accept`
- `POST /api/actions/dismiss`

```python
def test_status_endpoint_returns_updated_state(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    assert response.json["status"] in {"waiting", "updated", "failed", "stale"}
```

- [x] **Step 2: Run test to verify it fails**

Run: `pytest tests/server/test_server_api.py::test_status_endpoint_returns_updated_state -v`

Expected: FAIL because the endpoint does not exist.

- [x] **Step 3: Write minimal implementation**

Extend `server.py` to expose:

- `/api/status` -> current integration state
- `/api/prompt` -> current prompt payload for deep-view entry
- `/api/actions/accept` -> mark suggestion accepted
- `/api/actions/dismiss` -> mark suggestion ignored

Persist action results in a simple append-only JSON log if needed.

- [x] **Step 4: Run the endpoint tests**

Run: `pytest tests/server/test_server_api.py -v`

Expected: PASS

- [x] **Step 5: Verify server still serves the dashboard**

Run: `python server/server.py`

Expected: server starts on `http://127.0.0.1:5000` and static UI still loads.

- [x] **Step 6: Commit**

```bash
git add server/server.py tests/server/test_server_api.py
git commit -m "feat: add openclaw status and action endpoints"
```

---

### Task 4: Build the OpenClaw Runtime Adapter

**Files:**
- Create: `openclaw/integration/firstclaw_integration.js`
- Create: `openclaw/integration/analysis_payload.js`
- Create: `openclaw/integration/gateway_client.js`
- Create: `openclaw/config/hooks.example.json`
- Test: `openclaw/integration/__tests__/analysis_payload.test.js`

- [x] **Step 1: Write the failing test**

Add a serializer test:

```javascript
it("formats a compact prompt message", () => {
  const text = formatPrompt({
    task: "Implement login",
    complexity: 78,
    can_remove: ["OAuth", "multi-tenant"],
    top_reasons: ["Added OAuth"],
    deep_view_url: "http://127.0.0.1:5000/?session=abc"
  });
  expect(text).toContain("复杂度");
  expect(text).toContain("查看分析");
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- openclaw/integration/__tests__/analysis_payload.test.js`

Expected: FAIL because formatter does not exist yet.

- [x] **Step 3: Write minimal implementation**

Build three small units:

- `analysis_payload.js`
  turns JSON analysis into short prompt text
- `gateway_client.js`
  sends a `chat.inject` message to OpenClaw Gateway
- `firstclaw_integration.js`
  wires trigger events to payload formatting and gateway delivery

Minimal injection payload:

```javascript
{
  type: "chat.inject",
  session_id,
  message: {
    role: "system",
    content: "复杂度升至 78，新增 2 个隐含假设。查看分析: http://127.0.0.1:5000/?session=abc"
  }
}
```

- [x] **Step 4: Add de-duplication logic**

Only inject when:

- complexity delta exceeds threshold
- can-remove set changed
- session has not received a prompt yet

- [x] **Step 5: Run the test suite**

Run: `npm test -- openclaw/integration/__tests__/analysis_payload.test.js`

Expected: PASS

- [x] **Step 6: Commit**

```bash
git add openclaw/integration openclaw/config/hooks.example.json
git commit -m "feat: add openclaw prompt injection adapter"
```

---

### Task 5: Upgrade the Deep-View UI for Actionable Use

**Files:**
- Modify: `ui/index.html`
- Modify: `ui/app.js`
- Test: `tests/ui/prompt_actions.spec.ts`

- [ ] **Step 1: Write the failing UI test**

Add a browser test covering:

- status banner render
- action buttons render
- accept action success state
- dismiss action success state

```typescript
test("accept action updates the banner state", async ({ page }) => {
  await page.goto("http://127.0.0.1:5000/?session=oc_session_123");
  await page.getByRole("button", { name: "接受建议" }).click();
  await expect(page.getByText("已采纳")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/ui/prompt_actions.spec.ts`

Expected: FAIL because the buttons and status banner do not exist.

- [x] **Step 3: Write minimal implementation**

Add three visible UI blocks near the top of the deep view:

- current status
- why you are seeing this prompt
- action row

Action row buttons:

- `接受建议`
- `忽略这次`
- `复制最简方案`

- [x] **Step 4: Wire action calls**

`app.js` should call:

- `POST /api/actions/accept`
- `POST /api/actions/dismiss`

and update UI optimistically.

- [ ] **Step 5: Run the UI test**

Run: `npx playwright test tests/ui/prompt_actions.spec.ts`

Expected: PASS

- [ ] **Step 6: Manual verification**

Open the page and verify:

- status text is obvious
- action row is above reasoning text
- the screen answers “what should I do now?” within one viewport

- [x] **Step 7: Commit**

```bash
git add ui/index.html ui/app.js tests/ui/prompt_actions.spec.ts
git commit -m "feat: add actionable deep-view panel"
```

---

### Task 6: Bootstrap Packaging and Install Flow

**Files:**
- Create: `openclaw/bootstrap/FIRSTCLAW_MEMORY.md`
- Modify: `agent/MEMORY.md`
- Modify: `install.sh`
- Create: `docs/OPENCLAW_SETUP.md`

- [x] **Step 1: Write the failing setup check**

Add a shell-based smoke test or documented verification script that confirms:

- bootstrap file exists
- config example exists
- install prints next-step guidance

- [x] **Step 2: Prepare the dedicated bootstrap payload**

Create `FIRSTCLAW_MEMORY.md` as the OpenClaw-specific version of the prompt contract, keeping it shorter and more operational than the generic repo version.

- [x] **Step 3: Update install flow**

`install.sh` should:

- initialize data
- copy or template the OpenClaw bootstrap payload
- generate `openclaw/config/hooks.example.json`
- print platform-specific setup notes for Windows and macOS

- [x] **Step 4: Write setup documentation**

`docs/OPENCLAW_SETUP.md` must include:

- Windows setup
- macOS setup
- how to enable bootstrap injection
- how to test `chat.inject`
- how to open the deep-view panel

- [ ] **Step 5: Run the setup smoke test**

Run: `bash install.sh`

Expected: data initializes, templates are generated, and no missing-file errors occur.

- [x] **Step 6: Commit**

```bash
git add agent/MEMORY.md install.sh openclaw/bootstrap/FIRSTCLAW_MEMORY.md openclaw/config/hooks.example.json docs/OPENCLAW_SETUP.md
git commit -m "feat: add openclaw bootstrap packaging and setup docs"
```

---

### Task 7: End-to-End Verification and Release Readiness

**Files:**
- Modify: `README.md`
- Modify: `docs/USAGE.md`
- Modify: `docs/IMPLEMENTATION_SUMMARY.md`

- [x] **Step 1: Run the full local verification sequence**

Run:

```bash
python scripts/init.py
python scripts/update_analysis.py --task "Implement login" --complexity 78 --compression 40 --can-remove "OAuth,multi-tenant" --intent "Ship login fast" --reasoning "Internal app, single tenant is enough" --solution "username/password + JWT" --status updated --top-reasons "Added OAuth|Assumed multi-tenant" --session-id oc_session_123
python server/server.py
```

Expected:

- current analysis file contains prompt metadata
- server serves current and prompt endpoints
- deep-view UI loads with status and actions

- [ ] **Step 2: Verify OpenClaw prompt injection**

Use the example integration config to trigger a prompt and confirm:

- the transcript shows a short notification
- the notification links to the deep-view page
- duplicate prompts are suppressed when nothing changed

- [ ] **Step 3: Verify Windows-first flow**

Check that the complete flow works without Canvas:

- prompt appears in session
- deep-view opens in browser
- accept/dismiss actions persist

- [x] **Step 4: Update top-level docs**

Reflect the final architecture accurately:

- no claim that Canvas is required
- no claim that Windows is second-class
- clear distinction between core flow and macOS enhancement

- [ ] **Step 5: Final regression test pass**

Run:

```bash
pytest -v
npm test
npx playwright test
```

Expected: all planned suites PASS

- [ ] **Step 6: Commit**

```bash
git add README.md docs/USAGE.md docs/IMPLEMENTATION_SUMMARY.md
git commit -m "docs: finalize openclaw integration verification"
```

---

## Sequencing Notes

- Tasks 1 through 3 are the minimum contract-and-data groundwork.
- Task 4 is the first OpenClaw-visible milestone.
- Task 5 makes the product actually usable, not just technically integrated.
- Task 6 makes the flow repeatable for operators.
- Task 7 is the release gate.

## Explicit Non-Goals for This Plan

- Do not implement macOS Canvas in the first pass.
- Do not rebuild the dashboard in React.
- Do not attempt a custom native Windows shell.
- Do not add multi-project support before the single-session loop is solid.

## Done Definition

This plan is complete when:

- OpenClaw can inject a short FirstClaw prompt into a session
- the prompt links to a working deep-view panel
- the panel supports accept/dismiss/copy actions
- the full flow works on Windows without Canvas
- documentation matches reality
