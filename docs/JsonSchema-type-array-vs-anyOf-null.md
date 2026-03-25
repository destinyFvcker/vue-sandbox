# JSON Schema 里 `type: ["object", "null"]` 与 `anyOf + null` 的区别

## 一句话结论

`type: ["object", "null"]` 在 JSON Schema 里是合法写法，它表达的是：

- 当前值要么是对象
- 要么是 `null`

但它只能表达“**基础类型联合**”，不能表达“**某个具体 schema 或 null**”。

如果你的真实语义是：

- 要么满足某个引用 schema，例如 `BarStruct`
- 要么是 `null`

那通常应该写成：

```json
{
  "anyOf": [
    {
      "$ref": "#/definitions/BarStruct"
    },
    {
      "type": "null"
    }
  ]
}
```

这也是很多工具自动生成 `anyOf + null` 的原因。

---

## `type` 数组能表达什么

JSON Schema 的 `type` 可以是：

- 一个字符串
- 一个字符串数组

例如：

```json
{
  "type": ["object", "null"]
}
```

含义是：

- 如果值是对象，校验通过
- 如果值是 `null`，校验通过
- 其他类型都不通过

这里的数组元素只能是 JSON Schema 预定义的基础类型名，例如：

- `"null"`
- `"boolean"`
- `"object"`
- `"array"`
- `"number"`
- `"string"`
- `"integer"`

所以 `["object", "null"]` 是合法的，而且语义很直接。

---

## 为什么它不能替代 `$ref + null`

看下面两种写法。

### 1. 只表达“对象或 null”

```json
{
  "type": ["object", "null"]
}
```

这只约束了最外层类型：

- 是对象就行
- 是 `null` 也行

但这里并没有说明“这个对象内部必须长成什么样”。

### 2. 表达“BarStruct 或 null”

```json
{
  "anyOf": [
    {
      "$ref": "#/definitions/BarStruct"
    },
    {
      "type": "null"
    }
  ]
}
```

这时语义变成：

- 要么满足 `BarStruct` 这个完整 schema
- 要么是 `null`

这里的关键差异是：

- `type` 数组里放的是**类型名**
- `$ref` 指向的是**完整 schema**

所以它们不是同一层表达能力。

---

## 为什么工具经常生成 `anyOf`

很多代码生成工具、类型系统映射工具、或者 schema 导出工具，在遇到下面这类语义时：

- `BarStruct | null`
- `string | null`
- `Foo | Bar | null`

会统一生成 `anyOf`，因为这种形式更通用。

例如：

```json
{
  "anyOf": [
    { "type": "string" },
    { "type": "null" }
  ]
}
```

虽然对 `string | null` 来说，它和下面这句在很多场景下语义接近：

```json
{
  "type": ["string", "null"]
}
```

但工具仍可能选择 `anyOf`，原因通常是：

- 生成策略统一，不必区分“基础类型联合”和“schema 联合”
- 后续更容易扩展成 `$ref`、`const`、`enum`、对象结构等复杂分支
- 某些工具链内部本来就把联合类型建模为 `anyOf` / `oneOf`

所以“工具常生成 `anyOf + null`”并不表示 `type: ["object", "null"]` 不合法，而是说明工具在用一个更通用的表达方式。

---

## 一个容易误解的写法

下面这种写法通常**不是**“BarStruct 或 null”：

```json
{
  "type": ["object", "null"],
  "$ref": "#/definitions/BarStruct"
}
```

原因是它更接近“同时满足这些约束”：

- 值的类型是对象或 `null`
- 同时还要满足 `$ref` 指向的 schema

如果 `BarStruct` 本身要求是对象，那么：

- 对象分支可能通过
- `null` 一般仍然过不了 `$ref`

因此它通常不能达到“`BarStruct` 或 `null`”这个目的。

---

## 实践建议

如果你的语义只是：

- 一个值可以是任意对象
- 或者是 `null`

那么直接写：

```json
{
  "type": ["object", "null"]
}
```

如果你的语义是：

- 一个值要么满足某个具体 schema
- 要么是 `null`

那么优先写：

```json
{
  "anyOf": [
    { "$ref": "#/definitions/BarStruct" },
    { "type": "null" }
  ]
}
```

前者是“类型联合”，后者是“schema 联合”。这就是两者最核心的区别。
