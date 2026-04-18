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
import { loadRooms } from './rooms.js';
import { processPage, applyLayout } from './pipeline.js';
import { auditHTML, formatAuditReport } from './audit.js';
import { generateLlmsTxt, generateJsonLd, generateSitemap } from './wayfinding.js';

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

  // Step 5: Load layout
  const layoutPath = join(LAYOUTS_DIR, 'default.html');
  if (!existsSync(layoutPath)) {
    console.error(`\n  ✗ No layout found at ${layoutPath}`);
    process.exit(1);
  }
  const layoutHtml = readFileSync(layoutPath, 'utf-8');

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

  // Step 9: Write habitability report
  const report = {
    timestamp: new Date().toISOString(),
    pages: auditResults.map(r => ({
      file: r.filePath,
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
