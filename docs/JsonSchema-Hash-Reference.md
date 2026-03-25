# JSON Schema 中 `#` 的含义

## 一句话结论

在 JSON Schema 中，`#` 不是特殊关键字本身，而是 **URI fragment（片段标识符）** 的起点。它通常出现在 `$ref` 中，用来表示：

- 引用当前 schema 文档本身
- 引用当前 schema 文档中的某个子位置
- 引用外部 schema 文档中的某个子位置

---

## 对照表

| 写法                                          | 含义                              | 指向范围     | 常见用途                    |
| --------------------------------------------- | --------------------------------- | ------------ | --------------------------- |
| `#`                                           | 当前 schema 文档的根              | 当前文件     | 引用整个当前 schema         |
| `#/properties/name`                           | 当前 schema 文档中的某个路径      | 当前文件内部 | 引用某个字段对应的子 schema |
| `#/$defs/User`                                | 当前 schema 文档中的 `$defs.User` | 当前文件内部 | 复用定义好的子 schema       |
| `user.schema.json#`                           | 外部 schema 文档的根              | 外部文件     | 引用整个外部 schema         |
| `user.schema.json#/$defs/User`                | 外部 schema 文档中的某个路径      | 外部文件内部 | 引用外部文件中的局部定义    |
| `https://example.com/schema.json#/$defs/User` | 某个绝对 URL 对应 schema 中的路径 | 远程 schema  | 跨文件、跨服务复用 schema   |

---

## 先理解 `#`

在 URI 语法里：

- `https://example.com/schema.json` 是资源地址
- `#/$defs/User` 是这个资源内部的片段定位

组合起来：

```txt
https://example.com/schema.json#/$defs/User
```

意思是：

1. 先找到 `https://example.com/schema.json`
2. 再定位到其中的 `/$defs/User`

如果省略前面的地址，只写 `#/$defs/User`，就表示：

1. 不跳转到别的文件
2. 直接在当前 schema 文档里找 `/$defs/User`

---

## `#` 的 3 种最常见用法

### 1. `#` 表示当前文档根节点

```json
{
  "$ref": "#"
}
```

这表示“引用当前 schema 自己”。

可以把它理解成：

- 当前正在处理的是一个 schema 文档
- `#` 就是这个文档的最外层对象

例如：

```json
{
  "type": "object",
  "properties": {
    "self": {
      "$ref": "#"
    }
  }
}
```

这里 `self` 引用的是整个根 schema，也就是这个对象本身的结构。它常用于表达递归结构。

---

### 2. `#/...` 表示当前文档中的某个子路径

```json
{
  "$ref": "#/properties/name"
}
```

这表示“引用当前 schema 根对象下的 `properties.name` 那个位置”。

例如：

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1
    },
    "nickname": {
      "$ref": "#/properties/name"
    }
  }
}
```

这里：

- `#/properties/name` 指向 `name` 这个字段的 schema
- `nickname` 复用了 `name` 的约束
- 所以 `nickname` 也会被当作 `string`，并且 `minLength` 为 `1`

这类写法里的 `/properties/name` 使用的是 **JSON Pointer** 路径规则。

---

### 3. `外部地址#/...` 表示外部 schema 的某个子路径

```json
{
  "$ref": "user.schema.json#/$defs/User"
}
```

这表示：

1. 打开 `user.schema.json`
2. 在这个 schema 里找到 `$defs.User`
3. 使用那个子 schema 作为当前引用结果

例如：

`user.schema.json`

```json
{
  "$defs": {
    "User": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "age": { "type": "integer" }
      },
      "required": ["name"]
    }
  }
}
```

另一个 schema：

```json
{
  "type": "array",
  "items": {
    "$ref": "user.schema.json#/$defs/User"
  }
}
```

这里的 `items` 就表示“数组里的每个元素都必须符合 `user.schema.json` 中定义的 `User`”。

---

## 为什么经常写成 `#/$defs/...`

`$defs` 是 Draft 2019-09 及之后推荐的复用定义位置。在很多工具和示例里，即便讨论 Draft-07，也常会提到与之类似的“预定义子 schema 区域”。

当你看到：

```json
{
  "$defs": {
    "User": {
      "type": "object"
    }
  },
  "properties": {
    "owner": {
      "$ref": "#/$defs/User"
    }
  }
}
```

意思就是：

- 先在根对象下找到 `$defs`
- 再找到其中的 `User`
- 把 `User` 这个 schema 复用到 `owner`

如果是更老的写法，也可能看到：

```json
{
  "definitions": {
    "User": {
      "type": "object"
    }
  },
  "properties": {
    "owner": {
      "$ref": "#/definitions/User"
    }
  }
}
```

这两者的核心思路相同，区别主要在 schema draft 版本和推荐字段名。

---

## `#/...` 里的路径是怎么解析的

`#/properties/name` 可以拆成两部分：

- `#`：从当前文档根开始
- `/properties/name`：沿着对象键逐层向下找

也就是说：

```json
{
  "properties": {
    "name": {
      "type": "string"
    }
  }
}
```

中的：

```txt
#/properties/name
```

最终会定位到：

```json
{
  "type": "string"
}
```

如果路径里包含特殊字符，JSON Pointer 还有转义规则：

- `~1` 表示 `/`
- `~0` 表示 `~`

例如某个 key 真叫 `a/b`，那路径里要写成：

```txt
#/properties/a~1b
```

---

## 一个完整示例

下面这个例子同时包含 `#` 和 `#/$defs/...`：

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
      },
      "required": ["name"]
    }
  },
  "$ref": "#/$defs/TreeNode"
}
```

这个 schema 的含义是：

- 根 schema 实际上就是 `$defs.TreeNode`
- `TreeNode` 是一个对象
- 它有 `children` 数组
- `children` 里的每一项又是一个 `TreeNode`

因此它描述的是一棵递归树结构。

---

## 常见误区

### 1. 误以为 `#` 是注释符号

不是。JSON 里没有注释语法，JSON Schema 里的 `#` 也不是注释，它是 URI fragment 的起点。

### 2. 误以为 `#` 一定表示“当前字段”

不是。`#` 表示的是“当前 schema 文档的根”，不是“当前属性所在位置”。

### 3. 误以为 `#/a/b` 是普通对象访问语法

它看起来像对象路径，但严格来说它遵循的是 JSON Pointer 规则，不是 JavaScript 表达式。

### 4. 误以为 `$ref: "#"` 没意义

它是有意义的，尤其在递归 schema 中很常见，用来引用整个当前 schema。

---

## 记忆方式

可以直接按下面这套方式记：

- `#` = 当前 schema 根
- `#/xxx` = 当前 schema 根下面的某个位置
- `some.schema.json#` = 外部 schema 根
- `some.schema.json#/xxx` = 外部 schema 里的某个位置

---

## 与你当前问题最相关的结论

如果你在 `JsonSchema` 里看到：

```json
{ "$ref": "#" }
```

它表示引用当前整个 schema。

如果看到：

```json
{ "$ref": "#/$defs/User" }
```

它表示引用当前 schema 里的 `$defs.User`。

如果看到：

```json
{ "$ref": "user.schema.json#/$defs/User" }
```

它表示引用外部 `user.schema.json` 里的 `$defs.User`。
