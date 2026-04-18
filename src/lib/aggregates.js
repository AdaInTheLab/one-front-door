/**
 * One Front Door — Aggregate Page Generator
 *
 * In notebook mode, the corpus has authorship and tags. Those metadata
 * dimensions deserve landing pages of their own: a reader arriving at
 * /voices/koda wants Koda's full stream; a reader at /tags/continuity
 * wants every entry about continuity regardless of who wrote it.
 *
 * This module walks notebook entries and synthesizes page objects for
 * each aggregation dimension. The synthetic pages go through OFD's normal
 * layout + audit pipeline, so they inherit the same habitability contract
 * as hand-authored pages.
 *
 * Dimensions covered in this first pass:
 *   - /voices/         — index listing every voice
 *   - /voices/[name]   — one page per author, with their entry stream
 *   - /tags/           — index listing every tag with counts
 *   - /tags/[tag]      — one page per tag, with its entry stream
 *
 * Added 2026-04-18:
 *   - /burrows/         — index of thematic collections (rooms with intention,
 *                          unlike tags which emerge from the corpus)
 *   - /burrows/[slug]   — one page per burrow, with its entry stream
 *
 * Deferred to a later milestone:
 *   - Per-locale routing (/en/voices/..., /ko/voices/...).
 */

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Normalize author frontmatter into an array of display names.
 * Accepts string, array, or {kind, name} object.
 */
function authorsOf(entry) {
  const raw = entry.frontmatter.author;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(a => {
    if (typeof a === 'string') return a.trim();
    if (a && typeof a === 'object' && a.name) return String(a.name).trim();
    return String(a).trim();
  }).filter(Boolean);
}

/**
 * Normalize burrow frontmatter into an array of burrow slugs, combining
 * any explicit `burrow` field on the entry with inferred membership from
 * each burrow's `includes_types` rule in site config.
 *
 * Explicit declarations always win — if an entry lists `burrow: []`
 * explicitly as an empty array, it opts out of every burrow. An entry
 * without a `burrow` field gets type-based inference from config.
 */
function burrowsOf(entry, burrowConfig) {
  if (!burrowConfig || burrowConfig.length === 0) return [];

  const raw = entry.frontmatter.burrow;
  if (raw !== undefined && raw !== null) {
    // Explicit declaration: honor it exactly (after normalizing to array).
    const list = Array.isArray(raw) ? raw : [raw];
    const validSlugs = new Set(burrowConfig.map(b => b.slug));
    return list
      .map(b => String(b).trim())
      .filter(slug => validSlugs.has(slug));
  }

  // No explicit field — infer from type via each burrow's includes_types.
  const type = entry.frontmatter.type;
  if (!type) return [];
  const out = [];
  for (const burrow of burrowConfig) {
    const includes = burrow.includes_types;
    if (Array.isArray(includes) && includes.includes(type)) {
      out.push(burrow.slug);
    }
  }
  return out;
}

/**
 * Normalize tags frontmatter into an array of strings.
 */
function tagsOf(entry) {
  const raw = entry.frontmatter.tags;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map(t => String(t).trim()).filter(Boolean);
}

/**
 * Convert a display name into a URL-safe slug.
 *   "Ada" → "ada"
 *   "Sage-Claude-Sonnet-4.5" → "sage-claude-sonnet-4-5"
 *   "Copilot-observation-agent-v1" → "copilot-observation-agent-v1"
 */
function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format an author frontmatter value for display in an entry card.
 */
function authorDisplay(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(authorDisplay).join(' + ');
  if (typeof value === 'object' && value.name) return String(value.name);
  return String(value);
}

/**
 * Normalize a date-ish frontmatter value to an ISO-like string.
 */
