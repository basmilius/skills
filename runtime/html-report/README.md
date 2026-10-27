# html-report runtime

The source of the runtime that the `html-report` skill builds into every report. It
is not part of the installed skill; only its output in `skills/html-report/assets` is.

- `src/report.jsx`, `src/report.css`: the report components and their styles.
- `src/icons.jsx`: the Lucide icons of a report, registered as SVG markup by the build.
- `src/client.jsx`: the modules a report imports in the browser, and the hydration.
- `src/server.jsx`: the same modules for Bun, the render to HTML and the markup of
  every Lucide icon.
- `build.ts`: bundles `assets/runtime.js` (browser) and `assets/server.js` (Bun), and
  compiles `assets/runtime.css` with Tailwind.

After a change here, run `bun install && bun run build` in this folder, rebuild the
examples with `bun ../../skills/html-report/scripts/build.ts <example.tsx>`, and
commit the updated assets. Reports built earlier keep the runtime they were built
with.
