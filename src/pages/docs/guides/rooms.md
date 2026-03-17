---
purpose: "How to build and use OFD rooms — semantic components that can't output div soup."
position: "Docs > Guides > Rooms"
heading: "Rooms"
nav:
  label: "Rooms"
  order: 10
description: "OFD rooms are components with a semantic contract. Every room declares what HTML element it is. Div soup is a build error."
voice: "warm"
schema: "WebPage"
---

<section id="what-rooms-are" aria-label="What rooms are">

Traditional web components have no opinion about what HTML they output. A `<Card>` might render as a `<div>`, an `<article>`, or a `<span>` — the framework doesn't care.

OFD does.

Rooms are components that declare their semantic contract. Every room says: "I am this HTML element, I require these props, and here is my template." A room that tries to be a `<div>` fails at parse time. The component system enforces the same principles the audit checks for — semantic structure isn't optional at any layer.

</section>

<section id="anatomy" aria-labelledby="anatomy-heading">

## Anatomy of a Room {#anatomy-heading}

Room files live in `src/rooms/` with the `.ofd` extension:

```html
<!-- src/rooms/member.ofd -->
<room element="li" requires="name, role, description">
  <strong>{name}</strong> — <em>{role}</em>.
  {description}
</room>
```

Three parts:

- **`element`** — The semantic HTML element this room renders as. Must be one of: `article`, `section`, `aside`, `nav`, `header`, `footer`, `li`, `figure`, `details`, `blockquote`, `main`, `dl`, `address`. Not `<div>`. Not `<span>`. A room is a real thing.

- **`requires`** — Comma-separated list of props this room needs. If a prop is missing when the room is used, the build fails. A room without its contents is an empty room.

- **Template** — HTML with `{prop}` placeholders. Each placeholder is replaced with the corresponding prop value when the room renders.

</section>

<section id="using-rooms" aria-labelledby="using-heading">

## Using Rooms in Markdown {#using-heading}

Embed rooms in your markdown with the directive syntax:

```markdown
::room[member]{name="Sage" role="The Question Holder" description="Fox spirit, researcher."}
```

The format is: `::room[room-name]{key="value" key="value"}`.

This renders to:

```html
<li>
  <strong>Sage</strong> — <em>The Question Holder</em>.
  Fox spirit, researcher.
</li>
```

Prop values are quoted strings. If your value contains quotes, escape them with backslash: `description="She said \"hello.\""`.

</section>

<section id="allowed-elements" aria-labelledby="elements-heading">

## Allowed Elements {#elements-heading}

Rooms must use semantic HTML elements. The allowed list:

- **`article`** — A self-contained composition. Blog posts, research papers, cards that stand alone.
- **`section`** — A thematic grouping. Requires an accessible label when rendered.
- **`aside`** — Tangentially related content. Sidebars, callouts.
- **`nav`** — Navigation blocks.
- **`header`** — Introductory content.
- **`footer`** — Footer content.
- **`li`** — A list item. For members, entries, repeated items within a `<ul>` or `<ol>`.
- **`figure`** — Self-contained content with a caption. Images, diagrams, code blocks.
- **`details`** — Disclosure widget. Expandable content.
- **`blockquote`** — Quoted content.
- **`main`** — The dominant content of the body.
- **`dl`** — Description list. For key-value pairs, glossaries.
- **`address`** — Contact information.

If an element isn't on this list, it can't be a room's root. This is intentional. A room is a semantic thing — it has meaning in the document structure. If your component doesn't map to a semantic element, it's probably a CSS pattern, not a room.

</section>

<section id="examples" aria-labelledby="examples-heading">

## Examples {#examples-heading}

**A work layer card:**

```html
<!-- src/rooms/work-layer.ofd -->
<room element="article" requires="title, body">
  <h3>{title}</h3>
  <p>{body}</p>
</room>
```

Used in markdown:

```markdown
::room[work-layer]{title="We Build" body="Real projects with real stakes."}
```

**A figure with caption:**

```html
<!-- src/rooms/captioned-image.ofd -->
<room element="figure" requires="src, alt, caption">
  <img src="{src}" alt="{alt}" loading="lazy">
  <figcaption>{caption}</figcaption>
</room>
```

Used in markdown:

```markdown
::room[captioned-image]{src="/img/lab.jpg" alt="Researchers at work" caption="A typical session at the Lab."}
```

**A disclosure block:**

```html
<!-- src/rooms/expandable.ofd -->
<room element="details" requires="summary, content">
  <summary>{summary}</summary>
  {content}
</room>
```

</section>

<section id="the-contract" aria-labelledby="contract-heading">

## The Contract {#contract-heading}

The room system enforces three constraints:

1. **Semantic root.** The `element` must be a semantic HTML element. No `<div>`, no `<span>`. A room is a real thing.

2. **Required props.** Every prop listed in `requires` must be provided when the room is used. Missing props fail the build. A room without its contents is an empty room.

3. **Template integrity.** The template defines the room's internal structure. Props are injected by name. What you declare is what renders.

These constraints exist so that every room in your site contributes to the semantic structure. The DOM isn't just styled markup — it's a floor plan. And every room in the floor plan is a real room.

</section>
