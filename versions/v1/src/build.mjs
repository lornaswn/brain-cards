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

/* ============================ 生成 家长小程序（付费闭环） ============================ */
const PA_DIR = path.join(ROOT, "parent-app");
fs.mkdirSync(PA_DIR, { recursive: true });
const QUIZ = JSON.parse(fs.readFileSync(path.join(SRC, "quiz.json"), "utf8"));
const PA_CARDS = CARDS.map((c) => ({
  id: c.id, name: c.name, en: c.en, code: c.code, color: c.color, color2: c.color2,
  region: c.region, function: c.function, desc: c.desc, puberty: c.puberty,
  wrongView: c.wrongView, parentView: c.parentView, coping: c.coping,
  img: CATMAP[c.id] || ""
}));

// 离线合成英文发音（espeak-ng + ffmpeg），内嵌为 dataURI。
// 目的：speechSynthesis 在微信/X5 内核经常静默失败，内嵌真实音频可保证全平台可靠发声。
// 环境若无 espeak-ng / ffmpeg，优雅降级（返回空串，运行时走 speechSynthesis 兜底）。
function synthAudio(text) {
  try {
    const t = "/tmp/pa_au_" + Math.random().toString(36).slice(2);
    const wav = t + ".wav", mp3 = t + ".mp3";
    execFileSync("espeak-ng", ["-v", "en-us", "-a", "120", "-s", "150", "-w", wav, text], { stdio: "ignore" });
    execFileSync("ffmpeg", ["-y", "-i", wav, "-codec:a", "libmp3lame", "-b:a", "32k", mp3], { stdio: "ignore" });
    const b = fs.readFileSync(mp3);
    fs.unlinkSync(wav); fs.unlinkSync(mp3);
    return "data:audio/mpeg;base64," + b.toString("base64");
  } catch (e) {
    console.warn("⚠ 音频合成跳过:", text, "-", e.message);
    return "";
  }
}
const PA_AUDIO = {};
for (const c of PA_CARDS) if (c.en) PA_AUDIO[c.en] = synthAudio(c.en);
console.log("✓ 英文发音音频合成", Object.values(PA_AUDIO).filter(Boolean).length, "/", PA_CARDS.length, "条");

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

