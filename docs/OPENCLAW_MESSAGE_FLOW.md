# FirstClaw x OpenClaw 消息流

## 目的

说明 FirstClaw 与 OpenClaw 之间最小可用消息流，明确从 bootstrap 到轻提示再到深查看页面的完整路径。

这份文档只描述跨平台主线方案，不涉及 macOS Canvas 增强层。

---

## 总体流程

```text
OpenClaw bootstrap
  -> 注入 FirstClaw 规则
  -> 会话开始 / 任务变化
  -> 触发 FirstClaw 分析
  -> 写入 analysis.json + prompt payload
  -> OpenClaw 读取 prompt payload
  -> chat.inject 发送轻提示
  -> 用户点击 deep_view_url
  -> 打开 FirstClaw 深查看页面
  -> 用户执行接受 / 忽略 / 复制方案
```

---

## 分阶段说明

### 1. Bootstrap 阶段

OpenClaw 在 bootstrap 阶段注入 FirstClaw 的规则文件。

目标：

- 明确 FirstClaw 的分析职责
- 让会话具备第一性原理分析约束
- 不要求用户手工重复输入规则

输入：

- `FIRSTCLAW_MEMORY.md` 或等价注入文件

输出：

- 当前会话具备 FirstClaw 分析上下文

### 2. Trigger 阶段

OpenClaw 在以下时机触发分析：

- 新会话首次开始
- 当前任务发生显著变化
- 用户显式要求“简化”或“第一性原理分析”

输入：

- 当前 session id
- 当前任务内容
- 必要上下文摘要

输出：

- 一次新的 FirstClaw 分析请求

### 3. Analysis 阶段

FirstClaw 负责把分析结果写成统一结构。

至少产出两类数据：

1. 完整分析数据
   用于深查看面板
2. 轻提示 payload
   用于 `chat.inject`

完整分析数据关注：

- intent
- assumptions
- facts
- reasoning
- solution
- history

轻提示 payload 关注：

- 当前复杂度
- 复杂度变化量
- 本次最重要的提醒原因
- 深查看入口

### 4. Inject 阶段

OpenClaw 根据通知规则决定是否向 transcript 注入轻提示。

注入内容应保持短小：

- 告诉用户有变化
- 告诉用户变化原因
- 给出查看入口

这一层的职责不是完整解释，而是驱动注意力转移。

### 5. Deep View 阶段

用户点击轻提示中的入口，打开 FirstClaw 深查看页。

深查看页优先级：

1. 当前任务真正意图
2. 为什么复杂
3. 可以砍掉什么
4. 最简方案
5. 操作按钮
6. 推导过程
7. 历史记录

### 6. Action 阶段

深查看页必须允许用户完成最小动作闭环：

- 接受建议
- 忽略本次
- 复制最简方案

这些动作的目的不是做复杂工作流，而是把“提示”变成“决策”。

---

## 状态流

跨平台主线体验统一使用以下状态：

- `waiting`
  已接入，但当前尚无可展示分析
- `updated`
  刚完成一次有效分析，可提示用户查看
- `failed`
  分析或写入失败，应停止提示并暴露状态
- `stale`
  数据过旧，不应重复提醒用户

状态约束：

- `failed` 不允许注入轻提示
- `stale` 不允许注入轻提示
- `updated` 才能触发正常提示

---

## 去重规则

为了避免 FirstClaw 变成噪音，注入必须去重。

至少执行以下去重规则：

1. 如果 `task`、`complexity`、`can_remove`、`top_reasons` 未变化，则不重复提示
2. 如果上一次注入后仍处于短时间窗口内，则不重复提示
3. 如果用户已手动忽略本次建议，则同一分析结果不再重复注入

---

## 设计意图

这个消息流的核心不是“让用户经常打开一个面板”，而是：

- 先在 OpenClaw 会话里低打扰提示
- 再在 FirstClaw 页面里承接深度理解和操作

因此它天然适合 Windows 和 macOS 统一交付，不依赖 Canvas。
