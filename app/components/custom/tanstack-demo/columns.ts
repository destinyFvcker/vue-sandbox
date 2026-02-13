import type { ColumnDef } from "@tanstack/vue-table";
import { ArrowUpDown } from "lucide-vue-next";
import { h } from "vue";
import { Checkbox } from "~/components/ui/checkbox";
import { createReusableTemplate } from "@vueuse/core";
import { Button } from "~/components/ui/button";

export interface Payment {
	id: string;
	amount: number;
	status: "pending" | "processing" | "success" | "failed";
	email: string;
}

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	payment: {
		id: string;
	};
	onExpand: () => void;
}>();

const columns: ColumnDef<Payment>[] = [
	{
		id: "select",
		header: ({ table }) =>
			h(Checkbox, {
				modelValue: table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate"),
				"onUpdate:modelValue": (value) => table.toggleAllPageRowsSelected(!!value),
				ariaLabel: "Select all",
			}),
		cell: ({ row }) =>
			h(Checkbox, {
				modelValue: row.getIsSelected(),
				"onUpdate:modelValue": (value) => row.toggleSelected(!!value),
				ariaLabel: "Select row",
			}),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => h("div", { class: "capitalize" }, row.getValue("status")),
	},
	{
		accessorKey: "email",
		header: ({ column }) => {
			return h(
				Button,
				{
					variant: "ghost",
					onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
				},
				() => ["Email", h(ArrowUpDown, { class: "ml-2 h-4 w-4" })],
			);
		},
		cell: ({ row }) => h("div", { class: "lowercase" }, row.getValue("email")),
	},
	{
		accessorKey: "amount",
		header: () => h("div", { class: "text-right" }, "Amount"),
		cell: ({ row }) => {
			const amount = Number.parseFloat(row.getValue("amount"));
			// Format the amount as a dollar amount
			const formatted = new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(amount);
			return h("div", { class: "text-right font-medium" }, formatted);
		},
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const payment = row.original;
			return h(ReuseTemplate, {
				payment,
				onExpand: row.toggleExpanded,
			});
		},
	},
];
