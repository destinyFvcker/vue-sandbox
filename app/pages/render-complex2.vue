<script setup lang="ts">
  import { tanstackRenderers } from "~/components/Tanstack/Renderer";
  import { genColumnDefs } from "~/components/Tanstack/Renderer/genColumnDef";
  import type { JsonSchema7 } from "@jsonforms/core";
  import type { ColumnDef } from "@tanstack/vue-table";

  import data from "../../rust-schemars-gen/mock/complex_struct_2.json";
  import schema from "../../rust-schemars-gen/mock/complex_struct_2.schema.json";

  const { columns, arrayEntries } = genColumnDefs(
    schema as unknown as JsonSchema7,
    tanstackRenderers
  );
</script>

<template>
  <div class="h-screen">
    <UiSplitter direction="horizontal">
      <UiSplitterPanel :default-size="60" :min-size="30">
        <div class="h-full overflow-auto p-2">
          <TanstackTableShellForms
            :data="data"
            :columns="columns as ColumnDef<any, any>[]"
            :array-entries="arrayEntries"
            :renderers="tanstackRenderers"
          />
        </div>
      </UiSplitterPanel>
      <UiSplitterHandle with-handle />
      <UiSplitterPanel :default-size="40" :min-size="20">
        <UiSplitter direction="vertical" class="h-full">
          <UiSplitterPanel :default-size="50" :min-size="20">
            <div class="bg-muted/40 h-full overflow-auto p-4">
              <h3 class="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Schema
              </h3>
              <pre class="text-xs leading-relaxed">{{ JSON.stringify(schema, null, 2) }}</pre>
            </div>
          </UiSplitterPanel>
          <UiSplitterHandle with-handle />
          <UiSplitterPanel :default-size="50" :min-size="20">
            <div class="bg-primary/5 h-full overflow-auto p-4">
              <h3 class="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                Data
              </h3>
              <pre class="text-xs leading-relaxed">{{ JSON.stringify(data, null, 2) }}</pre>
            </div>
          </UiSplitterPanel>
        </UiSplitter>
      </UiSplitterPanel>
    </UiSplitter>
  </div>
</template>
