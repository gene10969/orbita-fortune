import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const advisorImages = ['luna','shion','rei','mikoto','sougen','aurora','malik','rou','riho','usaki'].map((name) => `assets/advisors/${name}.webp`);
const required = [
  'index.html','styles.css','app.js','engine.js','config.js','advisors.js','booking-core.js','booking-service.js','manifest.webmanifest','sw.js',
  'privacy.html','terms.html','commerce.html','404.html','assets/icons/icon-192.png','assets/icons/icon-512.png','worker/schema.sql',...advisorImages
];
const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root,file))) errors.push(`Missing: ${file}`);
}
const htmlFiles = ['index.html','privacy.html','terms.html','commerce.html','404.html'];
for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root,file),'utf8');
  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|#|mailto:|tel:|data:)/.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(root,path.dirname(file),clean);
    if (!fs.existsSync(target)) errors.push(`${file}: broken reference ${ref}`);
  }
}
const config = fs.readFileSync(path.join(root,'config.js'),'utf8');
if (!/bookingMode:\s*false/.test(config)) errors.push('Booking mode must be disabled in distribution build.');
if (!/paidMode:\s*false/.test(config) || !/operatorReady:\s*false/.test(config)) errors.push('Paid mode must be disabled in distribution build.');
const worker = fs.readFileSync(path.join(root,'worker/src/index.js'),'utf8');
if (/sk_(test|live|proj)_/.test(worker)) errors.push('Possible secret in worker source.');
if (/OPENAI_API_KEY\s*=/.test(config) || /STRIPE_SECRET_KEY\s*=/.test(config)) errors.push('Secret-like config found in frontend.');
const { ADVISORS } = await import(path.join(root,'advisors.js'));
if (ADVISORS.length !== 10) errors.push(`Expected 10 advisors, found ${ADVISORS.length}.`);
if (!/架空のAI鑑定人格/.test(fs.readFileSync(path.join(root,'terms.html'),'utf8'))) errors.push('AI persona disclosure missing from terms.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Static validation passed: ${required.length} required assets, ${htmlFiles.length} HTML files, 10 advisors.`);
