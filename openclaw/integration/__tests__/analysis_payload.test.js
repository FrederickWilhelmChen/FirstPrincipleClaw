const test = require('node:test');
const assert = require('node:assert/strict');

const { formatPrompt } = require('../analysis_payload');

test('formats a compact prompt message for chat injection', () => {
  const text = formatPrompt({
    task: 'Implement login',
    complexity: 78,
    can_remove: ['OAuth', 'multi-tenant'],
    top_reasons: ['Added OAuth'],
    deep_view_url: 'http://127.0.0.1:5000/?session=abc',
  });

  assert.match(text, /复杂度/);
  assert.match(text, /78/);
  assert.match(text, /OAuth/);
  assert.match(text, /查看分析/);
  assert.match(text, /http:\/\/127\.0\.0\.1:5000\/\?session=abc/);
});
