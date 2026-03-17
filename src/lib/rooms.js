/**
 * One Front Door — Room Component System
 *
 * Rooms are components that declare their semantic contract.
 * A room that outputs a bare <div> is a room that fails the build.
 *
 * .ofd file format:
 *   <room element="article" requires="title, body">
 *     <h3>{title}</h3>
 *     {body}
 *   </room>
 */

import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

// Semantic elements that rooms are allowed to use as their root.
// No <div>, no <span>. Every room is a real thing.
const ALLOWED_ELEMENTS = new Set([
  'article', 'section', 'aside', 'nav', 'header', 'footer',
  'li', 'figure', 'details', 'blockquote', 'main', 'dl', 'address'
]);

/**
 * Parse a .ofd room file into a room definition.
 */
export function parseRoom(content, filePath) {
  const roomMatch = content.match(
    /<room\s+element="([^"]+)"(?:\s+requires="([^"]*)")?\s*>([\s\S]*?)<\/room>/
  );

  if (!roomMatch) {
    throw new Error(
      `[${filePath}] Invalid room file — must contain a <room element="..." requires="..."> block.`
    );
  }

  const [, element, requiresStr, template] = roomMatch;

  if (!ALLOWED_ELEMENTS.has(element)) {
    throw new Error(
      `[${filePath}] Room element "${element}" is not semantic. ` +
      `Allowed: ${[...ALLOWED_ELEMENTS].join(', ')}. ` +
      `A room must be a real thing, not a container.`
    );
  }

  const requires = requiresStr
    ? requiresStr.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return {
    name: basename(filePath, '.ofd'),
    element,
    requires,
    template: template.trim(),
    filePath
  };
}

/**
 * Render a room with provided props.
 */
export function renderRoom(room, props) {
  // Validate all required props are present
  const missing = room.requires.filter(key => !(key in props));
  if (missing.length > 0) {
    throw new Error(
      `Room "${room.name}" requires: ${missing.join(', ')}. ` +
      `A room without its contents is an empty room.`
    );
  }

  // Replace {prop} placeholders in the template
  let html = room.template;
  for (const [key, value] of Object.entries(props)) {
    html = html.replaceAll(`{${key}}`, value);
  }

  // Wrap in the semantic element
  const classAttr = props.class ? ` class="${props.class}"` : '';
  return `<${room.element}${classAttr}>\n${html}\n</${room.element}>`;
}

/**
 * Load all rooms from a directory.
 * Returns a Map of room name -> room definition.
 */
export function loadRooms(roomsDir) {
  const rooms = new Map();

  let files;
  try {
    files = readdirSync(roomsDir).filter(f => f.endsWith('.ofd'));
  } catch {
    return rooms; // No rooms directory is fine — pages can be pure markdown
  }

  for (const file of files) {
    const filePath = join(roomsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const room = parseRoom(content, filePath);
    rooms.set(room.name, room);
  }

  return rooms;
}
