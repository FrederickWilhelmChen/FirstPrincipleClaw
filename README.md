# FirstClaw

**把第一性原理分析嵌入 OpenClaw，在你工作的同时持续提醒复杂度、隐藏假设和最简方案。**

---

## 理念

大多数工程问题的复杂度不来自技术本身，而来自没有被识别的假设。

FirstClaw 不替你做决策，也不是另一个 Agent 编排系统。它做一件事：在你和 OpenClaw 协作的过程中，持续追问三个问题——

1. **你真正要解决的问题是什么？**
2. **当前复杂度来自哪些隐含假设？**
3. **现在最小可行的方案是什么？**

每次 Agent 响应前，FirstClaw 会强制完成一次第一性原理分析，并把结果写入侧边栏。你不需要主动查看，它就在那里。

---

## 它长什么样

OpenClaw 控制界面右侧会出现一个持久侧栏，显示：

- 当前任务的复杂度评分（0–100）
- 最小路径建议
- 复杂度驱动因素
- 隐藏假设
- 建议砍掉的内容

侧栏可以随时收起/展开，不干扰主工作流。

---

## 安装

**前置条件：** 已安装 OpenClaw，且 `openclaw` 命令可用。

```bash
# 克隆仓库
git clone https://github.com/FrederickWilhelmChen/FirstPrincipleClaw.git
cd FirstPrincipleClaw

# 安装依赖
npm install

# 执行安装
npm run openclaw:install
```

安装完成后，重启 OpenClaw gateway 使配置生效：

```bash
openclaw gateway start
```

打开 OpenClaw 控制界面，右侧侧栏即为 FirstClaw。

---

## 卸载

```bash
npm run openclaw:uninstall
```

执行后重启 OpenClaw gateway。所有配置、文件、agent 注册均会被清除。

---

## 工作原理

1. **插件注册**：安装时将 `write_guidance_state` 工具注入 OpenClaw
2. **Bootstrap 注入**：通过 OpenClaw hook 在每次会话启动时加载行为规则，强制 Agent 在响应前调用分析工具
3. **状态写入**：分析结果以 JSON 写入本地文件
4. **侧栏展示**：控制界面加载自定义 JS/CSS，轮询读取 JSON 并实时渲染

整个流程在本地完成，不依赖外部服务。

---

## License

MIT
