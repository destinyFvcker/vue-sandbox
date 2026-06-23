# DataTables typecheck and runtime debugging notes

This note records the debugging process for the DataTables issues seen in this
Nuxt project. It is intentionally specific to this project, pnpm, Vite, and the
DataTables package family.

## Summary

There were two different classes of failures:

1. Typecheck failures from missing direct dependencies and missing DataTables
   plugin type augmentation.
2. Runtime failures from mixing DataTables core runtime packages with `-dt`
   styling wrapper packages.

The final rule is:

- Use non-`-dt` DataTables packages for JavaScript runtime imports.
- Use `-dt` packages only for CSS assets when needed.
- Do not import `datatables.net-buttons-dt/css/buttons.dataTables.css` when the
  project owns the button styling.

## Initial symptoms

Running:

```bash
pnpm run check
```

produced several errors:

```text
npm warn Unknown project config "shamefully-hoist"
npm warn Unknown project config "strict-peer-dependencies"
Need to install the following packages:
vue-tsc@3.3.5
```

Then typecheck reported:

```text
Cannot find module '@vue/language-core'
Cannot find module '@vueuse/core'
Cannot find module 'datatables.net'
Cannot find module 'datatables.net-buttons/js/buttons.html5.mjs'
Object literal may only specify known properties, and 'buttons' does not exist in type 'Config'
```

After fixing typecheck, entering `app/pages/data-table/basic.vue` produced:

```text
500
Cannot set properties of undefined (setting 'pdfMake')
.cache/vite/client/deps/datatables__net-buttons_js_buttons__html5__mjs.js:18:36
```

After a first runtime fix attempt, the page rendered but the Buttons styling
regressed to DataTables default button styles instead of the project shadcn-like
styles.

## Typecheck issue 1: Nuxt fell back to npx vue-tsc

`nuxt typecheck` first tries to resolve local `typescript` and local `vue-tsc`.
If local `vue-tsc` is missing, Nuxt CLI falls back to:

```bash
npx -p vue-tsc -p typescript vue-tsc ...
```

That explains why npm printed warnings for `.npmrc` keys intended for pnpm:

```text
npm warn Unknown project config "shamefully-hoist"
npm warn Unknown project config "strict-peer-dependencies"
```

The warning itself was not the root cause. It was evidence that Nuxt had left the
project-local pnpm dependency graph and was using npm/npx fallback resolution.

Fix:

```bash
pnpm add -D vue-tsc
```

Why this matters:

- Local `vue-tsc` keeps typecheck inside the project dependency graph.
- It avoids a temporary npx-installed `vue-tsc` loading project packages through
  a different module resolution root.

## Typecheck issue 2: pnpm requires direct dependencies

The code directly imports these packages:

```ts
import { reactiveOmit } from "@vueuse/core";
import DataTablesCore from "datatables.net";
import "datatables.net-buttons/js/buttons.html5.mjs";
```

With pnpm, direct imports should be declared as direct dependencies. Relying on a
transitive dependency is unstable because pnpm isolates package dependency trees.

Fix:

```bash
pnpm add @vueuse/core datatables.net datatables.net-buttons
```

Later, runtime imports also required the non-`-dt` extension packages as direct
dependencies:

```bash
pnpm add datatables.net-responsive \
  datatables.net-searchbuilder \
  datatables.net-select \
  datatables.net-fixedcolumns \
  datatables.net-fixedheader \
  datatables.net-colreorder
```

## Typecheck issue 3: DataTables plugin type augmentation

The page imports `Config` from DataTables:

```ts
import type { Config } from "datatables.net";

const options: Config = {
  buttons: ["copy", "csv"],
  select: true,
};
```

`Config` is the TypeScript interface for the DataTables initialization options.
The core `datatables.net` package knows about core options, but plugin options
such as `buttons` and APIs such as `rows().select()` are added by plugin type
declarations.

The plugin packages contain declarations similar to:

```ts
declare module "datatables.net" {
  interface Config {
    buttons?: unknown;
    select?: unknown;
  }
}
```

That is TypeScript module augmentation. It means: find the existing
`datatables.net` module and merge these fields into its exported interfaces.

Fix in `types.d.ts`:

```ts
import "datatables.net-buttons";
import "datatables.net-select";
```

This imports the plugin declaration files for type checking. Because
`types.d.ts` is included by Nuxt's generated tsconfig, the augmentation is
available project-wide.

Important pnpm detail:

The augmentation only works when the plugin augments the same `datatables.net`
instance that the app imports. If `datatables.net-buttons` resolves
`datatables.net@2.3.7` but the app imports `datatables.net@2.3.8`, TypeScript can
treat them as different module instances. Dedupe/direct dependency alignment is
therefore part of the fix.

## Runtime issue: `DataTable.Buttons` was undefined

The runtime error was:

```text
Cannot set properties of undefined (setting 'pdfMake')
```

