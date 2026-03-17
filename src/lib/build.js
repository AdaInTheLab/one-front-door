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

const ROOT = resolve(import.meta.dir, '../..');
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const PAGES_DIR = join(SRC, 'pages');
const ROOMS_DIR = join(SRC, 'rooms');
const LAYOUTS_DIR = join(SRC, 'layouts');
const PUBLIC_DIR = join(ROOT, 'public');
const CONFIG_PATH = join(ROOT, 'ofd.config.js');

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

  // Step 3: Discover pages
  const pageFiles = discoverPages(PAGES_DIR);
  console.log(`  Found ${pageFiles.length} page(s)`);

  // Step 4: Process all pages
  const pages = [];
  for (const filePath of pageFiles) {
    try {
      const page = processPage(filePath, rooms, PAGES_DIR);
      pages.push(page);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }

  // Step 5: Load layout
  const layoutPath = join(LAYOUTS_DIR, 'default.html');
  if (!existsSync(layoutPath)) {
    console.error(`\n  ✗ No layout found at ${layoutPath}`);
    process.exit(1);
  }
  const layoutHtml = readFileSync(layoutPath, 'utf-8');

  // Step 6: Build nav items from all pages
  const navItems = pages
    .filter(p => p.frontmatter.nav)
    .sort((a, b) => (a.frontmatter.nav.order ?? 999) - (b.frontmatter.nav.order ?? 999))
    .map(p => ({
      slug: p.slug,
      label: p.frontmatter.nav.label,
      order: p.frontmatter.nav.order
    }));

  // Step 7: Render each page with layout, audit, and write
  const auditResults = [];
  mkdirSync(DIST, { recursive: true });

  for (const page of pages) {
    const jsonLd = generateJsonLd(page, siteConfig);
    const fullHtml = applyLayout(page, layoutHtml, navItems, jsonLd);

    // Audit the rendered page
    const audit = auditHTML(fullHtml, page.frontmatter, page.filePath);
    auditResults.push(audit);

    if (!audit.pass) {
      console.error(`\n  ✗ Habitability audit failed for ${page.filePath}`);
      for (const check of audit.checks.filter(c => !c.pass)) {
        console.error(`    ${check.severity === 'error' ? '✗' : '⚠'} ${check.name}: ${check.message}`);
      }
      console.error('\n  Build blocked. Fix habitability errors.\n');
      process.exit(1);
    }

    // Write the page
    const outPath = page.slug === '/'
      ? join(DIST, 'index.html')
      : join(DIST, page.slug, 'index.html');

    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, fullHtml, 'utf-8');
    console.log(`  ✓ ${page.slug} → ${outPath.replace(ROOT, '.')}`);
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

  // Done
  const elapsed = Date.now() - startTime;
  console.log(formatAuditReport(auditResults));
  console.log(`\n▸ Built in ${elapsed}ms. All pages are habitable.\n`);
}

/**
 * Recursively find all .md files in the pages directory.
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
