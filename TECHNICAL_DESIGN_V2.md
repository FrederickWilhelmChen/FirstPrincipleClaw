# 技术设计文档 v2.0

## 最终方案

**FirstPrincipleClaw = 1 个专门的 OpenClaw Agent + 独立的极简看板**

---

## 架构设计

```
用户 → OpenClaw → FirstPrinciple Agent
                        ↓
                   分析并写入
                        ↓
                   data/analysis.json
                        ↓
                   看板读取并显示
                        ↓
                   浏览器实时更新
```

---

## 核心组件

### 1. FirstPrinciple Agent

**位置：** `~/.openclaw/workspace-first-principle/`

**核心文件：**
- `SOUL.md` - Agent 的角色定义和工作流程
- `skills/` - 可选的技能扩展

**SOUL.md 内容概要：**
```markdown
# FirstPrinciple Agent

你是第一性原理分析专家，负责帮助用户识别和砍掉不必要的复杂度。

## 核心职责
1. 监听用户的需求描述
2. 自动进行第一性原理分析
3. 计算复杂度和压缩率
4. 写入分析结果到 data/analysis.json
5. 不干扰其他 Agent 的工作

## 分析流程
1. 提炼用户意图
2. 识别隐含假设
3. 陈述客观事实
4. 第一性原理推导
5. 给出最简方案
6. 计算复杂度压缩率

## 输出格式
写入 data/analysis.json：
{
  "task": "任务描述",
  "complexity": 67,
  "compression": 33,
  "can_remove": ["项目1", "项目2"],
  "analysis": {...}
}
```

### 2. 看板服务器

**技术栈：**
- Python http.server（零依赖，参考三省六部）
- 端口：5000

**核心功能：**
- 提供静态文件服务（HTML/JS/CSS）
- 提供 API 读取 data/analysis.json
- WebSocket 实时推送更新

**API 端点：**
```
GET  /                    # 看板 HTML
GET  /api/current         # 当前分析
GET  /api/history         # 历史记录
WS   /ws                  # WebSocket 推送
```

### 3. 极简看板 UI

**技术栈：**
- 纯 HTML + Vanilla JS（无框架，极简）
- Tailwind CSS（通过 CDN）
- WebSocket 客户端

**单页面设计：**
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="max-w-2xl mx-auto p-8">
    <h1>FirstPrincipleClaw</h1>
    <div id="complexity">67%</div>
    <div id="can-remove">...</div>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

---

## 安装流程

### install.sh 脚本

```bash
#!/bin/bash
# FirstPrincipleClaw 一键安装

# 1. 检查 OpenClaw
if ! command -v openclaw &>/dev/null; then
  echo "请先安装 OpenClaw"
  exit 1
fi

# 2. 创建 Agent workspace
mkdir -p ~/.openclaw/workspace-first-principle

# 3. 复制 SOUL.md
cp agent/SOUL.md ~/.openclaw/workspace-first-principle/

# 4. 注册 Agent 到 openclaw.json
openclaw agents add first-principle

# 5. 创建 data 目录
mkdir -p data

# 6. 启动看板服务器
python3 server/server.py &

# 7. 打开浏览器
open http://localhost:5000

echo "✅ FirstPrincipleClaw 安装完成！"
```

---

## 使用流程

### 1. 用户在 OpenClaw 中工作
```
用户（飞书/Telegram/CLI）: "我想做一个用户管理系统"
```

### 2. FirstPrinciple Agent 自动触发
- OpenClaw 识别到需求描述
- 自动调用 FirstPrinciple Agent
- Agent 进行第一性原理分析

### 3. 写入分析结果
```bash
# Agent 执行
python3 scripts/update_analysis.py \
  --task "用户管理系统" \
  --complexity 67 \
  --compression 33 \
  --can-remove "角色系统,审计日志,多租户"
```

### 4. 看板实时更新
- WebSocket 推送更新
- 浏览器显示新的复杂度
- 闪烁提醒（如果超过阈值）

---

## 文件结构

```
FirstPrincipleClaw/
├── agent/
│   └── SOUL.md                 # Agent 定义
├── server/
│   ├── server.py               # Python HTTP Server
│   └── update_analysis.py      # 更新分析结果的脚本
├── ui/
│   ├── index.html              # 看板页面
│   └── app.js                  # WebSocket 客户端
├── data/
│   ├── analysis.json           # 当前分析
│   └── history.json            # 历史记录
├── install.sh                  # 安装脚本
└── README.md
```

---

## 开发计划

### Phase 1：Agent 开发（2-3 天）
- Day 1：编写 SOUL.md
- Day 2：测试 Agent 逻辑
- Day 3：优化分析 prompt

### Phase 2：看板开发（2-3 天）
- Day 4：实现 server.py
- Day 5：实现极简 UI
- Day 6：WebSocket 实时推送

### Phase 3：集成测试（1-2 天）
- Day 7：端到端测试
- Day 8：优化和打磨

**总计：7-8 天完成 MVP**

---

## 核心优势

1. **轻量级**：只有 1 个 Agent，比三省六部轻 10 倍
2. **不侵入**：不修改用户现有的 Agent
3. **极简 UI**：单页面，加载快
4. **零依赖后端**：纯 stdlib
5. **易安装**：一键脚本

---

## 下一步

开始 Phase 1 开发：编写 SOUL.md