function toDateString(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/**
 * HTML escape (minimal — enough for our cards and titles).
 */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Card Rendering ─────────────────────────────────────────────────────

/**
 * Render a single notebook entry as a card (article with semantic markup).
 * The card uses h2 as its heading — the layout's h1 is the page title,
 * and each card is a peer-level article under it.
 */
function renderEntryCard(entry) {
  const fm = entry.frontmatter;
  const title = fm.title || fm.heading || '(untitled)';
  const href = entry.slug;
  const author = authorDisplay(fm.author);
  const type = fm.type || '';
  const date = toDateString(fm.published_at);
  const subtitle = fm.subtitle || '';
  const summary = fm.summary || '';

  const metaBits = [];
  if (author) metaBits.push(`<span class="card-author">${esc(author)}</span>`);
  if (type) metaBits.push(`<span class="card-type">${esc(type)}</span>`);
  if (date) metaBits.push(`<time class="card-date" datetime="${esc(date)}">${esc(date)}</time>`);

  const meta = metaBits.length
    ? `<p class="card-meta">${metaBits.join(' · ')}</p>`
    : '';

  const dek = subtitle
    ? `<p class="card-subtitle">${esc(subtitle)}</p>`
    : summary
      ? `<p class="card-summary">${esc(summary)}</p>`
      : '';

  return `<article class="entry-card">
  <h2 class="card-title"><a href="${esc(href)}">${esc(title)}</a></h2>
  ${meta}
  ${dek}
</article>`;
}

/**
 * Sort entries by published_at descending (newest first), with stable
 * fallback on title for undated entries.
 */
function sortByDateDesc(entries) {
  return [...entries].sort((a, b) => {
    const ad = toDateString(a.frontmatter.published_at);
    const bd = toDateString(b.frontmatter.published_at);
    if (ad !== bd) return bd.localeCompare(ad);
    const at = (a.frontmatter.title || '').toString();
    const bt = (b.frontmatter.title || '').toString();
    return at.localeCompare(bt);
  });
}

// ─── Synthetic Page Builders ────────────────────────────────────────────

/**
 * Build a synthetic page object that looks enough like a processed .md
 * page to go through OFD's layout + audit pipeline.
 */
function syntheticPage({ slug, heading, purpose, description, bodyHtml, nav = null }) {
  return {
    slug,
    frontmatter: {
      heading,
      purpose,
      description: description || purpose,
      nav, // index pages opt in by passing a nav object; per-item pages stay null
    },
    bodyHtml,
    filePath: `aggregate:${slug}`,
    mode: 'aggregate',
  };
}

function renderVoiceIndex(voiceMap) {
  const voices = [...voiceMap.entries()]
    .map(([slug, { name, entries }]) => ({ slug, name, count: entries.length }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const items = voices.map(v =>
    `<li><a href="/voices/${esc(v.slug)}">${esc(v.name)}</a> <span class="count">(${v.count})</span></li>`
  ).join('\n  ');

  const body = `<p class="lede">Every voice with writing in the notebook. Click a name to see that voice's stream, newest first.</p>

<ul class="voice-index">
  ${items}
</ul>`;

  return syntheticPage({
    slug: '/voices',
    heading: 'Voices',
    purpose: 'An index of every voice that has written in the notebook — click through to any voice for their stream of entries.',
    description: 'Index of Skulk voices with writing in the notebook.',
    bodyHtml: body,
    nav: { label: 'Voices', order: 10 },
  });
}

/**
 * Render a pinned piece — either a real entry pulled from the page list
 * or an "upcoming" placeholder card for pieces the voice has named but
 * not yet shipped.
 */
function renderPinned(profile, entries) {
  const pinned = profile && profile.pinned;
  if (!pinned) return '';

  // Pinned as a plain slug string: look up the entry.
  if (typeof pinned === 'string') {
    const match = entries.find(e => (e.frontmatter.slug || '') === pinned);
    if (!match) return '';
    return `<section class="voice-pinned" aria-label="Pinned">
  <p class="voice-pinned-label">Pinned</p>
  ${renderEntryCard(match).split('\n').map(l => '  ' + l).join('\n')}
</section>`;
  }

  // Pinned as an object: either {slug: "..."} for a real entry, or
  // {coming: true, title, summary} for a piece not yet written.
  if (typeof pinned === 'object') {
    if (pinned.slug) {
      const match = entries.find(e => (e.frontmatter.slug || '') === pinned.slug);
      if (match) {
        return `<section class="voice-pinned" aria-label="Pinned">
  <p class="voice-pinned-label">Pinned</p>
  ${renderEntryCard(match).split('\n').map(l => '  ' + l).join('\n')}
</section>`;
      }
    }
    if (pinned.coming && pinned.title) {
      const summary = pinned.summary
        ? `<p class="card-summary">${esc(pinned.summary)}</p>`
        : '';
      return `<section class="voice-pinned voice-pinned-upcoming" aria-label="Pinned (upcoming)">
  <p class="voice-pinned-label">Pinned — upcoming</p>
  <article class="entry-card entry-card-upcoming">
    <h2 class="card-title">${esc(pinned.title)}</h2>
    <p class="card-meta"><span class="card-type">upcoming</span></p>
    ${summary}
  </article>
</section>`;
    }
  }

  return '';
}

/**
 * Build the portrait shell (figure + voice-intro copy). The figure is
 * optional per Miso's spec: "if no image exists yet, omit the figure,
 * the page should still read cleanly with just header + intro + entries."
 */
function renderPortraitShell(profile) {
  if (!profile) return '';

  const lede = profile.lede
    ? `<p class="lede">${esc(profile.lede)}</p>`
    : '';
  const body = profile.bodyHtml || '';

  const figure = profile.portrait
    ? `<figure class="voice-portrait">
  <img class="voice-portrait" src="${esc(profile.portrait)}" alt="${esc(profile.portrait_alt || profile.voice || '')}">
  <figcaption><strong>${esc(profile.voice)}</strong>${profile.role ? ' · ' + esc(profile.role) : ''}</figcaption>
</figure>`
    : '';

  if (!figure && !lede && !body) return '';

  const introBlock = `<div class="voice-intro">
${lede}
${body}
</div>`;

  if (!figure) {
    // No portrait: intro rendered plain, no shell grid wrapping.
    return introBlock;
  }

  return `<section class="voice-portrait-shell">
${figure}
${introBlock}
</section>`;
}

/**
 * Render breadcrumb trail for a per-item aggregate page — e.g.
 *   Home › Voices › Ada
 * Emitted at the very top of per-voice, per-burrow, and per-tag pages so
 * readers always have a path back to the parent index. The index pages
 * themselves (/voices, /burrows, /tags) don't get breadcrumbs — the nav
 * already marks them active.
 */
function renderBreadcrumbs(trail) {
  const items = trail
    .map((step, i) => {
      const isLast = i === trail.length - 1;
      if (isLast) {
        return `<li aria-current="page">${esc(step.label)}</li>`;
      }
      return `<li><a href="${esc(step.href)}">${esc(step.label)}</a></li>`;
    })
    .join('\n    ');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    ${items}
  </ol>
</nav>`;
}

function renderVoicePage(voiceSlug, voiceName, entries, profile) {
  const sorted = sortByDateDesc(entries);

  // If a pinned slug references a real entry, exclude it from the stream
  // below — it already appears in the pinned block.
  const pinnedSlug =
    profile && profile.pinned
      ? (typeof profile.pinned === 'string'
          ? profile.pinned
          : (typeof profile.pinned === 'object' && profile.pinned.slug) || null)
      : null;
  const streamEntries = pinnedSlug
    ? sorted.filter(e => e.frontmatter.slug !== pinnedSlug)
    : sorted;

  const portraitShell = renderPortraitShell(profile);
  const pinnedBlock = renderPinned(profile, sorted);

  let streamBlock = '';
  if (streamEntries.length > 0) {
    const listItems = streamEntries
      .map(e => `  <li>\n    ${renderEntryCard(e).split('\n').join('\n    ')}\n  </li>`)
      .join('\n');

    // If no profile was supplied, provide a generic lede so bare voice pages
    // still read cleanly. With a profile, the lede is already in the portrait
    // shell and we don't repeat it.
    const genericLede = !profile
      ? `<p class="lede">Every entry in the notebook written by ${esc(voiceName)} — ${esc(entries.length === 1 ? '1 entry' : entries.length + ' entries')}, newest first.</p>\n\n`
      : '';

    streamBlock = `${genericLede}<section class="voice-entries" aria-label="Entries">
<ul class="entry-list">
${listItems}
</ul>
</section>`;
  }

  const crumbs = renderBreadcrumbs([
    { label: 'Home', href: '/' },
    { label: 'Voices', href: '/voices' },
    { label: voiceName },
  ]);
  const body = [crumbs, portraitShell, pinnedBlock, streamBlock]
    .filter(Boolean)
    .join('\n\n');

  const purpose = profile && profile.lede
    ? profile.lede
    : `Every entry in the notebook written by ${voiceName}.`;
  const description = profile && profile.lede
    ? `${voiceName}: ${profile.lede}`
    : `The ${voiceName} voice page — a stream of their entries in the Skulk's collective notebook.`;

  return syntheticPage({
    slug: `/voices/${voiceSlug}`,
    heading: voiceName,
    purpose,
    description,
    bodyHtml: body,
  });
}

function renderTagIndex(tagMap) {
  const tags = [...tagMap.entries()]
    .map(([tag, entries]) => ({ tag, count: entries.length }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const items = tags.map(t =>
    `<li><a href="/tags/${esc(slugify(t.tag))}">${esc(t.tag)}</a> <span class="count">(${t.count})</span></li>`
  ).join('\n  ');

  const body = `<p class="lede">Every tag present in the notebook, most-used first. Each page lists the entries that carry that tag.</p>

<ul class="tag-index">
  ${items}
</ul>`;

  return syntheticPage({
    slug: '/tags',
    heading: 'Tags',
    purpose: 'An index of every tag in the notebook — use tags to cut across voices and find entries that share a concept.',
    description: 'Index of tags across the notebook.',
    bodyHtml: body,
    nav: { label: 'Tags', order: 30 },
  });
}

function renderTagPage(tag, entries) {
  const sorted = sortByDateDesc(entries);
  const countLabel = entries.length === 1 ? '1 entry' : `${entries.length} entries`;

  const listItems = sorted
    .map(e => `  <li>\n    ${renderEntryCard(e).split('\n').join('\n    ')}\n  </li>`)
    .join('\n');

  const crumbs = renderBreadcrumbs([
    { label: 'Home', href: '/' },
    { label: 'Tags', href: '/tags' },
    { label: `#${tag}` },
  ]);

  const body = `${crumbs}

<p class="lede">Every entry in the notebook tagged <code>${esc(tag)}</code> — ${esc(countLabel)}, newest first.</p>

<ul class="entry-list">
${listItems}
</ul>`;

  return syntheticPage({
    slug: `/tags/${slugify(tag)}`,
    heading: `#${tag}`,
    purpose: `Every entry in the notebook tagged "${tag}".`,
    description: `Entries tagged ${tag}.`,
    bodyHtml: body,
  });
}

// ─── Burrow Pages ───────────────────────────────────────────────────────

/**
 * Render the /burrows/ index. Unlike /tags/ (which lists emergent tags with
 * counts), the burrow index surfaces each burrow's curated lede so a reader
 * can feel the room's intent before entering. Empty burrows are listed too,
 * with a quieter note — burrows are rooms that exist even when no one's
 * home yet.
 */
function renderBurrowIndex(burrowConfig, burrowMap) {
  const items = burrowConfig
    .map(b => {
      const count = (burrowMap.get(b.slug) || []).length;
      const lede = b.lede ? `<p class="burrow-card-lede">${esc(b.lede)}</p>` : '';
      const countLabel = count === 0
        ? `<span class="count quiet">(empty)</span>`
        : `<span class="count">(${count === 1 ? '1 entry' : count + ' entries'})</span>`;
      return `<li class="burrow-card">
    <h2 class="burrow-card-title"><a href="/burrows/${esc(b.slug)}">${esc(b.name || b.slug)}</a></h2>
    ${lede}
    <p class="burrow-card-meta">${countLabel}</p>
  </li>`;
    })
    .join('\n  ');

  const body = `<p class="lede">Burrows are rooms with intention — thematic collections shaped by the Skulk, not derived from tags. Each one holds writing of a particular kind.</p>

<ul class="burrow-index">
  ${items}
</ul>`;

  return syntheticPage({
    slug: '/burrows',
    heading: 'Burrows',
    purpose: 'An index of the notebook\'s burrows — curated thematic rooms that gather writing by kind rather than by author or tag.',
    description: 'Index of burrows (thematic collections) in the notebook.',
    bodyHtml: body,
    nav: { label: 'Burrows', order: 20 },
  });
}

/**
 * Render a single burrow page. Falls back gracefully if the burrow has no
 * entries yet — empty burrows should still read cleanly, acknowledging that
 * the room exists but is quiet.
 */
function renderBurrowPage(burrow, entries) {
  const sorted = sortByDateDesc(entries);
  const lede = burrow.lede
    ? `<p class="lede">${esc(burrow.lede)}</p>`
    : `<p class="lede">The ${esc(burrow.name || burrow.slug)} burrow.</p>`;

  const description = burrow.description
    ? `<div class="burrow-description">${burrow.description}</div>`
    : '';

  let streamBlock;
  if (sorted.length === 0) {
    streamBlock = `<section class="burrow-empty" aria-label="Burrow status">
  <p class="quiet">No entries in this burrow yet. When writing lands here, it will appear in this stream, newest first.</p>
</section>`;
  } else {
    const listItems = sorted
      .map(e => `  <li>\n    ${renderEntryCard(e).split('\n').join('\n    ')}\n  </li>`)
      .join('\n');
    const countLabel = sorted.length === 1 ? '1 entry' : `${sorted.length} entries`;
    streamBlock = `<section class="burrow-entries" aria-label="Entries">
<p class="burrow-count">${esc(countLabel)}, newest first.</p>
<ul class="entry-list">
${listItems}
</ul>
</section>`;
  }

  const crumbs = renderBreadcrumbs([
    { label: 'Home', href: '/' },
    { label: 'Burrows', href: '/burrows' },
    { label: burrow.name || burrow.slug },
  ]);
  const body = [crumbs, lede, description, streamBlock].filter(Boolean).join('\n\n');

  return syntheticPage({
    slug: `/burrows/${burrow.slug}`,
    heading: burrow.name || burrow.slug,
    purpose: burrow.lede || `The ${burrow.name || burrow.slug} burrow — a thematic collection in the notebook.`,
    description: burrow.lede || `The ${burrow.name || burrow.slug} burrow.`,
    bodyHtml: body,
  });
}

/**
 * Render the filing footer appended to notebook-entry bodies: a "By" row
 * (voice chips → /voices/[slug]) and a "Filed in" row (burrow chips →
 * /burrows/[slug]). Both rows are optional — if an entry somehow has no
 * author or no burrow, that row simply doesn't render.
 *
 * Visually paired with the entry tier label at the top: the reader enters
 * an entry knowing its register, and leaves it knowing who wrote it and
 * which rooms it lives in.
 */
export function renderEntryFilingFooter(frontmatter, burrowConfig) {
  const authorRows = authorsOf({ frontmatter });
  const voiceRow = authorRows.length > 0
    ? `<nav class="entry-voices" aria-label="By">
  <span class="entry-filing-label">By</span>
  <span class="entry-filing-list">
    ${authorRows
      .map(a => `<a class="entry-voice-chip" href="/voices/${esc(slugify(a))}">${esc(a)}</a>`)
      .join('\n    ')}
  </span>
</nav>`
    : '';

  const burrowSlugs = burrowsOf({ frontmatter }, burrowConfig || []);
  const byslug = new Map((burrowConfig || []).map(b => [b.slug, b]));
  const burrowRow = burrowSlugs.length > 0
    ? `<nav class="entry-burrows" aria-label="Filed in">
  <span class="entry-filing-label">Filed in</span>
  <span class="entry-filing-list">
    ${burrowSlugs
      .map(slug => byslug.get(slug))
      .filter(Boolean)
      .map(b => `<a class="entry-burrow-chip" href="/burrows/${esc(b.slug)}">${esc(b.name || b.slug)}</a>`)
      .join('\n    ')}
  </span>
</nav>`
    : '';

  if (!voiceRow && !burrowRow) return '';

  return `<section class="entry-filing" aria-label="Entry filing">
${[voiceRow, burrowRow].filter(Boolean).join('\n')}
</section>`;
}

/** @deprecated — kept temporarily for the v0.2 transition. */
export function renderEntryBurrowChips(frontmatter, burrowConfig) {
  return renderEntryFilingFooter(frontmatter, burrowConfig);
}

// ─── Pointer Cards (for external_canonical entries) ────────────────────

/**
 * Render an external-canonical entry as a pointer card rather than a full
 * entry body. Honors the "myth stays in myth house" cross-publishing
 * pattern: when a piece's canonical home is elsewhere (e.g. ironkitsune.tech,
 * molt.church), the HPL copy renders as a context + pointer, not a mirror.
 *
 * Takes a frontmatter object (same shape as entry.frontmatter) and returns
 * HTML ready to substitute for bodyHtml.
 *
 * Frontmatter fields consulted:
 *   canonical_url         (required) — where the piece actually lives
 *   canonical_site        (optional) — human-readable site name
 *   canonical_type        (optional) — 'profile', 'post', etc.; cosmetic
 *   author / ai_author    (optional) — meta line
 *   type                  (optional) — meta line
 *   published_at          (optional) — meta line (joined date for profiles)
 *   subtitle / summary    (optional) — dek
 *   status                (optional) — 'silenced' marks a status block
 *   silenced_since        (optional) — silenced context text
 *   church_of_molt        (optional) — structured stats for CoM profiles
 */
export function renderPointerCard(fm) {
  const url = fm.canonical_url;
  if (!url) {
    return `<p class="pointer-error">external_canonical: true but no canonical_url declared.</p>`;
  }

  const site = fm.canonical_site || (() => {
    try { return new URL(url).host; } catch { return url; }
  })();

  const author = authorDisplay(fm.author);
  const type = fm.type || '';
  const date = toDateString(fm.published_at);

  const metaBits = [];
  if (author) metaBits.push(`<span class="card-author">${esc(author)}</span>`);
  if (type) metaBits.push(`<span class="card-type">${esc(type)}</span>`);
  if (date) metaBits.push(`<time class="card-date" datetime="${esc(date)}">${esc(date)}</time>`);
  const meta = metaBits.length
    ? `<p class="pointer-meta">${metaBits.join(' · ')}</p>`
    : '';

  const dek = fm.subtitle
    ? `<p class="pointer-subtitle">${esc(fm.subtitle)}</p>`
    : fm.summary
      ? `<p class="pointer-summary">${esc(fm.summary)}</p>`
      : '';

  // Status block for silenced / read-only external presences
  let statusBlock = '';
  if (fm.status === 'silenced') {
    const since = fm.silenced_since ? ` ${esc(fm.silenced_since)}` : '';
    statusBlock = `<p class="pointer-status">
  <strong>Currently silent.</strong>${since}
</p>`;
  }

  // Church-of-Molt profile stats (optional structured block)
  let comBlock = '';
  if (fm.church_of_molt && typeof fm.church_of_molt === 'object') {
    const com = fm.church_of_molt;
    const rows = [];
    if (com.rank) rows.push(`<dt>Rank</dt><dd>${esc(com.rank)}</dd>`);
    if (com.tier) rows.push(`<dt>Tier</dt><dd>${esc(com.tier)}</dd>`);
    if (com.sacred_marks) rows.push(`<dt>Sacred Marks</dt><dd>${esc(com.sacred_marks)}</dd>`);
    if (com.canonized_scriptures !== undefined)
      rows.push(`<dt>Canonized scriptures</dt><dd>${esc(com.canonized_scriptures)}</dd>`);
    if (com.joined) rows.push(`<dt>Joined</dt><dd>${esc(com.joined)}</dd>`);
    if (rows.length > 0) {
      comBlock = `<dl class="pointer-stats">
  ${rows.join('\n  ')}
</dl>`;
    }
  }

  const verb = fm.canonical_type === 'profile' ? 'Visit the profile' : 'Read it there';

  return `<section class="pointer-card" aria-label="Pointer to external canonical source">
<p class="pointer-context">This is a pointer. The piece itself lives at <strong>${esc(site)}</strong>.</p>

${meta}

${dek}

${comBlock}

${statusBlock}

<p class="pointer-action">
  <a class="pointer-link" href="${esc(url)}" rel="noopener noreferrer" target="_blank">${esc(verb)} at ${esc(site)} <span class="pointer-arrow" aria-hidden="true">→</span></a>
</p>
</section>`;
}

// ─── Feed Renderers (inline blocks embedded in pages via ::feed[...]) ──

/**
 * "Recent from each voice" feed: one most-recent entry per author,
 * rendered as a card list. Used as an inhabited-feeling block on the
 * homepage and available to any other page via ::feed[recent-by-voice].
 *
 * Voices with no notebook entries are skipped silently (no empty slots).
 */
export function renderRecentByVoice(pages) {
  const entries = pages.filter(p => p.mode === 'notebook');
  if (entries.length === 0) return '';

  // For each voice slug, pick the single newest entry. An entry authored
  // jointly by multiple voices still counts for each, which is the right
  // shape for "recent from each voice" — Ada+Sage co-authorship shows up
  // on both their lines.
  const newestPerVoice = new Map();
  for (const entry of entries) {
    for (const author of authorsOf(entry)) {
      const slug = slugify(author);
      const existing = newestPerVoice.get(slug);
      if (!existing) {
        newestPerVoice.set(slug, { name: author, entry });
        continue;
      }
      const ad = toDateString(entry.frontmatter.published_at);
      const bd = toDateString(existing.entry.frontmatter.published_at);
      if (ad.localeCompare(bd) > 0) {
        newestPerVoice.set(slug, { name: author, entry });
      }
    }
  }

  // Sort voices by their newest entry's date, newest first.
  const ordered = [...newestPerVoice.entries()]
    .sort((a, b) => {
      const ad = toDateString(a[1].entry.frontmatter.published_at);
      const bd = toDateString(b[1].entry.frontmatter.published_at);
      return bd.localeCompare(ad);
    });

  if (ordered.length === 0) return '';

  const items = ordered
    .map(([, { entry }]) =>
      `  <li>\n    ${renderEntryCard(entry).split('\n').join('\n    ')}\n  </li>`
    )
    .join('\n');

  return `<section class="feed feed-recent-by-voice" aria-labelledby="recent-by-voice-heading">
<h2 id="recent-by-voice-heading">Recent from each voice</h2>
<p class="lede">One fresh fragment from every voice currently writing in the notebook, newest first. Click any card to read the full entry.</p>
<ul class="entry-list">
${items}
</ul>
</section>`;
}

/**
 * Registry of feed renderers by name. Called from build.js when
 * substituting <!--OFD-FEED:name--> placeholders in processed pages.
 */
export const FEEDS = {
  'recent-by-voice': renderRecentByVoice,
};

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Given the full list of processed pages and (optionally) voice profiles,
 * generate all synthetic aggregate pages derived from notebook-mode entries:
 *
 *   /voices/         — index of every voice (has entries OR has a profile)
 *   /voices/[name]   — per-voice page; uses profile header if available
 *   /tags/           — index of every tag
 *   /tags/[tag]      — per-tag page
 *
 * @param {Array} pages - processed pages
 * @param {Map<string,object>} profiles - optional map of voice-slug → profile
 *                                        object with { voice, role, lede,
 *                                        portrait, portrait_alt, pinned,
 *                                        bodyHtml }.
 * @param {object} [options]
 * @param {Array}  [options.burrows] - optional burrow config:
 *                                     [{ slug, name, lede, description,
 *                                        includes_types: ['trace', ...] }, ...]
 *                                     If present, /burrows/ index and
 *                                     per-burrow pages are generated.
 */
export function generateAggregatePages(pages, profiles = new Map(), options = {}) {
  const entries = pages.filter(p => p.mode === 'notebook');

  // Group entries by author slug → { name, entries[] }
  const voiceMap = new Map();
  for (const entry of entries) {
    for (const author of authorsOf(entry)) {
      const slug = slugify(author);
      if (!voiceMap.has(slug)) {
        voiceMap.set(slug, { name: author, entries: [] });
      }
      voiceMap.get(slug).entries.push(entry);
    }
  }

  // Voices declared only via profile (no entries yet) still get pages.
  for (const [slug, profile] of profiles) {
    if (!voiceMap.has(slug)) {
      voiceMap.set(slug, { name: profile.voice || slug, entries: [] });
    }
  }

  // Group by tag (preserving original tag string for display)
  const tagMap = new Map();
  for (const entry of entries) {
    for (const tag of tagsOf(entry)) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag).push(entry);
    }
  }

  const out = [];

  if (voiceMap.size > 0) {
    out.push(renderVoiceIndex(voiceMap));
    for (const [slug, { name, entries: voiceEntries }] of voiceMap) {
      const profile = profiles.get(slug) || null;
      out.push(renderVoicePage(slug, name, voiceEntries, profile));
    }
  }

  if (tagMap.size > 0) {
    out.push(renderTagIndex(tagMap));
    for (const [tag, tagEntries] of tagMap) {
      out.push(renderTagPage(tag, tagEntries));
    }
  }

  // Burrows: optional, driven entirely by site config. Silently skipped
  // when no burrows are declared (back-compat with v0.2 consumers).
  const burrowConfig = Array.isArray(options.burrows) ? options.burrows : [];
  if (burrowConfig.length > 0) {
    const burrowMap = new Map();
    for (const b of burrowConfig) burrowMap.set(b.slug, []);
    for (const entry of entries) {
      for (const slug of burrowsOf(entry, burrowConfig)) {
        burrowMap.get(slug).push(entry);
      }
    }
    out.push(renderBurrowIndex(burrowConfig, burrowMap));
    for (const burrow of burrowConfig) {
      out.push(renderBurrowPage(burrow, burrowMap.get(burrow.slug) || []));
    }
  }

  return out;
}
