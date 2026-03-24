# FirstPrincipleClaw OpenClaw 接入说明

## 适用范围

这份文档说明如何把当前仓库接到 OpenClaw 主线流程中。

当前仓库已经具备：

- 分析结果写入脚本
- deep-view 本地页面
- prompt/status/action API
- OpenClaw 侧的基础适配模块

但接入仍需要你在 OpenClaw 侧补 bootstrap 和 hook 配置。

## 关键文件

- `openclaw/bootstrap/FIRSTCLAW_MEMORY.md`
  OpenClaw 注入用的精简上下文
- `openclaw/config/hooks.example.json`
  示例 hook / gateway 配置
- `openclaw/integration/`
  prompt 格式化、注入判断、网关客户端

## 基础步骤

1. 初始化 FirstClaw 本地数据
2. 启动 deep-view 服务
3. 在 OpenClaw 侧启用 bootstrap 注入
4. 让 hook / plugin 在合适时机触发分析
5. 用 `chat.inject` 把短提示送进当前会话

## Windows

建议步骤：

1. 运行 `python scripts/init.py`
2. 运行 `python server/server.py`
3. 参考 `openclaw/config/hooks.example.json` 配置 bootstrap 和 gateway
4. 确认 deep-view 可通过 `http://127.0.0.1:5000/` 打开

Windows 是主线平台之一，不应依赖 macOS Canvas 才成立。

## macOS

建议步骤与 Windows 基本一致：

1. 初始化数据
2. 启动本地 deep-view
3. 配置 bootstrap 和 hook
4. 验证 `chat.inject` 是否能正确提示

Canvas 目前只作为增强项，不是主线依赖。

## 如何启用 bootstrap 注入

参考 `openclaw/config/hooks.example.json` 中的 `bootstrap-extra-files` 配置，把 `FIRSTCLAW_MEMORY.md` 注入到 OpenClaw 会话上下文。

## 如何验证 chat.inject

至少验证以下几点：

- 当前 session 有一次成功分析
- prompt payload 状态为 `updated`
- transcript 中出现短提示
- 点击提示能打开 deep-view 页面

## 如何打开 deep-view

默认 deep-view 地址：

- `http://127.0.0.1:5000/`

如果有 session id，则 URL 形如：

- `http://127.0.0.1:5000/?session=oc_session_123`

## 故障排查

- 如果看不到页面，先确认 `python server/server.py` 是否已启动
- 如果 prompt payload 为空，先检查 `scripts/update_analysis.py` 是否已写入 `prompt` 字段
- 如果 OpenClaw 没有提示，先检查 hook 是否真的调用了运行时适配层
- 如果只是本地原型可用、会话里没有提示，说明 OpenClaw 接入层还没连通
