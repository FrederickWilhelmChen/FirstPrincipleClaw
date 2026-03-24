# FirstPrincipleClaw 当前设计总览

## 这份文档的角色

这份文档只描述当前仍然有效的设计边界，不再重复历史上已经废弃的方案比较。

如果你只读一份概览文档，先读这里；如果要看更细的 OpenClaw 集成决策，再读：

- `docs/OPENCLAW_INTEGRATION_DECISIONS.md`
- `docs/OPENCLAW_MESSAGE_FLOW.md`

## 一句话定位

FirstPrincipleClaw 是 OpenClaw 的一个集成能力：它根据当前任务生成结构化第一性原理分析，并通过会话内轻提示加深查看面板的方式帮助用户削减复杂度。

## 保留的设计原则

- 主线必须是 OpenClaw 集成，而不是独立工具
- 不把核心体验绑定在 macOS Canvas 上
- Windows 不能是降级平台
- transcript 只负责提醒，deep view 才负责完整分析和操作
- FirstClaw 负责分析结果，OpenClaw 负责触发与会话承载

## 当前推荐架构

```text
OpenClaw session / hook / plugin
  -> 触发 FirstClaw 分析
  -> 写入 analysis.json / history.json
  -> 生成 prompt payload
  -> 通过 chat.inject 提示用户
  -> 用户打开本地 deep-view 面板
  -> 用户执行 accept / dismiss / copy 等动作
```

## 系统边界

### OpenClaw 负责

- 持有会话上下文
- 决定触发分析的时机
- 在 transcript 中显示轻提示
- 承接用户原本的主工作流

### FirstPrincipleClaw 负责

- 从上下文中提炼真实意图、假设、事实和最简方案
- 写入当前分析结果和历史记录
- 提供 prompt payload
- 提供 deep-view 页面与动作接口

## 当前仓库里真实存在的实现

### 已存在

- `scripts/update_analysis.py`
  负责写入分析结果、历史记录、prompt 元数据
- `server/server.py`
  提供当前分析、历史、status、prompt、action 接口
- `ui/`
  提供本地 deep-view 页面
- `tests/scripts/test_update_analysis.py`
  覆盖写入脚本
- `tests/server/test_server_api.py`
  覆盖服务端关键接口

### 尚不存在

- OpenClaw 运行时适配代码
- `chat.inject` 去重与注入逻辑
- 完整的前端动作闭环
- 正式的 OpenClaw 安装接入包

## 为什么保留“两层交互”

只做独立看板的问题是：

- 用户必须主动切出去看
- 无法自然地嵌入 OpenClaw 主工作流
- 容易沦为演示页而非日常工作界面

只做会话内大段分析的问题是：

- 打断主任务
- 信息噪音太高
- 没有承载完整历史和动作的空间

所以当前保留的方案是：

- 会话里只出现短提示
- 面板里承载完整分析和动作

## 当前不再采用的旧方向

以下方向已经不再作为当前基线：

- 把项目定义成纯独立看板产品
- 把项目定义成纯 Skill 输出、没有 deep-view
- 依赖 React、Flask、WebSocket 的较重实现
- 以“已全面完成集成”为前提的文档口径

## 下一步实现重点

下一阶段不该再写新的概念稿，而应继续补完主线缺口：

1. OpenClaw 侧 trigger / hook / plugin 适配
2. `chat.inject` 注入与去重
3. deep-view 动作按钮和状态反馈
4. 接入与安装文档
