<script setup lang="ts">
  import { and, isStringControl, rankWith, schemaMatches } from "@jsonforms/core";
  import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
  import { defineComponent, h } from "vue";
  import type { ControlElement, JsonFormsRendererRegistryEntry, JsonSchema } from "@jsonforms/core";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Config } from "datatables.net";

  interface DemoRow {
    id: number;
    profile: {
      name: string;
      region: string;
    };
    status: "active" | "review" | "paused";
    amount: number;
    verified: boolean;
    note: string | number | null;
    history: Array<{
      date: string;
      amount: number;
    }>;
    tags: string[];
  }

  useHead({ title: "JSON Schema DataTable Demo" });

  const schema: JsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Customer ledger",
    properties: {
      id: { type: "integer", title: "ID" },
      profile: { $ref: "#/$defs/Profile" },
      status: {
        type: "string",
        title: "Status",
        format: "status-badge",
        enum: ["active", "review", "paused"],
      },
      amount: { type: "number", title: "Amount" },
      verified: { type: "boolean", title: "Verified" },
      note: {
        title: "Note",
        anyOf: [{ type: "string" }, { type: "integer" }, { type: "null" }],
      },
      history: {
        type: "array",
        title: "History",
        items: { $ref: "#/$defs/HistoryItem" },
      },
      tags: {
        type: "array",
        title: "Tags",
        items: { type: "string", title: "Tag" },
      },
    },
    required: ["id", "profile", "status", "amount", "verified", "history", "tags"],
    $defs: {
      BaseProfile: {
        type: "object",
        properties: {
          name: { type: "string", title: "Customer" },
        },
        required: ["name"],
      },
      Profile: {
        allOf: [
          { $ref: "#/$defs/BaseProfile" },
          {
            type: "object",
            properties: {
              region: { type: "string", title: "Region" },
            },
            required: ["region"],
          },
        ],
      },
      HistoryItem: {
        type: "object",
        properties: {
          date: { type: "string", title: "Date", format: "date" },
          amount: { type: "number", title: "Amount" },
        },
        required: ["date", "amount"],
      },
    },
  };

  const statuses: DemoRow["status"][] = ["active", "review", "paused"];
  const rows = ref<DemoRow[]>(
    Array.from({ length: 12 }, (_, index) => {
      const id = index + 1;
      return {
        id,
        profile: {
          name: `Customer ${String(id).padStart(2, "0")}`,
          region: ["Shanghai", "Singapore", "London"][index % 3]!,
        },
        status: statuses[index % statuses.length]!,
        amount: 1250.5 + index * 317.25,
        verified: index % 2 === 0,
        note: index % 4 === 0 ? null : index % 2 === 0 ? id * 10 : `Priority ${id}`,
        history: [
          { date: `2026-0${(index % 9) + 1}-01`, amount: 100 + index * 10 },
          { date: `2026-0${(index % 9) + 1}-15`, amount: 150 + index * 10 },
        ],
        tags: index % 2 === 0 ? ["priority", "verified"] : ["standard"],
      };
    })
  );

  const StatusCell = defineComponent({
    name: "DemoStatusCell",
    props: {
      ...rendererProps<ControlElement>(),
    },
    setup(rendererInput) {
      const { control } = useJsonFormsControl(rendererInput);
      return () =>
        h(
          "span",
          {
            class:
              "inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary",
          },
          String(control.value.data ?? "—")
        );
    },
  });

  const renderers: JsonFormsRendererRegistryEntry[] = [
    {
      tester: rankWith(
        5,
        and(
          isStringControl,
          schemaMatches((candidate) => candidate.format === "status-badge")
        )
      ),
      renderer: StatusCell,
    },
  ];

  const options: Config = {
    pageLength: 5,
    lengthMenu: [5, 10, 25],
    order: [[1, "asc"]],
    responsive: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    id: { width: "4rem" },
    amount: { className: "dt-body-right" },
  };

  const addRow = () => {
    const id = rows.value.length + 1;
    rows.value.push({
      id,
      profile: { name: `Added Customer ${id}`, region: "Beijing" },
      status: "active",
      amount: 9999.99,
      verified: true,
      note: "Added reactively",
      history: [{ date: "2026-07-14", amount: 9999.99 }],
      tags: ["new", "reactive"],
    });
  };
</script>

<template>
  <main class="mx-auto min-h-screen max-w-7xl space-y-6 p-4 md:p-8">
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <NuxtLink to="/" class="text-muted-foreground hover:text-foreground text-sm">
          ← Back
        </NuxtLink>
        <h1 class="mt-2 text-3xl font-bold tracking-tight">JSON Schema DataTable</h1>
        <p class="text-muted-foreground mt-2 max-w-3xl text-sm">
          Columns and read-only Vue cells are generated from JSON Schema; DataTables owns the table
          body, search, ordering, and pagination.
        </p>
      </div>
      <UiButton data-testid="add-row" icon="lucide:plus" @click="addRow">
        Add reactive row
      </UiButton>
    </header>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Customer ledger</UiCardTitle>
        <UiCardDescription>
          Expand a row to inspect object and primitive arrays in nested schema tables.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent data-testid="schema-datatable-demo">
        <UiSchemaDatatable
          :schema="schema"
          :data="rows"
          :renderers="renderers"
          :options="options"
          :column-overrides="columnOverrides"
        />
      </UiCardContent>
    </UiCard>
  </main>
</template>
