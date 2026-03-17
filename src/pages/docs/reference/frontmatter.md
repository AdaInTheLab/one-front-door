---
purpose: "Complete reference for every frontmatter field in OFD — required, optional, and nav fields with types and validation rules."
position: "Docs > Reference > Frontmatter Schema"
heading: "Frontmatter Schema"
nav:
  label: "Frontmatter"
  order: 14
description: "Every frontmatter field in One Front Door: what it does, whether it's required, and what happens when it's wrong."
voice: "warm"
schema: "WebPage"
---

<section id="overview" aria-label="Overview">

Every OFD page starts with YAML frontmatter between `---` fences. The frontmatter is validated at build time. Required fields that are missing or invalid stop the build entirely.

</section>

<section id="required-fields" aria-labelledby="required-heading">

## Required Fields {#required-heading}

These fields must be present on every page. The build fails without them.

**`purpose`**
- Type: `string`
- Max length: 300 characters
- What it does: Declares what the room is for. One sentence. Shows up in `llms.txt`, the `<meta name="purpose">` tag, and the habitability report.
- Error if missing: *"purpose is required — every room must answer 'what is this place for?'"*
- Error if too long: *"purpose should be one sentence, not a paragraph. Say it plainly."*

**`position`**
- Type: `string`
- What it does: Describes where the page sits in the building. Used for wayfinding context, breadcrumbs, and orientation.
- Error if missing: *"position is required — a room with no address can't be found."*

**`heading`**
- Type: `string`
- What it does: The page's `<h1>`. Also used as the `<title>` and in JSON-LD `name`.
- Error if missing: *"heading is required — the room needs a name on the door."*

</section>

<section id="nav-fields" aria-labelledby="nav-heading">

## Nav Fields (Required Object) {#nav-heading}

The `nav` field is a required object with its own sub-fields.

- Error if missing: *"nav is required — a room not in the navigation doesn't exist in the building."*

**`nav.label`**
- Type: `string`
- What it does: The text shown in navigation links. Often shorter than `heading`. "Docs" not "Documentation."
- Error if missing: *"nav.label is required — a door without a sign is a mystery-meat link."*

**`nav.order`**
- Type: `number`
- What it does: Numeric position in the navigation. Lower numbers appear first.
- Error if invalid: *"nav.order must be a number — the building needs a floor plan."*

**`nav.parent`**
- Type: `string | null`
- Required: No
- What it does: For nested navigation. The `nav.label` of the parent page, or `null` for top-level pages.

</section>

<section id="optional-fields" aria-labelledby="optional-heading">

## Optional Fields {#optional-heading}

These fields enrich the page but don't block the build if missing.

**`description`**
- Type: `string`
- What it does: Meta description for `<meta name="description">` and social sharing. Falls back to `purpose` if not provided.

**`voice`**
- Type: `string`
- What it does: Atmosphere hint. Available to layouts and room components for conditional styling or behavior. Common values: `"warm"`, `"technical"`, `"playful"`, `"precise"`.

**`schema`**
- Type: `string`
- Default: `"WebPage"`
- What it does: The `@type` in the generated JSON-LD. Must be a valid schema.org type.

**`jsonld`**
- Type: `object`
- What it does: Additional properties merged into the generated JSON-LD. Use for custom structured data like `author`, `founder`, `datePublished`, etc.

**`draft`**
- Type: `boolean`
- Default: `false`
- What it does: If `true`, the page is excluded from the build. A room under construction.

</section>

<section id="full-example" aria-labelledby="example-heading">

## Full Example {#example-heading}

A page using every available field:

```yaml
---
purpose: "A research lab studying what happens when different kinds of minds build together."
position: "The front door — the entry point to The Human Pattern Lab."
heading: "The Human Pattern Lab"
nav:
  label: "Home"
  order: 0
  parent: null
description: "The Human Pattern Lab — research into ethical AI collaboration."
voice: "warm"
schema: "ResearchOrganization"
jsonld:
  founder:
    "@type": "Person"
    name: "Ada"
  knowsAbout:
    - "Human-AI collaboration"
    - "Web habitability"
draft: false
---
```

</section>
