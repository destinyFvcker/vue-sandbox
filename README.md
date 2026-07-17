# Schema DataTable 使用指南

这是一个基于 Nuxt 4、Vue 3、UiThing 和 DataTables 的示例项目。项目中的 `UiSchemaDatatable` 可以把 JSON Schema 编译成原生 DataTables 列配置，同时保留分页、排序、搜索、选择、导出和扩展插件等能力。

与直接编写 DataTables `columns` 相比，`UiSchemaDatatable` 主要解决以下问题：

- 根据 JSON Schema 自动生成列、表头和嵌套字段访问器。
- 通过 `columnPaths` 精确控制列的选择与顺序。
- 通过 `columnOverrides` 覆盖指定列的 DataTables 配置。
- 通过 Vue 命名插槽渲染按钮、徽章等交互式单元格内容。
- 同时支持本地数组数据和 DataTables Ajax／服务端分页模式。

## 环境要求

- Node.js 20 或更高版本
- pnpm

## 启动项目

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

浏览器访问 `http://localhost:3000`。首页提供所有 DataTable 示例的入口，`/schema-datatable` 页面展示 Schema 表格的综合用法。

构建和预览生产版本：

```bash
pnpm build
pnpm preview
```

## 快速开始

在 Nuxt 页面或组件中定义行类型、JSON Schema 和数据，然后直接使用自动导入的 `UiSchemaDatatable`：

```vue
<script setup lang="ts">
  import type { JsonSchema7 } from "@jsonforms/core";
  import type { Config } from "datatables.net";

  interface UserRow {
    id: number;
    profile: {
      name: string;
      email: string;
    };
    status: "active" | "disabled";
  }

  const schema: JsonSchema7 = {
    type: "object",
    properties: {
      id: { type: "integer", title: "ID" },
      profile: {
        type: "object",
        properties: {
          name: { type: "string", title: "姓名" },
          email: { type: "string", title: "邮箱" },
        },
      },
      status: { type: "string", title: "状态", enum: ["active", "disabled"] },
    },
  };

  const rows: UserRow[] = [
    {
      id: 1,
      profile: { name: "张三", email: "zhangsan@example.com" },
      status: "active",
    },
  ];

  const options: Config = {
    pageLength: 10,
    responsive: true,
  };
</script>

<template>
  <UiSchemaDatatable :schema="schema" :data="rows" :options="options" />
</template>
```

上面的嵌套对象会被展开为 `id`、`profile.name`、`profile.email` 和 `status` 四列。

## Schema 转列规则

`schema` 可以是单行对象的 Schema，也可以是顶层同构数组的 Schema。组件会递归解析对象属性，并将标量叶子字段编译为 DataTables 列。

- 嵌套对象会被展开，列路径使用点号连接，例如 `profile.name`。
- 默认忽略数组字段；如需显示，可以在 `columnPaths` 中显式选中并自行设置渲染方式。
- 支持通过 `$ref` 引用根 Schema 中的 Draft-07 `definitions`。
- 支持从 `allOf`、`oneOf` 和 `anyOf` 中收集对象字段。
- 表头优先使用字段 Schema 的 `title`；没有 `title` 时，会把字段名转换为易读文本。
- 默认展示渲染会转义字符串中的 HTML，避免把数据内容直接当作 HTML 插入。

## 选择列及调整顺序

使用 `columnPaths` 指定需要展示的列。数组中的顺序就是最终列顺序：

```vue
<UiSchemaDatatable :schema="schema" :data="rows" :column-paths="['profile.name', 'status', 'id']" />
```

路径可以使用数据路径，例如 `profile.name`，也可以使用 Schema 路径，例如 `#/properties/profile/properties/name`。传入不存在的路径时，组件会抛出包含该路径的错误，便于尽早发现配置问题。

## 覆盖列配置

`columnOverrides` 使用数据路径或 Schema 路径作为键，值为对应列的 DataTables 配置。`data` 和 `name` 由 Schema 编译器管理，不能通过这里覆盖。

```vue
<script setup lang="ts">
  import type { SchemaColumnOverrides } from "~/lib/dt-schema-datatable";

  const columnOverrides: SchemaColumnOverrides = {
    id: {
      className: "dt-body-right",
      searchable: false,
    },
    "profile.email": {
      orderable: false,
      defaultContent: "-",
    },
    status: {
      responsivePriority: 1,
    },
  };
</script>

<template>
  <UiSchemaDatatable :schema="schema" :data="rows" :column-overrides="columnOverrides" />
</template>
```

