const test = require('node:test');
const assert = require('node:assert/strict');

const {
  shouldInjectPrompt,
  createChatInjectPayload,
} = require('../firstclaw_integration');
const { sendChatInject } = require('../gateway_client');

test('sends a prompt on first updated analysis and suppresses an identical follow-up', async () => {
  const delivered = [];
  const fetchImpl = async (_url, options) => {
    delivered.push(JSON.parse(options.body));
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  };

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

  await sendChatInject({
    gatewayUrl: 'http://127.0.0.1:8787/gateway',
    payload: createChatInjectPayload(current),
    fetchImpl,
  });

  const followUp = {
    ...current,
    delta: 0,
  };

  assert.equal(
    shouldInjectPrompt({ previous: current, current: followUp }),
    false,
  );

  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].type, 'chat.inject');
  assert.match(delivered[0].message.content, /查看分析/);
});
