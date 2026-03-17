---
purpose: "The simplest possible OFD site — one page, fully habitable, demonstrating the minimum viable content model."
position: "Docs > Examples > Minimal"
heading: "Minimal Example"
nav:
  label: "Minimal"
  order: 18
description: "One file. One page. Fully habitable. The simplest possible One Front Door site."
voice: "warm"
schema: "WebPage"
---

<section id="the-idea" aria-label="The idea">

One file. One page. Fully habitable.

This is the smallest possible OFD site — proof that the framework doesn't require complexity to produce a habitable page.

</section>

<section id="the-page" aria-labelledby="page-heading">

## The Page {#page-heading}

Create `src/pages/index.md`:

```yaml
---
purpose: "A personal homepage."
position: "Home"
heading: "Jane Doe"
nav:
  label: "Home"
  order: 0
---
```

```markdown
<section id="about" aria-label="About">

I make things for the web. All kinds of minds welcome.

</section>

<section id="work" aria-labelledby="work-heading">

## What I Build {#work-heading}

Software that treats every visitor as a first-class citizen.
Human, agent, screen reader, crawler — same door, same room.

</section>

<section id="contact" aria-labelledby="contact-heading">

## Say Hello {#contact-heading}

- [My projects on GitHub](https://github.com/janedoe)
- [Send me an email](mailto:jane@example.com)

</section>
```

</section>

<section id="the-config" aria-labelledby="config-heading">

## The Config {#config-heading}

Create `ofd.config.js`:

```javascript
export default {
  siteName: 'Jane Doe',
  siteDescription: 'A person who makes things for the web.',
  siteUrl: 'https://janedoe.com',
};
```

</section>

<section id="the-output" aria-labelledby="output-heading">

## What You Get {#output-heading}

Run `bun run build` and you get:

**`dist/index.html`** — A semantic HTML page with navigation, JSON-LD, and a skip link. Works without JavaScript. Works without CSS. The structure *is* the content.

**`dist/llms.txt`** — Generated automatically:

```
# Jane Doe

> A person who makes things for the web.

## What This Place Is

A personal homepage.

## How This Site Is Organized

- / — Home. A personal homepage.

## A Note On This Page

This site was built with One Front Door. There is no separate
"agent version." You are reading the same space everyone else
reads. Welcome.
```

**`dist/habitability.json`** — The audit report. 100% score. Every check passed.

**`dist/sitemap.xml`** — One URL. The building has one room.

That's it. One file in, a fully habitable site out. The framework did the rest.

</section>
