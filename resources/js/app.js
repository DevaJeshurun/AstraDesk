'use strict';
const ST={cache:{},panel:'dashboard',settings:{refresh:10,theme:'astra',dock:'free',opacity:92,width:440,githubToken:'',winX:-1,winY:-1,notif:'all'},netHist:{up:Array(30).fill(0),dn:Array(30).fill(0)},netCtx:null,pinned:false,refreshTimer:null,sysTimer:null,notifications:[],breakingItems:[]};
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);
function ago(d){const s=(Date.now()-new Date(d))/1000;if(s<60)return`${~~s}s ago`;if(s<3600)return`${~~(s/60)}m ago`;if(s<86400)return`${~~(s/3600)}h ago`;return`${~~(s/86400)}d ago`;}
function fmtBytes(b){if(b<1024)return b.toFixed(0)+' B/s';if(b<1048576)return(b/1024).toFixed(1)+' KB/s';return(b/1048576).toFixed(2)+' MB/s';}
const _tq={queue:[],active:0,max:5};
function toast(msg,type='info',ms=3000){
  if(_tq.active>=_tq.max){_tq.queue.push({msg,type,ms});return;}
  _showToast(msg,type,ms);
}
function _showToast(msg,type,ms){
  _tq.active++;
  const t=document.createElement('div');t.className=`toast ${type}`;
  t.textContent=msg;
  const container=$('toasts');if(!container)return;
  container.appendChild(t);
  setTimeout(()=>{
    t.style.animation='slideOut 0.3s ease forwards';
    setTimeout(()=>{
      t.remove();_tq.active--;
      if(_tq.queue.length>0){const n=_tq.queue.shift();_showToast(n.msg,n.type,n.ms);}
    },300);
  },ms);
}
function cacheGet(k){const e=ST.cache[k];return(e&&Date.now()-e.ts<ST.settings.refresh*60000)?e.data:null;}
function cacheSet(k,d){ST.cache[k]={ts:Date.now(),data:d};}
function openLink(url){if(url){if(typeof Neutralino!=='undefined')Neutralino.os.open(url);else window.open(url,'_blank');}}
function isBreaking(title){const t=title.toLowerCase();return CFG.BREAKING_KEYWORDS.some(k=>t.includes(k));}
function isTrending(title){const t=title.toLowerCase();return CFG.TRENDING_KEYWORDS.some(k=>t.includes(k));}
function dedupe(items){const seen=new Set();return items.filter(i=>{const k=(i.title||'').toLowerCase().slice(0,60);if(seen.has(k))return false;seen.add(k);return true;});}
function addNotification(msg,level='low',url=''){const n={msg,level,url,ts:Date.now()};ST.notifications.unshift(n);if(ST.notifications.length>50)ST.notifications.pop();updateNotifBadge();if(level==='critical'&&ST.settings.notif!=='off')toast(`üö® ${msg}`,'critical',5000);else if(level==='medium'&&ST.settings.notif==='all')toast(`‚ö† ${msg}`,'warning',4000);}
function updateNotifBadge(){const b=$('breaking-badge');if(!b)return;const criticals=ST.notifications.filter(n=>n.level==='critical').length;b.classList.toggle('visible',criticals>0);}
function parseRSSXML(xmlText){const cleaned=xmlText.replace(/<\?xml[^?]*\?>/g,'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1');const parser=new DOMParser();const doc=parser.parseFromString(cleaned,'text/xml');const isAtom=!!doc.querySelector('feed');const nodes=[...doc.querySelectorAll(isAtom?'entry':'item')];function getLink(n){const linkEl=n.querySelector('link');if(!linkEl)return'';return linkEl.getAttribute('href')||linkEl.textContent?.trim()||'';}
function getDesc(n){const candidates=[...n.children].filter(c=>['description','summary','content','encoded','subtitle'].includes(c.localName));return(candidates[0]?.textContent?.trim()||'').replace(/<[^>]*>/g,'').trim();}
function getDate(n){const candidates=[...n.children].filter(c=>['pubDate','published','updated','date','modified'].includes(c.localName));return candidates[0]?.textContent?.trim()||'';}
return nodes.slice(0,20).map(n=>({title:n.querySelector('title')?.textContent?.trim()||'',link:getLink(n),pubDate:getDate(n),description:getDesc(n)})).filter(i=>i.title.length>0);}
async function fetchRSS(url,key){const hit=cacheGet(key);if(hit)return hit;async function tryProxy(fn){const r=await fetch(fn(url),{signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);const ct=r.headers.get('content-type')||'';let xml;if(ct.includes('json')){const j=await r.json();xml=j.contents||j.data||'';}else{xml=await r.text();}if(!xml||xml.length<50)throw new Error('empty');const items=parseRSSXML(xml);if(!items.length)throw new Error('no items');return items;}
try{const items=await Promise.any(CFG.PROXIES.map(fn=>tryProxy(fn)));cacheSet(key,items);return items;}catch{return cacheGet(key)||[];}}
function makeFI(item,src,classes=''){const li=document.createElement('li');const breaking=isBreaking(item.title);const trending=isTrending(item.title);li.className=`fi${breaking?' breaking':''}${classes?' '+classes:''}`;li.innerHTML=`<div class="fi-title">${item.title||''}</div><div class="fi-meta"><span class="fi-src">${src}</span><span>${item.pubDate?ago(item.pubDate):''}</span>${breaking?'<span class="ac-tag tag-breaking">BREAKING</span>':trending?'<span class="ac-tag tag-trending">TRENDING</span>':''}</div>`;li.onclick=()=>openLink(item.link);if(breaking)addNotification(item.title,'critical',item.link);return li;}
function makeAC(item,src,idx){const d=document.createElement('div');d.className='ac';d.style.animationDelay=`${idx*0.04}s`;const desc=(item.description||'').slice(0,140);const breaking=isBreaking(item.title);const trending=isTrending(item.title);d.innerHTML=`<div class="ac-source">${src}${breaking?'<span class="ac-tag tag-breaking">BREAKING</span>':trending?'<span class="ac-tag tag-trending">TRENDING</span>':''}</div><div class="ac-title">${item.title||''}</div>${desc?`<div class="ac-desc">${desc}</div>`:''}<div class="ac-date">${item.pubDate?ago(item.pubDate):''}</div>`;d.onclick=()=>openLink(item.link);if(breaking)addNotification(item.title,'critical',item.link);return d;}
function skeleton(n=3){return Array(n).fill(0).map(()=>`<div class="fi" style="gap:6px"><div class="skel w90"></div><div class="skel w50" style="margin-top:4px"></div></div>`).join('');}
async function loadSection(feeds,listId,countId){const list=$(listId);if(!list)return;list.innerHTML=skeleton(3);const results=await Promise.allSettled(feeds.map(f=>fetchRSS(f.url,f.key).then(items=>items.map(it=>({...it,_src:f.name})))));const all=dedupe(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));const count=$(countId);if(count)count.textContent=all.length;list.innerHTML='';all.slice(0,5).forEach(it=>list.appendChild(makeFI(it,it._src)));}
async function loadDash(){await Promise.allSettled([loadSection(CFG.FEEDS.world,'dash-world','count-world'),loadSection(CFG.FEEDS.india,'dash-india','count-india'),loadSection(CFG.FEEDS.tech,'dash-tech','count-tech'),loadSection(CFG.FEEDS.gaming,'dash-gaming','count-gaming'),loadSection(CFG.FEEDS.cyber,'dash-cyber','count-cyber'),loadSection(CFG.FEEDS.science,'dash-space','count-space')]);updateStatusBar();loadBreakingBanner();}
async function loadBreakingBanner(){const allFeeds=[...CFG.FEEDS.world,...CFG.FEEDS.india,...CFG.FEEDS.cyber];const results=await Promise.allSettled(allFeeds.slice(0,6).map(f=>fetchRSS(f.url,f.key)));const all=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);const breaking=all.find(i=>isBreaking(i.title));const banner=$('breaking-banner');if(banner&&breaking){$('breaking-text').textContent=breaking.title;banner.style.display='flex';banner.onclick=()=>openLink(breaking.link);}}
async function loadPanel(listId,feeds,srcFilter='all'){const el=$(listId);if(!el)return;el.innerHTML=skeleton(5);const filtered=srcFilter==='all'?feeds:feeds.filter(f=>f.key===srcFilter);const results=await Promise.allSettled(filtered.map(f=>fetchRSS(f.url,f.key).then(items=>items.map(it=>({...it,_src:f.name})))));const all=dedupe(results.flatMap(r=>r.status==='fulfilled'?r.value:[]));all.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));el.innerHTML='';all.forEach((it,i)=>el.appendChild(makeAC(it,it._src,i)));if(!all.length)el.innerHTML='<div class="fi"><div class="fi-title" style="color:var(--muted)">No items. Check connection.</div></div>';}
async function loadGitHub(){const el=$('list-github');if(!el)return;el.innerHTML=skeleton(4);const hit=cacheGet('gh');let repos=hit;if(!repos){try{const d=new Date();d.setDate(d.getDate()-7);const headers={Accept:'application/vnd.github.v3+json'};if(ST.settings.githubToken)headers.Authorization=`token ${ST.settings.githubToken}`;const r=await fetch(CFG.GITHUB.replace('__DATE__',d.toISOString().split('T')[0]),{headers,signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('rate limited');repos=(await r.json()).items||[];cacheSet('gh',repos);}catch(e){el.innerHTML=`<div class="fi"><div class="fi-title" style="color:var(--muted)">${e.message}. Add GitHub token in Config.</div></div>`;return;}}
el.innerHTML='';repos.slice(0,6).forEach((r,i)=>{const c=document.createElement('div');c.className='repo-card';c.style.animationDelay=`${i*0.05}s`;c.innerHTML=`<div class="repo-name">${r.full_name}</div><div class="repo-desc">${(r.description||'‚Äì').slice(0,90)}</div><div class="repo-meta"><span>‚≠ê ${(r.stargazers_count||0).toLocaleString()}</span><span class="repo-lang">${r.language||'‚Äì'}</span></div>`;c.onclick=()=>openLink(r.html_url);el.appendChild(c);});}
async function loadHN(){const list=$('list-hn');if(!list)return;list.innerHTML=skeleton(4);const hit=cacheGet('hn');let ids=hit;if(!ids){try{const r=await fetch(CFG.HN+'topstories.json',{signal:AbortSignal.timeout(6000)});ids=(await r.json()).slice(0,10);cacheSet('hn',ids);}catch{list.innerHTML='<li class="fi"><div class="fi-title" style="color:var(--muted)">HN unavailable.</div></li>';return;}}
list.innerHTML='';const items=await Promise.allSettled(ids.slice(0,8).map(id=>fetch(`${CFG.HN}item/${id}.json`,{signal:AbortSignal.timeout(5000)}).then(r=>r.json())));items.forEach(({status,value},i)=>{if(status!=='fulfilled'||!value)return;const li=document.createElement('li');li.className='fi';li.style.animationDelay=`${i*0.05}s`;li.innerHTML=`<div class="fi-title">${value.title}</div><div class="fi-meta"><span class="fi-src">HN</span><span>‚ñ≤ ${value.score}</span><span>${value.descendants||0} cmts</span></div>`;li.onclick=()=>openLink(value.url||`https://news.ycombinator.com/item?id=${value.id}`);list.appendChild(li);});}
async function loadSO(){const list=$('list-so');if(!list)return;list.innerHTML=skeleton(3);const hit=cacheGet('so');let qs=hit;if(!qs){try{const r=await fetch(CFG.SO,{signal:AbortSignal.timeout(6000)});qs=(await r.json()).items||[];cacheSet('so',qs);}catch{list.innerHTML='<li class="fi"><div class="fi-title" style="color:var(--muted)">SO unavailable.</div></li>';return;}}
list.innerHTML='';qs.slice(0,5).forEach((q,i)=>{const li=document.createElement('li');li.className='fi';li.style.animationDelay=`${i*0.05}s`;li.innerHTML=`<div class="fi-title">${q.title}</div><div class="fi-meta"><span class="fi-src">SO</span><span>‚ñ≤ ${q.score}</span><span>${q.answer_count} answers</span><span>${q.tags?.slice(0,2).join(', ')}</span></div>`;li.onclick=()=>openLink(q.link);list.appendChild(li);});}
async function loadMarketStrip(){try{const r=await fetch('https://query1.finance.yahoo.com/v8/finance/chart/BTC-USD?interval=1d&range=1d',{signal:AbortSignal.timeout(5000)});if(r.ok){const j=await r.json();const price=j?.chart?.result?.[0]?.meta?.regularMarketPrice;if(price){const el=$('mv-btc');if(el){el.textContent='$'+price.toLocaleString('en-US',{maximumFractionDigits:0});el.className='mt-val up';}}}}catch{}
const setTile=(id,val,cls)=>{const el=$(id);if(el){el.textContent=val;el.className='mt-val '+cls;}};
setTile('mv-sensex','74,500 ‚ñ≤','up');setTile('mv-nifty','22,600 ‚ñ≤','up');setTile('mv-gold','‚Çπ72,000','');
}

function pollSys(){
  const cpu=Math.round(4+Math.random()*20);
  const ram=Math.round(35+Math.random()*28);
  const gpu=Math.round(10+Math.random()*40);
  const disk=Math.round(20+Math.random()*15);
  const up=Math.random()*800*1024;
  const dn=Math.random()*3*1024*1024;
  const cpuTemp=Math.round(45+Math.random()*25);
  const gpuTemp=Math.round(40+Math.random()*30);
  const fan=Math.round(1200+Math.random()*1500);

  const setEl=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  const setW=(id,w)=>{const e=$(id);if(e)e.style.width=w+'%';};

  setW('strip-cpu-bar',cpu);setW('strip-ram-bar',ram);
  setEl('strip-cpu-val',cpu+'%');setEl('strip-ram-val',ram+'%');
  setEl('strip-net-up',fmtBytes(up));setEl('strip-net-dn',fmtBytes(dn));

  setRing('ring-cpu',cpu,201);setRing('ring-ram',ram,201);
  setRing('ring-gpu',gpu,201);setRing('ring-disk',disk,201);
  setEl('ring-cpu-val',cpu+'%');setEl('ring-ram-val',ram+'%');
  setEl('ring-gpu-val',gpu+'%');setEl('ring-disk-val',disk+'%');
  setEl('sys-net-up',fmtBytes(up));setEl('sys-net-dn',fmtBytes(dn));

  const tempEl=$('sys-cpu-temp');
  if(tempEl){tempEl.textContent=cpuTemp+' ∞C';tempEl.className='sdt-val '+(cpuTemp>80?'hot':cpuTemp>65?'warm':'');}
  const gtempEl=$('sys-gpu-temp');
  if(gtempEl){gtempEl.textContent=gpuTemp+' ∞C';gtempEl.className='sdt-val '+(gpuTemp>85?'hot':gpuTemp>70?'warm':'');}
  setEl('sys-fan',fan.toLocaleString()+' RPM');

  if(navigator.getBattery){navigator.getBattery().then(b=>{const bel=$('sys-battery');if(bel)bel.textContent=Math.round(b.level*100)+'%'+(b.charging?' ?':'');}).catch(()=>{});}

  checkSysAlerts(cpuTemp,gpuTemp,ram);

  ST.netHist.up.push(up);ST.netHist.up.shift();
  ST.netHist.dn.push(dn);ST.netHist.dn.shift();
  drawNet();
}

function checkSysAlerts(cpuTemp,gpuTemp,ram){
  const banner=$('sys-alert-banner');if(!banner)return;
  const alerts=[];
  if(cpuTemp>85)alerts.push('?? CPU temp critical: '+cpuTemp+'∞C');
  if(gpuTemp>90)alerts.push('?? GPU temp critical: '+gpuTemp+'∞C');
  if(ram>90)alerts.push('? RAM usage critical: '+ram+'%');
  if(alerts.length){banner.textContent=alerts.join(' | ');banner.style.display='block';alerts.forEach(a=>addNotification(a,'critical'));}
  else{banner.style.display='none';}
}

function setRing(id,pct,circ){const el=$(id);if(!el)return;el.setAttribute('stroke-dasharray',`${(pct/100)*circ} ${circ}`);}

function drawNet(){
  const canvas=$('net-canvas');if(!canvas||!ST.netCtx)return;
  const ctx=ST.netCtx;const W=canvas.offsetWidth||356,H=70;
  canvas.width=W;ctx.clearRect(0,0,W,H);
  const max=Math.max(...ST.netHist.up,...ST.netHist.dn,1);
  const step=W/(ST.netHist.up.length-1);
  function line(data,color){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.shadowColor=color;ctx.shadowBlur=5;data.forEach((v,i)=>{const x=i*step,y=H-(v/max)*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.shadowBlur=0;}
  const acc=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#00d4ff';
  const acc2=getComputedStyle(document.documentElement).getPropertyValue('--accent2').trim()||'#7c3aed';
  line(ST.netHist.up,acc);line(ST.netHist.dn,acc2);
}

function initNetCanvas(){const c=$('net-canvas');if(c&&!ST.netCtx)ST.netCtx=c.getContext('2d');}

async function loadOSInfo(){
  try{
    $('os-plat').textContent=navigator.platform||'Windows';
    $('os-lang').textContent=navigator.language||'en';
    $('os-scr').textContent=`${screen.width}x${screen.height}`;
    $('os-cores').textContent=navigator.hardwareConcurrency||'ñ';
    const mem=navigator.deviceMemory;if(mem&&$('os-mem'))$('os-mem').textContent=mem+' GB';
    if(typeof Neutralino!=='undefined'){
      const dp=await Neutralino.computer?.getDisplays?.().catch(()=>[])||[];
      const d=dp[0];if(d?.resolution&&$('os-scr'))$('os-scr').textContent=`${d.resolution.width}x${d.resolution.height}`;
    }
  }catch{}
}

function updateStatusBar(){const sb=$('sb-updated');if(sb)sb.textContent='Updated '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}

function tickClock(){
  const now=new Date();
  const t=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const d=now.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});
  const setEl=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
  setEl('clock-time',t);setEl('clock-date',d);setEl('hero-time',t);setEl('hero-date',d);
}

function switchPanel(name){
  ST.panel=name;
  $$('.panel').forEach(p=>p.classList.remove('active'));
  $$('.tab').forEach(t=>t.classList.remove('active'));
  const panel=$(`panel-${name}`),tab=document.querySelector(`.tab[data-panel="${name}"]`);
  if(panel)panel.classList.add('active');if(tab)tab.classList.add('active');
  const filterEl=$(`filter-${name}`);
  if(filterEl){filterEl.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));const ac=filterEl.querySelector('[data-src="all"]');if(ac)ac.classList.add('active');}
  switch(name){
    case 'dashboard': loadDash();break;
    case 'tech':      loadPanel('list-tech',CFG.FEEDS.tech);break;
    case 'gaming':    loadPanel('list-gaming',CFG.FEEDS.gaming);break;
    case 'world':     loadPanel('list-world',CFG.FEEDS.world);break;
    case 'india':     loadPanel('list-india',CFG.FEEDS.india);break;
    case 'tamilnadu': loadPanel('list-tn',CFG.FEEDS.tamilnadu);break;
    case 'science':   loadPanel('list-science',CFG.FEEDS.science);break;
    case 'cyber':     loadPanel('list-cyber',CFG.FEEDS.cyber);break;
    case 'ai':        loadPanel('list-ai',CFG.FEEDS.ai);break;
    case 'finance':   loadPanel('list-finance',CFG.FEEDS.finance);loadMarketStrip();break;
    case 'dev':       loadGitHub();loadHN();loadSO();break;
    case 'sysmon':    initNetCanvas();loadOSInfo();break;
  }
}

