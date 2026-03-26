<script setup lang="ts">
  const pages = [
    { path: "/basic-table", label: "Basic Table" },
    { path: "/expandable-table", label: "Expandable Table" },
    { path: "/render-complex", label: "Render Complex" },
    { path: "/render-nested", label: "Render Nested" },
  ];
</script>

<template>
  <div class="mx-auto max-w-xl space-y-4 p-10">
    <h1 class="text-2xl font-bold">Pages</h1>
    <nav class="flex flex-col gap-2">
      <NuxtLink
        v-for="page in pages"
        :key="page.path"
        :to="page.path"
        class="text-primary hover:bg-muted rounded-md border px-4 py-3 transition hover:underline"
      >
        {{ page.label }}
      </NuxtLink>
    </nav>
  </div>
</template>
