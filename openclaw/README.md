# OpenClaw Integration Notes

## 目的

这个目录承载 FirstClaw 与 OpenClaw 之间的集成层资料。

它的职责不是存放 FirstClaw 的全部业务逻辑，而是聚焦以下几件事：

- OpenClaw bootstrap 注入内容
- Hook / Plugin 触发分析的接入层
- `chat.inject` 轻提示适配
- 与 FirstClaw 深查看页面的连接

---

## 目录职责

### `bootstrap/`

存放专门给 OpenClaw 注入的上下文文件。

目标：

- 尽量短
- 尽量明确
- 只保留运行时必须知道的规则

### `config/`

存放 OpenClaw 侧的配置模板或示例。

目标：

- 帮助本地快速接入
- 避免把用户机器上的真实配置写死进仓库

### `integration/`

存放 OpenClaw 运行时适配层。

目标：

- 监听触发时机
- 读取或构造 FirstClaw prompt payload
- 调用 OpenClaw Gateway 能力发送轻提示

---

## 系统边界

### OpenClaw 负责

- 当前 session 生命周期
- 当前上下文和触发时机
- Transcript 内的轻提示展示

### FirstClaw 负责

- 第一性原理分析结果
- 历史记录
- 深查看页面
- 接受 / 忽略 / 复制方案等动作

---

## 集成原则

1. 跨平台优先
   不把核心体验绑定到 macOS Canvas。

2. Transcript 只负责短提示
   不在 OpenClaw 会话里塞完整分析正文。

3. Deep View 承担复杂内容
   所有详细解释、历史、操作都放在 FirstClaw 页面。

4. 去重优先
   不因为每次分析都变化很小就刷屏。

5. Windows 不能降级
   Windows 用户必须拥有完整主线体验。

---

## 当前推荐路线

当前推荐的集成顺序：

1. `bootstrap-extra-files` 注入 FirstClaw 规则
2. Hook / Plugin 决定分析触发时机
3. 通过 `chat.inject` 发出轻提示
4. 点击后打开 FirstClaw 深查看页
5. 后续再考虑 macOS Canvas 增强层

这条路线的好处是：

- 与 OpenClaw 当前能力贴合
- Windows 和 macOS 都可用
- 风险最小
- 最适合 MVP
