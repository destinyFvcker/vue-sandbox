<script setup lang="ts" generic="TData">
import type { HTMLAttributes } from "vue";
import type { ColumnDef, ColumnSort, SortingState } from "@tanstack/vue-table";
import {
	FlexRender,
	getCoreRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useVueTable,
} from "@tanstack/vue-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-vue-next";
import { cn } from "~/lib/utils";

interface Props {
	data: TData[];
	columns: ColumnDef<TData, any>[];
	paginator?: boolean;
	paginSiblingCnt?: number;
	paginatorPosition?: "center" | "start" | "end";
	initSort?: ColumnSort;
	class?: HTMLAttributes["class"];
}

const {
	data,
	columns,
	paginator = false,
	paginatorPosition = "center",
	paginSiblingCnt = 4,
	initSort = null,
	class: className,
} = defineProps<Props>();

const sorting = ref<SortingState>(initSort ? [initSort] : []);
const paginParam = ref({
	pageIndex: 1,
	pageSize: 100,
});

const table = useVueTable({
	get data() {
		return data;
	},
	get columns() {
		return columns;
	},
	state: {
		get sorting() {
			return sorting.value;
		},
		get pagination() {
			return {
				pageIndex: paginParam.value.pageIndex - 1,
				pageSize: paginParam.value.pageSize,
			};
		},
	},
	onSortingChange: (updaterOrValue) => {
		sorting.value = typeof updaterOrValue === "function" ? updaterOrValue(sorting.value) : updaterOrValue;
	},
	onPaginationChange: (updaterOrValue) => {
		const newVal = typeof updaterOrValue === "function" ? updaterOrValue(paginParam.value) : updaterOrValue;
		paginParam.value = {
			pageIndex: newVal.pageIndex + 1,
			pageSize: newVal.pageSize,
		};
	},
	getCoreRowModel: getCoreRowModel(),
	getSortedRowModel: getSortedRowModel(),
	getPaginationRowModel: getPaginationRowModel(),
});
</script>

<template>
	<TablePaginator
		v-if="paginator"
		:model-value="paginParam"
		:total-cnt="data.length"
		:sibling-cnt="paginSiblingCnt"
		:position="paginatorPosition"
	/>
	<!-- <div :class="cn('relative rounded-md border', className)"> -->
	<Table :dClass="cn('relative rounded-md border', className)">
		<TableHeader class="bg-muted [&_th]:bg-muted">
			<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
				<TableHead v-for="header in headerGroup.headers" :key="header.id">
					<button
						class="group flex w-full cursor-pointer items-center justify-center gap-1 rounded-sm px-0 transition select-none hover:bg-slate-500 hover:text-white"
						@click="header.column.getToggleSortingHandler()?.($event)"
						:disabled="!header.column.getCanSort()"
					>
						<FlexRender
							v-if="!header.isPlaceholder"
							:render="header.column.columnDef.header"
							:props="header.getContext()"
						/>

						<ArrowUpNarrowWide
							v-if="header.column.getIsSorted().toString() === 'asc'"
							class="size-4 text-blue-700 group-hover:text-white"
						/>
						<ArrowDownWideNarrow
							v-else-if="header.column.getIsSorted().toString() === 'desc'"
							class="size-4 text-blue-700 group-hover:text-white"
						/>
					</button>
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			<template v-if="table.getRowModel().rows?.length">
				<TableRow
					v-for="row in table.getRowModel().rows"
					:key="row.id"
					:data-state="row.getIsSelected() ? 'selected' : undefined"
				>
					<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
						<FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
					</TableCell>
				</TableRow>
			</template>
			<template v-else>
				<TableRow>
					<TableCell :colspan="columns.length" class="h-24 text-center"> No results. </TableCell>
				</TableRow>
			</template>
		</TableBody>
	</Table>
	<!-- </div> -->
</template>
