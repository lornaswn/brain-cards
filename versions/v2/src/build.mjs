/* build.mjs — 由同一份 cards.json + render.js 生成 app/index.html 与 print/ 实体样本 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import QRCode from "qrcode";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, "..");
const SRC = path.join(ROOT, "src");
const APP = path.join(ROOT, "app");
const PRINT = path.join(ROOT, "print");

const cards = JSON.parse(fs.readFileSync(path.join(SRC, "cards.json"), "utf8"));
const meta = cards.meta;
const CARDS = cards.cards;
const TOTAL = CARDS.length;
const MASCOT = meta.mascot || { cn: "想开", en: "ThinkCat", tagline: "" };

// 载入共享渲染层（render.js 通过 globalThis.Render 暴露）
const renderSrc = fs.readFileSync(path.join(SRC, "render.js"), "utf8");
globalThis.CARDMETA = meta;
globalThis.MASCOT = MASCOT;

// 表情猫素材：透明 PNG -> dataURI，注入 CATMAP 供 render.js 使用
const FACE_FILE = { pfc: "frontal", basalganglia: "basal" }; // 卡id -> 猫图文件名
const CATMAP = {};
for (const c of CARDS) {
  const fid = FACE_FILE[c.id] || c.id;
  const p = path.join(ROOT, "assets", "cat-faces", fid + ".png");
  if (fs.existsSync(p)) CATMAP[c.id] = "data:image/png;base64," + fs.readFileSync(p).toString("base64");
  else console.warn("⚠ 缺少猫图:", fid + ".png");
}
globalThis.CATMAP = CATMAP;

// 二维码：每张卡深链到家长小程序对应脑区页（?card=<id>）；免费看 1 条 → 之后付费
// 基地址通过环境变量 QR_BASE 注入（部署到你的真实域名后改这里即可）。
// 例如：QR_BASE="https://your-domain.com/parent-app/?card=" node src/build.mjs
// 注意要以 "?card=" 结尾，拼接卡 id 后形如 https://your-domain.com/parent-app/?card=pfc
const QR_BASE = (process.env.QR_BASE || "https://your-domain.example.com/parent-app/?card=");
// 体验版开关：true = 17 张「应对方案」全部免费开放；改为 false = 恢复「只免费 1 条、其余付费」模式
const PA_FREE_ALL = true;
const QR_DIR = path.join(ROOT, "assets", "qr");
fs.mkdirSync(QR_DIR, { recursive: true });
const CATQR = {};
for (const c of CARDS) {
  const url = QR_BASE + c.id;
  const dataURI = await new Promise((res, rej) =>
    QRCode.toDataURL(url, {
      margin: 2, width: 340, errorCorrectionLevel: "M",
      color: { dark: "#1b2330", light: "#ffffff" }
    }, (e, d) => (e ? rej(e) : res(d)))
  );
  CATQR[c.id] = dataURI;
  fs.writeFileSync(path.join(QR_DIR, c.id + ".png"), Buffer.from(dataURI.split(",")[1], "base64"));
}
globalThis.CATQR = CATQR;
console.log("✓ 二维码生成", Object.keys(CATQR).length, "张 -> assets/qr");

new Function(renderSrc)();
const R = globalThis.Render;

/* ---------------- 共享核心 CSS（app 与 print 完全一致） ---------------- */
const coreCSS = `
:root{--ink:#22303a;--muted:#5b6b7a;--line:#e7edf3;}
*{box-sizing:border-box;}
body{margin:0;font-family:"Noto Sans CJK SC","PingFang SC","Microsoft YaHei","Source Han Sans SC",sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased;}
.card{position:relative;width:100%;aspect-ratio:63/88;background:#fff;border-radius:4cqw;overflow:hidden;
  container-type:inline-size;box-shadow:0 1.2cqw 3cqw rgba(20,40,60,.20);display:flex;flex-direction:column;color:var(--ink);}
/* ---------------- 正面：表情猫大舞台 ---------------- */
.card .illu{height:52%;width:100%;padding:3cqw 3cqw 0;flex:none;}
.card .cat-stage{position:relative;width:100%;height:100%;border-radius:5cqw;overflow:hidden;display:flex;align-items:flex-end;justify-content:center;}
.card .cat-glow{position:absolute;inset:0;}
.card .cat-img{position:relative;width:100%;height:100%;object-fit:contain;object-position:center bottom;}
.card .loc{position:absolute;left:50%;bottom:1.8cqw;transform:translateX(-50%);display:inline-flex;align-items:center;gap:1.2cqw;background:#fff;border-radius:99cqw;padding:.8cqw 2.6cqw;font-size:2.35cqw;font-weight:700;color:#3c4853;white-space:nowrap;box-shadow:0 .6cqw 2cqw rgba(20,40,60,.10);}
.card .loc i{width:1.8cqw;height:1.8cqw;border-radius:50%;flex:none;}
/* ---------------- 正面文字：脑名 + 代号 + 功能 ---------------- */
.card .code{display:flex;align-items:baseline;gap:1.6cqw;padding:1.6cqw 4cqw 0;}
.card .code-tag{font-size:2.5cqw;font-weight:700;color:#fff;background:var(--c);border-radius:1cqw;padding:.5cqw 1.6cqw;letter-spacing:.2cqw;white-space:nowrap;}
.card .code-name{font-size:6.4cqw;font-weight:800;color:var(--c);line-height:1;}
.card .func{margin:1.4cqw 4cqw 0;font-size:3.2cqw;font-weight:700;color:var(--c);line-height:1.3;}
.card .desc{margin:1.4cqw 4cqw 0;font-size:2.85cqw;line-height:1.5;color:#46535e;}
.card .nameline{display:flex;align-items:baseline;gap:1.8cqw;padding:1.9cqw 4cqw 0;flex-wrap:wrap;}
.card .nameline .cn{font-size:5.2cqw;font-weight:800;color:var(--ink);line-height:1;}
.card .nameline .sci{font-size:2.8cqw;font-weight:600;color:var(--muted);font-style:italic;}
.card .foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding:1.4cqw 4.5cqw 2.8cqw;font-size:2.2cqw;color:var(--muted);}
.card.back{background:#fff;}
.card .back-top{display:flex;align-items:center;gap:2.6cqw;padding:4cqw 4cqw 3cqw;background:linear-gradient(135deg,var(--c),var(--c2));color:#fff;}
.card .back-badge{width:11cqw;height:11cqw;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;flex:none;}
.card .back-badge svg{width:7cqw;height:7cqw;}
.card .back-titles{display:flex;flex-direction:column;min-width:0;}
.card .back-code{font-size:5.8cqw;font-weight:800;line-height:1.05;}
.card .back-name{font-size:2.7cqw;opacity:.92;font-style:normal;margin-top:.5cqw;}
.card .back-body{position:relative;padding:2.4cqw 4.2cqw 1.8cqw;flex:1;display:flex;flex-direction:column;gap:1.9cqw;overflow:hidden;}
.card .bs-wm{position:absolute;right:1cqw;bottom:17cqw;opacity:.07;color:var(--c);pointer-events:none;}
.card .bs-wm svg{width:34cqw;height:34cqw;}
.card .bs{display:flex;flex-direction:column;}
.card .bs-title{font-size:3cqw;font-weight:800;color:var(--c);margin-bottom:.7cqw;display:flex;align-items:center;}
.card .bs-title:before{content:"";width:1.5cqw;height:3cqw;background:var(--c);border-radius:1cqw;display:inline-block;margin-right:1.5cqw;}
.card .bs .symp{margin:0;padding:0;list-style:none;}
.card .bs .symp li{position:relative;padding-left:3.6cqw;font-size:2.45cqw;line-height:1.34;color:#46535e;margin-bottom:.5cqw;}
.card .bs .symp li:before{content:"";position:absolute;left:.7cqw;top:.9cqw;width:1.7cqw;height:1.7cqw;border-radius:50%;background:var(--c);opacity:.85;}
.card .bs p{margin:0;font-size:2.5cqw;line-height:1.4;color:#3c4853;}
/* 错误看待（红） vs 正确看待（品牌色）对比块 */
.card .bs.wrong,.card .bs.right{border-radius:2.4cqw;padding:1.6cqw 2.2cqw;}
.card .bs.wrong{background:#FFF1F0;border:1cqw solid #FFD9D6;}
.card .bs.wrong .bs-title{color:#E5484D;font-size:2.7cqw;}
.card .bs.wrong .bs-title.w:before{display:none;}
.card .bs.right{border:1cqw solid var(--c);}
.card .bs.right .bs-title{color:var(--c);font-size:2.7cqw;}
.card .bs.right .bs-title.r:before{display:none;}
.card .bs.right p{color:#33414c;}
.card .hook-quote{border-left:1.1cqw solid var(--c);border-radius:0 2cqw 2cqw 0;padding:1.3cqw 2cqw;font-size:2.45cqw;font-weight:700;color:var(--c);line-height:1.4;}
.card .bs.hook{margin-top:auto;}
.card .back-foot{margin-top:auto;padding:1.9cqw 3.6cqw;display:flex;align-items:center;justify-content:space-between;gap:2cqw;background:linear-gradient(90deg,var(--c),var(--c2));}
.card .qr-text{color:#fff;line-height:1.3;}
.card .qr-text b{font-size:2.7cqw;display:block;}
.card .qr-text span{font-size:1.95cqw;opacity:.92;}
.card .qr{width:24cqw;height:24cqw;border-radius:1.6cqw;background:#fff;padding:1.2cqw;flex:none;}
`;

