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

# 检查 Node / npm
info "检查 Node.js..."
command -v node &>/dev/null || error "未找到 node，请先安装 Node.js 22+"
command -v npm &>/dev/null || error "未找到 npm，请先安装 npm"
NODE_VERSION=$(node --version)
log "Node 版本: $NODE_VERSION"

# 安装依赖
info "安装 npm 依赖..."
npm install --prefix "$REPO_DIR"
log "npm 依赖已就绪"

# 执行 OpenClaw 托管安装
info "执行 OpenClaw 托管安装..."
npm run --prefix "$REPO_DIR" openclaw:install -- "$@"
log "OpenClaw 托管安装完成"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎉 安装完成！                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo "下一步："
echo "  1. 重启或刷新 OpenClaw Gateway / Control UI"
echo "  2. 确认默认 agent 已切到 first-principle"
echo "  3. OpenClaw 示例配置: openclaw/config/hooks.example.json"
echo "  4. OpenClaw 接入说明: docs/OPENCLAW_SETUP.md"
echo "  5. Windows / macOS / Linux 都走同一套 Node 安装路径"
echo "  6. 如需卸载: npm run openclaw:uninstall"
echo ""
