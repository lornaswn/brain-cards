/* ============================================================
   render.js  —  脑宇宙·青春期大脑探秘卡  共享渲染层
   纯函数，无外部依赖。被 build.mjs (Node) 与 app/index.html (浏览器) 共用。
   通过 globalThis.Render 暴露： avatarSVG / cardFrontHTML / cardBackHTML / ICONS
   依赖 globalThis.CATMAP（卡id -> 表情猫PNG的dataURI），由 build.mjs 注入。
   ============================================================ */
(function () {
  "use strict";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // 功能图标（viewBox 0 0 64 64，描边风格，用于卡背小徽章）
  var ICONS = {
    pfc: '<path d="M14 46 L22 24 L32 36 L42 24 L50 46 Z"/><path d="M12 50 H52"/>',
    amygdala: '<path d="M32 12 C18 28 20 47 32 53 C44 47 46 28 32 12 Z"/><path d="M32 30 C28 36 28 43 32 47 C36 43 36 30 32 30 Z" fill="currentColor" stroke="none"/>',
    hippocampus: '<path d="M12 32 C20 18 28 46 36 32 C44 18 52 46 56 33" fill="none"/>',
    insula: '<path d="M32 51 C16 39 14 24 24 20 C30 17 32 24 32 26 C32 24 34 17 40 20 C50 24 48 39 32 51 Z" fill="currentColor" stroke="none"/><path d="M14 34 H26 L30 26 L36 43 L40 34 H52" fill="none"/>',
    broca: '<path d="M10 16 H46 A6 6 0 0 1 52 22 V36 A6 6 0 0 1 46 42 H30 L20 52 V42 H10 A6 6 0 0 1 4 36 V22 A6 6 0 0 1 10 16 Z" fill="none"/><circle cx="20" cy="29" r="2.4" fill="currentColor" stroke="none"/><circle cx="30" cy="29" r="2.4" fill="currentColor" stroke="none"/><circle cx="40" cy="29" r="2.4" fill="currentColor" stroke="none"/>',
    wernicke: '<path d="M12 26 H18 L26 16 V48 L18 38 H12 Z" fill="currentColor" stroke="none"/><path d="M34 24 A11 11 0 0 1 34 40" fill="none"/><path d="M41 17 A19 19 0 0 1 41 47" fill="none"/>',
    parietal: '<circle cx="32" cy="32" r="18" fill="none"/><path d="M32 15 L41 32 L32 49 L23 32 Z" fill="currentColor" stroke="none"/>',
    temporal: '<ellipse cx="20" cy="44" rx="6" ry="5" fill="currentColor" stroke="none"/><ellipse cx="42" cy="40" rx="6" ry="5" fill="currentColor" stroke="none"/><path d="M26 44 V18" fill="none"/><path d="M48 40 V14" fill="none"/><path d="M26 18 L48 14" fill="none"/>',
    occipital: '<path d="M8 32 C18 17 46 17 56 32 C46 47 18 47 8 32 Z" fill="none"/><circle cx="32" cy="32" r="7" fill="currentColor" stroke="none"/><circle cx="34" cy="30" r="2.2" fill="#fff" stroke="none"/>',
    cerebellum: '<path d="M32 14 V50" fill="none"/><path d="M16 50 H48" fill="none"/><path d="M14 28 C14 39 30 39 30 28" fill="none"/><path d="M34 28 C34 39 50 39 50 28" fill="none"/>',
    thalamus: '<path d="M32 10 V26" fill="none"/><path d="M32 26 L17 41" fill="none"/><path d="M32 26 L47 41" fill="none"/><path d="M17 41 H29" fill="none"/><path d="M47 41 H35" fill="none"/><circle cx="32" cy="9" r="3" fill="currentColor" stroke="none"/>',
    hypothalamus: '<path d="M29 12 V40 A11 11 0 1 0 39 40 V12 A5 5 0 0 0 29 12 Z" fill="none"/><path d="M32 22 V40" fill="none"/><path d="M26 30 H38" fill="none"/>',
    nacc: '<path d="M37 8 L17 37 H30 L25 56 L47 27 H34 Z" fill="currentColor" stroke="none"/>',
    brainstem: '<circle cx="32" cy="32" r="18" fill="none"/><path d="M12 32 H24 L29 21 L36 43 L41 32 H52" fill="none"/>',
    basalganglia: '<circle cx="32" cy="32" r="14" fill="none"/><circle cx="32" cy="32" r="6" fill="currentColor" stroke="none"/><path d="M32 10 V17 M32 47 V54 M10 32 H17 M47 32 H54 M18 18 L23 23 M46 46 L41 41 M46 18 L41 23 M18 46 L23 41" fill="none"/>',
    cingulate: '<circle cx="27" cy="27" r="13" fill="none"/><path d="M37 37 L50 50" fill="none"/><circle cx="50" cy="44" r="2.4" fill="currentColor" stroke="none"/>',
    caudate: '<ellipse cx="32" cy="38" rx="16" ry="9" fill="none"/><path d="M16 38 A16 9 0 0 0 48 38" fill="currentColor" stroke="none" opacity=".4"/><path d="M22 16 L31 34" fill="none"/><path d="M42 16 L33 34" fill="none"/>'
  };

  function tint(hex, a) {
    var h = hex.replace("#", "");
    var r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  /* ---------- 正面插画：表情猫大舞台（透明PNG铺在主题色上） ---------- */
  function catArt(card) {
    var map = (typeof CATMAP !== "undefined") ? CATMAP : {};
    var img = map[card.id] || "";
    return (
      '<div class="cat-stage" style="background:' + tint(card.color, 0.14) + '">' +
        '<div class="cat-glow" style="background:radial-gradient(60% 55% at 50% 62%,' + tint(card.color, 0.22) + ',transparent 70%)"></div>' +
        '<img class="cat-img" src="' + img + '" alt="' + esc(card.name) + '表情猫">' +
        '<span class="loc"><i style="background:' + card.color + '"></i>位于：' + esc(card.region) + '</span>' +
      '</div>'
    );
  }

  /* ---------- 卡面正面：猫图（大面积）+ 脑名 + 主要功能 ---------- */
  function cardFrontHTML(card, idx, total) {
    var M = (typeof MASCOT !== "undefined") ? MASCOT : { cn: "想开", en: "ThinkCat" };
    return (
      '<div class="card front" style="--c:' + card.color + ';--c2:' + card.color2 + '">' +
        '<div class="illu">' + catArt(card) + '</div>' +
        '<div class="nameline"><span class="cn">' + esc(card.name) + '</span><span class="sci">' + esc(card.en) + '</span></div>' +
        '<div class="code"><span class="code-tag">代号</span><span class="code-name">' + esc(card.code) + '</span></div>' +
        '<div class="func">' + esc(card.function) + '</div>' +
        '<div class="desc">' + esc(card.desc) + '</div>' +
        '<div class="foot"><span>🐱 ' + esc(M.cn) + ' · 青春期大脑探秘卡</span><span>' + (idx + 1) + " / " + total + '</span></div>' +
      '</div>'
    );
  }

  /* ---------- 卡面背面（家长手册）：症状 + 错误看待(红) + 正确看待(品牌色) + 二维码 ---------- */
  function cardBackHTML(card) {
    var symp = card.puberty.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
    var icon = ICONS[card.id] || "";
    var qr = (typeof CATQR !== "undefined" && CATQR[card.id]) ? CATQR[card.id] : "";
    return (
      '<div class="card back" style="--c:' + card.color + ';--c2:' + card.color2 + '">' +
        '<div class="back-top">' +
          '<span class="back-badge"><svg viewBox="0 0 64 64" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></span>' +
          '<span class="back-titles"><b class="back-code">' + esc(card.code) + '</b><i class="back-name">' + esc(card.name) + ' · 家长手册</i></span>' +
        '</div>' +
        '<div class="back-body">' +
          '<div class="bs symp-block"><div class="bs-title">孩子可能会…</div><ul class="symp">' + symp + '</ul></div>' +
          '<div class="bs wrong"><div class="bs-title w">✕ 家长容易这样误解</div><p>' + esc(card.wrongView || "") + '</p></div>' +
          '<div class="bs right"><div class="bs-title r">✓ 正确看待</div><p>' + esc(card.parentView || "") + '</p></div>' +
          '<div class="bs hook"><div class="hook-quote" style="background:' + tint(card.color, 0.10) + '">“' + esc(card.hook || "") + '”</div></div>' +
          '<div class="bs-wm"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></div>' +
        '</div>' +
        '<div class="back-foot">' +
          '<div class="qr-text"><b>扫码免费看 1 条<br>专属应对方案</b><span>更多方案在小程序</span></div>' +
          (qr ? '<img class="qr" src="' + qr + '">' : '') +
        '</div>' +
      '</div>'
    );
  }

  var R = { avatarSVG: catArt, cardFrontHTML: cardFrontHTML, cardBackHTML: cardBackHTML, ICONS: ICONS };
  if (typeof globalThis !== "undefined") globalThis.Render = R;
  if (typeof module !== "undefined" && module.exports) module.exports = R;
})();