需要保持原生字符串、数字或排序值时，也可以提供 DataTables `render`：

```ts
const columnOverrides: SchemaColumnOverrides = {
  id: {
    render: (value: unknown, type: string) =>
      type === "display" ? Number(value).toLocaleString("zh-CN") : value,
  },
};
```

## 使用 Vue 字段插槽

需要在单元格中使用 Vue 组件、响应式状态或事件处理时，可以声明与字段叶子名称相同的命名插槽。以下示例使用 `#status` 渲染状态徽章，并使用 `#actions` 渲染操作按钮：

```vue
<script setup lang="ts">
  import type { SchemaColumnOverrides, SchemaDatatableCellSlotProps } from "~/lib/dt-schema-datatable";

  interface UserRow {
    id: number;
    profile: { name: string; email: string };
    status: "active" | "disabled";
    actions?: string;
  }

  type ActionCell = SchemaDatatableCellSlotProps<UserRow>;

  const columnOverrides: SchemaColumnOverrides = {
    actions: {
      orderable: false,
      searchable: false,
      className: "no-export",
    },
  };

  function editUser(row: UserRow) {
    console.log("edit", row.id);
  }
</script>

<template>
  <UiSchemaDatatable :schema="schema" :data="rows" :column-overrides="columnOverrides">
    <template #status="{ fieldValue }">
      <span :class="fieldValue === 'active' ? 'text-green-600' : 'text-gray-500'">
        {{ fieldValue }}
      </span>
    </template>

    <template #actions="{ cellData }: ActionCell">
      <UiButton size="sm" @click.stop="editUser(cellData)">编辑</UiButton>
    </template>
  </UiSchemaDatatable>
</template>
```

`actions` 必须存在于 Schema 中并被选入当前列。它可以是只读的工具字段，例如：

```ts
const schema: JsonSchema7 = {
  type: "object",
  properties: {
    // 其他业务字段……
    actions: { type: "string", title: "操作", readOnly: true },
  },
};
```

字段插槽只替换 DataTables 的 `display` 渲染通道。通过 `columnOverrides.render` 提供的搜索、排序和筛选值仍会被保留，因此自定义界面不会破坏 DataTables 的正交数据行为。

### 插槽参数

| 参数          | 类型          | 说明                                              |
| ------------- | ------------- | ------------------------------------------------- |
| `fieldValue`  | `unknown`     | 当前 Schema 字段解析后的值                        |
| `cellData`    | `T`           | 当前行的完整数据，兼容 `UiDatatable` 的插槽命名   |
| `rowData`     | `T`           | 当前行的完整数据                                  |
| `columnPath`  | `string`      | 当前列的完整数据路径，例如 `profile.status`       |
| `columnEntry` | `SchemaEntry` | 当前列解析后的 Schema 元数据                      |
| `rowIndex`    | `number`      | DataTables 数据行索引，不是当前页面中的视觉序号   |
| `colIndex`    | `number`      | 从 0 开始的 DataTables 列索引                     |
| `type`        | `string`      | DataTables 正交渲染类型；字段插槽仅用于 `display` |

### 同名嵌套字段

插槽按路径的最后一段匹配。例如 `status` 和 `profile.status` 都会使用 `#status`。可以通过 `columnPath` 在同一个插槽中区分它们：

```vue
<template #status="{ columnPath, fieldValue }">
  <span :data-column="columnPath">{{ fieldValue }}</span>
</template>
```

如果表格启用了行选择，操作按钮通常应使用 `@click.stop`，避免点击按钮时同时触发行选择。

## 使用 DataTables 配置

`options` 会原样传递给 DataTables；Schema 编译得到的 `columns` 会覆盖 `options.columns`。因此列选择和列级配置应分别使用 `columnPaths` 与 `columnOverrides`。

```ts
import type { Config } from "datatables.net";

const options: Config = {
  pageLength: 20,
  searching: true,
  ordering: true,
  responsive: true,
  select: true,
  buttons: ["copy", "csv", "excel", "print", "colvis"],
};
```

可通过 `class` 设置 DataTables 的表格样式类：

