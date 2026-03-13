<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import TableShellClient from "~/components/table/TableShellClient.vue";
import { tanstackRenderers } from "~/components/tanstack";
import { genColumnDefs } from "~/components/tanstack/genColumnDef";

const data = [
	{
		name: "John Doe",
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
	{
		name: "Steve Jobs",
		birthDate: "1955-02-24",
		postalCode: "90210",
	},
	{
		name: "Bill Gates",
		birthDate: "1955-10-28",
		postalCode: "90210",
	},
	{
		name: "Elon Musk",
		birthDate: "1971-06-28",
		postalCode: "90210",
	},
];

const schema = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 3,
			description: "Please enter your name",
			i18n: "name",
		},

		birthDate: {
			type: "string",
			format: "date",
			i18n: "birth",
		},
		postalCode: {
			type: "string",
			maxLength: 5,
			i18n: "postal-code",
		},
	},
};
const columns = Object.freeze(genColumnDefs(schema, tanstackRenderers));
</script>

<template>
	<TableShellClient :data="data" :columns="columns as ColumnDef<any, any>[]" />
</template>
