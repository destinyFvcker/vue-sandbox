# JsonSchema7 vs JsonSchema7Definition

## 核心区别

| 类型                    | 定义                     | 来源                                     |
| ----------------------- | ------------------------ | ---------------------------------------- |
| `JsonSchema7`           | Schema 对象（interface） | `@jsonforms/core` / `@types/json-schema` |
| `JsonSchema7Definition` | `JsonSchema7 \| boolean` | `@types/json-schema`                     |

**一句话总结：`JsonSchema7Definition` 是 `JsonSchema7` 的超集，多了对布尔值 schema 的支持。**

---

## JsonSchema7

`JsonSchema7` 是一个 **interface**，描述符合 JSON Schema Draft-07 规范的 schema 对象。它包含所有合法的 schema 关键字：

```typescript
interface JsonSchema7 {
  $id?: string;
  $schema?: string;
  type?: string | string[];
  properties?: { [property: string]: JsonSchema7 };
  required?: string[];
  items?: JsonSchema7 | JsonSchema7[];
  allOf?: JsonSchema7[];
  anyOf?: JsonSchema7[];
  oneOf?: JsonSchema7[];
  not?: JsonSchema7;
  if?: JsonSchema7;
  then?: JsonSchema7;
  else?: JsonSchema7;
  enum?: any[];
  const?: any;
  // ...更多字段
}
```

使用示例：

```typescript
const schema: JsonSchema7 = {
  type: "object",
  properties: {
    name: { type: "string" },
    age:  { type: "integer", minimum: 0 },
  },
  required: ["name"],
};
```

---

## JsonSchema7Definition

`JsonSchema7Definition` 是一个 **type alias**，定义如下：

```typescript
type JsonSchema7Definition = JsonSchema7 | boolean;
```

JSON Schema Draft-07 规范允许 schema 本身是一个**布尔值**：

| 值      | 含义                                   |
| ------- | -------------------------------------- |
| `true`  | 永远通过验证（等价于 `{}`）            |
| `false` | 永远不通过验证（等价于 `{ not: {} }`） |

使用示例：

```typescript
// 布尔 schema —— 仅 JsonSchema7Definition 能表达，JsonSchema7 不能
const alwaysValid: JsonSchema7Definition = true;
const alwaysInvalid: JsonSchema7Definition = false;

// 对象 schema —— 两种类型都可以用
const schema: JsonSchema7Definition = {
  type: "string",
  minLength: 1,
};
```

常见于 `additionalProperties`、`if/then/else` 等字段的值类型定义中：

```typescript
// @types/json-schema 的标准定义
interface JSONSchema7 {
  additionalProperties?: JsonSchema7Definition;  // 可以是 true/false 或对象
  if?: JsonSchema7Definition;
  then?: JsonSchema7Definition;
  else?: JsonSchema7Definition;
}
```

---

## 在本项目中的情况

本项目使用的是 `@jsonforms/core` 提供的 `JsonSchema7`，该包**没有导出 `JsonSchema7Definition`**，且其内部将 `additionalProperties`、`items` 等字段直接限定为 `boolean | JsonSchema7`（等价效果，但没有单独抽出这个类型别名）。

```typescript
// @jsonforms/core 的实际定义
interface JsonSchema7 {
  additionalProperties?: boolean | JsonSchema7;  // 内联，而非 JsonSchema7Definition
  items?: JsonSchema7 | JsonSchema7[];
}
```

如果需要 `JsonSchema7Definition` 类型，可以安装 `@types/json-schema` 包，或自行定义：

```typescript
type JsonSchema7Definition = JsonSchema7 | boolean;
```

---

## 选型建议

- 函数参数/返回值需要处理**完整对象 schema** → 用 `JsonSchema7`
- 字段值允许用布尔值作为 schema 快捷方式 → 用 `JsonSchema7Definition`
- 在 `@jsonforms/core` 生态内 → 统一用 `JsonSchema7`，必要时本地定义 `JsonSchema7Definition`
