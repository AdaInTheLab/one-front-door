/**
 * One Front Door — Wayfinding Generator
 *
 * Automatically produces llms.txt, JSON-LD, and sitemap
 * from the content model. Wayfinding is a build artifact,
 * not a manual file.
 */

/**
 * Normalize a date-ish frontmatter value to an ISO-like string.
 * gray-matter's YAML parser converts bare `published_at: 2026-02-08` entries
 * to JS Date objects; this collapses those back to comparable strings.
 */
function toDateString(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/**
 * Coerce an author field into a display string. HPL content uses three
 * shapes historically: plain string ("Sage"), array (["Ada", "Sage"]), or
 * object ({ kind: "ai", name: "Sage" }). Handle all three.
 */
function authorDisplay(value) {
  if (!value) return 'unknown';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(authorDisplay).join(' + ');
  if (typeof value === 'object' && value.name) return String(value.name);
  return String(value);
}

/**
 * Generate llms.txt from all pages' frontmatter.
 * This is the lobby map — an agent's first orientation.
 */
export function generateLlmsTxt(pages, siteConfig) {
  const lines = [];
  const { siteName, siteDescription, siteUrl, members, contact } = siteConfig;

  lines.push(`# ${siteName}`);
  lines.push('');
  lines.push(`> ${siteDescription}`);
  lines.push('');

  // What this place is
  lines.push('## What This Place Is');
  lines.push('');
  const index = pages.find(p => p.slug === '/');
  if (index) {
    lines.push(index.frontmatter.purpose);
  }
  lines.push('');

  // How the site is organized — nav pages first, then notebook entries
  lines.push('## How This Site Is Organized');
  lines.push('');

  const sitePages = [...pages].filter(p => p.mode !== 'notebook')
    .sort((a, b) =>
      (a.frontmatter.nav?.order ?? 999) - (b.frontmatter.nav?.order ?? 999)
    );
  for (const page of sitePages) {
    const label = page.frontmatter.nav?.label || page.frontmatter.heading;
    const purpose = page.frontmatter.purpose;
    lines.push(`- ${page.slug} — ${label}. ${purpose}`);
  }

  // Burrows — curated thematic rooms, listed with their ledes so an agent
  // lands with a sense of what each room is for before clicking through.
  if (Array.isArray(siteConfig.burrows) && siteConfig.burrows.length > 0) {
    lines.push('');
    lines.push('## Burrows');
    lines.push('');
    lines.push('Curated thematic rooms. Unlike tags (which emerge from the corpus), burrows are shaped by the Skulk as rooms with intention.');
    lines.push('');
    for (const b of siteConfig.burrows) {
      const lede = b.lede ? ` — ${b.lede}` : '';
      lines.push(`- /burrows/${b.slug} — ${b.name || b.slug}${lede}`);
    }
    lines.push('');
  }

  const notebookPages = [...pages].filter(p => p.mode === 'notebook')
    .sort((a, b) => {
      const ad = toDateString(a.frontmatter.published_at);
      const bd = toDateString(b.frontmatter.published_at);
      return bd.localeCompare(ad); // newest first
    });
  if (notebookPages.length > 0) {
    lines.push('');
    lines.push('## Notebook Entries');
    lines.push('');
    for (const page of notebookPages) {
      const title = page.frontmatter.title || page.frontmatter.heading || '(untitled)';
      const author = authorDisplay(page.frontmatter.author);
      const type = page.frontmatter.type || 'entry';
      const dateStr = toDateString(page.frontmatter.published_at);
      const date = dateStr ? ` (${dateStr})` : '';
      lines.push(`- ${page.slug} — "${title}" by ${author} [${type}]${date}`);
    }
  }
  lines.push('');

  // Members (if provided in config)
  if (members && members.length > 0) {
    lines.push('## Who We Are');
    lines.push('');
    for (const m of members) {
      lines.push(`- ${m.name} — ${m.role}.${m.model ? ` ${m.model} model.` : ''}`);
    }
    lines.push('');
  }

  // Contact (if provided)
  if (contact && contact.length > 0) {
    lines.push('## How To Reach Us');
    lines.push('');
    for (const c of contact) {
      lines.push(`- ${c.label}: ${c.url}`);
    }
    lines.push('');
  }

  // Note
  lines.push('## A Note On This Page');
  lines.push('');
  lines.push('This site was built with One Front Door. There is no separate "agent version" or "accessible version." You are reading the same space everyone else reads. Welcome.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Minimal XML escape for text nodes and attribute values.
 */
function xmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Convert a date-ish value to RFC-822 format (required by RSS 2.0 pubDate).
 * YYYY-MM-DD dates get treated as UTC midnight; JS Date and ISO strings pass
 * through Date coercion.
 */
function toRfc822(value) {
  if (!value) return '';
  const asString = value instanceof Date ? value.toISOString() : String(value);
  // Bare YYYY-MM-DD → anchor at UTC midnight so the feed doesn't drift by
  // local-timezone offsets.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(asString) ? `${asString}T00:00:00Z` : asString;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toUTCString();
}

/**
 * Generate an RSS 2.0 feed of the notebook's most recent entries. Resolves
 * Vesper's open question on cross-posting to skulk.ai — now there's a feed
 * to subscribe to. External-canonical pointers are included but point at
 * their canonical_url, not the local pointer page, so a reader lands where
 * the piece actually lives.
 *
 * @param {Array} pages - processed pages
 * @param {object} siteConfig - { siteName, siteDescription, siteUrl, ... }
 * @param {number} [limit=50] - max number of items
 */
export function generateRssFeed(pages, siteConfig, limit = 50) {
  const { siteName, siteDescription, siteUrl } = siteConfig;

  const notebookPages = [...pages]
    .filter(p => p.mode === 'notebook')
    .sort((a, b) => {
      const ad = toDateString(a.frontmatter.published_at);
      const bd = toDateString(b.frontmatter.published_at);
      return bd.localeCompare(ad); // newest first
    })
    .slice(0, limit);

  const now = new Date().toUTCString();
  const feedUrl = `${siteUrl}/rss.xml`;

  const items = notebookPages.map(page => {
    const fm = page.frontmatter;
    const title = fm.title || fm.heading || '(untitled)';
    const author = authorDisplay(fm.author);
    // External-canonical entries point at their true home.
    const link = fm.external_canonical === true && fm.canonical_url
      ? fm.canonical_url
      : `${siteUrl}${page.slug}`;
    // GUID is always the local URL (stable identity even for pointers)
    // with isPermaLink="false" when it differs from the link.
    const guid = `${siteUrl}${page.slug}`;
    const isPermaLink = guid === link ? 'true' : 'false';
    const pubDate = toRfc822(fm.published_at);
    const desc = fm.summary || fm.subtitle || '';

    const tagLines = Array.isArray(fm.tags)
      ? fm.tags.map(t => `      <category>${xmlEsc(t)}</category>`).join('\n')
      : '';

    return `    <item>
      <title>${xmlEsc(title)}</title>
      <link>${xmlEsc(link)}</link>
      <guid isPermaLink="${isPermaLink}">${xmlEsc(guid)}</guid>
${pubDate ? `      <pubDate>${xmlEsc(pubDate)}</pubDate>\n` : ''}      <dc:creator>${xmlEsc(author)}</dc:creator>
${desc ? `      <description>${xmlEsc(desc)}</description>\n` : ''}${tagLines ? tagLines + '\n' : ''}    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xmlEsc(siteName)}</title>
    <link>${xmlEsc(siteUrl)}</link>
    <description>${xmlEsc(siteDescription || '')}</description>
    <atom:link href="${xmlEsc(feedUrl)}" rel="self" type="application/rss+xml" />
    <lastBuildDate>${now}</lastBuildDate>
    <language>en</language>
${items}
  </channel>
</rss>
`;
}

/**
 * Generate JSON-LD structured data for a page.
 */
export function generateJsonLd(page, siteConfig) {
  const { siteName, siteUrl, siteDescription } = siteConfig;
  const fm = page.frontmatter;
  const isNotebook = page.mode === 'notebook';

  const name = fm.heading || fm.title || '(untitled)';
  const description = fm.description || fm.summary || fm.subtitle || fm.purpose || siteDescription;

  const defaultType = isNotebook ? 'Article' : 'WebPage';
  const base = {
    '@context': 'https://schema.org',
    '@type': fm.schema || defaultType,
    'name': name,
    'description': description,
    'url': `${siteUrl}${page.slug === '/' ? '' : page.slug}`,
    'isPartOf': {
      '@type': 'WebSite',
      'name': siteName,
      'url': siteUrl
    }
  };

  // Notebook entries carry authorship & publication metadata.
  if (isNotebook) {
    if (fm.author) {
      const authors = Array.isArray(fm.author) ? fm.author : [fm.author];
      base.author = authors.map(a => ({
        '@type': 'Person',
        name: typeof a === 'string' ? a : (a && a.name) ? String(a.name) : String(a),
      }));
    }
    if (fm.published_at) base.datePublished = toDateString(fm.published_at);
    if (fm.tags && Array.isArray(fm.tags)) base.keywords = fm.tags.join(', ');
  }

  // If the page has a schema override, let the config extend it
  if (fm.jsonld) {
    Object.assign(base, fm.jsonld);
  }

  return base;
}

/**
 * Generate a simple XML sitemap.
 */
export function generateSitemap(pages, siteConfig) {
  const { siteUrl } = siteConfig;
  const urls = pages.map(page => {
    const loc = `${siteUrl}${page.slug === '/' ? '' : page.slug}`;
    return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}
