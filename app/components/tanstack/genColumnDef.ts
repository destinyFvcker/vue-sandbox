import {
	createLabelDescriptionFrom,
	decode,
	type ControlElement,
	type JsonFormsRendererRegistryEntry,
	type JsonSchema,
	type JsonSchema7,
} from "@jsonforms/core";
import { createColumnHelper, type ColumnDef } from "@tanstack/vue-table";
import JsonCell from "./JsonCell.vue";
import { collectSchemaEntries } from "~/lib/schema-resolver";
import TableTipHeader from "../table/TableTipHeader.vue";
import TableEmptyCell from "../table/TableEmptyCell.vue";
import { startCase } from "lodash";

const dumpControlElement: ControlElement = {
	type: "Control",
	scope: "#",
};

const deriveLabel = (controlElement: ControlElement, schemaElement?: JsonSchema): string => {
	if (schemaElement && typeof schemaElement.title === "string") {
		return schemaElement.title;
	}
	if (typeof controlElement.scope === "string") {
		const ref = controlElement.scope;
		const label = decode(ref.substr(ref.lastIndexOf("/") + 1));
		return startCase(label);
	}

	return "";
};

const columnHelper = createColumnHelper<any>();

function getNestedValue(obj: any, path: string): unknown {
	const keys = path.split(".");
	let current = obj;
	for (const key of keys) {
		if (current == null) return undefined;
		current = current[key];
	}
	return current;
}

export function genColumnDefs(schema: JsonSchema7, renderers: JsonFormsRendererRegistryEntry[]): ColumnDef<any, any>[] {
	const schemaEntries = collectSchemaEntries(schema);
	console.log(schemaEntries);
	const rootDefinitions = (schema as any).definitions ?? (schema as any).$defs;

	return schemaEntries.map((schemaEntry) => {
		return columnHelper.accessor((row) => getNestedValue(row, schemaEntry.dataPath), {
			id: schemaEntry.dataPath,
			header: () => {
				const header = deriveLabel(dumpControlElement, schemaEntry.schema);
				const { text: description } = createLabelDescriptionFrom(dumpControlElement, schemaEntry.schema);

				return h(TableTipHeader, {
					header: header ? header : schemaEntry.dataPath,
					description: description ? description : "No description available",
				});
			},
			cell: ({ getValue }) => {
				const cellValue = getValue();
				if (cellValue == null) {
					return h("div", { class: "relative" }, h(TableEmptyCell));
				}
				const cellSchema = rootDefinitions
					? { ...schemaEntry.schema, definitions: rootDefinitions }
					: schemaEntry.schema;
				return h(
					"div",
					{ class: "relative" },
					h(JsonCell, {
						data: cellValue,
						schema: cellSchema,
						renderers: renderers,
					}),
				);
			},
		});
	});
}
