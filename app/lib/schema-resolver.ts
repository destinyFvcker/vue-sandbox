import { encode, resolveSchema, type JsonSchema } from "@jsonforms/core";

export interface SchemaEntry {
	/** The resolved sub-schema at this path */
	schema: JsonSchema;
	/** JSON Pointer path, e.g. "#/properties/address/properties/city" */
	schemaPath: string;
	/** Dot-notation data path, e.g. "address.city" */
	dataPath: string;
}

export interface CollectSchemaOptions {
	/**
	 * When true, only leaf schemas (those without nested object properties) are
	 * collected. Intermediate object schemas are traversed but not included in
	 * the result. Default: true
	 */
	leafOnly?: boolean;
	/** Maximum recursion depth for nested objects. Default: Infinity */
	maxDepth?: number;
}

/**
 * Recursively collects all sub-schemas from a JSON Schema, returning each
 * entry's resolved schema together with its JSON Pointer path and
 * dot-notation data path.
 *
 * Handles `$ref` resolution, `allOf` property merging, and `oneOf`/`anyOf`
 * variant union collection. Circular `$ref` chains are detected and skipped.
 *
 * The returned `dataPath` values can be used directly as TanStack Table
 * column accessor keys.
 *
 * @example
 * const schema = {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     address: {
 *       type: 'object',
 *       properties: {
 *         city: { type: 'string' },
 *         zip: { type: 'string' }
 *       }
 *     }
 *   }
 * };
 * collectSchemaEntries(schema);
 * // [
 * //   { schema: {type:'string'}, schemaPath: '#/properties/name',                      dataPath: 'name' },
 * //   { schema: {type:'string'}, schemaPath: '#/properties/address/properties/city',    dataPath: 'address.city' },
 * //   { schema: {type:'string'}, schemaPath: '#/properties/address/properties/zip',     dataPath: 'address.zip' }
 * // ]
 */
export const collectSchemaEntries = (
	schema: JsonSchema,
	rootSchema: JsonSchema = schema,
	options?: CollectSchemaOptions,
): SchemaEntry[] => {
	const { leafOnly = true, maxDepth = Infinity } = options ?? {};
	const results: SchemaEntry[] = [];
	const visiting = new Set<JsonSchema>();

	const resolveRef = (s: JsonSchema): JsonSchema | undefined => {
		if (s?.$ref) {
			return resolveSchema(rootSchema, s.$ref, rootSchema);
		}
		return s;
	};

	const hasNestedProperties = (s: JsonSchema): boolean => {
		if (s?.properties) return true;
		if (s?.allOf) {
			return s.allOf.some((sub) => {
				const r = resolveRef(sub as JsonSchema);
				return r?.properties != null;
			});
		}
		// Handle anyOf/oneOf (e.g. Rust Option<T>: anyOf [{$ref: T}, {type: null}])
		const variants = [...((s?.oneOf ?? []) as JsonSchema[]), ...((s?.anyOf ?? []) as JsonSchema[])];
		if (variants.length > 0) {
			return variants.some((v) => {
				const r = resolveRef(v);
				return r != null && hasNestedProperties(r);
			});
		}
		return false;
	};

	const mergeAllProperties = (resolved: JsonSchema): Record<string, JsonSchema> => {
		const allProperties: Record<string, JsonSchema> = {};
		if (resolved.properties) {
			Object.assign(allProperties, resolved.properties);
		}
		if (resolved.allOf) {
			for (const sub of resolved.allOf) {
				const resolvedSub = resolveRef(sub as JsonSchema);
				if (resolvedSub?.properties) {
					Object.assign(allProperties, resolvedSub.properties);
				}
			}
		}
		return allProperties;
	};

	const collect = (current: JsonSchema, schemaPath: string, dataPath: string, depth: number) => {
		if (!current || depth > maxDepth) return;

		const resolved = resolveRef(current);
		if (!resolved) return;

		if (visiting.has(resolved)) return;
		visiting.add(resolved);

		const allProperties = mergeAllProperties(resolved);
		const propNames = Object.keys(allProperties);

		if (propNames.length > 0) {
			for (const propName of propNames) {
				const propSchemaPath = `${schemaPath}/properties/${encode(propName)}`;
				const propDataPath = dataPath ? `${dataPath}.${propName}` : propName;

				const resolvedProp = resolveRef(allProperties[propName]!);
				if (!resolvedProp) continue;

				if (hasNestedProperties(resolvedProp)) {
					if (!leafOnly) {
						results.push({
							schema: resolvedProp,
							schemaPath: propSchemaPath,
							dataPath: propDataPath,
						});
					}
					collect(resolvedProp, propSchemaPath, propDataPath, depth + 1);
				} else {
					results.push({
						schema: resolvedProp,
						schemaPath: propSchemaPath,
						dataPath: propDataPath,
					});
				}
			}
		}

		const variants = [...((resolved.oneOf ?? []) as JsonSchema[]), ...((resolved.anyOf ?? []) as JsonSchema[])];
		for (const variant of variants) {
			const resolvedVariant = resolveRef(variant);
			if (resolvedVariant && hasNestedProperties(resolvedVariant)) {
				collect(resolvedVariant, schemaPath, dataPath, depth);
			}
		}

		visiting.delete(resolved);
	};

	collect(schema, "#", "", 0);
	return results;
};

export interface PartitionedEntries {
	/** Entries suitable for table columns (non-array types) */
	columnEntries: SchemaEntry[];
	/** Entries with type: "array", to be rendered in expandable row detail */
	arrayEntries: SchemaEntry[];
}

/**
 * Splits schema entries into column entries and array entries.
 * Array entries (schema.type === "array") are separated out for
 * expandable row rendering (e.g. tabs with sub-tables).
 */
export const partitionSchemaEntries = (entries: SchemaEntry[]): PartitionedEntries => {
	const columnEntries: SchemaEntry[] = [];
	const arrayEntries: SchemaEntry[] = [];

	for (const entry of entries) {
		if (entry.schema.type === "array") {
			arrayEntries.push(entry);
		} else {
			columnEntries.push(entry);
		}
	}

	return { columnEntries, arrayEntries };
};
