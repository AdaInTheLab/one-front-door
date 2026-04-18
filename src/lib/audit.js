/**
 * One Front Door — Semantic Audit (Habitability Validator)
 *
 * This is not a linter you can ignore. It's a build step that blocks output.
 * A page that fails the audit does not get built. Period.
 */

/**
 * Audit a rendered HTML string for habitability compliance.
 * Returns { pass: boolean, score: number, checks: Check[] }
 * where Check is { name, pass, message, severity }
 */
export function auditHTML(html, frontmatter, filePath) {
  const checks = [];
  const context = filePath || 'unknown';

  // --- Structural Layer ---

  // 1. Must have semantic root elements (no div soup)
  checks.push(checkSemanticStructure(html, context));

  // 2. Every <section> must have an accessible label
  checks.push(checkSectionLabels(html, context));

  // 3. Heading hierarchy must not skip levels
  checks.push(checkHeadingHierarchy(html, context));

  // 4. No bare <div> as content wrapper
  checks.push(checkNoBareDiv(html, context));

  // --- Narrative Layer ---

  // 5. No mystery-meat links ("click here", "learn more", "read more")
  checks.push(checkLinkText(html, context));

  // 6. Images must have meaningful alt text (not "image", "photo", "")
  checks.push(checkImageAlt(html, context));

  // --- Wayfinding Layer ---

  // 7. Page has a single <h1>
  checks.push(checkSingleH1(html, context));

  // 8. Page has at most one <main>
  checks.push(checkSingleMain(html, context));

  // 9. Nav exists and has links
  checks.push(checkNavigation(html, context));

  // --- Atmosphere Layer ---

  // 9. No inline styles (atmosphere lives in CSS, not markup)
  checks.push(checkNoInlineStyles(html, context));

  // Score
  const passed = checks.filter(c => c.pass).length;
  const total = checks.length;
  const blocked = checks.filter(c => !c.pass && c.severity === 'error');

  return {
    pass: blocked.length === 0,
    score: Math.round((passed / total) * 100),
    total,
    passed,
    checks,
    filePath: context
  };
}

// --- Individual Checks ---

function checkSemanticStructure(html, ctx) {
  const semanticTags = ['<article', '<section', '<nav', '<aside', '<header', '<footer', '<main'];
  const hasSemantic = semanticTags.some(tag => html.includes(tag));
  return {
    name: 'semantic-structure',
    pass: hasSemantic,
    message: hasSemantic
      ? 'Page uses semantic HTML elements.'
      : 'Page has no semantic structure — needs <article>, <section>, <nav>, etc.',
    severity: 'error'
  };
}

function checkSectionLabels(html, ctx) {
  const sectionRegex = /<section(?![^>]*aria-label)(?![^>]*aria-labelledby)[^>]*>/g;
  const unlabeled = html.match(sectionRegex);
  const pass = !unlabeled || unlabeled.length === 0;
  return {
    name: 'section-labels',
    pass,
    message: pass
      ? 'All sections have accessible labels.'
      : `${unlabeled.length} section(s) without aria-label or aria-labelledby — a room needs a name.`,
    severity: 'error'
  };
}

function checkHeadingHierarchy(html, ctx) {
  const headings = [...html.matchAll(/<h([1-6])/g)].map(m => parseInt(m[1]));
  let pass = true;
  let message = 'Heading hierarchy is correct.';

  for (let i = 1; i < headings.length; i++) {
    if (headings[i] > headings[i - 1] + 1) {
      pass = false;
      message = `Heading hierarchy skips from h${headings[i - 1]} to h${headings[i]} — the floor plan has gaps.`;
      break;
    }
  }

  return { name: 'heading-hierarchy', pass, message, severity: 'error' };
}

function checkNoBareDiv(html, ctx) {
  // Allow divs with explicit roles, but flag bare <div> used as content containers
  const bareDiv = /<div(?![^>]*role=)[^>]*>/g;
  const matches = html.match(bareDiv);
  const pass = !matches || matches.length === 0;
  return {
    name: 'no-bare-div',
    pass,
    message: pass
      ? 'No bare <div> elements found.'
      : `${matches.length} bare <div>(s) found — use semantic elements or add a role.`,
    severity: 'warning'
  };
}

