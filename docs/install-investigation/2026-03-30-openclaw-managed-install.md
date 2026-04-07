# 2026-03-30 OpenClaw Managed Install Investigation

## Goal

从一个已经清空 FirstClaw 残留的 OpenClaw 环境出发，重新安装 FirstClaw。

本轮的硬约束是：

- 安装后 **不能再关联项目代码路径**
- `C:\Users\99786\.openclaw\openclaw.json` 中不能出现 `E:\code-workspace\...`
- OpenClaw 只能引用 `C:\Users\99786\.openclaw` 下的托管副本

## What Was Installed

本轮没有再创建独立 agent，也没有把 worktree / repo 路径写回 OpenClaw。

实际安装内容：

- 插件托管副本：
  - `C:\Users\99786\.openclaw\extensions\firstclaw`
- bootstrap 托管副本：
  - `C:\Users\99786\.openclaw\firstclaw\bootstrap\FIRSTCLAW_MEMORY.md`
- OpenClaw 配置引用：
  - `plugins.entries.firstclaw.enabled = true`
  - `hooks.internal.entries.bootstrap-extra-files.enabled = true`
  - `hooks.internal.entries.bootstrap-extra-files.paths[0] = "C:/Users/99786/.openclaw/firstclaw/bootstrap/FIRSTCLAW_MEMORY.md"`

## Source Used

仓库里当前并没有一个正式的 `plugins/firstclaw` 可分发目录。

因此这次安装实际使用的是上一轮清理前备份出来的插件副本：

- `E:\code-workspace\FirstClaw\docs\install-investigation\backups\20260330-011903\firstclaw-extension`

这是一个非常重要的现状结论：

- 当前项目还没有准备好真正的“安装包源目录”
- 现有仓库离正式 install script 还差一个明确的分发边界

## Managed Install Steps That Worked

### 1. Copy managed plugin files

把插件副本复制到 OpenClaw 托管扩展目录：

```powershell
New-Item -ItemType Directory -Force -Path 'C:\Users\99786\.openclaw\extensions\firstclaw'
Copy-Item '<plugin-source>\*' 'C:\Users\99786\.openclaw\extensions\firstclaw' -Recurse -Force
```

### 2. Copy managed bootstrap file

把 bootstrap 文件复制到托管目录：

```powershell
New-Item -ItemType Directory -Force -Path 'C:\Users\99786\.openclaw\firstclaw\bootstrap'
Copy-Item 'E:\code-workspace\FirstClaw\openclaw\bootstrap\FIRSTCLAW_MEMORY.md' `
  'C:\Users\99786\.openclaw\firstclaw\bootstrap\FIRSTCLAW_MEMORY.md' -Force
```

### 3. Enable plugin

```powershell
openclaw config set plugins.entries.firstclaw.enabled true --strict-json
```

### 4. Enable bootstrap-extra-files hook and point it to managed bootstrap file

```powershell
openclaw config set hooks.internal.entries.bootstrap-extra-files.enabled true --strict-json
openclaw config set hooks.internal.entries.bootstrap-extra-files.paths[0] `
  "C:/Users/99786/.openclaw/firstclaw/bootstrap/FIRSTCLAW_MEMORY.md"
```

## Verification

最终状态验证：

- `openclaw plugins list` 中出现：
  - `FirstClaw | firstclaw | loaded | global:firstclaw/index.ts`
- `openclaw config get hooks.internal.entries.bootstrap-extra-files` 返回：
  - `enabled: true`
  - `paths[0] = C:/Users/99786/.openclaw/firstclaw/bootstrap/FIRSTCLAW_MEMORY.md`
- `C:\Users\99786\.openclaw\openclaw.json` 中 **没有**：
  - `E:\code-workspace\...`
  - `worktrees\FirstClaw`
  - `sourcePath` 指向 FirstClaw repo
- 插件默认输出路径 smoke test：
  - 触发插件工具后，目标路径为 `C:\Users\99786\.openclaw\data\current_guidance.json`
  - 文件最终能被读取到

