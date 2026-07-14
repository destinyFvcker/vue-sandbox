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
    description: "通过 DataTables Vue named slot 在单元格内渲染 Vue 组件。",
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
    slug: "simple",
    title: "Simple",
    description: "只有表格主体与合计栏的最小只读表格。",
    group: "样式变体",
    icon: "lucide:table-2",
  },
  {
    slug: "image",
    title: "Image",
    description: "在姓名列中组合头像、主文本与辅助文本。",
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
    description: "通过 Vue slots 渲染状态徽章、国旗与组合内容。",
    group: "样式变体",
    icon: "lucide:badge-check",
  },
  {
    slug: "search-sort",
    title: "Search & Sort",
    description: "外部响应式搜索、列排序、标签与链接单元格。",
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

const firstNames = [
  "Amelia",
  "Noah",
  "Mia",
  "Ethan",
  "Ava",
  "Lucas",
  "Sofia",
  "Oliver",
  "Luna",
  "Leo",
  "Isla",
  "James",
];
const lastNames = ["Chen", "Smith", "Patel", "Kim", "Brown", "Garcia", "Wang", "Martin"];
const locations = [
  { city: "Shanghai", country: "China", flag: "🇨🇳" },
  { city: "Singapore", country: "Singapore", flag: "🇸🇬" },
  { city: "London", country: "United Kingdom", flag: "🇬🇧" },
  { city: "Toronto", country: "Canada", flag: "🇨🇦" },
  { city: "Sydney", country: "Australia", flag: "🇦🇺" },
  { city: "Auckland", country: "New Zealand", flag: "🇳🇿" },
];
const positions = [
  "Product Designer",
  "Frontend Engineer",
  "Data Analyst",
  "Support Lead",
  "Account Manager",
  "Platform Engineer",
];

export interface DemoPerson {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  image: string;
  location: {
    city: string;
    country: string;
    flag: string;
  };
  status: "Active" | "Inactive";
  balance: number;
  position: string;
  office: string;
  age: number;
  startDate: string;
  department: string;
  joinDate: string;
  lastActive: string;
}

export function createDemoPeople(count = 30): DemoPerson[] {
  return Array.from({ length: count }, (_, index) => {
    const id = index + 1;
    const firstName = firstNames[index % firstNames.length]!;
    const lastName = lastNames[(index * 3) % lastNames.length]!;
    const location = locations[(index * 5) % locations.length]!;
    const compactName = `${firstName}.${lastName}`.toLowerCase();

    return {
      id,
      name: `${firstName} ${lastName}`,
      username: compactName,
      email: `${compactName}@example.com`,
      phone: `+1 555 ${String(1000 + id * 37).padStart(4, "0")}`,
      image: `https://i.pravatar.cc/96?img=${(index % 60) + 1}`,
      location: { ...location },
      status: index % 3 === 1 ? "Inactive" : "Active",
      balance: Number((128.45 + ((index * 173.73) % 1250)).toFixed(2)),
      position: positions[index % positions.length]!,
      office: location.city,
      age: 24 + ((index * 7) % 35),
      startDate: `202${index % 6}-${String((index % 12) + 1).padStart(2, "0")}-${String(
        (index % 27) + 1
      ).padStart(2, "0")}`,
      department: positions[(index + 2) % positions.length]!,
      joinDate: `202${index % 5}-${String((index % 12) + 1).padStart(2, "0")}-15`,
      lastActive: `2026-07-${String((index % 14) + 1).padStart(2, "0")}`,
    };
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export const programmingLanguages = [
  {
    id: "1",
    name: "JavaScript",
    releaseYear: "1995",
    developer: "Brendan Eich",
    typing: "Dynamic",
    paradigm: "Multi-paradigm",
    extension: ".js",
    latestVersion: "ES2025",
    popularity: "High",
  },
  {
    id: "2",
    name: "Python",
    releaseYear: "1991",
    developer: "Guido van Rossum",
    typing: "Dynamic",
    paradigm: "Multi-paradigm",
    extension: ".py",
    latestVersion: "3.14",
    popularity: "High",
  },
  {
    id: "3",
    name: "Java",
    releaseYear: "1995",
    developer: "James Gosling",
    typing: "Static",
    paradigm: "Object-oriented",
    extension: ".java",
    latestVersion: "25",
    popularity: "High",
  },
  {
    id: "4",
    name: "C++",
    releaseYear: "1985",
    developer: "Bjarne Stroustrup",
    typing: "Static",
    paradigm: "Multi-paradigm",
    extension: ".cpp",
    latestVersion: "C++23",
    popularity: "High",
  },
  {
    id: "5",
    name: "Ruby",
    releaseYear: "1995",
    developer: "Yukihiro Matsumoto",
    typing: "Dynamic",
    paradigm: "Multi-paradigm",
    extension: ".rb",
    latestVersion: "3.4",
    popularity: "Medium",
  },
];

export type KeywordIntent = "Informational" | "Navigational" | "Commercial" | "Transactional";

export interface KeywordRow {
  id: number;
  keyword: string;
  intents: KeywordIntent[];
  volume: number;
  cpc: number;
  traffic: number;
  link: string;
}

export const keywordRows: KeywordRow[] = [
  {
    id: 1,
    keyword: "vue data table component",
    intents: ["Informational", "Commercial"],
    volume: 1880,
    cpc: 2.45,
    traffic: 84,
    link: "https://datatables.net/",
  },
  {
    id: 2,
    keyword: "json schema table",
    intents: ["Informational"],
    volume: 960,
    cpc: 1.32,
    traffic: 72,
    link: "https://json-schema.org/",
  },
  {
    id: 3,
    keyword: "nuxt admin dashboard",
    intents: ["Commercial"],
    volume: 1430,
    cpc: 4.86,
    traffic: 63,
    link: "https://nuxt.com/",
  },
  {
    id: 4,
    keyword: "client side sorting",
    intents: ["Informational"],
    volume: 720,
    cpc: 0.92,
    traffic: 58,
    link: "https://datatables.net/manual/",
  },
  {
    id: 5,
    keyword: "download table csv",
    intents: ["Transactional"],
    volume: 1150,
    cpc: 3.1,
    traffic: 51,
    link: "https://datatables.net/extensions/buttons/",
  },
  {
    id: 6,
    keyword: "responsive table vue",
    intents: ["Informational", "Navigational"],
    volume: 1670,
    cpc: 2.74,
    traffic: 77,
    link: "https://datatables.net/manual/vue",
  },
  {
    id: 7,
    keyword: "jquery datatable pagination",
    intents: ["Navigational"],
    volume: 1290,
    cpc: 1.65,
    traffic: 69,
    link: "https://datatables.net/reference/option/paging",
  },
  {
    id: 8,
    keyword: "table column reorder",
    intents: ["Commercial", "Transactional"],
    volume: 540,
    cpc: 5.2,
    traffic: 42,
    link: "https://datatables.net/extensions/colreorder/",
  },
];