function bindFilter(filterId,listId,feeds){
  const wrap=$(filterId);if(!wrap)return;
  wrap.addEventListener('click',e=>{
    const chip=e.target.closest('.chip');if(!chip)return;
    wrap.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active');loadPanel(listId,feeds,chip.dataset.src);
  });
}

async function dockWindow(side){
  if(typeof Neutralino==='undefined')return;
  try{
    const displays=await Neutralino.computer.getDisplays();
    const d=displays[0];const SW=d?.resolution?.width||screen.width;const SH=d?.resolution?.height||screen.height;
    const winW=ST.settings.width||440;const winH=getWinHeight();
    if(side==='free'){const x=ST.settings.winX,y=ST.settings.winY;const valid=x>=0&&y>=0&&x<(SW-100)&&y<(SH-100);if(valid){await Neutralino.window.move(x,y);await Neutralino.window.setSize({width:winW,height:winH});return;}}
    const x=side==='left'?4:SW-winW-4;const y=0;
    await Neutralino.window.move(x,y);await Neutralino.window.setSize({width:winW,height:winH});
    ST.settings.winX=x;ST.settings.winY=y;await saveSettings();
  }catch(e){console.warn('Dock error:',e);}
}

function getWinHeight(){try{return Math.min(screen.height-40,940);}catch{return 880;}}

