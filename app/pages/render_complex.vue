<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import TableShellClient from "~/components/table/TableShellClient.vue";
import { tanstackRenderers } from "~/components/tanstack";
import { genColumnDefs } from "~/components/tanstack/genColumnDef";

const data = [
	{
		myNumber: -1589263114,
		myBool: true,
		myNullableEnum: null,
	},
	{
		myNumber: -303859075,
		myBool: true,
		myNullableEnum: "7lLt2B8zzH",
	},
	{
		myNumber: 491671718,
		myBool: false,
		myNullableEnum: null,
	},
	{
		myNumber: 1921366571,
		myBool: true,
		myNullableEnum: null,
	},
	{
		myNumber: 982230932,
		myBool: false,
		myNullableEnum: null,
	},
	{
		myNumber: 911122495,
		myBool: false,
		myNullableEnum: {
			floats: [0.13471776, 0.6564285, 0.92038316, 0.5272476, 0.03654027, 0.6114647, 0.52285737],
		},
	},
	{
		myNumber: -1932979671,
		myBool: true,
		myNullableEnum: null,
	},
	{
		myNumber: 1121765007,
		myBool: true,
		myNullableEnum: null,
	},
	{
		myNumber: -2097025908,
		myBool: false,
		myNullableEnum: "ld48ajb3VN9qC",
	},
	{
		myNumber: -72799489,
		myBool: false,
		myNullableEnum: null,
	},
];

const schema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "MyStruct",
	type: "object",
	properties: {
		myBool: {
			type: "boolean",
		},
		myNullableEnum: {
			anyOf: [
				{
					$ref: "#/definitions/MyEnum",
				},
				{
					type: "null",
				},
			],
			default: null,
			"x-shadcn-variant": "tabs",
		},
		myNumber: {
			type: "integer",
			format: "int32",
		},
	},
	additionalProperties: false,
	required: ["myNumber", "myBool"],
	definitions: {
		MyEnum: {
			anyOf: [
				{
					type: "string",
				},
				{
					type: "object",
					properties: {
						floats: {
							type: "array",
							items: {
								type: "number",
								format: "float",
							},
						},
					},
					required: ["floats"],
				},
			],
		},
	},
};

const columns = Object.freeze(genColumnDefs(schema, tanstackRenderers));
</script>

<template>
	<TableShellClient :data="data" :columns="columns as ColumnDef<any, any>[]" />
</template>
