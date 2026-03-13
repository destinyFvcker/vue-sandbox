import type { ControlElement, JsonFormsRendererRegistryEntry, JsonSchema7 } from "@jsonforms/core";
import { createColumnHelper, type ColumnDef } from "@tanstack/vue-table";
import JsonCell from "./JsonCell.vue";

const columnHelper = createColumnHelper<any>();
export function genColumnDefs(
	schema: JsonSchema7,
	renderers: JsonFormsRendererRegistryEntry[],
	prefix: string = "",
): ColumnDef<any, any>[] {
	const columns = getColumnsBySchema(schema);

	return columns.map((column) => {
		const accessorKey = prefix ? `${prefix}.${column}` : column;
		const columnSchema = getColumnSchema(schema, column);
		const uischema: ControlElement = {
			type: "Control",
			scope: "#",
			label: false,
		};

		return columnHelper.accessor(accessorKey, {
			header: column,
			cell: ({ getValue }) => {
				const cellValue = getValue();
				return h(
					"div",
					{ class: "relative" },
					h(JsonCell, {
						data: cellValue,
						schema: columnSchema,
						uischema: uischema,
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

function getColumnSchema(schema: JsonSchema7, column: string): JsonSchema7 {
	if (schema.type === "object" && typeof schema.properties === "object" && column) {
		const propertySchema = schema.properties[column];
		if (propertySchema && typeof propertySchema === "object" && !Array.isArray(propertySchema)) {
			return propertySchema as JsonSchema7;
		}
	}
	// primitives or unknown property
	return schema;
}
