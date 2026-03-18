<template>
  <DataTable
    ref="table"
    :columns="columns"
    :ajax="ajax"
    :data="data"
    :class="props.class"
    :options="options"
  >
    <template v-for="(_, name) in $slots" #[name]="scope">
      <slot :name="name" v-bind="scope" />
    </template>
  </DataTable>
</template>

<script lang="ts">
  import DataTablesCore from "datatables.net";
  import DataTable from "datatables.net-vue3";
  import JSZip from "jszip";

  import "datatables.net-buttons-dt"; // 按钮插件核心 + DataTables 官方样式主题适配（copy/csv/excel/pdf/print 按钮的基础）
  import "datatables.net-buttons/js/buttons.colVis.mjs"; // 列显示/隐藏按钮（可动态勾选哪些列可见）
  import "datatables.net-buttons/js/buttons.html5.mjs"; // HTML5 导出按钮（CSV / Excel / PDF，依赖 JSZip 和 pdfmake）
  import "datatables.net-buttons/js/buttons.print.mjs"; // 打印按钮（生成适合打印的页面并调用浏览器打印）
  import "datatables.net-responsive-dt"; // 响应式插件（窗口变窄时自动折叠低优先级列，点击行可展开隐藏列）
  import "datatables.net-searchbuilder-dt"; // 高级搜索构建器（可视化组合多条件过滤，如 AND/OR 逻辑）
  import "datatables.net-select-dt"; // 行/列/单元格选中插件（支持单选、多选、框选）
  import "datatables.net-fixedcolumns-dt"; // 固定列插件（左右两侧列在横向滚动时保持固定不动）
  import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css"; // 固定列插件样式（处理固定列的阴影、层叠等视觉效果）
  import "datatables.net-fixedheader-dt"; // 固定表头插件（页面纵向滚动时表头始终悬浮在顶部）
  import "datatables.net-fixedheader-dt/css/fixedHeader.dataTables.css"; // 固定表头插件样式（处理悬浮表头的定位和层级）
  import "datatables.net-colreorder-dt"; // 列重排插件（拖拽表头可调整列的顺序）
  import "datatables.net-colreorder-dt/css/colReorder.dataTables.css"; // 列重排插件样式（拖拽时的高亮和占位视觉反馈）

  // Api - DataTables实例的类型，代表一个已初始化的DataTable对象。通过它可以调用.row()，.columns()，.draw()等API方法
  // Config - DataTables 初始化配置选项的类型，用于为配置对象提供类型约束（如 columns, data, paging, ordering 等选项）
  import type { Api, Config } from "datatables.net";
  import type { HTMLAttributes } from "vue";

  export type DataTablesNamedSlotProps<T> = {
    /** The data to show in the cell (from the `columns.data` configuration) */
    cellData: keyof T | null;
    /** The column index for the cell (0-based index) */
    colIndex: number;
    /** The data object for the whole row */
    rowData: T | Record<string, any>;
    /** Row index for the cell (data index, not the display index) */
    rowIndex: number;
    /** 正交数据类型，表示当前渲染场景：display（展示）/ sort（排序）/ filter（过滤） */
    type: string;
  };

  DataTablesCore.Buttons.jszip(JSZip);
</script>

<script lang="ts" setup generic="T extends Record<string, any>">
  DataTable.use(DataTablesCore);

  const table = shallowRef<{ dt: InstanceType<typeof DataTablesCore<T[]>> } | null>(null);

  const props = withDefaults(
    defineProps<{
      /**
       * The data to display in the table
       */
      data?: Config["data"];
      /**
       * The CSS class to apply to the table
       *
       * @default "nowrap hover order-column row-border stripe display"
       * @see https://datatables.net/manual/styling/classes
       */
      class?: HTMLAttributes["class"];
      /**
       * The columns to display in the table
       */
      columns?: Config["columns"];
      /**
       * Load data for the table's content from an Ajax source.
       *
       * @see https://datatables.net/manual/ajax#Ajax-configuration
       */
      ajax?: Config["ajax"];
      /**
       * Additional options for the DataTable
       *
       * @see https://datatables.net/manual/options
       */
      options?: Config;
    }>(),
    {
      data: () => [],
      class: "nowrap hover order-column row-border stripe display",
    }
  );

  const emits = defineEmits<{ ready: [Api<T[]> | undefined] }>();

  onMounted(() => {
    nextTick(() => {
      emits("ready", table.value?.dt);
    });
  });

  defineExpose({
    /**
     * The DataTable instance
     */
    table,
    /**
     * The DataTable instance's DataTables API
     */
    dt: computed(() => table.value?.dt),
  });
</script>