/* ============================ 生成 APP ============================ */
const appCSS = `
html,body{background:linear-gradient(160deg,#0f1830,#1b2a4a 55%,#243a63);min-height:100vh;}
.app{max-width:980px;margin:0 auto;padding:18px 14px 60px;}
.app-head{text-align:center;color:#fff;padding:14px 0 6px;}
.app-head h1{margin:0;font-size:26px;letter-spacing:1px;font-weight:800;
  background:linear-gradient(90deg,#7ee8fa,#80ff9e,#ffd23e);-webkit-background-clip:text;background-clip:text;color:transparent;}
.app-head p{margin:6px 0 0;color:#aebfd6;font-size:13px;}
.tabs{display:flex;gap:8px;justify-content:center;margin:16px 0 18px;}
.tab{padding:9px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);
  color:#cdd9ec;font-size:14px;cursor:pointer;font-weight:600;transition:.2s;}
.tab.active{background:#fff;color:#1b2a4a;border-color:#fff;}
.tab:hover{background:rgba(255,255,255,.16);}
.panel{display:none;}
.panel.active{display:block;}
/* 牌库网格 */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:16px;}
.cell{cursor:pointer;transition:transform .18s;}
.cell:hover{transform:translateY(-4px);}
.cell .card-wrap{width:100%;}
/* 详情弹窗 */
.modal-bg{position:fixed;inset:0;background:rgba(8,14,28,.82);display:none;align-items:center;justify-content:center;padding:18px;z-index:50;}
.modal-bg.show{display:flex;}
.modal-inner{width:min(340px,92vw);}
.flip{position:relative;width:100%;aspect-ratio:63/88;perspective:1200px;cursor:pointer;}
.flip .face{position:absolute;inset:0;backface-visibility:hidden;transition:transform .55s;transform-style:preserve-3d;}
.flip .backface{transform:rotateY(180deg);}
.flip.flipped .frontface{transform:rotateY(180deg);}
.flip.flipped .backface{transform:rotateY(360deg);}
.modal-close{position:absolute;top:14px;right:18px;color:#fff;font-size:28px;cursor:pointer;z-index:60;}
.modal-hint{text-align:center;color:#9fb0c8;font-size:12px;margin-top:10px;}
.about{color:#dfe8f5;max-width:680px;margin:0 auto;line-height:1.7;font-size:14px;}
.about h3{color:#80ff9e;}
.about .legend{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;}
.about .lg{background:rgba(255,255,255,.08);border-radius:8px;padding:5px 10px;font-size:12px;}
`;

