<table>
  <tr>
    <td width="120">
      <img src="./assets/logo.png" alt="tatami-a11y logo — a smiling tatami mat tile" width="100" />
    </td>
    <td>
      <h1>tatami-a11y</h1>
    </td>
  </tr>
</table>

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 746 passing](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![Toolchain: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

与框架无关、无障碍优先的 UI 原语和组件，适用于原生 JavaScript。

**16 个组件、6 个共享原语、746 个单元测试、16 个带无障碍检查的浏览器级 Storybook 集成测试、零运行时依赖**，所有这些都实现了 WAI-ARIA 创作实践并验证了 WCAG 2.2 AA 合规性。

## 问题所在

每个无障碍交互式组件都需要相同、难以正确实现但又容易出错的基础设施：

-   **实时区域：** 向屏幕阅读器宣布内容而不抢夺焦点
-   **焦点恢复：** 当瞬态 UI 关闭时恢复焦点，即使触发元素已不存在
-   **焦点捕获：** 将键盘导航限制在模态框和对话框内
-   **减少动画：** 尊重系统偏好设置，无需在各处手动检查
-   **漫游 tabindex：** 用于列表、网格、树和选项卡列表的箭头键导航
-   **HMR 安全的单例：** 在热模块重载后仍然存活，不会重复 DOM 节点或泄露监听器

大多数项目为每个组件从头开始重建这些功能。“关闭时恢复焦点”的第十次重新实现正是有人忘记陈旧引用情况并发布了一个会悄悄地将键盘焦点留在 `<body>` 上的下拉菜单的地方。

tatami-a11y 将这些共享原语提取到一个经过测试的单一基础中，然后在它们之上构建完全无障碍的组件。库中的每个组件都依赖于相同的经过实战检验的原语，因此在一个组件中修复的错误也会在所有组件中得到修复。

![Diagram comparing reimplementing accessibility per component vs. building on shared tested primitives](./assets/shared_a11y_primitives_problem.png)

## 为什么叫“tatami”？

榻榻米（tatami）是日本传统的地板垫，它是一个标准化、可互换的模块，构成整个房间的基础。你不会注意到榻榻米，但所有稳定的东西都建立在它之上。这里的想法也一样：这些原语是基础，而组件是你实际居住的房间。

## 为什么与框架无关

Radix UI 和 React Aria 很好地解决了 React 的问题。Headless UI 涵盖了 Vue 和 React。如果你不在这些生态系统中，或者你正在维护一个原生 JS 代码库，那么就没有一个严肃的、积极维护的等效方案。tatami-a11y 的目标就是成为这样的解决方案：没有虚拟 DOM，没有框架运行时，无论你是从手动编写的组件、Vue composable、Svelte 的 `use:action` 还是普通的 `<script>` 标签调用它，它的工作方式都完全相同。

### 验证过的框架互操作性

通过在三个独立的 Vite 脚手架上进行自动化的 Playwright 测试，验证了与框架无关的主张，每个脚手架都像真实的消费者一样从已发布的 npm 包安装 `tatami-a11y`。在每个框架中测试了两个组件——Toast（附加到 `document.body`，位于任何框架管理的树之外）和 Dropdown（将行为附加到框架渲染的 DOM 节点）。同时测试了朴素的使用模式和符合框架习惯的手工封装模式，并通过强制宿主框架在库的 DOM 添加存在时重新渲染周围区域来进行压力测试。

| 框架     | Toast (朴素) | Toast (封装) | Dropdown (朴素) | Dropdown (手工封装) |
| -------- | ------------ | ------------ | --------------- | ------------------- |
| **React**| ✅ 通过      | ✅ 通过      | ✅ 通过         | ✅ 通过             |
| **Vue**  | ✅ 通过      | ✅ 通过      | ✅ 通过         | ✅ 通过             |
| **Svelte**| ✅ 通过      | ✅ 通过      | ✅ 通过         | ✅ 通过             |

所有 12 项测试都通过，Toast 无需任何粘合代码。Dropdown 在所有三个框架中都能朴素地工作，并且通过了手工编写的符合框架习惯的封装（React 中为 `useRef`+`useEffect`，Vue 中为 `ref`+`onMounted`/`onUnmounted`，Svelte 中为 `use:action`）。完整的发现和原始测试输出位于 [`framework-interop-check/`](./framework-interop-check/) 中。

**自己运行这些测试：** `framework-interop-check/react-app`、`framework-interop-check/vue-app` 和 `framework-interop-check/svelte-app` 中的每一个都是一个独立的、可安装的 Vite 应用程序。`cd` 进入其中任何一个，`pnpm install`，`pnpm dev`，然后打开打印的本地 URL，直接点击测试朴素模式和封装模式，而不是盲信上表。

> **关于 `tatami()` 的说明：** 上表反映了最初的三框架调查，该调查使用了手工编写的封装器。`tatami()` 适配器是后来开发的，并具有涵盖所有 16 个组件的专用单元测试（参见 `__tests__/tatami.test.ts`），包括方法转发、销毁幂等性和开发模式警告的测试。`tatami()` 适配器已通过这些单元测试验证，可与所有 16 个组件正常工作。完整的 Playwright 跨框架测试套件正在等待中，但适配器的正确性已通过单元测试套件确立。

### Astro Islands 演示 — 四个框架，一个页面

`framework-interop-check/` 回答了 tatami-a11y 是否能在每个框架中单独正常工作。`astro-demo/` 更进一步：它使用 Astro 的 Islands 架构在*同一个页面*上挂载了一个 React island、一个 Vue island、一个 Svelte island 和一个纯 JS 部分，然后检查共享原语，特别是实时区域公告器，是否确实在库的独立打包副本之间进行协调，而不是悄悄地复制到每个 island 的独立实例中。

**在线预览：** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**本地运行：** `cd astro-demo`，`pnpm install`，`pnpm dev`。

### `tatami()` — 生命周期工具

封装器测试暴露了一个重复的模式：每个框架都需要从任何命令式 DOM 库中获得相同的三个东西——DOM 准备好后初始化，将框架管理的元素的引用传递给它，并在这些元素离开时进行清理。这些样板代码在不同框架之间是相同的，只是语法不同。

`tatami()` 是一个单一的、与框架无关的工具，它处理所有 16 个组件的这种握手。它不是库的 React 版本，也不是 Vue 版本——一个函数，没有框架导入，可以在任何地方工作。

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — 在 useEffect 内部
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — 在 onMounted / onUnmounted 内部
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// Plain JS, 完全无框架
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — 需要客户端组件（文件顶部有 'use client'），
// 然后是与普通 React 相同的 useEffect 模式
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — 与 Vue 相同的 onMounted/onUnmounted 模式，
// 在通用渲染设置中为提高安全性，用 import.meta.client 进行守护
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()` 返回一个带 `destroy()` 方法的控制器，并转发实例化组件实际拥有的所有公共方法（通过反射在运行时获取——没有硬编码方法列表）。在开发模式下，在 `destroy()` 后调用转发方法，或者调用组件没有的方法，都会产生一个包含组件名称和方法名称的 `console.warn`。框架只需要知道两件事：DOM 准备好时调用 `tatami()`，清理时调用 `ctrl.destroy()`。其他一切都由组件本身处理。

`Toast` 被作为特殊情况处理：它使用仅静态 API（`Toast.show()`、`Toast.configure()` 等）而不是实例，`tatami()` 会自动检测到这一点并直接转发静态方法。

> **关于 Next.js 和 Nuxt 示例的说明：** 这些是每个框架的标准、当前、已文档化的生命周期模式，但与上面已验证表格中的 React、Vue 和 Svelte 不同，它们尚未经过相同的自动化跨框架测试（真实的脚手架应用程序、强制重新渲染、Playwright）。请将其视为正确的指导，但尚未像上面三个框架那样经过针对此库的独立验证。

### 开发模式警告

在开发模式下，当在 `destroy()` 之后调用转发方法或组件上不存在某个方法名称时，`tatami()` 会发出 `console.warn` 消息。这些警告由开发模式标志控制，该标志在调用时按以下优先级顺序解析：

1.  **手动覆盖** —— `setTatamiDebug(true)` 始终优先。这是无打包器的 `<script>` 标签用法的正确答案，因为无法进行自动检测。
2.  **`import.meta.env?.DEV`** —— 适用于基于 Vite 的消费者。
3.  **`process.env.NODE_ENV !== "production"`** —— 适用于 webpack/Node 兼容打包器的回退。
4.  **默认 `false`** —— 在未识别环境中默认静默。

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// 在开发过程中启用警告（<script> 标签用法所需）
setTatamiDebug(true);
```

## 快速开始

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// 屏幕阅读器公告：默认礼貌，紧急时强制
announce("Changes saved");
announce("Error: something went wrong", { urgent: true });

// 瞬态 UI 的焦点恢复（模态框、下拉菜单、对话框）
pushFocusStack(triggerElement);
// ... 打开你的模态框/下拉菜单 ...
popFocusStack(); // 焦点返回到触发元素，或最近的有效回退元素
```

## 已部署站点

-   **Storybook：** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh)，带有无障碍插件的交互式组件示例
-   **文档：** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh)，由 TypeDoc 生成的完整 API 文档
-   **演示：** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh)，包含所有组件的实时演示
-   **Astro Islands 演示：** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)，一个页面上有四个框架 Islands（React、Vue、Svelte、纯 JS），通过 `tatami()` 连接，演示了库的独立打包副本之间的共享原语协调

## 包含内容

### 框架适配器

| 适配器   | 描述                                                                                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tatami()` | 与框架无关的生命周期工具，用于实例化任何组件、转发公共方法并处理清理。可在 React `useEffect`、Vue/Nuxt `onMounted`/`onUnmounted`、Svelte `use:action` 或普通的 `<script>` 标签中使用。 |

### 共享原语

| 原语                        | 描述                                                                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `announce()`                | 通过 ARIA 实时区域进行屏幕阅读器公告。支持礼貌/强制路由、去重和正确的 `aria-atomic` 语义。                                                                                                    |
| `checkReducedMotion()` / `onReducedMotionChange()` | 系统级减少动画检测，带有变更监听器。每个组件都会自动尊重此设置。                                                                                                   |
| `pushFocusStack()` / `popFocusStack()`           | 焦点恢复，带有陈旧引用回退链。如果触发元素已消失，它会向上遍历到最近的可聚焦祖先元素。                                                                                     |
| `activateFocusTrap()` / `deactivateFocusTrap()`  | 模态焦点捕获，带有首/尾元素边界检测和正确的 Tab/Shift+Tab 循环。                                                                                                       |
| `createRovingTabindex()`    | 用于列表、网格、树和选项卡列表的箭头键导航。支持方向、列数、换行和自定义按键处理程序。                                                                                                       |
| `createSingleton()` / `registerCleanup()`        | HMR 安全的单例工厂。组件在热重载后仍然存活，不会泄露监听器或重复 DOM 节点。                                                                                              |

### 组件

| 组件               | ARIA 模式                           | 主要特性                                                  |
| ------------------ | ----------------------------------- | --------------------------------------------------------- |
| Accordion          | `aria-expanded` / `aria-controls`   | 箭头键导航、Home/End、实时区域公告                        |
| Carousel           | `region` / `group` / `aria-roledescription` | 自动播放、尊重减少动画、幻灯片公告                        |
| Combobox           | combobox + listbox                  | 输入筛选、箭头键导航、活动后代管理                        |
| CommandPalette     | combobox + dialog-modal             | Ctrl+K 全局热键、分组、焦点捕获、实时区域计数             |
| DatePicker         | dialog + grid                       | 完整的键盘导航、焦点捕获、月份导航                        |
| Dialog             | non-modal dialog                    | 无需捕获的焦点管理，用户可以按 Tab 键退出                 |
| Disclosure         | `aria-expanded` / `aria-controls`   | 具有正确语义的简单显示/隐藏                               |
| Dropdown           | menu + menuitem                     | 焦点捕获、箭头键导航、按 Esc 关闭                         |
| MenuButton         | `aria-haspopup="menu"`              | 菜单按钮模式、焦点管理                                    |
| Modal              | dialog-modal                        | 焦点捕获、背景遮罩、按 Esc 关闭、焦点恢复                 |
| MultiselectListbox | listbox (multi-select)              | Shift+点击范围选择、Ctrl+点击切换、预输入                 |
| ReorderableList    | list + `aria-grabbed`               | Ctrl+箭头重新排序、拖放、实时公告                         |
| Tabs               | tablist + tab + tabpanel            | 箭头键导航、Home/End、自动选项卡面板可见性                |
| Toast              | live region + `role="alert"`        | 自动关闭、Alt+T 跳转快捷键、堆栈管理                      |
| Tooltip            | `aria-describedby`                  | 悬停/焦点触发、按 Esc 关闭、尊重减少动画                  |
| TreeView           | tree + treeitem                     | 展开/折叠、箭头键导航、预输入、单选/多选                  |

## 合规性

-   **742 个单元测试**，分布在 24 个测试文件中（通过 vitest 的 jsdom），全部通过
-   **16 个 Storybook 集成测试**，每个组件都在真实的 Playwright 浏览器中渲染并验证了交互行为
-   **内置无障碍检查：** 每个 Storybook 故事都通过 `@storybook/addon-a11y` 使用 axe-core 自动审计，在测试 UI 中内联显示并在 CI 中阻止
-   **WCAG 2.2 AA：** 通过所有 Storybook 故事的自动化 axe-core 扫描，检测到零违规和零不完整（自动化扫描涵盖了 WCAG 标准中有意义的子集，而非完整规范，手动屏幕阅读器测试是在此之上的自然下一层）
-   **WAI-ARIA：** 每个组件都遵循相关的 APG 创作实践
-   **键盘导航：** 每个交互元素都可以通过键盘完全操作
-   **屏幕阅读器：** 每个状态更改都通过实时区域宣布

## 开发

```bash
pnpm install
pnpm run build              # 构建到 dist/ (ESM + CJS + 类型声明)
pnpm run dev                # 监听模式
pnpm run test               # 运行 742 个单元测试 (vitest, jsdom)
pnpm run test-storybook:run # 运行 16 个浏览器级集成测试 (vitest + Playwright)
pnpm run storybook          # 端口 6006 上的交互式组件浏览器
pnpm run lint               # 基于 Rust 的 linter (oxlint, 比 ESLint 快 50-100 倍)
pnpm run format             # 基于 Rust 的格式化工具 (oxfmt, 比 Prettier 快 35 倍)
pnpm run doc                # 构建 API 文档
```

### 开发工具链

| 工具            | 技术栈                             | 速度提升      |
| --------------- | ---------------------------------- | ------------- |
| **Oxlint**      | 基于 Rust 的 linter (与 ESLint 兼容) | 快 50–100 倍 |
| **Oxfmt**       | 基于 Rust 的格式化工具             | 快 35 倍      |
| **Vitest 4.1.10** | 单元 + Storybook 测试运行器        | 原生浏览器模式 |
| **Storybook 10.5.5** | 组件测试 + 无障碍插件              | 与 Vitest 集成 |
| **Playwright**  | 用于集成测试的浏览器自动化         | 生产级        |
| **Rolldown** _(可选)_ | 面向未来的打包器 (Vite 核心)       | 原生 Rust 性能 |

总计：**758 个自动化测试**（742 个单元测试 + 16 个 Storybook），CI 在标准硬件上运行少于 30 秒。

---

## 部署

```bash
pnpm run deploy:storybook   # 构建并将 Storybook 部署到 Surge
pnpm run deploy:docs        # 构建并将 API 文档部署到 Surge
pnpm run deploy:astro       # 构建并将 astro-demo/ 多框架演示部署到 Surge
```

部署上述任何站点都需要您自己的 [Surge](https://surge.sh) 账户和 `.env` 文件（复制 `.env.example` 并填写您自己的子域）。部署脚本有意地抛出明确错误，而不是静默回退到真实的子域，因此克隆此仓库并运行部署脚本绝不会意外部署到别人的站点，您将始终部署到您自己的站点。

## 浏览器支持

目标是现代浏览器 (ES2020)：Chrome 80+、Firefox 80+、Safari 14.1+、Edge 80+。需要 DOM API。

**在服务器端渲染环境中安全导入。** `src/components/` 和 `src/shared/` 中的每个 DOM 访问都位于函数或方法体内部——模块作用域内不读取 `document`、`window`、`navigator` 或任何其他仅限浏览器的全局变量，因此除了声明之外，导入时不会执行任何操作。通过构建包并在没有任何 DOM shim 的纯 Node 进程中导入每个入口点进行了验证。CJS（`.js` 文件——此包没有 `\"type\": \"module\"` 字段，因此根据 `exports` 映射，`.js` 是 `require` 构建，而 `.mjs` 是 `import` 构建）：

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

两者都成功，没有错误。ESM 构建，方式相同：

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

两者都成功，没有错误。README 中的代码示例使用 `import` 语法，因为这是消费者预期使用包的方式——`exports` 映射将这些 `import` 路由到 `.mjs` 构建，并将任何 `require()` 路由到 `.js` 构建。

导入是安全的，但*使用*组件仍然需要真实的 DOM。标准生命周期钩子模式适用，这与已经验证过的纯客户端 React、Vue 和 Svelte 集成完全相同：React/Next.js 为 `useEffect`，Vue/Nuxt 为 `onMounted`。

## 许可证

MIT，请参阅 LICENSE。
