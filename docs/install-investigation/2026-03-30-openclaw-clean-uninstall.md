# 2026-03-30 OpenClaw Clean Uninstall Investigation

## Goal

在当前 Windows 主机上，把已经挂载到 `C:\Users\99786\.openclaw` 的 FirstClaw 清空，整理出一条真实可复现的卸载路径，并记录所有失败点与坑点，为后续 clean install / uninstall 脚本打基础。

## Safety Baseline

- 清理前先做备份：
  - `C:\Users\99786\.openclaw\openclaw.json`
  - `C:\Users\99786\.openclaw\extensions\firstclaw`
  - `C:\Users\99786\.openclaw\workspace-first-principle`
- 备份目录：
  - `E:\code-workspace\FirstClaw\docs\install-investigation\backups\20260330-011903`
- 未删除任何 FirstClaw 仓库源码。
- `E:\code-workspace\worktrees\FirstClaw\openclaw-runtime-integration` 仅从 OpenClaw 配置解绑，没有删除。

## Initial Residue Found

### Config residue

- `openclaw.json` 中存在：
  - `agents.list[].id = "first-principle"`
  - `agents.list[].workspace = "E:\code-workspace\worktrees\FirstClaw\openclaw-runtime-integration"`
  - `hooks.internal.load.extraDirs[] = "E:\code-workspace\worktrees\FirstClaw\openclaw-runtime-integration\hooks"`
  - `plugins.entries.firstclaw.enabled = true`
  - `plugins.installs.firstclaw.sourcePath = "E:\code-workspace\worktrees\FirstClaw\openclaw-runtime-integration\plugins\firstclaw"`

### Disk residue

- `C:\Users\99786\.openclaw\extensions\firstclaw`
- `C:\Users\99786\.openclaw\workspace-first-principle`
- `C:\Users\99786\.openclaw\agents\first-principle`
- `C:\Users\99786\.openclaw\plugin-failures\openclaw-plugin.failed-20260328`

## Actual Uninstall Path That Worked

### 1. Plugin config uninstall

先做 dry-run：

```powershell
openclaw plugins uninstall firstclaw --dry-run
```

再做真实卸载：

```powershell
"y" | openclaw plugins uninstall firstclaw
```

结果：

- 成功删除 `plugins.entries.firstclaw`
- 成功删除 `plugins.installs.firstclaw`
- **没有删除** `C:\Users\99786\.openclaw\extensions\firstclaw`

### 2. Agent config uninstall

```powershell
openclaw agents delete first-principle --force
```

结果：

- 成功删除 `agents.list[].id = "first-principle"`
- 输出里明确提示：
  - `Failed to move to Trash (manual delete): E:\code-workspace\worktrees\FirstClaw\openclaw-runtime-integration`
  - `Failed to move to Trash (manual delete): ~\.openclaw\agents\first-principle\agent`
  - `Failed to move to Trash (manual delete): ~\.openclaw\agents\first-principle\sessions`
- 也就是说它完成了“配置解绑”，但没有完成“磁盘清理”。

### 3. Hook config cleanup

当前 hooks 不是 tracked install，而是直接写入了 `extraDirs`，所以用 config unset：

```powershell
openclaw config unset hooks.internal.load.extraDirs
```

结果：

- `hooks.internal.load.extraDirs` 清空

### 4. Residual disk cleanup

PowerShell 直接删目录在当前环境里被策略阻止，改用：

```cmd
cmd /c rmdir /s /q "C:\Users\99786\.openclaw\extensions\firstclaw"
cmd /c rmdir /s /q "C:\Users\99786\.openclaw\workspace-first-principle"
cmd /c rmdir /s /q "C:\Users\99786\.openclaw\agents\first-principle"
```

结果：

- 三个残留目录最终都删除成功

## Failure Modes And Pitfalls

### 1. `openclaw --help` / `openclaw help ...` 会输出帮助但不及时退出

- 在自动化里会表现成“已经打印了正确帮助，但命令超时”
- 不能把“超时”直接判定为“命令不可用”

### 2. PowerShell quoting 很容易把 `rg` / 正则搜索打坏

- Windows 下不能把 Bash 风格命令直接搬过来
- 后续跨平台脚本需要分别处理 shell quoting

### 3. `openclaw plugins uninstall` 在非交互环境会卡在确认提示

- 直接运行会停在：
  - `Uninstall plugin "firstclaw"? [y/N]`
- 某些调用环境里即使没有真正卸载，也可能给出误导性的成功退出
- 需要显式喂入确认，或者寻找版本兼容的 non-interactive 参数

### 4. 当前版本不支持这里尝试的 `--yes`

- `openclaw plugins uninstall firstclaw --dry-run --yes`
- 会直接报：
  - `error: unknown option '--yes'`
- 说明自动化不能假设所有 OpenClaw 子命令都支持统一的 `--yes`

### 5. `plugins uninstall` 只删 config/install record，不保证删掉插件目录

- 这是本轮最重要的坑点之一
- 如果 `plugins.allow` 为空，残留目录仍会被自动发现并加载
- 会表现成：
  - 你以为已经卸载
  - `plugins list` 里 FirstClaw 仍然出现

### 6. `agents delete --force` 只保证解绑，不保证删干净磁盘目录

- 输出已经明确提示“Failed to move to Trash”
- 自动化必须把 agent 目录残留检查作为单独步骤

### 7. Windows 删除后的存在性检查可能出现短暂不一致

- 出现过 `Test-Path` 先显示存在，随后目录枚举已经不存在的现象
- 结论：
  - 删除后要做二次确认
  - 不要只依赖一次存在性检查

### 8. 环境里本身还有 `feishu` 重复插件警告

- 与 FirstClaw 无直接关系，但会污染所有 CLI 输出：
  - `plugins.entries.feishu: duplicate plugin id detected`
- 安装脚本后续需要避免把这类外部警告误判成 FirstClaw 安装失败

## Clean State Verification

最终验证结果：

- `openclaw.json` 中不再存在：
  - `plugins.entries.firstclaw`
  - `plugins.installs.firstclaw`
  - `agents.list[].id = first-principle`
  - `hooks.internal.load.extraDirs`
- 以下路径都不存在：
  - `C:\Users\99786\.openclaw\extensions\firstclaw`
  - `C:\Users\99786\.openclaw\workspace-first-principle`
  - `C:\Users\99786\.openclaw\agents\first-principle`
- `openclaw plugins list` 中已无 `FirstClaw`
- `openclaw agents list` 恢复为只有 `main`

## Current Conclusion

Windows 上可行的 clean uninstall 不是单一步骤，而是：

1. `plugins uninstall`
2. `agents delete --force`
3. `config unset hooks.internal.load.extraDirs`
4. 手工删除磁盘残留目录
5. 最终做二次验证

后续 clean install / uninstall 脚本必须显式覆盖这 5 段，而不是只包一条 OpenClaw 官方命令。
