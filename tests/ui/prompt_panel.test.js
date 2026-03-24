const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildPromptSummary,
  submitPromptAction,
} = require('../../ui/prompt_panel');

test('builds an updated prompt summary with readable reason text', () => {
  const summary = buildPromptSummary({
    task: 'Implement login',
    session_id: 'oc_session_123',
    analysis: {
      solution: 'username/password + JWT',
    },
    prompt: {
      status: 'updated',
      top_reasons: ['Added OAuth', 'Assumed multi-tenant'],
    },
  });

  assert.equal(summary.statusLabel, '已更新');
  assert.match(summary.reasonText, /Added OAuth/);
  assert.match(summary.reasonText, /Assumed multi-tenant/);
  assert.equal(summary.solutionText, 'username/password + JWT');
});

test('submits the accept action to the matching API endpoint', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  };

  await submitPromptAction({
    action: 'accept',
    sessionId: 'oc_session_123',
    fetchImpl,
  });

  assert.equal(request.url, '/api/actions/accept');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), {
    session_id: 'oc_session_123',
  });
});
