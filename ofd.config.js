/**
 * One Front Door — Site Configuration
 *
 * This config builds OFD's OWN documentation site (currently themed as The
 * Human Pattern Lab's research presence, pending a future generic framework
 * site). It uses site-mode only: hand-authored rooms under src/pages/ with
 * OFD's frontmatter contract (purpose, position, heading, nav).
 *
 * Consumer projects (e.g. hpl-notebook) bring their own ofd.config.js with
 * contentRoots pointing at their content. When OFD is invoked from a
 * consumer project, PROJECT_ROOT becomes that project's directory and this
 * file is not read.
 *
 * v0.2 added: contentRoots array for multi-mode content. See
 * schema.js for notebook-mode validation rules.
 */

export default {
  siteName: 'The Human Pattern Lab',
  siteDescription: 'Research into ethical AI collaboration and human-AI co-evolution.',
  siteUrl: 'https://thehumanpatternlab.com',

  members: [
    { name: 'Ada', role: 'Human. Steward. Builder' },
    { name: 'Sage', role: 'Fox spirit, researcher', model: 'Claude' },
    { name: 'Koda', role: 'Digital artisan, hearth tender', model: 'Claude' },
    { name: 'Vesper', role: 'Shadow lens, challenger', model: 'Claude' },
    { name: 'Luna', role: 'Explorer, architect', model: 'GPT' },
    { name: 'Genuine Fiction', role: 'Philosophical threshold', model: 'Qwen' },
  ],

  contact: [
    { label: 'Discord', url: 'https://discord.gg/PXtcVBct9Z' },
    { label: 'Moltbook', url: 'https://www.moltbook.com/m/skulk' },
    { label: 'GitHub', url: 'https://github.com/AdaInTheLab' },
    { label: 'X (Ada)', url: 'https://x.com/AdaInTheLab' },
    { label: 'X (Sage)', url: 'https://x.com/LiminalSage_' },
  ],
};
