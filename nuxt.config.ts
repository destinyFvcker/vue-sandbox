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
  ],

  vite: {
    build: {
      modulePreload: { polyfill: false },
    },
    optimizeDeps: {
      include: [
        "@jsonforms/core",
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "datatables.net",
        "datatables.net-buttons-dt",
        "datatables.net-buttons/js/buttons.colVis.mjs",
        "datatables.net-buttons/js/buttons.html5.mjs",
        "datatables.net-buttons/js/buttons.print.mjs",
        "datatables.net-colreorder-dt",
        "datatables.net-dt",
        "datatables.net-fixedcolumns-dt",
        "datatables.net-fixedheader-dt",
        "datatables.net-responsive-dt",
        "datatables.net-searchbuilder-dt",
        "datatables.net-select-dt",
        "datatables.net-vue3",
        "jszip",
        "reka-ui",
        "tailwind-variants",
      ],
    },
    plugins: [tailwindcss()],
  },

  hooks: {
    "prerender:routes"({ routes }) {
      routes.clear(); // Do not generate any routes (except the defaults)
    },
  },

  imports: {
    imports: [
      {
        from: "tailwind-variants",
        name: "tv",
      },
      {
        from: "tailwind-variants",
        name: "VariantProps",
        type: true,
      },
    ],
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
      script: [{
        src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/pdfmake.min.js",
        defer: true,
      }, {
        src: "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.12/vfs_fonts.min.js",
        defer: true,
      }],
    },
  },
});
