# JSON Schema 里 `enum` 的边界，以及 `schemars` 为什么会生成 `oneOf`

## 一句话结论

`enum` 能表达的是“**有限个、完全确定的 JSON 值**”，而不是“几种结构模式”。

所以当 Rust 的 enum 只是几个固定字面量时，`schemars` 通常会输出 `enum`；一旦每个分支本身还是一类结构，`schemars` 就会改用 `oneOf`，有些 `untagged` 场景则会用 `anyOf`。

---

## `enum` 能表达什么

JSON Schema 中：

```json
{
  "enum": ["Foo", "Bar"]
}
```

意思是：

- 当前值必须严格等于 `"Foo"` 或 `"Bar"`
- 这里列出的每一项，都是一个**完整值**
- 它不是“规则列表”，而是“允许值列表”

因此 `enum` 的表达能力有一个明确边界：

- 可以表达有限个精确值
- 可以是字符串、数字、布尔、`null`
- 也可以是对象或数组
- 但对象或数组也必须是**完整写死的具体值**

例如下面也是合法的：

```json
{
  "enum": [
    { "kind": "a", "value": 1 },
    { "kind": "b", "value": 2 }
  ]
}
```

它的含义不是“对象满足这两种结构之一”，而是：

- 只能等于第一个对象
- 或者只能等于第二个对象

如果对象里某些字段还允许变化，这就已经不是 `enum` 能表达的范畴了。

---

## 为什么复杂结构不能继续用 `enum`

看一个典型结构分支：

```json
{
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "type": { "const": "A" },
        "x": { "type": "string" }
      },
      "required": ["type", "x"]
    },
    {
      "type": "object",
      "properties": {
        "type": { "const": "B" },
        "y": { "type": "integer" }
      },
      "required": ["type", "y"]
    }
  ]
}
```

这里每个分支表达的是“一类值”：

- 只要满足第一个 schema，就属于 A 分支
- 只要满足第二个 schema，就属于 B 分支

这不是两个固定对象，而是两个**模式集合**。因此这里必须用 `oneOf`、`anyOf`、`allOf` 这类组合关键字，而不是 `enum`。

---

## `schemars` 在本仓库里的实际输出

仓库中的 [`rust-schemars-gen/src/lib.rs`](/Users/liuzl/dev/fe-dev/projects/vue-sandbox/rust-schemars-gen/src/lib.rs) 已经给出了几个典型例子。

### 1. 普通 unit enum 会生成 `enum`

Rust：

```rust
pub enum QuxNormalEnum {
    Foo,
    Bar,
}
```

`schemars` 输出：

```json
{
  "title": "QuxNormalEnum",
  "type": "string",
  "enum": ["Foo", "Bar"]
}
```

原因很直接：

- `Foo` 和 `Bar` 都是固定字面量
- 值空间就是一个有限集合
- 适合直接落成 `enum`

### 2. tuple enum 会生成 `oneOf`

Rust：

```rust
pub enum QuxTupleEnum {
    Write(String),
    Move(i32, i32),
    ChangeColor(u8, u8, u8),
}
```

`schemars` 输出的是 `oneOf`，每个分支对应一个 variant 的结构：

```json
{
  "title": "QuxTupleEnum",
  "oneOf": [
    {
      "type": "object",
      "properties": {
        "Write": { "type": "string" }
      },
      "required": ["Write"]
    },
    {
      "type": "object",
      "properties": {
        "Move": {
          "type": "array",
          "items": [{ "type": "integer" }, { "type": "integer" }]
        }
      },
      "required": ["Move"]
    }
  ]
}
```

这里不能用 `enum`，因为：

- `Write(String)` 不是一个固定值，而是一整类字符串包装值
- `Move(i32, i32)` 也不是一个固定对象，而是一类固定形状的数组/对象
- 每个 variant 都是 schema 分支，不是字面量枚举项

### 3. struct enum 也会生成 `oneOf`

Rust：

```rust
pub enum QuxStructEnum {
    Quit,
    Move { x: i32, y: i32 },
    Write { text: String },
}
```

`schemars` 输出：

```json
{
  "title": "QuxStructEnum",
  "oneOf": [
    {
      "type": "string",
      "enum": ["Quit"]
    },
    {
      "type": "object",
      "properties": {
        "Move": {
          "type": "object",
          "properties": {
            "x": { "type": "integer" },
            "y": { "type": "integer" }
          },
          "required": ["x", "y"]
        }
      },
      "required": ["Move"]
    }
  ]
}
```

这里可以看到一个细节：

- `Quit` 这种 unit variant，本身仍然可以内部使用 `enum`
- 但整个 enum 的总表达方式，已经必须升级为 `oneOf`
- 因为另两个 variant 是结构分支，不再是固定字面量

### 4. `#[serde(untagged)]` 常见会生成 `anyOf`

Rust：

```rust
#[serde(untagged)]
pub enum MyEnum {
    StringNewType(String),
    StructVariant { floats: Vec<f32> },
}
```

本仓库里 `schemars` 的输出是：

```json
{
  "anyOf": [
    { "type": "string" },
    {
      "type": "object",
      "properties": {
        "floats": {
          "type": "array",
          "items": { "type": "number" }
        }
      },
      "required": ["floats"]
    }
  ]
}
```

这里之所以是 `anyOf`，通常是因为：

- `untagged` 没有显式 discriminator
- 某些分支之间不一定天然互斥
- 工具更倾向表达“满足任一分支即可”

所以你观察到的现象可以再精确一点：

- 简单固定值枚举 -> `enum`
- 互斥的结构分支 -> 常见是 `oneOf`
- `untagged` 或边界较模糊的分支 -> 也可能是 `anyOf`

---

## 可以把两者理解成什么关系

最实用的理解方式是：

- `enum`：列出允许的**值**
- `const`：限制为一个唯一的**值**
- `oneOf`：列出允许的**schema 分支**，且通常要求命中且只命中一个
- `anyOf`：列出允许的**schema 分支**，命中任意一个即可

也就是说：

- `enum` 面向“值空间”
- `oneOf` / `anyOf` 面向“模式空间”

---

## 回到最初的问题

“JSON Schema 里的 `enum` 表达范围是否有限？”

答案是：**有限，而且是天然有限。**

它的限制不在于“只能放简单类型”，而在于：

- 它只能枚举**具体值**
- 不能枚举“带变量字段的结构模式”
- 不能表达“若是 A 则字段 X 必填，若是 B 则字段 Y 必填”这类条件分支

所以 `schemars` 在结构稍复杂时转为 `oneOf`，不是退化，而是进入了更准确的建模层级。

---

## 实践建议

- Rust enum 全是 unit variant 时，预期生成 `type: "string" + enum`
- 只要 variant 带 payload，通常就要预期出现 `oneOf`
- 使用 `#[serde(untagged)]` 时，要预期 `anyOf` 或较宽松的分支表达
- 如果你的消费端只想拿到“可选项列表”，那它需要识别的是“简单枚举场景”，不能把所有 Rust enum 都等同为 JSON Schema 的 `enum`
