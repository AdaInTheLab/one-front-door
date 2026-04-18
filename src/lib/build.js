/**
 * One Front Door — Build Script
 *
 * The pipeline:
 *   1. Load config
 *   2. Load rooms
 *   3. Discover and process all pages
 *   4. Run semantic audit on each page
 *   5. Generate wayfinding (llms.txt, sitemap, JSON-LD)
 *   6. Write output to dist/
 *   7. Write habitability report
 *
 * If any page fails validation or audit, the build stops.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';
import { loadRooms } from './rooms.js';
import { processPage, applyLayout } from './pipeline.js';
import { auditHTML, formatAuditReport } from './audit.js';
import { generateLlmsTxt, generateJsonLd, generateSitemap, generateRssFeed } from './wayfinding.js';
import { generateAggregatePages, FEEDS, renderEntryFilingFooter } from './aggregates.js';

/**
 * Load voice profile files from a directory.
 *
 * Each file is a markdown document with frontmatter declaring voice
 * metadata (voice, role, lede, portrait, pinned) and a body of prose
 * in the voice's own words. Returns a Map keyed by voice slug.
 *
 * Voice slug is derived from the `voice` frontmatter value (e.g. "Miso"
 * → "miso"), matching the slugify behavior in aggregates.js.
 */
function loadVoiceProfiles(dir) {
  const profiles = new Map();
  if (!dir || !existsSync(dir)) return profiles;

  const slugify = (name) =>
    String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return profiles;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    if (entry.name.startsWith('_')) continue;

    const filePath = join(dir, entry.name);
    const raw = readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    if (!data.voice) continue; // profile files must declare their voice

    const slug = data.voice_slug ? slugify(data.voice_slug) : slugify(data.voice);
    const bodyHtml = content.trim().length > 0 ? marked.parse(content) : '';

    profiles.set(slug, { ...data, bodyHtml });
  }

  return profiles;
}

// Two roots:
//
//   FRAMEWORK_ROOT — where OFD itself lives. Owns layouts and rooms
//                    because those are framework primitives.
//   PROJECT_ROOT   — where the consumer's project lives (the cwd when OFD
//                    is invoked). Owns config, content, public assets, and
//                    the dist/ output. When OFD builds its own docs, cwd is
//                    FRAMEWORK_ROOT and the two coincide — backward compatible.
const FRAMEWORK_ROOT = resolve(import.meta.dir, '../..');
const PROJECT_ROOT = process.cwd();

const LAYOUTS_DIR = join(FRAMEWORK_ROOT, 'src', 'layouts');
const ROOMS_DIR = join(FRAMEWORK_ROOT, 'src', 'rooms');

const DIST = join(PROJECT_ROOT, 'dist');
const PAGES_DIR = join(PROJECT_ROOT, 'src', 'pages');
const PUBLIC_DIR = join(PROJECT_ROOT, 'public');
const CONFIG_PATH = join(PROJECT_ROOT, 'ofd.config.js');

