import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import type { JsonSchema } from "@jsonforms/core";

vi.mock("datatables.net", () => ({ default: vi.fn() }));
vi.mock("datatables.net-vue3", async () => {
  const { defineComponent, h } = await import("vue");
  const FakeDataTable = defineComponent({
    name: "FakeDataTable",
    inheritAttrs: false,
    props: {
      columns: { type: Array, default: () => [] },
      data: { type: Array, default: () => [] },
    },
    setup(props, { attrs, expose, slots }) {
      const dt = { row: vi.fn() };
      expose({ dt });

      return () =>
        h("table", { ...attrs, class: "dataTable" }, [
          h(
            "thead",
            h(
              "tr",
              props.columns.map((column) =>
                h("th", String((column as { title?: string }).title ?? ""))
              )
            )
          ),
          h(
            "tbody",
            props.data.map((rowData, rowIndex) =>
              h(
                "tr",
                props.columns.map((column, colIndex) => {
                  const render = (column as { render?: unknown }).render;
                  const display =
                    render && typeof render === "object" && "display" in render
                      ? (render as { display?: unknown }).display
                      : undefined;
                  const slotName =
                    typeof display === "string" && display.startsWith("#")
                      ? display.slice(1)
                      : undefined;

                  return h(
                    "td",
                    slotName ? slots[slotName]?.({ colIndex, rowData, rowIndex }) : undefined
                  );
                })
              )
            )
          ),
        ]);
    },
  }) as ReturnType<typeof defineComponent> & { use: (library: unknown) => void };
  FakeDataTable.use = () => undefined;
  return { default: FakeDataTable };
});
vi.mock("datatables.net-buttons-dt", () => ({}));
vi.mock("datatables.net-buttons/js/buttons.colVis.mjs", () => ({}));
vi.mock("datatables.net-buttons/js/buttons.html5.mjs", () => ({}));
vi.mock("datatables.net-buttons/js/buttons.print.mjs", () => ({}));
vi.mock("datatables.net-responsive-dt", () => ({}));
vi.mock("datatables.net-searchbuilder-dt", () => ({}));
vi.mock("datatables.net-select-dt", () => ({}));
vi.mock("datatables.net-fixedcolumns-dt", () => ({}));
vi.mock("datatables.net-fixedheader-dt", () => ({}));
vi.mock("datatables.net-colreorder-dt", () => ({}));

describe("UiSchemaDatatable", () => {
  it("mounts generated headers, emits the API, and reacts to local data", async () => {
    const { h } = await import("vue");
    const { default: UiSchemaDatatable } =
      await import("../../app/components/Ui/SchemaDatatable.client.vue");
    const schema: JsonSchema = {
      type: "object",
      properties: {
        name: { type: "string", title: "Person" },
        score: { type: "number" },
      },
    };
    const wrapper = await mountSuspended(UiSchemaDatatable, {
      props: {
        schema,
        data: [{ name: "Ada", score: 42 }],
        options: {
          info: false,
          paging: false,
          searching: false,
        },
        cellSlots: { score: "score-value" },
      },
      attrs: { "data-testid": "schema-wrapper" },
      slots: {
        "score-value": ({ cellData }: { cellData: unknown }) =>
          h("strong", { "data-testid": "custom-score" }, `Score: ${cellData}`),
      },
    });

    await flushPromises();

    expect(wrapper.find("table.dataTable").exists()).toBe(true);
    expect(wrapper.find("table[data-ui-schema-datatable]").exists()).toBe(true);
    expect(wrapper.find("table[data-testid='schema-wrapper']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Person");
    expect(wrapper.text()).toContain("Ada");
    expect(wrapper.get("[data-testid='custom-score']").text()).toBe("Score: 42");
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBeTruthy();

    await wrapper.setProps({ data: [{ name: "Grace", score: 99 }] });
    await flushPromises();

    expect(wrapper.text()).toContain("Grace");
    expect(wrapper.get("[data-testid='custom-score']").text()).toBe("Score: 99");
    expect(wrapper.text()).not.toContain("Ada");
  });
});
