<script setup lang="ts">
  import type { DatatableExampleDefinition } from "~/lib/datatable-examples";

  defineProps<{
    example: DatatableExampleDefinition;
  }>();
</script>

<template>
  <main class="mx-auto min-h-screen w-full max-w-7xl p-4 md:p-8">
    <header class="mb-8">
      <NuxtLink
        to="/"
        class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        返回示例索引
      </NuxtLink>
      <div class="mt-5 flex items-start gap-4">
        <div class="bg-muted flex size-11 shrink-0 items-center justify-center rounded-xl border">
          <Icon :name="example.icon" class="size-5" />
        </div>
        <div>
          <p class="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {{ example.group }} · UiDatatable
          </p>
          <h1 class="mt-1 text-3xl font-bold tracking-tight">{{ example.title }}</h1>
          <p class="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            {{ example.description }}
          </p>
        </div>
      </div>
    </header>

    <section
      :aria-label="`${example.title} 示例`"
      class="bg-card rounded-xl border p-4 shadow-sm md:p-6"
      data-testid="datatable-example"
    >
      <slot />
    </section>
  </main>
</template>
