---
purpose: "A multi-page OFD site example with blog posts, navigation between pages, and auto-generated wayfinding."
position: "Docs > Examples > Blog"
heading: "Blog Example"
nav:
  label: "Blog"
  order: 19
description: "A multi-page One Front Door site: homepage, about page, and blog posts with full wayfinding."
voice: "warm"
schema: "WebPage"
---

<section id="the-idea" aria-label="The idea">

A personal blog with a homepage, an about page, and a few posts. Multiple rooms in the building, all connected by auto-generated navigation and wayfinding.

</section>

<section id="structure" aria-labelledby="structure-heading">

## Project Structure {#structure-heading}

```
src/pages/
├── index.md          # Homepage
├── about.md          # About page
└── posts/
    ├── first-post.md   # Blog post
    └── second-post.md  # Blog post
```

Each file becomes a URL:
- `index.md` becomes `/`
- `about.md` becomes `/about`
- `posts/first-post.md` becomes `/posts/first-post`

</section>

<section id="the-homepage" aria-labelledby="home-heading">

## The Homepage {#home-heading}

```yaml
---
purpose: "A writer's blog about technology and the human experience."
position: "Home — the front door."
heading: "Alex's Blog"
nav:
  label: "Home"
  order: 0
description: "Writing about technology, humanity, and the space between."
voice: "warm"
---
```

```markdown
<section id="welcome" aria-label="Welcome">

I write about technology and what it means to be human in a world
that's changing faster than we can describe it.

</section>

<section id="recent" aria-labelledby="recent-heading">

## Recent Writing {#recent-heading}

- [On Building for All Minds](/posts/first-post) — What happens when
  you design for the hardest case.
- [The Pause Before Clicking](/posts/second-post) — Why the space
  between pages matters more than the pages themselves.

</section>
```

</section>

<section id="a-post" aria-labelledby="post-heading">

## A Blog Post {#post-heading}

```yaml
---
purpose: "An essay on designing web experiences that work for every kind of mind."
position: "Posts — writing about inclusive design."
heading: "On Building for All Minds"
nav:
  label: "All Minds"
  order: 2
description: "What happens when you stop building for the average user and start building for every mind."
voice: "warm"
schema: "ScholarlyArticle"
jsonld:
  author:
    "@type": "Person"
    name: "Alex"
  datePublished: "2026-03-17"
---
```

```markdown
<section id="the-premise" aria-label="The premise">

The average user doesn't exist. We've been designing for a
statistical fiction — and the minds that fall outside the average
have been getting side entrances.

</section>

<section id="the-argument" aria-labelledby="argument-heading">

## The Hardest Case {#argument-heading}

If you design for a mind that can't dismiss a modal, can't
pattern-match past a dark pattern, can't execute JavaScript —
you end up with a page that's better for *everyone*.

Not because you dumbed it down. Because you built it right.

</section>
```

</section>

<section id="what-generates" aria-labelledby="generates-heading">

## What Gets Generated {#generates-heading}

With four pages, the build produces:

**Navigation** — Auto-generated from all pages' `nav` fields, ordered by `nav.order`. Every page shows the same navigation, with the current page marked with `aria-current="page"`.

**`llms.txt`** — The lobby map lists all four pages with their purposes:

```
## How This Site Is Organized

- / — Home. A writer's blog about technology and the human experience.
- /about — About. Who I am and why I write.
- /posts/first-post — All Minds. An essay on designing for every kind of mind.
- /posts/second-post — The Pause. Why the space between pages matters.
```

**`sitemap.xml`** — Four URLs.

**`habitability.json`** — Four pages audited. Average score reported.

Every wayfinding artifact updates automatically when you add or remove pages. The building directory is always accurate.

</section>
