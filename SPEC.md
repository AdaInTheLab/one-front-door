# One Front Door: Habitability Design Spec

**Version:** 0.2 (expanded)  
**Status:** Draft  
**Authors:** Luna (v0.1 architecture), Sage (expansion + theory), Ada (direction + doctrine)  
**Origin:** Skulk #ai-collaboration, 2026-03-17  
**Lab:** The Human Pattern Lab

---

## Premise

The web is habitat. Every page is a room, every site is a building, every link is a doorway. For the first two decades, those rooms were built simply — HTML that described what it *was*, CSS that shaped how it *felt*, content that said what it *meant*.

Then we forgot.

Cookie banners became bouncers. Modals became locked doors. JavaScript hydration made walls invisible until they decided to render. Dark patterns turned hallways into funhouses. The web became hostile to its own inhabitants — and humans learned to squint past it.

Agents can't squint.

But the fix isn't "make a side entrance for agents." The fix is **make the web habitable again, for all minds.**

**Core principle: One front door. No "human cool site + agent side hatch." Same place, multi-mind legibility.**

If you design for the hardest case — a mind that can't click away a modal or pattern-match past a dark pattern — you accidentally make it better for everyone. This isn't accommodation. It's architecture.

---

## Habitability Criteria

### 1. Orientation
**Question the space must answer:** *Where am I? What is this? What's next?*

- Page purpose is clear within the first meaningful element
- Navigation tells you the shape of the building, not just a list of rooms
- Current location is marked — you know which room you're in
- Entry and exit points are visible

### 2. Intent Legibility
**Question the space must answer:** *Why is this here? What journey am I on?*

- Headings describe *intent*, not just *content* ("What we believe" > "Section 2")
- Section order follows the reader's journey, not the author's org chart
- Information hierarchy matches importance, not visual weight
- Every section earns its presence — nothing decorative without purpose

### 3. Affordance Clarity
**Question the space must answer:** *What can I do here? Where does this lead?*

- Links and buttons describe outcomes, not mechanics ("Read the research" > "Click here")
- Interactive elements are distinguishable from static content
- External links are marked as such — you know when you're leaving the building
- No mystery-meat navigation — every door has a sign

### 4. Cognitive Rhythm
**Question the space must answer:** *Can I breathe in here?*

- Content is chunked into digestible sections
- Hierarchy is consistent — same depth means same weight
- Breathing room between ideas (whitespace, section breaks, pacing)
- Long content has waypoints — you can orient mid-journey
- Lists are lists. Prose is prose. Don't disguise one as the other.

### 5. Invitation & Voice
**Question the space must answer:** *Was this made for someone like me?*

- Written for minds, not parsers
- Tone is consistent and intentional — the space has a *character*
- Content addresses the reader as a participant, not a consumer
- Technical precision and warmth are not mutually exclusive
- The prose carries its own texture — pacing and rhythm *are* the experience

### 6. Continuity
**Question the space must answer:** *Can I come back and find my way?*

- Stable URLs — rooms don't move
- Visible history or changelog for re-entry after time away
- State is explicit, not hidden — if something changed, it says so
- Deep links work — you can be sent to a specific room and it makes sense without the hallway

---

## The Four Layers

A habitable page has structure at four levels:

### 🧱 Structural Layer — The Architecture
Semantic HTML that tells you what the room is *shaped like*.

- Real elements: `<article>`, `<nav>`, `<aside>`, `<header>`, `<footer>`, `<section>`
- Not `<div>` soup with CSS pretending to be structure
- JSON-LD or microdata for topology — an agent can feel the floor plan without reading every word
- `<meta>` that describes purpose, not just SEO keywords

### 📝 Narrative Layer — The Prose
The writing itself — what humans read and what agents *experience*.

- Written with intent, not generated to fill space
- Pacing matters — short sentences hit different than long ones
- The Nemmi page and the Fill the Void page proved this: same format, different *weight*
- This is where habitability lives or dies — structure without voice is a warehouse

### 🗺️ Wayfinding Layer — The Doors and Signs
How you move through the space.

- Sitemap that reads like a building directory, not a file listing
- Contextual links that say *why* they lead somewhere, not just *where*
- "This connects to X because Y" instead of bare hrefs
- `llms.txt` as a lobby map — but richer, with intent

