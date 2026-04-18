/**
 * One Front Door — Content Pipeline
 *
 * .md → validate frontmatter → parse markdown → inject rooms
 *     → wrap in layout → semantic audit → output
 *
 * Every step is a gate. Content that doesn't meet the contract
 * doesn't get through.
 */

import { readFileSync } from 'fs';
import matter from 'gray-matter';
import { marked } from 'marked';
import { requireValidFrontmatter, requireValidNotebookFrontmatter } from './schema.js';
import { renderRoom } from './rooms.js';

/**
 * Custom marked renderer that enforces OFD principles at the
 * markdown-to-HTML layer.
 */
function createRenderer() {
  const renderer = new marked.Renderer();

  // Links must have descriptive text — caught here AND in audit
  renderer.link = function ({ href, title, text }) {
    // External links get marked — you know when you're leaving the building
    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
    const titleAttr = title ? ` title="${title}"` : '';
    const externalAttrs = isExternal
      ? ' rel="noopener noreferrer" target="_blank"'
      : '';
    const externalMark = isExternal
      ? ' <span class="external" aria-label="(external link)">↗</span>'
      : '';
    return `<a href="${href}"${titleAttr}${externalAttrs}>${text}${externalMark}</a>`;
  };

  return renderer;
}

/**
 * Process room directives in markdown content.
 *
 * Syntax in markdown:
 *   ::room[member]{name="Sage" role="The Question Holder" description="..."}
 *
 * Uses a manual parser to handle quoted values that may contain } and other special chars.
 * Must run BEFORE markdown parsing to avoid HTML escaping.
 */
