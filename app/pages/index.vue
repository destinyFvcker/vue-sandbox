<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import TableShellClient from "~/components/table/TableShellClient.vue";
import { tanstackRenderers } from "~/components/tanstack";
import { genColumnDefs } from "~/components/tanstack/genColumnDef";

const schema = {
	type: "object",
	properties: {
		name: {
			type: "string",
			minLength: 3,
			description: "Please enter your name",
			i18n: "name",
		},
		vegetarian: {
			type: "boolean",
			i18n: "vegetarian",
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

const data = [
	{
		name: "John Doe",
		vegetarian: false,
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
	{
		name: "John Doe",
		vegetarian: false,
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
	{
		name: "John Doe",
		vegetarian: false,
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
	{
		name: "John Doe",
		vegetarian: false,
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
	{
		name: "John Doe",
		vegetarian: false,
		birthDate: "1985-06-02",
		postalCode: "12345",
	},
];

const columns = Object.freeze(genColumnDefs(schema, tanstackRenderers));

console.log("columns:", columns);
</script>

<template>
	<TableShellClient :data="data" :columns="columns as ColumnDef<any, any>[]" />
</template>
