import type { JsonFormsRendererRegistryEntry, JsonSchema7 } from "@jsonforms/core";
import { createColumnHelper, type ColumnDef } from "@tanstack/vue-table";
import RenderDispather from "./RenderDispather.vue";
import JsonCell from "./JsonCell.vue";

const columnHelper = createColumnHelper<any>();
export function genColumnDefs(
	schema: JsonSchema7,
	renderers: JsonFormsRendererRegistryEntry[],
	prefix: string = "",
): ColumnDef<any, any>[] {
	const columns = getColumnsBySchema(schema);

	return columns.map((column) => {
		return columnHelper.accessor(prefix ? `${prefix}.${column}` : column, {
			header: column,
			cell: ({ row }) => {
				return h(
					"div",
					{ class: "relative" },
					h(JsonCell, {
						data: row.original,
						schema: schema,
						renderers: renderers,
					}),
				);
			},
		});
	});
}

function getColumnsBySchema(schema: JsonSchema7) {
	if (schema.type === "object" && typeof schema.properties === "object") {
		const properties = schema.properties;
		return Object.keys(properties).filter((prop) => properties[prop]?.type !== "array");
	}
	// primitives
	return [""];
}
