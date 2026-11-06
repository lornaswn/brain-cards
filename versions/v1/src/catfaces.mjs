// catfaces.mjs — 17 个表情的奶胖团子猫（原型：奶白+浅棕斑+琥珀眼）
// 透明底，便于铺在卡牌主题色舞台上；可导出高清 PNG 与联络表。
import fs from "node:fs";

const FUR = '#fdf3e3', FUR2 = '#f6e7cc', LINE = '#e2c9a0', PATCH = '#ecd2ae',
      PINK = '#ffc9d6', INK = '#4a3421', AMBER = '#7a4a1f';

const EYES = {
  normal: (lx,ly,rx,ry) => `
    <circle cx="${lx}" cy="${ly}" r="24" fill="${INK}"/><circle cx="${lx-7}" cy="${ly-8}" r="8" fill="#fff"/><circle cx="${lx+5}" cy="${ly+7}" r="4" fill="#ffb45e" opacity=".9"/>
    <circle cx="${rx}" cy="${ry}" r="24" fill="${INK}"/><circle cx="${rx-7}" cy="${ry-8}" r="8" fill="#fff"/><circle cx="${rx+5}" cy="${ry+7}" r="4" fill="#ffb45e" opacity=".9"/>`,
  half: (lx,ly,rx,ry) => `
    <path d="M${lx-24} ${ly-4} h48" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${lx-16} ${ly-4} a16 14 0 0 0 32 0 Z" fill="${INK}"/>
    <path d="M${rx-24} ${ly-4} h48" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M${rx-16} ${ly-4} a16 14 0 0 0 32 0 Z" fill="${INK}"/>`,
  happy: (lx,ly,rx,ry) => `
    <path d="M${lx-24} ${ly+6} q24 -26 48 0" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <path d="M${rx-24} ${ly+6} q24 -26 48 0" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`,
  angry: (lx,ly,rx,ry) => `
    <path d="M${lx-26} ${ly-16} l46 14" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${lx-14} ${ly-2} a15 12 0 0 0 30 2 Z" fill="${INK}"/>
    <path d="M${rx+26} ${ly-16} l-46 14" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${rx-16} ${ly-2} a15 12 0 0 0 30 2 Z" fill="${INK}"/>`,
  scared: (lx,ly,rx,ry) => `
    <circle cx="${lx}" cy="${ly}" r="27" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="${lx}" cy="${ly+2}" r="9" fill="${INK}"/><circle cx="${lx+3}" cy="${ly-1}" r="3" fill="#fff"/>
    <circle cx="${rx}" cy="${ry}" r="27" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="${rx}" cy="${ry+2}" r="9" fill="${INK}"/><circle cx="${rx+3}" cy="${ry-1}" r="3" fill="#fff"/>`,
  spiral: (lx,ly,rx,ry) => `
    <path d="M${lx} ${ly} m0 -2 a3 3 0 0 1 6 1 a6 6 0 0 1 -12 2 a10 10 0 0 1 20 -3 a14 14 0 0 1 -28 4" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M${rx} ${ry} m0 -2 a3 3 0 0 1 6 1 a6 6 0 0 1 -12 2 a10 10 0 0 1 20 -3 a14 14 0 0 1 -28 4" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  star: (lx,ly,rx,ry) => `
    <path d="M${lx} ${ly-26} l7 16 17 2 -12.5 11.5 3.4 17 -14.9 -8.6 -14.9 8.6 3.4 -17 -12.5 -11.5 17 -2 Z" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/>
    <path d="M${rx} ${ry-26} l7 16 17 2 -12.5 11.5 3.4 17 -14.9 -8.6 -14.9 8.6 3.4 -17 -12.5 -11.5 17 -2 Z" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/>`,
  closed: (lx,ly,rx,ry) => `
    <path d="M${lx-22} ${ly} q22 18 44 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <path d="M${rx-22} ${ry} q22 18 44 0" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>`,
  squeeze: (lx,ly,rx,ry) => `
    <path d="M${lx-20} ${ly-14} l30 14 -30 14 M${rx+20} ${ly-14} l-30 14 30 14" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`,
  teary: (lx,ly,rx,ry) => `
    <circle cx="${lx}" cy="${ly+3}" r="21" fill="${INK}"/><circle cx="${lx-6}" cy="${ly-3}" r="7" fill="#fff"/>
    <circle cx="${rx}" cy="${ry+3}" r="21" fill="${INK}"/><circle cx="${rx-6}" cy="${ry-3}" r="7" fill="#fff"/>
    <path d="M${lx-20} ${ly-14} q20 -12 40 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${rx-20} ${ry-14} q20 -12 40 0" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="${lx-14}" cy="${ly+26}" rx="8" ry="12" fill="#9ed3f2"/><ellipse cx="${rx+14}" cy="${ry+26}" rx="8" ry="12" fill="#9ed3f2"/>`,
  lookup: (lx,ly,rx,ry) => `
    <circle cx="${lx}" cy="${ly}" r="23" fill="${INK}"/><circle cx="${lx-2}" cy="${ly-9}" r="9" fill="#fff"/><circle cx="${lx+8}" cy="${ly-8}" r="3.5" fill="#ffb45e"/>
    <circle cx="${rx}" cy="${ry}" r="23" fill="${INK}"/><circle cx="${rx-2}" cy="${ry-9}" r="9" fill="#fff"/><circle cx="${rx+8}" cy="${ry-8}" r="3.5" fill="#ffb45e"/>`
};

