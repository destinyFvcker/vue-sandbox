<template>
  <div class="m-10 space-y-4 rounded-lg border p-10">
    <div class="text-muted-foreground flex items-center gap-2 text-sm">
      <Icon name="lucide:info" class="size-4" />
      Use the pin menu to choose top, bottom, or unpin.
    </div>

    <div class="flex items-center space-x-2">
      <UiSwitch id="keep-pinned" v-model="keepPinned" />
      <UiLabel for="keep-pinned">Keep/Persist Pinned Rows across Pagination and Filtering</UiLabel>
    </div>

    <div class="flex items-center space-x-2">
      <UiSwitch id="include-leaf-pinned" v-model="includeLeafPinned" />
      <UiLabel for="include-leaf-pinned">Include Leaf Rows When Pinning Parent</UiLabel>
    </div>

    <div class="flex items-center space-x-2">
      <UiSwitch id="include-parent-pinned" v-model="includeParentPinned" />
      <UiLabel for="include-parent-pinned">Include Parent Rows When Pinning Leaf</UiLabel>
    </div>

    <div class="flex items-center space-x-2">
      <UiSwitch id="copy-pinned" v-model="copyPinned" />
      <UiLabel for="copy-pinned">Duplicate/Keep Pinned Rows in main table</UiLabel>
    </div>

    <div class="rounded-lg border p-10">
      <UiTanStackTable
        ref="tableRef"
        :data="data"
        :columns="columns"
        :loading="pending"
        :initial-page-size="500"
        :page-size-options="[500, 1000, 1500, 2000]"
        :inner-scroll="true"
        :inner-scroll-height="windowHeight"
        :inner-scroll-header-sticky="true"
        :keep-pinned="keepPinned"
        :include-leaf-pinned="includeLeafPinned"
        :include-parent-pinned="includeParentPinned"
        :copy-pinned="copyPinned"
        @row-pin="onRowPin"
      >
        <template #expand-cell>
          <!-- The expand button is automatically rendered by the component -->
        </template>

        <template #expanded-row="{ row }">
          <UiDescriptionList class="p-5 sm:grid-cols-[140px_auto]">
            <UiDescriptionListTerm>User ID</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ row.original.id }}</UiDescriptionListDetails>
            <UiDescriptionListTerm>Email</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ row.original.email }}</UiDescriptionListDetails>
            <UiDescriptionListTerm>Role</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ row.original.role }}</UiDescriptionListDetails>
            <UiDescriptionListTerm>Department</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ row.original.department }}</UiDescriptionListDetails>
            <UiDescriptionListTerm>Status</UiDescriptionListTerm>
            <UiDescriptionListDetails>
              <UiBadge
                :variant="row.original.status === 'active' ? 'default' : 'destructive'"
                class="capitalize"
              >
                {{ row.original.status }}
              </UiBadge>
            </UiDescriptionListDetails>
            <UiDescriptionListTerm>Join Date</UiDescriptionListTerm>
            <UiDescriptionListDetails>{{ row.original.joinDate }}</UiDescriptionListDetails>
            <UiDescriptionListTerm v-if="row.original.bio">Bio</UiDescriptionListTerm>
            <UiDescriptionListDetails v-if="row.original.bio" class="whitespace-break-spaces">
              {{ row.original.bio }}
            </UiDescriptionListDetails>
          </UiDescriptionList>
        </template>
      </UiTanStackTable>
    </div>
    <div v-if="pinnedTop.length || pinnedBottom.length" class="bg-muted/50 rounded-lg border p-4">
      <div class="font-semibold">Pinned rows</div>
      <div class="text-muted-foreground mt-2 space-y-1 text-sm">
        <div v-if="pinnedTop.length">Top: {{ pinnedTop.map((r) => r.name).join(", ") }}</div>
        <div v-if="pinnedBottom.length">
          Bottom: {{ pinnedBottom.map((r) => r.name).join(", ") }}
        </div>
      </div>
    </div>

    <pre class="text-xs">{{ JSON.stringify(rowPinning, null, 2) }}</pre>

    <pre>keepPinned: {{ keepPinned }}</pre>
  </div>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import { promiseTimeout } from "@vueuse/core";
  import type { ColumnDef, RowPinningState } from "@tanstack/vue-table";

  const rowPinning = ref<RowPinningState>({});

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: "active" | "inactive";
    joinDate: string;
    bio: string;
  }

  const { height: windowHeight } = useWindowSize();

  const { data, pending } = await useAsyncData<User[]>(
    async () => {
      // Simulate fetching data
      await promiseTimeout(1000);
      // create 20 fake user records
      return Array.from({ length: 100 }, () => ({
        id: faker.string.nanoid(8).toUpperCase(),
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        role: faker.helpers.arrayElement(["Admin", "Member", "Viewer"]),
        department: faker.helpers.arrayElement(["Engineering", "Sales", "Marketing", "Support"]),
        status: faker.helpers.arrayElement(["active", "inactive"]) as "active" | "inactive",
        joinDate: faker.date.past().toLocaleDateString(),
        bio: faker.lorem.paragraph(),
      }));
    },
    { default: () => [] }
  );

  const onRowPin = ({ row, pin }: { row: any; pin: "top" | "bottom" | false }) => {
    console.log("onRowPin", row, pin);
    rowPinning.value = rowPinning.value || {};
    if (pin === false) {
      if (rowPinning.value.top) {
        rowPinning.value.top = rowPinning.value.top.filter((id) => id !== row.id);
      }
      if (rowPinning.value.bottom) {
        rowPinning.value.bottom = rowPinning.value.bottom.filter((id) => id !== row.id);
      }
    } else {
      const section = pin === "top" ? "top" : "bottom";
      const other = pin === "top" ? "bottom" : "top";
      rowPinning.value[section] = [
        ...(rowPinning.value[section] || []).filter((id) => id !== row.id),
        row.id,
      ];
      rowPinning.value[other] = (rowPinning.value[other] || []).filter((id) => id !== row.id);
    }
  };

  const pinnedTop = computed(() => {
    const ids = rowPinning.value.top || [];
    return data.value.filter((user) => ids.includes(user.id));
  });

  const pinnedBottom = computed(() => {
    const ids = rowPinning.value.bottom || [];
    return data.value.filter((user) => ids.includes(user.id));
  });

  const columns: ColumnDef<User>[] = [
    {
      id: "expand",
      header: () => null,
      cell: () => null,
      enableHiding: false,
      enableSorting: false,
      size: 50,
    },
    {
      id: "pin",
      header: () => null,
      cell: () => null,
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => h("span", { class: "font-medium" }, getValue() as string),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => {
        const role = getValue() as string;
        return h(
          "span",
          {
            class: `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              role === "Admin"
                ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                : role === "Member"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
            }`,
          },
          role
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return h(
          "span",
          {
            class: `inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              status === "active"
                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`,
          },
          status.charAt(0).toUpperCase() + status.slice(1)
        );
      },
    },
  ];

  const keepPinned = ref(false);
  const includeLeafPinned = ref(false);
  const includeParentPinned = ref(false);
  const copyPinned = ref(false);
</script>
