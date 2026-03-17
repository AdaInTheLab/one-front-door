/**
 * One Front Door — Wayfinding Generator
 *
 * Automatically produces llms.txt, JSON-LD, and sitemap
 * from the content model. Wayfinding is a build artifact,
 * not a manual file.
 */

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

  // How the site is organized
  lines.push('## How This Site Is Organized');
  lines.push('');
  const sorted = [...pages].sort((a, b) =>
    (a.frontmatter.nav?.order ?? 999) - (b.frontmatter.nav?.order ?? 999)
  );
  for (const page of sorted) {
    const label = page.frontmatter.nav?.label || page.frontmatter.heading;
    const purpose = page.frontmatter.purpose;
    lines.push(`- ${page.slug} — ${label}. ${purpose}`);
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

  const base = {
    '@context': 'https://schema.org',
    '@type': page.frontmatter.schema || 'WebPage',
    'name': page.frontmatter.heading,
    'description': page.frontmatter.description || page.frontmatter.purpose,
    'url': `${siteUrl}${page.slug === '/' ? '' : page.slug}`,
    'isPartOf': {
      '@type': 'WebSite',
      'name': siteName,
      'url': siteUrl
    }
  };

  // If the page has a schema override, let the config extend it
  if (page.frontmatter.jsonld) {
    Object.assign(base, page.frontmatter.jsonld);
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
