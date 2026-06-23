import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  experimental: {
    payloadExtraction: "client",
  },

  ssr: false,

  modules: [
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/test-utils",
    "@nuxtjs/color-mode",
    "motion-v/nuxt",
    "@vueuse/nuxt",
    "@nuxt/icon",
    "@nuxt/fonts",
    "vue-sonner/nuxt"
  ],

  vite: {
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "reka-ui",
        "tailwind-variants",
        "datatables.net",
        "datatables.net-vue3",
        "jszip", // CJS
        "datatables.net-buttons",
        "datatables.net-buttons/js/buttons.colVis.mjs",
        "datatables.net-buttons/js/buttons.html5.mjs",
        "datatables.net-buttons/js/buttons.print.mjs",
        "datatables.net-colreorder",
        "datatables.net-fixedcolumns",
        "datatables.net-fixedheader",
        "datatables.net-responsive",
        "datatables.net-searchbuilder",
        "datatables.net-select",
        "@faker-js/faker",
        "@tanstack/vue-table",
        "lodash-es",
      ],
    },
    build: {
      modulePreload: { polyfill: false },
    },
    plugins: [tailwindcss()],
  },

  hooks: {
    "prerender:routes"({ routes }) {
      routes.clear(); // Do not generate any routes (except the defaults)
    },
  },

  imports: {
    imports: [{
      from: "tailwind-variants",
      name: "tv",
    }, {
      from: "tailwind-variants",
      name: "VariantProps",
      type: true,
    }, {
      from: "vue-sonner",
      name: "toast",
      as: "useSonner",
    }],
  },

  colorMode: {
    storageKey: "vue-sandbox-color-mode",
    classSuffix: "",
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 0,
    },

    mode: "svg",
    class: "shrink-0",
    fetchTimeout: 2000,
    serverBundle: "local",
  },

  css: ["~/assets/css/tailwind.css"],

  app: {
    head: {
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js",
          defer: true,
        },
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.min.js",
          defer: true,
        },
      ],
    },
  },
});