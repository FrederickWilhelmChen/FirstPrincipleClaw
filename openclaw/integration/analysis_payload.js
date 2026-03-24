function formatPrompt(payload) {
  const complexity = payload?.complexity ?? 0;
  const reasons = Array.isArray(payload?.top_reasons) ? payload.top_reasons.filter(Boolean) : [];
  const removable = Array.isArray(payload?.can_remove) ? payload.can_remove.filter(Boolean) : [];
  const reasonText = reasons.length ? `原因：${reasons.slice(0, 2).join('，')}。` : '';
  const removeText = removable.length ? `建议砍掉：${removable.slice(0, 3).join('、')}。` : '';
  const url = payload?.deep_view_url || 'http://127.0.0.1:5000/';

  return `复杂度升至 ${complexity}。${reasonText}${removeText}查看分析：${url}`;
}

module.exports = {
  formatPrompt,
};
