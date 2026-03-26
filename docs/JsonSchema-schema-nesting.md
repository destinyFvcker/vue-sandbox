# JSON Schema 里可以嵌套 Schema 吗

## 一句话结论

可以，而且 **JSON Schema 天然就是递归结构**。

一个 schema 里可以在很多合法位置继续放子 schema，用来描述：

- 对象字段的结构
- 数组元素的结构
- 组合分支的结构
- 条件分支的结构
- 可复用定义的结构

但也不是“任何字段里都能随便塞一个 schema”。只有规范明确规定为“接收 schema”或“接收 schema 集合”的关键字，才能继续嵌套。

---

## 最常见的嵌套位置

下面这些位置，放进去的值本身就是子 schema。

### 1. `properties`

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  }
}
```

这里：

- 根 schema 描述的是一个对象
- `properties.name` 是一个子 schema
- `properties.age` 也是一个子 schema

### 2. `items`

```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "string" }
    },
    "required": ["id"]
  }
}
```

这里 `items` 里嵌套了一个 schema，表示数组的每个元素都要满足这个子 schema。

在 Draft-07 里，`items` 还可以是 schema 数组：

```json
{
  "type": "array",
  "items": [{ "type": "string" }, { "type": "integer" }]
}
```

这表示第 1 个元素按第一个 schema 校验，第 2 个元素按第二个 schema 校验。

### 3. `oneOf` / `anyOf` / `allOf`

```json
{
  "oneOf": [{ "type": "string" }, { "type": "integer" }]
}
```

这里数组中的每一项都是一个 schema 分支。

### 4. `not`

```json
{
  "type": "string",
  "not": {
    "enum": ["admin", "root"]
  }
}
```

这里 `not` 后面也是一个完整的子 schema。

### 5. `if` / `then` / `else`

```json
{
  "if": {
    "properties": {
      "kind": { "const": "user" }
    }
  },
  "then": {
    "required": ["name"]
  },
  "else": {
    "required": ["code"]
  }
}
```

这里三个位置也都是子 schema。

### 6. `additionalProperties` / `patternProperties`

```json
{
  "type": "object",
  "additionalProperties": {
    "type": "string"
  }
}
```

这里表示：除已显式声明字段外，其他额外字段的值也必须符合这个子 schema。

### 7. `$defs` / `definitions`

```json
{
  "$defs": {
    "User": {
      "type": "object",
      "properties": {
        "name": { "type": "string" }
      }
    }
  },
  "properties": {
    "owner": {
      "$ref": "#/$defs/User"
    }
  }
}
```

这里 `$defs.User` 本身就是一个嵌套 schema，只是它被放在“定义区”里，后面通过 `$ref` 引用。

---

## 嵌套的核心规则

### 1. 子 schema 仍然是完整 schema

嵌套进去的 schema，不是“半个 schema”，而是一个完整 schema。

也就是说，在子 schema 里你仍然可以继续写：

- `type`
- `properties`
- `items`
- `enum`
- `oneOf`
- `allOf`
- `not`
- `$ref`

于是它就形成了递归结构。

例如：

```json
{
  "type": "object",
  "properties": {
    "users": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "roles": {
            "type": "array",
            "items": {
              "enum": ["admin", "editor", "viewer"]
            }
          }
        }
      }
    }
  }
}
```

这里就是对象里嵌数组，数组里嵌对象，对象里再嵌数组，数组里再嵌 schema。

### 2. 只能嵌在“接受 schema”的关键字下

这是最重要的限制。

例如这些位置接收的是 schema：

- `properties.<field>`
- `items`
- `oneOf[]`
- `allOf[]`
- `anyOf[]`
- `not`
- `if` / `then` / `else`
- `additionalProperties`
- `$defs.<name>`

但像下面这些位置，就不是 schema：

- `title`
- `description`
- `default`
- `examples`
- `enum` 里的每一项
- `required` 里的每一项

例如：

```json
{
  "enum": [{ "type": "string" }]
}
```

这里 `{ "type": "string" }` 不是“子 schema”，而只是一个普通 JSON 值。它表示允许的值恰好等于这个对象本身。

### 3. 布尔 schema 也可以嵌套

JSON Schema 里，schema 不一定非得是对象，也可以是布尔值：

- `true`：永远通过
- `false`：永远不通过

例如：

```json
{
  "type": "object",
  "additionalProperties": false
}
```

这里的 `false` 其实也是一个合法的嵌套 schema，只不过它是布尔 schema。

### 4. 可以通过 `$ref` 间接嵌套

嵌套不一定要把子 schema 原地写开，也可以把它放到：

- 当前文档的 `$defs` / `definitions`
- 外部 schema 文件

然后再通过 `$ref` 引用。

所以从结构上看：

- 直接内联 schema 是嵌套
- 用 `$ref` 指向子 schema，本质上也是嵌套关系

### 5. 可以递归，但要注意工具实现

例如树结构：

```json
{
  "$defs": {
    "TreeNode": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "children": {
          "type": "array",
          "items": { "$ref": "#/$defs/TreeNode" }
        }
      }
    }
  },
  "$ref": "#/$defs/TreeNode"
}
```

这在 JSON Schema 里是合法的递归定义。

限制通常不来自规范本身，而来自：

- 校验器的实现能力
- 代码生成器的支持程度
- UI 渲染器对递归 schema 的处理能力
- 过深嵌套带来的性能或栈深问题

---

## 有没有层级深度限制

规范层面通常没有要求一个固定的最大嵌套层数。

也就是说：

- 你可以多层嵌套
- 也可以递归引用

但实践上会遇到这些限制：

- 某些 validator 对极深递归会有性能问题
- 某些代码生成器无法很好处理循环引用
- 某些表单渲染器只支持常见对象/数组层级，不一定支持复杂组合分支
- 业务上过深的 schema 本身也会变得难维护

所以“能不能嵌套”答案是能；“应不应该无限嵌套”通常答案是否。

---

## 还有一个常见误区

“只要我在一个 schema 对象里继续写关键字，就一定是在嵌套 schema。”

不完全对。

要区分两件事：

- 在某个对象里写 schema 关键字
- 在某个**字段值位置**放入一个新的子 schema

例如：

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    }
  }
}
```

这里 `properties.name` 是一个新的子 schema。

但在这个子 schema 内部写 `type`、`minLength`，只是这个子 schema 自己的关键字，不是又多包了一层 schema。

---

## 在本项目语境里怎么理解

本项目主要围绕 [`JsonSchema7-vs-JsonSchema7Definition.md`](/Users/liuzl/dev/fe-dev/projects/vue-sandbox/docs/JsonSchema7-vs-JsonSchema7Definition.md) 里的 Draft-07 风格 schema。

所以可以把“schema 嵌套”理解成：

- `properties` 里的值是 `JsonSchema7`
- `items` 里的值是 `JsonSchema7 | JsonSchema7[]`
- `oneOf` / `allOf` / `anyOf` 里的每项是 `JsonSchema7`
- `additionalProperties` 这类位置常见是 `boolean | JsonSchema7`

也就是说，类型定义本身就已经体现了“schema 可以递归嵌套 schema”。

---

## 实践建议

- 先分清“这个关键字的值是不是 schema”
- 能复用的结构优先放进 `$defs` / `definitions`
- 对复杂分支用 `oneOf` / `anyOf`，不要硬塞进 `enum`
- 对对象和数组的深层嵌套，优先保持层级清晰，避免无意义包裹
- 如果目标是给 UI 渲染器或代码生成器消费，要先确认对方支持哪些嵌套关键字和递归模式
