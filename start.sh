#!/bin/bash
# FirstPrincipleClaw 快速启动脚本

cd "$(dirname "$0")"

echo "🚀 启动 FirstPrincipleClaw..."
echo ""
echo "访问: http://127.0.0.1:5000"
echo "按 Ctrl+C 停止服务器"
echo ""

python3 server/server.py
