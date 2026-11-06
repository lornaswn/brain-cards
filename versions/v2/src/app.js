/* ============================================================
   脑宇宙 V2 · 家长小程序 应用逻辑
   依赖 build 注入的全局：PA_CARDS, PA_DECKS, MASCOT, PA_AUDIO,
   QUIZ_LEVELS, CATMAP, CATQR, APP_QR, PA_FREE_ALL
   ============================================================ */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const LS = {
  g(k, d){ try{ const v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  s(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
const ST = {
  free:()=>LS.g('pa_free',false),
  member:()=>LS.g('pa_member',false),
  bought:()=>LS.g('pa_bought',[]),
  freeCard:()=>LS.g('pa_free_card',null)
};
function unlocked(id){ return PA_FREE_ALL || ST.member() || ST.bought().includes(id) || ST.freeCard()===id; }
function byId(id){ return PA_CARDS.find(c=>c.id===id); }
function cardByName(name){ return PA_CARDS.find(c=>c.name===name); }
function toast(m){ const t=$('#toast'); if(!t)return; t.textContent=m; t.classList.add('show'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),2400); }

/* ---------- 铲屎官 数据（沿用 V1） ---------- */
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
/* ---------- 发育行为测评（参考 CBCL / Conners / SNAP-IV 频率观察思路） ---------- */
/* 每题对应一个脑区；评分 0 从不 / 1 偶尔 / 2 经常 / 3 总是；累计得到各脑区关注度 */
const BEHAVIOR_TEST=[
  {id:'t1',  q:'写作业时容易走神，喊他好几遍才回过神',                 r:'thalamus'},
  {id:'t2',  q:'跟他说话像没听见，要重复好几遍才反应',                 r:'thalamus'},
  {id:'t3',  q:'明明知道该做什么，却总是拖延、管不住自己',             r:'pfc'},
  {id:'t4',  q:'做事没计划，丢三落四、书包乱糟糟',                     r:'pfc'},
  {id:'t5',  q:'一被批评就炸毛、摔东西或甩门',                         r:'amygdala'},
  {id:'t6',  q:'情绪说来就来，哄半天才能平静下来',                     r:'amygdala'},
  {id:'t7',  q:'背书、记作业，转头就忘',                               r:'hippocampus'},
  {id:'t8',  q:'讲过的道理过耳就散，好像从没说过',                     r:'hippocampus'},
  {id:'t9',  q:'一到饭点没吃就发脾气，情绪随生理坐过山车',             r:'hypothalamus'},
  {id:'t10', q:'睡不够第二天就全线崩溃、没精神',                       r:'brainstem'},
  {id:'t11', q:'晚上不肯睡、早上起不来，睡眠节律乱',                   r:'brainstem'},
  {id:'t12', q:'打游戏、刷视频停不下来，只爱即时那点爽',               r:'nacc'},
  {id:'t13', q:'学习或做事总要先给奖励才肯动',                         r:'nacc'},
  {id:'t14', q:'一遇压力就躲进手机、钻进老套路出不来',                 r:'basalganglia'},
  {id:'t15', q:'坏习惯越重复越牢，很难帮他改掉',                       r:'basalganglia'},
  {id:'t16', q:'字写得歪扭、骑车总摔、动作不协调',                     r:'cerebellum'},
  {id:'t17', q:'被问急了话到嘴边说不出、解释不清',                     r:'broca'},
  {id:'t18', q:'你把道理讲三遍，他听成「又在骂我」',                   r:'wernicke'},
  {id:'t19', q:'没病却总喊累喊痛、莫名烦躁说不清',                     r:'insula'},
  {id:'t20', q:'做决定前先 emo 半天、反复纠结内耗',                    r:'cingulate'},
  {id:'t21', q:'一遇难题就卡在老办法、换个题型就不会',                 r:'caudate'},
  {id:'t22', q:'刷题只会一种解法，不太会变通',                         r:'caudate'},
  {id:'t23', q:'读书跳行跳字、看题总看漏条件',                         r:'occipital'},
  {id:'t24', q:'收拾东西丢三落四、走路常撞门框（空间感差）',           r:'parietal'},
  {id:'t25', q:'上课听讲容易漏半句、叫名字反应慢半拍',                 r:'temporal'}
];
const TEST_OPTS=[{v:0,t:'从不'},{v:1,t:'偶尔'},{v:2,t:'经常'},{v:3,t:'总是'}];
let testAnsMap={};

const CAT_ACTIONS=[
  {key:'food',  need:'肚子咕咕叫，想吃点小鱼干', tool:'🐟', toolName:'小鱼干', act:'eat',   happy:'我饱了 😋'},
  {key:'water', need:'口渴，想喝香香奶瓶',       tool:'🍼', toolName:'奶瓶',   act:'drink', happy:'润润嗓子 💧'},
  {key:'play',  need:'有点无聊，想玩逗猫棒',     tool:'🪀', toolName:'逗猫棒', act:'play',  happy:'好开心 😺'},
  {key:'brush', need:'毛乱糟糟，想梳梳毛',       tool:'🪮', toolName:'梳子',   act:'groom', happy:'毛好顺滑～ 😌'},
  {key:'wipe',  need:'脸脏脏，想擦擦脸',         tool:'🧽', toolName:'洗脸巾', act:'wipe',  happy:'脸干净啦 ✨'},
  {key:'nails', need:'指甲长了，想剪指甲',       tool:'✂️', toolName:'指甲剪', act:'clip',  happy:'指甲好短 ✂️'}
];
const CAT_ORDER=['food','water','play','brush','wipe','nails'];
const GOLD_PRICE=9.9;

/* ---------- 路由 / 外壳 ---------- */
let deepCard=null;
const PARAMS=new URLSearchParams(location.search);
(function(){ const qc=PARAMS.get('card'); if(qc && byId(qc)) deepCard=qc; })();

function nav(v, id){
  if(v==='card') location.hash='card/'+id;
  else if(v==='vip') location.hash='vip';
  else if(v==='quiz') location.hash='quiz';
  else if(v==='report') location.hash='report';
  else if(v==='join') location.hash='join';
  else if(v==='me') location.hash='me';
  else if(v==='brain') location.hash='brain';
  else if(v==='cat') location.hash='cat';
  else if(v==='test') location.hash='test';
  else location.hash='home';
}
/* 子页面 → 返回目标 */
const SUB_BACK={card:'brain',vip:'me',join:'home',report:'home',test:'home'};
let currentView='home';
function goBack(){ nav(SUB_BACK[currentView]||'home'); }
function route(){
  closePay();
  const app=$('#app');
  if(app && !app.dataset.built) render('home');
  const h=(location.hash||'#home').replace(/^#/,'');
  if(h.startsWith('card/')){ const id=h.slice(5); const c=byId(id); if(c){ deepCard=id; lastCard=c; return render('card'); } }
  if(h==='vip') return render('vip');
  if(h==='quiz') return render('quiz');
  if(h==='report') return render('report');
  if(h==='join') return render('join');
  if(h==='me') return render('me');
  if(h==='brain') return render('brain');
  if(h==='cat') return render('cat');
  if(h==='test') return render('test');
  return render('home');
}
function setTab(name){
  const map={home:'t-home',brain:'t-brain',quiz:'t-quiz',cat:'t-cat',me:'t-me'};
  $$('.tabbar .tb').forEach(b=>b.classList.toggle('active', b.id===map[name]));
}
function render(name){
  const app=$('#app');
  currentView=name;
  // 外壳只建一次
  if(!app.dataset.built){
    app.innerHTML='<div class="head"><div class="head-row">'+
      '<div class="head-l"><span class="hback" id="hback" onclick="goBack()">‹</span>'+
      '<div class="logo"><span class="mark">🧠</span>脑宇宙<b>· 家长版</b></div></div>'+
      '<div style="display:flex;align-items:center;gap:10px"><span class="vtag">V2</span>'+
      '<div class="avatar" onclick="nav(\'me\')">'+(MASCOT&&MASCOT.cn?MASCOT.cn[0]:'脑')+'</div></div></div></div>'+
      '<div id="view" class="view"></div>'+
      '<div class="tabbar">'+
        '<div class="tb" id="t-home" onclick="nav(\'home\')"><span class="ti">🏠</span>首页</div>'+
        '<div class="tb" id="t-brain" onclick="nav(\'brain\')"><span class="ti">🧩</span>脑区</div>'+
        '<div class="tb" id="t-quiz" onclick="nav(\'quiz\')"><span class="ti">🕵️</span>断案</div>'+
        '<div class="tb" id="t-cat" onclick="nav(\'cat\')"><span class="ti">🐱</span>铲屎官</div>'+
        '<div class="tb" id="t-me" onclick="nav(\'me\')"><span class="ti">👤</span>我的</div>'+
      '</div>';
    app.dataset.built='1';
  }
  const view=$('#view');
  setTab(name);
  // 子页面显示返回按钮
  const head=app.querySelector('.head');
  if(head) head.classList.toggle('has-back', Object.prototype.hasOwnProperty.call(SUB_BACK,name));
  if(name==='home') return viewHome(view);
  if(name==='brain') return viewBrain(view);
  if(name==='quiz') return viewQuiz(view);
  if(name==='report') return viewReport(view);
  if(name==='test') return viewTest(view);
  if(name==='cat') return viewCat(view);
  if(name==='me') return viewMe(view);
  if(name==='vip') return viewVip(view);
  if(name==='join') return viewJoin(view);
  if(name==='card') return viewDetail(view, lastCard);
}

/* ---------- 首页 ---------- */
let lastCard=null;
function drawRandomCard(){ return PA_CARDS[Math.floor(Math.random()*PA_CARDS.length)]; }
function viewHome(view){
  const c=drawRandomCard();
  const badge=PA_FREE_ALL?'体验版 · 17 个脑区应对方案全部免费开放':'新用户免费看 1 条专属应对方案';
  view.innerHTML=
    '<div class="hero"><div class="stars"></div>'+
      '<h1>读懂青春期的大脑</h1>'+
      '<p>17 个脑区，一只叫「'+MASCOT.cn+'」的猫一种情绪。先看孩子怎么了，再学怎么接住他。</p>'+
      '<span class="badge">'+badge+'</span>'+
      '<img class="mascot" src="'+(CATMAP[c.id]||c.img)+'" alt="想开"></div>'+
    '<div class="today" onclick="openDraw()">'+
      '<img src="'+(CATMAP[c.id]||c.img)+'" alt="'+c.name+'">'+
      '<div class="t-info"><div class="t-k">🎴 今日一抽</div>'+
      '<div class="t-n">'+c.name+'</div>'+
      '<div class="t-d">点开看「孩子出现这种状态时，是哪片脑区在主导」</div></div>'+
      '<div class="t-go">›</div></div>'+
    '<div class="quick">'+
      '<div class="qk" onclick="nav(\'brain\')"><div class="qi">🧩</div><div class="qn">脑区卡库</div></div>'+
      '<div class="qk" onclick="nav(\'quiz\')"><div class="qi">🕵️</div><div class="qn">情境断案</div></div>'+
      '<div class="qk" onclick="nav(\'cat\')"><div class="qi">🐱</div><div class="qn">铲屎官打卡</div></div>'+
    '</div>'+
    testCta()+
    joinBar()+
    vipBar()+
    '<div class="title">🧩 全部脑区 <small>点开看「错误 vs 正确看待」+ 应对方案</small></div>'+
    '<div class="brain-grid">'+PA_CARDS.map(c=>brainCell(c)).join('')+'</div>'+
    '<div class="sec-note">© 脑宇宙 · 脑科学育儿科普，不构成医学诊断</div>';
  window.scrollTo(0,0);
}
function brainCell(c){
  const locked=!unlocked(c.id);
  return '<div class="bx'+(locked?' locked':'')+'" data-id="'+c.id+'" onclick="nav(\'card\',this.dataset.id)">'+
    '<img src="'+(CATMAP[c.id]||c.img)+'" alt="'+c.name+'">'+
    '<div class="bn">'+c.name+'</div><div class="be">'+c.en+'</div>'+
    '<span class="bc" style="background:'+c.color+'">'+c.code+'</span></div>';
}
function joinBar(){
  return '<div class="join-bar" onclick="nav(\'join\')"><span class="jb-ic">💬</span>'+
    '<div class="jb-t"><b>加群领《脑科学育儿 7 天课》</b><span>扫码进群，每天一条脑区养育干货 + 答疑</span></div>'+
    '<span class="jb-go">去加群 ›</span></div>';
}
function testCta(){
  const done=!!LS.g('pa_test_report',null);
  return '<div class="test-cta" onclick="nav(\'test\')"><span class="tc-ic">📋</span>'+
    '<div class="tc-t"><b>发育行为测评 · 约 3 分钟</b><span>25 题日常观察，画出孩子的「脑养成图」'+(done?' · 已测过可重测':'')+'</span></div>'+
    '<span class="tc-go">'+(done?'再测一次 ›':'去测 ›')+'</span></div>';
}
function vipBar(){
  if(ST.member()) return '';
  return '<div class="vip-bar" onclick="nav(\'vip\')"><span class="vb-ic">👑</span>'+
    '<div class="vb-t"><b>开通会员 ¥68/年</b><span>解锁全部 17 脑区应对 + 150 题断案</span></div>'+
    '<span class="vb-btn">去开通</span></div>';
}

/* ---------- 每日一抽 弹窗 ---------- */
function openDraw(){
  const c=drawRandomCard(); lastCard=c;
  const prompt='当孩子「'+(c.puberty&&c.puberty[0]?c.puberty[0]:'情绪起伏')+'」时，往往是「'+c.name+'」在悄悄主导。今天，你捕捉到这一幕了吗？';
  $('#mask').classList.add('show');
  $('#sheet').innerHTML='<div style="text-align:center">'+
    '<img src="'+(CATMAP[c.id]||c.img)+'" style="width:120px;height:120px;object-fit:contain;margin:0 auto">'+
    '<div style="font-size:18px;font-weight:800;margin-top:6px">'+c.name+' <span style="font-size:12px;color:#9389A3">'+c.en+'</span></div>'+
    '<span style="display:inline-block;margin:6px auto 0;background:'+c.color+';color:#fff;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:700">'+c.code+'</span>'+
    '<p style="font-size:14px;line-height:1.7;color:#4A4156;margin:14px 6px 0">'+prompt+'</p>'+
    '<button class="btn btn-primary btn-block" style="margin-top:16px" onclick="nav(\'card\',\''+c.id+'\');closePay()">📖 看家长手册</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:9px" onclick="closePay()">再想想</button></div>';
}

/* ---------- 脑区详情 ---------- */
function viewDetail(view, id){
  const c=(id&&typeof id==='object')?id:byId(id); if(!c){ return route(); }
  id=c.id;
  lastCard=c;
  document.documentElement.style.setProperty('--c',c.color);
  document.documentElement.style.setProperty('--c2',c.color2);
  const open=unlocked(id);
  const copeHtml=open
    ? '<ol class="cop-list">'+c.coping.map(t=>'<li>'+t+'</li>').join('')+'</ol>'
    : '<div class="lockbox"><div class="lk-ic">🔒</div><p>'+(ST.free()?'本条应对方案需开通会员或单条购买':'免费看 1 条专属应对方案，手把手教你接住孩子')+'</p>'+
      '<button class="btn btn-primary btn-block" onclick="tryUnlock(\''+id+'\')">'+(ST.free()?'开通会员 / 单条购买':'免费看 1 条应对方案')+'</button></div>';
  const scan=deepCard==id?'<div class="scan-banner"><span class="sb-ic">📷</span><div class="sb-t">你是通过卡背<b>二维码</b>进来的 👏 先<b>加群领 7 天课</b>，再慢慢看这张卡～</div></div>':'';
  const vipBarLocal=(PA_FREE_ALL||ST.member())?'':vipBar();
  view.innerHTML=
    '<div class="detail-hero" style="--c:'+c.color+';--c2:'+c.color2+'">'+
      '<span class="dtag">📖 家长手册</span>'+
      '<img src="'+(CATMAP[c.id]||c.img)+'" alt="'+c.name+'">'+
      '<div class="dn">'+c.name+'</div><div class="de">'+c.en+'</div>'+
      '<span class="dcode">'+c.code+'</span>'+
      '<div class="dregion"><i></i>位于：'+c.region+'</div>'+
      '<p class="dfunc">'+c.function+'</p></div>'+
    scan+
    '<div class="card-x"><button class="btn btn-violet btn-block" onclick="openShare(\''+id+'\')">📤 生成分享海报（带二维码引流）</button></div>'+
    '<div class="block wrong"><h3><span class="mk">✕</span>家长容易这样误解</h3><p>'+c.wrongView+'</p></div>'+
    '<div class="block right"><h3><span class="mk">✓</span>正确看待</h3><p>'+c.parentView+'</p></div>'+
    '<div class="block coping '+(open?'':'locked')+'"><h3>🛠 应对方式</h3>'+copeHtml+'</div>'+
    '<div class="card-x join-bar" onclick="nav(\'join\')" style="cursor:pointer"><span class="jb-ic">💬</span>'+
      '<div class="jb-t"><b>还想要更系统的陪练？</b><span>加群领《脑科学育儿 7 天课》，每天一条 + 群内答疑</span></div>'+
      '<span class="jb-go">去加群 ›</span></div>'+
    vipBarLocal;
  window.scrollTo(0,0);
  deepCard=null;
}
function tryUnlock(id){
  if(unlocked(id)) return viewDetail($('#view'),id);
  if(!ST.free()){ LS.s('pa_free',true); LS.s('pa_free_card',id); toast('已免费解锁 1 条应对方案 · 后续可开通会员或单条购买'); return viewDetail($('#view'),id); }
  openPay(id);
}

/* ---------- 脑区卡库 ---------- */
function viewBrain(view){
  view.innerHTML='<div class="title">🧩 全部脑区 <small>'+(unlocked('pfc')?'':'17 个脑区 · 解锁后看应对方案')+'</small></div>'+
    '<div class="brain-grid">'+PA_CARDS.map(c=>brainCell(c)).join('')+'</div>';
  window.scrollTo(0,0);
}

/* ---------- 情境断案 ---------- */
const QUIZ_LEVELS=window.QUIZ_LEVELS;
const LEVEL_PRICE=[19.9,29.9,39.9];
let quizState=null, quizLevelCur=0;
function quizPrice(L){ return LEVEL_PRICE[L]; }
function quizBundleOwned(L){ if(ST.member())return true; return LS.g('pa_quiz_bundle',[]).includes(L); }
function quizOwned(L,G){ if(L===0&&G===0)return true; if(ST.member())return true; if(quizBundleOwned(L))return true; return LS.g('pa_quiz_owned',[]).includes(L+'-'+G); }
function quizPrimaryBought(){ return ST.member() || quizBundleOwned(0) || LS.g('pa_quiz_owned',[]).some(k=>/^0-\d+$/.test(k)&&k!=='0-0'); }
function quizCanBuyLevel(L){ return L===0 || quizPrimaryBought(); }
function quizTotalQ(L){ return QUIZ_LEVELS[L].groups.reduce((n,g)=>n+g.qs.length,0); }
function shuffleArr(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;} return a; }
function viewQuiz(view){
  quizLevelCur=0;
  view.innerHTML='<div class="title">🕵️ 情境断案 <small>练眼力 · 看出孩子行为背后的脑区</small></div>'+
    '<div id="quizArea"></div>';
  quizRenderSelect($('#quizArea'));
  window.scrollTo(0,0);
}
function quizRenderSelect(a){
  const L=QUIZ_LEVELS[quizLevelCur];
  const tabs=QUIZ_LEVELS.map((lv,i)=>'<button class="ptab '+(i===quizLevelCur?'sel':'')+'" onclick="quizLevel('+i+')" style="flex:1;border:none;border-radius:12px;padding:9px 4px;font-size:13px;font-weight:700;background:'+(i===quizLevelCur?'linear-gradient(135deg,var(--brand),var(--brand2))':'#F3ECFF')+';color:'+(i===quizLevelCur?'#fff':'var(--brand2)')+';cursor:pointer;margin:0 3px">'+lv.name+'</button>').join('');
  const groups=L.groups.map((g,gi)=>{
    const owned=quizOwned(quizLevelCur,gi), buyable=quizCanBuyLevel(quizLevelCur), free=(quizLevelCur===0&&gi===0);
    let tag,act,cls='gk';
    if(owned){ cls+=' on'; tag='<span class="gk-free">✅ 已解锁</span>'; act='onclick="quizStart('+quizLevelCur+','+gi+')"'; }
    else if(!buyable){ tag='<span class="gk-lock">🔒 先购初级</span>'; act='onclick="quizBuyLevelHint('+quizLevelCur+')"'; }
    else { cls+=' buy'; tag='<span class="gk-lock">🔒 未解锁</span>'; act='onclick="openPayBundle('+quizLevelCur+')"'; }
    return '<div class="'+cls+'" '+act+'><div class="gn">'+(gi+1)+'. '+g.name.replace(/^.*· /,'')+'</div><div class="gk-m">5 题 · '+tag+'</div></div>';
  }).join('');
  const bOwned=quizBundleOwned(quizLevelCur), bBuy=quizCanBuyLevel(quizLevelCur);
  let bCls='bundle', bTag, bAct;
  if(bOwned){ bCls+=' on'; bTag='<span class="lvb-state">✅ 已解锁全部 '+L.groups.length+' 组</span>'; bAct=''; }
  else if(!bBuy){ bTag='<span class="lvb-state">🔒 先购买「初级」后可解锁</span>'; bAct='onclick="quizBuyLevelHint('+quizLevelCur+')"'; }
  else { bCls+=' buy'; bTag='<span class="lvb-price">¥'+quizPrice(quizLevelCur)+' 解锁全部</span>'; bAct='onclick="openPayBundle('+quizLevelCur+')"'; }
  const bundle='<div class="'+bCls+'" '+bAct+'>🎁 <b>解锁'+L.name+'全部题库</b><small>（'+L.groups.length+' 组 · 共 '+quizTotalQ(quizLevelCur)+' 题）</small>'+bTag+'</div>';
  a.innerHTML='<div style="display:flex;gap:0;margin:6px 0 12px">'+tabs+'</div>'+
    '<div class="lvtip">📘 '+L.name+'：'+L.desc+(quizLevelCur===0?'（第 1 组免费体验）':'')+'</div>'+
    bundle+
    '<div class="gk-grid">'+groups+'</div>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:12px" onclick="nav(\'report\')">📊 查看我的脑区养育报告</button>'+
    '<div class="sec-note">免费体验初级第 1 组 · 整档一次性 ¥'+quizPrice(quizLevelCur)+' 解锁全部 '+quizTotalQ(quizLevelCur)+' 题 · 会员 ¥68 畅玩全部 3 关 150 题</div>';
}
function quizLevel(i){ quizLevelCur=i; quizRenderSelect($('#quizArea')); }
function quizBuyLevelHint(L){ toast('先购买「初级全部题库」，即可解锁'+QUIZ_LEVELS[L].name+'题库 🔓'); openPayBundle(0); }
function quizStart(L,G){ quizState={L:G===undefined?quizLevelCur:L,G:G===undefined?quizLevelCur:G,qi:0,right:0,answered:false}; if(quizState.G===undefined)quizState.G=0; quizRenderQ($('#quizArea')); }
function quizRenderQ(a){
  const s=quizState, g=QUIZ_LEVELS[s.L].groups[s.G], q=g.qs[s.qi];
  if(s.qi>=g.qs.length){ return quizRenderResult(a); }
  const order=shuffleArr([0,1,2,3]);
  const opts=order.map(i=>q.o[i]);
  s.ans=order.indexOf(q.a);
  const correctCard=cardByName(q.o[q.a]);
  s._cardId=correctCard?correctCard.id:null;
  let html='<div class="quiz-card"><div class="quiz-top"><span>'+QUIZ_LEVELS[s.L].name+' · 第 '+(s.G+1)+' 组</span>'+
    '<span class="qbar"><i style="width:'+(s.qi/g.qs.length*100)+'%"></i></span>'+
    '<span>第 '+(s.qi+1)+'/'+g.qs.length+' · 对 '+s.right+'</span></div>'+
    '<div class="quiz-q">'+q.q+'</div><div class="quiz-opts">';
  opts.forEach((t,idx)=>{ html+='<button class="quiz-opt" data-idx="'+idx+'" onclick="quizAns('+idx+')">'+t+'</button>'; });
  html+='</div><div id="quizFB"></div></div>';
  a.innerHTML=html;
}
function quizAns(idx){
  const s=quizState,g=QUIZ_LEVELS[s.L].groups[s.G],q=g.qs[s.qi]; if(s.answered)return; s.answered=true;
  const correct=idx===s.ans; if(correct)s.right++;
  if(s._cardId) recordAnswer(s._cardId, correct);
  $('#quizFB').innerHTML='<div class="quiz-fb '+(correct?'ok':'no')+'">'+(correct?'✅ 答对！':'❌ 正确答案：'+q.o[q.a])+'<p>'+q.why+'</p>'+
    '<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="quizNext()">下一题 →</button></div>';
  document.querySelectorAll('.quiz-opt').forEach(b=>{const i=+b.dataset.idx;b.disabled=true;if(i===s.ans)b.classList.add('corr');if(i===idx&&!correct)b.classList.add('wr');});
}
function quizNext(){ quizState.answered=false; quizState.qi++; quizRenderQ($('#quizArea')); }
function quizRenderResult(a){
  const s=quizState, tot=QUIZ_LEVELS[s.L].groups[s.G].qs.length, pct=Math.round(s.right/tot*100);
  const nextG=s.G+1, hasNext=(nextG<QUIZ_LEVELS[s.L].groups.length), nextOwned=hasNext&&quizOwned(s.L,nextG);
  let nextBtn='';
  if(hasNext&&nextOwned){ nextBtn='<button class="btn btn-primary btn-block" style="margin-top:10px" onclick="quizStart('+s.L+','+nextG+')">下一组 →</button>'; }
  else if(hasNext&&!nextOwned&&quizCanBuyLevel(s.L)){ nextBtn='<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openPayBundle('+s.L+')">🔓 解锁'+QUIZ_LEVELS[s.L].name+'全部题库（¥'+quizPrice(s.L)+'）</button>'; }
  else if(hasNext&&!nextOwned&&!quizCanBuyLevel(s.L)){ nextBtn='<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="quizBuyLevelHint('+s.L+')">先购买初级后可解锁</button>'; }
  a.innerHTML='<div class="qend"><div class="es">'+(pct>=80?'🏆':pct>=60?'🎉':'💪')+'</div>'+
    '<h2>本组完成！</h2>'+
    '<p>答对 <b style="color:#15935a">'+s.right+'</b> / '+tot+'（'+pct+'%）<br>每道题都在帮你「看见」孩子行为背后的脑区。</p>'+
    '<div>'+nextBtn+'</div>'+
    '<button class="btn btn-violet btn-block" style="margin-top:10px" onclick="nav(\'report\')">📊 看我的脑区养育报告</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="quizBack()">📑 返回选关</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="quizStart('+s.L+','+s.G+')">↺ 重做本组</button></div>';
}
function quizBack(){ quizRenderSelect($('#quizArea')); }

/* 测评报告：记录每题对错 → 按脑区统计 */
function recordAnswer(cardId, correct){
  const r=LS.g('pa_quiz_report',{});
  if(!r[cardId]) r[cardId]={right:0,wrong:0};
  if(correct) r[cardId].right++; else r[cardId].wrong++;
  LS.s('pa_quiz_report',r);
}
/* 脑养成图：发育行为测评（主）+ 情境断案（辅）统一呈现 */
function viewReport(view){
  const test=LS.g('pa_test_report',null);
  const quiz=LS.g('pa_quiz_report',{});
  const hasQuiz=Object.keys(quiz).length>0;
  if(!test && !hasQuiz){
    view.innerHTML='<div class="report"><h2>🧠 脑养成图</h2><div class="rsub">还没有数据</div>'+
      '<p style="font-size:13.5px;color:#4A4156;line-height:1.7">想知道孩子哪些脑区需要多关注？做一份<b>发育行为测评</b>（25 题日常观察，约 3 分钟），系统会画出他的「脑养成图」；先玩几道<b>情境断案</b>也可以。</p>'+
      '<button class="btn btn-primary btn-block" style="margin-top:14px" onclick="nav(\'test\')">📋 去做发育行为测评</button>'+
      '<button class="btn btn-ghost btn-block" style="margin-top:9px" onclick="nav(\'quiz\')">去情境断案 →</button></div>';
    window.scrollTo(0,0); return;
  }
  let head,sub,intro,bars,extra='';
  if(test){
    const regions=test.regions||[];
    const maxRate=Math.max(...regions.map(x=>x.rate),.01);
    const top=byId(regions[0].id);
    const tip=CAT_MOOD_TIP[regions[0].id]||'别急着贴标签，先看懂这个脑区还在发育。';
    head='🧠 脑养成图 · 发育测评';
    sub='基于你对孩子近 1 个月的观察 · '+regions.length+' 个脑区';
    intro='最该多留意的脑区是 <b style="color:var(--brand)">「'+(top?top.name:'')+'」</b>。'+
      '这类表现背后，往往是这个脑区还在发育——不是孩子故意这样，先看懂它。';
    bars=regions.map(x=>{ const c=byId(x.id); const pct=Math.round(x.rate*100);
      const lvl=x.rate>=.5?'需多关注':(x.rate>=.25?'可留意':'较稳定');
      const cls=x.rate>=.5?'hi':(x.rate>=.25?'mid':'');
      return '<div class="rank-row"><div class="rr-n">'+(c?c.name:'')+'</div>'+
        '<div class="rr-bar"><i class="'+cls+'" style="width:'+(x.rate/maxRate*100)+'%"></i></div>'+
        '<div class="rr-v">'+pct+'%</div><span class="rr-lvl '+cls+'">'+lvl+'</span></div>'; }).join('');
    extra='<div class="block right" style="margin-top:14px"><h3><span class="mk">💡</span>给家长的一句话</h3><p>'+tip+'</p></div>';
  }else{
    const keys=Object.keys(quiz);
    const rows=keys.map(id=>{ const o=quiz[id]; const total=o.right+o.wrong; return {id,wrongRate:Math.round(o.wrong/total*100)}; })
      .sort((a,b)=>b.wrongRate-a.wrongRate);
    const maxRate=Math.max(...rows.map(x=>x.wrongRate),1);
    const top=byId(rows[0].id);
    head='🧠 脑养成图 · 情境断案';
    sub='基于你做过的 '+keys.length+' 个脑区 · '+keys.reduce((n,k)=>n+quiz[k].right+quiz[k].wrong,0)+' 道题';
    intro='你最该多留意的脑区是 <b style="color:var(--brand)">「'+(top?top.name:'')+'」</b>（答错率 '+rows[0].wrongRate+'%）。'+
      '想要更准？做一份发育行为测评，用孩子的日常行为直接定位。';
    bars=rows.map(x=>{ const c=byId(x.id); return '<div class="rank-row"><div class="rr-n">'+(c?c.name:'')+'</div>'+
      '<div class="rr-bar"><i style="width:'+(x.wrongRate/maxRate*100)+'%"></i></div>'+
      '<div class="rr-v">'+x.wrongRate+'%</div></div>'; }).join('');
  }
  const locked=!ST.member();
  view.innerHTML='<div class="report"><h2>'+head+'</h2><div class="rsub">'+sub+'</div>'+
    '<p style="font-size:14px;line-height:1.7;color:#4A4156">'+intro+'</p>'+
    '<div class="rank-title">各脑区关注度</div>'+bars+extra+
    (locked?'<div class="locked"><p>开通会员，解锁《你家孩子的脑区养育全案》：每个脑区的错误/正确看待 + 具体话术与步骤，随时回看。</p>'+
      '<button class="btn btn-gold btn-block" onclick="nav(\'vip\')">👑 开通会员 ¥68/年</button></div>'
    :'<div class="card-x tint" style="margin-top:14px"><b style="color:var(--brand2)">会员已解锁 ✅</b><p style="font-size:13px;color:#4A4156;margin:6px 0 0">每个脑区的完整应对方案都已开放，去「脑区」慢慢看吧。</p></div>')+
    '<button class="btn btn-primary btn-block" style="margin-top:12px" onclick="nav(\'test\')">📋 '+(test?'重新测评，让图更准':'做测评，看脑养成图')+'</button>'+
    '<button class="btn btn-ghost btn-block" style="margin-top:8px" onclick="nav(\'quiz\')">继续做情境断案 →</button>'+
    '<div class="sec-note">⚠ 本测评为家长自查参考，不构成医学诊断；如有持续困扰，请咨询专业机构</div></div>';
  window.scrollTo(0,0);
}

/* ---------- 发育行为测评（25 题日常观察 → 脑养成图） ---------- */
function viewTest(view){
  testAnsMap=LS.g('pa_test_ans',{});
  const answered=Object.keys(testAnsMap).length;
  const items=BEHAVIOR_TEST.map((it,i)=>{
    const cur=testAnsMap[it.id];
    const opts=TEST_OPTS.map(o=>'<button class="topt'+(cur===o.v?' sel':'')+'" data-v="'+o.v+'" onclick="testAns(\''+it.id+'\','+o.v+')">'+o.t+'</button>').join('');
    return '<div class="titem" data-q="'+it.id+'"><div class="tq"><span class="tn">'+(i+1)+'</span>'+it.q+'</div>'+
      '<div class="topts">'+opts+'</div></div>';
  }).join('');
  view.innerHTML='<div class="test-head">'+
      '<div class="th-ic">📋</div><h2>发育行为测评</h2>'+
      '<p>观察孩子<b>近 1 个月</b>的日常表现，凭第一印象选最像的就好，不用纠结。</p>'+
      '<div class="th-meta">25 题 · 约 3 分钟 · 参考行为观察筛查量表设计</div></div>'+
    '<div class="test-list">'+items+'</div>'+
    '<div class="test-foot"><div class="test-prog" id="testProg">已答 <b>'+answered+'</b> / '+BEHAVIOR_TEST.length+'</div>'+
      '<button class="btn btn-primary btn-block'+(answered>=BEHAVIOR_TEST.length?'':' dis')+'" id="testSubmitBtn" onclick="testSubmit()">查看孩子的脑养成图 →</button>'+
      '<div class="sec-note">⚠ 仅作家长自查参考，不构成医学诊断</div></div>';
  window.scrollTo(0,0);
}
function testAns(id,v){
  testAnsMap[id]=v;
  const item=document.querySelector('.titem[data-q="'+id+'"]');
  if(item){ item.querySelectorAll('.topt').forEach(b=>b.classList.toggle('sel', +b.dataset.v===v)); }
  const n=Object.keys(testAnsMap).length;
  const prog=$('#testProg'); if(prog) prog.innerHTML='已答 <b>'+n+'</b> / '+BEHAVIOR_TEST.length;
  const btn=$('#testSubmitBtn'); if(btn&&n>=BEHAVIOR_TEST.length) btn.classList.remove('dis');
  try{ LS.s('pa_test_ans',testAnsMap); }catch(e){}
}
function testSubmit(){
  if(Object.keys(testAnsMap).length<BEHAVIOR_TEST.length){ toast('还有 '+(BEHAVIOR_TEST.length-Object.keys(testAnsMap).length)+' 题没答完哦'); return; }
  const rep=computeTestReport(testAnsMap);
  LS.s('pa_test_report',rep);
  nav('report');
}
function computeTestReport(ans){
  const score={},cnt={};
  BEHAVIOR_TEST.forEach(it=>{ const v=ans[it.id]||0; score[it.r]=(score[it.r]||0)+v; cnt[it.r]=(cnt[it.r]||0)+1; });
  const regions=Object.keys(score).map(r=>({id:r,score:score[r],max:cnt[r]*3,rate:score[r]/(cnt[r]*3)}))
    .sort((a,b)=>b.score-a.score);
  return {ts:Date.now(),regions};
}

/* ---------- 铲屎官 ---------- */
let catState=null, catFx=null;
function catLoad(){
  try{ catState=JSON.parse(localStorage.getItem('pa_cat'))||null; }catch(e){ catState=null; }
  if(!catState) catState={};
  const d={day:1,pct:0,cardId:'',careNeeds:[],careDone:{},emotionDone:[],dayDone:false};
  catState=Object.assign(d,catState);
  if(!catState.cardId || !Array.isArray(catState.careNeeds) || !catState.careNeeds.length) catGen();
  if(typeof catState.careDone!=='object'||!catState.careDone) catState.careDone={};
  return catState;
}
function catCard(){ return byId(catState.cardId)||PA_CARDS[0]; }
function catGen(){
  const c=PA_CARDS[Math.floor(Math.random()*PA_CARDS.length)];
  catState.cardId=c.id;
  const pool=CAT_ORDER.slice();
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  catState.careNeeds=pool.slice(0,2);
  catState.careDone={}; catState.emotionDone=[]; catState.dayDone=false; catSave();
}
function catSave(){ try{ localStorage.setItem('pa_cat',JSON.stringify(catState)); }catch(e){} }
function catGoldUnlocked(){ return ST.member() || LS.g('pa_gold',[]).includes(catState.cardId); }
function viewCat(view){ catLoad(); renderCat(view); }
function renderCat(a){
  const s=catState, c=catCard();
  const mood=CAT_MOOD[c.id]||{emoji:'😺',feeling:c.name,child:''};
  const tip=CAT_MOOD_TIP[c.id]||'这不是孩子故意气你，是某个脑区还在长大。先接住情绪，再谈事情。';
  const q=CAT_QUIZ[c.id]||{a:'',b:'',c:''};
  const careAll=s.careNeeds.every(k=>s.careDone[k]);
  const copingList=c.coping||[];
  const allDone=careAll;
  const needsHtml=s.careNeeds.map(k=>{ const nd=CAT_ACTIONS.find(x=>x.key===k); const ok=!!s.careDone[k];
    return '<div class="ct-need '+(ok?'ok':'')+'"><span class="ct-need-ic">'+nd.tool+'</span><span>'+nd.need+'</span><span class="ct-need-st">'+(ok?'✅':'⭕')+'</span></div>'; }).join('');
  const tray=CAT_ORDER.map(k=>{ const nd=CAT_ACTIONS.find(x=>x.key===k); const done=!!s.careDone[k];
    return '<button class="ct-prop'+(done?' done':'')+'" data-k="'+k+'" onclick="catUse(this.dataset.k)"><span class="ct-prop-ic">'+nd.tool+'</span><span class="ct-prop-nm">'+nd.toolName+'</span></button>'; }).join('');
  const goldOn=catGoldUnlocked();
  let goldBlock;
  if(goldOn){ goldBlock='<div class="ct-tier gold on"><div class="ct-tier-hd"><span class="ct-rank">🥇</span><b>黄金家长</b><span class="ct-tag free">已解锁</span></div><div class="ct-tier-bd">'+q.c+'</div></div>'; }
  else{ goldBlock='<div class="ct-tier gold lock"><div class="ct-tier-hd"><span class="ct-rank">🥇</span><b>黄金家长</b><span class="ct-tag lock">🔒 付费</span></div>'+
    '<div class="ct-tier-bd ct-tier-lk">智慧家长的「接住孩子」做法，付费解锁，或开通会员免费看全部 👇'+
    '<div class="ct-gold-acts"><button class="btn btn-primary btn-block" onclick="catGoldUnlock()">🔓 解锁黄金家长方案 ¥'+GOLD_PRICE+'</button>'+
    '<button class="btn btn-ghost btn-block" onclick="openPayMember()">开通会员 ¥68/年（看全部黄金方案）</button></div></div></div>'; }
  const emotionSec='<div class="ct-sec ct-emotion"><div class="ct-sec-hd">😺 猫猫今天的情绪</div>'+
    '<div class="ct-emo-line"><span class="ct-emo-ic">'+mood.emoji+'</span><div class="ct-emo-tx">'+
    '<div class="ct-emo-feel">'+mood.feeling+'</div>'+
    (mood.child?'<div class="ct-emo-child">——就像你家孩子'+mood.child+'</div>':'')+'</div></div>'+
    '<div class="ct-cope-hd">🛠 看懂之后，今天可以这样做</div>'+
    '<ol class="ct-cope-list">'+copingList.map(t=>'<li>'+t+'</li>').join('')+'</ol>'+
    '</div>';
  const moodTipSec='<div class="ct-sec ct-moodtip"><div class="ct-sec-hd">💡 心情 · 给铲屎官的一句话</div>'+
    '<div class="ct-mood-insight">'+tip+'</div></div>';
  const rankSec='<div class="ct-sec"><div class="ct-rank-title">🏆 铲屎官段位榜</div>'+
    '<div class="ct-tier bronze"><div class="ct-tier-hd"><span class="ct-rank">🥉</span><b>青铜家长</b><span class="ct-tag">常踩坑</span></div><div class="ct-tier-bd">'+q.a+'</div></div>'+
    '<div class="ct-tier silver"><div class="ct-tier-hd"><span class="ct-rank">🥈</span><b>白银家长</b><span class="ct-tag">有点脑子</span></div><div class="ct-tier-bd">'+q.b+'</div></div>'+
    goldBlock+'</div>';
  let fb=''; if(catFx){ fb='<div class="ct-bubble '+(catFx.ok?'good':'bad')+'">'+catFx.msg+'</div>'; }
  const reactCls=catFx?(catFx.ok?'react-good':'react-bad'):'';
  const comfortCls=allDone?' ct-comfort':'';
  const bottomSec=allDone
    ? '<div class="ct-sec ct-bottom"><button class="btn btn-primary btn-block ct-next" onclick="catNextDay()">开启第 '+(s.day+1)+' 天 →</button></div>'
    : '<div class="ct-sec ct-bottom ct-bottom-lock">🐾 完成上方全部「照顾 + 情绪应对」任务，才能开启新的一天</div>';
  a.innerHTML='<div class="ct-card">'+
    '<div class="ct-top">🐱 铲屎官日常 · 第 <b>'+s.day+'</b> 天</div>'+
    '<div class="ct-cat '+reactCls+comfortCls+'"><img src="'+(CATMAP[c.id]||c.img)+'" alt="'+c.name+'"><span class="ct-mood">'+(allDone?'😌':mood.emoji)+'</span>'+fb+'</div>'+
    '<div class="ct-stage">陪想开长大：<b>'+s.pct+'%</b>（每天 +1%，满级约 100 天）</div>'+
    '<div class="ct-bar"><i style="width:'+s.pct+'%"></i></div>'+
    '<div class="ct-sec ct-care-want"><div class="ct-sec-hd">🐾 今天想被照顾（'+s.careNeeds.length+'件事）</div>'+needsHtml+'</div>'+
    '<div class="ct-sec ct-tools"><div class="ct-sec-hd">🧰 选工具照顾它</div>'+
      '<div class="ct-sec-tip">👇 点中它今天要的工具，它会很舒服😌；拿错它会皱眉哦</div>'+
      '<div class="ct-props">'+tray+'</div></div>'+
    emotionSec+ moodTipSec+ rankSec+
    '<button class="btn btn-ghost btn-block ct-reset" onclick="catReset()">🔄 重置成长</button>'+
    bottomSec+
    '<div class="cat-react" id="catReact"></div></div>';
  window.scrollTo(0,0);
}
function catUse(key){
  const s=catState, a=$('#view');
  const nd=CAT_ACTIONS.find(x=>x.key===key);
  const isNeed=s.careNeeds.includes(key);
  if(isNeed && s.careDone[key]){ toast('它刚用过啦，今天这项照顾好啦~'); showCatReact('😺 它刚用过啦～'); return; }
  catFx={ok:isNeed, msg:isNeed?nd.happy:'呜…现在不是要「'+nd.toolName+'」😣'};
  const msg=catFx.msg;
  renderCat(a);
  showCatReact(msg);
  if(isNeed){ setTimeout(()=>{ s.careDone[key]=true; catSave(); catFx=null; if(s.careNeeds.every(k=>s.careDone[k]))toast('今日照顾全部完成 🎉'); renderCat(a); showCatReact(msg); },1150); }
  else{ setTimeout(()=>{ catFx=null; renderCat(a); showCatReact(msg); },900); }
}
/* 固定在底部的猫猫反应气泡：无论滚到哪里都看得到 */
function showCatReact(msg){
  const el=$('#catReact'); if(!el) return;
  el.textContent=msg;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),1900);
}
function catGoldUnlock(){ openPayGold(catState.cardId); }
function catEmotionDone(idx){
  const s=catState, a=$('#view');
  if(!(s.emotionDone||[]).length) s.emotionDone=[];
  if(s.emotionDone.indexOf(idx)>=0) return;
  s.emotionDone.push(idx); catSave(); toast('接住情绪 +1 💗'); renderCat(a);
}
function catNextDay(){
  catState.day++; if(catState.pct<100) catState.pct++; catGen(); renderCat($('#view'));
  try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  toast('第 '+catState.day+' 天 · 想开成长 '+catState.pct+'% 🐾');
  if(catState.pct%10===0) toast('🎉 想开成长 '+catState.pct+'% · 段位又升啦');
}
function catReset(){
  catState={day:1,pct:0,cardId:'',careNeeds:[],careDone:{},emotionDone:[]};
  catGen(); renderCat($('#view')); toast('已重置 · 想开回到第 1 天');
}

/* ---------- 我的 ---------- */
function viewMe(view){
  const m=LS.g('pa_me',{});
  const name=m.name||'家长朋友';
  const unlockedCount=PA_CARDS.filter(c=>unlocked(c.id)).length;
  const cat=LS.g('pa_cat',{});
  const report=Object.keys(LS.g('pa_quiz_report',{})).length;
  const remind=LS.g('pa_remind',false);
  view.innerHTML=
    '<div class="me-head"><div class="mh-av">'+(name[0]||'家')+'</div>'+
      '<div><div class="mh-n">'+name+'</div><div class="mh-s">'+(ST.member()?'👑 会员 · 已开通':'免费体验中 · 点击升级')+'</div></div>'+
      '<div class="mh-edit" onclick="editName()">编辑</div></div>'+
    (ST.member()?'':'<div class="vip-bar" onclick="nav(\'vip\')"><span class="vb-ic">👑</span><div class="vb-t"><b>开通会员 ¥68/年</b><span>解锁全部脑区应对 + 150 题断案</span></div><span class="vb-btn">去开通</span></div>')+
    '<div class="me-stat"><div class="ms"><div class="mv">'+unlockedCount+'</div><div class="ml">已解锁脑区</div></div>'+
      '<div class="ms"><div class="mv">'+(cat.pct||0)+'%</div><div class="ml">铲屎官成长</div></div>'+
      '<div class="ms"><div class="mv">'+report+'</div><div class="ml">已测脑区</div></div></div>'+
    '<div class="list-x">'+
      '<div class="list-row" onclick="nav(\'join\')"><span class="lr-ic">💬</span><div class="lr-t">加群领《脑科学育儿 7 天课》</div><span class="lr-go">›</span></div>'+
      '<div class="list-row" onclick="openShare()"><span class="lr-ic">📤</span><div class="lr-t">生成分享海报（带码引流）</div><span class="lr-go">›</span></div>'+
      '<div class="list-row" onclick="nav(\'report\')"><span class="lr-ic">📊</span><div class="lr-t">我的脑养成图</div><span class="lr-go">›</span></div>'+
      '<div class="list-row" onclick="nav(\'test\')"><span class="lr-ic">📋</span><div class="lr-t">发育行为测评（约 3 分钟）</div><span class="lr-go">›</span></div>'+
      '<div class="list-row" onclick="toggleRemind()"><span class="lr-ic">🔔</span><div class="lr-t">每日撸猫提醒</div>'+
        '<div class="lr-sw '+(remind?'on':'')+'" id="remindSw"></div></div>'+
      '<div class="list-row" onclick="nav(\'vip\')"><span class="lr-ic">👑</span><div class="lr-t">会员与权益</div><span class="lr-go">›</span></div>'+
    '</div>'+
    '<div class="list-x"><div class="list-row" onclick="toast(\'已在 V1 经典版保留你的使用习惯\')"><span class="lr-ic">📌</span><div class="lr-t">版本说明</div><span class="lr-go">V2 全新版 ›</span></div></div>'+
    '<div class="sec-note">本机数据保存在你的浏览器本地 · 清除缓存会重置进度</div>';
  window.scrollTo(0,0);
}
function editName(){
  const m=LS.g('pa_me',{});
  const v=prompt('怎么称呼你？', m.name||'家长朋友');
  if(v){ m.name=v.trim()||'家长朋友'; LS.s('pa_me',m); viewMe($('#view')); }
}
function toggleRemind(){
  let r=LS.g('pa_remind',false);
  if(!r){
    if('Notification' in window && Notification.permission==='default'){
      Notification.requestPermission().then(p=>{ if(p==='granted'){ LS.s('pa_remind',true); toast('已开启 · 每天来撸猫提醒 🔔'); viewMe($('#view')); } else { toast('权限未授权，无法开启提醒'); } });
    } else { LS.s('pa_remind',true); toast('已开启（演示）· 每天来撸猫提醒 🔔'); viewMe($('#view')); }
  } else { LS.s('pa_remind',false); toast('已关闭每日提醒'); viewMe($('#view')); }
}

/* ---------- 会员页 ---------- */
function viewVip(view){
  view.innerHTML='<div class="vip-hero"><div class="vh-crown">👑</div><h1>脑宇宙家长会员</h1>'+
    '<div class="vprice">¥68 <small>/ 年</small></div>'+
    '<div class="vnote">把整副牌的「可以这样做」装进口袋</div></div>'+
    '<div class="benefit"><div class="bi">🧠</div><div><b>全部 17 个脑区应对方案</b><span>每个脑区的错误/正确看待 + 具体话术与步骤</span></div></div>'+
    '<div class="benefit"><div class="bi">🧩</div><div><b>情景题库全 3 关 150 题</b><span>初级/进阶/高级，永久解锁，随时练</span></div></div>'+
    '<div class="benefit"><div class="bi">🏆</div><div><b>铲屎官黄金家长方案</b><span>每只猫的情绪专属 · 智慧家长接法</span></div></div>'+
    '<div class="benefit"><div class="bi">🆕</div><div><b>每月新增主题卡</b><span>考试焦虑、早恋、网瘾、二胎…持续更新</span></div></div>'+
    '<div class="title" style="margin-top:20px">🆕 持续更新的主题牌库 <small>会员免费解锁全部</small></div>'+
    '<div class="list-x">'+PA_DECKS.map(d=>'<div class="list-row" style="cursor:default"><span class="lr-ic">'+d.icon+'</span><div class="lr-t"><b>'+d.name+'</b><br><span style="font-size:12px;color:#9389A3">'+d.desc+'</span></div>'+
      '<span class="lr-go" style="color:'+(d.status==='live'?'var(--green)':'#C9BFD6')+'">'+(d.status==='live'?'已上线':'规划中')+'</span></div>').join('')+'</div>'+
    (ST.member()?'<div class="card-x tint" style="margin-top:16px;text-align:center"><b style="color:var(--brand2);font-size:15px">👑 你已是会员</b><p style="font-size:13px;color:#4A4156;margin:6px 0 0">全部内容已解锁，尽情使用～</p></div>'
      :'<button class="btn btn-gold btn-block" style="margin-top:16px" onclick="openPayMember()">开通会员 ¥68/年</button>')+
    '<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="nav(\'home\')">返回首页</button>';
  window.scrollTo(0,0);
}

/* ---------- 加群页（私域引流） ---------- */
function viewJoin(view){
  const qr = (typeof APP_QR!=='undefined' && APP_QR) ? '<img src="'+APP_QR+'" alt="群二维码">' : '<div class="qr-ph">二维码占位<br>部署真实域名后自动生成</div>';
  view.innerHTML='<div class="join-wrap"><div class="jw-ic">💬</div><h2>加群领《脑科学育儿 7 天课》</h2>'+
    '<p>每天一条脑区养育干货 + 群内答疑。把卡牌上的「可以这样做」，变成你每天的陪练。</p>'+
    '<div class="qr-box">'+qr+'</div>'+
    '<div class="join-steps"><div class="js"><span class="n">1</span><div>长按上方二维码，识别进群（演示二维码，上线替换为真实群码）</div></div>'+
    '<div class="js"><span class="n">2</span><div>群公告领取《7 天课》，每天 1 个脑区 + 1 个实操</div></div>'+
    '<div class="js"><span class="n">3</span><div>遇到具体难题，群里 @ 顾问，或回 App 查对应脑区手册</div></div></div>'+
    '<button class="btn btn-primary btn-block" style="margin-top:16px" onclick="nav(\'home\')">返回首页</button></div>';
  window.scrollTo(0,0);
}

/* ---------- 分享海报（引流） ---------- */
function openShare(id){
  const c=id?byId(id):(lastCard||PA_CARDS[0]);
  const cv=$('#posterCv'); if(!cv) return;
  const W=680,H=1040; cv.width=W; cv.height=H;
  const ctx=cv.getContext('2d');
  const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#FF8A65'); g.addColorStop(.5,'#FF7A59'); g.addColorStop(1,'#7C6CF0');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.12)';
  for(let i=0;i<40;i++){ ctx.beginPath(); ctx.arc(Math.random()*W,Math.random()*H,Math.random()*3+1,0,7); ctx.fill(); }
  ctx.fillStyle='#fff'; ctx.textAlign='center';
  ctx.font='900 46px PingFang SC, sans-serif'; ctx.fillText('脑宇宙 · 读懂青春期大脑',W/2,86);
  ctx.font='500 24px PingFang SC, sans-serif'; ctx.fillText('17 个脑区，一只猫一种情绪',W/2,128);
  // 猫图
  const img=new Image();
  const src=(CATMAP[c.id]||c.img);
  img.onload=()=>{ const s=300; ctx.drawImage(img,(W-s)/2,180,s,s);
    ctx.fillStyle='#fff'; ctx.font='800 38px PingFang SC, sans-serif'; ctx.fillText(c.name,W/2,540);
    ctx.font='500 22px PingFang SC, sans-serif'; ctx.fillText(c.en+' · '+c.code,W/2,576);
    ctx.font='600 26px PingFang SC, sans-serif';
    wrapText(ctx,'当孩子「'+(c.puberty&&c.puberty[0]?c.puberty[0]:'情绪起伏')+'」，是 '+c.name+' 在主导',W/2,628,W-120,34);
    // 白卡
    ctx.fillStyle='#fff'; roundRect(ctx,60,690,W-120,220,22); ctx.fill();
    ctx.fillStyle='#2B2438'; ctx.textAlign='left'; ctx.font='800 26px PingFang SC, sans-serif';
    ctx.fillText('家长容易误解：',90,740);
    ctx.fillStyle='#EF5B6B'; ctx.font='500 22px PingFang SC, sans-serif';
    wrapText(ctx, c.wrongView.slice(0,40),90,778,W-180,30);
    ctx.fillStyle='#2B2438'; ctx.font='800 26px PingFang SC, sans-serif';
    ctx.fillText('正确看待：',90,860);
    ctx.fillStyle='#22B07D'; ctx.font='500 22px PingFang SC, sans-serif';
    wrapText(ctx, c.parentView.slice(0,40),90,898,W-180,30);
    // 二维码
    const qr=new Image();
    const qsrc=(typeof APP_QR!=='undefined'&&APP_QR)?APP_QR:'';
    qr.onload=()=>{ ctx.fillStyle='#fff'; roundRect(ctx,W/2-90,930,180,90,14); ctx.fill();
      ctx.drawImage(qr,W/2-70,940,140,70);
      ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='600 22px PingFang SC, sans-serif';
      ctx.fillText('扫码免费看完整应对方案',W/2,1030);
    };
    if(qsrc) qr.src=qsrc; else { ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.font='600 22px PingFang SC, sans-serif'; ctx.fillText('扫码免费看完整应对方案',W/2,975); }
    $('#posterMask').classList.add('show');
  };
  img.src=src;
}
function wrapText(ctx,text,x,y,maxW,lh){
  const chars=text.split(''); let line=''; let yy=y;
  for(const ch of chars){ const test=line+ch; if(ctx.measureText(test).width>maxW){ ctx.fillText(line,x,yy); line=ch; yy+=lh; } else line=test; }
  ctx.fillText(line,x,yy);
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function closePoster(){ $('#posterMask').classList.remove('show'); }

/* ---------- 支付浮层 ---------- */
let pending={kind:null,plan:null,L:null,G:null,id:null,from:null};
function openPay(id){ pending={kind:'coping',plan:'coping',id:id,from:'detail'}; renderPay(); $('#mask').classList.add('show'); }
function openPayBundle(L){ pending={kind:'bundle',plan:'bundle',L:L,from:'quiz'}; renderPay(); $('#mask').classList.add('show'); }
function openPayMember(){ pending={kind:'member',plan:'member',from:'vip'}; renderPay(); $('#mask').classList.add('show'); }
function openPayGold(cardId){ pending={kind:'gold',plan:'gold',cardId:cardId,from:'cat'}; renderPay(); $('#mask').classList.add('show'); }
function closePay(){ const m=$('#mask'); if(m) m.classList.remove('show'); }
function renderPay(){
  if(pending.kind==='member'){
    $('#sheet').innerHTML='<h3>开通脑宇宙家长会员</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+
      '<div class="plan sel"><div><div class="pn">脑宇宙家长会员</div><div class="pd">全部 17 脑区应对方案 + 3 关 150 题情景题库 · 一年</div></div><div class="pp">¥68/年</div></div>'+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥68（模拟）</button></div>'+
      '<div class="sim-note">会员一年内畅玩全部内容，平均一天不到 2 毛钱</div>'; return;
  }
  if(pending.kind==='bundle'){
    const L=pending.L, lv=QUIZ_LEVELS[L].name, total=quizTotalQ(L);
    const single='<div class="plan '+(pending.plan==='bundle'?'sel':'')+'" onclick="selPlan(\'bundle\')"><div><div class="pn">解锁'+lv+'全部题库，共 '+total+' 题</div><div class="pd">'+QUIZ_LEVELS[L].groups.length+' 组情景题 · 一次性永久解锁</div></div><div class="pp">¥'+quizPrice(L)+'</div></div>';
    const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\'member\')"><div><div class="pn">开通会员</div><div class="pd">全部 3 关 150 题 + 17 脑区应对方案 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
    $('#sheet').innerHTML='<h3>解锁情景题库</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+single+member+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:quizPrice(L))+'（模拟）</button></div>'+
      '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>'; return;
  }
  if(pending.kind==='gold'){
    const c=byId(pending.cardId);
    const gold='<div class="plan '+(pending.plan==='gold'?'sel':'')+'" onclick="selPlan(\'gold\')"><div><div class="pn">解锁「'+c.name+'」黄金家长方案</div><div class="pd">今日情绪专属 · 智慧家长接法 · 永久查看</div></div><div class="pp">¥'+GOLD_PRICE+'</div></div>';
    const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\'member\')"><div><div class="pn">开通会员</div><div class="pd">全部黄金家长方案 + 全部题库 + 17 脑区应对 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
    $('#sheet').innerHTML='<h3>解锁黄金家长段位</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+gold+member+
      '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:GOLD_PRICE)+'（模拟）</button></div>'+
      '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>'; return;
  }
  const single='<div class="plan '+(pending.plan==='coping'?'sel':'')+'" onclick="selPlan(\'coping\')"><div><div class="pn">单条购买</div><div class="pd">解锁「'+byId(pending.id).name+'」应对方案</div></div><div class="pp">¥6</div></div>';
  const member='<div class="plan '+(pending.plan==='member'?'sel':'')+'" onclick="selPlan(\'member\')"><div><div class="pn">开通会员</div><div class="pd">全部 17 个脑区 · 一年 ¥68</div></div><div class="pp">¥68/年</div></div>';
  $('#sheet').innerHTML='<h3>解锁应对方案</h3><div class="sub">模拟支付 · 真实上线接入微信/支付宝</div>'+single+member+
    '<div class="pay-confirm"><button class="btn btn-primary btn-block" onclick="confirmPay()">确认支付 ¥'+(pending.plan==='member'?68:6)+'（模拟）</button></div>'+
    '<div class="sim-note">演示环境 · 真实上线时接入微信/支付宝支付</div>';
}
function selPlan(p){ pending.plan=p; renderPay(); }
function confirmPay(){
  $('#mask').classList.remove('show');
  if(pending.plan==='member'){ LS.s('pa_member',true); toast('支付成功（模拟）· 会员已开通'); return afterPay(); }
  if(pending.kind==='bundle'){ const o=LS.g('pa_quiz_bundle',[]); if(!o.includes(pending.L))o.push(pending.L); LS.s('pa_quiz_bundle',o); toast('支付成功（模拟）· 已解锁'+QUIZ_LEVELS[pending.L].name+'全部题库'); return afterPay(); }
  if(pending.kind==='gold'){ const o=LS.g('pa_gold',[]); if(!o.includes(pending.cardId))o.push(pending.cardId); LS.s('pa_gold',o); toast('支付成功（模拟）· 已解锁黄金家长方案'); return afterPay(); }
  if(pending.kind==='coping'){ const b=ST.bought(); if(pending.id&&!b.includes(pending.id))b.push(pending.id); LS.s('pa_bought',b); toast('支付成功（模拟）· 已解锁'); return viewDetail($('#view'),pending.id); }
}
function afterPay(){
  if(pending.from==='quiz'){ return quizRenderSelect($('#quizArea')); }
  if(pending.from==='detail'){ return viewDetail($('#view'),pending.id); }
  if(pending.from==='cat'){ return viewCat($('#view')); }
  return viewVip($('#view'));
}

/* ---------- 英文发音（有道清晰真人音，无回声） ---------- */
let _au=null,_fell=false;
function speakEn(t){
  if(!t)return;
  const url="https://dict.youdao.com/dictvoice?audio="+encodeURIComponent(t)+"&type=2";
  try{
    _fell=false; const a=new Audio(url); a.volume=1; a.play().catch(()=>{});
    a.onerror=()=>{ if(_fell)return; _fell=true; fallbackSpeak(t); };
  }catch(e){ fallbackSpeak(t); }
}
function fallbackSpeak(t){
  try{ if(window.speechSynthesis){ const u=new SpeechSynthesisUtterance(t); u.lang='en-US'; u.rate=.95; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } }catch(e){}
}

/* ---------- 新手引导 ---------- */
function maybeOnboard(){
  if(LS.g('pa_ob',false)) return;
  const steps=[
    {ic:'🧠',t:'读懂青春期的大脑',p:'17 个脑区，一只叫「想开」的猫一种情绪。先看孩子怎么了，再学怎么接住他。'},
    {ic:'🕵️',t:'情境断案练眼力',p:'每道题都对应一个脑区，帮你「看见」孩子行为背后的大脑原因。'},
    {ic:'🐱',t:'铲屎官每天撸猫',p:'每天照顾 + 接住猫猫情绪，陪它长大，也陪自己练习做情绪稳定的家长。'}
  ];
  let i=0;
  const card=$('#obCard');
  function renderStep(){
    const s=steps[i];
    card.innerHTML='<div class="ob-ic">'+s.ic+'</div><h3>'+s.t+'</h3><p>'+s.p+'</p>'+
      '<div class="ob-dots">'+steps.map((_,k)=>'<i class="'+(k===i?'on':'')+'"></i>').join('')+'</div>'+
      (i<steps.length-1
        ? '<button class="btn btn-primary ob-btn" onclick="obNext()">下一步</button><span class="ob-skip" onclick="obDone()">跳过</span>'
        : '<button class="btn btn-primary ob-btn" onclick="obDone()">开始体验 →</button>');
  }
  window.obNext=()=>{ i++; renderStep(); };
  window.obDone=()=>{ LS.s('pa_ob',true); $('#ob').classList.remove('show'); };
  renderStep();
  $('#ob').classList.add('show');
}

/* ---------- 启动 ---------- */
window.addEventListener('hashchange', route);
['nav','goBack','render','viewHome','viewBrain','viewDetail','viewQuiz','viewReport','viewTest','viewCat','viewMe','viewVip','viewJoin',
 'openDraw','closePay','tryUnlock','openShare','closePoster','openPay','openPayBundle','openPayMember','openPayGold',
 'catUse','catEmotionDone','catNextDay','catReset','catGoldUnlock','showCatReact','quizLevel','quizStart','quizAns','quizNext','quizBack',
 'testAns','testSubmit','quizBuyLevelHint','selPlan','confirmPay','toggleRemind','editName'].forEach(fn=>{ window[fn]=eval(fn); });

if(deepCard){ location.hash='card/'+deepCard; }
else if(!location.hash) location.hash='home';
maybeOnboard();
route();
