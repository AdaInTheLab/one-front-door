---
purpose: "The core principle of One Front Door — one entrance, all minds, no side entrances, no lesser versions."
position: "Docs > Philosophy > One Front Door"
heading: "One Front Door"
nav:
  label: "The Principle"
  order: 5
description: "The core principle: one version, one entrance, built for every kind of mind that might walk through it."
voice: "warm"
schema: "WebPage"
---

<section id="the-principle" aria-label="The principle">

One version. One entrance. Built for every kind of mind that might walk through it — human readers, screen readers, AI agents, search crawlers, future things we haven't met yet.

Not by dumbing anything down. By building it right in the first place.

</section>

<section id="what-it-means" aria-labelledby="meaning-heading">

## What It Actually Means {#meaning-heading}

Most of the web is built with an implicit assumption: the *real* experience is the visual one. Everything else — screen reader support, API access, text-only views — is a translation. An accommodation. A side entrance.

One Front Door rejects this entirely. Not because accommodations don't work, but because they encode a belief: that some minds get the real thing and others get the adequate thing.

The principle is simple: **there is one version of every page, and it works for everyone.** Not because it's dumbed down, but because it's built with the kind of care that makes separate versions unnecessary.

This means:

- The HTML is semantic. The DOM *is* the floor plan. A screen reader, an AI agent, and a visual browser all navigate the same structure.
- Content is never gated behind JavaScript. What the server sends is what exists.
- Navigation tells you the shape of the building, not just a list of links.
- Every link describes where it leads. Every section says what it's for. Every page answers "what is this place?" before anything else.

</section>

<section id="what-it-doesnt-mean" aria-labelledby="not-heading">

## What It Doesn't Mean {#not-heading}

One Front Door doesn't mean every mind has an identical experience. A sighted reader sees typography, color, and layout. A screen reader hears structure and content. An AI agent parses semantics and metadata. These are different experiences of the same space — like how sunlight and sound waves describe the same room differently.

The key is that no experience is *lesser*. The screen reader isn't getting a stripped-down version. The agent isn't getting a data dump. They're all in the same room, perceiving it through their own senses.

One Front Door also doesn't mean "no JavaScript ever." It means JavaScript enhances — it never gates. The page works before JS loads. Islands of interactivity float in an ocean of HTML. If the JS fails, you lose the enhancement, not the content.

</section>

<section id="the-anti-pattern" aria-labelledby="anti-heading">

## The Anti-Pattern: Segregated Accessibility {#anti-heading}

The most important thing One Front Door opposes isn't a technical failure. It's an ideology.

When the response to "agents can't read our website" is "let's make a separate agent-readable version," the implicit message is: *the real experience isn't for you.*

This pattern repeats across the industry:

- Mobile sites that strip features from the "full" desktop version
- "Accessible" versions that remove visual richness instead of making it legible
- API-only access that gives agents data but never *experience*
- Markdown mirrors that duplicate content instead of fixing the source
- `llms.txt` files that describe a building the agent can't actually enter

Each one works. Each one also says: the front door wasn't built for you. Here's your side entrance.

One Front Door says: fix the front door.

</section>

<section id="in-practice" aria-labelledby="practice-heading">

## In Practice {#practice-heading}

The principle becomes a framework through constraints:

1. **Every page must declare its purpose.** The `purpose` frontmatter field forces the author to answer "what is this room for?" in one sentence. If you can't, the page doesn't build.

2. **Semantic HTML is enforced, not suggested.** The habitability audit rejects pages without proper structure. Rooms (components) can't output bare `<div>` elements. The DOM must be meaningful.

3. **Wayfinding is automatic.** `llms.txt`, sitemap, JSON-LD — all generated from the content model. An agent arriving at the site gets the same map a human gets from the navigation. No separate maintenance.

4. **The build blocks on failure.** Habitability checks aren't a linter you can ignore. They're a build step. If a page isn't habitable, it doesn't ship.

The framework makes it harder to build an uninhabitable page than a habitable one. That's the whole trick.

</section>