async function build() {
  const startTime = Date.now();
  console.log('\n▸ One Front Door — Building...\n');

  // Step 1: Load config
  let config = {};
  if (existsSync(CONFIG_PATH)) {
    const mod = await import(CONFIG_PATH);
    config = mod.default || mod;
  }

  const siteConfig = {
    siteName: config.siteName || 'Site',
    siteDescription: config.siteDescription || '',
    siteUrl: config.siteUrl || 'https://example.com',
    members: config.members || [],
    contact: config.contact || [],
    ...config
  };

  // Step 2: Load rooms
  const rooms = loadRooms(ROOMS_DIR);
  if (rooms.size > 0) {
    console.log(`  Loaded ${rooms.size} room(s): ${[...rooms.keys()].join(', ')}`);
  }

  // Step 3: Resolve content roots.
  //
  // Legacy (OFD v0.1) behavior: single site-mode root at src/pages.
  // New (v0.2) behavior: config.contentRoots is an array of
  //   { path, mode, outputPrefix?, locale? }
  // with `mode: 'site' | 'notebook'`. Paths may be relative to the OFD project root.
  const contentRoots = Array.isArray(config.contentRoots) && config.contentRoots.length > 0
    ? config.contentRoots.map(r => ({
        // Content root paths are resolved relative to the consumer's project
        // root, so `../some-content-repo` works from a sibling project.
        path: resolve(PROJECT_ROOT, r.path),
        mode: r.mode || 'site',
        outputPrefix: r.outputPrefix,
        locale: r.locale,
        label: r.label || r.path,
      }))
    : [{ path: PAGES_DIR, mode: 'site', label: 'src/pages' }];

  // Step 4: Discover and process pages across all roots.
  // Schema errors are accumulated so we see the whole gap-landscape rather
  // than stopping at the first failure. Site-mode errors are still fatal
  // (site content is authored here and should be correct); notebook-mode
  // errors are collected and reported at the end.
  const pages = [];
  const notebookErrors = [];
  for (const root of contentRoots) {
    const pageFiles = discoverPages(root.path);
    console.log(`  Found ${pageFiles.length} page(s) in ${root.label} [${root.mode}]`);

    for (const filePath of pageFiles) {
      try {
        const page = processPage(filePath, rooms, root.path, {
          mode: root.mode,
          outputPrefix: root.outputPrefix,
          locale: root.locale,
        });
        pages.push(page);
      } catch (err) {
        if (root.mode === 'notebook') {
          notebookErrors.push({ filePath, message: err.message });
        } else {
          console.error(err.message);
          process.exit(1);
        }
      }
    }
  }

  if (notebookErrors.length > 0) {
    console.log(`\n  ⚠ ${notebookErrors.length} notebook entry/entries failed schema validation:`);
    for (const { filePath, message } of notebookErrors) {
      // Strip the leading "Notebook habitability failure — ..." banner to keep
      // each line tight. Everything after the first "✗" is the relevant detail.
      const detail = message.split('\n').find(l => l.trim().startsWith('✗')) || message;
      console.log(`    ${detail.trim()}`);
    }
    console.log('');
  }

  // Step 4b: Load voice profiles (optional). Each profile supplies
  // per-voice header content — lede, portrait, pinned piece, and the
  // voice's own intro prose — for their /voices/[name] page.
  const voicesPath = typeof config.voicesPath === 'string'
    ? resolve(PROJECT_ROOT, config.voicesPath)
    : null;
  const voiceProfiles = loadVoiceProfiles(voicesPath);
  if (voiceProfiles.size > 0) {
    console.log(`  Loaded ${voiceProfiles.size} voice profile(s)`);
  }

  // Step 4c: Generate aggregate pages (voices + tags) from notebook entries.
  // These are synthetic site-shaped pages that go through the same layout
  // and audit path as hand-authored content. Voice profiles customize the
  // per-voice page output; voices with profiles but no entries still get
  // a page.
  // Step 4b½: Append the filing footer (By [Voice] + Filed in [Burrows])
  // to every notebook entry so each page ends with clear wayfinding back
  // to the aggregators. External-canonical pointers skip this — their
  // pointer card already carries its own context.
  const burrowConfig = Array.isArray(siteConfig.burrows) ? siteConfig.burrows : [];
  for (const page of pages) {
    if (page.mode !== 'notebook') continue;
    if (page.frontmatter && page.frontmatter.external_canonical === true) continue;
    const footer = renderEntryFilingFooter(page.frontmatter, burrowConfig);
    if (footer) page.bodyHtml = page.bodyHtml + '\n\n' + footer;
  }

  const aggregatePages = generateAggregatePages(pages, voiceProfiles, {
    burrows: burrowConfig,
  });
  if (aggregatePages.length > 0) {
    const hasBurrows = Array.isArray(siteConfig.burrows) && siteConfig.burrows.length > 0;
    const label = hasBurrows ? 'voices, tags, burrows' : 'voices, tags';
    console.log(`  Generated ${aggregatePages.length} aggregate page(s) (${label})`);
    pages.push(...aggregatePages);
  }

  // Step 4d: Substitute ::feed[name] placeholders (inserted by pipeline as
  // <!--OFD-FEED:name--> comments) with rendered HTML. Feeds need the full
  // page list, which is only complete after aggregation.
  const feedPlaceholderRegex = /<!--OFD-FEED:([a-zA-Z0-9_-]+)-->/g;
  const unknownFeeds = new Set();
  for (const page of pages) {
    if (!page.bodyHtml || !page.bodyHtml.includes('<!--OFD-FEED:')) continue;
    page.bodyHtml = page.bodyHtml.replace(feedPlaceholderRegex, (_, name) => {
      const renderer = FEEDS[name];
      if (!renderer) {
        unknownFeeds.add(name);
        return `<!-- unknown feed: ${name} -->`;
      }
      return renderer(pages);
    });
  }
  if (unknownFeeds.size > 0) {
    console.log(`  ⚠ Unknown feed(s) referenced: ${[...unknownFeeds].join(', ')}`);
  }

  // Step 5: Load layout, substitute site-level slots (footer) once before
  // the per-page loop. Per-page slots still get substituted by applyLayout.
  const layoutPath = join(LAYOUTS_DIR, 'default.html');
  if (!existsSync(layoutPath)) {
    console.error(`\n  ✗ No layout found at ${layoutPath}`);
    process.exit(1);
  }
  let layoutHtml = readFileSync(layoutPath, 'utf-8');

  // Footer: consumer-defined in ofd.config.js as a `footer` HTML string.
  // If absent, a minimal framework-credit fallback is used.
  const defaultFooter = `<p class="quiet">Built with <a href="https://github.com/AdaInTheLab/one-front-door">One Front Door</a>.</p>`;
  const footerHtml = typeof siteConfig.footer === 'string' && siteConfig.footer.trim().length > 0
    ? siteConfig.footer
    : defaultFooter;
  layoutHtml = layoutHtml.replace('{footer}', footerHtml);

  // Step 6: Build nav items from site-mode pages only.
  // Notebook entries do not declare nav — their aggregators (voices/burrows/tags)
  // will supply navigation in a later milestone.
  const navItems = pages
    .filter(p => p.mode !== 'notebook' && p.frontmatter.nav)
    .sort((a, b) => (a.frontmatter.nav.order ?? 999) - (b.frontmatter.nav.order ?? 999))
    .map(p => ({
      slug: p.slug,
      label: p.frontmatter.nav.label,
      order: p.frontmatter.nav.order
    }));

  // Step 7: Render each page with layout, audit, and write.
  // Site-mode audit failures are fatal. Notebook-mode audit failures are
  // collected and reported at the end so the whole gap-landscape is visible.
  const auditResults = [];
  const notebookAuditFailures = [];
  mkdirSync(DIST, { recursive: true });

  for (const page of pages) {
    const jsonLd = generateJsonLd(page, siteConfig);
    const fullHtml = applyLayout(page, layoutHtml, navItems, jsonLd);

    // Audit the rendered page
    const audit = auditHTML(fullHtml, page.frontmatter, page.filePath);
    auditResults.push(audit);

    if (!audit.pass) {
      if (page.mode === 'notebook') {
        notebookAuditFailures.push({
          filePath: page.filePath,
          slug: page.slug,
          checks: audit.checks.filter(c => !c.pass),
        });
        // Skip writing this page but continue the build.
        continue;
      } else {
        console.error(`\n  ✗ Habitability audit failed for ${page.filePath}`);
        for (const check of audit.checks.filter(c => !c.pass)) {
          console.error(`    ${check.severity === 'error' ? '✗' : '⚠'} ${check.name}: ${check.message}`);
        }
        console.error('\n  Build blocked. Fix habitability errors.\n');
        process.exit(1);
      }
    }

    // Write the page
    const outPath = page.slug === '/'
      ? join(DIST, 'index.html')
      : join(DIST, page.slug, 'index.html');

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, fullHtml, 'utf-8');
    console.log(`  ✓ ${page.slug} → ${outPath.replace(PROJECT_ROOT, '.')}`);
  }

  if (notebookAuditFailures.length > 0) {
    console.log(`\n  ⚠ ${notebookAuditFailures.length} notebook entry/entries failed habitability audit:`);
    for (const fail of notebookAuditFailures) {
      console.log(`    ${fail.slug}  (${fail.filePath})`);
      for (const check of fail.checks) {
        const mark = check.severity === 'error' ? '✗' : '⚠';
        console.log(`      ${mark} ${check.name}: ${check.message}`);
      }
    }
    console.log('');
  }

  // Step 8: Generate wayfinding artifacts
  const llmsTxt = generateLlmsTxt(pages, siteConfig);
  writeFileSync(join(DIST, 'llms.txt'), llmsTxt, 'utf-8');
  console.log('  ✓ llms.txt generated');

  const sitemap = generateSitemap(pages, siteConfig);
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf-8');
  console.log('  ✓ sitemap.xml generated');

  // Emit rss.xml only when there are notebook entries to syndicate.
  const hasNotebook = pages.some(p => p.mode === 'notebook');
  if (hasNotebook) {
    const rss = generateRssFeed(pages, siteConfig);
    writeFileSync(join(DIST, 'rss.xml'), rss, 'utf-8');
    console.log('  ✓ rss.xml generated');
  }

  // Step 9: Write habitability report
  const report = {
    timestamp: new Date().toISOString(),
    pages: auditResults.map(r => ({
      file: r.filePath,
      tier: r.tier,
      score: r.score,
      pass: r.pass,
      checks: r.checks
    })),
    summary: {
      total: auditResults.length,
      passed: auditResults.filter(r => r.pass).length,
      averageScore: Math.round(
        auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length
      )
    }
  };
  writeFileSync(join(DIST, 'habitability.json'), JSON.stringify(report, null, 2), 'utf-8');
  console.log('  ✓ habitability.json generated');

  // Step 10: Copy public assets
  if (existsSync(PUBLIC_DIR)) {
    cpSync(PUBLIC_DIR, DIST, { recursive: true });
    console.log('  ✓ public/ assets copied');
  }

  // Step 10b: Copy any additional staticPaths declared in config.
  // Format: [{ from: 'relative-or-absolute path', to: 'dist-subpath' }].
  // Useful for content-repo assets (images, fonts, etc.) that live
  // outside the consumer project's own public/ directory.
  if (Array.isArray(siteConfig.staticPaths)) {
    for (const sp of siteConfig.staticPaths) {
      if (!sp || !sp.from) continue;
      const src = resolve(PROJECT_ROOT, sp.from);
      const destSub = (sp.to || '').replace(/^\/+|\/+$/g, '');
      const dest = destSub ? join(DIST, destSub) : DIST;
      if (!existsSync(src)) {
        console.log(`  ⚠ staticPath source not found: ${sp.from}`);
        continue;
      }
      mkdirSync(dest, { recursive: true });
      cpSync(src, dest, { recursive: true });
      console.log(`  ✓ staticPath copied: ${sp.from} → dist/${destSub || ''}`);
    }
  }

  // Done. Summary + timing.
  const elapsed = Date.now() - startTime;
  const writtenCount = pages.length - notebookAuditFailures.length;
  const totalNotebookSkipped = notebookErrors.length + notebookAuditFailures.length;

  console.log('');
  if (totalNotebookSkipped === 0) {
    console.log(`▸ Built in ${elapsed}ms. All pages are habitable.`);
  } else {
    console.log(
      `▸ Built in ${elapsed}ms. ` +
      `${writtenCount} page(s) written, ${totalNotebookSkipped} notebook entry/entries skipped ` +
      `(see warnings above).`
    );
  }
  console.log('');
}

/**
 * Recursively find all .md files in the pages directory.
 *
 * Files whose basename starts with "_" are excluded by convention —
 * they're treated as drafts, test artifacts, or private scratch pads.
 * Directories prefixed with "_" are also skipped entirely.
 */
function discoverPages(dir) {
  const results = [];

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...discoverPages(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

build();