<style>
  /*
   * ============================================================
   * @reference "~/assets/css/tailwind.css"
   * ============================================================
   * Tailwind v4 专属指令。
   *
   * 作用：告诉编译器"这个 <style> 块里的 @apply 指令
   * 要去 ~/assets/css/tailwind.css 里找对应的工具类定义"。
   *
   * 为什么需要它？
   * 在 Vue SFC 的 <style> 块中，Tailwind 默认不知道去哪里
   * 找 @theme 变量和工具类。加上 @reference 后，编译器就能
   * 正确解析 @apply bg-primary、@apply text-sm 等写法，
   * 且不会把 tailwind.css 的全部内容内联进来（只引用，不复制）。
   *
   * 语法：@reference "<路径>" 必须写在 <style> 块最顶部。
   * ============================================================
   */
  @reference "~/assets/css/tailwind.css";

  /*
   * ============================================================
   * 第一部分：DataTables CSS 变量（主题令牌）
   * ============================================================
   * DataTables 内部源码通过这些 CSS 自定义属性（Custom Properties）
   * 来控制颜色，而不是直接写死颜色值。
   * 我们在这里重新定义它们，把 DataTables 的默认色板替换成
   * 与当前设计系统一致的颜色。
   *
   * 语法说明：
   *   --变量名: 值;          ← 定义 CSS 变量
   *   var(--变量名)          ← 使用 CSS 变量
   *   hsla(H, S%, L%, A)    ← HSL + Alpha 颜色函数
   *
   * 这里的值故意只存 "H, S%, L%" 三段（不含 hsla() 包装），
   * 目的是让使用处可以自由控制 alpha 透明度：
   *   color: hsla(var(--dt-foreground), 0.5);  ← 50% 透明
   *
   * :root 表示全局作用域（浅色模式默认值）。
   * ============================================================
   */
  :root {
    /* 选中行的背景色（紫色主色调，HSL 格式只存 H,S,L 三段） */
    --dt-row-selected: 262.1, 83.3%, 57.8%;
    /* 选中行的文字颜色（接近白色） */
    --dt-row-selected-text: 210, 20%, 98%;
    /* 选中行内链接的颜色（与选中背景色相同，保持一致性） */
    --dt-row-selected-link: 262.1, 83.3%, 57.8%;
    /* 斑马纹奇数行背景（浅色模式下为纯白，不做特殊区分） */
    --dt-row-stripe: 0, 0%, 100%;
    /* 鼠标悬停行背景（浅色模式下为白色，实际 hover 颜色由 @apply bg-muted 控制） */
    --dt-row-hover: 0, 0%, 100%;
    /* 当前排序列高亮背景色 */
    --dt-column-ordering: 0, 0%, 100%;
    /* 表格边框颜色（浅灰色） */
    --dt-border: 220, 13%, 91%;
    /* 前景色（文字/图标），非常深的蓝灰色，接近黑色 */
    --dt-foreground: 224, 71.4%, 4.1%;
  }

  /*
   * .dark 类由 Tailwind 的 darkMode: 'class' 策略注入到 <html> 上。
   * 当 <html class="dark"> 时，这里的变量会覆盖 :root 中的定义，
   * 实现深色模式的颜色切换。
   * 注意：值是 HSL 片段，不是完整颜色，配合 hsla(var(...), alpha) 使用。
   */
  .dark {
    /* 深色模式选中行：略微降低饱和度和亮度的紫色 */
    --dt-row-selected: 263.4, 70%, 50.4%;
    --dt-row-selected-text: 210, 20%, 98%;
    --dt-row-selected-link: 263.4, 70%, 50.4%;
    /* 深色模式斑马纹/hover/排序列：使用深色背景色 */
    --dt-row-stripe: 224, 71.4%, 4.1%;
    --dt-row-hover: 224, 71.4%, 4.1%;
    --dt-column-ordering: 224, 71.4%, 4.1%;
    /* 深色模式边框：深蓝灰色 */
    --dt-border: 215, 27.9%, 16.9%;
    --dt-foreground: 224, 71.4%, 4.1%;
  }

  /*
   * ============================================================
   * 第二部分：行展开控制列（dt-control）
   * ============================================================
   * DataTables 的"子行展开"功能会在每行最左侧渲染一个
   * td.dt-control 单元格，点击后展开/收起该行的详情子行。
   *
   * :before 伪元素：
   *   CSS 伪元素，在元素内容之前插入一段虚拟内容。
   *   必须配合 content 属性才能显示。
   *   这里用 Unicode 字符 ► / ▼ 作为展开/收起指示箭头。
   *
   * hsla(var(--dt-foreground), 0.5)：
   *   把 CSS 变量（只存了 H,S,L 三段）嵌入 hsla() 函数，
   *   第四个参数 0.5 表示 50% 透明度，让箭头颜色比正文更淡。
   *
   * tr.dt-hasChild：
   *   DataTables 在该行已展开子行时，给 tr 加上此 class，
   *   我们通过它切换箭头方向（► → ▼）。
   * ============================================================
   */
  table.dataTable td.dt-control {
    text-align: center;
    cursor: pointer; /* 鼠标变手型，提示可点击 */
  }
  /* 默认状态：右箭头，表示可展开 */
  table.dataTable td.dt-control:before {
    display: inline-block;
    color: hsla(var(--dt-foreground), 0.5); /* 前景色 50% 透明 */
    content: "►";
  }
  /* 已展开状态（tr 上有 .dt-hasChild）：箭头变为向下 */
  table.dataTable tr.dt-hasChild td.dt-control:before {
    content: "▼";
  }

  /*
   * ============================================================
   * 第三部分：排序图标容器 —— 可排序表头的基础定位
   * ============================================================
   * DataTables 在可排序的 <th>/<td> 上会添加以下 class：
   *
   * V1 API class 名（旧版）：
   *   .sorting            ← 可排序但当前未按此列排序
   *   .sorting_asc        ← 当前按此列升序排序
   *   .sorting_desc       ← 当前按此列降序排序
   *   .sorting_asc_disabled  ← 升序排序但已禁用（不可点）
   *   .sorting_desc_disabled ← 降序排序但已禁用
   *
   * V2 API class 名（新版，datatables.net >= 2.x）：
   *   .dt-orderable-asc   ← 可以按升序排序
   *   .dt-orderable-desc  ← 可以按降序排序
   *
   * 我们需要同时覆盖两套 class，因为不同版本的 DataTables
   * 或不同插件可能生成不同的 class 名。
   *
   * @apply relative cursor-pointer pr-7：
   *   ├─ relative  → position: relative，让 :before/:after
   *   │             伪元素可以用 absolute 定位相对于此单元格。
   *   ├─ cursor-pointer → cursor: pointer，手型鼠标。
   *   └─ pr-7      → padding-right: 1.75rem，为右侧排序图标腾出空间。
   *
   * > 选择符（子代选择符）：
   *   table.dataTable thead > tr > th
   *   ↑ 严格匹配直接子元素，不会意外匹配到嵌套表格的表头。
   * ============================================================
   */
  table.dataTable thead > tr > th.sorting,
  table.dataTable thead > tr > th.sorting_asc,
  table.dataTable thead > tr > th.sorting_desc,
  table.dataTable thead > tr > th.sorting_asc_disabled,
  table.dataTable thead > tr > th.sorting_desc_disabled,
  table.dataTable thead > tr > td.sorting,
  table.dataTable thead > tr > td.sorting_asc,
  table.dataTable thead > tr > td.sorting_desc,
  table.dataTable thead > tr > td.sorting_asc_disabled,
  table.dataTable thead > tr > td.sorting_desc_disabled,
  /* V2 */
  table.dataTable thead > tr > th.dt-orderable-asc,
  table.dataTable thead > tr > th.dt-orderable-desc,
  table.dataTable thead > tr > td.dt-orderable-asc,
  table.dataTable thead > tr > td.dt-orderable-desc {
    @apply relative cursor-pointer pr-7;
  }

  /*
   * 排序图标伪元素的公共基础样式
   * ─────────────────────────────
   * DataTables 使用 :before（上箭头）和 :after（下箭头）
   * 这两个伪元素来渲染排序图标，叠放在一起形成双向箭头。
   *
   * @apply absolute right-2.5 block text-xs leading-3 opacity-25：
   *   ├─ absolute    → 脱离文档流，相对父 th（position:relative）定位。
   *   ├─ right-2.5   → right: 0.625rem，紧贴表头右边缘。
   *   ├─ block       → display: block，独占一行以便精确控制位置。
   *   ├─ text-xs     → font-size: 0.75rem，图标尺寸小。
   *   ├─ leading-3   → line-height: 0.75rem，收紧行高。
   *   └─ opacity-25  → 默认 25% 透明度（未激活时图标较淡）。
   */
  table.dataTable thead > tr > th.sorting:before,
  table.dataTable thead > tr > th.sorting:after,
  table.dataTable thead > tr > th.sorting_asc:before,
  table.dataTable thead > tr > th.sorting_asc:after,
  table.dataTable thead > tr > th.sorting_desc:before,
  table.dataTable thead > tr > th.sorting_desc:after,
  table.dataTable thead > tr > th.sorting_asc_disabled:before,
  table.dataTable thead > tr > th.sorting_asc_disabled:after,
  table.dataTable thead > tr > th.sorting_desc_disabled:before,
  table.dataTable thead > tr > th.sorting_desc_disabled:after,
  table.dataTable thead > tr > td.sorting:before,
  table.dataTable thead > tr > td.sorting:after,
  table.dataTable thead > tr > td.sorting_asc:before,
  table.dataTable thead > tr > td.sorting_asc:after,
  table.dataTable thead > tr > td.sorting_desc:before,
  table.dataTable thead > tr > td.sorting_desc:after,
  table.dataTable thead > tr > td.sorting_asc_disabled:before,
  table.dataTable thead > tr > td.sorting_asc_disabled:after,
  table.dataTable thead > tr > td.sorting_desc_disabled:before,
  table.dataTable thead > tr > td.sorting_desc_disabled:after,
  /* V2 */
  table.dataTable thead > tr > th.dt-orderable-asc:before,
  table.dataTable thead > tr > th.dt-orderable-asc:after,
  table.dataTable thead > tr > th.dt-orderable-desc:before,
  table.dataTable thead > tr > th.dt-orderable-desc:after,
  table.dataTable thead > tr > td.dt-orderable-asc:before,
  table.dataTable thead > tr > td.dt-orderable-asc:after,
  table.dataTable thead > tr > td.dt-orderable-desc:before,
  table.dataTable thead > tr > td.dt-orderable-desc:after {
    @apply absolute right-2.5 block text-xs leading-3 opacity-25;
  }

  /*
   * :before 伪元素 → 上箭头（chevron-up 图标）
   * ─────────────────────────────────────────
   * 使用 SVG 图标作为背景图，替换 DataTables 默认的文字字符箭头。
   * 图标来自 Iconify API，通过 URL 动态获取 SVG。
   *
   * @apply 中的关键点：
   *   bottom-[43%]
   *     └─ Tailwind 任意值语法：bottom: 43%
   *        让上箭头定位在单元格高度 43% 处（偏下），
   *        与下箭头（top: 43%）形成上下对称。
   *
   *   size-[14px]
   *     └─ 同时设置 width: 14px 和 height: 14px（Tailwind v3.3+ 语法）。
   *
   *   shrink-0
   *     └─ flex-shrink: 0，在 flex 容器中不压缩。
   *
   *   bg-[url('...')]
   *     └─ Tailwind 任意值语法，设置 background-image。
   *        URL 中 lucide:chevron-up 是 Iconify 的图标 ID。
   *
   *   bg-contain bg-center bg-no-repeat
   *     └─ 确保 SVG 图标完整显示在 14×14 的区域内，不裁切不重复。
   *
   *   content-['']
   *     └─ Tailwind 任意值语法，等同于 content: ''。
   *        伪元素必须有 content 才会渲染，空字符串配合背景图使用。
   *
   *   dark:bg-[url('...?color=white')]!
   *     └─ dark: 变体：深色模式下切换为白色图标。
   *        末尾 ! 表示 !important，用于覆盖 DataTables 自带 CSS 的优先级。
   */
  table.dataTable thead > tr > th.sorting:before,
  table.dataTable thead > tr > th.sorting_asc:before,
  table.dataTable thead > tr > th.sorting_desc:before,
  table.dataTable thead > tr > th.sorting_asc_disabled:before,
  table.dataTable thead > tr > th.sorting_desc_disabled:before,
  table.dataTable thead > tr > td.sorting:before,
  table.dataTable thead > tr > td.sorting_asc:before,
  table.dataTable thead > tr > td.sorting_desc:before,
  table.dataTable thead > tr > td.sorting_asc_disabled:before,
  table.dataTable thead > tr > td.sorting_desc_disabled:before,
  /* V2 */
  table.dataTable thead > tr > th.dt-orderable-asc:before,
  table.dataTable thead > tr > th.dt-orderable-desc:before,
  table.dataTable thead > tr > td.dt-orderable-asc:before,
  table.dataTable thead > tr > td.dt-orderable-desc:before {
    @apply bottom-[43%] size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-up.svg')] bg-contain bg-center bg-no-repeat content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-up.svg?color=white')]!;
  }
  /*
   * 深色模式额外覆盖（.dark 嵌套选择器写法）
   * ─────────────────────────────────────────
   * 由于上面 dark: 变体末尾带了 !important，为保险起见
   * 在 .dark 父类下再次显式覆盖，防止某些构建工具无法
   * 正确解析 dark: 变体 + ! 的组合。
   * 两种写法（dark: 变体 vs .dark 父类嵌套）效果相同，
   * 这里是双重保障。
   */
  .dark {
    table.dataTable thead > tr > th.dt-orderable-asc:before,
    table.dataTable thead > tr > th.dt-orderable-desc:before,
    table.dataTable thead > tr > td.dt-orderable-asc:before,
    table.dataTable thead > tr > td.dt-orderable-desc:before {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-up.svg?color=white')];
    }
  }

  /*
   * :after 伪元素 → 下箭头（chevron-down 图标）
   * ─────────────────────────────────────────
   * 与 :before 镜像对称：
   *   top-[43%]  → 从顶部 43% 处向下，与 :before（bottom: 43%）形成双箭头。
   * 其余逻辑与 :before 完全相同。
   */
  table.dataTable thead > tr > th.sorting:after,
  table.dataTable thead > tr > th.sorting_asc:after,
  table.dataTable thead > tr > th.sorting_desc:after,
  table.dataTable thead > tr > th.sorting_asc_disabled:after,
  table.dataTable thead > tr > th.sorting_desc_disabled:after,
  table.dataTable thead > tr > td.sorting:after,
  table.dataTable thead > tr > td.sorting_asc:after,
  table.dataTable thead > tr > td.sorting_desc:after,
  table.dataTable thead > tr > td.sorting_asc_disabled:after,
  table.dataTable thead > tr > td.sorting_desc_disabled:after,
  /* V2 */
  table.dataTable thead > tr > th.dt-orderable-asc:after,
  table.dataTable thead > tr > th.dt-orderable-desc:after,
  table.dataTable thead > tr > td.dt-orderable-asc:after,
  table.dataTable thead > tr > td.dt-orderable-desc:after {
    @apply top-[43%] size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-down.svg')] bg-contain bg-center bg-no-repeat content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')]!;
  }
  .dark {
    table.dataTable thead > tr > th.dt-orderable-asc:after,
    table.dataTable thead > tr > th.dt-orderable-desc:after,
    table.dataTable thead > tr > td.dt-orderable-asc:after,
    table.dataTable thead > tr > td.dt-orderable-desc:after {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')];
    }
  }

  /*
   * 激活排序方向：当前生效的箭头提高不透明度
   * ─────────────────────────────────────────
   * 逻辑：
   *   升序（.sorting_asc / V2: .dt-ordering-asc）→ :before（上箭头）高亮
   *   降序（.sorting_desc / V2: .dt-ordering-desc）→ :after（下箭头）高亮
   *
   * @apply opacity-80：不透明度从默认的 25% 提升到 80%，视觉上"激活"。
   */
  table.dataTable thead > tr > th.sorting_asc:before,
  table.dataTable thead > tr > th.sorting_desc:after,
  table.dataTable thead > tr > td.sorting_asc:before,
  table.dataTable thead > tr > td.sorting_desc:after,
  /* V2 */
  table.dataTable thead > tr > th.dt-ordering-asc:before,
  table.dataTable thead > tr > th.dt-ordering-desc:after {
    @apply opacity-80;
  }

  /*
   * 禁用排序方向：隐藏另一侧箭头
   * ─────────────────────────────
   * 当 DataTables 确定某列只能单向排序（如只能升序）时，
   * 会添加 disabled class。我们把对应方向的箭头隐藏（hidden = display:none），
   * 使 UI 上只显示一个方向的箭头，避免视觉混乱。
   */
  table.dataTable thead > tr > th.sorting_desc_disabled:after,
  table.dataTable thead > tr > th.sorting_asc_disabled:before,
  table.dataTable thead > tr > td.sorting_desc_disabled:after,
  table.dataTable thead > tr > td.sorting_asc_disabled:before {
    @apply hidden;
  }

  /*
   * 点击排序表头时去除蓝色焦点轮廓
   * ─────────────────────────────────
   * 浏览器默认在 :active（鼠标按下）时给可聚焦元素显示 outline，
   * DataTables 的表头可点击，会触发此轮廓，视觉上不美观。
   * @apply outline-none → outline: none 消除它。
   */
  table.dataTable thead > tr > th:active,
  table.dataTable thead > tr > td:active {
    @apply outline-none;
  }

  /*
   * 固定表头（scrollBody）中隐藏排序图标
   * ─────────────────────────────────────
   * DataTables 启用纵向滚动（scrollY）时，会把 thead 复制一份
   * 放到 dataTables_scrollBody 容器里（作为占位用的"幽灵表头"），
   * 该表头只负责撑开列宽，不应显示排序图标（否则会显示两套箭头）。
   * @apply hidden → display: none 隐藏这些伪元素。
   */
  div.dataTables_scrollBody > table.dataTable > thead > tr > th:before,
  div.dataTables_scrollBody > table.dataTable > thead > tr > th:after,
  div.dataTables_scrollBody > table.dataTable > thead > tr > td:before,
  div.dataTables_scrollBody > table.dataTable > thead > tr > td:after {
    @apply hidden;
  }

  /*
   * ============================================================
   * 第四部分：加载遮罩与动画（Processing Overlay）
   * ============================================================
   * DataTables 在 AJAX 请求期间会显示一个"处理中"遮罩层。
   * V1 class：div.dataTables_processing
   * V2 class：div.dt-processing
   *
   * 外层容器（遮罩层）样式：
   *   bg-background/50   → 背景色取设计系统的 --background 变量，/50 表示 50% 透明度。
   *                        语法：bg-{color}/{opacity}，opacity 范围 0-100。
   *   absolute inset-0   → position: absolute; top/right/bottom/left: 0;
   *                        inset-0 是四个方向同时为 0 的简写，让遮罩铺满父容器。
   *   z-999              → z-index: 999，确保遮罩在表格内容之上。
   *   flex items-center justify-center → 水平+垂直居中子内容（加载动画）。
   *   backdrop-blur-sm   → backdrop-filter: blur(4px)，毛玻璃效果模糊背后内容。
   *   transition         → 添加过渡动画，遮罩出现/消失时有淡入淡出效果。
   *
   * 现代 CSS 嵌套语法（CSS Nesting）：
   *   这里使用的 > div:last-child { ... } 是原生 CSS 嵌套，
   *   无需预处理器（Sass/Less），现代浏览器原生支持。
   *   嵌套规则等效于：div.dataTables_processing > div:last-child { ... }
   * ============================================================
   */
  div.dataTables_processing,
  div.dt-processing {
    @apply bg-background/50 absolute inset-0 z-999 flex size-full items-center justify-center backdrop-blur-sm transition;

    /*
     * 加载动画容器：一个宽 80px、高 16px 的相对定位盒子，
     * 里面放置 4 个绝对定位的圆球，通过 @keyframes 动画
     * 模拟"三个点滚动"的加载效果。
     * mx-auto my-4 → 水平居中、上下有 1rem 间距。
     */
    > div:last-child {
      @apply relative mx-auto my-4 h-4 w-20;

      /*
       * 每个圆球的基础样式：
       *   bg-primary   → 使用设计系统主色（紫色）
       *   absolute top-0 → 绝对定位，顶部对齐
       *   h-3.5 w-3.5  → 14×14px 圆球
       *   rounded-full → border-radius: 9999px 变成正圆
       * animation-timing-function: cubic-bezier(0, 1, 1, 0)
       *   → 自定义缓动函数，产生弹性效果（先慢后快再慢）。
       *     cubic-bezier(x1,y1,x2,y2) 定义贝塞尔曲线的两个控制点。
       */
      > div {
        @apply bg-primary absolute top-0 h-3.5 w-3.5 rounded-full;
        animation-timing-function: cubic-bezier(0, 1, 1, 0);
      }

      /*
       * 四个圆球的动画分配（模拟"从左到右滚动"效果）：
       *
       * 动画名称说明：
       *   datatables-loader-1：从无到有缩放（scale 0 → 1），第一个球在原地出现
       *   datatables-loader-2：向右平移 24px，中间两个球向右移动
       *   datatables-loader-3：从有到无缩放（scale 1 → 0），最后一个球消失
       *
       * left 值说明（圆球直径 14px，间距约 10px）：
       *   球1: left:8px  → 最左侧起始位置
       *   球2: left:8px  → 与球1 重叠，通过动画错开
       *   球3: left:32px → 中间位置（8 + 14 + 10）
       *   球4: left:56px → 右侧位置（32 + 14 + 10）
       *
       * all 4 animations: 0.6s infinite → 每 0.6 秒循环一次
       */
      > div:nth-child(1) {
        left: 8px;
        animation: datatables-loader-1 0.6s infinite;
      }

      > div:nth-child(2) {
        left: 8px;
        animation: datatables-loader-2 0.6s infinite;
      }

      > div:nth-child(3) {
        left: 32px;
        animation: datatables-loader-2 0.6s infinite;
      }

      > div:nth-child(4) {
        left: 56px;
        animation: datatables-loader-3 0.6s infinite;
      }
    }
  }

  /*
   * @keyframes 关键帧动画定义
   * ─────────────────────────
   * @keyframes 语法：
   *   @keyframes 动画名 {
   *     from / 0%  { 起始状态 }
   *     to   / 100% { 结束状态 }
   *   }
   *
   * datatables-loader-1：球从 0 缩放到正常大小（"出生"效果）
   * datatables-loader-3：球从正常大小缩放到 0（"消失"效果）
   * datatables-loader-2：球水平移动 24px（"传递"效果）
   *
   * transform: scale(n) → 等比缩放
   * transform: translate(x, y) → 平移
   */
  @keyframes datatables-loader-1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes datatables-loader-3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes datatables-loader-2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes datatables-loader-3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes datatables-loader-2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
  /*
   * 固定表头容器（FixedHeader 插件）
   * ─────────────────────────────────
   * datatables.net-fixedheader 插件在页面滚动时会把 <thead> 从表格中
   * 脱离出来，克隆一份放到 .dtfh-floatingparent 容器中悬浮在顶部。
   * .dtfh-floatingparent-head 是表头悬浮容器。
   *
   * bg-background/90  → 背景色 90% 不透明，稍有透明让用户感知滚动了内容。
   * z-10              → z-index: 10，确保悬浮表头在普通内容之上。
   * backdrop-blur     → backdrop-filter: blur(8px)，毛玻璃模糊背后表格内容。
   *
   * 两个 class 连写（无空格）：
   *   .dtfh-floatingparent.dtfh-floatingparent-head
   *   ↑ 选中同时拥有这两个 class 的元素（AND 关系）。
   */
  .dtfh-floatingparent.dtfh-floatingparent-head {
    @apply bg-background/90 z-10 backdrop-blur;
  }

  /*
   * ============================================================
   * 第五部分：单元格文字对齐与换行工具类
   * ============================================================
   * DataTables 提供了一组工具 class，可在初始化时通过
   * columnDefs[].className 给列批量设置对齐和换行。
   * 这里只是将原始 CSS 属性原样实现，无需 @apply（不涉及主题色）。
   *
   * 三级作用域：
   *   dt-left/center/right/justify/nowrap   → 同时作用于 th 和 td（整列）
   *   dt-head-*                              → 仅表头（thead/tfoot）
   *   dt-body-*                              → 仅数据行（tbody）
   *
   * .dataTables_empty：无数据时 DataTables 渲染的"No data"提示单元格，
   * 也适用居中对齐。
   * ============================================================
   */
  /* 整列对齐（表头+数据行都生效） */
  table.dataTable.nowrap th,
  table.dataTable.nowrap td {
    white-space: nowrap; /* 禁止换行，内容超出时横向滚动 */
  }
  table.dataTable th.dt-left,
  table.dataTable td.dt-left {
    text-align: left;
  }
  table.dataTable th.dt-center,
  table.dataTable td.dt-center,
  table.dataTable td.dataTables_empty {
    /* 空数据提示也居中 */
    text-align: center;
  }
  table.dataTable th.dt-right,
  table.dataTable td.dt-right {
    text-align: right;
  }
  table.dataTable th.dt-justify,
  table.dataTable td.dt-justify {
    text-align: justify;
  }
  table.dataTable th.dt-nowrap,
  table.dataTable td.dt-nowrap {
    white-space: nowrap;
  }
  /* 表头/表尾默认左对齐（覆盖浏览器默认 center） */
  table.dataTable thead th,
  table.dataTable thead td,
  table.dataTable tfoot th,
  table.dataTable tfoot td {
    text-align: left;
  }
  /* 仅表头对齐工具类 */
  table.dataTable thead th.dt-head-left,
  table.dataTable thead td.dt-head-left,
  table.dataTable tfoot th.dt-head-left,
  table.dataTable tfoot td.dt-head-left {
    text-align: left;
  }
  table.dataTable thead th.dt-head-center,
  table.dataTable thead td.dt-head-center,
  table.dataTable tfoot th.dt-head-center,
  table.dataTable tfoot td.dt-head-center {
    text-align: center;
  }
  table.dataTable thead th.dt-head-right,
  table.dataTable thead td.dt-head-right,
  table.dataTable tfoot th.dt-head-right,
  table.dataTable tfoot td.dt-head-right {
    text-align: right;
  }
  table.dataTable thead th.dt-head-justify,
  table.dataTable thead td.dt-head-justify,
  table.dataTable tfoot th.dt-head-justify,
  table.dataTable tfoot td.dt-head-justify {
    text-align: justify;
  }
  table.dataTable thead th.dt-head-nowrap,
  table.dataTable thead td.dt-head-nowrap,
  table.dataTable tfoot th.dt-head-nowrap,
  table.dataTable tfoot td.dt-head-nowrap {
    white-space: nowrap;
  }
  /* 仅数据行对齐工具类 */
  table.dataTable tbody th.dt-body-left,
  table.dataTable tbody td.dt-body-left {
    text-align: left;
  }
  table.dataTable tbody th.dt-body-center,
  table.dataTable tbody td.dt-body-center {
    text-align: center;
  }
  table.dataTable tbody th.dt-body-right,
  table.dataTable tbody td.dt-body-right {
    text-align: right;
  }
  table.dataTable tbody th.dt-body-justify,
  table.dataTable tbody td.dt-body-justify {
    text-align: justify;
  }
  table.dataTable tbody th.dt-body-nowrap,
  table.dataTable tbody td.dt-body-nowrap {
    white-space: nowrap;
  }

  /*
   * ============================================================
   * 第六部分：表格主体视觉样式
   * ============================================================
   */

  /* 表格基础：全宽、自动列宽、合并边框（消除相邻单元格双边框） */
  /* Table Styles */
  table.dataTable {
    @apply w-full table-auto border-collapse;
    /*
     * table-auto → table-layout: auto，列宽由内容决定。
     * border-collapse → 相邻单元格共享边框，避免出现双线。
     */
  }

  /* Table header styles */
  /* 表头/表尾文字：次要前景色、左对齐、小字号、中等字重 */
  table.dataTable thead th,
  table.dataTable tfoot th {
    @apply text-muted-foreground text-left text-sm font-medium;
    /*
     * text-muted-foreground → 使用设计系统中的次要文字颜色（比正文颜色浅）。
     * font-medium → font-weight: 500，比正常稍粗但不及 semibold。
     */
  }

  /* 表头 <th>：有下边框，无上边框（表格顶部不需要上线），标准内边距 */
  table.dataTable > thead > tr > th {
    @apply border-t-0 border-b px-6 py-3;
  }
  /* 表头 <td>（允许在表头放普通单元格时）：同样加下边框 */
  table.dataTable > thead > tr > td {
    @apply border-b px-6 py-3 text-sm;
  }
  /* 点击排序时去除表头焦点轮廓 */
  table.dataTable > thead > tr > th:active,
  table.dataTable > thead > tr > td:active {
    @apply outline-none;
  }
  /* 表尾（tfoot）：有上边框，内边距相同 */
  table.dataTable > tfoot > tr > th,
  table.dataTable > tfoot > tr > td {
    @apply border-t px-6 py-3;
  }

  /* 数据行默认透明背景（具体背景色由 stripe/hover/selected 覆盖） */
  table.dataTable tbody tr {
    @apply bg-transparent;
  }
  /*
   * 选中行背景：> * 选中该行所有子单元格（th 和 td）
   * bg-primary/10 → 主色调 10% 透明度的背景，视觉上轻微高亮
   */
  table.dataTable tbody tr.selected > * {
    @apply bg-primary/10;
  }
  /* 选中行内链接颜色变为主色调 */
  table.dataTable tbody tr.selected a {
    @apply text-primary;
  }
  /* 数据行单元格标准内边距和字号 */
  table.dataTable tbody th,
  table.dataTable tbody td {
    @apply px-6 py-3 text-sm;
  }

  /*
   * 行边框模式（.row-border / .display）：
   * 每行之间显示上边框线，相邻行形成分隔线。
   * .display 是 DataTables 的"全功能"快捷 class，同时启用
   * stripe + hover + order-column + row-border。
   */
  table.dataTable.row-border > tbody > tr > th,
  table.dataTable.row-border > tbody > tr > td,
  table.dataTable.display > tbody > tr > th,
  table.dataTable.display > tbody > tr > td {
    @apply border-t; /* 每个单元格加上边框 */
  }
  /* 第一行不加上边框（避免与表头下边框重叠形成双线） */
  table.dataTable.row-border > tbody > tr:first-child > th,
  table.dataTable.row-border > tbody > tr:first-child > td,
  table.dataTable.display > tbody > tr:first-child > th,
  table.dataTable.display > tbody > tr:first-child > td {
    @apply border-t-0;
  }
  /*
   * 相邻两个选中行之间的分隔线颜色：
   * + 是相邻兄弟选择符（CSS Adjacent Sibling Combinator），
   * 选中紧跟在 .selected 后面的另一个 .selected 行。
   * border-t-primary/30 → 边框颜色为主色调 30% 透明度。
   */
  table.dataTable.row-border > tbody > tr.selected + tr.selected > td,
  table.dataTable.display > tbody > tr.selected + tr.selected > td {
    @apply border-t-primary/30;
  }

  /*
   * 单元格边框模式（.cell-border）：
   * 每个单元格都有四周边框（网格线效果）。
   * 通过组合上/右/左边框来拼出完整网格：
   *   每格：border-t border-r
   *   第一列额外加：border-l（左边框封口）
   *   第一行去掉：border-t-0（避免与表头重叠）
   */
  table.dataTable.cell-border > tbody > tr > th,
  table.dataTable.cell-border > tbody > tr > td {
    @apply border-t border-r;
  }
  table.dataTable.cell-border > tbody > tr > th:first-child,
  table.dataTable.cell-border > tbody > tr > td:first-child {
    @apply border-l;
  }
  table.dataTable.cell-border > tbody > tr:first-child > th,
  table.dataTable.cell-border > tbody > tr:first-child > td {
    @apply border-t-0;
  }

  /*
   * 斑马纹（.stripe）：奇数行（.odd）加淡色背景
   * bg-muted/50 → 次要背景色 50% 透明，视觉上轻微区分行。
   * 同时处理斑马纹行被选中时的覆盖逻辑：选中优先于斑马纹颜色。
   */
  table.dataTable.stripe > tbody > tr.odd > *,
  table.dataTable.display > tbody > tr.odd > * {
    @apply bg-muted/50;
  }
  table.dataTable.stripe > tbody > tr.odd.selected > *,
  table.dataTable.display > tbody > tr.odd.selected > * {
    @apply bg-primary/10; /* 选中时覆盖斑马纹颜色 */
  }

  /*
   * 悬停高亮（.hover）：鼠标悬停行加背景色
   * > * 选中行的所有单元格（确保固定列等也同步高亮）
   */
  table.dataTable.hover > tbody > tr:hover > *,
  table.dataTable.display > tbody > tr:hover > * {
    @apply bg-muted;
  }
  /* 悬停+选中时：保持选中色（! = !important，强制覆盖 hover 的 bg-muted） */
  table.dataTable.hover > tbody > tr.selected:hover > *,
  table.dataTable.display > tbody > tr.selected:hover > * {
    @apply bg-primary/10!;
  }

  /*
   * 排序列高亮（.order-column）：
   * DataTables 给当前排序列的单元格加 .sorting_1/2/3 class，
   * 数字代表排序优先级（多列排序时区分主次）。
   * bg-muted → 轻微高亮，让用户知道哪列正在排序。
   */
  table.dataTable.order-column > tbody tr > .sorting_1,
  table.dataTable.order-column > tbody tr > .sorting_2,
  table.dataTable.order-column > tbody tr > .sorting_3,
  table.dataTable.display > tbody tr > .sorting_1,
  table.dataTable.display > tbody tr > .sorting_2,
  table.dataTable.display > tbody tr > .sorting_3 {
    @apply bg-muted;
  }
  /* 排序列 + 选中行：选中色覆盖排序列高亮（! 强制优先级） */
  table.dataTable.order-column > tbody tr.selected > .sorting_1,
  table.dataTable.order-column > tbody tr.selected > .sorting_2,
  table.dataTable.order-column > tbody tr.selected > .sorting_3,
  table.dataTable.display > tbody tr.selected > .sorting_1,
  table.dataTable.display > tbody tr.selected > .sorting_2,
  table.dataTable.display > tbody tr.selected > .sorting_3 {
    @apply bg-primary/10!;
  }

  /*
   * 斑马纹 + 排序列的叠加效果：
   * 三个优先级（sorting_1/2/3）在奇数行（odd）显示不同深度的 muted 色：
   *   sorting_1（主排序列）→ bg-muted/50（最深）
   *   sorting_2（第二排序）→ bg-muted/30（中）
   *   sorting_3（第三排序）→ bg-muted/10（最浅）
   * 这样可以在视觉上区分排序优先级。
   */
  table.dataTable.display > tbody > tr.odd > .sorting_1,
  table.dataTable.order-column.stripe > tbody > tr.odd > .sorting_1 {
    @apply bg-muted/50;
  }
  table.dataTable.display > tbody > tr.odd > .sorting_2,
  table.dataTable.order-column.stripe > tbody > tr.odd > .sorting_2 {
    @apply bg-muted/30;
  }
  table.dataTable.display > tbody > tr.odd > .sorting_3,
  table.dataTable.order-column.stripe > tbody > tr.odd > .sorting_3 {
    @apply bg-muted/10;
  }
  /* 奇数行 + 选中 + 排序列：统一用选中色 */
  table.dataTable.display > tbody > tr.odd.selected > .sorting_1,
  table.dataTable.order-column.stripe > tbody > tr.odd.selected > .sorting_1 {
    @apply bg-muted/50;
  }
  table.dataTable.display > tbody > tr.odd.selected > .sorting_2,
  table.dataTable.order-column.stripe > tbody > tr.odd.selected > .sorting_2 {
    @apply bg-muted/30;
  }
  table.dataTable.display > tbody > tr.odd.selected > .sorting_3,
  table.dataTable.order-column.stripe > tbody > tr.odd.selected > .sorting_3 {
    @apply bg-muted/10;
  }
  /* 偶数行（even）+ 排序列：同样三级深度 */
  table.dataTable.display > tbody > tr.even > .sorting_1,
  table.dataTable.order-column.stripe > tbody > tr.even > .sorting_1 {
    @apply bg-muted/50;
  }
  table.dataTable.display > tbody > tr.even > .sorting_2,
  table.dataTable.order-column.stripe > tbody > tr.even > .sorting_2 {
    @apply bg-muted/30;
  }
  table.dataTable.display > tbody > tr.even > .sorting_3,
  table.dataTable.order-column.stripe > tbody > tr.even > .sorting_3 {
    @apply bg-muted/10;
  }
  /* 偶数行 + 选中 + 排序列：统一用选中色 */
  table.dataTable.display > tbody > tr.even.selected > .sorting_1,
  table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_1 {
    @apply bg-primary/10;
  }
  table.dataTable.display > tbody > tr.even.selected > .sorting_2,
  table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_2 {
    @apply bg-primary/10;
  }
  table.dataTable.display > tbody > tr.even.selected > .sorting_3,
  table.dataTable.order-column.stripe > tbody > tr.even.selected > .sorting_3 {
    @apply bg-primary/10;
  }
  /* 悬停行 + 排序列：悬停色覆盖排序列高亮 */
  table.dataTable.display tbody tr:hover > .sorting_1,
  table.dataTable.order-column.hover tbody tr:hover > .sorting_1 {
    @apply bg-muted;
  }
  table.dataTable.display tbody tr:hover > .sorting_2,
  table.dataTable.order-column.hover tbody tr:hover > .sorting_2 {
    @apply bg-muted;
  }
  table.dataTable.display tbody tr:hover > .sorting_3,
  table.dataTable.order-column.hover tbody tr:hover > .sorting_3 {
    @apply bg-muted;
  }
  /* 悬停 + 选中 + 排序列：选中色优先 */
  table.dataTable.display tbody tr:hover.selected > .sorting_1,
  table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_1 {
    @apply bg-primary/10;
  }
  table.dataTable.display tbody tr:hover.selected > .sorting_2,
  table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_2 {
    @apply bg-primary/10;
  }
  table.dataTable.display tbody tr:hover.selected > .sorting_3,
  table.dataTable.order-column.hover tbody tr:hover.selected > .sorting_3 {
    @apply bg-primary/10;
  }

  /* 无表尾（.no-footer）：去掉表格下边框（避免与容器边框重叠） */
  table.dataTable.no-footer {
    @apply border-b-0;
  }

  /*
   * 紧凑模式（.compact）：减少内边距，适合密集数据展示
   * px-4 py-2 → 比默认的 px-6 py-3 更小
   */
  table.dataTable.compact thead th,
  table.dataTable.compact thead td,
  table.dataTable.compact tfoot th,
  table.dataTable.compact tfoot td,
  table.dataTable.compact tbody th,
  table.dataTable.compact tbody td {
    @apply px-4 py-2;
  }

  /*
   * 所有单元格（th/td）的盒模型 + 上下边框基础设置：
   * box-content → box-sizing: content-box，padding 不计入宽度，
   *               DataTables 需要这个来准确计算列宽。
   * border-y    → 同时设置 border-top 和 border-bottom（border-color 继承主题）。
   */
  table.dataTable th,
  table.dataTable td {
    @apply box-content border-y;
  }

  /*
   * 最后一行去掉下边框：
   * border-b-0! → border-bottom: 0 !important
   * 末尾 ! = !important，确保覆盖 border-y 设置的下边框。
   * 防止最后一行与容器底边产生双线视觉。
   */
  table.dataTable tr:last-child td {
    @apply border-b-0!;
  }

  /*
   * ============================================================
   * 第七部分：工具栏区域（控件容器、按钮、搜索、分页、信息）
   * ============================================================
   */

  /*
   * Control feature layout（工具栏包裹容器）
   * ─────────────────────────────────────────
   * DataTables 把表格和所有控件包裹在 .dataTables_wrapper 中。
   * w-full      → 撑满父容器宽度。
   * overflow-x-auto → 内容超宽时横向滚动，防止布局溢出。
   */
  /* Control feature layout */
  .dataTables_wrapper {
    @apply w-full overflow-x-auto;
  }

  /*
   * 导出/操作按钮组（V2 API）
   * ─────────────────────────────────────────
   * .dt-buttons 是 datatables.net-buttons 插件渲染的按钮容器。
   * inline-flex flex-wrap → 按钮横向排列，超出宽度时自动换行。
   * items-center gap-2 → 垂直居中，按钮间距 0.5rem。
   *
   * 嵌套的 button 样式：
   * 这是一个完整的"幽灵按钮"样式，包含：
   *   bg-background                    → 默认白色/暗色背景
   *   hover:bg-accent                  → 悬停时切换为强调色背景
   *   hover:text-accent-foreground     → 悬停时文字颜色对应变化
   *   focus-visible:ring-3             → 键盘焦点时显示 3px 外发光环（无障碍）
   *   dark:bg-input/30                 → 深色模式下半透明输入框背景
   *   [&_svg]:size-4                   → 任意子代选择符语法：按钮内 SVG 图标统一 16px
   *     [&_svg] = & svg（但写成属性选择符形式以兼容 Tailwind 解析）
   *   shadow-xs                        → 超小阴影，增加按钮立体感
   *   transition-all                   → 所有属性变化时添加过渡动画
   *
   * V2 of datatables button styles.
   */
  .dt-buttons {
    @apply inline-flex flex-wrap items-center gap-2;
    button {
      @apply bg-background hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium whitespace-nowrap shadow-xs transition-all outline-none focus:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4;
    }
  }

  /*
   * 复制成功提示弹窗（.dt-button-info）
   * ─────────────────────────────────────
   * 点击"Copy"按钮后，DataTables 弹出一个全屏遮罩提示"已复制 N 行"。
   * fixed inset-0  → 固定定位，铺满整个视口（top/right/bottom/left: 0）。
   * z-50           → 高于普通内容层。
   * backdrop-blur  → 毛玻璃模糊背后页面内容。
   * flex flex-col items-center justify-center → 居中显示提示文字。
   *
   *  Copy modal
   */
  .dt-button-info {
    @apply bg-background/50 fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur;
  }

  /*
   * 每页显示条数选择器（V1）
   * ─────────────────────────────────────
   * DataTables V1 渲染为 <label>每页显示 <select> 条</label> 结构。
   * label：inline-flex + gap-2 让文字和 select 水平排列对齐。
   * select：
   *   w-[70px]  → 固定宽度，只需容纳"10/25/50/100"等数字。
   *   focus:border-primary / focus-visible:ring-2 → 聚焦状态的边框和焦点环。
   *   sm:text-sm → 响应式变体：≥640px 时字号变小。
   *
   * Select box at bottom showing number of records being displayed - v1 of datatables
   */
  .dataTables_wrapper .dataTables_length {
    label {
      @apply text-muted-foreground inline-flex items-center gap-2 text-sm font-normal;
      select {
        @apply bg-background focus:border-primary focus-visible:border-input focus-visible:ring-ring focus-visible:ring-offset-background h-9 w-[70px] cursor-pointer rounded-md border px-2 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:text-sm;
      }
    }
  }
  /*
   * 每页显示条数选择器（V2）
   * ─────────────────────────────────────
   * V2 API 使用独立的 .dt-length 容器，DOM 结构略有不同。
   * select 的样式更完整（包含 aria-invalid 无障碍状态、深色模式等），
   * 与设计系统的 Input 组件样式保持一致。
   *
   * selection:bg-primary → 文本被框选时的高亮颜色。
   * aria-invalid:border-destructive → 表单验证失败时边框变红（无障碍规范）。
   * transition-[color,box-shadow] → 只对颜色和阴影做过渡（性能优化，避免全属性过渡）。
   *
   * Select box at the bottom showing how many items are being display - v2
   */
  .dt-length {
    @apply inline-flex items-center gap-2;
    label {
      @apply text-muted-foreground text-sm font-normal;
    }
    select {
      @apply border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex h-9 w-[70px] min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm;
    }
  }

  /*
   * 行选择复选框（Select 插件）
   * ─────────────────────────────────────
   * datatables.net-select 插件启用时，会在每行最左侧渲染复选框。
   *
   * form-checkbox → @tailwindcss/forms 插件提供的基础复选框重置样式。
   * checked:bg-primary → 选中时背景变为主色调。
   * indeterminate:bg-primary/80 → 半选（全选但部分被取消选中）时的背景色。
   * focus:ring-offset-0 → 消除焦点环与复选框之间的空白间距。
   *
   * Checkbox styles - Used when select is enabled
   */
  .dt-select-checkbox {
    @apply form-checkbox border-border bg-background text-primary checked:bg-primary checked:text-primary indeterminate:bg-primary/80 hover:indeterminate:bg-primary focus:ring-ring/50 checked:focus:bg-primary dark:bg-input/30 dark:checked:bg-primary dark:indeterminate:bg-primary/80 size-4 cursor-pointer rounded focus:ring-offset-0 focus:outline-none;
  }

  /*
   * 全局搜索框（V1）
   * ─────────────────────────────────────
   * DataTables V1 的搜索框渲染结构：<label>Search: <input /></label>
   * label 包裹 input 使整个区域可点击聚焦。
   * w-full → 搜索框撑满父容器，适配不同布局宽度。
   *
   * Search box at the top styles - v1 of datatables
   */
  .dataTables_wrapper .dataTables_filter {
    label {
      @apply text-muted-foreground inline-flex w-full cursor-pointer items-center gap-2 text-sm font-normal;
      input {
        @apply border-border bg-background focus:border-primary focus:ring-ring focus:ring-offset-background focus-visible:border-input h-9 w-full rounded-md border px-2 py-1 transition focus:ring-2 focus:ring-offset-2 focus:outline-none sm:text-sm;
      }
    }
  }

  /*
   * 全局搜索框（V2）
   * ─────────────────────────────────────
   * V2 使用 .dt-search 容器，label 和 input 是兄弟元素。
   * 样式与 V1 基本一致但更完整（同设计系统 Input 组件对齐）。
   * md:text-sm → 响应式变体：≥768px 时字号缩小（移动端用更大字号以提升可用性）。
   *
   * Search box at the top styles -v2
   */
  .dt-search {
    @apply flex items-center gap-3;
    label {
      @apply text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-sm font-medium;
    }
    input {
      @apply border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm;
    }
  }

  /*
   * 信息文字（"显示第 1 至 10 条，共 100 条"）
   * ─────────────────────────────────────────
   * V1: .dataTables_info  V2: .dt-info（同时覆盖两个 class）
   * text-muted-foreground! → 次要文字颜色，末尾 ! = !important，
   *   覆盖可能存在的继承颜色（某些主题会给包装容器设置颜色）。
   *
   * Info text that shows `Showing X to XX of XXXX entries - v1
   */
  .dataTables_wrapper .dataTables_info,
  .dt-info {
    @apply text-muted-foreground! flex items-center gap-3 text-sm;
  }

  /*
   * 分页导航容器（V2）
   * ─────────────────────────────────────
   * V2 的分页按钮包裹在 .dt-paging nav 里。
   * flex items-center gap-1 → 按钮横向排列，间距 0.25rem（比 gap-2 更紧凑）。
   */
  .dt-paging nav {
    @apply flex items-center gap-1;
  }

  /*
   * 分页按钮（V1）
   * ─────────────────────────────────────
   * V1 API 的每个分页按钮 class 是 .paginate_button。
   * 样式设计为"幽灵按钮"（透明背景，hover 时加底色）：
   *   box-border    → box-sizing: border-box，padding 计入宽度。
   *   min-w-[36px]  → 按钮最小宽度保证点击区域够大（移动端可用性）。
   *   ml-1          → 按钮之间用 margin-left 间隔（V1 的方式，V2 用 gap）。
   *
   * Pagination button styles - v1 datatables
   */
  .dataTables_wrapper .dataTables_paginate {
    .paginate_button {
      @apply focus-visible:ring-ring focus-visible:ring-offset-background ml-1 box-border inline-flex h-9 min-w-[36px] cursor-pointer items-center justify-center rounded bg-transparent px-3 py-2 text-center text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2;
    }
  }
  /*
   * 分页按钮（V2）
   * ─────────────────────────────────────
   * V2 的分页按钮 class 是 .dt-paging-button，样式更现代化：
   *   border → 显示边框（区别于 V1 的无边框幽灵按钮）。
   *   h-8 min-w-8 → 略小于 V1（32px vs 36px），适配更紧凑的 V2 布局。
   *
   * CSS 嵌套中的 & 选择符：
   *   & 代表当前选择器自身（.dt-paging-button）。
   *   &.current → .dt-paging-button.current（当前页按钮）
   *   &:hover → .dt-paging-button:hover（悬停状态）
   *   &.disabled → .dt-paging-button.disabled（禁用的首页/上一页等）
   *   &.previous, &.next, &.first, &.last → 前后翻页按钮用 text-base 让箭头字符更大
   *
   * Pagination button - v2
   */
  .dt-paging-button {
    @apply bg-background hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 inline-flex h-8 min-w-8 items-center justify-center gap-2 rounded-md border px-3 text-sm whitespace-nowrap shadow-xs transition-all outline-none focus:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4;
    /* 当前激活的页码和悬停态：使用 muted 背景高亮 */
    &.current,
    &:hover {
      @apply bg-muted;
    }
    /* 禁用态（首页/上一页已在第一页时）：不可点击 + 半透明 */
    &.disabled,
    &.disabled:hover,
    &.disabled:active {
      @apply pointer-events-none opacity-50;
    }
    /* 前/后翻页和首/末页按钮：字体稍大让箭头符号显示更清晰 */
    &.previous,
    &.next,
    &.first,
    &.last {
      @apply text-base;
    }
  }
  /* V1 分页按钮状态：当前激活页（与 V2 保持视觉一致） */
  .dataTables_wrapper .dataTables_paginate .paginate_button.current,
  .dataTables_wrapper .dataTables_paginate .paginate_button.current:hover {
    @apply bg-muted;
  }
  /* V1 分页按钮禁用态 */
  .dataTables_wrapper .dataTables_paginate .paginate_button.disabled,
  .dataTables_wrapper .dataTables_paginate .paginate_button.disabled:hover,
  .dataTables_wrapper .dataTables_paginate .paginate_button.disabled:active {
    @apply pointer-events-none opacity-50;
  }
  /* V1 分页按钮悬停和点击态 */
  .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
    @apply bg-muted;
  }
  .dataTables_wrapper .dataTables_paginate .paginate_button:active {
    @apply bg-muted;
  }
  /*
   * 省略号（...）分隔符：
   * DataTables 在页码过多时会插入省略号节点。
   * inline-flex h-8 → 与分页按钮等高，视觉对齐。
   * items-start → 省略号偏上对齐（视觉上比居中更自然）。
   */
  .dataTables_wrapper .dataTables_paginate .ellipsis,
  .dt-paging .ellipsis {
    @apply inline-flex h-8 min-w-[32px] items-start justify-center text-sm;
  }

  /*
   * ============================================================
   * 第八部分：纵向滚动（scrollY）容器
   * ============================================================
   * DataTables 开启 scrollY 时，会把 table 拆分到多个 div 容器里：
   *   dataTables_scrollHead → 固定表头区域
   *   dataTables_scrollBody → 可滚动数据区域
   *   dataTables_scrollFoot → 固定表尾区域（可选）
   *
   * .dataTables_scroll：外层清除浮动（DataTables V1 使用 float 布局）
   * ============================================================
   */
  .dataTables_wrapper .dataTables_scroll {
    clear: both; /* 清除 V1 的浮动布局遗留影响 */
  }
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody {
    /* iOS Safari 的惯性滚动（momentum scrolling），触摸时滑动更流畅 */
    -webkit-overflow-scrolling: touch;
  }
  /* scrollBody 中的所有单元格垂直居中（防止内容高度不一致时错位） */
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody > table > thead > tr > th,
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody > table > thead > tr > td,
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody > table > tbody > tr > th,
  .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody > table > tbody > tr > td {
    vertical-align: middle;
  }
  /*
   * .dataTables_sizing 是 DataTables 为了准确测量列宽插入的隐藏 div，
   * 必须设置 height:0 + overflow:hidden 彻底隐藏它（不占空间、不显示）。
   * margin/padding 设为 0 !important 防止任何样式继承影响宽度计算。
   * 这里使用多行展开的长选择器写法（每个 > 单独一行），是 CSS 格式化规范。
   */
  .dataTables_wrapper
    .dataTables_scroll
    div.dataTables_scrollBody
    > table
    > thead
    > tr
    > th
    > div.dataTables_sizing,
  .dataTables_wrapper
    .dataTables_scroll
    div.dataTables_scrollBody
    > table
    > thead
    > tr
    > td
    > div.dataTables_sizing,
  .dataTables_wrapper
    .dataTables_scroll
    div.dataTables_scrollBody
    > table
    > tbody
    > tr
    > th
    > div.dataTables_sizing,
  .dataTables_wrapper
    .dataTables_scroll
    div.dataTables_scrollBody
    > table
    > tbody
    > tr
    > td
    > div.dataTables_sizing {
    height: 0;
    overflow: hidden;
    margin: 0 !important;
    padding: 0 !important;
  }
  /* 无表尾模式下，scrollBody 底部加一条分隔线 */
  .dataTables_wrapper.no-footer .dataTables_scrollBody {
    @apply border-b;
  }
  /* 无表尾模式下，scrollHead 和 scrollBody 中的 table 无下边框（避免重叠） */
  .dataTables_wrapper.no-footer div.dataTables_scrollHead table.dataTable,
  .dataTables_wrapper.no-footer div.dataTables_scrollBody > table {
    border-bottom: none;
  }
  /*
   * dataTables_wrapper 的 :after 伪元素清除浮动（clearfix hack）。
   * DataTables V1 内部大量使用 float: left/right 布局，
   * 这个 clearfix 确保包裹容器能正确包裹浮动子元素。
   * visibility: hidden + height: 0 让它不占用视觉空间。
   */
  .dataTables_wrapper:after {
    visibility: hidden;
    display: block;
    content: "";
    clear: both;
    height: 0;
  }

  /*
   * ============================================================
   * 第九部分：Responsive 插件（响应式折叠列）
   * ============================================================
   * datatables.net-responsive 插件在窗口变窄时自动折叠低优先级列，
   * 并在每行左侧显示一个展开/收起控制图标（dtr-control）。
   *
   * 两种展开模式：
   *   dtr-inline：展开后在原行下方插入一个 tr.child 展示隐藏列数据。
   *   dtr-column：展开后数据显示在一个专用控制列的右侧弹出区域。
   *
   * DataTables 给表格添加的 class 说明：
   *   .collapsed    → 当前有列被折叠（窗口足够宽时不加此 class）
   *   .dtr-inline   → inline 模式（在行内展开）
   *   .dtr-column   → column 模式（用专用列展开）
   *   tr.parent     → 已展开的父行（展开状态）
   *   tr.dtr-expanded → 与 .parent 等效，V2 API 的 class 名
   *   td.child / tr.child → 展开后插入的子内容行/单元格
   *   td.dtr-control / td.control → 点击展开的控制单元格
   * ============================================================
   */

  /*
  responsive styles
   */
  /*
   * 子行（.child）和空数据行（.dataTables_empty）：
   * 这些不应响应点击展开，设 cursor: default 取消手型光标。
   * !important 确保覆盖 dtr-control 设置的 cursor: pointer。
   */
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.child,
  table.dataTable.dtr-inline.collapsed > tbody > tr > th.child,
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.dataTables_empty {
    cursor: default !important;
  }
  /* 子行和空数据行不渲染展开箭头伪元素 */
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.child:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr > th.child:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.dataTables_empty:before {
    display: none !important;
  }
  /* dtr-control 单元格（展开控制列）：手型光标提示可点击 */
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.dtr-control,
  table.dataTable.dtr-inline.collapsed > tbody > tr > th.dtr-control {
    cursor: pointer;
  }

  /*
   * dtr-inline 模式下控制列的 :before 图标（默认：右箭头，表示可展开）
   * 与排序图标原理相同：空 content + SVG 背景图实现。
   * pb-[3px] → 微调底部内边距，使图标视觉居中。
   */
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.dtr-control:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr > th.dtr-control:before {
    @apply mr-2 inline-flex size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-right.svg')] bg-contain bg-center bg-no-repeat pb-[3px] content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-right.svg?color=white')];
  }
  /* 深色模式额外覆盖（双重保障，同排序图标的处理方式） */
  .dark {
    table.dataTable.dtr-inline.collapsed > tbody > tr > td.dtr-control:before,
    table.dataTable.dtr-inline.collapsed > tbody > tr > th.dtr-control:before {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-right.svg?color=white')];
    }
  }
  /* arrow-right 模式（RTL/特殊布局）：用 Unicode 字符 ◄ 替代 SVG 图标 */
  table.dataTable.dtr-inline.collapsed > tbody > tr > td.dtr-control.arrow-right::before,
  table.dataTable.dtr-inline.collapsed > tbody > tr > th.dtr-control.arrow-right::before {
    content: "◄";
  }
  /*
   * dtr-inline 模式下已展开行（.parent / .dtr-expanded）：
   * 箭头切换为向下（chevron-down），表示可收起。
   */
  table.dataTable.dtr-inline.collapsed > tbody > tr.parent > td.dtr-control:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr.parent > th.dtr-control:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr.dtr-expanded > td.dtr-control:before,
  table.dataTable.dtr-inline.collapsed > tbody > tr.dtr-expanded > th.dtr-control:before {
    @apply mr-2 inline-block size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-down.svg')] bg-contain bg-center bg-no-repeat content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')];
  }
  .dark {
    table.dataTable.dtr-inline.collapsed > tbody > tr.parent > td.dtr-control:before,
    table.dataTable.dtr-inline.collapsed > tbody > tr.parent > th.dtr-control:before,
    table.dataTable.dtr-inline.collapsed > tbody > tr.dtr-expanded > td.dtr-control:before,
    table.dataTable.dtr-inline.collapsed > tbody > tr.dtr-expanded > th.dtr-control:before {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')];
    }
  }
  /* dtr-inline 紧凑模式：减少展开控制列的左内边距 */
  table.dataTable.dtr-inline.collapsed.compact > tbody > tr > td.dtr-control,
  table.dataTable.dtr-inline.collapsed.compact > tbody > tr > th.dtr-control {
    padding-left: 0.333em;
  }

  /*
   * dtr-column 模式（专用控制列）：与 dtr-inline 逻辑完全相同，
   * 只是 class 名不同（dtr-column 而非 dtr-inline.collapsed）。
   * 同时兼容旧版的 .control class（DataTables < 1.11）。
   */
  table.dataTable.dtr-column > tbody > tr > td.dtr-control,
  table.dataTable.dtr-column > tbody > tr > th.dtr-control,
  table.dataTable.dtr-column > tbody > tr > td.control,
  table.dataTable.dtr-column > tbody > tr > th.control {
    cursor: pointer;
  }
  /* 默认右箭头 */
  table.dataTable.dtr-column > tbody > tr > td.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr > th.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr > td.control:before,
  table.dataTable.dtr-column > tbody > tr > th.control:before {
    @apply mr-2 inline-flex size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-right.svg')] bg-contain bg-center bg-no-repeat pb-[3px] content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-right.svg?color=white')];
  }
  .dark {
    table.dataTable.dtr-column > tbody > tr > td.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr > th.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr > td.control:before,
    table.dataTable.dtr-column > tbody > tr > th.control:before {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-right.svg?color=white')];
    }
  }
  /* RTL 模式左箭头 */
  table.dataTable.dtr-column > tbody > tr > td.dtr-control.arrow-right::before,
  table.dataTable.dtr-column > tbody > tr > th.dtr-control.arrow-right::before,
  table.dataTable.dtr-column > tbody > tr > td.control.arrow-right::before,
  table.dataTable.dtr-column > tbody > tr > th.control.arrow-right::before {
    content: "◄";
  }
  /* 已展开行切换为下箭头（注意：dtr-column 模式没有 .collapsed 限定） */
  table.dataTable.dtr-column > tbody > tr.parent td.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr.parent th.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr.parent td.control:before,
  table.dataTable.dtr-column > tbody > tr.parent th.control:before,
  table.dataTable.dtr-column > tbody > tr.dtr-expanded td.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr.dtr-expanded th.dtr-control:before,
  table.dataTable.dtr-column > tbody > tr.dtr-expanded td.control:before,
  table.dataTable.dtr-column > tbody > tr.dtr-expanded th.control:before {
    @apply mr-2 inline-block size-[14px] shrink-0 bg-[url('https://api.iconify.design/lucide:chevron-down.svg')] bg-contain bg-center bg-no-repeat content-[''] dark:bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')];
  }
  .dark {
    table.dataTable.dtr-column > tbody > tr.parent td.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr.parent th.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr.parent td.control:before,
    table.dataTable.dtr-column > tbody > tr.parent th.control:before,
    table.dataTable.dtr-column > tbody > tr.dtr-expanded td.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr.dtr-expanded th.dtr-control:before,
    table.dataTable.dtr-column > tbody > tr.dtr-expanded td.control:before,
    table.dataTable.dtr-column > tbody > tr.dtr-expanded th.control:before {
      @apply bg-[url('https://api.iconify.design/lucide:chevron-down.svg?color=white')];
    }
  }

  /*
   * 展开内容（子行 .child）的样式
   * ─────────────────────────────
   * td.child → 展开内容的容器单元格，padding: 0 让内部 ul 自己控制间距。
   * tr.child:hover → 子行不应响应 hover 背景色（background: transparent !important）。
   * ul.dtr-details → 隐藏列数据的列表，去掉默认的 list 样式和内外边距。
   * li → 每条隐藏列数据：
   *   hover:bg-muted → 悬停高亮（方便阅读密集数据）
   *   flex items-center gap-6 → 标题和值水平排列，间距 1.5rem
   *   border-b p-3 px-7 → 下边框分隔，内边距 + 左侧缩进 1.75rem
   * span.dtr-title → 字段名称标签（加粗，最小宽度 80px 保证对齐）
   */
  table.dataTable > tbody td.child {
    @apply p-0;
  }
  table.dataTable > tbody > tr.child:hover,
  table.dataTable > tbody > tr.child:hover > td.child {
    background: transparent !important;
  }
  table.dataTable > tbody > tr.child ul.dtr-details {
    @apply m-0 block w-full list-none p-0;
  }
  table.dataTable > tbody > tr.child ul.dtr-details > li {
    @apply hover:bg-muted flex items-center gap-6 border-b p-3 px-7;
  }

  table.dataTable > tbody > tr.child ul.dtr-details > li:last-child {
    @apply border-b-0; /* 最后一条不显示下边框 */
  }
  table.dataTable > tbody > tr.child span.dtr-title {
    @apply inline-block min-w-[80px] font-bold;
  }
  /*
   * ============================================================
   * 第十部分：Responsive 模态弹窗（dtr-modal）
   * ============================================================
   * Responsive 插件有两种展开模式（inline/column）之外，还有第三种：
   * modal 模式 —— 点击行后用弹窗展示所有隐藏列的数据。
   *
   * DOM 结构：
   *   div.dtr-modal              → 全屏遮罩容器
   *     div.dtr-modal-background → 模糊背景层
   *     div.dtr-modal-display   → 弹窗主体（居中卡片）
   *       div.dtr-modal-content → 弹窗内容
   *         div.dtr-modal-close → 关闭按钮（右上角）
   * ============================================================
   */
  /* Responsive modal */
  div.dtr-modal {
    /*
     * 全屏遮罩：固定定位铺满视口，z-1000 确保在所有内容之上。
     * box-border → box-sizing: border-box，size-full（100%）时不溢出。
     */
    @apply fixed top-0 left-0 z-1000 box-border size-full;
  }
  div.dtr-modal div.dtr-modal-display {
    /*
     * 弹窗主体（居中卡片）：
     * absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
     *   → CSS 经典居中技巧：先定位到 50%/50%，再用负平移回到中心。
     * z-102       → 高于背景层（z-101）。
     * max-h-[80%] → 弹窗最大高度 80% 视口，防止在小屏幕溢出。
     * max-w-screen-sm → 最大宽度 640px（Tailwind 响应式断点值）。
     * overflow-y-auto → 内容过长时弹窗内部滚动，不撑破视口。
     * md:px-7 md:py-4 → 响应式内边距：≥768px 时左右更宽松。
     * lg:max-h-[90%] → ≥1024px 时弹窗可更高（桌面端空间足够）。
     */
    @apply bg-background absolute top-1/2 left-1/2 z-102 max-h-[80%] w-full max-w-screen-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-md border p-4 md:px-7 md:py-4 lg:max-h-[90%];
  }
  div.dtr-modal div.dtr-modal-content {
    /*
     * 弹窗内容区域：flex 竖排，文字 15px（介于 sm:14px 和 base:16px 之间的中间值）。
     * text-[15px] → 任意值语法，15px 在设计系统中无对应工具类，用 [] 直接写。
     *
     * 嵌套样式：
     * h2 → 弹窗标题（用 text-foreground 确保在背景色上可见）
     * table tr td → 数据表格中每个单元格，
     *   space-x-10 → 兄弟元素水平间距（此处用于 td 间距）
     *   first:font-semibold → :first-child 伪类变体，第一列（字段名）加粗
     *   nth-2:pl-2 → :nth-child(2) 自定义变体，第二列（值）加左内边距
     */
    @apply relative flex flex-col p-0 text-[15px];
    h2 {
      @apply text-foreground text-lg font-semibold;
    }
    table tr td {
      @apply space-x-10 pb-2 first:font-semibold nth-2:pl-2;
    }
  }
  div.dtr-modal div.dtr-modal-close {
    /*
     * 关闭按钮（右上角 ×）：
     * absolute top-2 right-2 → 相对弹窗主体绝对定位到右上角。
     * size-6 → 24×24px 的小正方形按钮。
     * bg-muted/10 hover:bg-muted → 默认几乎透明，hover 时出现背景色。
     * inline-flex items-center justify-center → 让内部 × 字符居中。
     */
    @apply bg-muted/10 hover:bg-muted absolute top-2 right-2 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-md;
  }
  div.dtr-modal div.dtr-modal-background {
    /*
     * 模糊背景层（遮罩）：
     * fixed inset-0 → 铺满整个视口（position: fixed，四边为 0）。
     * z-101 → 低于弹窗主体（z-102），但高于页面内容。
     * bg-background/20 → 背景色 20% 透明，轻微暗化背后页面。
     * backdrop-blur → 毛玻璃模糊效果，让背后内容模糊而不是完全遮挡。
     */
    @apply bg-background/20 fixed inset-0 z-101 backdrop-blur;
  }

  /*
   * ============================================================
   * 第十一部分：SearchBuilder 高级搜索构建器
   * ============================================================
   * datatables.net-searchbuilder 插件提供可视化的多条件搜索 UI，
   * 用户可以通过点击添加条件，选择字段/运算符/值，并用 AND/OR 组合。
   *
   * DOM 结构树：
   *   div.dt-button-collection      → 按钮触发的弹出集合容器
   *     div.dtsb-searchBuilder      → SearchBuilder 根容器
   *       div.dtsb-titleRow         → 标题栏（"Search Builder" 文字 + 操作按钮）
   *       div.dtsb-group            → 条件组（可嵌套，每组有独立 AND/OR 逻辑）
   *         div.dtsb-logicContainer → AND/OR 切换按钮组（竖排在左侧，rotate-90 旋转）
   *         div.dtsb-criteria       → 单条筛选条件（字段选择 + 运算符 + 值输入）
   *           select.dtsb-data      → 选择要筛选的字段
   *           select.dtsb-condition → 选择运算符（等于/包含/大于等...）
   *           .dtsb-inputCont       → 值输入区域（可能是 input 或 select）
   *           div.dtsb-buttonContainer → 操作按钮（删除/上移/下移条件）
   * ============================================================
   */

  /* Search Builder Styles */
  div.dt-button-collection {
    /*
     * SearchBuilder 面板的弹出容器：
     * z-2002! → z-index: 2002 !important，SearchBuilder 弹窗必须高于其他所有层。
     * overflow-visible! → 允许子内容（如 select 下拉）溢出容器边界显示。
     * 末尾 ! 均为 !important，覆盖按钮插件自带的 CSS。
     */
    @apply z-2002! overflow-visible!;
  }
  div.dt-button-collection div.dtsb-searchBuilder {
    /* SearchBuilder 内部内边距（!important 覆盖插件默认值） */
    @apply p-4!;
  }
  div.dt-button-collection.dtb-collection-closeable div.dtsb-titleRow {
    /* 面板有关闭按钮时，标题栏右侧预留空间（避免与关闭按钮重叠） */
    @apply pr-10;
  }
  .dtsb-greyscale {
    /*
     * SearchBuilder 的"灰色"通用样式（用于各种边框分隔）。
     * border! → 显示边框（!important 避免被其他规则覆盖）
     */
    @apply border!;
  }
  div.dtsb-logicContainer .dtsb-greyscale {
    /* 逻辑容器内的 greyscale 元素：去掉边框（逻辑按钮自身有样式，不需要额外边框） */
    @apply border-none!;
  }
  div.dtsb-searchBuilder {
    /*
     * SearchBuilder 根容器：
     * mb-4 → 与下方表格保持间距。
     * cursor-default → 容器本身不显示手型光标（只有按钮/输入框才显示）。
     * justify-evenly → 水平均匀分配空间（flex 容器）。
     */
    @apply mb-4 cursor-default justify-evenly text-left;
  }
  /* SearchBuilder 内所有按钮和 select 的基础字号 */
  div.dtsb-searchBuilder button.dtsb-button,
  div.dtsb-searchBuilder select {
    @apply text-sm;
  }
  div.dtsb-searchBuilder div.dtsb-titleRow {
    /* 标题栏：水平排列，两端对齐（标题在左，"添加条件"按钮在右） */
    @apply mb-3 flex items-center justify-between;
  }
  div.dtsb-searchBuilder div.dtsb-titleRow div.dtsb-title {
    /* 标题文字样式 */
    @apply inline-block text-sm font-normal;
  }
  div.dtsb-searchBuilder div.dtsb-titleRow div.dtsb-title:empty {
    /* 标题为空时改为 inline（占位但不占高度）*/
    @apply inline;
  }
  div.dtsb-searchBuilder div.dtsb-vertical .dtsb-value,
  div.dtsb-searchBuilder div.dtsb-vertical .dtsb-data,
  div.dtsb-searchBuilder div.dtsb-vertical .dtsb-condition {
    /* 垂直布局模式（窄屏下）：字段/运算符/值各占一行 */
    @apply block;
  }
  div.dtsb-searchBuilder div.dtsb-group {
    /*
     * 条件组容器：
     * relative → 让内部的 dtsb-logicContainer（绝对定位）相对于此定位。
     * clear-both → 清除内部浮动（dtsb-search 按钮 float: right）。
     * mb-4 → 组与组之间的间距。
     */
    @apply relative clear-both mb-4;
  }
  div.dtsb-searchBuilder div.dtsb-group button.dtsb-search {
    /* "搜索"按钮：浮动到右侧 */
    @apply float-right;
  }
  div.dtsb-searchBuilder div.dtsb-group button.dtsb-clearGroup {
    /* "清除组"按钮：极小的内边距，视觉上是一个紧凑的图标按钮 */
    @apply m-0.5 p-0 text-center;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-logicContainer {
    /*
     * AND/OR 逻辑切换容器：
     * absolute mt-3.5 mr-3.5 → 绝对定位在条件组左上角。
     * rotate-90 → 旋转 90°，让 AND/OR 按钮变成竖排显示（视觉设计）。
     */
    @apply absolute mt-3.5 mr-3.5 rotate-90;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria {
    /* 单条筛选条件：flex 横向排列，允许换行（窄屏时控件可换行） */
    margin-bottom: 0.8em;
    display: flex;
    justify-content: flex-start;
    flex-flow: row wrap;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-dropDown,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-input {
    /* 条件下拉和输入框的基础尺寸 */
    padding: 0.4em;
    margin-right: 0.8em;
    min-width: 5em;
    max-width: 20em;
    color: inherit; /* 继承父元素文字颜色，适配深色/浅色模式 */
  }
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    select.dtsb-dropDown
    option.dtsb-notItalic,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-input option.dtsb-notItalic {
    /* 普通选项（非斜体占位提示）恢复正常字体 */
    font-style: normal;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-italic {
    /* 斜体 select（通常是"请选择..."占位状态） */
    font-style: italic;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont {
    /* 值输入区域：flex: 1 让它占据剩余空间，nowrap 防止内部元素折行 */
    flex: 1;
    white-space: nowrap;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont span.dtsp-joiner {
    /* "to"/"and" 连接词（用于范围筛选，如 "大于 X 且 小于 Y"） */
    margin-right: 0.8em;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont input.dtsb-value {
    /* 范围筛选中的单个值输入框各占 33% 宽度 */
    width: 33%;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont select,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont input {
    /* 输入容器内的元素撑满容器高度，用 border-box 防止 padding 溢出 */
    height: 100%;
    box-sizing: border-box;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-buttonContainer {
    /* 操作按钮容器：推到最右侧（margin-left: auto） */
    margin-left: auto;
    display: inline-block;
  }
  /* 删除/上移/下移按钮之间的间距（最后一个按钮不加右间距） */
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-delete,
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-right,
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-left {
    margin-right: 0.8em;
  }
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-delete:last-child,
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-right:last-child,
  div.dtsb-searchBuilder
    div.dtsb-group
    div.dtsb-criteria
    div.dtsb-buttonContainer
    button.dtsb-left:last-child {
    margin-right: 0;
  }

  /*
   * 移动端响应式（宽度 ≤ 550px）
   * ─────────────────────────────
   * @media screen and (max-width: 550px) 是标准媒体查询语法。
   * 550px 是 SearchBuilder 专用的自定义断点（介于 sm:640px 之间），
   * 所以这里没有使用 Tailwind 的断点变体，而是直接写 @media。
   *
   * 在窄屏下，条件由横排改为竖排，操作按钮改为固定宽度绝对定位在右侧。
   * padding-right: calc(35px + 0.8em) → 为右侧的操作按钮区域留出空间，
   *   calc() 混合单位计算：35px 是按钮容器固定宽度，0.8em 是间距。
   */
  @media screen and (max-width: 550px) {
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria {
      display: flex;
      flex-flow: none;
      flex-direction: column; /* 竖排 */
      justify-content: flex-start;
      padding-right: calc(35px + 0.8em); /* 为右侧按钮留空 */
      margin-bottom: 0px;
    }
    /* 非首条/末条：加顶部间距区分 */
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:not(:first-child),
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:not(:nth-child(2)),
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:not(:last-child) {
      padding-top: 0.8em;
    }
    /* 首条/末条不加顶部间距 */
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:first-child,
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:nth-child(2),
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria:last-child {
      padding-top: 0em;
    }
    /* 窄屏下下拉/输入框撑满全宽 */
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-dropDown,
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-input {
      max-width: none;
      width: 100%;
      margin-bottom: 0.8em;
      margin-right: 0.8em;
    }
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-inputCont {
      margin-right: 0.8em;
    }
    /* 操作按钮区域：绝对定位固定在右侧，按钮竖向排列（wrap-reverse） */
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-buttonContainer {
      position: absolute;
      width: 35px;
      display: flex;
      flex-wrap: wrap-reverse;
      right: 0;
    }
    div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria div.dtsb-buttonContainer button {
      margin-right: 0px !important;
    }
  }

  /* SearchBuilder 内所有 button/select/input 的深色模式背景 */
  div.dtsb-searchBuilder button,
  div.dtsb-searchBuilder select.dtsb-dropDown,
  div.dtsb-searchBuilder input {
    @apply bg-background dark:bg-input/30 dark:hover:bg-input/50;
  }
  /* SearchBuilder 按钮统一使用与 .dt-buttons 相同的按钮样式 */
  div.dtsb-searchBuilder button.dtsb-button {
    @apply bg-background hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm whitespace-nowrap shadow-xs transition-all outline-none focus:outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4;
  }
  div.dtsb-searchBuilder button.dtsb-button:hover {
    @apply bg-accent text-accent-foreground dark:hover:bg-input/50 cursor-pointer;
  }
  div.dtsb-searchBuilder div.dtsb-logicContainer {
    /* AND/OR 切换容器：圆角 none（两端各一个按钮，构成"分段控件"样式） */
    @apply overflow-hidden rounded-none border;
  }
  div.dtsb-searchBuilder div.dtsb-logicContainer button {
    /* 逻辑按钮（AND/OR）：border-transparent 去掉各自的边框（由容器统一显示） */
    @apply rounded-md border-transparent;
  }
  div.dtsb-searchBuilder button.dtsb-clearGroup {
    /* "清除条件组"按钮：最小宽度 2em，无 padding（紧凑图标按钮） */
    min-width: 2em;
    padding: 0;
  }
  div.dtsb-searchBuilder button.dtsb-iptbtn {
    /* 输入触发按钮（点击后切换到输入框模式）：左对齐，最小宽度防止太窄 */
    min-width: 100px;
    text-align: left;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-logicContainer {
    /* 条件组内的逻辑容器：flex 横排，左对齐 */
    @apply flex flex-row content-start items-start justify-start rounded-md;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-logicContainer button.dtsb-logic {
    /*
     * AND/OR 文字按钮：
     * shrink-0 grow → 不收缩但可增长（平分容器空间）。
     * rounded-none border-0 → 去掉圆角和边框（由父容器统一控制）。
     * flex-basis: 3em → 初始宽度 3em，足够显示"AND"/"OR"文字。
     */
    @apply m-0 shrink-0 grow rounded-none border-0;
    flex-basis: 3em;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-logicContainer button.dtsb-clearGroup {
    /* 逻辑容器内的"×"清除按钮：无边框无圆角，宽度固定 2em */
    border: none;
    border-radius: 0px;
    width: 2em;
    margin: 0px;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-dropDown,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-input {
    /* 条件行的下拉和输入框：加圆角和边框（基础容器样式） */
    @apply rounded-md border;
  }
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-condition,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-data,
  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria select.dtsb-value {
    /*
     * 字段/运算符/值的 select：应用设计系统完整 Input 样式。
     * 与 .dt-length select、.dt-search input 的样式保持一致，
     * 确保整个 DataTables UI 的表单控件外观统一。
     */
    @apply border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 flex h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm;
  }

  div.dtsb-searchBuilder div.dtsb-group div.dtsb-criteria input.dtsb-value {
    /* 值输入框（文本输入，非 select）：同上，对齐设计系统 Input 样式 */
    @apply border-input selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 h-9 min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm;
  }

  /*
   * ============================================================
   * 第十二部分：ColVis（列显示/隐藏控制）
   * ============================================================
   * datatables.net-buttons 的 colVis 功能提供一个下拉面板，
   * 用户可以勾选/取消勾选列，动态控制哪些列可见。
   *
   * DOM 结构：
   *   .dt-button-background  → 点击按钮弹出面板时的全屏半透明遮罩
   *   .dt-button-down-arrow  → 按钮上的下拉箭头指示符（▼）
   *   .dt-button-collection  → 下拉面板的定位容器
   *     [role="menu"]        → 实际的下拉菜单面板
   *       button             → 每一列对应一个切换按钮
   *         .dt-button-active → 当前列可见时，按钮有此 class
   * ============================================================
   */

  /* Col vis styles */
  .dt-button-background {
    /*
     * 全屏遮罩：点击 ColVis 按钮时显示，点击遮罩关闭面板。
     * bg-background/50 → 50% 透明背景，比模态弹窗更轻量。
     * backdrop-blur-sm → 轻微毛玻璃（比其他弹窗的 backdrop-blur 更淡）。
     */
    @apply bg-background/50 fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm;
  }
  .dt-button-down-arrow {
    /*
     * 按钮上的 ▼ 箭头符号：
     * text-[10px] → 任意值，10px 比最小的 text-xs(12px) 更小，适合下拉指示符。
     */
    @apply text-[10px];
  }
  .dt-button-collection {
    /*
     * 面板定位容器：
     * relative → 让内部的 [role="menu"] 可以用 absolute 相对于此定位。
     */
    @apply relative;
    /*
     * [role="menu"] 是属性选择符（CSS Attribute Selector）语法：
     * 选中所有带有 role="menu" 属性的元素。
     * DataTables 给下拉面板添加了 ARIA role，这里利用它作为选择符。
     *
     * 使用属性选择符而非 class 的原因：
     * DataTables 的 DOM 渲染不稳定（class 可能版本间变化），
     * 但 ARIA role 是语义化的，相对稳定。
     *
     * 面板布局：
     * absolute top-7 -left-20 → 定位在触发按钮下方偏左（避免超出屏幕右边界）。
     * flex flex-col gap-1 → 竖排列，按钮间距 0.25rem。
     * min-w-[200px] → 最小宽度确保列名可完整显示。
     * shadow-lg → 较大阴影，增强面板的"浮起"感。
     * rounded-lg → 圆角 8px，比按钮本身（rounded-sm）更圆，区分层次。
     *
     * before: 伪元素（Tailwind 的 before: 变体）：
     * 在面板内容之前插入一段"Select columns"标题文字，
     * 不需要修改 JS 生成的 DOM，纯 CSS 实现。
     * before:content-['Select_columns'] → content: 'Select columns'
     *   下划线 _ 在 Tailwind 任意值中代表空格。
     * before:text-muted-foreground/70 → 标题文字用次要色 70% 透明（较淡的灰色）。
     * before:mx-2 before:mb-2 before:text-xs → 标题的内外边距和字号。
     */
    [role="menu"] {
      @apply bg-background before:text-muted-foreground/70 absolute top-7 -left-20 flex min-w-[200px] flex-col gap-1 rounded-lg border p-2 shadow-lg before:mx-2 before:mb-2 before:text-xs before:content-['Select_columns'];
      button {
        /*
         * 每列的切换按钮：
         * hover:bg-accent/30 → 悬停时 30% 透明的强调色背景（比正常 hover 更淡）。
         * h-8 → 32px 高，比标准按钮（h-9）略矮，适合列表项。
         * justify-between → 列名左对齐，✓ 勾右对齐（使用 after: 伪元素插入）。
         * border-none bg-transparent → 去掉边框和背景（列表项风格，非独立按钮风格）。
         * rounded-sm → 4px 圆角，比面板容器（rounded-lg）小，保持层次感。
         */
        @apply hover:bg-accent/30 h-8 justify-between rounded-sm border-none bg-transparent px-4 text-xs;
      }
      .dt-button.buttons-columnVisibility.dt-button-active {
        /*
         * 已激活（该列当前可见）的按钮：
         * bg-accent text-accent-foreground → 强调色背景+文字，视觉上"选中"状态。
         * dark:bg-accent/50 → 深色模式下降低背景透明度，避免过于突出。
         * after:content-['✓'] → 在按钮右侧插入 ✓ 勾号（纯 CSS，无需 JS 控制图标）。
         *   after:ml-auto → 勾号推到最右边（配合父元素 justify-between）。
         */
        @apply bg-accent text-accent-foreground dark:bg-accent/50 after:ml-auto after:content-['✓'];
      }
    }
  }
</style>
