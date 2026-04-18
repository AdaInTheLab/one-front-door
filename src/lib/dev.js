/**
 * One Front Door — Dev Server
 *
 * Runs a build, then serves the resulting dist/ on a local port.
 * Simple and predictable: you see exactly what a visitor would see,
 * absolute paths and all (/style.css, /favicon.png, etc. resolve
 * correctly instead of breaking under file:// protocol).
 *
 * Usage:
 *   bun run dev                   # port 3000
 *   bun run dev -- --port 4000    # custom port
 *
 * No hot reload in this version — re-run to rebuild. Watch/reload
 * can arrive in a future milestone.
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, resolve, extname } from 'path';

const PROJECT_ROOT = process.cwd();
const DIST = join(PROJECT_ROOT, 'dist');

// Content-type lookup for the extensions we actually serve.
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

function parseArgs(argv) {
  const args = { port: 3000 };
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--port' || argv[i] === '-p') && argv[i + 1]) {
      args.port = parseInt(argv[i + 1], 10);
      i++;
    }
  }
  return args;
}

async function runBuild() {
  console.log('▸ Building before serving...\n');
  // Run the build in-process so output is captured and sequencing is clean.
  // The build script exits on fatal error; if it succeeds, control returns here.
  await import('./build.js');
}

function resolveRequestPath(urlPath) {
  // Strip query string, decode, normalize.
  const clean = decodeURIComponent(urlPath.split('?')[0]);

  // Directory requests ("/", "/docs/") get the directory's index.html
  let candidate = clean.endsWith('/') ? clean + 'index.html' : clean;

  // "/foo" (no extension) — try "/foo/index.html" first, fall back to "/foo.html"
  if (!extname(candidate)) {
    const dirIndex = join(DIST, candidate, 'index.html');
    if (existsSync(dirIndex)) return dirIndex;
    candidate = candidate + '.html';
  }

  const full = join(DIST, candidate);
  // Guard against path escapes (../../ and friends)
  if (!full.startsWith(DIST)) return null;
  if (!existsSync(full)) return null;
  if (!statSync(full).isFile()) return null;
  return full;
}

async function main() {
  const { port } = parseArgs(process.argv.slice(2));

  await runBuild();

  if (!existsSync(DIST)) {
    console.error(`\n  ✗ No dist/ directory at ${DIST}. Did the build fail?\n`);
    process.exit(1);
  }

  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch(req) {
      const url = new URL(req.url);
      const filePath = resolveRequestPath(url.pathname);

      if (!filePath) {
        // Serve a basic 404 that still feels habitable — not just an empty page
        return new Response(
          `<!doctype html><meta charset="utf-8"><title>Not found</title>` +
          `<main style="max-width:32rem;margin:4rem auto;padding:0 1rem;font-family:ui-serif,Georgia,serif;line-height:1.6">` +
          `<h1>Not found</h1>` +
          `<p>No file matches <code>${url.pathname}</code> under <code>dist/</code>.</p>` +
          `<p><a href="/">Back to the front door</a></p>` +
          `</main>`,
          { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }

      const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      return new Response(readFileSync(filePath), {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'no-cache',
        },
      });
    },
  });

  console.log('');
  console.log(`▸ Serving dist/ at http://127.0.0.1:${server.port}/`);
  console.log(`  Press Ctrl+C to stop.\n`);
}

main();