## Critical Findings

### 1. 当前项目没有正式可分发插件目录

这次安装只能依赖备份出来的插件副本，而不是仓库中的正式 `plugins/firstclaw` 目录。

这意味着：

- 现在还不能写出可信的一键安装器
- 必须先把插件源码恢复到仓库里的正式分发位置

### 2. 插件配置 schema 与代码声明不一致

插件代码 `index.ts` 声明了：

- `outputPath`
- `mirrorOutputPath`

但 `openclaw.plugin.json` 的 `configSchema` 实际是空的。

结果：

- `openclaw config set` 无法写入任何插件配置
- 尝试写入 `plugins.entries.firstclaw.config.*` 时会报：
  - `must NOT have additional properties`

这说明：

- OpenClaw 实际用于校验的是 `openclaw.plugin.json`
- `index.ts` 里的 schema 声明并没有生效

### 3. 这次托管安装之所以还能工作，是因为插件默认输出路径碰巧可用

`write_guidance_state_tool.ts` 默认输出路径为：

- 从插件目录相对回退三级，然后写到 `data/current_guidance.json`

当插件被放在：

- `C:\Users\99786\.openclaw\extensions\firstclaw\src`

时，默认路径会落到：

- `C:\Users\99786\.openclaw\data\current_guidance.json`

这次是成立的，但它其实是“目录结构偶然兼容”，不是可靠安装契约。

### 4. `config set` 在 Windows 上对 JSON/路径非常脆弱

踩到的具体失败：

- `openclaw config set firstclaw.outputPath ...`
  - 报 `Unrecognized key: "firstclaw"`
- `openclaw config set hooks.internal.entries.bootstrap-extra-files '{ enabled: true, paths: [...] }' --strict-json`
  - JSON5 / 路径 quoting 解析失败
- `openclaw config set plugins.allow '["firstclaw","feishu"]' --strict-json`
  - 也出现解析失败

结论：

- Windows 下不适合依赖复杂的 inline JSON 参数
- 后续安装器应尽量使用逐字段写入，或直接生成/补丁配置文件

### 5. `plugins.allow` 不是这次安装的好默认项

尝试把 `firstclaw` 加入 `plugins.allow` 后，OpenClaw 会把许多原本已加载的插件一起限制掉，副作用过大。

因此本轮最终没有保留 `plugins.allow`。

这也意味着当前托管安装会保留一条警告：

- `firstclaw: loaded without install/load-path provenance`

这是后续正式安装器要解决的问题之一。

### 6. 文件写入验证需要重试，不要只看一次 `Test-Path`

在 smoke test 里，插件执行先返回：

- `ok: true`
- `output_path: C:\Users\99786\.openclaw\data\current_guidance.json`

但紧接着第一次读文件时却提示不存在。

随后再次检查，文件已经存在且内容正确。

结论：

- Windows 上安装验证不能只做单次存在性判断
- 后续应加入短轮询重试

## Current Managed Install State

当前环境已经满足“托管安装、不引用项目路径”的要求：

- 插件：`C:\Users\99786\.openclaw\extensions\firstclaw`
- bootstrap：`C:\Users\99786\.openclaw\firstclaw\bootstrap\FIRSTCLAW_MEMORY.md`
- guidance 输出：`C:\Users\99786\.openclaw\data\current_guidance.json`
- 没有独立 `first-principle` agent
- 没有 repo / worktree 路径写入 OpenClaw config

## Conclusion For Next Step

要把这条路径升级成真正可执行的跨平台 install / uninstall 脚本，至少还需要补三件事：

1. 在仓库里恢复正式的插件分发目录，而不是依赖备份副本
2. 修正 `openclaw.plugin.json`，让插件配置 schema 与代码真实一致
3. 设计一个跨平台的托管目录布局，并把 Windows / Linux / macOS 的路径与 shell quoting 差异显式处理掉
