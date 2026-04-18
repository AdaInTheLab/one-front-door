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
