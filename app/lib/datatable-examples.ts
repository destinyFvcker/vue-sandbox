export type DatatableExampleGroup = "基础能力" | "样式变体" | "交互与扩展";

export interface DatatableExampleDefinition {
  slug: string;
  title: string;
  description: string;
  group: DatatableExampleGroup;
  icon: string;
}

export const datatableExamples: DatatableExampleDefinition[] = [
  {
    slug: "dom",
    title: "Dom",
    description: "使用 dom 选项组合按钮、搜索、表格、信息栏与分页。",
    group: "基础能力",
    icon: "lucide:panels-top-left",
  },
  {
    slug: "custom-component",
    title: "Custom component",
    description: "通过原生 DataTables DOM renderer 在单元格内渲染交互按钮。",
    group: "基础能力",
    icon: "lucide:component",
  },
  {
    slug: "layout",
    title: "Layout",
    description: "使用 DataTables 2 layout API 组织 SearchBuilder、按钮与分页。",
    group: "基础能力",
    icon: "lucide:layout-dashboard",
  },
  {
    slug: "raw-performance",
    title: "Raw DataTable · 100k",
    description: "原始 UiDatatable 的 10 万行客户端 SearchBuilder 压测，每页最多 2,000 行。",
    group: "交互与扩展",
    icon: "lucide:gauge",
  },
  {
    slug: "schema-performance",
    title: "Schema DataTable · 100k",
    description: "Schema 编译原生列配置后的 10 万行对照压测，与 Raw 页面使用相同负载。",
    group: "交互与扩展",
    icon: "lucide:braces",
  },
  {
    slug: "simple",
    title: "Simple",
    description: "只有表格主体与合计栏的最小只读表格。",
    group: "样式变体",
    icon: "lucide:table-2",
  },
  {
    slug: "image",
    title: "Image",
    description: "根据生成的字符串字段组合标识图、主文本与辅助文本。",
    group: "样式变体",
    icon: "lucide:image",
  },
  {
    slug: "no-horizontal",
    title: "No Horizontal",
    description: "移除表格正文的横向分隔线。",
    group: "样式变体",
    icon: "lucide:rows-3",
  },
  {
    slug: "striped",
    title: "Striped",
    description: "交替行底色与圆角单元格样式。",
    group: "样式变体",
    icon: "lucide:align-justify",
  },
  {
    slug: "vertical-lines",
    title: "Vertical Lines",
    description: "使用 cell-border 强调纵向列分隔。",
    group: "样式变体",
    icon: "lucide:columns-3",
  },
  {
    slug: "dense",
    title: "Dense",
    description: "紧凑行高，适合字段较多的数据浏览。",
    group: "样式变体",
    icon: "lucide:rows-4",
  },
  {
    slug: "row-selection",
    title: "Row Selection",
    description: "复选框驱动的多行选择。",
    group: "交互与扩展",
    icon: "lucide:list-checks",
  },
  {
    slug: "card",
    title: "Card",
    description: "表格、选择列和合计栏组合成完整卡片。",
    group: "样式变体",
    icon: "lucide:panel-top",
  },
  {
    slug: "sticky-header",
    title: "Scroll with Sticky Header",
    description: "固定高度滚动区域与粘性表头。",
    group: "交互与扩展",
    icon: "lucide:panel-top-dashed",
  },
  {
    slug: "badge-icons",
    title: "Badge & Icons",
    description: "通过原生 DOM renderer 渲染枚举徽章、图标与组合内容。",
    group: "样式变体",
    icon: "lucide:badge-check",
  },
  {
    slug: "search-sort",
    title: "Search & Sort",
    description: "对 Rust 生成的嵌套标量执行外部响应式搜索、列排序与枚举渲染。",
    group: "交互与扩展",
    icon: "lucide:arrow-up-down",
  },
  {
    slug: "fixed-columns",
    title: "Fixed Columns",
    description: "横向与纵向滚动时固定选择列和首个数据列。",
    group: "交互与扩展",
    icon: "lucide:panel-left-dashed",
  },
  {
    slug: "column-reorder",
    title: "Column ReOrder",
    description: "拖放表头重新排列列，并可动态锁定拖放。",
    group: "交互与扩展",
    icon: "lucide:move-horizontal",
  },
  {
    slug: "pagination",
    title: "Pagination",
    description: "服务端分页协议、处理状态、导出按钮与自定义操作。",
    group: "交互与扩展",
    icon: "lucide:gallery-horizontal-end",
  },
];

export const datatableExampleGroups: DatatableExampleGroup[] = [
  "基础能力",
  "样式变体",
  "交互与扩展",
];

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}
