<script setup lang="ts">
  import { demoPersonSchema, personColumnPaths } from "~/lib/datatable-example-schemas";
  import { createDemoPeople, formatCurrency } from "~/lib/datatable-examples";
  import { createSelectRenderer } from "~/lib/datatables.client";
  import type { DemoPerson } from "~/lib/datatable-examples";
  import type { SchemaColumnOverrides } from "~/lib/schema-datatable";
  import type { Api, Config } from "datatables.net";

  interface AjaxRequest {
    draw?: number;
    start?: number;
    length?: number;
    search?: { value?: string };
    order?: Array<{ column: number; dir: "asc" | "desc" }>;
    columns?: Array<{ name?: string }>;
  }

  interface AjaxResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: DemoPerson[];
  }

  const allRows = ref(createDemoPeople(120));
  const table = shallowRef<Api<DemoPerson>>();
  const showDialog = ref(false);
  const draft = reactive({ name: "", email: "", office: "Shanghai" });

  const options: Config = {
    serverSide: true,
    processing: true,
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    pagingType: "full_numbers",
    dom: "<'flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'Bf><'overflow-auto't><'flex flex-col gap-3 border-t p-4 text-sm md:flex-row md:items-center md:justify-between'lip>",
    language: {
      search: "Filter:",
      lengthMenu: "Show _MENU_",
      info: "Showing _START_ to _END_ of _TOTAL_ people",
      processing: "Loading people…",
      paginate: {
        first: "First",
        previous: "Previous",
        next: "Next",
        last: "Last",
      },
    },
    buttons: [
      "colvis",
      "print",
      {
        text: "Add user",
        action: () => {
          showDialog.value = true;
        },
      },
    ],
    select: {
      style: "multi",
      selector: "td:first-child",
    },
  };

  const columnOverrides: SchemaColumnOverrides = {
    __select: {
      searchable: false,
      orderable: false,
      render: createSelectRenderer(),
    },
    balance: { className: "dt-body-right" },
  };

  const ajax: Config["ajax"] = (request, callback) => {
    const query = request as AjaxRequest;
    const search = query.search?.value?.trim().toLowerCase() ?? "";
    const start = query.start ?? 0;
    const length = query.length ?? 5;

    let filtered = allRows.value.filter((row) => {
      if (!search) return true;
      return [row.name, row.email, row.position, row.office, row.status]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    const order = query.order?.[0];
    const columnKey = order ? query.columns?.[order.column]?.name : undefined;
    if (order && typeof columnKey === "string") {
      filtered = [...filtered].sort((left, right) => {
        const leftValue = left[columnKey as keyof DemoPerson];
        const rightValue = right[columnKey as keyof DemoPerson];
        const result =
          typeof leftValue === "number" && typeof rightValue === "number"
            ? leftValue - rightValue
            : String(leftValue).localeCompare(String(rightValue));
        return order.dir === "asc" ? result : -result;
      });
    }

    const response: AjaxResponse = {
      draw: query.draw ?? 0,
      recordsTotal: allRows.value.length,
      recordsFiltered: filtered.length,
      data: filtered.slice(start, start + length),
    };

    window.setTimeout(() => callback(response), 120);
  };

  function onReady(api?: Api<DemoPerson>) {
    table.value = api;
  }

  function addUser() {
    const name = draft.name.trim();
    const email = draft.email.trim();
    if (!name || !email) return;

    const id = Math.max(...allRows.value.map((row) => row.id)) + 1;
    allRows.value = [
      {
        ...createDemoPeople(1)[0]!,
        id,
        name,
        username: email.split("@")[0] ?? name.toLowerCase().replaceAll(" ", "."),
        email,
        office: draft.office,
        location: {
          city: draft.office,
          country: draft.office === "Shanghai" ? "China" : "Singapore",
          flag: draft.office === "Shanghai" ? "🇨🇳" : "🇸🇬",
        },
      },
      ...allRows.value,
    ];
    showDialog.value = false;
    draft.name = "";
    draft.email = "";
    table.value?.ajax.reload(null, false);
  }
</script>

<template>
  <div class="bg-background overflow-hidden rounded-lg border">
    <UiSchemaDatatable
      class="nowrap hover stripe order-column"
      :schema="demoPersonSchema"
      :ajax="ajax"
      :column-paths="personColumnPaths.pagination"
      :column-overrides="columnOverrides"
      :options="options"
      @ready="onReady"
    >
      <template #cell-status="{ cellData }">
        <span
          :class="[
            'rounded-full px-2 py-1 text-xs font-medium',
            cellData === 'Active'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
          ]"
        >
          {{ cellData }}
        </span>
      </template>
      <template #cell-balance="{ cellData }">
        {{ formatCurrency(Number(cellData)) }}
      </template>
    </UiSchemaDatatable>

    <Teleport to="body">
      <div
        v-if="showDialog"
        class="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"
        data-testid="add-user-modal"
        @click.self="showDialog = false"
      >
        <form
          class="bg-background w-full max-w-md rounded-xl border p-6 shadow-2xl"
          @submit.prevent="addUser"
        >
          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold">Add user</h2>
              <p class="text-muted-foreground text-sm">新增后通过 Ajax 协议刷新当前页。</p>
            </div>
            <button
              aria-label="Close dialog"
              class="hover:bg-muted rounded-md p-1.5"
              type="button"
              @click="showDialog = false"
            >
              <Icon name="lucide:x" class="size-4" />
            </button>
          </div>

          <div class="space-y-4">
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium">Name</span>
              <input
                v-model="draft.name"
                required
                class="focus:ring-ring h-10 w-full rounded-md border bg-transparent px-3 outline-none focus:ring-2"
                placeholder="Ada Lovelace"
              />
            </label>
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium">Email</span>
              <input
                v-model="draft.email"
                required
                type="email"
                class="focus:ring-ring h-10 w-full rounded-md border bg-transparent px-3 outline-none focus:ring-2"
                placeholder="ada@example.com"
              />
            </label>
            <label class="block space-y-1.5 text-sm">
              <span class="font-medium">Office</span>
              <select
                v-model="draft.office"
                class="bg-background focus:ring-ring h-10 w-full rounded-md border px-3 outline-none focus:ring-2"
              >
                <option>Shanghai</option>
                <option>Singapore</option>
              </select>
            </label>
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button
              class="hover:bg-muted h-9 rounded-md border px-4 text-sm font-medium"
              type="button"
              @click="showDialog = false"
            >
              Cancel
            </button>
            <button
              class="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium hover:opacity-90"
              type="submit"
            >
              Create user
            </button>
          </div>
        </form>
      </div>
    </Teleport>
  </div>
</template>