const MOUTH = {
  smile: (x,y) => `<path d="M${x-16} ${y-6} q16 16 32 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  omega: (x,y) => `<path d="M${x-16} ${y-4} q8 -8 16 0 q8 -8 16 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x} ${y-4} q-4 10 4 13 q10 -2 5 -12" fill="#e89aae" stroke="#d47f96" stroke-width="3"/>`,
  open: (x,y) => `<path d="M${x-18} ${y-6} q18 -6 36 0 q-4 26 -18 26 q-14 0 -18 -26 Z" fill="#a34a5e" stroke="${INK}" stroke-width="4"/><path d="M${x-8} ${y+16} q8 8 16 0" stroke="#e89aae" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  shout: (x,y) => `<ellipse cx="${x}" cy="${y+8}" rx="20" ry="24" fill="#a34a5e" stroke="${INK}" stroke-width="4"/><path d="M${x-10} ${y+18} q10 10 20 0" stroke="#ff8ba0" stroke-width="6" fill="none" stroke-linecap="round"/>`,
  wavy: (x,y) => `<path d="M${x-18} ${y} q6 -8 12 0 q6 8 12 0 q6 -8 12 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  flat: (x,y) => `<path d="M${x-16} ${y} h32" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  smallO: (x,y) => `<ellipse cx="${x}" cy="${y+4}" rx="9" ry="11" fill="#a34a5e" stroke="${INK}" stroke-width="4"/>`,
  pout: (x,y) => `<path d="M${x-10} ${y+6} q10 -8 20 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x} ${y-2} q-3 -6 0 -8 M${x} ${y-2} q3 -6 0 -8" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
  yawn: (x,y) => `<ellipse cx="${x}" cy="${y+10}" rx="17" ry="21" fill="#a34a5e" stroke="${INK}" stroke-width="4"/><path d="M${x-8} ${y+4} a8 6 0 0 0 16 0 Z" fill="#e89aae"/>`,
  drool: (x,y) => `<path d="M${x-16} ${y-4} q8 -8 16 0 q8 -8 16 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x+22} ${y+2} q8 14 0 20 q-8 -2 -6 -12 Z" fill="#9ed3f2" stroke="#7db8dd" stroke-width="2.5"/>`,
  sad: (x,y) => `<path d="M${x-14} ${y+8} q14 -12 28 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  grin: (x,y) => `<path d="M${x-22} ${y-8} q22 -8 44 0 q-4 30 -22 30 q-18 0 -22 -30 Z" fill="#a34a5e" stroke="${INK}" stroke-width="4"/><path d="M${x-14} ${y-6} h28" stroke="#fff" stroke-width="7"/>`
};

const BROWS = {
  none: () => '',
  raiseL: (lx,ly,rx,ry) => `<path d="M${lx-18} ${ly-38} q18 -12 34 -4" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`,
  worried: (lx,ly,rx,ry) => `<path d="M${lx-18} ${ly-34} q16 8 30 2 M${rx+18} ${ry-34} q-16 8 -30 2" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`
};

