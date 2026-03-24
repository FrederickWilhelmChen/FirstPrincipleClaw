(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.PromptPanel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function buildPromptSummary(data) {
    const prompt = data?.prompt || {};
    const status = prompt.status || 'waiting';
    const reasons = Array.isArray(prompt.top_reasons) ? prompt.top_reasons.filter(Boolean) : [];

    const statusLabelMap = {
      waiting: '等待分析',
      updated: '已更新',
      failed: '分析失败',
      stale: '数据过旧',
    };

    return {
      status,
      statusLabel: statusLabelMap[status] || '等待分析',
      reasonText: reasons.length ? reasons.join(' · ') : '当前还没有新的提醒原因。',
      solutionText: data?.analysis?.solution || '—',
    };
  }

  async function submitPromptAction({ action, sessionId, fetchImpl = fetch }) {
    const response = await fetchImpl(`/api/actions/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`Action request failed with status ${response.status}`);
    }

    return response.json();
  }

  return {
    buildPromptSummary,
    submitPromptAction,
  };
});
