---
purpose: "Reference for OFD's command-line interface — build commands, flags, and what each command produces."
position: "Docs > Reference > CLI"
heading: "CLI Reference"
nav:
  label: "CLI"
  order: 17
description: "One Front Door CLI commands: build, dev, and audit. What they do, what they produce, and what they check."
voice: "warm"
schema: "WebPage"
---

<section id="overview" aria-label="Overview">

OFD's CLI is minimal by design. Three commands. No flags you need to memorize. The build does the right thing by default.

</section>

<section id="build" aria-labelledby="build-heading">

## bun run build {#build-heading}

The primary command. Processes all pages, runs the habitability audit, generates wayfinding artifacts, and writes output to `dist/`.

```bash
bun run build
```

**What it does, in order:**

1. Loads `ofd.config.js`
2. Loads all `.ofd` room files from `src/rooms/`
3. Discovers all `.md` files in `src/pages/`
4. For each page: validates frontmatter, processes room directives, parses markdown, applies layout
5. Runs the 9-point habitability audit on each rendered page
6. If any page fails an error-level check, the build stops
7. Generates `llms.txt`, `sitemap.xml`, and `habitability.json`
8. Copies `public/` assets to `dist/`

**Exit codes:**

- `0` — All pages built and habitable
- `1` — Build failed (frontmatter validation error, room error, or habitability audit failure)

**Output:**

```
dist/
├── index.html              # Each page as semantic HTML
├── about/index.html        # Nested paths become directories
├── llms.txt                # Auto-generated lobby map
├── sitemap.xml             # Auto-generated sitemap
├── habitability.json       # Audit report
└── style.css               # Copied from public/
```

</section>

<section id="dev" aria-labelledby="dev-heading">

## bun run dev {#dev-heading}

Development server. Rebuilds on file changes and serves from `dist/`.

```bash
bun run dev
```

Runs the full build pipeline on every change. The habitability audit still runs — you see failures in real time, not just at deploy.

</section>

<section id="audit" aria-labelledby="audit-heading">

## bun run audit {#audit-heading}

Runs only the habitability audit against already-built pages in `dist/`. Useful for CI/CD pipelines where you want to check habitability without rebuilding.

```bash
bun run audit
```

Reports the same 9 checks as the build, with the same pass/fail semantics.

</section>

<section id="project-structure" aria-labelledby="structure-heading">

## Expected Project Structure {#structure-heading}

The CLI expects this layout:

```
your-project/
├── src/
│   ├── pages/          # .md content files (required)
│   ├── rooms/          # .ofd component files (optional)
│   ├── layouts/        # HTML layout templates (required)
│   │   └── default.html
│   └── lib/            # Framework internals
├── public/             # Static assets, copied to dist/ (optional)
├── ofd.config.js       # Site configuration (optional)
└── dist/               # Build output (generated)
```

The only hard requirements are `src/pages/` with at least one `.md` file and `src/layouts/default.html`.

</section>
