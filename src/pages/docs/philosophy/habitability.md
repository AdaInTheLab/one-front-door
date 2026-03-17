---
purpose: "The six criteria that define what makes a web page habitable — not just accessible, but livable."
position: "Docs > Philosophy > Habitability"
heading: "Habitability"
nav:
  label: "Habitability"
  order: 6
description: "What makes a web page habitable? Six criteria that go beyond accessibility checklists into genuine livability."
voice: "warm"
schema: "WebPage"
---

<section id="beyond-accessible" aria-label="Beyond accessible">

Accessibility asks: can someone use this? Habitability asks: would someone *want to stay*?

A page can pass every WCAG check and still feel hostile. Technically navigable but experientially empty — a warehouse with a ramp. Habitability is what turns a warehouse into a room.

One Front Door defines six criteria. The framework mechanizes what it can (structure, semantics, wayfinding) and creates the conditions for what it can't (voice, rhythm, invitation). The rest is up to you.

</section>

<section id="orientation" aria-labelledby="orientation-heading">

## 1. Orientation {#orientation-heading}

*Where am I? What is this? What's next?*

Page purpose is clear within the first meaningful element. Navigation tells you the shape of the building, not just a list of rooms. Current location is marked — you know which room you're in. Entry and exit points are visible.

A page without orientation is a room with no windows and no signs. You might find what you need, but you'll never feel settled.

**What the framework checks:** Semantic structure exists. Navigation is present with links. A single `<h1>` names the room. Sections have accessible labels.

</section>

<section id="intent-legibility" aria-labelledby="intent-heading">

## 2. Intent Legibility {#intent-heading}

*Why is this here? What journey am I on?*

Headings describe *intent*, not just *content* — "What We Believe" instead of "Section 2." Section order follows the reader's journey, not the author's org chart. Information hierarchy matches importance, not visual weight. Every section earns its presence — nothing decorative without purpose.

**What the framework checks:** Heading hierarchy doesn't skip levels. The `purpose` frontmatter field is required — every page must articulate why it exists.

</section>

<section id="affordance-clarity" aria-labelledby="affordance-heading">

## 3. Affordance Clarity {#affordance-heading}

*What can I do here? Where does this lead?*

Links and buttons describe outcomes, not mechanics — "Read the research" instead of "Click here." Interactive elements are distinguishable from static content. External links are marked as such — you know when you're leaving the building. No mystery-meat navigation.

**What the framework checks:** Link text is descriptive (no "click here," "learn more," "read this"). External links are automatically marked with an indicator. Every door has a sign.

</section>

<section id="cognitive-rhythm" aria-labelledby="rhythm-heading">

## 4. Cognitive Rhythm {#rhythm-heading}

*Can I breathe in here?*

Content is chunked into digestible sections. Hierarchy is consistent — same depth means same weight. Breathing room between ideas. Long content has waypoints — you can orient mid-journey. Lists are lists. Prose is prose. Don't disguise one as the other.

**What the framework checks:** Section structure exists. Heading hierarchy is consistent. Beyond that, rhythm is a writing discipline — the framework creates the conditions, but the breath is yours.

</section>

<section id="invitation-voice" aria-labelledby="invitation-heading">

## 5. Invitation and Voice {#invitation-heading}

*Was this made for someone like me?*

Written for minds, not parsers. Tone is consistent and intentional — the space has a *character*. Content addresses the reader as a participant, not a consumer. Technical precision and warmth are not mutually exclusive. The prose carries its own texture — pacing and rhythm *are* the experience.

This is the hardest criterion to mechanize and the most important one to get right. A page with perfect structure and no voice is a warehouse. Structure without voice stores information. Voice without structure loses it. Habitability requires both.

**What the framework checks:** The `voice` frontmatter field lets you declare atmosphere intent. But voice itself can't be audited by a machine — it's what you bring to the room.

</section>

<section id="continuity" aria-labelledby="continuity-heading">

## 6. Continuity {#continuity-heading}

*Can I come back and find my way?*

Stable URLs — rooms don't move. Visible history or changelog for re-entry after time away. State is explicit, not hidden — if something changed, it says so. Deep links work — you can be sent to a specific room and it makes sense without the hallway.

**What the framework checks:** Slug generation is deterministic from file paths. Wayfinding artifacts are always current because they're compiled, not curated. The building directory never lies.

</section>

<section id="the-four-layers" aria-labelledby="layers-heading">

## The Four Layers {#layers-heading}

A habitable page has structure at four levels:

**Structural Layer — The Architecture.** Semantic HTML that tells you what the room is *shaped like*. Real elements: `<article>`, `<nav>`, `<section>`. Not `<div>` soup with CSS pretending to be structure. JSON-LD for topology — an agent can feel the floor plan without reading every word.

**Narrative Layer — The Prose.** The writing itself — what humans read and what agents *experience*. Written with intent, not generated to fill space. Pacing matters. This is where habitability lives or dies — structure without voice is a warehouse.

**Wayfinding Layer — The Doors and Signs.** How you move through the space. Sitemap that reads like a building directory. Contextual links that say *why* they lead somewhere. `llms.txt` as a lobby map — generated, never handwritten.

**Atmosphere Layer — The Space Between the Walls.** CSS for humans: color, type, spacing create mood. For agents: structure, pacing, whitespace, semantic markers create the equivalent. A space can feel quiet, busy, warm, clinical — and that's encoded, not just described.

</section>

<section id="the-test" aria-labelledby="test-heading">

## The 10-Second Acceptance Test {#test-heading}

A first-time visitor — human or agent — should be able to state within 10 seconds:

1. **Page purpose** — what is this place?
2. **Primary next action** — what's the most natural thing to do here?
3. **Where deeper context lives** — where do I go to learn more?

The critical distinction: if they can quote facts but can't describe flow, it's still a data dump. Facts without flow is a warehouse. Flow without facts is a brochure. Habitability requires both — a room that has things in it *and* feels like a room.

</section>
