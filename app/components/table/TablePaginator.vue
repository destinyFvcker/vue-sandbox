<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "~/lib/utils";

const model = defineModel<{
	pageIndex: number;
	pageSize: number;
}>({
	required: true,
});

const {
	totalCnt,
	siblingCnt = 4,
	position = "center",
	class: ClassName,
} = defineProps<{
	totalCnt: number;
	siblingCnt?: number;
	position?: "center" | "start" | "end";
	class?: HTMLAttributes["class"];
}>();

const paginIndexInput = ref(model.value.pageIndex.toString());

watch(
	() => model.value.pageIndex,
	(newVal) => {
		paginIndexInput.value = newVal.toString();
	},
);
</script>

<template>
	<div :class="cn('relative', ClassName)">
		<div
			:class="
				cn(
					'flex flex-wrap items-center justify-center gap-2',
					position === 'start' && 'justify-start',
					position === 'end' && 'justify-end',
				)
			"
		>
			<Select :multiple="false" v-model="model.pageSize">
				<SelectTrigger class="h-8! w-fit cursor-pointer transition hover:scale-105">{{
					model.pageSize
				}}</SelectTrigger>
				<SelectContent>
					<SelectItem value="100">100</SelectItem>
					<SelectItem value="200">200</SelectItem>
					<SelectItem value="300">300</SelectItem>
					<SelectItem value="400">400</SelectItem>
					<SelectItem value="500">500</SelectItem>
				</SelectContent>
			</Select>

			<div class="max-w-full overflow-x-auto">
				<Pagination
					v-slot="{ page }"
					v-model:page="model.pageIndex"
					:items-per-page="model.pageSize"
					:total="totalCnt"
					:default-page="model.pageIndex"
					:sibling-count="siblingCnt"
					:show-edges="true"
				>
					<PaginationContent v-slot="{ items }">
						<PaginationPrevious />
						<template v-for="(item, index) in items" :key="index">
							<PaginationItem
								v-if="item.type === 'page'"
								:value="item.value"
								:is-active="item.value === page"
							>
								{{ item.value }}
							</PaginationItem>
							<PaginationEllipsis
								v-else
								:key="item.type"
								:index="index"
								class="w-9 h-9 flex items-center justify-center"
							>
								&#8230;
							</PaginationEllipsis>
						</template>
						<PaginationNext />
					</PaginationContent>
				</Pagination>
			</div>
			<Input
				type="number"
				v-model="paginIndexInput"
				class="w-16 px-0! text-center"
				@keydown.enter="
					() => {
						const parsed = Number.parseInt(paginIndexInput);
						model.pageIndex = parsed > 0 ? parsed : 1;
					}
				"
				@blur="
					() => {
						paginIndexInput = model.pageIndex.toString();
					}
				"
			/>
		</div>
	</div>
</template>