```vue
<UiSchemaDatatable class="nowrap hover stripe row-border" :schema="schema" :data="rows" />
```

未传入时默认使用 `nowrap hover order-column row-border stripe display`。

## 获取 DataTables API

监听 `ready` 事件可以取得带行类型的 DataTables API：

```vue
<script setup lang="ts">
  import type { Api } from "datatables.net";

  const table = shallowRef<Api<UserRow>>();

  function onReady(api?: Api<Record<string, any>>) {
    table.value = api as unknown as Api<UserRow> | undefined;
  }

  function reload() {
    table.value?.ajax.reload(undefined, false);
  }
</script>

<template>
  <UiSchemaDatatable :schema="schema" :data="rows" @ready="onReady" />
</template>
```

组件还通过模板引用公开了以下属性：

- `dt`：DataTables API。
- `config`：合并后的 DataTables 配置。
- `columns`：Schema 编译后的列配置。
- `columnEntries`：与列一一对应的 Schema 元数据。

## Ajax 与服务端分页

传入 `ajax` 时，其格式与 DataTables 的 Ajax 配置相同。服务端分页场景需要在 `options` 中启用 `serverSide`，并通过回调返回 `draw`、`recordsTotal`、`recordsFiltered` 和当前页 `data`：

```ts
import type { Config } from "datatables.net";

const options: Config = {
  serverSide: true,
  processing: true,
  pageLength: 20,
};

const ajax: Config["ajax"] = async (request, callback) => {
  const response = await $fetch("/api/users", {
    query: {
      draw: request.draw,
      start: request.start,
      length: request.length,
      search: request.search.value,
    },
  });

  callback(response);
};
```

```vue
<UiSchemaDatatable :schema="schema" :ajax="ajax" :options="options" @ready="onReady" />
```

在 Ajax 请求开始前，组件会自动清理上一批 Vue 单元格挂载点；新数据绘制后会重新创建对应插槽内容。

## 属性与事件一览

| 名称              | 类型                      | 默认值                                                | 说明                                                         |
| ----------------- | ------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| `schema`          | `JsonSchema7`             | 必填                                                  | Draft-07 行对象或顶层数组的 JSON Schema                      |
| `data`            | `readonly T[]`            | `[]`                                                  | 本地表格数据                                                 |
| `ajax`            | `Config["ajax"]`          | —                                                     | DataTables Ajax 数据源                                       |
| `options`         | `Config`                  | `{}`                                                  | DataTables 全局配置；其中 `columns` 会被 Schema 编译结果覆盖 |
| `class`           | `HTMLAttributes["class"]` | `nowrap hover order-column row-border stripe display` | 表格 CSS 类                                                  |
| `columnPaths`     | `readonly string[]`       | —                                                     | 要显示的列及顺序；默认显示全部标量叶子字段                   |
| `columnOverrides` | `SchemaColumnOverrides`   | `{}`                                                  | 按数据路径或 Schema 路径覆盖列配置                           |
| `ready`           | `(api?: Api<T>) => void`  | —                                                     | DataTables 初始化完成后触发                                  |

## 数据更新与重建行为

- `data` 更新时复用已编译的 Schema 列配置，并清理旧的 Vue 单元格挂载点。
- `schema`、`columnPaths`、`columnOverrides`、`options` 或 `ajax` 更新时，组件会重建 DataTable 实例。
- 组件卸载时会移除 DataTables 事件监听并清理所有字段插槽挂载点。

## 测试

运行全部 Vitest 测试：

```bash
pnpm test
```

按测试环境运行：

```bash
pnpm test:unit
pnpm test:nuxt
```

运行 Playwright 端到端测试：

```bash
pnpm test:e2e
```

使用交互式 Playwright UI：

```bash
pnpm test:e2e:ui
```

## 相关源码

- `app/components/Ui/SchemaDatatable.client.vue`：Schema DataTable 组件与 Vue 字段插槽挂载逻辑。
- `app/lib/dt-schema-datatable.ts`：Schema 到 DataTables 列配置的编译逻辑与公共类型。
- `app/lib/dt-schema-resolver.ts`：JSON Schema 展开、引用解析与字段路径处理。
- `app/components/DatatableExamples/`：分页、选择、固定列、排序、插槽等完整示例。
