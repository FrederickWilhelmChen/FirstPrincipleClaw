const test = require('node:test');
const assert = require('node:assert/strict');

const { sendChatInject } = require('../gateway_client');

test('sends a chat.inject payload to the OpenClaw gateway', async () => {
  let request;
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  };

  await sendChatInject({
    gatewayUrl: 'http://127.0.0.1:8787/gateway',
    payload: {
      type: 'chat.inject',
      session_id: 'oc_session_123',
      message: {
        role: 'system',
        content: '复杂度升至 78。查看分析：http://127.0.0.1:5000/?session=oc_session_123',
      },
    },
    fetchImpl,
  });

  assert.equal(request.url, 'http://127.0.0.1:8787/gateway');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');

  const body = JSON.parse(request.options.body);
  assert.equal(body.type, 'chat.inject');
  assert.equal(body.session_id, 'oc_session_123');
});