const parentCSS = `
*{box-sizing:border-box;}
html,body{margin:0;background:linear-gradient(165deg,#eef3fb,#f8eef6 58%,#fdeef0);min-height:100vh;
  font-family:"Noto Sans CJK SC","PingFang SC","Microsoft YaHei",sans-serif;color:#22303a;-webkit-font-smoothing:antialiased;}
.pa{max-width:520px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;}
.pa-head{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;
  background:rgba(255,255,255,.86);backdrop-filter:blur(8px);border-bottom:1px solid #eceff5;}
.pa-logo{font-weight:800;font-size:16px;color:#22303a;} .pa-logo b{color:#4F6DF5;}
.pa-nav{display:flex;gap:8px;} .pa-nav a{font-size:13px;color:#4F6DF5;font-weight:600;text-decoration:none;
  padding:6px 12px;border-radius:999px;background:#eef2ff;cursor:pointer;}
.pa-body{flex:1;padding:16px 16px 90px;}
.hero{background:linear-gradient(135deg,#4F6DF5,#8FA6FF);color:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(79,109,245,.25);}
.hero h1{margin:0 0 4px;font-size:20px;font-weight:800;} .hero p{margin:0;font-size:13px;opacity:.92;line-height:1.6;}
.badge-free{display:inline-block;margin-top:10px;background:rgba(255,255,255,.22);border-radius:999px;padding:4px 12px;font-size:12px;font-weight:600;}
.sec-title{font-size:15px;font-weight:800;margin:22px 4px 12px;color:#22303a;display:flex;align-items:center;gap:8px;}
.sec-title small{font-weight:500;color:#8a98a8;font-size:12px;}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
.gc{background:#fff;border-radius:14px;padding:12px;text-align:center;cursor:pointer;box-shadow:0 4px 14px rgba(30,50,80,.06);transition:transform .15s;}
.gc:active{transform:scale(.97);} .gc img{width:84px;height:84px;object-fit:contain;}
.gc .gn{font-weight:800;font-size:14px;margin-top:2px;} .gc .gc2{font-size:11px;color:#8a98a8;}
.gc .gcode{display:inline-block;margin-top:5px;font-size:11px;font-weight:700;color:#fff;border-radius:999px;padding:2px 9px;}
.d-hero{background:linear-gradient(135deg,var(--c),var(--c2));color:#fff;border-radius:18px;padding:18px;position:relative;box-shadow:0 10px 26px rgba(30,50,80,.18);}
.d-tag{display:inline-block;font-size:12px;font-weight:700;background:rgba(255,255,255,.22);border-radius:999px;padding:3px 10px;margin-bottom:6px;}
.d-back{position:absolute;left:14px;top:14px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);border:none;color:#fff;font-size:20px;cursor:pointer;}
.d-cat{width:116px;height:116px;object-fit:contain;margin:6px auto 0;display:block;}
.d-name{font-size:22px;font-weight:800;text-align:center;margin-top:6px;} .d-en{text-align:center;font-size:12px;opacity:.9;font-style:italic;}
.d-code{display:block;text-align:center;margin:8px auto 0;width:fit-content;background:rgba(255,255,255,.22);border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700;}
.d-region{display:flex;align-items:center;gap:6px;justify-content:center;margin-top:10px;font-size:12px;opacity:.95;}
.d-region i{width:8px;height:8px;border-radius:50%;background:#fff;} .d-func{margin:12px 2px 0;font-size:13px;line-height:1.6;opacity:.96;}
.block{border-radius:16px;padding:14px;margin-top:14px;background:#fff;box-shadow:0 4px 14px rgba(30,50,80,.06);}
.block.wrong{background:#FFF1F0;border:1.5px solid #FFD9D6;} .block.right{border:1.5px solid var(--c);}
.block h3{margin:0 0 8px;font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;}
.block.wrong h3{color:#E5484D;} .block.right h3{color:var(--c);}
.block h3 .mk{width:22px;height:22px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:13px;color:#fff;}
.block.wrong h3 .mk{background:#E5484D;} .block.right h3 .mk{background:var(--c);}
.block p{margin:0;font-size:13.5px;line-height:1.65;color:#3c4853;} .block.wrong p{color:#7a3b3b;}
.block.coping.locked .lockbox{background:#f6f8fc;border:1.5px dashed #c7d2e6;border-radius:12px;padding:16px;text-align:center;}
.lockbox .lk-ic{font-size:26px;} .lockbox p{color:#6b7886;font-size:13px;margin:6px 0 12px;}
.btn{border:none;border-radius:999px;font-weight:700;cursor:pointer;font-size:14px;padding:11px 18px;}
.btn-primary{background:linear-gradient(135deg,#4F6DF5,#6f8bff);color:#fff;box-shadow:0 6px 16px rgba(79,109,245,.3);}
.btn-block{width:100%;} .btn-ghost{background:#eef2ff;color:#4F6DF5;}
.cop-list{margin:0;padding-left:20px;} .cop-list li{font-size:13.5px;line-height:1.7;color:#3c4853;margin-bottom:6px;}
.open-vip{display:flex;align-items:center;justify-content:space-between;margin-top:18px;background:linear-gradient(135deg,#ffd23e,#ffb03e);border-radius:14px;padding:14px 16px;color:#5a3d00;}
.open-vip b{font-size:15px;} .open-vip span{font-size:12px;opacity:.85;} .open-vip button{background:#5a3d00;color:#ffd23e;border:none;border-radius:999px;padding:8px 16px;font-weight:700;cursor:pointer;}
.vip-hero{background:linear-gradient(135deg,#ffd23e,#ff9d3e);color:#5a3d00;border-radius:18px;padding:20px;box-shadow:0 10px 26px rgba(255,160,40,.25);}
.vip-hero h1{margin:0 0 6px;font-size:22px;} .vip-hero .price{font-size:30px;font-weight:800;} .vip-hero .price small{font-size:14px;font-weight:600;}
.benefit{display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:12px;padding:12px;margin-top:10px;box-shadow:0 3px 10px rgba(30,50,80,.05);}
.benefit .bi{font-size:20px;} .benefit b{display:block;font-size:14px;margin-bottom:2px;} .benefit span{font-size:12.5px;color:#6b7886;line-height:1.5;}
.mask{position:fixed;inset:0;background:rgba(10,16,28,.5);display:none;z-index:40;align-items:flex-end;} .mask.show{display:flex;}
.sheet{background:#fff;border-radius:20px 20px 0 0;padding:20px 18px 24px;width:100%;max-width:520px;margin:0 auto;animation:up .25s ease;}
@keyframes up{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}
.sheet h3{margin:0 0 4px;font-size:17px;} .sheet .sub{font-size:12.5px;color:#8a98a8;margin-bottom:14px;}
.plan{display:flex;align-items:center;justify-content:space-between;border:1.5px solid #e6ebf3;border-radius:14px;padding:12px 14px;margin-bottom:10px;cursor:pointer;}
.plan.sel{border-color:#4F6DF5;background:#f4f7ff;} .plan .pn{font-weight:700;font-size:14px;} .plan .pd{font-size:12px;color:#8a98a8;margin-top:2px;}
.plan .pp{font-weight:800;font-size:16px;color:#4F6DF5;white-space:nowrap;} .pay-confirm{margin-top:6px;}
.sim-note{font-size:11px;color:#aab4c0;text-align:center;margin-top:10px;}
.toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(20px);background:#22303a;color:#fff;padding:10px 18px;border-radius:999px;font-size:13px;opacity:0;pointer-events:none;transition:.25s;z-index:60;max-width:90%;text-align:center;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
/* ---------- 互动玩牌 ---------- */
.play-hero{background:linear-gradient(135deg,#4F6DF5,#8FA6FF);color:#fff;border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(79,109,245,.25);}
.play-hero h1{margin:0 0 4px;font-size:20px;} .play-hero p{margin:0;font-size:13px;opacity:.92;line-height:1.6;}
.play-tabs{display:flex;gap:8px;margin:14px 0;}
.ptab{flex:1;border:none;border-radius:12px;padding:10px 4px;font-size:13px;font-weight:700;background:#eef2ff;color:#4F6DF5;cursor:pointer;}
.ptab.sel{background:#4F6DF5;color:#fff;}
.draw-card{background:#fff;border-radius:18px;padding:20px;text-align:center;box-shadow:0 6px 18px rgba(30,50,80,.08);}
.draw-card .d-cat{width:150px;height:150px;object-fit:contain;margin:0 auto;display:block;}
.draw-card .d-name{font-size:20px;font-weight:800;margin-top:6px;} .draw-card .d-name span{font-weight:500;color:#8a98a8;}
.draw-card .d-code{display:inline-block;margin:8px auto 0;background:var(--c);color:#fff;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700;}
.draw-prompt{font-size:14px;line-height:1.7;color:#3c4853;margin:14px 4px 0;}
.draw-btns{display:flex;gap:10px;margin-top:16px;} .draw-btns .btn{flex:1;}
.mem-info{font-size:13px;color:#6b7886;margin-bottom:10px;} .mem-info b{color:#4F6DF5;}
.mem-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
.mem-tile{border:1.5px solid #e6ebf3;background:#f4f7ff;border-radius:12px;height:60px;font-size:13px;font-weight:700;color:#4F6DF5;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;transition:.15s;}
.mem-tile.open{background:#fff;border-color:var(--c);color:var(--c);box-shadow:0 3px 10px rgba(30,50,80,.08);}
.quiz-card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 6px 18px rgba(30,50,80,.08);}
.quiz-prog{font-size:12px;color:#8a98a8;margin-bottom:8px;}
.quiz-q{font-size:15px;font-weight:700;line-height:1.6;color:#22303a;margin-bottom:14px;}
.quiz-opts{display:flex;flex-direction:column;gap:10px;}
.quiz-opt{border:1.5px solid #e6ebf3;background:#fff;border-radius:12px;padding:12px;font-size:14px;font-weight:600;color:#22303a;cursor:pointer;text-align:left;}
.quiz-opt.corr{border-color:#2bb673;background:#eafaf1;color:#1f9d57;}
.quiz-opt.wr{border-color:#E5484D;background:#fff1f0;color:#E5484D;}
.quiz-fb{margin-top:14px;border-radius:12px;padding:12px;font-size:14px;font-weight:700;}
.quiz-fb.ok{background:#eafaf1;color:#1f9d57;} .quiz-fb.no{background:#fff1f0;color:#E5484D;}
.quiz-fb p{font-weight:500;font-size:13px;line-height:1.6;margin:8px 0 0;}
.quiz-end{background:#fff;border-radius:18px;padding:30px;text-align:center;box-shadow:0 6px 18px rgba(30,50,80,.08);font-size:15px;line-height:1.7;}
/* 每日一抽：英文发音喇叭 */
.spk{border:1.5px solid #e6ebf3;background:#fff;border-radius:999px;width:26px;height:26px;line-height:1;font-size:13px;cursor:pointer;vertical-align:middle;margin-left:4px;color:#4F6DF5;}
.spk:active{transform:scale(.92);}
/* 铲屎官养成 · 移动端优先 */
.ct-card{background:#fff;border-radius:20px;padding:18px 16px;box-shadow:0 8px 24px rgba(30,50,80,.10);text-align:center;max-width:460px;margin:0 auto;}
.ct-top{font-size:14px;font-weight:800;color:#22303a;margin-bottom:6px;}
.ct-top b{color:#4F6DF5;}
.ct-cat{position:relative;width:140px;height:140px;margin:4px auto 4px;}
.ct-cat .ct-img{width:100%;height:100%;object-fit:contain;animation:catIdle 2.6s ease-in-out infinite;}
.ct-cat.react-good .ct-img{animation:catHappy .6s ease;}
.ct-cat.react-bad .ct-img{animation:catShake .5s ease;}
.ct-cat .ct-mood{position:absolute;right:0;bottom:4px;font-size:38px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.15));}
.ct-bubble{position:absolute;left:50%;top:-14px;transform:translateX(-50%);color:#fff;font-size:13px;font-weight:700;padding:6px 12px;border-radius:12px;white-space:nowrap;animation:pop .25s ease;box-shadow:0 4px 12px rgba(0,0,0,.2);}
.ct-bubble.good{background:#1f9d55;} .ct-bubble.good:after{content:"";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);border:6px solid transparent;border-top-color:#1f9d55;}
.ct-bubble.bad{background:#e5484d;} .ct-bubble.bad:after{border-top-color:#e5484d;}
.ct-stage{font-size:13.5px;color:#22303a;margin-top:2px;}
.ct-stage b{color:#4F6DF5;}
.ct-bar{height:10px;border-radius:999px;background:#eef2f7;overflow:hidden;margin:8px 2px 14px;}
.ct-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#9db4ff,#4F6DF5);transition:width .4s;}
.ct-sec-hd{font-size:14px;font-weight:800;color:#22303a;text-align:left;margin:6px 2px 8px;display:flex;align-items:center;gap:6px;}
.ct-sec{background:#f7f9fc;border-radius:16px;padding:12px;margin:10px 0;}
.ct-need{display:flex;align-items:center;gap:10px;text-align:left;background:#fff;border:1.5px solid #e6ebf3;border-radius:12px;padding:10px 12px;margin:7px 0;font-size:13.5px;font-weight:700;color:#3c4853;}
.ct-need-ic{font-size:20px;flex:none;}
.ct-need-st{margin-left:auto;flex:none;}
.ct-need.ok{border-color:#bfe9cd;background:#eafaf0;color:#1f7a45;}
.ct-sec-tip{font-size:12px;color:#8a98a8;text-align:left;line-height:1.5;margin:4px 2px 10px;}
.ct-sec-tip.ok{color:#1f9d55;font-weight:700;}
.ct-props{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}
.ct-prop{border:1.5px solid #e6ebf3;background:#fff;border-radius:14px;padding:12px 2px;cursor:pointer;font-size:26px;display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .15s;}
.ct-prop .ct-prop-nm{font-size:11px;color:#6b7886;font-weight:700;}
.ct-prop:active{transform:scale(.94);background:#eef2ff;border-color:#4F6DF5;}
.ct-prop.done{background:#eafaf0;border-color:#bfe9cd;opacity:.7;}
.ct-next{margin-top:12px;}
.ct-emo-task{margin:8px 0 4px;background:#fff6fb;border:1.5px solid #ffd7e8;border-radius:12px;padding:12px 12px 14px;}
.ct-emo-task-tx{font-size:14px;line-height:1.65;color:#7a3b57;margin-bottom:10px;text-align:left;}
.ct-emo-done{margin:8px 0 2px;color:#2e9e6b;font-weight:800;font-size:14px;text-align:left;}
.ct-bottom{margin-top:18px;}
.ct-bottom-lock{color:#9aa7bd;font-size:13px;text-align:center;background:#f3f6fb;border:1.5px dashed #d4deec;border-radius:12px;padding:12px;line-height:1.6;}
.ct-moodline{font-size:13px;color:#46535e;line-height:1.6;text-align:left;}
.ct-moodline b{font-weight:800;}
.ct-feel{display:block;margin-top:4px;color:#5b6b7a;font-size:12.5px;line-height:1.5;}
.ct-rank-title{font-size:14px;font-weight:800;color:#22303a;text-align:left;margin:14px 2px 8px;}
.ct-tier{text-align:left;background:#fff;border:1.5px solid #e6ebf3;border-radius:14px;padding:11px 13px;margin:9px 0;box-shadow:0 3px 10px rgba(30,50,80,.04);}
.ct-tier-hd{display:flex;align-items:center;gap:7px;font-size:14px;font-weight:800;color:#22303a;margin-bottom:6px;}
.ct-tier-hd .ct-rank{font-size:18px;}
.ct-tier-hd .ct-tag{margin-left:auto;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;background:#f0f3f8;color:#8a98a8;}
.ct-tier.bronze{border-color:#e7d3b3;} .ct-tier.bronze .ct-tag{background:#f6ecdd;color:#a9803f;}
.ct-tier.silver{border-color:#d9dee6;} .ct-tier.silver .ct-tag{background:#eef1f6;color:#7a8696;}
.ct-tier.gold{border-color:#f1d98a;}
.ct-tier.gold .ct-tag.free{background:#fff3cf;color:#a9801f;}
.ct-tier.gold .ct-tag.lock{background:#fff3cf;color:#a9801f;}
.ct-tier-bd{font-size:13px;line-height:1.6;color:#3c4853;}
.ct-tier.gold.lock{background:#fffdf5;}
.ct-tier-lk{color:#6b7886;font-size:12.5px;}
.ct-gold-acts{margin-top:10px;display:flex;flex-direction:column;gap:8px;}
.ct-reset{margin-top:16px;}
.ct-care-want .ct-need{margin:7px 0;}
.ct-tools .ct-sec-tip{margin:4px 2px 10px;}
.ct-emo-line{display:flex;align-items:center;gap:12px;text-align:left;background:#fff;border:1.5px solid #e6ebf3;border-radius:12px;padding:12px;margin:4px 0;color:#22303a;}
.ct-emo-ic{font-size:34px;flex:none;line-height:1;}
.ct-emo-line b{font-size:15px;}
.ct-task-hd{font-size:12.5px;color:#8a98a8;text-align:left;margin:12px 2px 6px;font-weight:700;}
.ct-emotion .ct-need{margin:7px 0;}
.ct-task-prog{font-size:13px;color:#46535e;text-align:left;margin:8px 2px 2px;font-weight:700;}
.ct-task-prog b{color:#4F6DF5;font-size:15px;}
.ct-mood-insight{font-size:13.5px;line-height:1.7;color:#3c4853;text-align:left;background:#fff;border:1.5px solid #e6ebf3;border-left:4px solid #4F6DF5;border-radius:12px;padding:12px 14px;}
.ct-cat.ct-comfort{box-shadow:0 0 0 4px #bfe9cd,0 10px 26px rgba(31,157,85,.20);border-radius:22px;animation:catHappy .6s ease;}
.qpw{font-size:13px;color:#6b7886;margin:10px 0 2px;line-height:1.6;}
.deck-list{display:flex;flex-direction:column;gap:8px;}
.deck{display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:10px 12px;box-shadow:0 3px 10px rgba(30,50,80,.05);}
.deck.live{border:1.5px solid #4F6DF5;}
.deck-ic{font-size:22px;flex:none;}
.deck-t{flex:1;min-width:0;} .deck-t b{display:block;font-size:14px;} .deck-t span{font-size:12px;color:#6b7886;line-height:1.4;}
.deck-tag{font-size:11px;font-weight:700;color:#8a98a8;background:#f0f3f8;border-radius:999px;padding:3px 9px;flex:none;flex-shrink:0;white-space:nowrap;}
.deck.live .deck-tag{color:#4F6DF5;background:#eef2ff;}
/* 情境断案 · 关卡选择 */
.quiz-lvtip{font-size:13px;color:#6b7886;background:#eef2ff;border-radius:12px;padding:10px 12px;margin-bottom:12px;line-height:1.6;}
.gk-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
.gk{background:#fff;border:1.5px solid #e6ebf3;border-radius:14px;padding:12px;cursor:pointer;transition:transform .15s,box-shadow .15s;}
.gk:active{transform:scale(.97);}
.gk.on{border-color:#2bb673;background:#f3fcf6;}
.gk.buy{border-color:#FFB23E;}
.gk-n{font-size:14px;font-weight:800;color:#22303a;}
.gk-m{font-size:12px;color:#8a98a8;margin-top:4px;}
.gk-free{color:#1f9d57;font-weight:700;}
.gk-buy{color:#E08A00;font-weight:700;}
.gk-lock{color:#b06a00;font-weight:700;}
.quiz-foot{font-size:11.5px;color:#aab4c0;text-align:center;margin-top:14px;line-height:1.6;}
.lv-bundle{display:flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fff6e6,#ffeccd);border:1.5px dashed #FFB23E;border-radius:14px;padding:12px 14px;margin-bottom:14px;cursor:pointer;font-size:13px;color:#7a5410;}
.lv-bundle b{font-size:14px;color:#5c3d00;}
.lv-bundle small{color:#a07a2a;}
.lv-bundle:active{transform:scale(.99);}
.lv-bundle.on{background:#f3fcf6;border-color:#2bb673;border-style:solid;color:#1f9d55;cursor:default;}
.lv-bundle.on b,.lv-bundle.on small{color:#1f9d55;}
.lvb-price{margin-left:auto;font-weight:800;color:#E08A00;white-space:nowrap;}
.lvb-state{margin-left:auto;font-weight:700;white-space:nowrap;}
`;

