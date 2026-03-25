import { describe, it, expect } from "vitest";
import type { JsonSchema, JsonSchema7 } from "@jsonforms/core";
import { collectSchemaEntries } from "../../app/lib/schema-resolver";

describe("collectSchemaEntries", () => {
	describe("扁平对象 schema", () => {
		it("收集所有叶子属性", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					name: { type: "string" },
					age: { type: "number" },
				},
			};

			const result = collectSchemaEntries(schema);

			expect(result).toEqual([
				{ schema: { type: "string" }, schemaPath: "#/properties/name", dataPath: "name" },
				{ schema: { type: "number" }, schemaPath: "#/properties/age", dataPath: "age" },
			]);
		});

		it("包含数组和布尔类型字段", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					tags: { type: "array", items: { type: "string" } },
					active: { type: "boolean" },
				},
			};

			const result = collectSchemaEntries(schema);

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({ dataPath: "tags" });
			expect(result[1]).toMatchObject({ dataPath: "active" });
		});
	});

	describe("嵌套对象 schema", () => {
		const nestedSchema: JsonSchema = {
			type: "object",
			properties: {
				name: { type: "string" },
				address: {
					type: "object",
					properties: {
						city: { type: "string" },
						zip: { type: "string" },
					},
				},
			},
		};

		it("默认 leafOnly=true 只收集叶子节点", () => {
			const result = collectSchemaEntries(nestedSchema);

			expect(result).toEqual([
				{ schema: { type: "string" }, schemaPath: "#/properties/name", dataPath: "name" },
				{
					schema: { type: "string" },
					schemaPath: "#/properties/address/properties/city",
					dataPath: "address.city",
				},
				{
					schema: { type: "string" },
					schemaPath: "#/properties/address/properties/zip",
					dataPath: "address.zip",
				},
			]);
		});

		it("leafOnly=false 同时包含中间对象节点", () => {
			const result = collectSchemaEntries(nestedSchema, nestedSchema, { leafOnly: false });

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("address");
			expect(dataPaths).toContain("address.city");
			expect(dataPaths).toContain("address.zip");
			expect(dataPaths).toContain("name");
		});

		it("深层嵌套生成正确的点分隔 dataPath", () => {
			const deepSchema: JsonSchema = {
				type: "object",
				properties: {
					a: {
						type: "object",
						properties: {
							b: {
								type: "object",
								properties: {
									c: { type: "string" },
								},
							},
						},
					},
				},
			};

			const result = collectSchemaEntries(deepSchema);

			expect(result).toEqual([
				{
					schema: { type: "string" },
					schemaPath: "#/properties/a/properties/b/properties/c",
					dataPath: "a.b.c",
				},
			]);
		});
	});

	describe("maxDepth 限制", () => {
		const deepSchema: JsonSchema = {
			type: "object",
			properties: {
				level1: {
					type: "object",
					properties: {
						level2: {
							type: "object",
							properties: {
								level3: { type: "string" },
							},
						},
					},
				},
			},
		};

		it("maxDepth=1 只收集第一层叶子属性", () => {
			const result = collectSchemaEntries(deepSchema, deepSchema, { maxDepth: 1 });

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).not.toContain("level1.level2.level3");
		});

		it("maxDepth=2 可以到达第三层叶子（在 depth=2 处遍历 properties）", () => {
			const result = collectSchemaEntries(deepSchema, deepSchema, { maxDepth: 2 });

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("level1.level2.level3");
		});

		it("maxDepth=Infinity 收集所有深度", () => {
			const result = collectSchemaEntries(deepSchema, deepSchema, { maxDepth: Infinity });

			expect(result).toHaveLength(1);
			expect(result[0]!.dataPath).toBe("level1.level2.level3");
		});
	});

	describe("$ref 解析", () => {
		it("解析顶层属性中的 $ref", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					user: { $ref: "#/definitions/User" },
				},
				definitions: {
					User: {
						type: "object",
						properties: {
							name: { type: "string" },
							email: { type: "string" },
						},
					},
				},
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("user.name");
			expect(dataPaths).toContain("user.email");
		});

		it("解析嵌套 $ref", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					order: { $ref: "#/definitions/Order" },
				},
				definitions: {
					Address: {
						type: "object",
						properties: {
							street: { type: "string" },
						},
					},
					Order: {
						type: "object",
						properties: {
							shipping: { $ref: "#/definitions/Address" },
						},
					},
				},
			};

			const result = collectSchemaEntries(schema);

			expect(result).toEqual(
				expect.arrayContaining([expect.objectContaining({ dataPath: "order.shipping.street" })]),
			);
		});

		it("跳过循环 $ref 避免无限递归", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					node: { $ref: "#/definitions/TreeNode" },
				},
				definitions: {
					TreeNode: {
						type: "object",
						properties: {
							value: { type: "string" },
							children: { $ref: "#/definitions/TreeNode" },
						},
					},
				},
			};

			const result = collectSchemaEntries(schema);
			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("node.value");
		});
	});

	describe("allOf 属性合并", () => {
		it("合并 allOf 中多个子 schema 的属性", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					person: {
						allOf: [
							{ properties: { name: { type: "string" } } },
							{ properties: { age: { type: "number" } } },
						],
					},
				},
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("person.name");
			expect(dataPaths).toContain("person.age");
		});

		it("allOf 与直接 properties 合并", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					item: {
						properties: { id: { type: "string" } },
						allOf: [{ properties: { label: { type: "string" } } }],
					},
				},
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("item.id");
			expect(dataPaths).toContain("item.label");
		});

		it("allOf 中包含 $ref 引用", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					user: {
						allOf: [{ $ref: "#/definitions/Base" }, { properties: { role: { type: "string" } } }],
					},
				},
				definitions: {
					Base: {
						properties: {
							id: { type: "number" },
						},
					},
				},
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("user.id");
			expect(dataPaths).toContain("user.role");
		});
	});

	describe("oneOf / anyOf 变体收集", () => {
		it("根层级 oneOf 变体中的对象属性被收集", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					name: { type: "string" },
				},
				oneOf: [
					{
						type: "object",
						properties: {
							radius: { type: "number" },
						},
					},
					{
						type: "object",
						properties: {
							width: { type: "number" },
						},
					},
				],
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("name");
			expect(dataPaths).toContain("radius");
			expect(dataPaths).toContain("width");
		});

		it("根层级 anyOf 变体中的对象属性被收集", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					id: { type: "number" },
				},
				anyOf: [
					{
						type: "object",
						properties: { email: { type: "string" } },
					},
					{
						type: "object",
						properties: { phone: { type: "string" } },
					},
				],
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("id");
			expect(dataPaths).toContain("email");
			expect(dataPaths).toContain("phone");
		});

		it("属性内仅含 oneOf 时被视为叶子节点", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					shape: {
						oneOf: [
							{
								type: "object",
								properties: { radius: { type: "number" } },
							},
						],
					},
				},
			};

			const result = collectSchemaEntries(schema);

			expect(result).toEqual([expect.objectContaining({ dataPath: "shape" })]);
		});

		it("属性同时有 properties 和 oneOf 时展开变体", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					shape: {
						type: "object",
						properties: {
							color: { type: "string" },
						},
						oneOf: [
							{
								type: "object",
								properties: { radius: { type: "number" } },
							},
							{
								type: "object",
								properties: { width: { type: "number" } },
							},
						],
					},
				},
			};

			const result = collectSchemaEntries(schema);

			const dataPaths = result.map((e) => e.dataPath);
			expect(dataPaths).toContain("shape.color");
			expect(dataPaths).toContain("shape.radius");
			expect(dataPaths).toContain("shape.width");
		});

		it("忽略 oneOf 中的原始类型变体", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					value: {
						oneOf: [{ type: "string" }, { type: "number" }],
					},
				},
			};

			const result = collectSchemaEntries(schema);

			expect(result).toEqual([expect.objectContaining({ dataPath: "value" })]);
		});
	});

	describe("边界情况", () => {
		it("空 schema 返回空数组", () => {
			const result = collectSchemaEntries({});
			expect(result).toEqual([]);
		});

		it("无 properties 的 schema 返回空数组", () => {
			const schema: JsonSchema = { type: "object" };
			const result = collectSchemaEntries(schema);
			expect(result).toEqual([]);
		});

		it("原始类型 schema 返回空数组", () => {
			const schema: JsonSchema = { type: "string" };
			const result = collectSchemaEntries(schema);
			expect(result).toEqual([]);
		});

		it("rootSchema 参数可单独指定", () => {
			const rootSchema: JsonSchema = {
				definitions: {
					Name: { type: "string" },
				},
			};
			const subSchema: JsonSchema = {
				type: "object",
				properties: {
					name: { $ref: "#/definitions/Name" },
				},
			};

			const result = collectSchemaEntries(subSchema, rootSchema);

			expect(result).toHaveLength(1);
			expect(result[0]!.dataPath).toBe("name");
			expect(result[0]!.schema).toEqual({ type: "string" });
		});

		it("属性值为 null/undefined 时不崩溃", () => {
			const schema: JsonSchema = {
				type: "object",
				properties: {
					a: undefined as unknown as JsonSchema7,
					b: { type: "string" },
				},
			};

			expect(() => collectSchemaEntries(schema)).not.toThrow();
		});
	});
});
