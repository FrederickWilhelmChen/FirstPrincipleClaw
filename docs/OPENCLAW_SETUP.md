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

1. 安装 npm 依赖
2. 运行 FirstClaw 的 OpenClaw 托管安装脚本
3. 重启或刷新 OpenClaw Gateway / Control UI
4. 验证默认 agent、bootstrap、plugin 和侧栏注入都已生效

## Windows

建议步骤：

1. 运行 `npm install`
2. 运行 `npm run openclaw:install`
3. 重启或刷新 OpenClaw Gateway / Control UI
4. 确认 `first-principle` 已安装并成为默认 agent

Windows 是主线平台之一，不应依赖 macOS Canvas 才成立。

## macOS

建议步骤与 Windows 基本一致：

1. 运行 `npm install`
2. 运行 `npm run openclaw:install`
3. 重启或刷新 OpenClaw Gateway / Control UI
4. 验证右侧栏与 `first-principle` agent 是否都已生效

Canvas 目前只作为增强项，不是主线依赖。

## 如何验证托管安装

至少验证以下几点：

- `openclaw agents list` 中出现 `first-principle`
- `openclaw plugins list` 中出现 `FirstClaw`
- `openclaw.json` 里存在 `gateway.controlUi.extraCss` / `extraJs`
- 新开 session 后，右侧栏能读取 `current_guidance.json`
- `write_guidance_state` 调用后，内容写入 `~/.openclaw/firstclaw/control-ui/assets/current_guidance.json`

## 如何卸载

- 运行 `npm run openclaw:uninstall`
- 卸载后复核 `openclaw agents list` 中不再有 `first-principle`
- 卸载后复核 `openclaw.json` 中不再有 `firstclaw` 插件配置和侧栏注入配置

## 故障排查

- 如果安装脚本超时，先检查 `~/.openclaw` 中的文件复制是否已经完成，再复核配置与 agent 状态
- 如果右侧栏不出现，先检查 `gateway.controlUi.extraCss` / `extraJs` 是否仍在 `openclaw.json`
- 如果 agent 没切过去，先检查 `openclaw agents list` 中 `first-principle` 是否已被设为默认
- 如果侧栏为空，先检查本轮 session 是否真的调用了 `write_guidance_state`