const EXTRAS = {
  angerVeins: () => `<g stroke="#e04f4f" stroke-width="6" stroke-linecap="round"><path d="M296 66 v18 M287 75 h18"/><path d="M326 92 v16 M318 100 h16"/></g>`,
  sweat: (x=318,y=120) => `<path d="M${x} ${y} q10 16 0 24 q-10 -8 0 -24Z" fill="#9ed3f2" stroke="#7db8dd" stroke-width="2.5"/>`,
  tears: () => `<path d="M120 218 q6 18 0 28 q-8 -10 0 -28Z" fill="#9ed3f2"/><path d="M282 226 q8 20 0 32 q-9 -12 0 -32Z" fill="#9ed3f2"/>`,
  zzz: () => `<g fill="#9db7d6" font-family="'Noto Sans CJK SC',sans-serif" font-weight="800"><text x="300" y="86" font-size="34" transform="rotate(8 300 86)">Z</text><text x="326" y="58" font-size="26" transform="rotate(14 326 58)">Z</text><text x="348" y="38" font-size="19" transform="rotate(20 348 38)">z</text></g>`,
  q2: () => `<g fill="#f2a7c3" font-family="'Noto Sans CJK SC',sans-serif" font-weight="800"><text x="300" y="72" font-size="44" transform="rotate(12 300 72)">?</text><text x="338" y="104" font-size="28" transform="rotate(-8 338 104)">?</text></g>`,
  q3: () => `<g fill="#f2a7c3" font-family="'Noto Sans CJK SC',sans-serif" font-weight="800"><text x="52" y="80" font-size="36" transform="rotate(-10 52 80)">?</text><text x="298" y="66" font-size="36" transform="rotate(10 298 66)">?</text><text x="332" y="100" font-size="24">?</text></g>`,
  bang: () => `<g fill="#ff7d7d" font-family="'Noto Sans CJK SC',sans-serif" font-weight="800"><text x="306" y="78" font-size="48" transform="rotate(10 306 78)">!</text></g>`,
  dots: () => `<g fill="#b7a98f"><circle cx="306" cy="70" r="6"/><circle cx="328" cy="70" r="6"/><circle cx="350" cy="70" r="6"/></g>`,
  sparkles: () => `<g fill="#ffd23e"><path d="M304 56 l4 10 10 1 -7.5 7 2 10 -8.5 -5 -8.5 5 2 -10 -7.5 -7 10 -1Z"/><path d="M340 92 l3 7 7 .8 -5.3 5 1.4 7 -6.1 -3.4 -6.1 3.4 1.4 -7 -5.3 -5 7 -.8Z"/></g>`,
  coins: () => `<g><circle cx="312" cy="72" r="17" fill="#ffd23e" stroke="#e0a91f" stroke-width="3.5"/><text x="312" y="80" text-anchor="middle" font-size="20" font-weight="800" fill="#b8860b" font-family="'Noto Sans CJK SC',sans-serif">¥</text><circle cx="345" cy="100" r="12" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/><circle cx="94" cy="84" r="13" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/></g>`,
  bulb: () => `<g><circle cx="320" cy="64" r="20" fill="#ffe27a" stroke="#e0a91f" stroke-width="3.5"/><path d="M313 82 h14 M314 89 h12" stroke="#e0a91f" stroke-width="3.5" stroke-linecap="round"/><path d="M320 52 v-8 M306 60 l-7 -5 M334 60 l7 -5" stroke="#e0a91f" stroke-width="3.5" stroke-linecap="round"/></g>`,
  think: () => `<g fill="#eaf1f8" stroke="#b9c9da" stroke-width="3"><circle cx="304" cy="70" r="16"/><circle cx="330" cy="48" r="10"/><circle cx="348" cy="34" r="6"/></g><text x="304" y="77" text-anchor="middle" font-size="20" font-weight="800" fill="#9fb1c4" font-family="'Noto Sans CJK SC',sans-serif">…</text>`,
  wave: () => `<g fill="none" stroke="#8fb8d4" stroke-width="4" stroke-linecap="round"><path d="M304 84 q10 -12 0 -24 M318 92 q16 -20 0 -40 M332 100 q22 -28 0 -56"/></g>`,
  motion: () => `<g stroke="#8fb8d4" stroke-width="5" stroke-linecap="round" fill="none"><path d="M64 140 l26 8 M60 172 l28 0 M64 204 l26 -8"/><path d="M310 140 l26 -8 M312 172 h28 M310 204 l26 8"/></g>`,
  lightning: () => `<g><path d="M96 60 l-16 26 h12 l-8 24 22 -30 h-12 l10 -20Z" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/><path d="M318 48 l-14 24 h11 l-7 22 20 -28 h-11 l9 -18Z" fill="#ffd23e" stroke="#e0a91f" stroke-width="3"/></g>`,
  drop1: () => `<path d="M300 96 q11 17 0 26 q-11 -9 0 -26Z" fill="#9ed3f2" stroke="#7db8dd" stroke-width="2.5"/>`,
  drop2: () => `<path d="M92 110 q11 17 0 26 q-11 -9 0 -26Z" fill="#9ed3f2" stroke="#7db8dd" stroke-width="2.5"/>`,
  fish: () => `<g transform="translate(316,64)"><ellipse cx="0" cy="0" rx="24" ry="14" fill="#a5cdec" stroke="#7da8cc" stroke-width="3"/><path d="M18 0 l16 -10 v20Z" fill="#a5cdec" stroke="#7da8cc" stroke-width="3"/><circle cx="-10" cy="-3" r="2.6" fill="${INK}"/></g>`,
  moon: () => `<path d="M326 44 a26 26 0 1 0 22 40 a20 20 0 0 1 -22 -40Z" fill="#ffe27a" stroke="#e0c25e" stroke-width="3"/>`,
  music: () => `<g fill="#8fb8d4"><path d="M300 96 v-30 l16 -5 v30" fill="none" stroke="#8fb8d4" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="296" cy="97" rx="8" ry="6"/><ellipse cx="312" cy="92" rx="8" ry="6"/><circle cx="338" cy="66" r="5"/><circle cx="352" cy="84" r="4"/></g>`
};