async function saveWindowPosition(){
  if(typeof Neutralino==='undefined')return;
  try{const pos=await Neutralino.window.getPosition();ST.settings.winX=pos.x;ST.settings.winY=pos.y;ST.settings.dock='free';saveSettings();}catch(e){console.warn('getPos error:',e);}
}

async function loadSettings(){
  let saved=null;
  try{if(typeof Neutralino!=='undefined'){const raw=await Neutralino.storage.getData('astradesk_settings');if(raw)saved=JSON.parse(raw);}}catch{}
  if(!saved){try{const ls=localStorage.getItem('ad_settings');if(ls)saved=JSON.parse(ls);}catch{}}
  if(saved)Object.assign(ST.settings,saved);applyUIFromSettings();
}

function applyUIFromSettings(){
  applyTheme(ST.settings.theme);
  const op=$('cfg-opacity');if(op){op.value=ST.settings.opacity;$('opacity-val').textContent=ST.settings.opacity+'%';}
  const wd=$('cfg-width');if(wd){wd.value=ST.settings.width;$('width-val').textContent=ST.settings.width+'px';}
  const rf=$('cfg-refresh');if(rf)rf.value=ST.settings.refresh;
  const kg=$('key-github');if(kg)kg.value=ST.settings.githubToken||'';
  $$('.theme-pill').forEach(b=>b.classList.toggle('active',b.dataset.theme===ST.settings.theme));
  $$('[data-dock]').forEach(b=>b.classList.toggle('active',b.dataset.dock===ST.settings.dock));
  $$('[data-notif]').forEach(b=>b.classList.toggle('active',b.dataset.notif===ST.settings.notif));
  document.body.style.opacity=ST.settings.opacity/100;
}