const parentJS = `
const $=s=>document.querySelector(s);
const LS={g(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},s(k,v){localStorage.setItem(k,JSON.stringify(v));}};
const ST={free:()=>LS.g('pa_free',false),member:()=>LS.g('pa_member',false),bought:()=>LS.g('pa_bought',[]),freeCard:()=>LS.g('pa_free_card',null)};
function unlocked(id){return PA_FREE_ALL||ST.member()||ST.bought().includes(id)||ST.freeCard()===id;}
function byId(id){return PA_CARDS.find(c=>c.id===id);}
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400);}
const PARAMS=new URLSearchParams(location.search);
let deepCard=null; const qc0=PARAMS.get('card'); if(qc0&&byId(qc0))deepCard=qc0;
function nav(v,id){location.hash=(v==='detail'?'c/':'')+(id||v);}
function route(){
  if(deepCard){const id=deepCard;deepCard=null;return showDetail(id,true);}
  const h=location.hash.replace(/^#/,'');
  if(h.startsWith('c/'))return showDetail(h.slice(2));
  if(h==='vip')return showVip();
  if(h==='play')return showPlay();
  return showHome();
}
function showHome(){
  const g=PA_CARDS.map(c=>'<div class="gc" data-id="'+c.id+'" onclick="nav(\\'detail\\',this.dataset.id)">'+
    '<img src="'+c.img+'" alt="'+c.name+'"><div class="gn">'+c.name+'</div><div class="gc2">'+c.en+'</div>'+
    '<span class="gcode" style="background:'+c.color+'">'+c.code+'</span></div>').join('');
  const gift=PA_FREE_ALL?'':(ST.free()
    ? '<button class="btn btn-ghost btn-block" style="margin-top:14px" onclick="nav(\\'vip\\')">🎁 免费条已用完 · 开通会员看全部 17 个脑区</button>'
    : '<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="freeGift()">🎁 免费看 1 条专属应对方案（手把手教你接住孩子）</button>');
  const badge=PA_FREE_ALL?'体验版 · 17 个脑区应对方案全部免费开放':'新用户扫码 / 点下方按钮，免费看 1 条应对方案';
  $('#body').innerHTML='<div class="hero"><h1>读懂青春期的大脑</h1><p>17 个脑区，一只叫「'+MASCOT.cn+'」('+MASCOT.en+')的猫一个情绪。先看孩子怎么了，再学怎么接住他。</p>'+
    '<span class="badge-free">'+badge+'</span></div>'+
    gift+
    '<div class="block" style="margin-top:14px;cursor:pointer" onclick="nav(\\'play\\')"><h3>🎴 互动玩牌 <span style="font-weight:500;color:#8a98a8;font-size:12px">家长孩子都能玩</span></h3><p style="margin:0;color:#6b7886;font-size:13px">每日一抽读懂情绪 · 情境断案练眼力 · 铲屎官养猫养成。把一副卡变成亲子游戏。</p></div>'+
    '<div class="sec-title">全部脑区 <small>点开看「错误 vs 正确看待」+ 应对方案</small></div><div class="grid">'+g+'</div>'+
    '<a class="block more-apps" href="links.html" style="margin-top:16px;text-decoration:none;color:inherit;display:block">'+
      '<h3>🔗 更多小程序 <span style="font-weight:500;color:#8a98a8;font-size:12px">陈宋菲英语培训等入口都在这里</span></h3>'+
      '<p style="margin:0;color:#6b7886;font-size:13px">一页直达你所有的学习与育儿小程序，含陈宋菲英语培训（链接待补充）。</p></a>';
}
function showDetail(id){
  const c=byId(id); if(!c)return showHome();
  window.DETAIL_ID=id;
  document.documentElement.style.setProperty('--c',c.color);
  document.documentElement.style.setProperty('--c2',c.color2);
  const open=unlocked(id);
  const copeHtml=open
    ? '<ol class="cop-list">'+c.coping.map(t=>'<li>'+t+'</li>').join('')+'</ol>'
    : '<div class="lockbox"><div class="lk-ic">🔒</div><p>'+(ST.free()?'本条应对方案需开通会员或单条购买':'免费看 1 条专属应对方案，手把手教你接住孩子')+'</p>'+
      '<button class="btn btn-primary btn-block" onclick="tryUnlock(DETAIL_ID)">'+(ST.free()?'开通会员 / 单条购买':'免费看 1 条应对方案')+'</button></div>';
  const vipBar=(PA_FREE_ALL||ST.member())?'':'<div class="open-vip"><div><b>开通会员 ¥68/年</b><span>解锁全部 17 个脑区应对方案</span></div><button onclick="showVip()">去开通</button></div>';
  $('#body').innerHTML='<div class="d-hero" style="--c:'+c.color+';--c2:'+c.color2+'">'+
      '<button class="d-back" onclick="back()">‹</button>'+
      '<div class="d-tag">📖 家长手册</div>'+
      '<img class="d-cat" src="'+c.img+'" alt="'+c.name+'">'+
      '<div class="d-name">'+c.name+' <span style="font-size:12px;opacity:.9">'+c.en+'</span></div>'+
      '<span class="d-code">'+c.code+'</span>'+
      '<div class="d-region"><i></i>位于：'+c.region+'</div>'+
      '<p class="d-func">'+c.function+'</p></div>'+
    '<div class="block wrong"><h3><span class="mk">✕</span>家长容易这样误解</h3><p>'+c.wrongView+'</p></div>'+
    '<div class="block right"><h3><span class="mk">✓</span>正确看待</h3><p>'+c.parentView+'</p></div>'+
    '<div class="block coping '+(open?'':'locked')+'" id="coping"><h3>🛠 免费应对方式</h3>'+copeHtml+'</div>'+
    vipBar;
  window.scrollTo(0,0);
  if(PARAMS.get('coping')){const el=document.getElementById('coping');if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),60);}
}
function back(){location.hash='home';}
function tryUnlock(id){
  if(unlocked(id))return showDetail(id);
  if(!ST.free()){LS.s('pa_free',true);LS.s('pa_free_card',id);toast('已免费解锁 1 条应对方案 · 后续可开通会员或单条购买');return showDetail(id);}
  openPay(id);
}
// 首页「免费看 1 条」：随机抽一张并解锁其应对方案（每条设备仅 1 次）
function freeGift(){
  if(ST.free()){toast('免费条已用完，开通会员看全部 17 个脑区');return showVip();}
  const c=PA_CARDS[Math.floor(Math.random()*PA_CARDS.length)];
  LS.s('pa_free',true);LS.s('pa_free_card',c.id);
  toast('已免费解锁「'+c.name+'」应对方案');
  nav('detail',c.id);
}

/* ===================== 互动玩牌 ===================== */
function showPlay(){
  $('#body').innerHTML='<div class="play-hero"><h1>🎴 互动玩牌</h1><p>家长和孩子都能玩：每日一抽读懂情绪 · 情境断案练眼力 · 铲屎官养猫养成。</p></div>'+
    '<div class="play-tabs">'+
      '<button class="ptab sel" data-m="draw" onclick="playMode(\\'draw\\')">🎴 每日一抽</button>'+
      '<button class="ptab" data-m="quiz" onclick="playMode(\\'quiz\\')">🕵️ 情境断案</button>'+
      '<button class="ptab" data-m="cat" onclick="playMode(\\'cat\\')">🐱 铲屎官</button>'+
    '</div><div id="playArea"></div>';
  playMode('draw');
}
function playMode(m){
  document.querySelectorAll('.ptab').forEach(b=>b.classList.toggle('sel',b.dataset.m===m));
  const a=$('#playArea');
  if(m==='draw')return drawInit(a);
  if(m==='quiz')return quizInit(a);
  if(m==='cat')return catKeeperInit(a);
}
/* 模式1：每日一抽（抽一张脑卡 + 反思提示） */
function drawInit(a){
  const c=PA_CARDS[Math.floor(Math.random()*PA_CARDS.length)];
  window.DRAW=c;
  const prompt='当孩子「'+(c.puberty[0]||'情绪起伏')+'」时，往往是「'+c.name+'」在悄悄主导。今天，你捕捉到这一幕了吗？';
  a.innerHTML='<div class="draw-card" style="--c:'+c.color+';--c2:'+c.color2+'">'+
    '<img class="d-cat" src="'+c.img+'" alt="'+c.name+'">'+
    '<div class="d-name">'+c.name+' <span>'+c.en+'</span><button class="spk" onclick="speakEn(DRAW.en)" title="听发音">🔊</button></div>'+
    '<span class="d-code">'+c.code+'</span>'+
    '<p class="draw-prompt">'+prompt+'</p>'+
    '<div class="draw-btns"><button class="btn btn-primary" onclick="playMode(\\'draw\\')">🔄 再抽一张</button>'+
    '<button class="btn btn-ghost" onclick="nav(\\'detail\\',DRAW.id)">📖 看家长手册</button></div>'+
    '</div>';
}
let _au=null, _fell=false;
function speakEn(t){
  if(!t)return;
  // 主方案：有道词典远程真人发音（国内/微信 webview 可用，直接返回清晰 MP3，无需密钥）
  // 这正是陈宋菲英语培训项目使用的清晰读音方案——干净单声道人声，无回声
  const url="https://dict.youdao.com/dictvoice?audio="+encodeURIComponent(t)+"&type=2";
  try{
    _fell=false;
    if(_au){try{_au.pause();}catch(e){}}
    _au=new Audio(url);
    _au.preload="auto";
    // 防重入：onerror 与 play().catch 只会触发一次兜底，避免「有道 + 兜底」叠播产生回声
    _au.onerror=function(){ if(!_fell){_fell=true; synthSpeak(t);} };
    const p=_au.play();
    if(p&&p.catch)p.catch(function(){ if(!_fell){_fell=true; synthSpeak(t);} });
    if(typeof toast==="function")toast("🔊 "+t);
  }catch(e){ synthSpeak(t); }
}
function synthSpeak(t){
  try{
    if(!('speechSynthesis' in window)){toast('当前设备暂不支持语音（请换手机自带浏览器）');return;}
    const synth=window.speechSynthesis;
    synth.cancel();
    const u=new SpeechSynthesisUtterance(t);
    u.lang='en-US'; u.rate=0.85; u.pitch=1.05; u.volume=1;
    const vs=synth.getVoices();
    const en=vs.find(v=>/^en[-_]US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang));
    if(en)u.voice=en;
    synth.speak(u);
  }catch(e){toast('发音功能暂不可用');}
}
/* 模式2：铲屎官（养猫养成 —— 作为第三个游戏，使用者是小猫的养育人） */
const CAT_MOOD={
  pfc:{emoji:'😣',feeling:'知道该做却做不到',child:'明明说好先写作业，转头就抱着手机到半夜，事后又后悔'},
  parietal:{emoji:'😵',feeling:'分不清方向、手忙脚乱',child:'收拾书包丢三落四、走路撞门框，不是笨是空间感觉还在校准'},
  temporal:{emoji:'😕',feeling:'听不真切、认错人',child:'上课听讲漏半句、叫名字反应慢半拍'},
  occipital:{emoji:'😵‍💫',feeling:'看花了眼、注意力飘',child:'读书跳行跳字、看题总看漏条件'},
  hippocampus:{emoji:'🤔',feeling:'忘性大、记不住',child:'背单词转天忘、讲过的道理过耳就散'},
  amygdala:{emoji:'😡',feeling:'一点就着、容易炸',child:'写作业被催时突然炸毛、一句重话就摔门'},
  thalamus:{emoji:'😶',feeling:'信息塞车、反应慢',child:'跟你说话像没听见、喊好几遍才回神'},
  hypothalamus:{emoji:'😤',feeling:'饿怒、脾气随激素坐过山车',child:'饭点没到就发火、睡不够就全线崩溃'},
  brainstem:{emoji:'😴',feeling:'没精神、只想睡',child:'熬夜后第二天像断了电、起不来床'},
  cerebellum:{emoji:'🤸',feeling:'笨手笨脚、动作不协调',child:'骑车总摔、字写得像在跳舞'},
  nacc:{emoji:'🤩',feeling:'上头、只爱即时那点爽',child:'打游戏停不下来、学习要给奖励才肯动'},
  broca:{emoji:'😬',feeling:'话到嘴边说不出',child:'被问急了解释不清、一急就回一句「你不懂」'},
  wernicke:{emoji:'😖',feeling:'听不懂、总把劝告听成批评',child:'你把道理讲三遍，他听成「又在骂我」'},
  insula:{emoji:'😣',feeling:'浑身不得劲、莫名烦躁',child:'没病却喊累喊痛、情绪低落说不清原因'},
  basalganglia:{emoji:'🔁',feeling:'钻进老套路出不来',child:'一遇压力就躲手机、坏习惯越重复越牢'},
  cingulate:{emoji:'😖',feeling:'纠结内耗、卡在进退间',child:'选科选怕了、做决定前先 emo 半天'},
  caudate:{emoji:'🥁',feeling:'套路固化、一根筋',child:'刷题只会老办法、换个题型就卡壳'}
};
/* 心情（设计者视角）：把「情绪」翻译成家长能用的养育提醒——不是孩子故意，是某脑区还在长大 */
const CAT_MOOD_TIP={
  pfc:'不是懒，是负责「刹车」的前额叶还在施工期——别跟他比自控力，把大目标拆成小步骤，用清单帮他外包「自律」。',
  parietal:'不是马虎，是处理空间位置的感觉皮层还在校准——多示范、给余地，别急着贴「粗心」。',
  temporal:'不是故意不听，是听觉加记忆的颞叶还没长利索——重要的事写下来、放慢讲，确认他真听进去了。',
  occipital:'不是眼睛长哪儿了，是视觉处理皮层还在成熟——教他圈关键词、分段读，别只会骂粗心。',
  hippocampus:'不是记性差，是记忆的「存档」海马体还在扩容——用间隔复习加联想，帮他把东西存牢。',
  amygdala:'不是故意气你，是警报器杏仁核太灵敏——冲突时先暂停，等双方冷静再谈，比当场硬压有效。',
  thalamus:'不是装没听见，是信息中转站丘脑在「塞车」——走近看着他说，给他反应时间。',
  hypothalamus:'不是脾气差，是管饥饿睡眠的下丘脑在坐过山车——先补吃喝睡，再谈事。',
  brainstem:'不是懒，是管觉醒的脑干被熬夜掏空了——守住睡眠节律，先养精神再讲别的。',
  cerebellum:'不是笨手笨脚，是练协调的小脑还在打磨——给足练习和耐心，夸进步不笑失误。',
  nacc:'不是没毅力，是奖赏中枢太馋「即时爽」——把大事拆小、及时给具体正反馈，比一刀切没收手机管用。',
  broca:'不是顶嘴，是管「说出口」的布洛卡区被紧张卡住了——给他说话的时间和空间，先听再问。',
  wernicke:'不是左耳进右耳出，是理解语言的韦尼克区会错意——换种说法，确认他真听懂了。',
  insula:'不是装病，是感知身体的岛叶在报警——认真对待他的累和痛，先安抚再一起找原因。',
  basalganglia:'不是改不了，是管习惯的基底节还在塑形期——用正确示范加足量重复，把好习惯固化。',
  cingulate:'不是磨叽，是管决策冲突的扣带回在内耗——帮他把选项摊开，一小步一小步试。',
  caudate:'不是一根筋，是管程序化学习的尾状核在固化——带他练多种解法，把好套路练活。'
};
/* 情绪应对选择题：a=家长常做的(易错) b=有点脑子的家长 c=智慧家长(正确) */
const CAT_QUIZ={
  pfc:{a:'催他、骂他懒、贴上「不自律」的标签',b:'忍着不骂，但也没帮他想办法',c:'把大目标拆成小步骤，用清单和提醒帮孩子外包「自控力」'},
  parietal:{a:'说他笨手笨脚、做事不用心',b:'干脆替他把所有事都包办了',c:'理解空间感还在发育，多给示范和余地，别急着贴「马虎」'},
  temporal:{a:'以为他故意不听、再讲一遍就火大',b:'提高音量、凑到耳边重复讲',c:'放慢语速、重要的事写下来，确认他真听进去了'},
  occipital:{a:'说他粗心、眼睛长哪儿了',b:'让他再多看几遍自己找',c:'理解视觉处理还在成熟，教他圈关键词、分段读'},
  hippocampus:{a:'骂他记性差、讲过的都白讲',b:'让他抄十遍加深印象',c:'理解记忆还在长，用间隔复习和联想帮他把记忆存牢'},
  amygdala:{a:'以更大的火气压他、当场讲大道理',b:'不理他、等他自己过去',c:'冲突时先按下暂停键，等双方冷静再谈，用「我注意到」代替指责'},
  thalamus:{a:'以为他故意不理人、连喊带骂',b:'站到他面前大声重复',c:'理解信息中转还在磨合，走近看着他说，给他反应时间'},
  hypothalamus:{a:'怪他脾气差、太矫情',b:'让他「忍一忍就过去了」',c:'照顾他的吃喝睡节律，饿或困时先补生理再谈事'},
  brainstem:{a:'骂他懒、不起床是态度问题',b:'硬拽起来、取消所有娱乐',c:'守住睡眠节律，先养足精神再谈别的'},
  cerebellum:{a:'笑他笨手笨脚、动作不协调',b:'替他做完、不让他练',c:'理解协调还在练，给足练习和耐心，夸进步不笑失误'},
  nacc:{a:'一刀切没收手机、全靠意志力',b:'用更多奖励哄着学',c:'理解奖励系统敏感，帮他把大事拆小、及时给具体正反馈'},
  broca:{a:'抢话、替他把话说完、嫌他结巴',b:'让他「想清楚再说」',c:'给他说话的时间和空间，先听再问，不催不替'},
  wernicke:{a:'以为他顶嘴、把劝告听成批评就回怼',b:'把话讲更大声更狠',c:'理解他听进了但会错意，换种说法确认他真听懂了'},
  insula:{a:'说他装病、没事找事',b:'让他「别想那么多」',c:'认真对待他的身体感受，先安抚再一起找原因'},
  basalganglia:{a:'急着纠错、一错就打断重来',b:'随他去、反正改不了',c:'抓住可塑期，用正确示范加足量重复把好习惯固化'},
  cingulate:{a:'催他快决定、别磨叽',b:'替他做决定',c:'接纳他的纠结，帮他把选项摊开、一小步一小步试'},
  caudate:{a:'说他一根筋、不会变通',b:'直接给标准答案让他背',c:'理解序列在固化，带他练多种解法、把好套路练活'}
};
const CAT_ACTIONS=[
  {key:'food',  need:'肚子咕咕叫，想吃点小鱼干', tool:'🐟', toolName:'小鱼干', act:'eat',   happy:'我饱了 😋'},
  {key:'water', need:'口渴，想喝香香奶瓶',       tool:'🍼', toolName:'奶瓶',   act:'drink', happy:'润润嗓子 💧'},
  {key:'play',  need:'有点无聊，想玩逗猫棒',     tool:'🪀', toolName:'逗猫棒', act:'play',  happy:'好开心 😺'},
  {key:'brush', need:'毛乱糟糟，想梳梳毛',       tool:'🪮', toolName:'梳子',   act:'groom', happy:'毛好顺滑～ 😌'},
  {key:'wipe',  need:'脸脏脏，想擦擦脸',         tool:'🧽', toolName:'洗脸巾', act:'wipe',  happy:'脸干净啦 ✨'},
  {key:'nails', need:'指甲长了，想剪指甲',       tool:'✂️', toolName:'指甲剪', act:'clip',  happy:'指甲好短 ✂️'}
];
const CAT_ORDER=['food','water','play','brush','wipe','nails'];
const GOLD_PRICE=9.9; // 单条「黄金家长」方案解锁价
let catState=null, catFx=null;
function catLoad(){
  try{catState=JSON.parse(localStorage.getItem('pa_cat'))||null;}catch(e){catState=null;}
  if(!catState)catState={};
  const d={day:1,pct:0,cardId:'',careNeeds:[],careDone:{},emotionDone:[],dayDone:false};
  catState=Object.assign(d,catState);
  if(!catState.cardId || !Array.isArray(catState.careNeeds) || !catState.careNeeds.length)catGen();
  if(typeof catState.careDone!=='object'||!catState.careDone)catState.careDone={};
  return catState;
}
function catCard(){ return byId(catState.cardId)||PA_CARDS[0]; }
function catGen(){
  const c=PA_CARDS[Math.floor(Math.random()*PA_CARDS.length)];
  catState.cardId=c.id;
  const pool=CAT_ORDER.slice();
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  const n=2;
  catState.careNeeds=pool.slice(0,n);
  catState.careDone={}; catState.emotionDone=[]; catState.dayDone=false; catSave();
}
function catSave(){try{localStorage.setItem('pa_cat',JSON.stringify(catState));}catch(e){}}
function catGoldUnlocked(){ return ST.member() || LS.g('pa_gold',[]).includes(catState.cardId); }
function catKeeperInit(a){catLoad();renderCat(a);}
function renderCat(a){
  const s=catState, c=catCard();
  const mood=CAT_MOOD[c.id]||{emoji:'😺',feeling:c.name,child:''};
  const tip=CAT_MOOD_TIP[c.id]||'这不是孩子故意气你，是某个脑区还在长大。先接住情绪，再谈事情。';
  const q=CAT_QUIZ[c.id]||{a:'',b:'',c:''};
  const careAll=s.careNeeds.every(function(k){return s.careDone[k];});
  const doneCount=s.careNeeds.filter(function(k){return s.careDone[k];}).length;
  // 情绪应对任务（照顾之外，点完成，每次只展示一项）
  const copingList=c.coping||[];
  const emoDone=s.emotionDone||[];
  const emoAll=emoDone.length>=copingList.length;
  const curEmoIdx=copingList.findIndex(function(_,i){return emoDone.indexOf(i)<0;});
  let emoHtml;
  if(emoAll){
    emoHtml='<div class="ct-emo-done">✅ 情绪应对完成，你稳稳接住了想开～</div>';
  }else{
    const t=copingList[curEmoIdx];
    emoHtml='<div class="ct-emo-task"><div class="ct-emo-task-tx">'+t+'</div>'+
      '<button class="btn btn-primary btn-block" onclick="catEmotionDone('+curEmoIdx+')">✓ 我完成了这项</button></div>';
  }
  const emoProg='<div class="ct-task-prog">情绪应对 已完成 <b>'+emoDone.length+'</b> / '+copingList.length+'</div>';
  const allDone=careAll && emoAll;
  const needsHtml=s.careNeeds.map(function(k){
    const nd=CAT_ACTIONS.find(function(x){return x.key===k;});
    const ok=!!s.careDone[k];
    return '<div class="ct-need '+(ok?'ok':'')+'"><span class="ct-need-ic">'+nd.tool+'</span><span>'+nd.need+'</span><span class="ct-need-st">'+(ok?'✅':'⭕')+'</span></div>';
  }).join('');
  const tray=CAT_ORDER.map(function(k){
    const nd=CAT_ACTIONS.find(function(x){return x.key===k;});
    const done=!!s.careDone[k];
    return '<button class="ct-prop'+(done?' done':'')+'" data-k="'+k+'" onclick="catUse(this.dataset.k)"><span class="ct-prop-ic">'+nd.tool+'</span><span class="ct-prop-nm">'+nd.toolName+'</span></button>';
  }).join('');
  const goldOn=catGoldUnlocked();
  let goldBlock;
  if(goldOn){
    goldBlock='<div class="ct-tier gold on"><div class="ct-tier-hd"><span class="ct-rank">🥇</span><b>黄金家长</b><span class="ct-tag free">已解锁</span></div><div class="ct-tier-bd">'+q.c+'</div></div>';
  }else{
    goldBlock='<div class="ct-tier gold lock"><div class="ct-tier-hd"><span class="ct-rank">🥇</span><b>黄金家长</b><span class="ct-tag lock">🔒 付费</span></div>'+
      '<div class="ct-tier-bd ct-tier-lk">智慧家长的「接住孩子」做法，付费解锁，或开通会员免费看全部 👇'+
      '<div class="ct-gold-acts">'+
      '<button class="btn btn-primary btn-block" onclick="catGoldUnlock()">🔓 解锁黄金家长方案 ¥'+GOLD_PRICE+'</button>'+
      '<button class="btn btn-ghost btn-block" onclick="openPayMember()">开通会员 ¥68/年（看全部黄金方案）</button>'+
      '</div></div></div>';
  }
  // 4. 猫猫情绪：图片里的情绪 + 情绪应对任务（每次一项）。照顾任务已在上方「照顾需求/工具」区展示，此处不再重复
  const emotionSec='<div class="ct-sec ct-emotion">'+
    '<div class="ct-sec-hd">😺 猫猫今天的情绪</div>'+
    '<div class="ct-emo-line"><span class="ct-emo-ic">'+mood.emoji+'</span><div><b>'+mood.feeling+'</b>'+
      (mood.child?'<span class="ct-feel">——就像你家孩子'+mood.child+'</span>':'')+'</div></div>'+
    '<div class="ct-task-hd">💗 情绪应对（点完成，每次一项）</div>'+
    emoHtml+emoProg+
    '</div>';
  // 5. 心情：设计者特别指出的提醒
  const moodTipSec='<div class="ct-sec ct-moodtip">'+
    '<div class="ct-sec-hd">💡 心情 · 给铲屎官的一句话</div>'+
    '<div class="ct-mood-insight">'+tip+'</div>'+
    '</div>';
  // 6. 段位榜（放最后）
  const rankSec='<div class="ct-sec ct-moodsec">'+
    '<div class="ct-rank-title">🏆 铲屎官段位榜</div>'+
    '<div class="ct-tier bronze"><div class="ct-tier-hd"><span class="ct-rank">🥉</span><b>青铜家长</b><span class="ct-tag">常踩坑</span></div><div class="ct-tier-bd">'+q.a+'</div></div>'+
    '<div class="ct-tier silver"><div class="ct-tier-hd"><span class="ct-rank">🥈</span><b>白银家长</b><span class="ct-tag">有点脑子</span></div><div class="ct-tier-bd">'+q.b+'</div></div>'+
    goldBlock+
    '</div>';
  let fb='';
  if(catFx){ fb='<div class="ct-bubble '+(catFx.ok?'good':'bad')+'">'+catFx.msg+'</div>'; }
  const reactCls=catFx?(catFx.ok?'react-good':'react-bad'):'';
  const comfortCls=allDone?' ct-comfort':'';
  const bottomSec=allDone
    ? '<div class="ct-sec ct-bottom"><button class="btn btn-primary btn-block ct-next" onclick="catNextDay()">开启第 '+(s.day+1)+' 天 →</button></div>'
    : '<div class="ct-sec ct-bottom ct-bottom-lock">🐾 完成上方全部「照顾 + 情绪应对」任务，才能开启新的一天</div>';
  a.innerHTML='<div class="ct-card">'+
    '<div class="ct-top">🐱 铲屎官日常 · 第 <b>'+s.day+'</b> 天</div>'+
    // 1. 图片
    '<div class="ct-cat '+reactCls+comfortCls+'"><img class="ct-img" src="'+c.img+'" alt="'+c.name+'"><span class="ct-mood">'+(allDone?'😌':mood.emoji)+'</span>'+fb+'</div>'+
    '<div class="ct-stage">陪想开长大：<b>'+s.pct+'%</b>（每天 +1%，满级约 100 天）</div>'+
    '<div class="ct-bar"><i style="width:'+s.pct+'%"></i></div>'+
    // 2. 照顾需求
    '<div class="ct-sec ct-care-want"><div class="ct-sec-hd">🐾 今天想被照顾（'+s.careNeeds.length+'件事）</div>'+needsHtml+'</div>'+
    // 3. 工具
    '<div class="ct-sec ct-tools"><div class="ct-sec-hd">🧰 选工具照顾它</div>'+
      '<div class="ct-sec-tip">👇 点中它今天要的工具，它会很舒服😌；拿错它会皱眉哦</div>'+
      '<div class="ct-props">'+tray+'</div></div>'+
    // 4. 猫猫情绪
    emotionSec+
    // 5. 心情
    moodTipSec+
    // 6. 段位榜
    rankSec+
    '<button class="btn btn-ghost btn-block ct-reset" onclick="catReset()">🔄 重置成长</button>'+
    // 7. 开启下一天（页面最底部）
    bottomSec+
    '</div>';
}
function catUse(key){
  const s=catState, a=$('#playArea');
  const nd=CAT_ACTIONS.find(function(x){return x.key===key;});
  const isNeed=s.careNeeds.includes(key);
  if(isNeed && s.careDone[key]){ toast('它刚用过啦，今天这项照顾好啦~'); return; }
  catFx={ok:isNeed, msg:isNeed?nd.happy:'呜…现在不是要「'+nd.toolName+'」😣'};
  renderCat(a);
  if(isNeed){
    setTimeout(function(){ s.careDone[key]=true; catSave(); catFx=null; if(s.careNeeds.every(function(k){return s.careDone[k];}))toast('今日照顾全部完成 🎉'); renderCat(a); },1150);
  }else{
    setTimeout(function(){ catFx=null; renderCat(a); },900);
  }
}
function catGoldUnlock(){ openPayGold(catState.cardId); }
function catEmotionDone(idx){
  const s=catState, a=$('#playArea');
  if(!(s.emotionDone||[]).length)s.emotionDone=[];
  if(s.emotionDone.indexOf(idx)>=0)return;
  s.emotionDone.push(idx); catSave();
  toast('接住情绪 +1 💗');
  renderCat(a);
}
function catNextDay(){
  catState.day++;
  if(catState.pct<100)catState.pct++;
  catGen(); renderCat($('#playArea'));
  try{ window.scrollTo({top:0,behavior:'smooth'}); const pa=$('#playArea'); if(pa&&pa.scrollTo)pa.scrollTo(0,0); }catch(e){}
  toast('第 '+catState.day+' 天 · 想开成长 '+catState.pct+'% 🐾');
}
function catReset(){
  catState={day:1,pct:0,cardId:'',careNeeds:[],careDone:{},dayDone:false};
  catGen(); renderCat($('#playArea')); toast('已重置 · 想开回到第 1 天');
}
function openPayGold(cardId){
  pending={kind:'gold',plan:'gold',cardId:cardId,from:'cat'};
  renderPay(); $('#mask').classList.add('show');
}
/* 模式3：情境断案（判断主导脑区）—— 分初级/进阶/高级三档，每档10组×5题；初级第1组免费，每档一次性解锁全部题库 */
const QUIZ_LEVELS=window.QUIZ_LEVELS;
const LEVEL_PRICE=[19.9,29.9,39.9]; // 整档（10 组 / 50 题）一次性解锁价：初级19.9 · 进阶29.9 · 高级39.9
function quizPrice(L){ return LEVEL_PRICE[L]; }
function quizBundleOwned(L){ if(ST.member())return true; return LS.g('pa_quiz_bundle',[]).includes(L); }
function quizOwned(L,G){ if(L===0&&G===0)return true; if(ST.member())return true; if(quizBundleOwned(L))return true; return LS.g('pa_quiz_owned',[]).includes(L+'-'+G); }
function quizPrimaryBought(){ return ST.member() || quizBundleOwned(0) || LS.g('pa_quiz_owned',[]).some(k=>/^0-\\d+$/.test(k)&&k!=='0-0'); }
function quizCanBuyLevel(L){ return L===0 || quizPrimaryBought(); }
function quizTotalQ(L){ return QUIZ_LEVELS[L].groups.reduce((n,g)=>n+g.qs.length,0); }
let quizState=null, quizLevelCur=0;
function quizInit(a){ quizLevelCur=0; quizRenderSelect(a); }
function quizRenderSelect(a){
  const L=QUIZ_LEVELS[quizLevelCur];
  const tabs=QUIZ_LEVELS.map((lv,i)=>'<button class="ptab '+(i===quizLevelCur?'sel':'')+'" onclick="quizLevel('+i+')">'+lv.name+'</button>').join('');
  const groups=L.groups.map((g,gi)=>{
    const owned=quizOwned(quizLevelCur,gi), buyable=quizCanBuyLevel(quizLevelCur), free=(quizLevelCur===0&&gi===0);
    let tag,act,cls='gk';
    if(owned){ cls+=' on'; tag='<span class="gk-free">✅ 已解锁</span>'; act='onclick="quizStart('+quizLevelCur+','+gi+')"'; }
    else if(!buyable){ tag='<span class="gk-lock">🔒 先购初级</span>'; act='onclick="quizBuyLevelHint('+quizLevelCur+')"'; }
    else { cls+=' buy'; tag='<span class="gk-lock">🔒 未解锁</span>'; act='onclick="openPayBundle('+quizLevelCur+')"'; }
    return '<div class="'+cls+'" '+act+'><div class="gk-n">'+(gi+1)+'. '+g.name.replace(/^.*· /,'')+'</div><div class="gk-m">5 题 · '+tag+'</div></div>';
  }).join('');
  const bOwned=quizBundleOwned(quizLevelCur), bBuy=quizCanBuyLevel(quizLevelCur);
  let bCls='lv-bundle', bTag, bAct;
  if(bOwned){ bCls+=' on'; bTag='<span class="lvb-state">✅ 已解锁全部 '+L.groups.length+' 组</span>'; bAct=''; }
  else if(!bBuy){ bTag='<span class="lvb-state">🔒 先购买「初级」后可解锁</span>'; bAct='onclick="quizBuyLevelHint('+quizLevelCur+')"'; }
  else { bCls+=' buy'; bTag='<span class="lvb-price">¥'+quizPrice(quizLevelCur)+' 解锁全部</span>'; bAct='onclick="openPayBundle('+quizLevelCur+')"'; }
  const bundle='<div class="'+bCls+'" '+bAct+'>🎁 <b>解锁'+L.name+'全部题库</b><small>（'+L.groups.length+' 组 · 共 '+quizTotalQ(quizLevelCur)+' 题）</small>'+bTag+'</div>';
  a.innerHTML='<div class="play-tabs">'+tabs+'</div>'+
    '<div class="quiz-lvtip">📘 '+L.name+'：'+L.desc+(quizLevelCur===0?'（第 1 组免费体验）':'')+'</div>'+
    bundle+
    '<div class="gk-grid">'+groups+'</div>'+
    '<div class="quiz-foot">免费体验初级第 1 组 · 整档一次性 ¥'+quizPrice(quizLevelCur)+' 解锁全部 '+quizTotalQ(quizLevelCur)+' 题 · 会员 ¥68 畅玩全部 3 关 150 题</div>';
}
function quizLevel(i){ quizLevelCur=i; quizRenderSelect($('#playArea')); }
function quizRefresh(){ quizRenderSelect($('#playArea')); }
function quizBack(){ quizRenderSelect($('#playArea')); }
function quizBuyLevelHint(L){ toast('先购买「初级全部题库」，即可解锁'+QUIZ_LEVELS[L].name+'题库 🔓'); openPayBundle(0); }
function quizStart(L,G){ quizState={L:G===undefined?quizLevelCur:L,G:G===undefined?quizLevelCur:G,qi:0,right:0,answered:false}; if(quizState.G===undefined)quizState.G=0; quizRenderQ($('#playArea')); }
function shuffleArr(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function quizRenderQ(a){
  const s=quizState, g=QUIZ_LEVELS[s.L].groups[s.G], q=g.qs[s.qi];
  if(s.qi>=g.qs.length){ return quizRenderResult(a); }
  const order=shuffleArr([0,1,2,3]);      // 每题随机打乱 4 个选项的顺序
  const opts=order.map(i=>q.o[i]);
  s.ans=order.indexOf(q.a);              // 记录打乱后正确答案所在位置
  let html='<div class="quiz-card"><div class="quiz-prog">'+QUIZ_LEVELS[s.L].name+' · 第 '+(s.G+1)+' 组 · 第 '+(s.qi+1)+' / '+g.qs.length+' 题　|　本组答对 '+s.right+'</div><div class="quiz-q">'+q.q+'</div><div class="quiz-opts">';
  opts.forEach((t,idx)=>{html+='<button class="quiz-opt" data-idx="'+idx+'" onclick="quizAns('+idx+')">'+t+'</button>';});
  html+='</div><div id="quizFB"></div></div>';
  a.innerHTML=html;
}
function quizAns(idx){
  const s=quizState,g=QUIZ_LEVELS[s.L].groups[s.G],q=g.qs[s.qi]; if(s.answered)return; s.answered=true;
  const correct=idx===s.ans; if(correct)s.right++;
  $('#quizFB').innerHTML='<div class="quiz-fb '+(correct?'ok':'no')+'">'+(correct?'✅ 答对！':'❌ 正确答案：'+q.o[q.a])+'<p>'+q.why+'</p>'+
    '<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="quizNext()">下一题 →</button></div>';
  document.querySelectorAll('.quiz-opt').forEach(b=>{const i=+b.dataset.idx;b.disabled=true;if(i===s.ans)b.classList.add('corr');if(i===idx&&!correct)b.classList.add('wr');});
}
function quizNext(){ quizState.answered=false; quizState.qi++; quizRenderQ($('#playArea')); }
function quizRenderResult(a){
  const s=quizState, g=QUIZ_LEVELS[s.L].groups[s.G], tot=g.qs.length, pct=Math.round(s.right/tot*100);
  const nextG=s.G+1, hasNext=(nextG<QUIZ_LEVELS[s.L].groups.length), nextOwned=hasNext&&quizOwned(s.L,nextG);
  let nextBtn='';
  if(hasNext&&nextOwned){ nextBtn='<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="quizStart('+s.L+','+nextG+')">下一组 →</button>'; }
  else if(hasNext&&!nextOwned&&quizCanBuyLevel(s.L)){ nextBtn='<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openPayBundle('+s.L+')">🔓 解锁'+QUIZ_LEVELS[s.L].name+'全部题库（¥'+quizPrice(s.L)+'）</button>'; }
  else if(hasNext&&!nextOwned&&!quizCanBuyLevel(s.L)){ nextBtn='<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="quizBuyLevelHint('+s.L+')">先购买初级后可解锁</button>'; }
  a.innerHTML='<div class="quiz-card" style="text-align:center">'+
    '<div style="font-size:40px">'+(pct>=80?'🏆':pct>=60?'🎉':'💪')+'</div>'+
    '<div style="font-size:16px;font-weight:800;margin:6px 0">本组完成！</div>'+
    '<div style="font-size:14px;color:#6b7886">答对 <b style="color:#1f9d55">'+s.right+'</b> / '+tot+'（'+pct+'%）</div>'+
    '<div style="margin-top:14px">'+nextBtn+'</div>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="quizBack()">📑 返回选关</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="quizStart('+s.L+','+s.G+')">↺ 重做本组</button></div>';
}
function showVip(){
  $('#body').innerHTML='<div class="vip-hero"><h1>脑宇宙家长会员</h1><div class="price">¥68 <small>/ 年</small></div>'+
    '<p style="margin:8px 0 0;font-size:13px;opacity:.9">把整副牌的“可以这样做”装进口袋</p></div>'+
    '<div class="benefit"><div class="bi">🧠</div><div><b>全部 17 个脑区应对方案</b><span>每个脑区的错误/正确看待 + 具体话术与步骤</span></div></div>'+
    '<div class="benefit"><div class="bi">🧩</div><div><b>情景题库全 3 关 150 题</b><span>初级/进阶/高级，永久解锁，随时练</span></div></div>'+
    '<div class="benefit"><div class="bi">🆕</div><div><b>每月新增主题卡</b><span>考试焦虑、早恋、网瘾、二胎…持续更新</span></div></div>'+
    '<div class="benefit"><div class="bi">👨‍👩‍👧</div><div><b>亲子共玩指南</b><span>怎么用这副牌开启一次不尴尬的聊天</span></div></div>'+
    '<div class="sec-title" style="margin-top:22px">🆕 持续更新的主题牌库 <small>会员免费解锁全部</small></div>'+
    '<div class="deck-list">'+PA_DECKS.map(d=>'<div class="deck'+(d.status==='live'?' live':'')+'"><span class="deck-ic">'+d.icon+'</span><div class="deck-t"><b>'+d.name+'</b><span>'+d.desc+'</span></div><span class="deck-tag">'+(d.status==='live'?'已上线':'规划中')+'</span></div>').join('')+'</div>'+
    '<button class="btn btn-primary btn-block" style="margin-top:18px" onclick="openPayMember()">开通会员 ¥68/年</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="nav(\\'home\\')">返回首页</button>';
  window.scrollTo(0,0);
}
let pending={kind:null,plan:null,L:null,G:null,id:null,from:null};
function openPay(id){pending={kind:'coping',plan:'coping',id:id,from:'detail'};renderPay();$('#mask').classList.add('show');}
function openPayBundle(L){pending={kind:'bundle',plan:'bundle',L:L,from:'quiz'};renderPay();$('#mask').classList.add('show');}
function openPayMember(){pending={kind:'member',plan:'member',from:'vip'};renderPay();$('#mask').classList.add('show');}
function renderPay(){
  if(pending.kind==='member'){
    $('#sheet').innerHTML='<h3>开通脑宇宙家长会员</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+
      '<div class="plan sel"><div><div class="pn">脑宇宙家长会员</div><div class="pd">全部 17 脑区应对方案 + 3 关 150 题情景题库 · 一年</div></div><div class="pp">¥68/年</div></div>'+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥68（模拟）</button></div>'+
      '<div class="sim-note">会员一年内畅玩全部内容，平均一天不到 2 毛钱</div>';
    return;
  }
  if(pending.kind==='bundle'){
    const L=pending.L, lv=QUIZ_LEVELS[L].name, total=quizTotalQ(L);
    const single='<div class="plan '+(pending.plan==='bundle'?'sel':'')+'" onclick="selPlan(\\'bundle\\')"><div><div class="pn">解锁'+lv+'全部题库，共 '+total+' 题</div><div class="pd">'+QUIZ_LEVELS[L].groups.length+' 组情景题 · 一次性永久解锁</div></div><div class="pp">¥'+quizPrice(L)+'</div></div>';
    const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\\'member\\')"><div><div class="pn">开通会员</div><div class="pd">全部 3 关 150 题 + 17 脑区应对方案 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
    $('#sheet').innerHTML='<h3>解锁情景题库</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+single+member+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:quizPrice(L))+'（模拟）</button></div>'+
      '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>';
    return;
  }
  if(pending.kind==='gold'){
    const c=byId(pending.cardId);
    const gold='<div class="plan '+(pending.plan==='gold'?'sel':'')+'" onclick="selPlan(\\'gold\\')"><div><div class="pn">解锁「'+c.name+'」黄金家长方案</div><div class="pd">今日情绪专属 · 智慧家长接法 · 永久查看</div></div><div class="pp">¥'+GOLD_PRICE+'</div></div>';
    const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\\'member\\')"><div><div class="pn">开通会员</div><div class="pd">全部黄金家长方案 + 全部题库 + 17 脑区应对 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
    $('#sheet').innerHTML='<h3>解锁黄金家长段位</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+gold+member+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:GOLD_PRICE)+'（模拟）</button></div>'+
      '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>';
    return;
  }
  const single='<div class="plan '+(pending.plan==='coping'?'sel':'')+'" onclick="selPlan(\\'coping\\')"><div><div class="pn">单条购买</div><div class="pd">解锁「'+byId(pending.id).name+'」应对方案</div></div><div class="pp">¥6</div></div>';
  const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\\'member\\')"><div><div class="pn">开通会员</div><div class="pd">全部 17 个脑区 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
  $('#sheet').innerHTML='<h3>解锁应对方案</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+single+member+
    '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:6)+'（模拟）</button></div>'+
    '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>';
}
function selPlan(p){pending.plan=p;renderPay();}
function confirmPay(){
  $('#mask').classList.remove('show');
  if(pending.plan==='member'){ LS.s('pa_member',true); toast('支付成功（模拟）· 会员已开通'); return afterPay(); }
  if(pending.kind==='bundle'){ const o=LS.g('pa_quiz_bundle',[]); if(!o.includes(pending.L))o.push(pending.L); LS.s('pa_quiz_bundle',o); toast('支付成功（模拟）· 已解锁'+QUIZ_LEVELS[pending.L].name+'全部题库'); return afterPay(); }
  if(pending.kind==='gold'){ const o=LS.g('pa_gold',[]); if(!o.includes(pending.cardId))o.push(pending.cardId); LS.s('pa_gold',o); toast('支付成功（模拟）· 已解锁黄金家长方案'); return afterPay(); }
  if(pending.kind==='coping'){ const b=ST.bought(); if(pending.id&&!b.includes(pending.id))b.push(pending.id); LS.s('pa_bought',b); toast('支付成功（模拟）· 已解锁'); return showDetail(pending.id); }
}
function afterPay(){
  if(pending.from==='quiz')return quizRefresh();
  if(pending.from==='detail')return showDetail(pending.id);
  if(pending.from==='cat')return catKeeperInit($('#playArea'));
  return showVip();
}

window.addEventListener('hashchange',route);
window.nav=nav;window.showVip=showVip;window.tryUnlock=tryUnlock;window.freeGift=freeGift;window.back=back;
window.openPay=openPay;window.openPayBundle=openPayBundle;window.openPayMember=openPayMember;window.selPlan=selPlan;window.confirmPay=confirmPay;
window.showPlay=showPlay;window.playMode=playMode;window.speakEn=speakEn;
window.catKeeperInit=catKeeperInit;window.catUse=catUse;window.catEmotionDone=catEmotionDone;window.openPayGold=openPayGold;window.catGoldUnlock=catGoldUnlock;window.catNextDay=catNextDay;window.catReset=catReset;
window.quizLevel=quizLevel;window.quizStart=quizStart;window.quizAns=quizAns;window.quizNext=quizNext;window.quizBack=quizBack;window.quizRefresh=quizRefresh;window.quizBuyLevelHint=quizBuyLevelHint;
window.showPlay=showPlay;window.playMode=playMode;window.speakEn=speakEn;window.catKeeperInit=catKeeperInit;window.catUse=catUse;window.catEmotionDone=catEmotionDone;window.openPayGold=openPayGold;window.catGoldUnlock=catGoldUnlock;window.catNextDay=catNextDay;window.catReset=catReset;window.quizAns=quizAns;window.quizNext=quizNext;
route();
`;

const parentHTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>脑宇宙 · 家长小程序</title><style>${parentCSS}</style></head>
<body><div class="pa">
  <div class="pa-head" id="head">
    <div class="pa-logo">脑宇宙 · <b>家长小程序</b></div>
    <div class="pa-nav"><a onclick="nav('home')">首页</a><a onclick="nav('play')">玩牌</a><a onclick="nav('vip')">会员</a></div>
  </div>
  <div class="pa-body" id="body"></div>
</div>
<div class="mask" id="mask"><div class="sheet" id="sheet"></div></div>
<div class="toast" id="toast"></div>
<script>${parentDataJS}</script>
<script>const PA_FREE_ALL=${PA_FREE_ALL};${parentJS}</script>
</body></html>`;

fs.writeFileSync(path.join(PA_DIR, "index.html"), parentHTML);
console.log("✓ parent-app/index.html 生成");

/* ============================ 生成 实体样本（print） ============================ */
const printCSS = `
body{margin:0;background:#cfd8e3;}
.page{position:relative;width:210mm;height:297mm;margin:8mm auto;background:#fff;box-shadow:0 4px 20px rgba(0,0,0,.2);overflow:hidden;break-after:page;}
body>*:last-child{break-after:auto;}
@media print{
  body{background:#fff;}
  .page{margin:0;box-shadow:none;}
}
@page{size:A4;margin:0;}
.plate{position:absolute;}
.card-wrap{position:absolute;left:0;top:0;width:63mm;height:88mm;}
.cm{position:absolute;width:4mm;height:4mm;}
.cm.tl{left:-4mm;top:-4mm;border-right:.3mm solid #222;border-bottom:.3mm solid #222;}
.cm.tr{right:-4mm;top:-4mm;border-left:.3mm solid #222;border-bottom:.3mm solid #222;}
.cm.bl{left:-4mm;bottom:-4mm;border-right:.3mm solid #222;border-top:.3mm solid #222;}
.cm.br{right:-4mm;bottom:-4mm;border-left:.3mm solid #222;border-top:.3mm solid #222;}
.sheet-label{position:absolute;bottom:3mm;right:6mm;font-size:9px;color:#888;}
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:0 24mm;text-align:center;
  background:radial-gradient(120% 90% at 50% 0%,#2b4a7a,#16243f);color:#fff;}
.cover h1{font-size:40px;margin:0 0 6px;letter-spacing:2px;}
.cover .sub{font-size:16px;color:#bcd0ec;margin-bottom:22px;}
.cover .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:22px;}
.cover .chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:6px 14px;font-size:13px;}
.cover .note{font-size:12px;color:#9fb4d4;line-height:1.7;max-width:150mm;}
.cover .mini{display:flex;gap:8px;margin-top:18px;}
.cover .mini .card-wrap{width:42mm;height:59mm;}
`;

const CW = 63, CH = 88, GX = 4, GY = 4, COLS = 3, ROWS = 3;
const MX = (210 - (COLS * CW + (COLS - 1) * GX)) / 2;
const MY = (297 - (ROWS * CH + (ROWS - 1) * GY)) / 2;

function plate(card, side, i, x, y) {
  const inner = side === "front" ? R.cardFrontHTML(card, i, TOTAL) : R.cardBackHTML(card);
  return `<div class="plate" style="left:${x}mm;top:${y}mm">
    <div class="card-wrap">${inner}</div>
    <span class="cm tl"></span><span class="cm tr"></span><span class="cm bl"></span><span class="cm br"></span>
  </div>`;
}

function sheet(cardsSlice, side, pageLabel) {
  let h = "";
  cardsSlice.forEach((item, k) => {
    const col = k % COLS, row = Math.floor(k / COLS);
    const x = MX + col * (CW + GX), y = MY + row * (CH + GY);
    const card = side === "front" ? item : item;
    h += plate(card, side, item.__i, x, y);
  });
  return `<div class="page">${h}<div class="sheet-label">${pageLabel}</div></div>`;
}

// 给每张卡带上原始序号
const indexed = CARDS.map((c, i) => Object.assign({ __i: i }, c));
const frontPages = [], backPages = [];
for (let p = 0; p < indexed.length; p += COLS * ROWS) {
  frontPages.push(indexed.slice(p, p + COLS * ROWS));
  backPages.push(indexed.slice(p, p + COLS * ROWS));
}

const cover = `<div class="page"><div class="cover">
  <h1>🧠 脑宇宙</h1>
  <div class="sub">青春期大脑探秘卡 · 实体样本</div>
  <div class="row">
    <span class="chip">17 张核心脑区</span><span class="chip">17 只表情猫猫</span><span class="chip">主角 · ${MASCOT.cn} ${MASCOT.en}</span><span class="chip">家长 × 孩子 共看共聊</span>
  </div>
  <div class="note">本 PDF 为标准扑克尺寸（63×88mm）拼版，含四角出血裁切线，可直接送印厂打样。每张卡正面为「表情猫猫插画（大面积）+ 脑名/学名 + 代号 + 主要功能」；背面为「孩子可能会出现的症状 + 家长容易怎样误解（红） + 正确看待（品牌色） + 扫码二维码」。扫卡背二维码，可在家长小程序免费看 1 条专属应对方案，更多需开通会员或单条购买。</div>
  <div class="mini">
    <div class="card-wrap">${R.cardFrontHTML(CARDS[0], 0, TOTAL)}</div>
    <div class="card-wrap">${R.cardBackHTML(CARDS[0])}</div>
  </div>
</div></div>`;

const printHTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>脑宇宙 · 实体样本</title><style>${coreCSS}${printCSS}</style></head>
<body>
${cover}
${frontPages.map((s, i) => sheet(s, "front", "正面 " + (i * 9 + 1) + "-" + (i * 9 + s.length) + " / " + TOTAL)).join("")}
${backPages.map((s, i) => sheet(s, "back", "背面 " + (i * 9 + 1) + "-" + (i * 9 + s.length) + " / " + TOTAL)).join("")}
</body></html>`;

fs.writeFileSync(path.join(PRINT, "cards.html"), printHTML);
console.log("✓ print/cards.html 生成");

// 预览图（屏幕大图，几张卡拼排）
const previewCSS = coreCSS + `
body{background:#eef2f6;margin:0;padding:20px;font-family:"Noto Sans CJK SC",sans-serif;}
.wrap{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;max-width:1100px;margin:0 auto;}
.cw{width:252px;}
h2{text-align:center;color:#22303a;font-family:"Noto Sans CJK SC",sans-serif;}
`;
const previewHTML = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>预览</title><style>${previewCSS}</style></head>
<body><h2>脑宇宙 · 卡牌预览（正面 / 背面）</h2><div class="wrap">
${CARDS.map((c, i) => `<div class="cw"><div class="card-wrap">${R.cardFrontHTML(c, i, TOTAL)}</div></div>`).join("")}
</div><div class="wrap" style="margin-top:24px">
${CARDS.map((c) => `<div class="cw"><div class="card-wrap">${R.cardBackHTML(c)}</div></div>`).join("")}
</div></body></html>`;
fs.writeFileSync(path.join(PRINT, "preview.html"), previewHTML);
console.log("✓ print/preview.html 生成");