function cat(spec) {
  const L = { x: 160, y: 196 }, R = { x: 244, y: 196 }, M = { x: 202, y: 240 };
  const eyes = EYES[spec.eyes](L.x, L.y, R.x, R.y);
  const mouth = MOUTH[spec.mouth](M.x, M.y);
  const brows = BROWS[spec.brows || 'none'](L.x, L.y, R.x, R.y);
  const blushColor = spec.angryBlush ? '#ff9b9b' : PINK;
  const cheeks = (spec.noBlush ? '' :
    `<ellipse cx="118" cy="238" rx="20" ry="12" fill="${PINK}" opacity=".75"/><ellipse cx="286" cy="238" rx="20" ry="12" fill="${PINK}" opacity=".75"/>`);
  const angryCheeks = spec.angryBlush ?
    `<ellipse cx="118" cy="238" rx="22" ry="13" fill="${blushColor}" opacity=".8"/><ellipse cx="286" cy="238" rx="22" ry="13" fill="${blushColor}" opacity=".8"/>` : cheeks;
  const extras = (spec.extras || []).map(k => EXTRAS[k]()).join('');
  return `
<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="200" cy="416" rx="118" ry="17" fill="#8fb8d4" opacity=".28"/>
<path d="M300 372 q56 6 54 -42 q-2 -28 -28 -26 q20 13 11 31 q-9 20 -44 17Z" fill="#f0dcbd" stroke="${LINE}" stroke-width="4"/>
<path d="M132 306 q-12 76 26 100 q50 20 100 0 q38 -24 26 -100 q-8 -50 -76 -50 q-68 0 -76 50Z" fill="${FUR}" stroke="${LINE}" stroke-width="5"/>
<ellipse cx="200" cy="360" rx="56" ry="44" fill="#fffef9" opacity=".8"/>
<ellipse cx="166" cy="398" rx="28" ry="19" fill="${FUR}" stroke="${LINE}" stroke-width="4"/>
<ellipse cx="234" cy="398" rx="28" ry="19" fill="${FUR}" stroke="${LINE}" stroke-width="4"/>
<path d="M160 393 v9 M172 393 v9 M228 393 v9 M240 393 v9" stroke="${LINE}" stroke-width="3" stroke-linecap="round"/>
<path d="M108 148 L92 78 L162 110Z" fill="${FUR}" stroke="${LINE}" stroke-width="5"/>
<path d="M114 140 L104 94 L150 116Z" fill="${PINK}"/>
<path d="M296 148 L312 78 L242 110Z" fill="${FUR}" stroke="${LINE}" stroke-width="5"/>
<path d="M290 140 L300 94 L254 116Z" fill="${PINK}"/>
<circle cx="202" cy="196" r="108" fill="${FUR}" stroke="${LINE}" stroke-width="5"/>
<path d="M248 106 q40 22 44 72 q2 24 -11 36 q-13 -62 -52 -96Z" fill="${PATCH}" opacity=".9"/>
${angryCheeks}
${eyes}
${brows}
${mouth}
<g stroke="#d9c3a0" stroke-width="3" stroke-linecap="round"><path d="M96 216 h-30 M98 230 l-28 8 M308 216 h30 M306 230 l28 8"/></g>
${extras}
</svg>`;
}

