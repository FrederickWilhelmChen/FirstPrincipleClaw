#!/bin/bash
# FirstPrincipleClaw 一键安装脚本

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log()   { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
info()  { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FirstPrincipleClaw 安装向导              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# 检查 Python
info "检查 Python..."
command -v python3 &>/dev/null || error "未找到 python3，请先安装 Python 3.7+"
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
log "Python 版本: $PYTHON_VERSION"

# 初始化数据
info "初始化数据目录..."
python3 "$REPO_DIR/scripts/init.py"
log "数据初始化完成"

# 准备 OpenClaw 接入目录
info "准备 OpenClaw 接入资源..."
mkdir -p "$REPO_DIR/openclaw/bootstrap"
mkdir -p "$REPO_DIR/openclaw/config"
log "OpenClaw 接入目录已就绪"

# 创建 Agent 配置（可选）
info "配置 Agent 触发机制..."
mkdir -p "$REPO_DIR/.kiro/steering"
if [ ! -f "$REPO_DIR/.kiro/steering/first-principles.md" ]; then
    cp "$REPO_DIR/agent/MEMORY.md" "$REPO_DIR/.kiro/steering/first-principles.md"
    log "已创建 Kiro steering 配置"
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 安装完成！                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "下一步："
echo "  1. 启动服务器: python3 server/server.py"
echo "  2. 打开浏览器: http://127.0.0.1:5000"
echo "  3. OpenClaw 示例配置: openclaw/config/hooks.example.json"
echo "  4. OpenClaw 接入说明: docs/OPENCLAW_SETUP.md"
echo "  5. Windows / macOS 都应先验证 deep-view，再接 chat.inject"
echo "  6. 测试数据写入:"
echo "     python3 scripts/update_analysis.py \\"
echo "       --task '测试任务' \\"
echo "       --complexity 50 \\"
echo "       --compression 30 \\"
echo "       --intent '测试意图' \\"
echo "       --solution '测试方案'"
echo ""