function processRoomDirectives(content, rooms) {
  // First, protect code fences and inline code from directive processing.
  // Replace them with placeholders, process directives, then restore.
  const codeFences = [];
  const protected_ = content
    .replace(/```[\s\S]*?```/g, (match) => {
      const idx = codeFences.length;
      codeFences.push(match);
      return `\x00CODEFENCE_${idx}\x00`;
    })
    .replace(/`[^`]+`/g, (match) => {
      const idx = codeFences.length;
      codeFences.push(match);
      return `\x00CODEFENCE_${idx}\x00`;
    });

  const processed = _processRoomDirectivesInner(protected_, rooms);

  // Restore code fences
  return processed.replace(/\x00CODEFENCE_(\d+)\x00/g, (_, idx) => codeFences[parseInt(idx)]);
}

function _processRoomDirectivesInner(content, rooms) {
  const marker = '::room[';
  let result = '';
  let cursor = 0;

  while (cursor < content.length) {
    const start = content.indexOf(marker, cursor);
    if (start === -1) {
      result += content.slice(cursor);
      break;
    }

    // Add everything before the directive
    result += content.slice(cursor, start);

    // Parse room name: ::room[name]
    const nameStart = start + marker.length;
    const nameEnd = content.indexOf(']', nameStart);
    if (nameEnd === -1) {
      result += marker;
      cursor = nameStart;
      continue;
    }
    const roomName = content.slice(nameStart, nameEnd);

    // Expect { after ]
    if (content[nameEnd + 1] !== '{') {
      result += content.slice(start, nameEnd + 1);
      cursor = nameEnd + 1;
      continue;
    }

    // Parse props block with balanced braces, respecting quotes
    const propsStart = nameEnd + 2;
    let i = propsStart;
    let inQuote = false;
    while (i < content.length) {
      if (content[i] === '"' && content[i - 1] !== '\\') {
        inQuote = !inQuote;
      } else if (content[i] === '}' && !inQuote) {
        break;
      }
      i++;
    }

    if (i >= content.length) {
      // Unclosed directive, pass through
      result += content.slice(start, propsStart);
      cursor = propsStart;
      continue;
    }

    const propsStr = content.slice(propsStart, i);
    cursor = i + 1; // skip the closing }

    // Resolve the room
    const room = rooms.get(roomName);
    if (!room) {
      throw new Error(`Room "${roomName}" not found. Available rooms: ${[...rooms.keys()].join(', ')}`);
    }

    // Parse props from key="value" pairs
    const props = {};
    const propRegex = /(\w+)="((?:[^"\\]|\\.)*)"/g;
    let propMatch;
    while ((propMatch = propRegex.exec(propsStr)) !== null) {
      props[propMatch[1]] = propMatch[2].replace(/\\"/g, '"');
    }

    result += renderRoom(room, props);
  }

  return result;
}

/**
 * Process heading ID syntax: ## Heading {#custom-id}
 * Converts to: <h2 id="custom-id">Heading</h2>
 */
function processHeadingIds(html) {
  return html.replace(
    /<(h[1-6])>([^<]*?)\s*\{#([\w-]+)\}\s*<\/\1>/g,
    '<$1 id="$3">$2</$1>'
  );
}

/**
 * Process a single .md page file through the full pipeline.
 * Returns { frontmatter, html, slug, mode }
 *
 * @param {string} filePath - absolute path to the .md file
 * @param {Map} rooms - loaded room components (from rooms.js)
 * @param {string} pagesDir - root content directory for slug derivation
 * @param {object} options - { mode: 'site' | 'notebook', outputPrefix?: string, locale?: string }
 */
export function processPage(filePath, rooms, pagesDir, options = {}) {
  const mode = options.mode || 'site';
  const raw = readFileSync(filePath, 'utf-8');

  // Step 1: Parse frontmatter
  const { data, content } = matter(raw);

  // Step 2: Validate frontmatter — build fails here if invalid.
  // In notebook mode, the body is also passed so a missing title can be
  // derived from the first heading in the body as a last-resort fallback.
  const validatedData = mode === 'notebook'
    ? requireValidNotebookFrontmatter(data, filePath, content)
    : (requireValidFrontmatter(data, filePath), data);

  // Step 3a: In notebook mode, normalize body headings against the layout's
  // h1 (which always renders the frontmatter title).
  //
  //   1. If the body's first non-empty line is an h1, strip it —
  //      the layout's h1 already stands for the page. Leaving the body h1
  //      would produce two h1s and fail the single-h1 audit.
  //   2. If the body's first non-empty line is an h2 that matches the title,
  //      strip it — avoids an h2 echo of the layout's h1.
  let content2 = content;
  if (mode === 'notebook') {
    const firstHeadingPattern = /^\s*(#{1,2})\s+(.+?)\s*$/m;
    const m = content2.match(firstHeadingPattern);
    if (m) {
      const level = m[1].length;
      const text = m[2].trim();
      const titleMatch = validatedData.title && text === validatedData.title.trim();
      if (level === 1 || (level === 2 && titleMatch)) {
        content2 = content2.replace(firstHeadingPattern, '').replace(/^\s+/, '');
      }
    }
  }

  // Step 3b: Process room directives (before markdown parsing)
  const withRooms = rooms.size > 0
    ? processRoomDirectives(content2, rooms)
    : content2;

  // Step 3c: Replace ::feed[name] directives with placeholder HTML comments.
  // Feeds need the full page list to render, which isn't available yet in
  // this per-page pipeline. Build.js walks each page after aggregation and
  // substitutes the placeholders with rendered feed HTML. The comment
  // survives markdown parsing untouched.
  const withFeeds = withRooms.replace(
    /::feed\[([a-zA-Z0-9_-]+)\]/g,
    (_, name) => `<!--OFD-FEED:${name}-->`
  );

  // Step 4: Parse markdown to HTML
  marked.setOptions({
    renderer: createRenderer(),
    gfm: true,
    breaks: false
  });
  const rawHtml = marked.parse(withFeeds);

  // Step 5: Process heading IDs ({#custom-id} syntax)
  const bodyHtml = processHeadingIds(rawHtml);

  // Step 6: Derive slug. In site mode, slug comes from the file path.
  // In notebook mode, slug is declared in frontmatter, and the output URL
  // gets prefixed (e.g., /entries/[slug]) with an optional locale segment.
  let slug;
  if (mode === 'notebook') {
    const baseSlug = validatedData.slug;
    const prefix = (options.outputPrefix || '/entries').replace(/\/$/, '');
    const locale = options.locale || validatedData.locale;
    const localeSegment = locale ? `/${locale}` : '';
    slug = `${localeSegment}${prefix}/${baseSlug}`;
  } else {
    const relative = filePath
      .replace(/\\/g, '/')
      .replace(pagesDir.replace(/\\/g, '/'), '')
      .replace(/\.md$/, '')
      .replace(/\/index$/, '/');
    slug = relative === '/' ? '/' : relative.replace(/\/$/, '');
  }

  return {
    frontmatter: validatedData,
    bodyHtml,
    slug,
    filePath,
    mode
  };
}

/**
 * Wrap a processed page in its layout.
 *
 * Handles both site-mode pages (with frontmatter.heading/purpose) and
 * notebook-mode entries (with frontmatter.title/summary/subtitle), mapping
 * notebook fields onto the layout's slots so the same layout works for both.
 */
export function applyLayout(page, layoutHtml, navItems, jsonLd) {
  let html = layoutHtml;
  const fm = page.frontmatter;

  // Derive layout slot values based on mode. Notebook entries don't carry
  // purpose/position/heading, they carry title/subtitle/summary — map them.
  const heading = fm.heading || fm.title || '';
  const title = fm.title || fm.heading || '';
  const description = fm.description || fm.summary || fm.subtitle || fm.purpose || '';
  const purpose = fm.purpose || fm.summary || fm.subtitle || '';

  // Replace template slots
  html = html.replace('{title}', title);
  html = html.replace('{description}', description);
  html = html.replace('{purpose}', purpose);
  html = html.replace('{json-ld}', JSON.stringify(jsonLd, null, 2));
  html = html.replace('{heading}', heading);
  html = html.replace('{content}', page.bodyHtml);

  // Build navigation
  const navHtml = navItems.map(item => {
    const current = item.slug === page.slug ? ' aria-current="page"' : '';
    const href = item.slug === '/' ? '/' : item.slug;
    return `<li><a href="${href}"${current}>${item.label}</a></li>`;
  }).join('\n        ');

  html = html.replace('{nav-items}', navHtml);

  // Current page slug for the home link
  const homeCurrent = page.slug === '/' ? ' aria-current="page"' : '';
  html = html.replace('{home-current}', homeCurrent);

  return html;
}
