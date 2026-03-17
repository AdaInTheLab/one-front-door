---
purpose: "How to read and respond to OFD's habitability report — the audit that blocks your build when pages aren't livable."
position: "Docs > Guides > Habitability Report"
heading: "Habitability Report"
nav:
  label: "Habitability Report"
  order: 13
description: "The OFD habitability audit runs 9 checks on every page. Understand what it checks, what fails the build, and how to fix it."
voice: "warm"
schema: "WebPage"
---

<section id="what-it-is" aria-label="What it is">

Every time you run `bun run build`, OFD audits every rendered page against 9 habitability checks. This isn't a linter. It's a build step. Pages that fail don't ship.

The audit produces two things: terminal output during the build (so you can fix issues immediately) and `habitability.json` in the dist folder (a machine-readable record of every check).

</section>

<section id="the-checks" aria-labelledby="checks-heading">

## The 9 Checks {#checks-heading}

**Errors block the build. Warnings are reported but don't block.**

**1. Semantic Structure** (error) — The page must use semantic HTML elements: `<article>`, `<section>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, or `<main>`. A page with no semantic structure is a room with no shape.

**2. Section Labels** (error) — Every `<section>` element must have `aria-label` or `aria-labelledby`. A section without a label is a room without a name — you can be inside it and not know where you are.

**3. Heading Hierarchy** (error) — Headings must not skip levels. You can't go from `<h2>` to `<h4>` without an `<h3>` in between. The floor plan has gaps.

**4. No Bare Divs** (warning) — `<div>` elements without a `role` attribute are flagged. Divs aren't banned — sometimes you need them for layout. But they should be the exception, and they should declare their purpose with a role.

**5. Link Text** (error) — Links with text like "click here," "learn more," "read more," "here," "link," or "this" fail the audit. Every link is a door, and every door needs a sign.

**6. Image Alt Text** (error) — Images must have alt text that's meaningful. Empty alt, "image," "photo," "picture," and "img" all fail. If an image is genuinely decorative, use `alt=""` with `role="presentation"`.

**7. Single H1** (error) — Each page must have exactly one `<h1>`. Zero means the room has no name. More than one means the room is trying to be two rooms.

**8. Navigation** (error) — The page must have a `<nav>` element containing links. A building without hallways is a collection of disconnected rooms.

**9. No Inline Styles** (warning) — Inline `style=""` attributes are flagged. Atmosphere belongs in the stylesheet, not embedded in the walls. This is a warning, not an error — sometimes inline styles are pragmatic — but it's a signal that something might be off.

</section>

<section id="reading-the-output" aria-labelledby="output-heading">

## Reading the Build Output {#output-heading}

When all checks pass:

```
✓ src/pages/index.md — 100%
  ✓ semantic-structure: Page uses semantic HTML elements.
  ✓ section-labels: All sections have accessible labels.
  ✓ heading-hierarchy: Heading hierarchy is correct.
  ✓ no-bare-div: No bare <div> elements found.
  ✓ link-text: All links have descriptive text.
  ✓ image-alt: No images to audit.
  ✓ single-h1: Page has exactly one <h1>.
  ✓ navigation: Page has navigation with links.
  ✓ no-inline-styles: No inline styles — atmosphere lives in CSS.

▸ All pages are habitable.
```

When a check fails:

```
✗ src/pages/about.md — 78%
  ✓ semantic-structure: Page uses semantic HTML elements.
  ✗ section-labels: 2 section(s) without aria-label or aria-labelledby
  ✓ heading-hierarchy: Heading hierarchy is correct.
  ⚠ no-bare-div: 3 bare <div>(s) found
  ✗ link-text: 1 mystery-meat link(s) found — doors need signs.
  ...

▸ Build blocked — fix habitability errors before shipping.
```

Errors (`✗`) block the build. Warnings (`⚠`) are reported but the build continues.

</section>

<section id="habitability-json" aria-labelledby="json-heading">

## habitability.json {#json-heading}

The machine-readable report in `dist/habitability.json`:

```json
{
  "timestamp": "2026-03-17T15:30:00.000Z",
  "pages": [
    {
      "file": "src/pages/index.md",
      "score": 100,
      "pass": true,
      "checks": [
        {
          "name": "semantic-structure",
          "pass": true,
          "message": "Page uses semantic HTML elements.",
          "severity": "error"
        }
      ]
    }
  ],
  "summary": {
    "total": 1,
    "passed": 1,
    "averageScore": 100
  }
}
```

This file is a build artifact — it's regenerated every time. You can use it in CI/CD pipelines, dashboards, or automated monitoring. If your average score drops below a threshold, something changed that shouldn't have.

</section>

<section id="fixing-failures" aria-labelledby="fixing-heading">

## Common Fixes {#fixing-heading}

**"Section without aria-label or aria-labelledby"** — Add a label to your section:

```html
<section id="about" aria-labelledby="about-heading">
  ## About {#about-heading}
  ...
</section>
```

Or use `aria-label` for sections without a visible heading:

```html
<section id="welcome" aria-label="Welcome">
```

**"Mystery-meat link found"** — Replace vague link text with descriptive text:

```markdown
<!-- Bad -->
[Click here](https://example.com) to read the research.

<!-- Good -->
[Read the One Front Door research paper](https://example.com).
```

**"Heading hierarchy skips levels"** — Don't jump from `##` to `####`. Every level must be represented:

```markdown
## Main Section
### Subsection
#### Detail
```

**"Bare div found"** — Use a semantic element instead, or add a role:

```html
<!-- Instead of -->
<div class="sidebar">...</div>

<!-- Use -->
<aside class="sidebar">...</aside>
```

</section>