function checkLinkText(html, ctx) {
  const mysteryMeat = /<a[^>]*>(?:\s*)(click here|learn more|read more|here|link|this)(?:\s*)<\/a>/gi;
  const matches = html.match(mysteryMeat);
  const pass = !matches || matches.length === 0;
  return {
    name: 'link-text',
    pass,
    message: pass
      ? 'All links have descriptive text.'
      : `${matches.length} mystery-meat link(s) found — doors need signs.`,
    severity: 'error'
  };
}

function checkImageAlt(html, ctx) {
  const imgs = [...html.matchAll(/<img[^>]*>/g)];
  if (imgs.length === 0) {
    return { name: 'image-alt', pass: true, message: 'No images to audit.', severity: 'error' };
  }

  const bad = imgs.filter(m => {
    const tag = m[0];
    const altMatch = tag.match(/alt="([^"]*)"/);
    if (!altMatch) return true; // no alt at all
    const alt = altMatch[1].trim().toLowerCase();
    return alt === '' || alt === 'image' || alt === 'photo' || alt === 'picture' || alt === 'img';
  });

  const pass = bad.length === 0;
  return {
    name: 'image-alt',
    pass,
    message: pass
      ? 'All images have meaningful alt text.'
      : `${bad.length} image(s) with missing or meaningless alt text.`,
    severity: 'error'
  };
}

function checkSingleH1(html, ctx) {
  const h1s = html.match(/<h1/g);
  const count = h1s ? h1s.length : 0;
  const pass = count === 1;
  return {
    name: 'single-h1',
    pass,
    message: pass
      ? 'Page has exactly one <h1>.'
      : count === 0
        ? 'Page has no <h1> — a room without a name.'
        : `Page has ${count} <h1> elements — a room can only have one name.`,
    severity: 'error'
  };
}

function checkSingleMain(html, ctx) {
  // HTML5 permits at most one visible <main> element per document.
  // Zero is fine (not every snippet carries one); two or more are invalid
  // and signal either a layout+page double-wrap or nested main-regions.
  const mains = html.match(/<main\b/g);
  const count = mains ? mains.length : 0;
  const pass = count <= 1;
  return {
    name: 'single-main',
    pass,
    message: pass
      ? count === 0
        ? 'No <main> element (fine if inherited from layout).'
        : 'Page has exactly one <main>.'
      : `Page has ${count} <main> elements — HTML5 permits at most one per document. Swap inner <main> for <section> or <article>.`,
    severity: 'error'
  };
}

function checkNavigation(html, ctx) {
  const hasNav = html.includes('<nav');
  const hasLinks = hasNav && /<nav[^>]*>[\s\S]*?<a /i.test(html);
  const pass = hasNav && hasLinks;
  return {
    name: 'navigation',
    pass,
    message: pass
      ? 'Page has navigation with links.'
      : !hasNav
        ? 'No <nav> element — the building has no hallways.'
        : 'Nav exists but has no links — hallways without doors.',
    severity: 'error'
  };
}

function checkNoInlineStyles(html, ctx) {
  const inlineStyles = html.match(/style="[^"]+"/g);
  const pass = !inlineStyles || inlineStyles.length === 0;
  return {
    name: 'no-inline-styles',
    pass,
    message: pass
      ? 'No inline styles — atmosphere lives in CSS.'
      : `${inlineStyles.length} inline style(s) found — atmosphere belongs in the stylesheet, not the walls.`,
    severity: 'warning'
  };
}

/**
 * Format audit results for terminal output.
 */
export function formatAuditReport(results) {
  const lines = [];

  for (const result of results) {
    const icon = result.pass ? '✓' : '✗';
    lines.push(`\n${icon} ${result.filePath} — ${result.score}%`);

    for (const check of result.checks) {
      const mark = check.pass ? '  ✓' : check.severity === 'error' ? '  ✗' : '  ⚠';
      lines.push(`${mark} ${check.name}: ${check.message}`);
    }
  }

  const allPass = results.every(r => r.pass);
  lines.push('');
  lines.push(allPass
    ? '▸ All pages are habitable.'
    : '▸ Build blocked — fix habitability errors before shipping.'
  );

  return lines.join('\n');
}
