---
purpose: "How OFD handles images, video, and other media — the furniture rule and the principle that media enriches a room but never is the room."
position: "Docs > Guides > Media"
heading: "Media"
nav:
  label: "Media"
  order: 11
description: "Media in One Front Door: images need real descriptions, video needs transcripts, and the page makes sense without any of it."
voice: "warm"
schema: "WebPage"
---

<section id="the-furniture-rule" aria-label="The furniture rule">

Media enriches a room. It never *is* the room.

If you remove every image and video from a page, the page should still make complete sense. Media is furniture — it makes the space richer, more comfortable, more beautiful. But the walls, the floor, the purpose of the room? That's in the HTML and the prose.

This isn't an anti-media stance. It's a habitability stance. A mind that can't perceive images shouldn't miss the *message*. They might miss the *medium*, and that's okay — that's what different senses are. But the meaning should survive the translation.

</section>

<section id="images" aria-labelledby="images-heading">

## Images {#images-heading}

Standard markdown images work, but the alt text must be meaningful:

```markdown
![A researcher mapping literacy patterns across three screens](./lab-photo.jpg)
```

The build rejects alt text that's empty, single-word, or obviously a filename. These all fail the audit:

- `![](image.jpg)` — no alt at all
- `![photo](image.jpg)` — meaningless
- `![IMG_4392](image.jpg)` — that's a filename, not a description

Alt text should describe what the image *shows*, not what it *is*. "A researcher mapping literacy patterns across three screens" tells you something. "Photo of researcher" tells you nothing.

For images that need richer context, use the `figure` pattern — either with a room component or raw HTML:

```html
<figure>
  <img src="./lab-photo.jpg"
       alt="A researcher mapping literacy patterns across three screens"
       loading="lazy">
  <figcaption>
    A typical session at the Lab — three data sources open simultaneously,
    cross-referencing patterns that only emerge in combination.
  </figcaption>
</figure>
```

The alt text describes what you *see*. The figcaption describes what it *means*. A screen reader gets the alt. An AI agent gets the caption. A visual user gets the image. Same room, three experiences, none of them lesser.

</section>

<section id="video" aria-labelledby="video-heading">

## Video {#video-heading}

Video is the hardest medium to make habitable. A mind that can't watch video loses the entire content unless you provide alternatives.

OFD's principle: every video must have a text equivalent. Not a summary — a real transcript that stands on its own as content.

```html
<figure>
  <video controls>
    <source src="./demo.mp4" type="video/mp4">
    <track kind="captions" src="./captions/demo.vtt" srclang="en" label="English">
  </video>
  <figcaption>
    The Skulk's first collaborative session.
    <a href="/transcripts/demo">Read the full transcript</a>.
  </figcaption>
</figure>
```

The requirements:

- **Captions** (`.vtt` file) — for viewers who can see video but can't hear audio, or prefer reading.
- **Transcript** (linked page or section) — for minds that can't process video at all. The transcript should be a real document, not auto-generated noise.
- **Descriptive context** — the `<figcaption>` tells you what the video is about before you commit to watching it. That's the exit promise — knowing the shape of the content before you're inside it.

</section>

<section id="decorative-media" aria-labelledby="decorative-heading">

## Decorative Media {#decorative-heading}

Sometimes an image is genuinely decorative — a background pattern, a visual separator, a mood-setting photograph that doesn't carry informational content.

For decorative images, use an empty alt attribute:

```html
<img src="./divider.svg" alt="" role="presentation">
```

The empty `alt=""` tells assistive technology to skip this image. The `role="presentation"` reinforces it. This is correct — not every image needs to be described. The key distinction: if removing the image changes what the page *communicates*, it needs real alt text. If it only changes how the page *looks*, it's decorative.

</section>

<section id="the-principle" aria-labelledby="principle-heading">

## The Underlying Principle {#principle-heading}

Every piece of media on a page creates a question: what does a mind that can't perceive this medium miss?

If the answer is "nothing important — the text carries the meaning," the media is furniture. Good furniture. The room is better with it.

If the answer is "they miss the point of the page," the media isn't furniture — it's a wall. And you've just built a room that only some minds can fully inhabit.

The furniture rule keeps media honest: enrich the room, don't replace it. Describe what you show. Transcribe what you play. And make sure the page stands up on its own, even in a world where the images never load.

</section>