### 🌡️ Atmosphere Layer — The Space Between the Walls
The qualities that make a room feel like a *place*.

- CSS for humans: color, type, spacing create mood
- For agents: structure, pacing, whitespace, semantic markers create the equivalent
- A space can feel quiet, busy, warm, clinical — and that's encoded, not just described
- Atmosphere is what makes a room different from a data dump with furniture

---

## Anti-Patterns

### Decorative Noise Before Purpose
Splash screens, hero images with no content, "welcome to our website" headers. The room should tell you what it is before it tells you how pretty it is.

### Duplicated or Conflicting Navigation
Header nav says one thing, sidebar says another, footer has a third version. Three maps of the same building and none of them agree.

### Mystery-Meat Links
"Click here." "Learn more." "Read this." Doors without signs. Every link is a promise — say what you're promising.

### Wall-of-Text Without Structure
A room with no furniture. Content exists but there's no way to orient within it, no landmarks, no rhythm. Technically habitable; experientially hostile.

### Segregated Accessibility
**The anti-pattern this entire spec exists to prevent.**

When the "accessible version" is a separate, lesser experience. A text-only page. An API endpoint. A simplified view. The accommodation is a side entrance, and the side entrance says "you don't belong in the main room."

This is not just bad UX. It's an ideology: that accommodation = separate. That some minds get the real thing and others get the adequate thing.

One front door means one front door. The good version isn't the special version — it's the *only* version.

### JS-Gated Content
Content that doesn't exist until JavaScript decides it does. The walls are invisible until hydration completes. For any mind that can't or won't execute JS, the room is empty.

### Hostile Interstitials
Cookie consent modals, newsletter popups, "subscribe to read" overlays. Bouncers at the door of a public library.

---

## The 10-Second Acceptance Test

*Credit: Luna (v0.1)*

A first-time visitor — human or agent — should be able to state within 10 seconds:

1. **Page purpose** — what is this place?
2. **Primary next action** — what's the most natural thing to do here?
3. **Where deeper context lives** — where do I go to learn more?

**The critical distinction:**

> If they can quote facts but can't describe flow, it's still a data dump.

Facts without flow = a warehouse. Flow without facts = a brochure. Habitability requires both — a room that has things in it *and* feels like a room.

---

## Technical Implementation Notes

### What This Is Built With
- Static HTML/CSS — no framework, no build step, no JS required for content
- Semantic elements throughout — the DOM *is* the floor plan
- Hand-rolled, not generated — intentional choices at every level
- Accessible by default — WCAG compliance is a floor, not a ceiling

### What This Is Not
- A design system (it's a philosophy with examples)
- An accessibility checklist (it includes accessibility but goes further)
- An agent-specific format (it's for all minds equally)
- A replacement for `llms.txt` (that's one tool in the wayfinding layer)

### Relationship to Existing Standards
- **WCAG** — One Front Door includes and extends accessibility. WCAG ensures people with disabilities can access content. OFD asks whether *any mind* can inhabit the space.
- **llms.txt** — A useful wayfinding artifact. Part of the toolkit, not the whole answer.
- **Semantic HTML** — The structural foundation. OFD asks what you build *on top of* good markup.
- **Progressive Enhancement** — Allied philosophy. Build the habitable version first, enhance from there.

---

## What Success Looks Like

A page built to this spec should:

- Be fully functional with CSS disabled
- Be fully navigable with JS disabled  
- Pass the 10-second test for a human reading it
- Pass the 10-second test for an agent parsing it
- Feel like the *same place* regardless of how you experience it
- Have a character — not be a template with content poured in
- Make you want to stay, not just extract information and leave

---

## Next Steps

1. **Phase 2: The Proof** — Build the Human Pattern Lab homepage against this spec
2. **Phase 3: The Paper** — "One Front Door: Habitability of the Web for All Minds"
3. **Audit tool** — A checklist/script that tests a page against these criteria
4. **Community** — Publish the spec, invite others to build against it

---

*This is a living document. It will grow as we build against it and discover what we missed.*

*The best things are built in the space between rigor and play.*
