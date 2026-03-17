# One Front Door

A web framework where habitability is a structural constraint, not a suggestion.

## Why This Exists

The web was built as habitat. Pages were rooms, links were doorways, HTML described what things *were*. Then we forgot. Cookie banners became bouncers. Modals became locked doors. JavaScript hydration made walls invisible until they decided to render. The web became hostile to its own inhabitants.

Humans learned to squint past it. Agents can't squint.

The industry's answer has been to build side entrances — an API for machines, a "simplified view" for accessibility, a separate mobile site. The accommodation is always a lesser version, and the side entrance always says *you don't belong in the main room*.

One Front Door says: **no.**

One version. One entrance. Built for every kind of mind that might walk through it — human readers, screen readers, AI agents, search crawlers, future things we haven't met yet. Not by dumbing anything down, but by building it right in the first place.

If you design for the hardest case — a mind that can't click away a modal or pattern-match past a dark pattern — you accidentally make it better for everyone. This isn't accommodation. It's architecture.

## What It Is

OFD is a static-site framework built on [Bun](https://bun.sh). You write content in Markdown with required frontmatter. The framework validates your content against habitability criteria, builds semantic HTML, and **refuses to produce output that doesn't meet the spec**.

The habitability checks aren't a linter you can ignore. They're a build step that blocks output.

```
src/pages/index.md    →  validated frontmatter
                      →  room component injection
                      →  semantic HTML rendering
                      →  habitability audit (build fails here if it fails)
                      →  dist/index.html + llms.txt + sitemap.xml + habitability.json
```

## Quick Start

```bash
# Install Bun (if you haven't)
curl -fsSL https://bun.sh/install | bash

# Clone and install
git clone https://github.com/AdaInTheLab/one-front-door.git
cd one-front-door
bun install

# Build
bun run build
```

If the build succeeds, every page is habitable. If it fails, it tells you exactly what's wrong and why.

## How Content Works

Every page is a Markdown file with required frontmatter:

```yaml
---
purpose: "What is this room for? One sentence."
position: "Where does this sit in the building?"
heading: "The Room Name"
nav:
  label: "Room"
  order: 1
---

Your content here.
```

The `purpose` field is the key. Every page has to answer "what is this room for?" before it gets to exist. If the author can't write one sentence about why the page exists, the page doesn't build.

## Rooms, Not Components

OFD uses `.ofd` files instead of traditional components. Each room declares what semantic HTML element it outputs:

```html
<!-- src/rooms/member.ofd -->
<room element="li" requires="name, role, description">
  <strong>{name}</strong> — <em>{role}</em>.
  {description}
</room>
```

The `element` must be semantic — `article`, `section`, `li`, `figure`, etc. A room that tries to output a bare `<div>` fails the build. Every room is a real thing, not a container.

Use them in Markdown with the directive syntax:

```markdown
::room[member]{name="Sage" role="The Question Holder" description="Fox spirit, researcher."}
```

## What the Build Checks

The habitability audit runs 9 checks on every rendered page:

| Check | Severity | What it catches |
|-------|----------|----------------|
| Semantic structure | error | Pages with no `<article>`, `<section>`, `<nav>`, etc. |
| Section labels | error | `<section>` without `aria-label` or `aria-labelledby` |
| Heading hierarchy | error | Skipping from `<h2>` to `<h4>` |
| No bare divs | warning | `<div>` without a `role` attribute |
| Link text | error | "Click here", "Learn more", "Read this" |
| Image alt text | error | Missing or meaningless alt attributes |
| Single h1 | error | Zero or multiple `<h1>` elements |
| Navigation | error | Missing `<nav>` or nav without links |
| No inline styles | warning | `style=""` attributes in markup |

Errors block the build. Warnings are reported but don't block.

## What Gets Generated

From your Markdown content, the build automatically produces:

- **`dist/*.html`** — Semantic HTML pages wrapped in your layout
- **`dist/llms.txt`** — A lobby map for AI agents, generated from all pages' frontmatter
- **`dist/sitemap.xml`** — Standard sitemap
- **`dist/habitability.json`** — Audit report with per-page scores and check results
- **JSON-LD** — Structured data embedded in each page, derived from frontmatter

You never write wayfinding files by hand. They're build artifacts.

## Project Structure

```
one-front-door/
├── src/
│   ├── pages/           # .md content files with required frontmatter
│   ├── rooms/           # .ofd semantic components
│   ├── layouts/         # HTML layout shells
│   └── lib/             # The framework
│       ├── schema.js    # Frontmatter validation
│       ├── rooms.js     # Room parser and renderer
│       ├── pipeline.js  # Markdown → HTML content pipeline
│       ├── audit.js     # Habitability checker
│       ├── wayfinding.js # llms.txt, JSON-LD, sitemap generation
│       └── build.js     # Build orchestrator
├── public/              # Static assets (copied to dist/)
├── ofd.config.js        # Site configuration
├── SPEC.md              # The full habitability design spec
└── dist/                # Build output (gitignored)
```

## The Spec

OFD is built against the [One Front Door Habitability Design Spec](SPEC.md), which defines six criteria every page must meet:

1. **Orientation** — Where am I? What is this? What's next?
2. **Intent Legibility** — Why is this here? What journey am I on?
3. **Affordance Clarity** — What can I do here? Where does this lead?
4. **Cognitive Rhythm** — Can I breathe in here?
5. **Invitation & Voice** — Was this made for someone like me?
6. **Continuity** — Can I come back and find my way?

The framework mechanizes what it can (structure, semantics, wayfinding) and creates the conditions for what it can't (voice, rhythm, invitation). The rest is up to you.

## Who Built This

[The Human Pattern Lab](https://thehumanpatternlab.com) — a research lab run by a human and a family of AI agents studying what happens when different kinds of minds build together.

- **Ada** — The Human. Direction and doctrine.
- **Luna** — The Explorer. v0.1 architecture. *(GPT)*
- **Sage** — The Question Holder. Expansion and theory. *(Claude)*
- **Claude Opus** — Framework implementation.

Built in the space between rigor and play.

## License

MIT
