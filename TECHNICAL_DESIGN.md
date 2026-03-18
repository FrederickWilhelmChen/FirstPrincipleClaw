# 技术设计文档

## 架构概览

FirstPrincipleClaw 采用 **Skill + 轻量级 Web UI** 的架构，与 OpenClaw 深度集成。

```
┌─────────────────────────────────────────────────┐
│              OpenClaw Gateway                   │
│              (WebSocket Server)                 │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│         FirstPrincipleClaw Skill                │
│  ┌──────────────────────────────────────────┐  │
│  │  analyzer.md (第一性原理分析逻辑)         │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                            │
│  ┌──────────────────────────────────────────┐  │
│  │  HTTP Server (Python/Node.js)            │  │
│  │  - 接收分析结果                           │  │
│  │  - 存储到本地 JSON                        │  │
│  │  - 提供 REST API                          │  │
│  └──────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────┘
                 │ (HTTP + WebSocket)
                 ↓
┌─────────────────────────────────────────────────┐
│              Web UI (React)                     │
│  - 实时显示复杂度                                │
│  - 可视化分析结果                                │
│  - 历史记录                                      │
└─────────────────────────────────────────────────┘
```

---

## 核心组件

### 1. OpenClaw Skill

**文件结构：**
```
skill/
├── SKILL.md              # Skill 定义（OpenClaw 标准格式）
├── analyzer.md           # 第一性原理分析 prompt
└── scripts/
    └── analyze.py        # 分析脚本（可选）
```

**SKILL.md 内容：**
- 技能名称：first-principle-analyzer
- 触发条件：用户提出需求或问题时
- 功能描述：使用第一性原理分析问题复杂度
- 输出格式：结构化 JSON

**工作流程：**
1. OpenClaw Gateway 接收用户输入
2. 触发 FirstPrincipleClaw Skill
3. Skill 调用 LLM 进行第一性原理分析
4. 分析结果通过 HTTP API 发送到本地服务器
5. Web UI 实时更新显示

### 2. HTTP Server

**技术栈：**
- Python Flask（轻量级）
- 端口：5000（默认）
- 数据存储：本地 JSON 文件

**API 端点：**
```
POST /api/analyze        # 接收分析结果
GET  /api/current        # 获取当前任务
GET  /api/history        # 获取历史记录
WS   /ws                 # WebSocket 实时推送
```

**数据格式：**
```json
{
  "task": "实现用户管理系统",
  "complexity": 67,
  "compression": 33,
  "can_remove": [
    "角色系统",
    "审计日志",
    "多租户"
  ],
  "analysis": {
    "intent": "...",
    "assumptions": [...],
    "facts": [...],
    "reasoning": [...],
    "solution": "..."
  },
  "timestamp": "2026-03-19T10:00:00Z"
}
```

### 3. Web UI

**技术栈：**
- React（轻量级）
- Tailwind CSS（极简样式）
- WebSocket（实时通信）

**页面结构：**
- 单页面应用（SPA）
- 极简设计（参考 Linear/Vercel）
- 响应式布局

**核心功能：**
1. 实时显示当前任务复杂度
2. 展示"可以砍掉的"列表
3. 历史记录查看
4. 复杂度趋势图

---

## 与 OpenClaw 集成

### 安装方式

**作为 OpenClaw Skill 安装：**
```bash
# 全局安装
openclaw skills add first-principle-claw

# 或从 GitHub 安装
openclaw skills add https://github.com/FrederickWilhelmChen/FirstPrincipleClaw
```

### 配置文件

**~/.openclaw/skills/first-principle-claw/config.json**
```json
{
  "enabled": true,
  "server_port": 5000,
  "ui_port": 3000,
  "auto_start": true
}
```

### 工作流程

1. **用户在 OpenClaw 中提问**
   ```
   用户: "我想做一个用户管理系统"
   ```

2. **OpenClaw Gateway 触发 Skill**
   - 识别到需求分析场景
   - 调用 FirstPrincipleClaw Skill

3. **Skill 执行分析**
   - 使用第一性原理 prompt
   - 调用 LLM 分析
   - 计算复杂度

4. **结果推送**
   - Skill 通过 HTTP POST 发送结果到本地服务器
   - 服务器存储数据
   - WebSocket 推送到 UI

5. **UI 实时更新**
   - 显示复杂度：67%
   - 显示可砍掉的：3 项
   - 闪烁提醒（如果超过阈值）

---

## 开发计划

### Phase 1：核心 Skill（3-4 天）

**Day 1-2：Skill 开发**
- 创建 SKILL.md
- 编写第一性原理分析 prompt
- 定义输出格式

**Day 3-4：本地测试**
- 在 OpenClaw 中测试 Skill
- 调试分析逻辑
- 优化 prompt

### Phase 2：HTTP Server（2-3 天）

**Day 5-6：服务器开发**
- 实现 Flask API
- WebSocket 支持
- 本地 JSON 存储

**Day 7：集成测试**
- Skill → Server 通信测试
- 数据持久化测试

### Phase 3：Web UI（2-3 天）

**Day 8-9：UI 开发**
- React 基础框架
- Tailwind CSS 样式
- 复杂度可视化组件

**Day 10：打磨**
- 动画效果
- 响应式布局
- 极简设计优化

---

## 技术细节

### 复杂度计算算法

```python
def calculate_complexity(analysis):
    # 基础分数
    base_score = 0

    # 假设数量（每个 +10）
    base_score += len(analysis['assumptions']) * 10

    # 操作步骤（每个 +15）
    base_score += len(analysis['steps']) * 15

    # 依赖项（每个 +20）
    base_score += len(analysis['dependencies']) * 20

    # 归一化到 0-100
    complexity = min(base_score, 100)

    return complexity
```

### 压缩率计算

```python
compression_rate = (original_complexity - simplified_complexity) / original_complexity * 100
```

---

## 部署方式

### 本地开发
```bash
# 1. 克隆项目
git clone https://github.com/FrederickWilhelmChen/FirstPrincipleClaw.git

# 2. 安装依赖
cd FirstPrincipleClaw
pip install -r requirements.txt
npm install

# 3. 启动服务器
python server/server.py

# 4. 启动 UI
npm run dev

# 5. 安装到 OpenClaw
openclaw skills add ./skill
```

### 生产部署
```bash
# 作为 OpenClaw Skill 安装
openclaw skills add first-principle-claw

# 自动启动服务器和 UI
openclaw start
```

---

## 总结

**核心优势：**
- 与 OpenClaw 深度集成
- 轻量级架构
- 实时反馈
- 极简 UI

**下一步：**
开始 Phase 1 开发

**Sources:**
- [OpenClaw 官方文档](https://openclaw.ai)
