// FirstPrincipleClaw — dashboard client
const POLL_INTERVAL = 2000;
const { buildPromptSummary, submitPromptAction } = window.PromptPanel;

let currentAnalysis = null;

async function fetchCurrent() {
  try {
    const res = await fetch('/api/current');
    if (!res.ok) return;
    const data = await res.json();
    currentAnalysis = data;
    render(data);
  } catch (e) {
    setOffline();
  }
}

function render(data) {
  renderPromptPanel(data);

  // Task
  document.getElementById('task').textContent = data.task || '—';

  // Complexity
  const c = data.complexity || 0;
  document.getElementById('complexity-number').innerHTML =
    `${c}<span>%</span>`;
  document.getElementById('complexity-fill').style.width = `${c}%`;

  // Color shift: green → yellow → red
  const fill = document.getElementById('complexity-fill');
  if (c < 40) fill.style.background = 'var(--green)';
  else if (c < 70) fill.style.background = '#f5a623';
  else fill.style.background = 'var(--red)';

  // Compression
  const comp = data.compression || 0;
  document.getElementById('compression').textContent = `↓ ${comp}%`;

  // Can remove
  const list = document.getElementById('can-remove');
  list.innerHTML = '';
  const items = data.can_remove || [];
  if (items.length === 0) {
    list.innerHTML = '<li class="empty">Nothing to cut yet.</li>';
  } else {
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'remove-item';
      li.textContent = item;
      list.appendChild(li);
    });
  }

  // Solution
  document.getElementById('solution').textContent =
    data.analysis?.solution || '—';

  // Analysis breakdown
  document.getElementById('intent').textContent =
    data.analysis?.intent || '—';

  renderTags('assumptions', data.analysis?.assumptions || []);
  renderTags('facts', data.analysis?.facts || []);

  document.getElementById('reasoning').textContent =
    data.analysis?.reasoning || '—';

  // Timestamp
  if (data.timestamp) {
    const d = new Date(data.timestamp);
    document.getElementById('timestamp').textContent =
      d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // History
  fetchHistory();
}

function renderTags(id, items) {
  const el = document.getElementById(id);
  if (!items.length) { el.textContent = '—'; return; }
  el.innerHTML = items.map(i =>
    `<span class="tag">${i}</span>`
  ).join('');
}

async function fetchHistory() {
  try {
    const res = await fetch('/api/history');
    if (!res.ok) return;
    const history = await res.json();
    renderHistory(history.slice(-8).reverse());
  } catch (e) {}
}

function renderHistory(items) {
  const list = document.getElementById('history-list');
  list.innerHTML = '';
  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'history-item' + (i === 0 ? ' history-item--active' : '');
    const d = new Date(item.timestamp);
    const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `
      <span class="history-task">${item.task || '—'}</span>
      <span class="history-complexity">${item.complexity}%</span>
    `;
    el.addEventListener('click', () => render(item));
    list.appendChild(el);
  });
}

function renderPromptPanel(data) {
  const summary = buildPromptSummary(data);

  const badge = document.getElementById('prompt-status-badge');
  const reason = document.getElementById('prompt-reason');
  const feedback = document.getElementById('prompt-feedback');

  badge.textContent = summary.statusLabel;
  badge.dataset.status = summary.status;
  reason.textContent = summary.reasonText;

  if (!feedback.dataset.locked) {
    feedback.textContent = '现在可以直接接受、忽略，或复制最简方案。';
  }
}

async function handlePromptAction(action) {
  if (!currentAnalysis) {
    return;
  }

  const feedback = document.getElementById('prompt-feedback');

  try {
    if (action === 'copy') {
      const summary = buildPromptSummary(currentAnalysis);
      await navigator.clipboard.writeText(summary.solutionText);
      feedback.dataset.locked = 'true';
      feedback.textContent = '最简方案已复制。';
      return;
    }

    await submitPromptAction({
      action,
      sessionId: currentAnalysis.session_id,
    });

    feedback.dataset.locked = 'true';
    feedback.textContent = action === 'accept' ? '建议已采纳。' : '本次建议已忽略。';
  } catch (error) {
    feedback.dataset.locked = 'true';
    feedback.textContent = '动作提交失败，请稍后再试。';
  }
}

function setOffline() {
  // Could add offline indicator here if needed
}

document.getElementById('accept-action').addEventListener('click', () => handlePromptAction('accept'));
document.getElementById('dismiss-action').addEventListener('click', () => handlePromptAction('dismiss'));
document.getElementById('copy-action').addEventListener('click', () => handlePromptAction('copy'));

// Poll
setInterval(fetchCurrent, POLL_INTERVAL);
fetchCurrent();
