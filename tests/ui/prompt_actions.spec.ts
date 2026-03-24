import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const rootDir = path.resolve(__dirname, '..', '..');
const uiDir = path.join(rootDir, 'ui');

const currentPayload = {
  task: 'Implement login',
  complexity: 78,
  compression: 40,
  session_id: 'oc_session_123',
  can_remove: ['OAuth', 'multi-tenant'],
  analysis: {
    intent: 'Ship login fast',
    assumptions: ['Need OAuth'],
    facts: ['Internal app'],
    reasoning: 'OAuth can wait',
    solution: 'username/password + JWT',
  },
  prompt: {
    status: 'updated',
    delta: 12,
    top_reasons: ['Added OAuth', 'Assumed multi-tenant'],
    deep_view_url: 'http://127.0.0.1:5000/?session=oc_session_123',
  },
  timestamp: '2026-03-24T00:00:00Z',
};

let server: http.Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const url = req.url || '/';

    if (url === '/' || url.startsWith('/?')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(uiDir, 'index.html')));
      return;
    }

    if (url === '/app.js' || url === '/prompt_panel.js') {
      const filename = url.slice(1);
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(fs.readFileSync(path.join(uiDir, filename)));
      return;
    }

    if (url === '/api/current') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(currentPayload));
      return;
    }

    if (url === '/api/history') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify([currentPayload]));
      return;
    }

    if (url === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        status: 'updated',
        session_id: 'oc_session_123',
        timestamp: currentPayload.timestamp,
      }));
      return;
    }

    if (url === '/api/prompt') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        status: 'updated',
        delta: 12,
        top_reasons: ['Added OAuth', 'Assumed multi-tenant'],
        deep_view_url: 'http://127.0.0.1:5000/?session=oc_session_123',
        task: 'Implement login',
        session_id: 'oc_session_123',
        complexity: 78,
        can_remove: ['OAuth', 'multi-tenant'],
      }));
      return;
    }

    if (url === '/api/actions/accept' || url === '/api/actions/dismiss') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        const parsed = body ? JSON.parse(body) : {};
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          ok: true,
          action: url.endsWith('accept') ? 'accept' : 'dismiss',
          session_id: parsed.session_id || '',
        }));
      });
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  await new Promise<void>(resolve => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start test server');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test('renders status and action buttons', async ({ page }) => {
  await page.goto(`${baseUrl}/?session=oc_session_123`);

  await expect(page.getByText('Prompt Status')).toBeVisible();
  await expect(page.getByRole('button', { name: '接受建议' })).toBeVisible();
  await expect(page.getByRole('button', { name: '忽略这次' })).toBeVisible();
  await expect(page.getByRole('button', { name: '复制方案' })).toBeVisible();
});

test('accept action updates the feedback state', async ({ page }) => {
  await page.goto(`${baseUrl}/?session=oc_session_123`);

  await page.getByRole('button', { name: '接受建议' }).click();
  await expect(page.getByText('建议已采纳。')).toBeVisible();
});

test('dismiss action updates the feedback state', async ({ page }) => {
  await page.goto(`${baseUrl}/?session=oc_session_123`);

  await page.getByRole('button', { name: '忽略这次' }).click();
  await expect(page.getByText('本次建议已忽略。')).toBeVisible();
});
