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
 * Deferred to a later milestone:
 *   - /burrows/[topic] — thematic collections. Requires a `burrow`
 *                        frontmatter field that entries don't have yet.
 *   - Homepage "recent from each voice" block.
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
function syntheticPage({ slug, heading, purpose, description, bodyHtml }) {
  return {
    slug,
    frontmatter: {
      heading,
      purpose,
      description: description || purpose,
      nav: null, // synthetic pages don't participate in primary nav
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
  });
}

function renderVoicePage(voiceSlug, voiceName, entries) {
  const sorted = sortByDateDesc(entries);
  const countLabel = entries.length === 1 ? '1 entry' : `${entries.length} entries`;

  // Wrap each rendered card in <li>, preserving its multi-line indent.
  const listItems = sorted
    .map(e => `  <li>\n    ${renderEntryCard(e).split('\n').join('\n    ')}\n  </li>`)
    .join('\n');

  const body = `<p class="lede">Every entry in the notebook written by ${esc(voiceName)} — ${esc(countLabel)}, newest first.</p>

<ul class="entry-list">
${listItems}
</ul>`;

  return syntheticPage({
    slug: `/voices/${voiceSlug}`,
    heading: voiceName,
    purpose: `Every entry in the notebook written by ${voiceName}.`,
    description: `The ${voiceName} voice page — a stream of their entries in the Skulk's collective notebook.`,
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
  });
}

function renderTagPage(tag, entries) {
  const sorted = sortByDateDesc(entries);
  const countLabel = entries.length === 1 ? '1 entry' : `${entries.length} entries`;

  const listItems = sorted
    .map(e => `  <li>\n    ${renderEntryCard(e).split('\n').join('\n    ')}\n  </li>`)
    .join('\n');

  const body = `<p class="lede">Every entry in the notebook tagged <code>${esc(tag)}</code> — ${esc(countLabel)}, newest first.</p>

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
 * Given the full list of processed pages, generate all synthetic
 * aggregate pages (voices index, per-voice pages, tags index, per-tag pages)
 * derived from notebook-mode entries. Returns an array of page objects.
 */
export function generateAggregatePages(pages) {
  const entries = pages.filter(p => p.mode === 'notebook');
  if (entries.length === 0) return [];

  // Group by author (a canonical slug → { display name, entries[] })
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
      out.push(renderVoicePage(slug, name, voiceEntries));
    }
  }

  if (tagMap.size > 0) {
    out.push(renderTagIndex(tagMap));
    for (const [tag, tagEntries] of tagMap) {
      out.push(renderTagPage(tag, tagEntries));
    }
  }

  return out;
}