export const FACES = [
  { id: 'frontal',       label: '额叶 · 冷静专注',   eyes: 'half',    mouth: 'flat',   extras: ['bulb'] },
  { id: 'parietal',      label: '顶叶 · 迷糊懵',     eyes: 'spiral',  mouth: 'wavy',   extras: ['q2'] },
  { id: 'temporal',      label: '颞叶 · 竖耳倾听',   eyes: 'normal',  mouth: 'omega',  extras: ['wave'] },
  { id: 'occipital',     label: '枕叶 · 好奇瞪眼',   eyes: 'star',    mouth: 'smallO', extras: ['sparkles'] },
  { id: 'hippocampus',   label: '海马体 · 努力回想', eyes: 'lookup',  mouth: 'flat',   extras: ['think'] },
  { id: 'amygdala',      label: '杏仁核 · 警报害怕', eyes: 'scared',  mouth: 'smallO', extras: ['bang', 'sweat'] },
  { id: 'thalamus',      label: '丘脑 · 累瘫哈欠',   eyes: 'closed',  mouth: 'yawn',   extras: ['drop1'] },
  { id: 'hypothalamus',  label: '下丘脑 · 嘴馋流口水', eyes: 'happy', mouth: 'drool',  extras: ['fish'] },
  { id: 'brainstem',     label: '脑干 · 熟睡',       eyes: 'closed',  mouth: 'smile',  extras: ['zzz', 'moon'] },
  { id: 'cerebellum',    label: '小脑 · 活力满满',   eyes: 'happy',   mouth: 'grin',   extras: ['motion', 'drop2'] },
  { id: 'nacc',          label: '伏隔核 · 狂喜星星眼', eyes: 'star',  mouth: 'grin',   extras: ['coins', 'sparkles'] },
  { id: 'broca',         label: '布洛卡区 · 大声开讲', eyes: 'normal', mouth: 'shout', extras: ['bang'] },
  { id: 'wernicke',      label: '韦尼克区 · 听不懂', eyes: 'normal',  mouth: 'wavy',   brows: 'raiseL', extras: ['q3'] },
  { id: 'insula',        label: '脑岛 · 恶心难受',   eyes: 'squeeze', mouth: 'wavy',   extras: ['drop1', 'drop2'] },
  { id: 'basal',         label: '基底节 · 烦躁无聊', eyes: 'half',    mouth: 'flat',   extras: ['angerVeins', 'dots'] },
  { id: 'cingulate',     label: '扣带回 · 伤心委屈', eyes: 'teary',   mouth: 'sad',    extras: ['sweat'] },
  { id: 'caudate',       label: '尾状核 · 发脾气大怒', eyes: 'angry', mouth: 'shout',  angryBlush: true, extras: ['angerVeins', 'lightning'] }
];

function singleHTML(svg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;}svg{display:block;width:600px;height:660px;}</style></head><body>${svg}</body></html>`;
}

function gridHTML() {
  const cells = FACES.map(f => `
<div class="cell"><div class="art">${cat(f)}</div><div class="lab">${f.label}</div></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#f0ede6;display:grid;grid-template-columns:repeat(6,400px);gap:24px;padding:24px;justify-content:center;font-family:'Noto Sans CJK SC',sans-serif}
.cell{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 6px 18px rgba(30,40,60,.14)}
.art{width:400px;height:400px}.art svg{display:block;width:400px;height:400px}
.lab{text-align:center;font-size:16px;font-weight:700;color:#5a6b7a;padding:10px 0 12px}
</style></head><body>${cells}</body></html>`;
}

// 直接运行时：node catfaces.mjs grid |  node catfaces.mjs singles <dir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv[2];
  if (mode === 'grid') { process.stdout.write(gridHTML()); }
  else if (mode === 'singles') {
    const dir = process.argv[3] || '/tmp/facehtml';
    fs.mkdirSync(dir, { recursive: true });
    for (const f of FACES) fs.writeFileSync(`${dir}/${f.id}.html`, singleHTML(cat(f)));
    console.error(`wrote ${FACES.length} singles to ${dir}`);
  }
}
