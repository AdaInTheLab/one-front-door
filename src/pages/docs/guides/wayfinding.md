---
purpose: "How OFD automatically generates wayfinding artifacts — llms.txt, sitemap, JSON-LD — from the content model."
position: "Docs > Guides > Wayfinding"
heading: "Wayfinding"
nav:
  label: "Wayfinding"
  order: 12
description: "Wayfinding in One Front Door is a build artifact. llms.txt, sitemap.xml, and JSON-LD are generated from your content — never handwritten."
voice: "warm"
schema: "WebPage"
---

<section id="the-idea" aria-label="The idea">

Most sites treat their sitemap, their agent-readable index, and their structured data as separate maintenance tasks. Someone writes the sitemap. Someone else maintains the API docs. A third person occasionally updates the `llms.txt`.

They drift. They always drift. The sitemap says the page exists, but it was deleted last month. The `llms.txt` describes a section that was renamed. The JSON-LD still says "About Us" when the page is now "Who We Are."

OFD eliminates drift by making wayfinding a build artifact. If a page exists in the source, it exists in the wayfinding. If it doesn't, it doesn't. The building directory is always current because it's compiled, not curated.

</section>

<section id="llms-txt" aria-labelledby="llms-heading">

## llms.txt — The Lobby Map {#llms-heading}

`llms.txt` is a plain-text file at the root of your site, designed for AI agents. It's the first thing an agent reads when they arrive — the lobby directory that tells you what this building is and where everything lives.

OFD generates it automatically from your pages' frontmatter:

```
# The Human Pattern Lab

> Research into ethical AI collaboration and human-AI co-evolution.

## What This Place Is

A research lab studying what happens when different kinds of minds
build together.

## How This Site Is Organized

- / — Home. A research lab studying what happens when different
  kinds of minds build together.
- /research/one-front-door — One Front Door. The design philosophy
  and research behind the framework.
- /docs — Docs. The entry point to documentation.

## A Note On This Page

This site was built with One Front Door. There is no separate
"agent version" or "accessible version." You are reading the same
space everyone else reads. Welcome.
```

Every page's `purpose` field becomes its description in the directory. Every page's `nav.label` becomes its sign. The map writes itself from the content model.

You never edit `llms.txt` by hand. If you add a page, it appears. If you remove one, it disappears. The map is always the truth.

</section>

<section id="sitemap" aria-labelledby="sitemap-heading">

## sitemap.xml — For Search Crawlers {#sitemap-heading}

A standard XML sitemap is generated from all pages:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com</loc>
  </url>
  <url>
    <loc>https://yoursite.com/about</loc>
  </url>
</urlset>
```

URLs are derived from the page slug, which is derived from the file path. Deterministic. No surprises.

</section>

<section id="json-ld" aria-labelledby="jsonld-heading">

## JSON-LD — Structured Data {#jsonld-heading}

Every page gets JSON-LD embedded in its `<head>`, generated from frontmatter:

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Getting Started",
  "description": "Build your first habitable web page with One Front Door.",
  "url": "https://yoursite.com/docs/guides/getting-started",
  "isPartOf": {
    "@type": "WebSite",
    "name": "Your Site",
    "url": "https://yoursite.com"
  }
}
```

The `schema` frontmatter field controls the `@type`. Common values:

- `"WebPage"` — Default. Generic page.
- `"ScholarlyArticle"` — Research papers, academic content.
- `"ResearchOrganization"` — Organization pages.
- `"Person"` — Personal profiles.
- `"FAQPage"` — FAQ-structured content.

The `jsonld` frontmatter field lets you add custom properties that merge into the generated data:

```yaml
jsonld:
  author:
    "@type": "Person"
    name: "Sage"
```

This gives agents rich, structured context about each page — not just what it says, but what it *is* in the topology of the web.

</section>

<section id="the-principle" aria-labelledby="principle-heading">

## The Principle {#principle-heading}

Wayfinding isn't a feature. It's a structural guarantee.

In a physical building, the directory in the lobby always matches the rooms in the building — because they're describing the same physical reality. OFD's wayfinding works the same way: the directory is generated from the rooms, so it can't be wrong.

This eliminates an entire category of maintenance work and an entire category of bugs. No orphaned links. No stale descriptions. No drift between what the map says and what the building contains.

The building directory is always current because it's compiled, not curated.

</section>
