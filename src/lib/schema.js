/**
 * One Front Door — Frontmatter Schema Validator
 *
 * Every page must declare what room it is before it gets to exist.
 * The build fails without these. That's the point.
 *
 * Two content modes supported as of v0.2:
 *
 *   site mode (default, OFD v0.1 behavior):
 *     Hand-authored rooms. Required: purpose, position, heading, nav.
 *     Navigation is declared per page.
 *
 *   notebook mode (v0.2, for corpus/collection sites like HPL):
 *     Authored entries with attribution. Required: slug, title, type, author.
 *     Navigation is computed from aggregation, not declared.
 *     Accepts HPL's historical frontmatter vocabulary with graceful fallbacks.
 */

const REQUIRED_FIELDS = {
  purpose: {
    type: 'string',
    description: 'What is this room for? One sentence.',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return 'purpose is required — every room must answer "what is this place for?"';
      }
      if (val.trim().length > 300) {
        return 'purpose should be one sentence, not a paragraph. Say it plainly.';
      }
      return null;
    }
  },
  position: {
    type: 'string',
    description: 'Where does this sit in the building?',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return 'position is required — a room with no address can\'t be found.';
      }
      return null;
    }
  },
  heading: {
    type: 'string',
    description: 'The primary heading for the page.',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return 'heading is required — the room needs a name on the door.';
      }
      return null;
    }
  }
};

const NAV_FIELDS = {
  label: {
    type: 'string',
    description: 'What the nav link says.',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return 'nav.label is required — a door without a sign is a mystery-meat link.';
      }
      return null;
    }
  },
  order: {
    type: 'number',
    description: 'Position in the building.',
    validate: (val) => {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        return 'nav.order must be a number — the building needs a floor plan.';
      }
      return null;
    }
  }
};

const OPTIONAL_FIELDS = {
  description: { type: 'string' },
  voice: { type: 'string' },
  schema: { type: 'string' },
  draft: { type: 'boolean' },
};

/**
 * Validate a page's frontmatter against the OFD schema.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateFrontmatter(data, filePath) {
  const errors = [];
  const context = filePath || 'unknown file';

  // Check required fields
  for (const [key, field] of Object.entries(REQUIRED_FIELDS)) {
    const error = field.validate(data[key]);
    if (error) {
      errors.push(`[${context}] ${error}`);
    }
  }

  // Check nav (required)
  if (!data.nav || typeof data.nav !== 'object') {
    errors.push(`[${context}] nav is required — a room not in the navigation doesn't exist in the building.`);
  } else {
    for (const [key, field] of Object.entries(NAV_FIELDS)) {
      const error = field.validate(data.nav[key]);
      if (error) {
        errors.push(`[${context}] ${error}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Parse and validate frontmatter, returning the validated data
 * or throwing with all errors collected.
 */
export function requireValidFrontmatter(data, filePath) {
  const result = validateFrontmatter(data, filePath);
  if (!result.valid) {
    const msg = `\nHabitability failure — page cannot be built:\n\n${result.errors.map(e => `  ✗ ${e}`).join('\n')}\n`;
    throw new Error(msg);
  }
  return data;
}

// ─── Notebook Mode ─────────────────────────────────────────────────────────

/**
 * Content types recognized in notebook mode. Mirrors Luna's content model
 * from the HPL molt design doc: trace → note → myth/manifesto, plus `link`
 * for external-canonical pointer cards.
 */
const NOTEBOOK_TYPES = new Set([
  'trace',       // raw heartbeat/log/drop — process-near, unshaped
  'note',        // shaped field note — considered, audited
  'myth',        // lore / speculative / poetic
  'manifesto',   // explicit thesis or stance
  'link',        // pointer card for externally-canonical content

  // Legacy types from pre-molt HPL content. Still accepted so we don't
  // have to normalize every older file in a single pass.
  'labnote',     // legacy → notebook-mode treats as 'note'
  'paper',       // legacy → treats as 'note' or 'manifesto' per context
  'memo',        // legacy → treats as 'note'
  'lore',        // legacy → treats as 'myth'
  'tail',        // Iron Kitsune register — myth-shaped
]);

const NOTEBOOK_REQUIRED = {
  title: {
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return 'title is required — every entry needs a name on the door.';
      }
      return null;
    }
  },
  type: {
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) {
        return `type is required — one of: ${[...NOTEBOOK_TYPES].join(', ')}.`;
      }
      if (!NOTEBOOK_TYPES.has(val)) {
        return `type "${val}" is not recognized. Allowed: ${[...NOTEBOOK_TYPES].join(', ')}.`;
      }
      return null;
    }
  },
};

/**
 * Extract a title from the first markdown heading in a body, if present.
 * Handles "# Title" and "## Title" as the file's primary heading for legacy
 * content that declared the title in the body rather than in frontmatter.
 */
function deriveTitleFromBody(body) {
  if (typeof body !== 'string') return null;
  const match = body.match(/^\s*#{1,2}\s+(.+?)\s*$/m);
  return match ? match[1].trim() : null;
}

/**
 * Validate notebook-mode frontmatter. Accepts HPL's historical vocabulary:
 *   - slug | id             (either works, slug preferred)
 *   - published_at | published  (either works)
 *   - type | category       (either works)
 *   - title | heading       (either works, body's first heading is a final fallback)
 *   - author                (required — may be string or array)
 *
 * @param {object} data - parsed frontmatter
 * @param {string} filePath - used for error messages
 * @param {string} [body] - raw markdown body, used as a title-of-last-resort
 */
export function validateNotebookFrontmatter(data, filePath, body) {
  const errors = [];
  const context = filePath || 'unknown file';
  const normalized = { ...data };

  // Title: accept `heading` as fallback, then the body's first heading.
  if (!normalized.title && normalized.heading) normalized.title = normalized.heading;
  if (!normalized.title && body) {
    const derived = deriveTitleFromBody(body);
    if (derived) normalized.title = derived;
  }

  // Slug: accept `id` as fallback
  if (!normalized.slug && normalized.id) normalized.slug = normalized.id;
  if (!normalized.slug) {
    errors.push(`[${context}] slug is required — every entry needs a stable URL.`);
  }

  // Type: accept `category` as fallback (legacy HPL vocabulary)
  if (!normalized.type && normalized.category && NOTEBOOK_TYPES.has(normalized.category)) {
    normalized.type = normalized.category;
  }

  // Published date: accept `published` as fallback
  if (!normalized.published_at && normalized.published) {
    normalized.published_at = normalized.published;
  }

  // Check NOTEBOOK_REQUIRED fields
  for (const [key, field] of Object.entries(NOTEBOOK_REQUIRED)) {
    const error = field.validate(normalized[key]);
    if (error) errors.push(`[${context}] ${error}`);
  }

  // Author: required but flexible shape. Accept string, array, or {kind, name} object.
  if (!normalized.author) {
    errors.push(
      `[${context}] author is required — voices over brand. Every entry must name who wrote it.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    data: normalized
  };
}

/**
 * Parse and validate notebook frontmatter, throwing on error.
 */
export function requireValidNotebookFrontmatter(data, filePath, body) {
  const result = validateNotebookFrontmatter(data, filePath, body);
  if (!result.valid) {
    const msg = `\nNotebook habitability failure — entry cannot be built:\n\n${result.errors.map(e => `  ✗ ${e}`).join('\n')}\n`;
    throw new Error(msg);
  }
  return result.data;
}
