import { mountSuspended } from "@nuxt/test-utils/runtime";
import { flushPromises } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { h, nextTick } from "vue";
import type { JsonSchema } from "@jsonforms/core";

vi.mock("datatables.net", () => ({ default: vi.fn() }));
vi.mock("datatables.net-vue3", async () => {
  const { defineComponent, h } = await import("vue");

  const readValue = (column: Record<string, unknown>, row: Record<string, unknown>) => {
    const data = column.data;
    if (typeof data === "function") return data(row, "display", undefined, {});
    if (typeof data !== "string") return row;
    return data.split(".").reduce<unknown>((value, segment) => {
      if (value === null || typeof value !== "object") return undefined;
      return (value as Record<string, unknown>)[segment];
    }, row);
  };

  const renderValue = (
    renderer: unknown,
    value: unknown,
    type: string,
    row: Record<string, unknown>,
    meta: Record<string, unknown>
  ) => {
    const selectedRenderer =
      renderer !== null && typeof renderer === "object" && !Array.isArray(renderer)
        ? ((renderer as Record<string, unknown>)[type] ?? (renderer as Record<string, unknown>)._)
        : renderer;

    return typeof selectedRenderer === "function"
      ? selectedRenderer(value, type, row, meta)
      : value;
  };

  const FakeDataTable = defineComponent({
    name: "FakeDataTable",
    inheritAttrs: false,
    props: {
      columns: { type: Array, default: undefined },
      data: { type: Array, default: () => [] },
      options: { type: Object, default: () => ({}) },
    },
    setup(props, { attrs, expose }) {
      const dt = { row: vi.fn(), on: vi.fn(), off: vi.fn() };
      dt.on.mockReturnValue(dt);
      dt.off.mockReturnValue(dt);
      expose({ dt });

      return () => {
        const optionColumns = (props.options as { columns?: Record<string, unknown>[] }).columns;
        const columns = (optionColumns ?? props.columns ?? []) as Record<string, unknown>[];

        return h(
          "table",
          {
            ...attrs,
            class: "dataTable",
            "data-columns-source": optionColumns ? "options" : "prop",
          },
          [
            h(
              "thead",
              h(
                "tr",
                columns.map((column) => h("th", String(column.title ?? "")))
              )
            ),
            h(
              "tbody",
              props.data.map((rawRow, rowIndex) => {
                const row = rawRow as Record<string, unknown>;
                return h(
                  "tr",
                  columns.map((column, colIndex) => {
                    const value = readValue(column, row);
                    const displayed = renderValue(column.render, value, "display", row, {
                      row: rowIndex,
                      col: colIndex,
                      settings: { sTableId: "fake-schema-table" },
                    });
                    const isNode = displayed instanceof Node;

                    return h(
                      "td",
                      {
                        ref: (element) => {
                          if (!(element instanceof HTMLTableCellElement) || !isNode) return;
                          if (displayed.parentNode !== element) element.replaceChildren(displayed);
                        },
                      },
                      isNode || displayed == null ? undefined : String(displayed)
                    );
                  })
                );
              })
            ),
          ]
        );
      };
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
  const schema: JsonSchema = {
    type: "object",
    properties: {
      name: { type: "string", title: "Person" },
      score: { type: "number" },
    },
  };

  it("passes the compiled Config directly, emits ready, and updates data without recompiling", async () => {
    const { default: UiSchemaDatatable } =
      await import("../../app/components/Ui/SchemaDatatable.client.vue");
    const scoreRender = vi.fn((value: unknown, type: string) =>
      type === "display" ? `Score: ${value}` : value
    );
    const wrapper = await mountSuspended(UiSchemaDatatable, {
      props: {
        schema,
        data: [{ name: "Ada", score: 42 }],
        options: { info: false, paging: false, searching: false },
        columnOverrides: { score: { render: scoreRender } },
      },
      attrs: { "data-testid": "schema-wrapper" },
    });

    await flushPromises();

    const firstColumns = wrapper.vm.columns;
    expect(wrapper.get("table.dataTable").attributes("data-columns-source")).toBe("options");
    expect(wrapper.find("table[data-ui-schema-datatable]").exists()).toBe(true);
    expect(wrapper.find("table[data-testid='schema-wrapper']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Person");
    expect(wrapper.text()).toContain("Ada");
    expect(wrapper.text()).toContain("Score: 42");
    expect(wrapper.emitted("ready")?.[0]?.[0]).toBeTruthy();
    expect(wrapper.vm.config.columns).toBe(firstColumns);
    expect(wrapper.vm.columnEntries.map((entry) => entry.dataPath)).toEqual(["name", "score"]);

    scoreRender.mockClear();
    await wrapper.setProps({ data: [{ name: "Grace", score: 99 }] });
    await flushPromises();

    expect(wrapper.vm.columns).toBe(firstColumns);
    expect(wrapper.text()).toContain("Grace");
    expect(wrapper.text()).toContain("Score: 99");
    expect(wrapper.text()).not.toContain("Ada");
    expect(scoreRender).toHaveBeenCalledWith(
      99,
      "display",
      { name: "Grace", score: 99 },
      expect.objectContaining({ row: 0, col: 1 })
    );
    expect(wrapper.findComponent({ name: "JsonForms" }).exists()).toBe(false);
  });

  it("rebuilds the Config and emits ready again for a column revision", async () => {
    const { default: UiSchemaDatatable } =
      await import("../../app/components/Ui/SchemaDatatable.client.vue");
    const wrapper = await mountSuspended(UiSchemaDatatable, {
      props: {
        schema,
        data: [{ name: "Ada", score: 42 }],
        columnPaths: ["name", "score"],
      },
    });
    await flushPromises();
    const firstColumns = wrapper.vm.columns;

    await wrapper.setProps({ columnPaths: ["score", "name"] });
    await flushPromises();

    expect(wrapper.vm.columns).not.toBe(firstColumns);
    expect(wrapper.vm.columns.map((column) => column.name)).toEqual(["score", "name"]);
    expect(wrapper.findAll("th").map((header) => header.text())).toEqual(["Score", "Person"]);
    expect(wrapper.emitted("ready")).toHaveLength(2);
  });

  it("matches displayed fields to leaf-name slots and preserves orthogonal renderers", async () => {
    const { default: UiSchemaDatatable } =
      await import("../../app/components/Ui/SchemaDatatable.client.vue");
    const slotCalls: Array<Record<string, unknown>> = [];
    const hiddenSlot = vi.fn(() => h("span", "hidden"));
    const statusRender = vi.fn((value: unknown, type: string) =>
      type === "filter" ? `search:${value}` : `native:${value}`
    );
    const slottedSchema: JsonSchema = {
      type: "object",
      properties: {
        status: { type: "string" },
        profile: {
          type: "object",
          properties: {
            status: { type: "string" },
            name: { type: "string" },
          },
        },
        hidden: { type: "string" },
      },
    };
    const firstRow = {
      status: "active",
      profile: { status: "pending", name: "Ada" },
      hidden: "not projected",
    };
    const wrapper = await mountSuspended(UiSchemaDatatable, {
      props: {
        schema: slottedSchema,
        data: [firstRow],
        columnPaths: ["status", "profile.status", "profile.name"],
        columnOverrides: { status: { render: statusRender } },
      },
      slots: {
        status: (slotProps: any) => {
          slotCalls.push(slotProps);
          return h(
            "button",
            { "data-testid": `slot-${String(slotProps.columnPath)}` },
            String(slotProps.fieldValue)
          );
        },
        hidden: hiddenSlot,
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.get("[data-testid='slot-status']").text()).toBe("active");
    expect(wrapper.get("[data-testid='slot-profile.status']").text()).toBe("pending");
    expect(wrapper.text()).toContain("Ada");
    expect(hiddenSlot).not.toHaveBeenCalled();

    const statusCall = slotCalls.find((call) => call.columnPath === "status");
    const nestedCall = slotCalls.find((call) => call.columnPath === "profile.status");
    expect(statusCall).toMatchObject({
      cellData: firstRow,
      fieldValue: "active",
      rowData: firstRow,
      rowIndex: 0,
      type: "display",
    });
    expect(nestedCall).toMatchObject({ fieldValue: "pending", rowData: firstRow });

    const statusColumn = wrapper.vm.columns[0] as {
      render: { _: (value: unknown, type: string) => unknown; display: unknown };
    };
    expect(typeof statusColumn.render.display).toBe("function");
    expect(statusColumn.render._("active", "filter")).toBe("search:active");
    expect(typeof wrapper.vm.columns[2]!.render).toBe("function");

    const oldButton = wrapper.get("[data-testid='slot-status']").element;
    await wrapper.setProps({
      data: [
        {
          status: "inactive",
          profile: { status: "approved", name: "Grace" },
          hidden: "still not projected",
        },
      ],
    });
    await flushPromises();
    await nextTick();

    expect(oldButton.isConnected).toBe(false);
    expect(wrapper.get("[data-testid='slot-status']").text()).toBe("inactive");
    expect(wrapper.get("[data-testid='slot-profile.status']").text()).toBe("approved");
    expect(wrapper.text()).toContain("Grace");
  });
});
