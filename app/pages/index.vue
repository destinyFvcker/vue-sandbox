<script setup lang="ts">
  import { datatableExampleGroups, datatableExamples } from "~/lib/datatable-examples";
  import type { DatatableExampleGroup } from "~/lib/datatable-examples";

  useHead({ title: "DataTable Examples" });

  const groupedExamples = Object.fromEntries(
    datatableExampleGroups.map((group) => [
      group,
      datatableExamples.filter((example) => example.group === group),
    ])
  ) as Record<DatatableExampleGroup, typeof datatableExamples>;
</script>

<template>
  <main class="bg-background min-h-screen">
    <div class="mx-auto w-full max-w-7xl px-4 py-12 md:px-8 md:py-16">
      <header class="max-w-3xl">
        <div
          class="bg-muted/50 text-muted-foreground mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
        >
          <Icon name="lucide:table-properties" class="size-3.5" />
          DataTables 2 · Vue 3 · Nuxt 4
        </div>
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">DataTable 示例索引</h1>
        <p class="text-muted-foreground mt-4 text-base leading-7">
          基于 UiThing DataTable 文档的示例索引，另含 JSON Schema 驱动的动态列、JSON Forms
          单元格、数组子表，以及原始 DataTable 的 10 万行压测。
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <NuxtLink
            to="/schema-datatable"
            class="bg-primary text-primary-foreground inline-flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-opacity hover:opacity-90"
          >
            <Icon name="lucide:braces" class="size-4" />
            JSON Schema DataTable
          </NuxtLink>
          <a
            href="https://uithing.com/components/datatable"
            class="hover:bg-muted inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors"
            rel="noreferrer"
            target="_blank"
          >
            UiThing 原始文档
            <Icon name="lucide:external-link" class="size-4" />
          </a>
        </div>
      </header>

      <section
        class="from-primary/10 via-card to-card mt-12 rounded-2xl border bg-gradient-to-br p-6 shadow-sm md:p-8"
      >
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <div
              class="bg-background flex size-12 shrink-0 items-center justify-center rounded-xl border"
            >
              <Icon name="lucide:braces" class="text-primary size-5" />
            </div>
            <div>
              <p class="text-primary text-xs font-semibold tracking-widest uppercase">Featured</p>
              <h2 class="mt-1 text-xl font-semibold">JSON Schema DataTable</h2>
              <p class="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
                从 JSON Schema 解析嵌套字段、组合类型和数组，生成 DataTables 列并使用 JSON Forms
                renderer 展示只读单元格。
              </p>
            </div>
          </div>
          <NuxtLink
            to="/schema-datatable"
            class="bg-background hover:bg-muted inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium"
          >
            打开示例
            <Icon name="lucide:arrow-right" class="size-4" />
          </NuxtLink>
        </div>
      </section>

      <section
        v-for="group in datatableExampleGroups"
        :key="group"
        class="mt-12"
        :aria-labelledby="`group-${group}`"
      >
        <div class="mb-5 flex items-end justify-between gap-4">
          <div>
            <p class="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              {{ groupedExamples[group].length }} examples
            </p>
            <h2 :id="`group-${group}`" class="mt-1 text-2xl font-semibold tracking-tight">
              {{ group }}
            </h2>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLink
            v-for="example in groupedExamples[group]"
            :key="example.slug"
            :to="`/datatable/${example.slug}`"
            class="group bg-card hover:border-primary/40 rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            :data-testid="`example-link-${example.slug}`"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="bg-muted/50 flex size-10 items-center justify-center rounded-lg border">
                <Icon :name="example.icon" class="size-4.5" />
              </div>
              <Icon
                name="lucide:arrow-up-right"
                class="text-muted-foreground group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
            <h3 class="mt-5 font-semibold">{{ example.title }}</h3>
            <p class="text-muted-foreground mt-2 text-sm leading-6">{{ example.description }}</p>
          </NuxtLink>
        </div>
      </section>

      <footer class="text-muted-foreground mt-16 border-t pt-6 text-sm">
        每个示例都由 UiSchemaDatatable 和 JSON Schema 生成列，并使用独立路由便于调试。
      </footer>
    </div>
  </main>
</template>