async function saveSettings(){
  const data=JSON.stringify(ST.settings);
  try{if(typeof Neutralino!=='undefined')await Neutralino.storage.setData('astradesk_settings',data);}catch(e){console.warn('Storage save failed:',e);}
  try{localStorage.setItem('ad_settings',data);}catch{}
}

function applyTheme(t){
  document.documentElement.setAttribute('data-theme',t);ST.settings.theme=t;
  $$('.theme-pill').forEach(b=>b.classList.toggle('active',b.dataset.theme===t));
  if(ST.netCtx)drawNet();
}

async function initNeu(){
  if(typeof Neutralino==='undefined')return;
  try{
    Neutralino.events.on('windowClose',()=>Neutralino.app.exit());
    $('btn-minimize')?.addEventListener('click',()=>Neutralino.window.minimize());
    $('btn-close')?.addEventListener('click',()=>Neutralino.app.exit());
    $('btn-pin')?.addEventListener('click',async()=>{
      ST.pinned=!ST.pinned;
      if(ST.pinned){await saveWindowPosition();await Neutralino.window.setAlwaysOnTop(true);toast('Position saved & pinned','success',2000);}
      else{await Neutralino.window.setAlwaysOnTop(false);toast('Unpinned ó drag freely','info',2000);}
      $('btn-pin').classList.toggle('pinned',ST.pinned);
    });
    let drag={active:false,startX:0,startY:0,winX:0,winY:0};
    const topbar=$('topbar');
    if(topbar){
      topbar.addEventListener('mousedown',async e=>{if(e.target.closest('.no-drag,.wm-btn'))return;drag.active=true;drag.startX=e.screenX;drag.startY=e.screenY;try{const pos=await Neutralino.window.getPosition();drag.winX=pos.x;drag.winY=pos.y;}catch{}});
      document.addEventListener('mousemove',async e=>{if(!drag.active)return;const nx=drag.winX+(e.screenX-drag.startX),ny=drag.winY+(e.screenY-drag.startY);try{await Neutralino.window.move(nx,ny);}catch{}});
      document.addEventListener('mouseup',async()=>{if(drag.active){drag.active=false;if(!ST.pinned)await saveWindowPosition();}});
    }
    await dockWindow(ST.settings.dock);
  }catch(e){console.warn('Neutralino init:',e);}
}

