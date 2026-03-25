# FirstPrincipleClaw 当前用法

## 适用范围

这份文档只说明当前仓库里已经能跑起来的本地原型，不宣称 OpenClaw 集成已经完整打通。

## 初始化

```bash
python scripts/init.py
```

## 写入一条分析结果

```bash
python scripts/update_analysis.py \
  --task "实现登录流程" \
  --complexity 78 \
  --compression 40 \
  --can-remove "OAuth,多租户" \
  --intent "尽快交付可用登录" \
  --assumptions "需要OAuth|需要多租户" \
  --facts "内部系统|单团队维护" \
  --reasoning "当前场景先做基础用户名密码即可" \
  --solution "用户名密码 + JWT" \
  --session-id oc_session_123 \
  --status updated \
  --delta 12 \
  --top-reasons "新增OAuth|引入多租户假设"
```

## 启动本地面板

```bash
python server/server.py
```

打开 [http://127.0.0.1:5000](http://127.0.0.1:5000)。

## 当前可用接口

- `GET /api/current`
  返回当前分析结果
- `GET /api/history`
  返回历史记录
- `GET /api/status`
  返回轻提示状态
- `GET /api/prompt`
  返回供 OpenClaw 使用的 prompt payload
- `POST /api/actions/accept`
  记录接受建议动作
- `POST /api/actions/dismiss`
  记录忽略建议动作

## 当前可用的 OpenClaw 集成模块

- `openclaw/integration/analysis_payload.js`
  负责把分析结果压缩成短提示文案
- `openclaw/integration/firstclaw_integration.js`
  负责注入判定和 `chat.inject` 载荷构造
- `openclaw/integration/gateway_client.js`
  负责把载荷发送到 OpenClaw Gateway
- `openclaw/config/hooks.example.json`
  提供示例接入配置

## 当前推荐验证流程

```bash
python scripts/init.py
python scripts/update_analysis.py \
  --task "Implement login" \
  --complexity 78 \
  --compression 40 \
  --can-remove "OAuth,multi-tenant" \
  --intent "Ship login fast" \
  --assumptions "Need OAuth|Need multi-tenant" \
  --facts "Internal app|Single team" \
  --reasoning "Internal app, single tenant is enough" \
  --solution "username/password + JWT" \
  --status updated \
  --top-reasons "Added OAuth|Assumed multi-tenant" \
  --session-id oc_session_123
pytest -q
node --test openclaw/integration/__tests__/analysis_payload.test.js openclaw/integration/__tests__/firstclaw_integration.test.js openclaw/integration/__tests__/gateway_client.test.js tests/ui/prompt_panel.test.js
npx playwright test tests/ui/prompt_actions.spec.ts
python server/server.py
```

另开一个终端执行上面的 `update_analysis.py` 示例命令，然后刷新页面和接口。

## 当前验证边界

这套流程目前能证明：

- 本地分析写入正常
- deep-view API 正常
- OpenClaw 注入骨架逻辑正常
- deep-view 基础动作逻辑正常
- 浏览器级 deep-view 交互正常

这套流程目前还不能证明：

- 真实 OpenClaw transcript 已经收到提示
- OpenClaw runtime 已完成真实接线

## 当前不该误解的地方

- 这套页面现在已经是可操作的 deep-view 雏形，但还不是最终 OpenClaw 内嵌界面
- `GET /api/prompt` 和 `openclaw/integration/` 已经提供注入骨架，但还没有完成真实 OpenClaw transcript 联调
- action 接口和页面动作都已经存在，但还没有完成完整端到端验收

## 与 OpenClaw 的关系

当前仓库的正确理解方式是：

- 先用本地服务验证 FirstClaw 的分析数据结构和 deep-view 能力
- 再补 OpenClaw 的 hook / plugin / `chat.inject` 集成层

不要把当前原型误读成“项目已经独立完成，无需 OpenClaw 也成立”的最终形态。
