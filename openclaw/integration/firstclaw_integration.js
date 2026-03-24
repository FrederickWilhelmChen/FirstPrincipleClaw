const { formatPrompt } = require('./analysis_payload');

function normalizeList(items) {
  return Array.isArray(items) ? items.filter(Boolean).map(String).sort() : [];
}

function listsDiffer(left, right) {
  const a = normalizeList(left);
  const b = normalizeList(right);
  if (a.length !== b.length) {
    return true;
  }
  return a.some((item, index) => item !== b[index]);
}

function shouldInjectPrompt({ previous, current, deltaThreshold = 10 }) {
  if (!current || current.status !== 'updated') {
    return false;
  }

  if (!previous || previous.session_id !== current.session_id) {
    return true;
  }

  if (Math.abs(current.delta || 0) >= deltaThreshold) {
    return true;
  }

  if (listsDiffer(previous.can_remove, current.can_remove)) {
    return true;
  }

  return false;
}

function createChatInjectPayload(current) {
  return {
    type: 'chat.inject',
    session_id: current.session_id,
    message: {
      role: 'system',
      content: formatPrompt(current),
    },
  };
}

module.exports = {
  shouldInjectPrompt,
  createChatInjectPayload,
};
