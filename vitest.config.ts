import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

/** Stub out .vue files so pure-logic unit tests don't need @vitejs/plugin-vue */
function stubVuePlugin(): Plugin {
  return {
    name: 'stub-vue',
    transform(_code, id) {
      if (id.endsWith('.vue')) {
        return { code: 'export default {}', map: null }
      }
    },
  }
}

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [stubVuePlugin()],
        test: {
          name: 'unit',
          include: ['test/unit/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
    },
  },
})
