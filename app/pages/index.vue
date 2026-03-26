<script setup lang="ts">
import type { ColumnDef } from "@tanstack/vue-table";
import TableShellClient from "~/components/table/TableShellClient.vue";
import { tanstackRenderers } from "~/components/TanstackRenderer";
import { genColumnDefs } from "~/components/TanstackRenderer/genColumnDef";

const data = [
	{
		foo: {
			foo_foo: 537543802,
			foo_bar: "730J5pDtNj2AyMiKq",
			foo_qux: "ywnoXy6ebkrTXTBAryG",
		},
		bar: {
			bar_foo: -2108948213,
			bar_bar: "f4m6PB",
			bar_qux: "eq6oemfBLyVG",
		},
	},
	{
		foo: {
			foo_foo: -1624478677,
			foo_bar: "PYSUWd3IvVJetnj",
			foo_qux: "IVHKSB1wFVYN2e9b",
		},
		bar: {
			bar_foo: 167448755,
			bar_bar: "Gs7BI",
			bar_qux: "yRmZj2S",
		},
	},
	{
		foo: {
			foo_foo: 25297395,
			foo_bar: "VLkv6HUX",
			foo_qux: "c9EUkeNdeaLW2HW1",
		},
		bar: {
			bar_foo: 164233856,
			bar_bar: "xs1wPEpgZ2R6OZ",
			bar_qux: "QCv99gLgAlcCb8p3k",
		},
	},
	{
		foo: {
			foo_foo: 846055807,
			foo_bar: "B5UGKu",
			foo_qux: "FosBx7QPmYzBu7",
		},
		bar: null,
	},
	{
		foo: {
			foo_foo: 1504104133,
			foo_bar: "HeWUqMCgko3",
			foo_qux: "3VQomgBSvGk52HAL",
		},
		bar: null,
	},
];

const schema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	title: "FooBarStruct",
	type: "object",
	properties: {
		bar: {
			anyOf: [
				{
					$ref: "#/definitions/BarStruct",
				},
				{
					type: "null",
				},
			],
		},
		foo: {
			$ref: "#/definitions/FooStruct",
		},
	},
	required: ["foo"],
	definitions: {
		BarStruct: {
			type: "object",
			properties: {
				bar_bar: {
					type: "string",
				},
				bar_foo: {
					type: "integer",
					format: "int32",
				},
				bar_qux: {
					type: "string",
				},
			},
			required: ["bar_foo", "bar_bar", "bar_qux"],
		},
		FooStruct: {
			type: "object",
			properties: {
				foo_bar: {
					type: "string",
				},
				foo_foo: {
					type: "integer",
					format: "int32",
				},
				foo_qux: {
					type: "string",
				},
			},
			required: ["foo_foo", "foo_bar", "foo_qux"],
		},
	},
};

const { columns, arrayEntries } = genColumnDefs(schema, tanstackRenderers);
</script>

<template>
	<TableShellClient
		:data="data"
		:columns="columns as ColumnDef<any, any>[]"
		:array-entries="arrayEntries"
		:renderers="tanstackRenderers"
	/>
</template>
