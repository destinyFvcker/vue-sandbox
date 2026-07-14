<script setup lang="ts">
  import BadgeIcons from "~/components/DatatableExamples/BadgeIcons.vue";
  import ColumnReorder from "~/components/DatatableExamples/ColumnReorder.vue";
  import CustomComponent from "~/components/DatatableExamples/CustomComponent.vue";
  import Dense from "~/components/DatatableExamples/Dense.vue";
  import Dom from "~/components/DatatableExamples/Dom.vue";
  import ExampleShell from "~/components/DatatableExamples/ExampleShell.vue";
  import FixedColumns from "~/components/DatatableExamples/FixedColumns.vue";
  import Image from "~/components/DatatableExamples/Image.vue";
  import Layout from "~/components/DatatableExamples/Layout.vue";
  import Pagination from "~/components/DatatableExamples/Pagination.vue";
  import RawPerformance from "~/components/DatatableExamples/RawPerformance.vue";
  import SchemaPerformance from "~/components/DatatableExamples/SchemaPerformance.vue";
  import SearchSort from "~/components/DatatableExamples/SearchSort.vue";
  import Selectable from "~/components/DatatableExamples/Selectable.vue";
  import SimpleVariant from "~/components/DatatableExamples/SimpleVariant.vue";
  import { datatableExamples } from "~/lib/datatable-examples";
  import type { Component } from "vue";

  interface ExampleComponent {
    component: Component;
    props?: Record<string, unknown>;
  }

  const components: Record<string, ExampleComponent> = {
    dom: { component: Dom },
    "custom-component": { component: CustomComponent },
    layout: { component: Layout },
    "raw-performance": { component: RawPerformance },
    "schema-performance": { component: SchemaPerformance },
    simple: { component: SimpleVariant, props: { variant: "simple" } },
    image: { component: Image },
    "no-horizontal": { component: SimpleVariant, props: { variant: "no-horizontal" } },
    striped: { component: SimpleVariant, props: { variant: "striped" } },
    "vertical-lines": { component: SimpleVariant, props: { variant: "vertical-lines" } },
    dense: { component: Dense },
    "row-selection": { component: Selectable, props: { variant: "row-selection" } },
    card: { component: Selectable, props: { variant: "card" } },
    "sticky-header": { component: Selectable, props: { variant: "sticky-header" } },
    "badge-icons": { component: BadgeIcons },
    "search-sort": { component: SearchSort },
    "fixed-columns": { component: FixedColumns },
    "column-reorder": { component: ColumnReorder },
    pagination: { component: Pagination },
  };

  const route = useRoute();
  const slug = String(route.params.slug ?? "");
  const example = datatableExamples.find((candidate) => candidate.slug === slug);
  const entry = components[slug];

  if (!example || !entry) {
    throw createError({
      statusCode: 404,
      statusMessage: "DataTable example not found",
    });
  }

  useHead({ title: `${example.title} · DataTable Examples` });
</script>

<template>
  <ExampleShell :example="example">
    <component :is="entry.component" v-bind="entry.props ?? {}" />
  </ExampleShell>
</template>
