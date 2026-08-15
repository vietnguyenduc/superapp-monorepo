#!/usr/bin/env node
/**
 * Embed docs/NEW-APP-TEMPLATE/*.md into tools/new-app-generator/templates.js
 * so the static HTML generator can ship the doc skeleton without a backend.
 *
 * Run this whenever docs/NEW-APP-TEMPLATE/ changes:
 *   node tools/new-app-generator/embed-templates.js
 */

const fs = require('fs');
const path = require('path');

const templateDir = path.resolve(__dirname, '..', '..', 'docs', 'NEW-APP-TEMPLATE');
const outFile = path.resolve(__dirname, 'templates.js');

const files = fs.readdirSync(templateDir).filter(f => f.endsWith('.md')).sort();
const map = {};
for (const f of files) {
  const key = f.replace(/\.md$/, '');
  map[key] = fs.readFileSync(path.join(templateDir, f), 'utf-8');
}

const out = `/* Auto-generated from docs/NEW-APP-TEMPLATE/. Do not edit manually. */
window.NEW_APP_TEMPLATES = ${JSON.stringify(map, null, 2)};
`;
fs.writeFileSync(outFile, out, 'utf-8');
console.log(`Embedded ${files.length} templates into ${outFile}`);
