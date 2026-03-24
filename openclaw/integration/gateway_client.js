async function sendChatInject({ gatewayUrl, payload, fetchImpl = fetch }) {
  const response = await fetchImpl(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gateway request failed with status ${response.status}`);
  }

  return response;
}

module.exports = {
  sendChatInject,
};
