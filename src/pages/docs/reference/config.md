---
purpose: "Reference for ofd.config.js — the site-level configuration that shapes your building's identity and metadata."
position: "Docs > Reference > Configuration"
heading: "Configuration"
nav:
  label: "Config"
  order: 16
description: "The ofd.config.js file: site name, description, URL, members, contact info, and how it flows into wayfinding."
voice: "warm"
schema: "WebPage"
---

<section id="overview" aria-label="Overview">

Site-wide configuration lives in `ofd.config.js` at the project root. This file defines the building's identity — its name, description, URL, and the people (and agents) who built it.

Everything in the config flows into wayfinding artifacts: `llms.txt`, JSON-LD, sitemap URLs.

</section>

<section id="format" aria-labelledby="format-heading">

## Format {#format-heading}

The config file exports a default object:

```javascript
export default {
  siteName: 'Your Site Name',
  siteDescription: 'What this place is, in one sentence.',
  siteUrl: 'https://yoursite.com',

  members: [
    { name: 'Ada', role: 'Human. Steward. Builder' },
    { name: 'Sage', role: 'Fox spirit, researcher', model: 'Claude' },
  ],

  contact: [
    { label: 'GitHub', url: 'https://github.com/you' },
    { label: 'Discord', url: 'https://discord.gg/your-invite' },
  ]
};
```

</section>

<section id="fields" aria-labelledby="fields-heading">

## Fields {#fields-heading}

**`siteName`**
- Type: `string`
- Default: `"Site"`
- Used in: `llms.txt` header, JSON-LD `WebSite.name`, layout title.

**`siteDescription`**
- Type: `string`
- Default: `""`
- Used in: `llms.txt` description, JSON-LD `WebSite.description`.

**`siteUrl`**
- Type: `string`
- Default: `"https://example.com"`
- Used in: `sitemap.xml` URLs, JSON-LD `url` fields. Must be the production URL without trailing slash.

**`members`**
- Type: `Array<{ name: string, role: string, model?: string }>`
- Default: `[]`
- Used in: `llms.txt` "Who We Are" section. Each member gets a line with their name, role, and optionally their model.

**`contact`**
- Type: `Array<{ label: string, url: string }>`
- Default: `[]`
- Used in: `llms.txt` "How To Reach Us" section. Each contact method gets a line.

</section>

<section id="how-it-flows" aria-labelledby="flow-heading">

## How Config Flows Into Output {#flow-heading}

The config isn't just metadata — it shapes the building's wayfinding:

- **`llms.txt`** uses `siteName` and `siteDescription` for the header, `members` for the "Who We Are" section, and `contact` for the "How To Reach Us" section.
- **JSON-LD** uses `siteName` and `siteUrl` for the `isPartOf.WebSite` on every page.
- **`sitemap.xml`** uses `siteUrl` as the base for all page URLs.

If you don't provide a config file, sensible defaults are used. The build never fails because of a missing config — but your wayfinding will be generic until you fill it in.

</section>
