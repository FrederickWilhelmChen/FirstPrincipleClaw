const test = require('node:test');
const assert = require('node:assert/strict');

const {
  shouldInjectPrompt,
  createChatInjectPayload,
} = require('../firstclaw_integration');

test('injects the first successful prompt for a session', () => {
  const current = {
    session_id: 'oc_session_123',
    status: 'updated',
    complexity: 78,
    delta: 12,
    top_reasons: ['Added OAuth'],
    can_remove: ['OAuth'],
    deep_view_url: 'http://127.0.0.1:5000/?session=oc_session_123',
  };

  assert.equal(shouldInjectPrompt({ previous: null, current }), true);
});

test('does not inject stale prompts', () => {
  const current = {
    session_id: 'oc_session_123',
    status: 'stale',
    complexity: 78,
    delta: 12,
    top_reasons: ['Added OAuth'],
    can_remove: ['OAuth'],
    deep_view_url: 'http://127.0.0.1:5000/?session=oc_session_123',
  };

  assert.equal(shouldInjectPrompt({ previous: null, current }), false);
});

test('creates a chat.inject payload with compact message text', () => {
  const payload = createChatInjectPayload({
    session_id: 'oc_session_123',
    status: 'updated',
    complexity: 78,
    delta: 12,
    top_reasons: ['Added OAuth'],
    can_remove: ['OAuth'],
    deep_view_url: 'http://127.0.0.1:5000/?session=oc_session_123',
  });

  assert.equal(payload.type, 'chat.inject');
  assert.equal(payload.session_id, 'oc_session_123');
  assert.equal(payload.message.role, 'system');
  assert.match(payload.message.content, /复杂度/);
  assert.match(payload.message.content, /查看分析/);
});
