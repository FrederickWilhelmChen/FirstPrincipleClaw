# FirstPrincipleClaw

**把第一性原理分析嵌入 OpenClaw，持续提醒复杂度、假设和最简方案。**

## 项目主旨

FirstPrincipleClaw 不是另一个替你完成任务的 Agent，也不是一套多 Agent 编排系统。

它的核心角色是：

- 思维背景板
- 复杂度提醒器
- 最简方案提炼器

目标是在 OpenClaw 的主工作流里，让用户在做事的同时持续收到三个问题的反馈：

1. 你现在真正要解决的问题是什么？
2. 当前复杂度来自哪些隐含假设？
3. 现在最小可行的方案是什么？

## 当前项目边界

当前仓库的主线是 **FirstPrincipleClaw 集成到 OpenClaw**，而不是独立看板产品。

已经落地的部分：

- 分析结果写入脚本 `scripts/update_analysis.py`
- 本地深查看面板和 API `server/server.py`
- 当前分析、历史记录、动作日志的数据结构
- 面向 OpenClaw 集成的 prompt/status 接口
- 针对写入脚本和服务端接口的测试

还没有完整落地的部分：

- OpenClaw 侧的 hook / plugin 运行时适配层
- `chat.inject` 提示注入闭环
- 深查看页里的完整动作闭环 UI
- 安装与接入流程的最终定稿

这意味着：仓库已经有了一个可运行的本地原型，但“OpenClaw 内完整集成体验”还没有实现完成。

## 当前设计基线

项目当前保留的核心设计结论：

- OpenClaw 集成是主线，不降级为可选方向
- Windows 和 macOS 都必须有完整主线体验
- Canvas 只能是增强层，不能承载核心价值
- 主交互采用“两层结构”

两层结构分别是：

- 轻提示层：在 OpenClaw 会话流里用短消息提醒
- 深查看层：在独立页面里查看完整分析、历史和操作

## 文档导航

- `docs/OPENCLAW_INTEGRATION_DECISIONS.md`
  当前最重要的产品与交互决策基线
- `docs/OPENCLAW_MESSAGE_FLOW.md`
  从触发分析到深查看的消息流
- `docs/DESIGN.md`
  当前架构和系统边界总览
- `docs/IMPLEMENTATION_SUMMARY.md`
  仓库现状，哪些已实现，哪些仍未实现
- `docs/USAGE.md`
  当前原型的本地运行与验证方式
- `docs/DEVELOPMENT_SPEC.md`
  下一阶段应继续实现的 OpenClaw 主线范围

## 运行当前原型

```bash
python scripts/init.py
python scripts/update_analysis.py \
  --task "实现登录流程" \
  --complexity 78 \
  --compression 40 \
  --can-remove "OAuth,多租户" \
  --intent "尽快上线基础登录" \
  --assumptions "需要OAuth|需要多租户" \
  --facts "内部系统|单团队维护" \
  --reasoning "当前场景不需要先做OAuth" \
  --solution "用户名密码 + JWT" \
  --session-id oc_session_123 \
  --status updated \
  --delta 12 \
  --top-reasons "新增OAuth|引入多租户假设"

python server/server.py
```

然后打开 [http://127.0.0.1:5000](http://127.0.0.1:5000)。

## 历史文档说明

仓库中仍保留了一些早期方案文档，用于追溯讨论过程；它们已经不再代表当前项目基线。阅读和继续实现时，请优先以 `README.md` 和 `docs/` 下当前文档为准。

## License

MIT
