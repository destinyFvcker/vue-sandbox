# JsonForms 核心概念

## 三大核心概念

JsonForms 由三部分驱动表单渲染：

| 概念                              | 类型                 | 作用                                   |
| --------------------------------- | -------------------- | -------------------------------------- |
| **Data**                          | 任意 JSON            | 表单的实际数据值                       |
| **Schema** (`JsonSchema7`)        | JSON Schema          | 描述数据的结构与类型约束               |
| **UI Schema** (`UISchemaElement`) | JsonForms 自定义格式 | 描述如何渲染（布局、字段顺序、标签等） |

---

## Renderer 注册机制

每个 Renderer 由两部分组成：

```ts
{
  renderer: MyComponent,   // Vue 组件
  tester: rankWith(10, isStringControl),  // 打分函数，分数最高者胜出
}
```

- **`rankWith(rank, tester)`** — 包装一个测试函数并赋予优先级（数字越大优先级越高）
- **内置 tester**：`isStringControl`、`isNumberControl`、`isIntegerControl`、`isLayout`、`or(...)` 等
- 分数为 `-1` 表示不匹配，框架会跳过该 Renderer

注册示例（本项目 `index.ts`）：

```ts
export const tanstackRenderers: JsonFormsRendererRegistryEntry[] = [
  { renderer: StringRenderer, tester: rankWith(10, isStringControl) },
  { renderer: NumberRenderer, tester: rankWith(10, or(isNumberControl, isIntegerControl)) },
  { renderer: LayoutCell, tester: rankWith(10, isLayout) },
];
```

---

## 编写一个 Renderer 组件

最简模板（参考本项目 `StringRenderer.vue`）：

```vue
<script setup lang="ts">
  import { type ControlElement } from "@jsonforms/core";
  import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";

  const props = defineProps({ ...rendererProps<ControlElement>() });
  const { control } = useJsonFormsControl(props);
</script>

<template>
  <input :value="control.data" @input="handleChange($event.target.value)" />
</template>
```

关键 composable：

| Composable                        | 用途                                    |
| --------------------------------- | --------------------------------------- |
| `useJsonFormsControl(props)`      | 普通控件（string、number、boolean 等）  |
| `useJsonFormsLayout(props)`       | 布局元素（VerticalLayout、Group 等）    |
| `useJsonFormsArrayControl(props)` | 数组控件                                |
| `useJsonFormsRenderer(props)`     | 底层，手动调度（见 `RenderDispatcher`） |

`control` 对象的常用字段：

```ts
control.data; // 当前字段值
control.schema; // 字段的 JsonSchema
control.uischema; // 字段的 UISchemaElement
control.path; // 数据路径，如 "address.city"
control.label; // 显示标签
control.errors; // 验证错误信息
control.enabled; // 是否可编辑
```

提交更改用 `handleChange(path, value)`：

```ts
const { control, handleChange } = useJsonFormsControl(props);
handleChange(control.value.path, newValue);
```

---

## UISchema 元素类型

```ts
// Control — 绑定到 schema 中的一个字段
{ type: "Control", scope: "#/properties/name", label: "姓名" }

// VerticalLayout / HorizontalLayout — 布局容器
{ type: "VerticalLayout", elements: [...] }

// Group — 带标题的分组
{ type: "Group", label: "基本信息", elements: [...] }

// Categorization — Tab 形式的多分类布局
{ type: "Categorization", elements: [{ type: "Category", label: "Tab1", elements: [...] }] }
```

`scope` 使用 JSON Pointer 语法（`#/properties/fieldName`）指向 schema 中的字段。

---

## JsonForms 内部状态（JsonFormsCore）

本项目的 `JsonCell.vue` 手动管理了 JsonForms 的内部状态，关键流程：

```
Actions.init(data, schema, uischema)
    ↓
middleware(core, action, coreReducer)   ← 可插入自定义中间件
    ↓
jsonforms = shallowReactive({ core, renderers, cells, ... })
    ↓
provide("jsonforms", jsonforms)         ← 注入到子组件
provide("dispatch", dispatch)
```

子组件（Renderer）通过 inject 获取上下文，`@jsonforms/vue` 的 composable 封装了这一过程。

---

## Generate 工具（自动推导）

当不提供 schema 或 uischema 时，可用 `Generate` 自动生成：

```ts
import { Generate } from "@jsonforms/core";

// 从数据推导 schema
const schema = Generate.jsonSchema({ name: "Alice", age: 30 });

// 从 schema 推导 uischema
const uischema = Generate.uiSchema(schema);
```

本项目 `JsonCell.vue` 中对两者均有 fallback 处理。

---

## 渲染调度流程（本项目）

```
JsonCell.vue          — 初始化 JsonForms 状态，provide 上下文
  └─ DispatchRenderer — @jsonforms/vue 内置，读取 provide 上下文并委托
       └─ RenderDispatcher.vue — 手动 maxBy(tester) 选出最高分 Renderer
            ├─ StringRenderer.vue
            ├─ NumberRenderer.vue
            ├─ LayoutCell.vue
            └─ FallbackRenderer.vue（无匹配时兜底）
```

---

## 常见 tester 速查

```ts
import {
  and,
  isArrayControl,
  isBooleanControl,
  isDateControl,
  isEnumControl,
  isIntegerControl,
  isLayout,
  isNumberControl,
  isObjectControl,
  isStringControl,
  not,
  or,
  scopeEndIs,
  scopeEndsWith,
} from "@jsonforms/core";

// 组合示例：匹配 status 字段的枚举控件
rankWith(15, and(isEnumControl, scopeEndIs("status")));
```