function cardDataJS() {
  // 预生成每张卡的 front/back SVG/HTML 字符串，注入为常量，保证 app 自包含
  const arr = CARDS.map((c, i) => {
    const o = Object.assign({}, c);
    o.front = R.cardFrontHTML(c, i, TOTAL);
    o.back = R.cardBackHTML(c);
    return o;
  });
  return "window.CARDMETA=" + JSON.stringify(meta) + ";window.CARDS=" + JSON.stringify(arr) + ";";
}

const appJS = `
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
function showPanel(n){$$('.panel').forEach(p=>p.classList.remove('active'));$$('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('p'+n).classList.add('active');document.getElementById('t'+n).classList.add('active');}
// 牌库
(function(){const g=$('#grid');CARDS.forEach((c,i)=>{const d=document.createElement('div');d.className='cell';
  d.innerHTML='<div class="card-wrap">'+c.front+'</div>';d.onclick=()=>openModal(i);g.appendChild(d);});})();
// 详情弹窗 + 翻面
let cur=0;
function openModal(i){cur=i;const c=CARDS[i];$('#mflip').innerHTML='<div class="face frontface">'+c.front+'</div><div class="face backface">'+c.back+'</div>';
  $('#mflip').classList.remove('flipped');$('#modal').classList.add('show');}
$('#mflip').onclick=()=>$('#mflip').classList.toggle('flipped');
$('#mclose').onclick=()=>$('#modal').classList.remove('show');
$('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.remove('show');};
if(location.hash==='#about')showPanel(1);
`;

const appHTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>脑宇宙 · 青春期大脑探秘卡</title><style>${coreCSS}${appCSS}</style></head>
<body><div class="app">
<div class="app-head"><h1>🧠 脑宇宙 · 青春期大脑探秘卡</h1><p>${meta.subtitle} ｜ ${meta.audience}</p></div>
<div class="tabs">
  <div class="tab active" id="t0" onclick="showPanel(0)">🃏 牌库浏览</div>
  <div class="tab" id="t1" onclick="showPanel(1)">ℹ️ 关于这副牌</div>
</div>
<div class="panel active" id="p0"><div class="grid" id="grid"></div></div>
<div class="panel" id="p1"><div class="about">
  <h3>这副牌在玩什么？</h3>
  <p>17 张卡，每张对应一个青春期关键脑区，主角是 17 只表情各异的奶胖猫猫——它们共用一个名字：<b>「${MASCOT.cn}」（${MASCOT.en}）</b>。额叶猫在冷静思考、杏仁核猫竖起警报、尾状核猫气到冒火……猫猫的情绪就是这片脑区正在做的事，看一眼就记住。<br>卡面读法：<b>正面</b>看猫猫认脑区 → 脑名/学名 → 代号 → 主要功能；<b>背面</b>看「孩子可能会出现的症状」→ 家长「容易怎样误解」（红框）→「正确看待」（品牌色框）。点开任意一张卡，<b>点击卡面即可翻面</b>。</p>
  <h3>背面二维码是干嘛的？</h3>
  <p>每张卡背面都有专属二维码，扫一扫跳到家长小程序里这张脑区的详情页：免费看「错误 vs 正确看待」，并解锁 1 条<b>专属应对方案</b>（怎么具体跟孩子相处）。第 1 条免费，之后可<b>开通会员</b>或<b>单条购买</b>，把卡牌上的「可以这样做」放到了小程序里，随用随看。</p>
  <h3>为什么用猫猫？</h3>
  <p>比起解剖图，孩子更愿意看一只气鼓鼓或星星眼的猫。情绪化的形象让脑区功能「有脸可记」，也正好是亲子聊天的话题入口——「你今天像哪只猫？」</p>
  <h3>免责说明</h3>
  <p>本卡牌为脑科学科普与亲子沟通工具，不构成医学诊断。如怀疑孩子有发育异常或心理困扰，请咨询专业医生或心理咨询师。</p>
</div></div>
</div>
<div class="modal-bg" id="modal"><span class="modal-close" id="mclose">×</span>
  <div class="modal-inner"><div class="flip" id="mflip"></div><div class="modal-hint">点击卡牌翻面 · 看家长应对</div></div>
