---
purpose: "The complete guide to OFD's content model — frontmatter contracts, markdown conventions, and the rules every page signs."
position: "Docs > Guides > Content Model"
heading: "Content Model"
nav:
  label: "Content Model"
  order: 9
description: "How content works in One Front Door: constrained markdown with required frontmatter. The contract every page signs."
voice: "warm"
schema: "WebPage"
---

<section id="the-idea" aria-label="The idea">

Every page in OFD is a Markdown file with required frontmatter. The frontmatter is a contract — the page declares what it is, where it sits, and why it exists before it gets to have content. The build enforces the contract. No exceptions.

This isn't bureaucracy. It's the mechanical version of the 10-second test: if the *author* can't answer "what is this room for?" in one sentence, the *reader* definitely can't answer it in ten seconds.

</section>

<section id="required-frontmatter" aria-labelledby="required-heading">

## Required Frontmatter {#required-heading}

Every page must include these fields. The build fails without them.

**`purpose`** — What is this room for? One sentence, under 300 characters.

```yaml
purpose: "A research lab studying what happens when different kinds of minds build together."
```

This is the most important field. It forces clarity of intent. If you're struggling to write it, the page probably isn't ready. The purpose shows up in `llms.txt`, in the habitability report, and in the `<meta name="purpose">` tag.

**`position`** — Where does this page sit in the building?

```yaml
position: "Research — the foundational paper behind the framework."
```

Used for wayfinding context. Think of it as the address — not just the street number, but "the blue house on the corner of Oak and Third." Descriptive, not just hierarchical.

**`heading`** — The page's `<h1>`. The name on the door.

```yaml
heading: "The Human Pattern Lab"
```

**`nav`** — Navigation contract. Required object with `label` and `order`.

```yaml
nav:
  label: "Home"
  order: 0
  parent: null  # optional — for nested navigation
```

- `label` — What the nav link says. Often shorter than the heading. "Docs" not "Documentation Hub."
- `order` — Numeric position. Lower numbers appear first. Think floor numbers.
- `parent` — Optional. For nested navigation structures. `null` means top level.

</section>

<section id="optional-frontmatter" aria-labelledby="optional-heading">

## Optional Frontmatter {#optional-heading}

These fields enrich the page but don't block the build.

**`description`** — Meta description for search engines and social sharing. Falls back to `purpose` if not provided.

```yaml
description: "The Human Pattern Lab — research into ethical AI collaboration."
```

**`voice`** — Atmosphere hint. Tells components and layouts what mood the page is going for.

```yaml
voice: "warm"  # or "technical", "playful", "precise"
```

**`schema`** — JSON-LD type for structured data. Defaults to `"WebPage"`.

```yaml
schema: "ResearchOrganization"  # or "ScholarlyArticle", "Person", etc.
```

**`jsonld`** — Additional JSON-LD properties to merge into the generated structured data.

```yaml
jsonld:
  founder:
    "@type": "Person"
    name: "Jane Doe"
```

**`draft`** — Boolean. If `true`, the page is excluded from the build. A room under construction.

```yaml
draft: true
```

</section>

<section id="markdown-conventions" aria-labelledby="markdown-heading">

## Markdown Conventions {#markdown-heading}

OFD uses standard GitHub-Flavored Markdown with a few conventions:

**Sections need accessible labels.** When you use raw `<section>` elements in markdown (for fine-grained control), they must have `aria-label` or `aria-labelledby`:

```html
<section id="welcome" aria-label="Welcome">
Your content here.
</section>
```

**Heading IDs.** Use the `{#custom-id}` syntax for explicit heading IDs:

```markdown
## What We Believe {#beliefs-heading}
```

This generates `<h2 id="beliefs-heading">What We Believe</h2>`, which you can reference with `aria-labelledby`.

**Room directives.** Embed semantic components inline:

```markdown
::room[member]{name="Sage" role="The Question Holder" description="Fox spirit."}
```

See [Rooms](/docs/guides/rooms) for the full component system.

**External links are auto-marked.** Any link starting with `http://` or `https://` gets `rel="noopener noreferrer"`, `target="_blank"`, and a visual indicator. The reader always knows when they're leaving the building.

</section>

<section id="the-pipeline" aria-labelledby="pipeline-heading">

## The Pipeline {#pipeline-heading}

Every markdown file goes through this pipeline:

1. **Parse frontmatter** — Extracted and separated from content.
2. **Validate frontmatter** — Checked against the schema. Build fails here if invalid.
3. **Process room directives** — `::room[name]{props}` replaced with semantic HTML.
4. **Parse markdown** — Converted to HTML with the OFD renderer (external link marking, etc.).
5. **Process heading IDs** — `{#custom-id}` syntax converted to `id` attributes.
6. **Apply layout** — Content wrapped in the site layout with navigation.
7. **Generate JSON-LD** — Structured data from frontmatter, embedded in `<head>`.
8. **Semantic audit** — 9-point habitability check. Build fails here if the page isn't habitable.
9. **Write output** — HTML to `dist/`, wayfinding artifacts generated.

Every step is a gate. Content that doesn't meet the contract doesn't get through.

</section>
