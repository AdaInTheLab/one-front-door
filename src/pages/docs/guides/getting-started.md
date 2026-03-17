---
purpose: "A practical walkthrough for building your first OFD page — from install to habitable output in five minutes."
position: "Docs > Guides > Getting Started"
heading: "Getting Started"
nav:
  label: "Getting Started"
  order: 8
description: "Build your first habitable web page with One Front Door. Install, write, build, ship."
voice: "warm"
schema: "WebPage"
---

<section id="what-youll-build" aria-label="What you will build">

By the end of this guide, you'll have a single page that:

- Passes the 9-point habitability audit
- Generates `llms.txt`, `sitemap.xml`, and `habitability.json` automatically
- Produces semantic HTML with embedded JSON-LD
- Works without JavaScript, works without CSS, works for every mind

Five minutes. Let's go.

</section>

<section id="install" aria-labelledby="install-heading">

## Install {#install-heading}

OFD runs on [Bun](https://bun.sh). If you don't have it:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then clone and install:

```bash
git clone https://github.com/AdaInTheLab/one-front-door.git my-site
cd my-site
bun install
```

</section>

<section id="your-first-page" aria-labelledby="first-page-heading">

## Write Your First Page {#first-page-heading}

Open `src/pages/index.md`. Replace the contents with your own. The only rule: the frontmatter contract must be met.

```yaml
---
purpose: "A personal homepage for someone who makes things."
position: "Home — the front door."
heading: "Jane Doe"
nav:
  label: "Home"
  order: 0
---
```

That's the minimum. Every field is doing real work:

- **`purpose`** — One sentence. What is this room for? The build fails without it.
- **`position`** — Where does this page sit in the building? Used for breadcrumbs and wayfinding.
- **`heading`** — The `<h1>`. The name on the door.
- **`nav.label`** — What the navigation link says. Not the heading — the *sign*.
- **`nav.order`** — Position in the nav. Lower numbers come first.

Below the frontmatter, write your content in markdown:

```markdown
# Jane Doe

I make things for the web. All kinds of minds welcome.

## What I Do

I build software that treats every visitor — human, agent,
screen reader, crawler — as a first-class citizen.

## Say Hello

- [GitHub](https://github.com/janedoe)
- [Email](mailto:jane@example.com)
```

</section>

<section id="build" aria-labelledby="build-heading">

## Build {#build-heading}

```bash
bun run build
```

If the build succeeds, you'll see:

```
▸ One Front Door — Building...

  Found 1 page(s)
  ✓ / → ./dist/index.html
  ✓ llms.txt generated
  ✓ sitemap.xml generated
  ✓ habitability.json generated
  ✓ public/ assets copied

✓ src/pages/index.md — 100%
  ✓ semantic-structure: Page uses semantic HTML elements.
  ✓ section-labels: All sections have accessible labels.
  ✓ heading-hierarchy: Heading hierarchy is correct.
  ...

▸ Built in 42ms. All pages are habitable.
```

If it fails, it tells you exactly what's wrong and why. The error messages teach the philosophy:

- *"purpose is required — every room must answer 'what is this place for?'"*
- *"nav.label is required — a door without a sign is a mystery-meat link."*
- *"Page has no semantic structure — needs article, section, nav, etc."*

Fix what it tells you to fix. Build again. The cycle is the learning.

</section>

<section id="whats-in-dist" aria-labelledby="dist-heading">

## What You Get {#dist-heading}

After a successful build, `dist/` contains:

- **`index.html`** — Your page, wrapped in the layout, with semantic HTML, navigation, and embedded JSON-LD.
- **`llms.txt`** — A lobby map for AI agents, generated from your frontmatter. Agents read this first.
- **`sitemap.xml`** — Standard sitemap for search crawlers.
- **`habitability.json`** — The audit report. Every check that ran, whether it passed, and the overall score.
- **`style.css`** — Your stylesheet, copied from `public/`.

You never write wayfinding files by hand. They're build artifacts — always current, always in sync.

</section>

<section id="next-steps" aria-labelledby="next-heading">

## Next Steps {#next-heading}

- Add more pages in `src/pages/`. Subdirectories become URL paths — `src/pages/about.md` becomes `/about`.
- Read [Content Model](/docs/guides/content-model) to understand the full frontmatter schema.
- Read [Rooms](/docs/guides/rooms) to build semantic components.
- Read [Habitability Report](/docs/guides/habitability-report) to understand what the audit checks.

</section>