</div>
<script>${cardDataJS()}</script>
<script>${appJS}</script>
</body></html>`;

fs.writeFileSync(path.join(APP, "index.html"), appHTML);
console.log("✓ app/index.html 生成");


/* ============================ 生成 家长小程序 V2（全新版 · Tab 导航 / 引流闭环） ============================ */
const PA_DIR = path.join(ROOT, "parent-app");
fs.mkdirSync(PA_DIR, { recursive: true });
const QUIZ = JSON.parse(fs.readFileSync(path.join(SRC, "quiz.json"), "utf8"));
const PA_CARDS = CARDS.map((c) => ({
  id: c.id, name: c.name, en: c.en, code: c.code, color: c.color, color2: c.color2,
  region: c.region, function: c.function, desc: c.desc, puberty: c.puberty,
  wrongView: c.wrongView, parentView: c.parentView, coping: c.coping,
  img: CATMAP[c.id] || ""
}));

// 离线合成英文发音（espeak-ng + ffmpeg），内嵌为 dataURI（兜底用）
function synthAudio(text) {
  try {
    const t = "/tmp/pa_au_" + Math.random().toString(36).slice(2);
    const wav = t + ".wav", mp3 = t + ".mp3";
    execFileSync("espeak-ng", ["-v", "en-us", "-a", "120", "-s", "150", "-w", wav, text], { stdio: "ignore" });
    execFileSync("ffmpeg", ["-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "32k", mp3], { stdio: "ignore" });
    const b = fs.readFileSync(mp3);
    fs.unlinkSync(wav); fs.unlinkSync(mp3);
    return "data:audio/mpeg;base64," + b.toString("base64");
  } catch (e) { return ""; }
}
const PA_AUDIO = {};
for (const c of PA_CARDS) if (c.en) PA_AUDIO[c.en] = synthAudio(c.en);

// 主题牌库路线图（会员页「持续更新」展示，也是产品规划）
const DECKS = [
  { name: "大脑发育与青春期", icon: "🧠", status: "live", desc: "17 个核心脑区，读懂青春期大脑（本套已上线）" },
  { name: "情绪管理", icon: "🌊", status: "plan", desc: "愤怒 / 焦虑 / 悲伤 / 嫉妒…识别与调节情绪" },
  { name: "二胎与多子女", icon: "👶", status: "plan", desc: "争宠、公平感、手足关系的相处" },
  { name: "早恋与青春期情感", icon: "💗", status: "plan", desc: "好感、边界意识与情感启蒙" },
  { name: "学习动力与专注", icon: "📚", status: "plan", desc: "拖延、畏难、心流与目标感" },
  { name: "手机与网络", icon: "📱", status: "plan", desc: "游戏、短视频与网络社交边界" },
  { name: "亲子沟通", icon: "💬", status: "plan", desc: "倾听、表达与冲突后的修复" },
  { name: "抗挫力与压力", icon: "🛡️", status: "plan", desc: "失败、批评与完美主义应对" },
  { name: "睡眠与作息", icon: "🌙", status: "plan", desc: "熬夜、失眠与节律养成" },
  { name: "习惯养成", icon: "⚡", status: "plan", desc: "自律、仪式感与微习惯" },
  { name: "社交与同伴", icon: "🤝", status: "plan", desc: "友谊、从众、霸凌与孤独" },
  { name: "自我认同与自信", icon: "🌟", status: "plan", desc: "外貌焦虑、标签与价值感" }
];

const parentDataJS = "window.PA_CARDS=" + JSON.stringify(PA_CARDS) + ";window.PA_DECKS=" + JSON.stringify(DECKS) + ";window.MASCOT=" + JSON.stringify(MASCOT) + ";window.PA_AUDIO=" + JSON.stringify(PA_AUDIO) + ";window.QUIZ_LEVELS=" + JSON.stringify(QUIZ.levels) + ";";

// 应用首页二维码（分享海报 / 加群页使用；部署真实域名后自动变为真实地址）
const APP_URL = QR_BASE.replace(/\?card=$/, "");
const APP_QR = await new Promise((res, rej) =>
  QRCode.toDataURL(APP_URL, { margin: 2, width: 300, errorCorrectionLevel: "M", color: { dark: "#1b2330", light: "#ffffff" } }, (e, d) => (e ? rej(e) : res(d)))
);

const appCSS2 = fs.readFileSync(path.join(SRC, "app.css"), "utf8");
const appJS2 = fs.readFileSync(path.join(SRC, "app.js"), "utf8");
const boot = parentDataJS + "window.PA_FREE_ALL=" + PA_FREE_ALL + ";window.APP_QR=" + JSON.stringify(APP_QR) + ";window.CATMAP=" + JSON.stringify(CATMAP) + ";";

const parentHTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>脑宇宙 · 家长版 V2</title><style>${appCSS2}</style></head>
<body>
<div id="app"></div>
<div class="mask" id="mask"><div class="sheet" id="sheet"></div></div>
<div class="toast" id="toast"></div>
<div class="ob" id="ob"><div class="ob-card" id="obCard"></div></div>
<div class="poster-mask" id="posterMask"><span class="pm-x" onclick="closePoster()">×</span><canvas id="posterCv"></canvas><div class="pm-tip">长按上方图片保存 · 分享到朋友圈 / 妈妈群引流</div></div>
<script>${boot}</script>
<script>${appJS2}</script>
</body></html>`;

fs.writeFileSync(path.join(PA_DIR, "index.html"), parentHTML);
console.log("✓ parent-app/index.html (V2) 生成");

