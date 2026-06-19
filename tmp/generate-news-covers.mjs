import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const targets = [
  path.join(root, 'assets/news/covers'),
  path.join(root, 'dist-timeweb/assets/news/covers'),
];

const icons = {
  bank: '<path d="M250 368h700M320 368V235M460 368V235M600 368V235M740 368V235M880 368V235M282 235h636L600 120z"/><path d="M290 445h620M335 498h530"/>',
  credit: '<rect x="310" y="185" width="580" height="318" rx="38"/><path d="M370 278h460M390 405h160M610 405h150"/><circle cx="755" cy="390" r="48"/>',
  fraud: '<rect x="468" y="128" width="264" height="440" rx="48"/><path d="M532 250h136M532 320h106M532 390h82M820 214l78-78M898 214l-78-78"/>',
  court: '<path d="M445 202l132-132 176 176-132 132zM665 414l250 250M360 628h470"/><path d="M515 132l176 176"/>',
  consumer: '<path d="M380 120h440v430l-52-34-52 34-52-34-52 34-52-34-52 34-52-34-52 34z"/><path d="M455 230h290M455 315h235M455 400h270"/>',
  realestate: '<path d="M310 375l290-245 290 245M390 346v240h420V346M545 586V432h126v154"/><path d="M765 265v-105h-105"/>',
  auto: '<path d="M270 405h86l86-155h320l98 155h76v124H270z"/><circle cx="430" cy="530" r="56"/><circle cx="770" cy="530" r="56"/><path d="M465 288h250M366 405h450"/>',
  medical: '<path d="M600 125v430M385 340h430"/><rect x="405" y="145" width="390" height="390" rx="42"/><circle cx="600" cy="340" r="260"/>',
  law: '<path d="M338 145h255c74 0 123 42 123 114v340H460c-76 0-122-45-122-118zM716 259c0-72 49-114 123-114h37v454H716"/><path d="M430 250h210M430 338h170M765 250h120"/>',
  prosecutor: '<path d="M600 105l285 95v195c0 166-103 275-285 350-182-75-285-184-285-350V200z"/><path d="M485 370h230M600 250v330"/>',
  fas: '<path d="M300 600h600M388 532V350M555 532V230M722 532V315"/><path d="M348 282l180 96 150-166 182 88"/><circle cx="680" cy="212" r="32"/>',
  rospotreb: '<path d="M310 365l175 175 405-380"/><path d="M355 610h500M370 165h410"/><circle cx="600" cy="382" r="282"/>',
  regulator: '<path d="M300 395h600M360 395V245M480 395V245M600 395V245M720 395V245M840 395V245M318 245h564L600 115z"/><path d="M415 515h370M455 585h290"/><path d="M850 145l70-70M920 145l-70-70"/>',
};

const categories = [
  ['bank', icons.bank],
  ['credit', icons.credit],
  ['fraud', icons.fraud],
  ['court', icons.court],
  ['consumer', icons.consumer],
  ['realestate', icons.realestate],
  ['auto', icons.auto],
  ['medical', icons.medical],
  ['law', icons.law],
  ['prosecutor', icons.prosecutor],
  ['fas', icons.fas],
  ['rospotreb', icons.rospotreb],
  ['regulator', icons.regulator],
];

const palette = {
  gold: '#d8a35b',
  gold2: '#f0b56b',
  charcoal: '#070706',
  paper: '#f6ead8',
  muted: '#5d6570',
};

const svg = (slug, icon, variant) => {
  const glowX = 250 + variant * 155;
  const glowY = 105 + (variant % 2) * 110;
  const rotate = -8 + variant * 5;
  const scale = 0.72 + variant * 0.045;
  const tx = 142 - variant * 8;
  const ty = 58 + variant * 11;
  const line1 = 230 + variant * 34;
  const line2 = 415 - variant * 28;
  const line3 = 125 + variant * 20;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760">
  <defs>
    <radialGradient id="warm" cx="${glowX}" cy="${glowY}" r="720" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${palette.gold2}" stop-opacity=".18"/>
      <stop offset="48%" stop-color="${palette.gold}" stop-opacity=".06"/>
      <stop offset="100%" stop-color="${palette.gold}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#171411"/>
      <stop offset="50%" stop-color="#0d0b09"/>
      <stop offset="100%" stop-color="#050504"/>
    </linearGradient>
    <pattern id="noise" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(${rotate})">
      <path d="M0 22h44M22 0v44" stroke="#ffffff" stroke-opacity=".045" stroke-width="1"/>
      <circle cx="11" cy="9" r="1.2" fill="#ffffff" opacity=".055"/>
      <circle cx="35" cy="30" r="1" fill="#d8a35b" opacity=".07"/>
    </pattern>
  </defs>
  <rect width="1200" height="760" fill="url(#bg)"/>
  <rect width="1200" height="760" fill="url(#warm)"/>
  <rect width="1200" height="760" fill="url(#noise)"/>
  <path d="M0 640 C180 570 360 700 600 615 C830 535 1010 592 1200 506 L1200 760 L0 760 Z" fill="${palette.gold}" opacity=".055"/>
  <rect x="${760 - variant * 28}" y="${80 + variant * 18}" width="${155 + variant * 16}" height="${230 - variant * 10}" rx="24" fill="${palette.muted}" opacity=".06"/>
  <rect x="${830 - variant * 16}" y="${145 + variant * 12}" width="${245 - variant * 18}" height="${76 + variant * 8}" rx="20" fill="${palette.gold}" opacity=".055"/>
  <path d="M72 112h${line1}M72 615h${line2}M72 655h${line3}" stroke="${palette.paper}" stroke-width="5" opacity=".72" stroke-linecap="round"/>
  <path d="M72 640h${line1 + 80}M72 682h${line3 + 80}" stroke="${palette.gold}" stroke-width="3" opacity=".72" stroke-linecap="round"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="${palette.gold}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".92">
    ${icon}
  </g>
  <g opacity=".12" fill="none" stroke="${palette.paper}" stroke-width="2">
    <circle cx="${930 - variant * 32}" cy="${118 + variant * 31}" r="${92 + variant * 9}"/>
    <circle cx="${975 - variant * 21}" cy="${148 + variant * 26}" r="${45 + variant * 7}"/>
  </g>
  <rect width="1200" height="760" fill="#000000" opacity=".08"/>
</svg>`;
};

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
}

for (const [slug, icon] of categories) {
  for (let i = 1; i <= 4; i += 1) {
    const source = svg(slug, icon, i);
    for (const target of targets) {
      const out = path.join(target, `${slug}-${String(i).padStart(2, '0')}.webp`);
      const result = spawnSync('magick', ['svg:-', '-strip', '-quality', '84', out], {
        input: source,
        encoding: 'utf8',
      });
      if (result.status !== 0) {
        throw new Error(`magick failed for ${out}: ${result.stderr}`);
      }
    }
  }
}

console.log(`Generated ${categories.length * 4} flat covers in each target`);
