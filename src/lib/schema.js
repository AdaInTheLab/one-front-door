/**
 * One Front Door — Frontmatter Schema Validator
 *
 * Every page must declare what room it is before it gets to exist.
 * The build fails without these. That's the point.
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