The failing code in `datatables.net-buttons/js/buttons.html5.mjs` does this at
module evaluation time:

```ts
DataTable.Buttons.pdfMake = function (_) {
  ...
};
```

That line assumes that the Buttons core plugin has already created
`DataTable.Buttons`.

The project originally used JS imports like:

```ts
import "datatables.net-buttons-dt";
import "datatables.net-responsive-dt";
import "datatables.net-select-dt";
```

The `-dt` packages are styling integration wrappers. Their JS entrypoints can
pull in `datatables.net-dt`, which in this project resolved to a different
DataTables runtime package than the app's main `datatables.net` import.

That created a split runtime graph:

- `datatables.net-vue3` used `datatables.net`.
- Some `*-dt` JS wrappers pulled in `datatables.net-dt`.
- Vite prebundled these into separate chunks.
- Buttons could be registered on one DataTable object while
  `buttons.html5.mjs` looked for `DataTable.Buttons` on another.

The result was `DataTable.Buttons === undefined` when `buttons.html5.mjs`
executed.

## Runtime fix: separate JS runtime imports from CSS theme imports

Use non-`-dt` packages for JS runtime:

```ts
import DataTablesCore from "datatables.net";
import DataTable from "datatables.net-vue3";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.colVis.mjs";
import "datatables.net-buttons/js/buttons.html5.mjs";
import "datatables.net-buttons/js/buttons.print.mjs";
import "datatables.net-colreorder";
import "datatables.net-fixedcolumns";
import "datatables.net-fixedheader";
import "datatables.net-responsive";
import "datatables.net-searchbuilder";
import "datatables.net-select";
```

Keep `-dt` packages only for CSS where the project still wants that plugin CSS:

```ts
import "datatables.net-colreorder-dt/css/colReorder.dataTables.css";
import "datatables.net-fixedcolumns-dt/css/fixedColumns.dataTables.css";
import "datatables.net-fixedheader-dt/css/fixedHeader.dataTables.css";
```

Do not import this file if the project owns button styling:

```ts
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
```

That CSS file overrides the custom `.dt-buttons button` styles and causes the
buttons to fall back toward DataTables' default theme.

## Vite optimizeDeps fix

`nuxt.config.ts` should list the same runtime entries that the app actually
imports:

```ts
vite: {
  optimizeDeps: {
    include: [
      "datatables.net",
      "datatables.net-vue3",
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
    ],
  },
}
```

Avoid putting `datatables.net-*-dt` JS entries in `optimizeDeps.include` when the
runtime import path uses non-`-dt` packages.

## Why static import order was not the main fix

It is tempting to think this can be fixed by putting:

```ts
import "datatables.net-buttons";
```

above:

```ts
import "datatables.net-buttons/js/buttons.html5.mjs";
```

That is not a reliable mental model for this issue.

ESM static imports are resolved and evaluated before the importing module's body
runs. Vite also prebundles dependencies into chunks. The important part is not
the visual order of import lines alone; the important part is that every plugin
module imports and mutates the same DataTables runtime singleton.

Unifying runtime imports to non-`-dt` packages solves that.

## Styling regression and fix

The styling regression happened because `buttons.dataTables.css` was added:

```ts
import "datatables.net-buttons-dt/css/buttons.dataTables.css";
```

That file applies DataTables default button styles to `.dt-button`, which
competed with the local shadcn-like rules in `app/components/Ui/Datatable.client.vue`.

Local intended style characteristics:

- height around `36px`
- font size around `14px`
- border radius from project radius variables, around `8px`
- background and border colors from project theme variables

After removing the Buttons default CSS, computed button style returned to:

```text
height: 36px
font-size: 14px
border-radius: 8.4px
```

## Verification checklist

Run typecheck:

```bash
pnpm run check
```

Start the dev server:

```bash
pnpm dev
```

Open the page:

```text
/data-table/basic
```

Verify:

- The page does not show a Nuxt 500 error.
- Browser console has no `Cannot set properties of undefined (setting 'pdfMake')`.
- The table renders.
- Buttons render with local shadcn-like styling, not DataTables default styling.
- The button CSS does not come from `buttons.dataTables.css`.

## Future debugging checklist

When DataTables fails in this project:

1. Check whether the error is typecheck-time or browser runtime-time.
2. For typecheck errors, confirm every direct import is a direct dependency.
3. Confirm `vue-tsc` is installed locally so Nuxt does not fall back to npx.
4. For plugin options such as `buttons` or `select`, confirm plugin type
   augmentation is loaded from `types.d.ts`.
5. Confirm the app and plugins resolve the same `datatables.net` version.
6. For browser runtime errors, inspect whether a `-dt` JS entrypoint is involved.
7. Use non-`-dt` packages for JS runtime imports.
8. Use `-dt` packages only for CSS assets that are intentionally wanted.
9. Do not add DataTables default CSS for UI that already has local theme styles.
10. Keep `vite.optimizeDeps.include` aligned with actual runtime imports.