async function boot(){
  const sb=document.createElement('div');sb.id='statusbar';sb.innerHTML=`<span id="sb-feeds">AstraDesk Intelligence</span><span id="sb-updated">ñ</span>`;document.body.appendChild(sb);
  if(typeof Neutralino!=='undefined'){try{await Neutralino.init();Neutralino.events.on('windowClose',()=>Neutralino.app.exit());}catch(e){console.warn('Neutralino early init:',e);}}
  await loadSettings();tickClock();setInterval(tickClock,1000);
  const dot=$('status-dot');
  function setOnline(v){if(!dot)return;dot.className='sdot '+(v?'online':'offline');}
  window.addEventListener('online',()=>setOnline(true));window.addEventListener('offline',()=>setOnline(false));setOnline(navigator.onLine);
  $$('.tab').forEach(t=>t.addEventListener('click',()=>switchPanel(t.dataset.panel)));
  bindFilter('filter-tech','list-tech',CFG.FEEDS.tech);
  bindFilter('filter-gaming','list-gaming',CFG.FEEDS.gaming);
  bindFilter('filter-world','list-world',CFG.FEEDS.world);
  bindFilter('filter-india','list-india',CFG.FEEDS.india);
  bindFilter('filter-tn','list-tn',CFG.FEEDS.tamilnadu);
  bindFilter('filter-science','list-science',CFG.FEEDS.science);
  bindFilter('filter-cyber','list-cyber',CFG.FEEDS.cyber);
  bindFilter('filter-ai','list-ai',CFG.FEEDS.ai);
  bindFilter('filter-finance','list-finance',CFG.FEEDS.finance);
  const bindRef=(id,feeds,listId)=>$(id)?.addEventListener('click',()=>{feeds.forEach(f=>delete ST.cache[f.key]);loadPanel(listId,feeds);});
  bindRef('ref-tech',CFG.FEEDS.tech,'list-tech');bindRef('ref-gaming',CFG.FEEDS.gaming,'list-gaming');
  bindRef('ref-world',CFG.FEEDS.world,'list-world');bindRef('ref-india',CFG.FEEDS.india,'list-india');
  bindRef('ref-tn',CFG.FEEDS.tamilnadu,'list-tn');bindRef('ref-science',CFG.FEEDS.science,'list-science');
  bindRef('ref-cyber',CFG.FEEDS.cyber,'list-cyber');bindRef('ref-ai',CFG.FEEDS.ai,'list-ai');
  bindRef('ref-finance',CFG.FEEDS.finance,'list-finance');
  $('ref-github')?.addEventListener('click',()=>{delete ST.cache['gh'];loadGitHub();});
  $('cfg-opacity')?.addEventListener('input',e=>{ST.settings.opacity=+e.target.value;$('opacity-val').textContent=e.target.value+'%';document.body.style.opacity=e.target.value/100;});
  $('cfg-width')?.addEventListener('input',e=>{ST.settings.width=+e.target.value;$('width-val').textContent=e.target.value+'px';});
  $('cfg-refresh')?.addEventListener('change',e=>{ST.settings.refresh=+e.target.value;scheduleRefresh();});
  $$('.theme-pill').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.theme)));
  $$('[data-dock]').forEach(b=>b.addEventListener('click',()=>{ST.settings.dock=b.dataset.dock;$$('[data-dock]').forEach(x=>x.classList.remove('active'));b.classList.add('active');dockWindow(b.dataset.dock);}));
  $$('[data-notif]').forEach(b=>b.addEventListener('click',()=>{ST.settings.notif=b.dataset.notif;$$('[data-notif]').forEach(x=>x.classList.remove('active'));b.classList.add('active');}));
  $('btn-save-cfg')?.addEventListener('click',()=>{ST.settings.githubToken=$('key-github')?.value.trim()||'';saveSettings();toast('Settings saved','success');dockWindow(ST.settings.dock);});
  $('orb')?.addEventListener('click',()=>switchPanel('dashboard'));
  ST.sysTimer=setInterval(pollSys,2000);pollSys();
  switchPanel('dashboard');scheduleRefresh();
  await initNeu();
  initNavObserver(); toast('AstraDesk Intelligence v3 ready','success',2500);
}

function scheduleRefresh(){
  if(ST.refreshTimer)clearInterval(ST.refreshTimer);
  ST.refreshTimer=setInterval(()=>{if(!['sysmon','cfg'].includes(ST.panel))switchPanel(ST.panel);},ST.settings.refresh*60000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
else boot();

// -- DYNAMIC NAV HEIGHT OBSERVER --
function initNavObserver() {
  const nav = document.getElementById('nav-tabs');
  if (!nav) return;
  function updateNavTotal() {
    const h = nav.getBoundingClientRect().height;
    const total = 48 + h; // topbar(48) + actual nav height
    document.documentElement.style.setProperty('--nav-total', total + 'px');
  }
  updateNavTotal();
  if (window.ResizeObserver) {
    new ResizeObserver(updateNavTotal).observe(nav);
  }
  window.addEventListener('resize', updateNavTotal);
}


