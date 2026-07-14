<script setup lang="ts">
  import type { JsonSchema } from "@jsonforms/core";
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
  }

  useHead({ title: "JSON Schema DataTable Demo" });

  const schema: JsonSchema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    title: "Customer ledger",
    properties: {
      id: { type: "integer", title: "ID" },
      profile: { $ref: "#/definitions/Profile" },
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
    },
    required: ["id", "profile", "status", "amount", "verified"],
    definitions: {
      BaseProfile: {
        type: "object",
        properties: {
          name: { type: "string", title: "Customer" },
        },
        required: ["name"],
      },
      Profile: {
        allOf: [
          { $ref: "#/definitions/BaseProfile" },
          {
            type: "object",
            properties: {
              region: { type: "string", title: "Region" },
            },
            required: ["region"],
          },
        ],
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
      };
    })
  );

  const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const options: Config = {
    pageLength: 5,
    lengthMenu: [5, 10, 25],
    order: [[1, "asc"]],
    responsive: false,
  };

  const columnOverrides: SchemaColumnOverrides = {
    id: { width: "4rem" },
    status: {
      render: (value: unknown, type: string) => {
        if (type !== "display") return value;

        const badge = document.createElement("span");
        badge.className =
          "text-primary bg-primary/10 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase";
        badge.textContent = String(value ?? "—");
        return badge;
      },
    },
    amount: {
      className: "dt-body-right",
      render: (value: unknown, type: string) =>
        type === "display" ? currency.format(Number(value)) : value,
    },
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
          JSON Schema is compiled once into native DataTables columns and renderers; DataTables owns
          the table body, search, ordering, and pagination.
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
          Nested fields, references, variants, and native DOM renderers without per-cell Vue roots.
        </UiCardDescription>
      </UiCardHeader>
      <UiCardContent data-testid="schema-datatable-demo">
        <UiSchemaDatatable
          :schema="schema"
          :data="rows"
          :options="options"
          :column-overrides="columnOverrides"
        />
      </UiCardContent>
    </UiCard>
  </main>
</template>
