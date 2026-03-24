#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FirstPrincipleClaw - 极简看板服务器
零依赖 HTTP Server + WebSocket
"""
import json
import sys
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime, timezone

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

PORT = 5000
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
UI_DIR = BASE_DIR / "ui"
ACTIONS_FILE = DATA_DIR / "actions.json"


def read_json_file(filepath, default):
    """Read JSON from disk or return a default value."""
    if not filepath.exists():
        return default
    return json.loads(filepath.read_text(encoding='utf-8'))


def write_json_file(filepath, payload):
    """Write JSON payload to disk."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')


def utc_timestamp():
    """Return the current timestamp in UTC ISO 8601 format."""
    return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')


def current_analysis():
    """Return the current analysis payload."""
    return read_json_file(DATA_DIR / "analysis.json", {})


def build_status_payload(analysis):
    """Build the lightweight status payload."""
    prompt = analysis.get('prompt', {})
    return {
        'status': prompt.get('status', 'waiting'),
        'session_id': analysis.get('session_id', ''),
        'timestamp': analysis.get('timestamp'),
    }


def build_prompt_payload(analysis):
    """Build the prompt payload used by OpenClaw integration."""
    prompt = analysis.get('prompt', {})
    return {
        'status': prompt.get('status', 'waiting'),
        'delta': prompt.get('delta', 0),
        'top_reasons': prompt.get('top_reasons', []),
        'deep_view_url': prompt.get('deep_view_url', 'http://127.0.0.1:5000/'),
        'task': analysis.get('task', ''),
        'session_id': analysis.get('session_id', ''),
        'complexity': analysis.get('complexity', 0),
        'can_remove': analysis.get('can_remove', []),
    }


def append_action(action, session_id):
    """Append an action entry and return the stored payload."""
    actions = read_json_file(ACTIONS_FILE, [])
    entry = {
        'action': action,
        'session_id': session_id,
        'timestamp': utc_timestamp(),
    }
    actions.append(entry)
    write_json_file(ACTIONS_FILE, actions)
    return entry

class ClawHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(UI_DIR), **kwargs)

    def do_GET(self):
        try:
            path = urlparse(self.path).path

            if path == '/api/current':
                self.send_json_file(DATA_DIR / "analysis.json")
            elif path == '/api/history':
                self.send_json_file(DATA_DIR / "history.json")
            elif path == '/api/status':
                self.send_json(self.build_status_payload())
            elif path == '/api/prompt':
                self.send_json(self.build_prompt_payload())
            else:
                super().do_GET()
        except Exception as e:
            self.send_error(500, str(e))

    def do_POST(self):
        try:
            path = urlparse(self.path).path

            if path == '/api/actions/accept':
                self.handle_action('accept')
            elif path == '/api/actions/dismiss':
                self.handle_action('dismiss')
            else:
                self.send_error(404)
        except Exception as e:
            self.send_error(500, str(e))

    def send_json_file(self, filepath):
        try:
            if not filepath.exists():
                self.send_error(404)
                return
            self.send_json(read_json_file(filepath, None))
        except Exception as e:
            self.send_error(500, str(e))

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def current_analysis(self):
        return current_analysis()

    def build_status_payload(self):
        return build_status_payload(self.current_analysis())

    def build_prompt_payload(self):
        return build_prompt_payload(self.current_analysis())

    def read_request_json(self):
        content_length = int(self.headers.get('Content-Length', '0'))
        if content_length <= 0:
            return {}
        body = self.rfile.read(content_length).decode('utf-8')
        return json.loads(body) if body else {}

    def handle_action(self, action):
        payload = self.read_request_json()
        entry = append_action(action, payload.get('session_id', ''))
        self.send_json({
            'ok': True,
            'action': action,
            'session_id': entry['session_id'],
        })

if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), ClawHandler)
    print(f'✅ FirstPrincipleClaw 看板启动: http://127.0.0.1:{PORT}')
    server.serve_forever()
