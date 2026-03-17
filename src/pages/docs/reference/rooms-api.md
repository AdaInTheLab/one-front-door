---
purpose: "Technical reference for the .ofd room component format — syntax, allowed elements, prop parsing, and rendering behavior."
position: "Docs > Reference > Rooms API"
heading: "Rooms API"
nav:
  label: "Rooms API"
  order: 15
description: "The .ofd room component format: how rooms are parsed, validated, and rendered into semantic HTML."
voice: "warm"
schema: "WebPage"
---

<section id="file-format" aria-label="File format">

Room files live in `src/rooms/` with the `.ofd` extension. Each file defines one room component.

</section>

<section id="syntax" aria-labelledby="syntax-heading">

## Syntax {#syntax-heading}

```html
<room element="ELEMENT" requires="PROP1, PROP2, ...">
  TEMPLATE
</room>
```

**`element`** (required) — The semantic HTML element this room renders as.

Allowed values: `article`, `section`, `aside`, `nav`, `header`, `footer`, `li`, `figure`, `details`, `blockquote`, `main`, `dl`, `address`.

Any other value — including `div` and `span` — causes a parse error.

**`requires`** (optional) — Comma-separated list of required prop names. If omitted, the room accepts any props but requires none.

**Template** — HTML content between the `<room>` tags. Supports `{propName}` placeholders that are replaced with prop values at render time.

</section>

<section id="directive-syntax" aria-labelledby="directive-heading">

## Markdown Directive Syntax {#directive-heading}

Rooms are invoked in markdown with the directive format:

```
::room[ROOM_NAME]{key1="value1" key2="value2"}
```

- `ROOM_NAME` — Matches the filename without `.ofd`. A file named `member.ofd` is invoked as `::room[member]`.
- Props are `key="value"` pairs inside curly braces.
- Values must be quoted with double quotes.
- Escaped quotes within values: `\"`.
- Props are parsed before markdown rendering to avoid HTML escaping issues.

</section>

<section id="rendering" aria-labelledby="rendering-heading">

## Rendering Behavior {#rendering-heading}

When a room is rendered:

1. All required props are checked. Missing props throw a build error: *"Room 'name' requires: missing_prop. A room without its contents is an empty room."*

2. Each `{propName}` in the template is replaced with the corresponding prop value.

3. The result is wrapped in the declared element:

```html
<ELEMENT class="OPTIONAL_CLASS">
  RENDERED_TEMPLATE
</ELEMENT>
```

4. If a `class` prop is provided (even if not in `requires`), it's added to the wrapper element.

</section>

<section id="error-messages" aria-labelledby="errors-heading">

## Error Messages {#errors-heading}

**Room not found:**
*"Room 'name' not found. Available rooms: member, work-layer."*
The directive references a room that doesn't exist in `src/rooms/`.

**Non-semantic element:**
*"Room element 'div' is not semantic. Allowed: article, section, ... A room must be a real thing, not a container."*
The `.ofd` file uses a disallowed element.

**Missing required props:**
*"Room 'member' requires: description. A room without its contents is an empty room."*
The directive doesn't provide all required props.

**Invalid room file:**
*"Invalid room file — must contain a `<room element='...' requires='...'>` block."*
The `.ofd` file doesn't match the expected format.

</section>

<section id="loading" aria-labelledby="loading-heading">

## Room Loading {#loading-heading}

All `.ofd` files in `src/rooms/` are loaded at build start. The room name is derived from the filename: `member.ofd` becomes room `member`.

If no `src/rooms/` directory exists, the build continues without rooms. Rooms are optional — pages can be pure markdown.

Room directives are processed *before* markdown parsing. This means room output can contain HTML that interacts correctly with the markdown renderer.

</section>
