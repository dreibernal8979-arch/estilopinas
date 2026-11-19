(function(){
var state=JSON.parse(document.getElementById('shop-data').textContent);function withPL(st){if(st&&!st.priceList&&window.EP_PRICES_DEFAULT)st.priceList=JSON.parse(JSON.stringify(window.EP_PRICES_DEFAULT));return st}withPL(state);var saved=JSON.stringify(state),CFG=window.EP_CONFIG||{},sb=null;
var editing=false,dirty=false,filter='All',canWrite=false,art=null,railTimer=null,railRAF=0,railUser=false,focusId=null;
var app=document.getElementById('app');
var STATUS={available:'Available',reserved:'Reserved',soldout:'Sold out',preorder:'Pre-order'};
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function peso(p){var n=Number(String(p).replace(/[^0-9.]/g,''));return p&&n?'₱'+n.toLocaleString('en-PH'):''}
function S(){return state.settings}
function cats(){var s=[];state.products.forEach(function(p){if(p.cat&&s.indexOf(p.cat)<0)s.push(p.cat)});return s}
function find(id){return state.products.find(function(x){return x.id===id})}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2400)}
/* refined Estilo Pinas "e": a phone outline that writes an e */
function mark(fg,notch){return '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="epg" gradientUnits="userSpaceOnUse" x1="222" y1="0" x2="290" y2="0"><stop offset="0" stop-color="#ff3d8b"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#3d8bff"/></linearGradient></defs><path d="M76 217C76 118.6 97.6 97 196 97L316 97C414.4 97 436 118.6 436 217L436 299C436 310.48 433.48 313 422 313L164 313C155.8 313 154 314.8 154 323L154 347C154 358.48 156.52 361 168 361L414 361C423.84 361 426 363.16 426 373L426 409C426 423.76 422.76 427 408 427L196 427C97.6 427 76 405.4 76 307ZM154 213C154 172 163 163 204 163L308 163C349 163 358 172 358 213L358 237C358 245.2 356.2 247 348 247L164 247C155.8 247 154 245.2 154 237Z" fill="'+fg+'" fill-rule="evenodd"/><rect x="222" y="185" width="68" height="18" rx="9" fill="'+(notch||fg)+'"/></svg>'}
function logoMk(){return S().logo?'<img alt="" src="'+S().logo+'">':mark('currentColor','url(#epg)')}
function box(){return '<span class="ph-phone"><span class="scr"></span><span class="isl"></span></span>'}
var PROC={};
function pic(p){if(!p.photo)return box();var u=PROC[p.photo];return '<img alt="'+esc(p.name+' '+p.spec)+'" src="'+(u||p.photo)+'"'+(u?'':' data-proc="'+esc(p.photo)+'"')+'>'}
function processImgs(){[].forEach.call(document.querySelectorAll('img[data-proc]'),function(im){var src=im.getAttribute('data-proc');im.removeAttribute('data-proc');
 var job=PROC['~'+src]||(PROC['~'+src]=fetch(src).then(function(r){if(!r.ok)throw 0;return r.blob()}).then(function(b){return createImageBitmap(b)}).then(function(bm){
  var c=document.createElement('canvas'),sc=Math.min(1,1400/Math.max(bm.width,bm.height));c.width=Math.round(bm.width*sc);c.height=Math.round(bm.height*sc);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);
  var o=trim(cutout(c));return new Promise(function(res){o.toBlob(function(bl){res(PROC[src]=URL.createObjectURL(bl))},'image/png')})}).catch(function(){return null}));
 job.then(function(u){if(u)document.querySelectorAll('img').forEach(function(x){if(x.getAttribute('src')===src)x.src=u})})})}
function msgrUrl(text){var m=(S().messenger||'').trim();if(!m)return (S().fb||'').trim();var base=/^https?:\/\//.test(m)?m:'https://m.me/'+m.replace(/^@/,'').replace(/^(www\.)?(facebook\.com|m\.me)\//,'');return base+(base.indexOf('?')<0?'?':'&')+'text='+encodeURIComponent(text)}
function mapsUrl(){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(S().mapsQuery||S().address)}
function wazeUrl(){return 'https://waze.com/ul?q='+encodeURIComponent(S().mapsQuery||S().address)}
function featured(){var f=state.products.filter(function(p){return p.featured});return f.length?f:state.products}
var SPOTS=[{x:'30%',y:'8%',w:'40%',d:22,z:3,r:'-2deg'},{x:'2%',y:'30%',w:'30%',d:12,z:2,r:'3deg'},{x:'66%',y:'30%',w:'30%',d:14,z:2,r:'-3deg'},{x:'20%',y:'60%',w:'22%',d:6,z:1,r:'2deg'},{x:'58%',y:'64%',w:'20%',d:5,z:1,r:'-2deg'}];
function stage(items,cls){return '<div class="stage'+(cls?' '+cls:'')+'" aria-hidden="true">'+items.slice(0,SPOTS.length).map(function(p,i){var s=SPOTS[i];return '<div class="fl" style="--x:'+s.x+';--y:'+s.y+';--w:'+s.w+';--d:'+s.d+';--z:'+s.z+';--r:'+s.r+';--i:'+i+'"><div class="obj">'+pic(p)+'</div><div class="sh"></div></div>'}).join('')+'</div>'}

function sealSvg(){return '<svg viewBox="0 0 200 200"><defs><path id="sealp" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0"/></defs><circle cx="100" cy="100" r="98" fill="#0e0f11"/><text fill="#f4f4f2" style="font:700 14.5px Archivo,sans-serif;letter-spacing:3.2px"><textPath href="#sealp">BRAND NEW · SEALED · SINCE 2014 · </textPath></text><g transform="translate(64 64) scale(.14)">'+mark('#f4f4f2','url(#epg)').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')+'</g></svg>'}
function brandStory(){return '<section class="sec story brandmesh" id="story"><div class="wrap story-in"><div class="story-tx"><p class="lbl">The Estilo Pinas mark</p><h2 class="disp">A phone, a notch, a sealed box.</h2>'+
 '<p>Our logo joins three things we stand for: the <b>phone</b> you came for (look at the O), the <b>notch</b> that lights it up, and the <b>sealed box</b> every unit leaves in. It leans forward because we move fast: same-day COD, meet-ups and LBC nationwide.</p>'+
 '<div class="parts"><div><span class="pt pt-phone"></span><span class="lbl">Phone</span></div><div><span class="pt pt-notch"></span><span class="lbl">Notch</span></div><div><span class="pt pt-box"></span><span class="lbl">Sealed box</span></div></div></div>'+
 '<div class="story-logo"><img class="badge" src="/badge.svg" alt="Estilo Pinas logo"></div></div></section>'}
function rr(x,X,Y,w,h,r){x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()}
var BADGE={black:{body:'#0e0f11',side:'#2a2b30',screen:'#f4f4f2',text:'#0e0f11'},white:{body:'#f4f4f2',side:'#b9bac0',screen:'#0e0f11',text:'#f4f4f2'}};
function drawBadge(cv,v){var W=1220,H=520,R=140,s=40,dx=30,dy=40,cw=1500,ch=760;cv.width=cw;cv.height=ch;var x=cv.getContext('2d');x.clearRect(0,0,cw,ch);x.save();x.translate(cw/2+10,ch/2-10);x.rotate(-8*Math.PI/180);
 for(var i=dy;i>0;i-=2){x.save();x.translate(-dx*i/dy,i);rr(x,-W/2,-H/2,W,H,R);x.fillStyle=v.side;x.fill();x.restore()}
 rr(x,-W/2,-H/2,W,H,R);x.fillStyle=v.body;x.fill();rr(x,-W/2+s,-H/2+s,W-2*s,H-2*s,R-s);x.fillStyle=v.screen;x.fill();
 var g=x.createLinearGradient(-120,0,120,0);g.addColorStop(0,'#ff3d8b');g.addColorStop(.5,'#8a5cff');g.addColorStop(1,'#3d8bff');rr(x,-120,-H/2+s+26,240,30,15);x.fillStyle=g;x.fill();
 x.fillStyle=v.text;x.textAlign='center';var fs=300;x.font=fs+'px "Anton", sans-serif';var tw=x.measureText('ESTILO PINAS').width;fs=Math.floor(fs*Math.min(1,(W-2*s-110)/tw));x.font=fs+'px "Anton", sans-serif';x.fillText('ESTILO PINAS',0,fs*.34+4);
 x.font='600 34px "Archivo", sans-serif';try{x.letterSpacing='14px'}catch(e){}x.globalAlpha=.6;x.fillText('GADGETS · SINCE 2014',0,H/2-s-34);x.globalAlpha=1;try{x.letterSpacing='0px'}catch(e){}
 x.font='700 38px "Archivo", sans-serif';x.fillText('™',W/2+20,-H/2+10);x.restore()}
var fontsReady=(document.fonts&&document.fonts.load)?Promise.all([document.fonts.load('100px "Anton"'),document.fonts.load('600 30px "Archivo"')]).catch(function(){}):Promise.resolve();
function drawBadges(){fontsReady.then(function(){document.querySelectorAll('canvas.badge').forEach(function(cv){drawBadge(cv,BADGE[cv.getAttribute('data-badge')]||BADGE.black)})})}
function render(){
 stopRail();
 if(window.EP_MODE==='admin'){app.innerHTML='<header class="adm-top"><div class="adm-in"><img src="/wordmark.svg" alt="Estilo Pinas" width="84" height="39"><b>Owner admin</b><nav><a href="/" target="_blank" rel="noopener">View website ↗</a><a href="/prices" target="_blank" rel="noopener">Price list ↗</a>'+(canWrite?'<button class="lgout" type="button" id="lgout">Log out</button>':'')+'</nav></div></header>'+(editing?'':'<main class="adm-main"><p>'+(canWrite?'Opening tools…':'Log in with the owner account to manage products, prices, orders and alerts.')+'</p></main>');return}
 var s=S(),h='';
 h+='<nav class="nav"><div class="wrap"><a class="logo" href="#top"><span class="mk">'+logoMk()+'</span><span class="wm">'+esc(s.shopName)+'</span></a>'+
  '<div class="navlinks"><a href="#all">Shop</a><a href="/prices">Price list</a><a href="/pay">Payment guide</a><a href="/ask">Ask us</a><a href="#visit">Visit</a></div><div class="acts">'+
  (canWrite&&!editing?'<button class="ownerbtn" id="b-edit">Edit site</button>':'')+'<button class="btn sm" data-msg="1">Message</button></div></div></nav>';
 var lines=String(s.heroTitle||'').split('\n').filter(Boolean),fp=featured();
 h+='<header class="hero brandmesh" id="top"><div class="seal-st" aria-hidden="true">'+sealSvg()+'</div><div class="wrap hero-in"><p class="lbl">'+esc(s.heroEyebrow)+'</p><h1 class="disp">'+lines.map(function(l){return '<span>'+esc(l)+'</span>'}).join(' ')+'</h1><p class="sub">'+esc(s.heroSub)+'</p></div>'+
  '<div class="rail" id="drop"><div class="bar" aria-hidden="true"></div><div class="track" id="track">'+fp.map(function(p,i){var pr=peso(p.price);return '<button class="slot" data-slot="'+p.id+'" style="--i:'+i+';--wl:'+[44,64,36,56,48,70][i%6]+'px" aria-label="'+esc(p.name+' '+p.spec)+'"><span class="swing"><span class="wire"></span><span class="clip"></span>'+(pr?'<span class="ptag">'+pr+'</span>':'')+'<span class="in"><span class="obj">'+pic(p)+'</span></span></span></button>'}).join('')+'</div>'+
  '<div class="rail-ui wrap"><button class="arw" aria-label="Previous" data-rail="-1">←</button><div class="focus" id="focus" aria-live="polite"></div><button class="arw" aria-label="Next" data-rail="1">→</button></div><div class="prog" id="prog"><i></i></div></div></header>';
 var tk=(s.ticker||[]).filter(Boolean);
 if(tk.length){var one=tk.map(function(t){return '<span>'+esc(t)+'</span>'}).join('');h+='<div class="ticker" aria-label="'+esc(tk.join(', '))+'"><div class="tk" aria-hidden="true">'+one+one+one+one+'</div></div>'}
 h+='<div class="wrap"><dl class="stats">'+(s.stats||[]).filter(function(x){return x.n}).map(function(x){return '<div><dt>'+esc(x.n)+'</dt><dd class="lbl">'+esc(x.l)+'</dd></div>'}).join('')+'</dl></div>';
 var c=cats(),list=state.products.filter(function(p){return filter==='All'||p.cat===filter});
 h+=spotlight();
 h+='<section class="sec" id="all" style="padding-top:20px"><div class="wrap"><div class="sh2"><div><p class="lbl">Full list</p><h2 class="disp">All units</h2><p>Prices can change. We confirm stock and price before you pay.</p></div></div>'+
  (c.length>1?'<div class="chips" role="group" aria-label="Category">'+['All'].concat(c).map(function(x){return '<button class="chip" aria-pressed="'+(filter===x)+'" data-cat="'+esc(x)+'">'+esc(x)+'</button>'}).join('')+'</div>':'')+
  '<div class="grid">'+(list.length?list.map(card).join(''):'<div class="empty">No units listed yet. Message us for what we have today.</div>')+'</div></div></section>';
 h+='<section class="sec" id="ways" style="padding-top:20px"><div class="wrap"><div class="promise">'+(s.promise||[]).map(function(x,i){return '<div><span class="lbl">0'+(i+1)+'</span><b>'+esc(x.t)+'</b><p>'+esc(x.d)+'</p></div>'}).join('')+'</div>'+
  '<div class="sh2" style="margin-top:88px"><div><p class="lbl">Delivery & payment</p><h2 class="disp">Ways to buy</h2></div></div><div class="ways">'+
  (s.ways||[]).map(function(w,i){return '<article class="way"><span class="n">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(w.t)+'</h3><p>'+esc(w.d)+'</p></div></article>'}).join('')+'</div></div></section>';
 h+=brandStory();
 h+='<section class="sec visit" id="visit"><div class="wrap"><div><p class="lbl">Physical store</p><h2 class="disp">Come see it sealed.</h2><dl>'+
  (s.address?'<div><dt class="lbl">Address</dt><dd>'+esc(s.address)+'</dd></div>':'')+(s.hours?'<div><dt class="lbl">Hours</dt><dd>'+esc(s.hours)+'</dd></div>':'')+
  (s.phone?'<div><dt class="lbl">Call / Viber</dt><dd><span class="sel">'+esc(s.phone)+'</span></dd></div>':'')+'</dl><div class="cta"><a class="btn" target="_blank" rel="noopener" href="'+esc(mapsUrl())+'">Google Maps</a><a class="btn ghost" target="_blank" rel="noopener" href="'+esc(wazeUrl())+'">Waze</a>'+(s.fb?'<a class="btn ghost" target="_blank" rel="noopener" href="'+esc(s.fb)+'">Facebook</a>':'')+'</div></div>'+
  '<div class="storeimg">'+(s.storePhoto?'<img alt="Estilo Pinas store" src="'+s.storePhoto+'">':(fp[0]?'<div class="solo"><div class="obj">'+pic(fp[0])+'</div><div class="sh"></div></div>':''))+'</div></div></section>';
 if(window.EP_MODE!=='admin')h+='<nav class="tabbar" aria-label="Shop menu"><a href="#all" aria-current="page"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3.2"/></svg><span>Shop</span></a><a href="/prices"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9"/></svg><span>Prices</span></a><a href="/pay"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18"/></svg><span>Payment</span></a><a href="/ask"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H10l-5 4z"/></svg><span>Ask</span></a></nav>';
 h+='<footer class="brandmesh"><div class="wrap foot"><img class="badge" src="/badge.svg" alt="'+esc(s.shopName)+' logo"><div class="foot-tx"><span class="lbl">Since 2014 · All units brand new &amp; sealed</span><span class="lbl">'+esc(s.address)+'</span><span class="lbl">© '+new Date().getFullYear()+' '+esc(s.shopName)+'™</span></div></div></footer>';
 if(!editing)h+='<button class="btn fab" data-msg="1">Order on Messenger</button>';
 app.innerHTML=h;
 setupRail();setupParallax();processImgs();drawBadges();
}
function card(p){var sold=p.status==='soldout',pr=peso(p.price);
 return '<article class="pc'+(sold?' sold':'')+'" data-view="'+p.id+'"><div class="ph">'+pic(p)+(p.sample?'<span class="sample">SAMPLE</span>':'')+'</div><div class="sh"></div><div class="bd"><div class="nm">'+esc(p.name)+'</div><div class="sp">'+esc(p.spec)+'</div>'+
 '<div class="rw"><span class="pr'+(pr?'':' ask')+'">'+(pr||'Message for price')+'</span><span class="st s-'+p.status+'">'+STATUS[p.status]+'</span></div>'+
 '<div class="pc-act"><button class="tlink" data-view="'+p.id+'">Details</button><button class="tlink" data-order="'+p.id+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':p.status==='preorder'?'Pre-order →':'Order →')+'</button></div></div></article>'}

function setupParallax(){if(RM)return;var st=document.querySelector('.hero-stage'),hero=document.querySelector('.hero');if(!st||!hero)return;
 hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();st.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));st.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))});
 hero.addEventListener('pointerleave',function(){st.style.setProperty('--mx',0);st.style.setProperty('--my',0)})}
function setupRail(){var t=document.getElementById('track');if(!t)return;var prog=document.querySelector('#prog i'),cnt=t.querySelectorAll('.slot').length;
 var upd=function(){railRAF=0;var r=t.getBoundingClientRect(),cx=r.left+r.width/2,best=null,bd=1e9,bi=0;
  t.querySelectorAll('.slot').forEach(function(el,i){var b=el.getBoundingClientRect(),d=Math.abs(b.left+b.width/2-cx),n=Math.min(d/(b.width*1.4),1);
   el.querySelector('.in').style.setProperty('--s',(1-n*.34).toFixed(3));el.style.opacity=(1-n*.5).toFixed(2);if(d<bd){bd=d;best=el;bi=i}});
  if(prog)prog.style.width=((bi+1)/Math.max(cnt,1)*100)+'%';
  if(best&&best.dataset.slot!==focusId){focusId=best.dataset.slot;showFocus()}};
 t.addEventListener('scroll',function(){if(!railRAF)railRAF=requestAnimationFrame(upd)},{passive:true});
 ['pointerdown','wheel','touchstart'].forEach(function(e){t.addEventListener(e,function(){railUser=true},{passive:true})});
 focusId=null;var all=t.querySelectorAll('.slot'),mid=all[Math.floor(all.length/2)];if(mid&&!t.dataset.init){t.dataset.init=1;t.scrollLeft=mid.offsetLeft-(t.clientWidth-mid.offsetWidth)/2}upd();
 if(!RM)railTimer=setInterval(function(){if(railUser||editing||document.hidden)return;var items=t.querySelectorAll('.slot');if(items.length<2)return;
  var cur=[].findIndex.call(items,function(x){return x.dataset.slot===focusId}),nx=items[(cur+1)%items.length];
  t.scrollTo({left:nx.offsetLeft-(t.clientWidth-nx.offsetWidth)/2,behavior:'smooth'})},3600);
}
function stopRail(){if(railTimer)clearInterval(railTimer);railTimer=null}
function showFocus(){var f=document.getElementById('focus'),p=find(focusId);if(!f||!p)return;var pr=peso(p.price),sold=p.status==='soldout';
 f.innerHTML='<div class="nm">'+esc(p.name)+'</div><div class="sp">'+esc(p.spec)+' <span class="dot">·</span> <span class="pr">'+(pr||'Message for price')+'</span> <span class="st s-'+p.status+'">'+STATUS[p.status]+'</span></div>'+
 '<div class="fbtns"><button class="btn sm" data-view="'+p.id+'">View details</button><button class="btn ghost sm" data-order="'+p.id+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':'See availability')+'</button></div>'}

function gallery(p){return [p.photo].concat(p.photos||[]).filter(Boolean)}
function specsOf(p){return (p.specs||[]).filter(function(x){return x&&x.k&&x.v})}
function spotlight(){var p=state.products.find(function(x){return x.spotlight})||null;if(!p)return '';var pr=peso(p.price),g=gallery(p),big=g[g.length>1?g.length-1:0];
 var hl=specsOf(p).slice(0,3);
 return '<section class="spot brandmesh" id="spot"><div class="wrap spot-in"><div class="spot-img">'+(big?'<img alt="'+esc(p.name)+'" src="'+(PROC[big]||big)+'"'+(PROC[big]?'':' data-proc="'+esc(big)+'"')+'>':box())+'<div class="sh"></div></div>'+
 '<div class="spot-tx"><p class="lbl">Now available</p><h2 class="disp">'+esc(p.name)+'</h2>'+(p.tagline?'<p class="tag">'+esc(p.tagline)+'</p>':'')+
 '<p class="pr">'+(pr?'From '+pr:'Message us for the latest price')+'</p>'+
 (hl.length?'<dl class="hl">'+hl.map(function(x){return '<div><dt class="lbl">'+esc(x.k)+'</dt><dd>'+esc(x.v)+'</dd></div>'}).join('')+'</dl>':'')+
 '<div class="cta"><button class="btn" data-view="'+p.id+'">View details</button><button class="btn ghost" data-order="'+p.id+'">Order</button></div></div></div></section>'}
var viewEl=null;
function openView(id){var p=find(id);if(!p)return;var s=S(),pr=peso(p.price),sold=p.status==='soldout',g=gallery(p),sp=specsOf(p);
 closeView();viewEl=document.createElement('div');viewEl.className='pv';viewEl.setAttribute('role','dialog');viewEl.setAttribute('aria-modal','true');viewEl.setAttribute('aria-label',p.name);
 function im(u,cls){return '<img class="'+(cls||'')+'" alt="'+esc(p.name)+'" src="'+(PROC[u]||u)+'"'+(PROC[u]?'':' data-proc="'+esc(u)+'"')+'>'}
 viewEl.innerHTML='<div class="pv-top wrap"><button class="tlink" data-close="1">← Back to shop</button><span class="lbl">'+esc(p.cat||'')+'</span></div>'+
 '<div class="wrap pv-grid"><div class="pv-gal"><div class="pv-main">'+(g[0]?im(g[0],'pv-big'):box())+'<div class="sh"></div></div>'+
 (g.length>1?'<div class="pv-thumbs">'+g.map(function(u,i){return '<button class="pv-th'+(i?'':' on')+'" data-img="'+esc(u)+'" aria-label="Photo '+(i+1)+'">'+im(u)+'</button>'}).join('')+'</div>':'')+'</div>'+
 '<div class="pv-info"><span class="st s-'+p.status+'">'+STATUS[p.status]+'</span><h2 class="disp">'+esc(p.name)+'</h2>'+(p.tagline?'<p class="tag">'+esc(p.tagline)+'</p>':'')+
 '<p class="pv-spec">'+esc(p.spec)+'</p>'+(p.colors?'<p class="pv-col"><span class="lbl">Colors</span> '+esc(p.colors)+'</p>':'')+
 '<p class="pv-pr">'+(pr||'Message for price')+'</p>'+
 '<div class="pv-cta"><button class="btn" data-order="'+p.id+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':p.status==='preorder'?'Pre-order on Messenger':'Order on Messenger')+'</button><button class="btn ghost" data-ask="'+p.id+'">Ask a question</button></div>'+
 (pr?'<a class="tlink" style="display:inline-block;margin-top:12px" href="/pay?price='+String(p.price).replace(/[^0-9]/g,'')+'#calc-sec">See cash vs card breakdown →</a>':'')+'<ul class="pv-trust"><li>Brand new, factory sealed</li><li>Legit shop since 2014</li><li>COD, card, LBC or layaway</li></ul>'+
 (sp.length?'<h3 class="lbl pv-h">Key specs</h3><dl class="pv-specs">'+sp.map(function(x){return '<div><dt>'+esc(x.k)+'</dt><dd>'+esc(x.v)+'</dd></div>'}).join('')+'</dl>':'')+
 '</div></div>';
 document.body.appendChild(viewEl);document.body.style.overflow='hidden';try{history.replaceState(null,'','#'+p.id)}catch(e){}
 processImgs();
 viewEl.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.close)return closeView();
  if(b.dataset.order)return openOrder(b.dataset.order);
  if(b.dataset.ask){return openOrder(null,'Hi '+s.shopName+'! I have a question about the '+p.name+(p.spec?' ('+p.spec+')':'')+': ')}
  if(b.dataset.img){var src=b.dataset.img,big=viewEl.querySelector('.pv-main');big.innerHTML=im(src,'pv-big')+'<div class="sh"></div>';viewEl.querySelectorAll('.pv-th').forEach(function(x){x.classList.toggle('on',x===b)});processImgs()}});
}
function closeView(){if(viewEl){viewEl.remove();viewEl=null;document.body.style.overflow='';try{history.replaceState(null,'',location.pathname)}catch(e){}}}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeView()});
function openOrder(id,preset){var p=id?find(id):null,s=S();
 var text=preset?preset:p?'Hi '+s.shopName+'! I want to '+(p.status==='preorder'?'pre-order':'order')+': '+p.name+(p.spec?' ('+p.spec+')':'')+(peso(p.price)?' – '+peso(p.price):'')+'. Is it available?':'Hi '+s.shopName+'! I have a question about a unit.';
 var url=msgrUrl(text),d=document.createElement('div');d.className='sheet';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
 d.innerHTML='<div class="panel"><p class="lbl">'+(p?'Order':'Message us')+'</p><h3 class="disp">'+(p?esc(p.name):esc(s.shopName))+'</h3>'+(p?'<div class="small">'+esc(p.spec)+(peso(p.price)?' · '+peso(p.price):'')+'</div>':'')+
  '<label class="lbl" for="ordmsg">Your message</label><textarea class="msg" id="ordmsg">'+esc(text)+'</textarea>'+
  (url?(s.messenger?'':'<div class="small">Copy the message, then tap Message on our Facebook page.</div>')+'<a class="btn" target="_blank" rel="noopener" id="ordlink" href="'+esc(url)+'">'+(s.messenger?'Send on Messenger':'Open our Facebook page')+'</a>':'')+
  '<button class="btn ghost" id="ordcopy">Copy message</button>'+(s.phone?'<div class="small">Call or Viber: <b style="user-select:all">'+esc(s.phone)+'</b></div>':'')+
  '<button class="tlink" id="ordclose" style="justify-self:center">Close</button></div>';
 document.body.appendChild(d);var ta=d.querySelector('#ordmsg');
 ta.addEventListener('input',function(){var a=d.querySelector('#ordlink');if(a&&s.messenger)a.href=msgrUrl(ta.value)});
 d.addEventListener('click',function(e){if(e.target===d||e.target.id==='ordclose')d.remove();
  if(e.target.id==='ordcopy'){try{navigator.clipboard.writeText(ta.value).then(function(){toast('Message copied')},function(){ta.select();toast('Selected. Copy it now.')})}catch(_){ta.select();toast('Selected. Copy it now.')}}});
}

app.addEventListener('click',function(e){var t=e.target.closest('button');
 if(!t){var cardEl=e.target.closest('[data-view]');if(cardEl)openView(cardEl.getAttribute('data-view'));return}
 if(t.dataset.view)return openView(t.dataset.view);
 if(t.dataset.order)return openOrder(t.dataset.order);
 if(t.dataset.msg)return openOrder(null);
 if(t.dataset.cat){filter=t.dataset.cat;return render()}
 if(t.dataset.slot){if(t.dataset.slot===focusId)return openOrder(t.dataset.slot);railUser=true;var tr=document.getElementById('track');tr.scrollTo({left:t.offsetLeft-(tr.clientWidth-t.offsetWidth)/2,behavior:RM?'auto':'smooth'});return}
 if(t.dataset.rail){railUser=true;var tr0=document.getElementById('track'),sl=tr0.querySelector('.slot');tr0.scrollBy({left:Number(t.dataset.rail)*(sl?sl.offsetWidth:240),behavior:RM?'auto':'smooth'});return}
 if(t.id==='b-edit'){openEditor();return}
});

/* ---------- owner editor (only shows for people who can edit this page) ---------- */
var ed=null;
function f(lab,attr,val,ph,area){return '<div class="f"><label>'+lab+'</label>'+(area?'<textarea '+attr+' placeholder="'+esc(ph||'')+'">'+esc(val)+'</textarea>':'<input '+attr+' value="'+esc(val)+'" placeholder="'+esc(ph||'')+'">')+'</div>'}
function edHTML(){var s=S();
 var prods=state.products.map(function(p,i){var o=Object.keys(STATUS).map(function(k){return '<option value="'+k+'"'+(p.status===k?' selected':'')+'>'+STATUS[k]+'</option>'}).join('');
  return '<div class="erow"><div class="top"><div class="thumb">'+pic(p)+'</div><div class="tools"><label class="up">'+(p.photo?'Change photo':'Add photo (PNG)')+'<input type="file" accept="image/*" data-up="'+p.id+'"></label>'+(p.photo?'<button data-nophoto="'+p.id+'">Remove photo</button>':'')+'</div></div>'+
  f('Name','data-p="name" data-id="'+p.id+'"',p.name)+f('Details','data-p="spec" data-id="'+p.id+'"',p.spec,'256GB · Brand new, sealed')+
  '<div class="two">'+f('Price (₱)','data-p="price" data-id="'+p.id+'" inputmode="numeric"',p.price,'Blank = message for price')+f('Category','data-p="cat" data-id="'+p.id+'" list="catlist"',p.cat)+'</div>'+
  '<div class="two"><div class="f"><label>Status</label><select data-p="status" data-id="'+p.id+'">'+o+'</select></div><label class="chk"><input type="checkbox" data-p="featured" data-id="'+p.id+'"'+(p.featured?' checked':'')+'> Show on the rail</label></div>'+
  '<label class="chk"><input type="checkbox" data-p="spotlight" data-id="'+p.id+'"'+(p.spotlight?' checked':'')+'> Big spotlight banner</label>'+
  f('Tagline (one short line)','data-p="tagline" data-id="'+p.id+'"',p.tagline||'')+f('Colors','data-p="colors" data-id="'+p.id+'"',p.colors||'','e.g. Night Sky, Star White')+
  f('Key specs (one per line, Label: value)','data-p="specsText" data-id="'+p.id+'"',specsOf(p).map(function(x){return x.k+': '+x.v}).join('\n'),'Chip: A20 Pro',1)+
  '<div class="f"><label>More photos</label><div class="tools gal-ed">'+(p.photos||[]).map(function(u,j){return '<span class="gthumb"><img alt="" src="'+(PROC[u]||u)+'"><button data-gdel="'+p.id+'" data-j="'+j+'" aria-label="Remove photo">×</button></span>'}).join('')+'<label class="up">+ Add photo<input type="file" accept="image/*" data-gup="'+p.id+'"></label></div></div>'+
  '<div class="tools">'+(i>0?'<button data-mv="-1" data-id="'+p.id+'">↑ Up</button>':'')+(i<state.products.length-1?'<button data-mv="1" data-id="'+p.id+'">↓ Down</button>':'')+'<button class="del" data-del="'+p.id+'">Delete</button></div></div>'}).join('');
 var ways=(s.ways||[]).map(function(w,i){return '<div class="erow">'+f('Title','data-w="t" data-i="'+i+'"',w.t)+f('Details','data-w="d" data-i="'+i+'"',w.d,'',1)+'<div class="tools"><button class="del" data-wdel="'+i+'">Delete</button></div></div>'}).join('');
 var rvs=(s.reviews||[]).map(function(r,i){return '<div class="erow">'+'<div class="two">'+f('Customer name','data-rw="n" data-i="'+i+'"',r.n||'','e.g. Sherwin A.')+f('Date','data-rw="d" data-i="'+i+'"',r.d||'','e.g. 30 Sept')+'</div>'+f('Review (copy it exactly from Facebook)','data-rw="t" data-i="'+i+'"',r.t||'','',1)+
  '<div class="tools">'+(r.photo?'<span class="gthumb"><img alt="" src="'+esc(r.photo)+'"></span><button data-rwnoph="'+i+'">Remove photo</button>':'')+'<label class="up">'+(r.photo?'Change photo':'+ Add customer photo')+'<input type="file" accept="image/*" data-rwup="'+i+'"></label><label class="chk"><input type="checkbox" data-rwon="'+i+'"'+(r.on!==false?' checked':'')+'> Show on website</label>'+(i>0?'<button data-rwmv="-1" data-i="'+i+'">↑ Up</button>':'')+'<button class="del" data-rwdel="'+i+'">Delete</button></div></div>'}).join('');
 var prom=(s.promise||[]).map(function(w,i){return '<div class="two">'+f('Promise '+(i+1),'data-pm="t" data-i="'+i+'"',w.t)+f('Line','data-pm="d" data-i="'+i+'"',w.d)+'</div>'}).join('');
 var stats=(s.stats||[]).map(function(x,i){return '<div class="two">'+f('Number','data-st="n" data-i="'+i+'"',x.n)+f('Label','data-st="l" data-i="'+i+'"',x.l)+'</div>'}).join('');
 return '<div class="ed-h"><b>Edit site</b><button class="btn ghost sm" id="ed-close">Close</button></div><div class="ed-b">'+
  '<datalist id="catlist">'+['iPhone','iPad','Android','Mac','Accessories'].concat(cats()).filter(function(v,i,a){return a.indexOf(v)===i}).map(function(c){return '<option value="'+esc(c)+'">'}).join('')+'</datalist>'+
  opsHTML()+
  plHTML()+
  
  
  
  '<details><summary>Customer reviews</summary><div class="g"><p class="small">Real reviews from your Facebook page, shown on the homepage.</p><div class="two">'+f('% recommend','data-s="reviewPct" inputmode="numeric"',s.reviewPct||'','100')+f('Number of reviews','data-s="reviewCount" inputmode="numeric"',s.reviewCount||'','760')+'</div>'+rvs+'<button class="addrow" id="ed-rwadd">+ Add a review</button></div></details>'+
  '<details><summary>Delivery & pickup</summary><div class="g"><p class="small">Shown on the homepage, How to order and Contact pages.</p>'+ways+'<button class="addrow" id="ed-wadd">+ Add a delivery option</button></div></details>'+
  '<details><summary>Contact & store</summary><div class="g">'+f('Facebook page username (for Messenger)','data-s="messenger"',s.messenger,'e.g. estilopinas')+f('Facebook page link','data-s="fb"',s.fb,'https://facebook.com/...')+f('Call / Viber','data-s="phone"',s.phone)+f('Address','data-s="address"',s.address,'',1)+f('Hours','data-s="hours"',s.hours)+f('Name to search on maps','data-s="mapsQuery"',s.mapsQuery)+
   '<div class="tools"><label class="up">'+(s.storePhoto?'Change store photo':'Add store photo')+'<input type="file" accept="image/*" data-upk="storePhoto"></label>'+(s.storePhoto?'<button data-clr="storePhoto">Remove</button>':'')+'</div></div></details>'+
  '<details><summary>Brand</summary><div class="g">'+f('Shop name','data-s="shopName"',s.shopName)+'<div class="tools"><label class="up">'+(s.logo?'Change logo (PNG)':'Use my own logo file (PNG)')+'<input type="file" accept="image/*" data-upk="logo"></label>'+(s.logo?'<button data-clr="logo">Use built-in logo</button>':'')+'</div></div></details>'+
  '</div><div class="ed-f"><span class="small" id="ed-state">'+(dirty?'Saving soon…':'Changes save automatically.')+'</span><div class="tools"><button class="btn ghost sm" id="ed-cancel">Undo all</button><button class="btn sm" id="ed-save">Save</button></div></div>'}
function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function plHTML(){var P=state.priceList;if(!P)return '';var n=0;P.categories.forEach(function(c){c.items.forEach(function(it){n+=it.variants.length})});
 var h='<details><summary>Price list ('+n+' prices)</summary><div class="g"><p class="small">These prices show on the <a href="/prices" target="_blank" rel="noopener">price list page</a> after you tap Save. The "Updated" date changes by itself.</p>';
 P.categories.forEach(function(c,ci){
  h+='<div class="pl-cat"><div class="f"><label>Category name</label><input data-pl="cname" data-c="'+ci+'" value="'+esc(c.name)+'"></div>';
  c.items.forEach(function(it,ii){var k='data-c="'+ci+'" data-i="'+ii+'"';
   h+='<div class="erow"><div class="top"><div class="thumb">'+(it.photo?'<img alt="" src="'+esc(it.photo)+'">':'')+'</div><div class="tools"><label class="up">'+(it.photo?'Change photo':'Add photo')+'<input type="file" accept="image/*" data-plup="'+ci+','+ii+'"></label>'+(it.photo?'<button data-plnophoto="'+ci+','+ii+'">Remove photo</button>':'')+'<label class="chk"><input type="checkbox" data-pl="show" '+k+(it.hidden?'':' checked')+'> Show on website</label></div></div>'+f('Model','data-pl="model" '+k,it.model,'iPhone 18 Pro Max')+f('Details (specs)','data-pl="spec" '+k,it.spec||'','e.g. 6.9-inch display · A20 Pro chip')+f('Colors','data-pl="colors" '+k,it.colors||'','e.g. Black, Silver');
   it.variants.forEach(function(v,vi){var kv=k+' data-v="'+vi+'"';
    var cols=String(it.colors||'').split(/[,·]/).map(function(x){return x.trim()}).filter(Boolean),ncp=cols.filter(function(cn){return v.cp&&v.cp[cn]}).length;
    h+='<div class="pl-var"><div class="two">'+f('Storage / option','data-pl="vlabel" '+kv,v.label,'256GB')+f('Price (₱)','data-pl="vprice" inputmode="numeric" '+kv,v.price,'Blank = message for price')+'</div>'+
     (cols.length?'<details class="cpx"'+(ncp?' open':'')+'><summary>Price per color'+(ncp?' · '+ncp+' set':'')+'</summary><p class="small">Only fill in a color whose dealer price is different. Blank = same as the price above.</p><div class="two">'+cols.map(function(cn){return f(cn,'data-pl="vcp" data-col="'+esc(cn)+'" inputmode="numeric" '+kv,(v.cp&&v.cp[cn])||'','Same price')}).join('')+'</div></details>':'')+
     '<div class="tools"><label class="chk"><input type="checkbox" data-pl="vavail" '+kv+(v.status!=='unavailable'?' checked':'')+'> Available</label>'+(it.variants.length>1?'<button class="del" data-plvdel="'+ci+','+ii+','+vi+'">Remove option</button>':'')+'</div></div>'});
   h+='<div class="tools"><button data-pladdv="'+ci+','+ii+'">+ Add storage option</button>'+(ii>0?'<button data-plmv="'+ci+','+ii+',-1">↑ Up</button>':'')+(ii<c.items.length-1?'<button data-plmv="'+ci+','+ii+',1">↓ Down</button>':'')+'<button class="del" data-pldel="'+ci+','+ii+'">Delete model</button></div></div>'});
  h+='<div class="tools"><button class="addrow" data-pladd="'+ci+'">+ Add model to '+esc(c.name)+'</button><button class="del" data-plcdel="'+ci+'">Delete category</button></div></div>'});
 h+='<button class="addrow" id="pl-addcat">+ Add category</button>'+f('Reminder label','data-pl="noteLabel"',P.noteLabel||'')+f('Reminder heading','data-pl="noteTitle"',P.noteTitle||'')+f('Reminder text (one paragraph per line)','data-pl="note"',(P.note||[]).join('\n'),'',1)+'</div></details>';
 return h}
function plSet(t){var d=t.dataset,P=state.priceList,c=P.categories[+d.c],it=c&&c.items[+d.i],v=it&&it.variants[+d.v];
 if(d.pl==='cname')c.name=t.value;else if(d.pl==='model')it.model=t.value;else if(d.pl==='spec')it.spec=t.value;else if(d.pl==='colors')it.colors=t.value;else if(d.pl==='show')it.hidden=!t.checked;else if(d.pl==='vlabel')v.label=t.value;
 else if(d.pl==='vprice'){var x=t.value.replace(/[^0-9]/g,'');v.price=x?Number(x):''}
 else if(d.pl==='vcp'){var y=t.value.replace(/[^0-9]/g,'');v.cp=v.cp||{};if(y)v.cp[d.col]=Number(y);else delete v.cp[d.col]}else if(d.pl==='vavail')v.status=t.checked?'available':'unavailable';
 else if(d.pl==='note')P.note=t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean);else P[d.pl]=t.value;
 P.updated=today()}
function plClick(t){var d=t.dataset,P=state.priceList;if(!P)return false;var a;
 function conf(){if(d.confirm)return true;d.confirm='1';t.textContent='Tap again to delete';return false}
 if(d.plnophoto){a=d.plnophoto.split(',');delete P.categories[+a[0]].items[+a[1]].photo}
 else if(d.pladdv){a=d.pladdv.split(',');P.categories[+a[0]].items[+a[1]].variants.push({label:'',price:'',status:'available'})}
 else if(d.plvdel){a=d.plvdel.split(',');P.categories[+a[0]].items[+a[1]].variants.splice(+a[2],1)}
 else if(d.pladd){P.categories[+d.pladd].items.push({id:'m'+Date.now().toString(36),model:'New model',spec:'',variants:[{label:'',price:'',status:'available'}]})}
 else if(d.pldel){if(!conf())return true;a=d.pldel.split(',');P.categories[+a[0]].items.splice(+a[1],1)}
 else if(d.plcdel){if(!conf())return true;P.categories.splice(+d.plcdel,1)}
 else if(d.plmv){a=d.plmv.split(',').map(Number);var L=P.categories[a[0]].items,j=a[1]+a[2],tmp=L[a[1]];L[a[1]]=L[j];L[j]=tmp}
 else if(t.id==='pl-addcat'){P.categories.push({id:'c'+Date.now().toString(36),name:'New category',items:[]})}
 else return false;
 P.updated=today();live();paintEd();return true}
/* ---------- owner: alerts, orders, quote links, payment settings ---------- */
var OPS={alerts:null,orders:null,qlink:'',qst:{key:'',pay:'cash',card:'',fee:'cash',name:'',price:'',days:'7'},err:''};
var OSTAT=['New Inquiry','For Owner Review','Quotation Sent','Awaiting Customer Confirmation','Order Confirmed','Awaiting Payment','Paid','Processing','Ready for Pickup','Shipped','Completed','Cancelled'];
function php0(n){return '₱'+Math.round(Number(n)||0).toLocaleString('en-PH')}
function payS(){var s=S();s.payment=s.payment||{};var p=s.payment;if(p.cardFee==null)p.cardFee=5;if(!p.faq)p.faq=[
 {q:'Bakit iba ang presyo ninyo sa mall?',k:'mall presyo price iba mahal mura',a:'Dealer price po ang presyo namin dahil direct kami sa dealers. Kaya pwede niyo pong i-compare sa current mall price bilang reference. Paalala lang po na nagbabago ang presyo depende sa dealer availability, kaya message niyo po kami para ma-confirm ang latest price at stock.',on:false},
 {q:'May dagdag ba kapag credit card?',k:'card credit swipe dagdag fee terminal charge percent',a:'May 5% terminal fee po sa amount na iswi-swipe sa card. Dealer price pa rin po ang presyo ng unit. Pwede niyo pong i-cash ang 5% at i-swipe lang ang presyo ng unit para hindi mabigat sa card.',on:false},
 {q:'Pwede bang gamitin ang points ng credit card?',k:'points rewards card puntos',a:'Kung pinapayagan po ng bank ninyo, pwede niyo pong gamitin ang rewards points ninyo pang-cover sa terminal fee. I-check niyo lang po sa bank ninyo ang rewards program.',on:false}];return p}
function plFlat(){var o=[];((state.priceList||{}).categories||[]).forEach(function(c){c.items.forEach(function(it){it.variants.forEach(function(v){o.push({id:it.id,label:v.label||'',name:it.model+(v.label?' '+v.label:''),price:Number(String(v.price).replace(/[^0-9]/g,''))||0})})})});return o}
function opsLoad(){if(!sb||!canWrite)return;
 Promise.all([sb.from('alerts').select('*').order('created_at',{ascending:false}).limit(50),sb.from('orders').select('*').order('created_at',{ascending:false}).limit(100)]).then(function(r){
  if(r[0].error||r[1].error){OPS.err=(r[0].error||r[1].error).message}else{var before=OPS.alerts?OPS.alerts.filter(function(a){return a.status==='open'}).length:null;OPS.alerts=r[0].data;OPS.orders=r[1].data;OPS.err='';
   var now=OPS.alerts.filter(function(a){return a.status==='open'}).length;if(before!==null&&now>before){toast('New RED ALERT');try{if(window.Notification&&Notification.permission==='granted')new Notification('Estilo Pinas: RED ALERT',{body:OPS.alerts[0].reason+' — '+OPS.alerts[0].name})}catch(e){}}}
  if(ed)paintEd()})}
var opsTimer=null;function opsStart(){opsLoad();if(!opsTimer)opsTimer=setInterval(opsLoad,60000)}
function when(t){var d=new Date(t);return d.toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function opsHTML(){if(!canWrite)return '';var h='';
 var al=OPS.alerts||[],open=al.filter(function(a){return a.status!=='resolved'});
 h+='<details class="ra'+(open.length?' hot':'')+'"'+(open.length?' open':'')+'><summary>'+(open.length?'🔴 RED ALERTS ('+open.length+')':'RED ALERTS (0)')+'</summary><div class="g">'+
  (OPS.err?'<p class="small">Could not load: '+esc(OPS.err)+'</p>':OPS.alerts===null?'<p class="small">Loading…</p>':'')+
  (window.Notification&&Notification.permission!=='granted'?'<button class="addrow" id="ops-notif">Turn on alerts on this device (while this page is open)</button>':'')+
  (open.length?'':'<p class="small">No customers waiting for you.</p>')+
  open.map(function(a){var tel='tel:'+String(a.contact).replace(/[^0-9+]/g,'');return '<div class="erow"><div class="small"><b>'+esc(a.ref)+'</b> · '+when(a.created_at)+' · '+esc(a.status)+'</div><b>'+esc(a.reason)+'</b><div>'+esc(a.name)+' · '+esc(a.contact)+' · prefers '+esc(a.pref||'—')+'</div>'+
   (a.need?'<div class="small">'+Object.keys(a.need).filter(function(k){return k[0]!=='_'&&a.need[k]}).map(function(k){return esc(k)+': '+esc(a.need[k])}).join(' · ')+'</div>':'')+
   (a.history&&a.history.length?'<details><summary class="small">Chat history ('+a.history.length+')</summary><div class="small">'+a.history.map(function(m){return '<div><b>'+(m.who==='me'?'Customer':'Assistant')+':</b> '+esc(m.text)+'</div>'}).join('')+'</div></details>':'')+
   '<div class="tools">'+(/[0-9]{7,}/.test(String(a.contact).replace(/\D/g,''))?'<a class="up" href="'+esc(tel)+'">Call</a>':'')+(a.status==='open'?'<button data-alst="'+a.id+'" data-to="in progress">I\'m handling it</button>':'')+'</div>'+
   '<div class="f"><label>Resolution (what you did)</label><input data-ares="'+a.id+'" placeholder="e.g. Called, reserved 256GB"></div><button class="addrow" data-ardone="'+a.id+'">Mark resolved</button></div>'}).join('')+'</div></details>';
 var od=OPS.orders||[],act=od.filter(function(o){return ['Completed','Cancelled'].indexOf(o.status)<0});
 h+='<details'+(act.some(function(o){return o.status==='New Inquiry'||o.status==='For Owner Review'})?' open':'')+'><summary>Orders ('+act.length+' active)</summary><div class="g">'+(od.length?'':'<p class="small">No order requests yet.</p>')+
  od.map(function(o){var q=o.quote||{},c=o.customer||{},it=o.item||{},d=o.delivery||{};
   return '<div class="erow"><div class="small"><b>'+esc(o.ref)+'</b> · '+when(o.created_at)+' · '+esc(o.price_source)+'</div><b>'+esc((it.model||'')+' '+(it.variant||''))+'</b>'+(it.lines&&it.lines.length>1?'<div class="small">'+it.lines.map(function(l){return esc(l.model+' '+l.variant)+(l.qty>1?' ×'+l.qty:'')+' — '+php0(l.price*(l.qty||1))}).join('<br>')+'</div>':'')+
   '<div>'+esc(c.name)+' · <a href="tel:'+esc(c.mobile)+'">'+esc(c.mobile)+'</a>'+(c.email?' · '+esc(c.email):'')+'</div>'+
   '<div class="small">Total '+php0(q.total)+' · '+(q.card>0?'cash '+php0(q.cashDue)+' + swipe '+php0(q.swipe)+' (fee '+php0(q.fee)+' '+(q.feeBy==='cash'?'in cash':'on card')+')':'cash')+'</div>'+
   '<div class="small">'+esc(d.how||'')+(d.address?' · '+esc(d.address):'')+(o.notes?' · “'+esc(o.notes)+'”':'')+(o.source?' · from '+esc(o.source):'')+'</div>'+
   '<div class="two"><div class="f"><label>Status</label><select data-ost="'+o.id+'">'+OSTAT.map(function(x){return '<option'+(x===o.status?' selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
   '<div class="f"><label>My notes</label><input data-onote="'+o.id+'" value="'+esc(o.owner_notes||'')+'"></div></div></div>'}).join('')+'</div></details>';
 var Q=OPS.qst,L=plFlat();
 h+='<details><summary>Make a quote link</summary><div class="g"><p class="small">Creates a quotation page you can send to a customer. Valid for the days you choose.</p>'+
  '<div class="f"><label>Gadget</label><select data-q="key"><option value="">Custom item / price…</option>'+L.map(function(x){var k=x.id+'~'+x.label;return '<option value="'+esc(k)+'"'+(Q.key===k?' selected':'')+'>'+esc(x.name)+' — '+php0(x.price)+'</option>'}).join('')+'</select></div>'+
  (Q.key?'':f('Item name','data-q="title"',Q.title||'','e.g. iPhone 18 Pro Max 1TB'))+
  f('Price (₱)'+(Q.key?' — leave blank to use the price list':''),'data-q="price" inputmode="numeric"',Q.price,'')+
  '<div class="two"><div class="f"><label>Payment</label><select data-q="pay">'+[['cash','Cash'],['card','Credit card'],['split','Split']].map(function(m){return '<option value="'+m[0]+'"'+(Q.pay===m[0]?' selected':'')+'>'+m[1]+'</option>'}).join('')+'</select></div>'+
  '<div class="f"><label>Card fee paid</label><select data-q="fee"><option value="cash"'+(Q.fee==='cash'?' selected':'')+'>In cash</option><option value="card"'+(Q.fee==='card'?' selected':'')+'>Added to card</option></select></div></div>'+
  (Q.pay==='split'?f('Amount on card (₱)','data-q="card" inputmode="numeric"',Q.card,''):'')+
  '<div class="two">'+f('Customer name (goes in the link)','data-q="name"',Q.name,'')+f('Valid for (days)','data-q="days" inputmode="numeric"',Q.days,'7')+'</div>'+
  '<button class="btn sm" id="q-make">Create link</button>'+(OPS.qlink?'<div class="erow"><b class="small">Link ready:</b><input readonly value="'+esc(OPS.qlink)+'" onclick="this.select()"><div class="tools"><button id="q-copy">Copy link</button><button id="q-copym">Copy message</button><a class="up" target="_blank" rel="noopener" href="'+esc(OPS.qlink)+'">Open</a></div></div>':'')+'</div></details>';
 var p=payS();
 h+='<details><summary>Payment settings & assistant answers</summary><div class="g">'+f('Card terminal fee (%)','data-pay="cardFee" inputmode="decimal"',p.cardFee,'5')+
  f('Card note (Payment guide)','data-pay="feeNote"',p.feeNote||'','Card payments have a 5% terminal fee on the amount you swipe…',1)+
  f('Paying the fee in cash (note)','data-pay="feeCashNote"',p.feeCashNote||'','Many customers pay the 5% in cash and swipe only the item price…',1)+
  f('Card points tip','data-pay="pointsNote"',p.pointsNote||'','',1)+
  '<p class="small"><b>Assistant answers.</b> The assistant only uses answers you add and switch on here. Keywords help it find the right answer.</p>'+
  p.faq.map(function(x,i){return '<div class="erow">'+f('Customer question','data-faq="q" data-i="'+i+'"',x.q||'','e.g. Bakit iba ang presyo ninyo sa mall?')+f('Keywords','data-faq="k" data-i="'+i+'"',x.k||'','mall presyo price iba')+f('Your answer','data-faq="a" data-i="'+i+'"',x.a||'','',1)+
   '<div class="tools"><label class="chk"><input type="checkbox" data-faq="on" data-i="'+i+'"'+(x.on!==false?' checked':'')+'> Approved (assistant can use it)</label><button class="del" data-faqdel="'+i+'">Delete</button></div></div>'}).join('')+
  '<button class="addrow" id="faq-add">+ Add an answer</button></div></details>';
 return h}
function opsInput(t){var d=t.dataset;
 if(d.pay){var p=payS();p[d.pay]=d.pay==='cardFee'?(t.value.replace(/[^0-9.]/g,'')):t.value;return 'live'}
 if(d.faq){var x=payS().faq[+d.i];x[d.faq]=d.faq==='on'?t.checked:t.value;return 'live'}
 if(d.q){OPS.qst[d.q]=t.value;OPS.qlink='';return t.tagName==='SELECT'?'paint':'none'}
 return ''}
function opsChange(t){var d=t.dataset;
 if(d.ost){sb.from('orders').update({status:t.value}).eq('id',d.ost).then(function(r){toast(r.error?'Could not update: '+r.error.message:'Status saved');opsLoad()});return true}
 if(d.onote){sb.from('orders').update({owner_notes:t.value}).eq('id',d.onote).then(function(r){toast(r.error?'Could not save note':'Note saved')});return true}
 return false}
function opsClick(t){var d=t.dataset;
 if(t.id==='ops-notif'){try{Notification.requestPermission().then(function(){paintEd()})}catch(e){}return true}
 if(d.alst){sb.from('alerts').update({status:d.to}).eq('id',d.alst).then(function(r){toast(r.error?'Could not update':'Marked as handling');opsLoad()});return true}
 if(d.ardone){var inp=ed.querySelector('[data-ares="'+d.ardone+'"]'),res=(inp&&inp.value||'').trim();if(!res){toast('Write what you did first');return true}
  sb.from('alerts').update({status:'resolved',resolution:res,resolved_at:new Date().toISOString()}).eq('id',d.ardone).then(function(r){toast(r.error?'Could not update':'Resolved');opsLoad()});return true}
 if(t.id==='faq-add'){payS().faq.push({q:'',k:'',a:'',on:false});live();paintEd();return true}
 if(d.faqdel){if(!d.confirm){d.confirm='1';t.textContent='Tap again to delete';return true}payS().faq.splice(+d.faqdel,1);live();paintEd();return true}
 if(t.id==='q-copym'){var fn=String(OPS.qname||'').trim().split(/\s+/)[0];var msg=(fn?'Hi '+fn+'! ':'Hi! ')+'Here is your Estilo Pinas quotation, with the price and payment breakdown: '+OPS.qlink;try{navigator.clipboard.writeText(msg).then(function(){toast('Message copied')})}catch(e){}return true}
 if(t.id==='q-copy'){try{navigator.clipboard.writeText(OPS.qlink).then(function(){toast('Link copied')})}catch(e){}return true}
 if(t.id==='q-make'){var Q=OPS.qst,parts=(Q.key||'').split('~'),it=Q.key?plFlat().find(function(x){return x.id===parts[0]&&x.label===parts.slice(1).join('~')}):null;
  var price=String(Q.price||'').replace(/[^0-9]/g,'')||(it?String(it.price):'');if(!price){toast('Enter a price');return true}
  t.disabled=true;t.textContent='Creating…';
  sb.rpc('create_quote',{p:{price:price,m:it?it.id:'',v:it?it.label:'',title:it?it.name:(Q.title||''),pay:Q.pay,card:Q.card,fee:Q.fee,name:Q.name,days:Q.days||'7'}}).then(function(r){
   if(r.error){toast('Could not create: '+r.error.message);t.disabled=false;t.textContent='Create link';return}var sl=String(Q.name||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);OPS.qlink=location.origin+(sl?'/for/'+sl+'-'+r.data:'/q?c='+r.data);OPS.qname=Q.name||'';paintEd()});return true}
 return false}
function openEditor(){editing=true;stopRail();if(!ed){ed=document.createElement('aside');ed.className='ed';ed.setAttribute('aria-label','Edit site');document.body.appendChild(ed);wireEd()}paintEd();render()}
function paintEd(){var open=[].map.call(ed.querySelectorAll('details'),function(d){return d.open}),sc=(ed.querySelector('.ed-b')||{}).scrollTop||0;ed.innerHTML=edHTML();
 if(open.length)ed.querySelectorAll('details').forEach(function(d,i){d.open=!!open[i]});ed.querySelectorAll('details.ra.hot').forEach(function(d){d.open=true});var b=ed.querySelector('.ed-b');if(b)b.scrollTop=sc}
var rt=0,at=0;function live(){dirty=true;var st=document.getElementById('ed-state');if(st)st.textContent='Saving soon…';clearTimeout(rt);rt=setTimeout(render,180);
 /* autosave: every change is saved by itself ~1.5s after the owner stops typing */
 if(canWrite&&sb){clearTimeout(at);at=setTimeout(autoSave,1500)}}
var saving=false,again=false;function autoSave(){if(!dirty||!sb)return;if(saving){again=true;return}saving=true;var snap=JSON.stringify(state),st=document.getElementById('ed-state');if(st)st.textContent='Saving…';
 sb.from('site').upsert({id:'main',data:state,updated_at:new Date().toISOString()}).then(function(r){saving=false;var st=document.getElementById('ed-state');
  if(r.error){if(st)st.textContent='Not saved — tap Save. ('+r.error.message+')';toast('Could not save: '+r.error.message);return}
  saved=snap;if(JSON.stringify(state)===snap)dirty=false;if(st)st.textContent='✓ Saved '+new Date().toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit'})+' · customers see it now';
  if(again||dirty){again=false;clearTimeout(at);at=setTimeout(autoSave,600)}},function(){saving=false;var st=document.getElementById('ed-state');if(st)st.textContent='Not saved — check internet, then tap Save.'})}
function wireEd(){
 ed.addEventListener('input',function(e){var t=e.target,d=t.dataset,s=S();
  if(d.pl){plSet(t);live();return}
  var oi=opsInput(t);if(oi){if(oi==='live')live();else if(oi==='paint')paintEd();return}
  if(d.p==='specsText'){var p0=find(d.id);p0.specs=t.value.split('\n').map(function(l){var i=l.indexOf(':');return i>0?{k:l.slice(0,i).trim(),v:l.slice(i+1).trim()}:null}).filter(Boolean)}
  else if(d.p){var p=find(d.id);p[d.p]=t.type==='checkbox'?t.checked:t.value;p.sample=false}
  else if(d.s){s[d.s]=d.s==='ticker'?t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean):t.value}
  else if(d.rw){s.reviews[+d.i][d.rw]=t.value}
  else if(d.w){s.ways[+d.i][d.w]=t.value}else if(d.pm){s.promise[+d.i][d.pm]=t.value}else if(d.st){s.stats[+d.i][d.st]=t.value}else return;
  live()});
 ed.addEventListener('change',function(e){var t=e.target,d=t.dataset;
  if(d.pl==='colors'){paintEd();return}
  if(opsChange(t))return;
  if(d.plup&&t.files&&t.files[0]){var pa=d.plup.split(',');toast('Adding photo…');resizeImg(t.files[0],1100,function(du){uploadImg(du,function(url){var it=state.priceList.categories[+pa[0]].items[+pa[1]];it.photo=url;state.priceList.updated=today();live();paintEd()})});return}if(d.q&&t.tagName==='SELECT'){OPS.qst[d.q]=t.value;OPS.qlink='';paintEd();return}
  if(d.p==='status'||d.p==='featured'||d.p==='spotlight'){var p=find(d.id);if(d.p==='spotlight'&&t.checked)state.products.forEach(function(x){x.spotlight=false});p[d.p]=t.type==='checkbox'?t.checked:t.value;p.sample=false;live();if(d.p==='spotlight')paintEd()}
  if(d.rwon!=null&&d.rwon!==''){S().reviews[+d.rwon].on=t.checked;live();return}
  if(d.rwup&&t.files&&t.files[0]){toast('Adding photo…');resizeImg(t.files[0],1100,function(du){uploadImg(du,function(url){S().reviews[+d.rwup].photo=url;live();paintEd()})});return}
  if(d.gup&&t.files&&t.files[0]){toast('Adding photo…');resizeImg(t.files[0],1100,function(du){uploadImg(du,function(url){var p=find(d.gup);(p.photos=p.photos||[]).push(url);live();paintEd()})})}
  if((d.up||d.upk)&&t.files&&t.files[0]){toast('Adding photo…');resizeImg(t.files[0],d.upk==='storePhoto'?1600:1100,function(du){uploadImg(du,function(url){if(d.up){var p=find(d.up);p.photo=url;p.sample=false}else S()[d.upk]=url;live();paintEd()})},d.upk==='storePhoto')}});
 ed.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;var d=t.dataset,s=S();
  if(plClick(t))return;
  if(opsClick(t))return;
  if(t.id==='ed-close'){editing=false;ed.remove();ed=null;render();if(dirty)toast('Not saved yet. Open Edit site and tap Save.');return}
  if(t.id==='ed-cancel'){state=JSON.parse(saved);dirty=false;paintEd();render();return}
  if(t.id==='ed-save')return save(t);
  if(t.id==='ed-add'){state.products.unshift({id:'p'+Date.now().toString(36),name:'New unit',spec:'Brand new, sealed',cat:'iPhone',price:'',status:'available',photo:'',featured:true});live();paintEd();return}
  if(t.id==='ed-rwadd'){(s.reviews=s.reviews||[]).unshift({n:'',d:'',t:'',photo:'',on:true});live();paintEd();return}
  if(d.rwdel){if(d.confirm){s.reviews.splice(+d.rwdel,1);live();paintEd();return}d.confirm='1';t.textContent='Tap again to delete';return}
  if(d.rwnoph){s.reviews[+d.rwnoph].photo='';live();paintEd();return}
  if(d.rwmv){var ri=+d.i,rr=s.reviews.splice(ri,1)[0];s.reviews.splice(ri-1,0,rr);live();paintEd();return}
  if(t.id==='ed-wadd'){s.ways.push({t:'New way to buy',d:''});live();paintEd();return}
  if(d.wdel){s.ways.splice(+d.wdel,1);live();paintEd();return}
  if(d.del){if(d.confirm){state.products=state.products.filter(function(x){return x.id!==d.del});live();paintEd();return}d.confirm='1';t.textContent='Tap again to delete';return}
  if(d.gdel){var pg=find(d.gdel);pg.photos.splice(+d.j,1);live();paintEd();return}
  if(d.nophoto){find(d.nophoto).photo='';live();paintEd();return}
  if(d.clr){s[d.clr]='';live();paintEd();return}
  if(d.mv){var a=state.products,i=a.findIndex(function(x){return x.id===d.id}),j=i+Number(d.mv),tmp=a[i];a[i]=a[j];a[j]=tmp;live();paintEd();return}});
}
function cutout(c){var x=c.getContext('2d'),w=c.width,h=c.height,d=x.getImageData(0,0,w,h),p=d.data,i;
 function bgAt(k){var r=p[k],g=p[k+1],b=p[k+2];return p[k+3]<20||(r>222&&g>222&&b>222&&Math.max(r,g,b)-Math.min(r,g,b)<26)}
 var corners=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4],tr=corners.filter(function(k){return p[k+3]<20}).length>=3;if(tr)bgAt=function(k){var r=p[k],g=p[k+1],b=p[k+2];return p[k+3]<20||(r>=252&&g>=252&&b>=252)||(Math.abs(r-245)<=3&&Math.abs(g-245)<=3&&Math.abs(b-247)<=3)};else if(corners.filter(bgAt).length<3)return c;
 var seen=new Uint8Array(w*h),st=[];for(i=0;i<w;i++){st.push(i,(h-1)*w+i)}for(i=0;i<h;i++){st.push(i*w,i*w+w-1)}
 while(st.length){var q=st.pop();if(seen[q])continue;var k=q*4;if(!bgAt(k))continue;seen[q]=1;p[k+3]=0;var px=q%w,py=(q/w)|0;if(px>0)st.push(q-1);if(px<w-1)st.push(q+1);if(py>0)st.push(q-w);if(py<h-1)st.push(q+w)}
 for(i=0;i<w*h;i++){if(seen[i])continue;var nx=i%w,ny=(i/w)|0;if((nx>0&&seen[i-1])||(nx<w-1&&seen[i+1])||(ny>0&&seen[i-w])||(ny<h-1&&seen[i+w]))p[i*4+3]=Math.min(p[i*4+3],150)}
 x.putImageData(d,0,0);return c}
function trim(c){var x=c.getContext('2d'),w=c.width,h=c.height,p=x.getImageData(0,0,w,h).data,x0=w,y0=h,x1=-1,y1=-1;
 for(var y=0;y<h;y++)for(var xx=0;xx<w;xx++){if(p[(y*w+xx)*4+3]>16){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;if(y>y1)y1=y}}
 if(x1<0)return c;var pad=Math.round(Math.max(x1-x0,y1-y0)*.03);x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w-1,x1+pad);y1=Math.min(h-1,y1+pad);
 var o=document.createElement('canvas');o.width=x1-x0+1;o.height=y1-y0+1;o.getContext('2d').drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o}
function resizeImg(file,max,cb,photo){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){
  var sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  if(photo){cb(c.toDataURL('image/jpeg',.88));return}
  var out=trim(cutout(c));cb(out.toDataURL('image/png'))};img.onerror=function(){toast('This photo type can\'t be read. Use a PNG or JPG.')};img.src=r.result};r.readAsDataURL(file)}


function uploadImg(dataUrl,cb){if(!sb){toast('Log in first');return}
 fetch(dataUrl).then(function(r){return r.blob()}).then(function(blob){var ext=blob.type==='image/png'?'png':'jpg',path='p/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+ext;
  return sb.storage.from('photos').upload(path,blob,{contentType:blob.type,upsert:false}).then(function(r){if(r.error)throw r.error;cb(sb.storage.from('photos').getPublicUrl(path).data.publicUrl);toast('Photo added. Tap Save.')})})
 .catch(function(e){toast('Photo upload failed: '+((e&&e.message)||'try again'))})}
function save(btn){
 if(!sb){toast('Log in first');return}
 btn.disabled=true;btn.textContent='Saving…';
 sb.from('site').upsert({id:'main',data:state,updated_at:new Date().toISOString()}).then(function(r){btn.disabled=false;btn.textContent='Save';
  if(r.error){toast('Could not save: '+r.error.message);return}
  saved=JSON.stringify(state);dirty=false;var st=document.getElementById('ed-state');if(st)st.textContent='Saved. Customers see it now.';toast('Saved. The live site is updated.')})}
/* use our own domain's /sb proxy; fall back to the direct database address if that ever fails */
var pinged=null;function ping(){if(pinged)return pinged;if(!CFG.direct||CFG.direct===CFG.url)return (pinged=Promise.resolve());
 return (pinged=fetch(CFG.url+'/rest/v1/site?id=eq.main&select=id',{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(function(r){if(!r.ok)throw 0}).catch(function(){CFG.url=CFG.direct}))}
function loadRemote(){if(!CFG.url)return Promise.resolve();return ping().then(loadRemote2)}
function loadRemote2(){
 return fetch(CFG.url+'/rest/v1/site?id=eq.main&select=data',{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(function(r){return r.json()}).then(function(rows){
  if(rows&&rows[0]&&rows[0].data&&!dirty){state=withPL(rows[0].data);saved=JSON.stringify(state);render();if(ed)paintEd()}}).catch(function(){})}
/* owner login (admin page only) */
function loginBox(msg){var b=document.getElementById('lg');if(!b){b=document.createElement('div');b.id='lg';b.className='lg';document.body.appendChild(b)}
 b.innerHTML='<form class="lgf" id="lgf"><span class="mk">'+mark('currentColor','url(#epg)')+'</span><p class="lbl">Owner only</p><h3 class="disp">Edit Estilo Pinas</h3>'+
 '<div class="f"><label for="lg-e">Email</label><input id="lg-e" type="email" autocomplete="username" required></div><div class="f"><label for="lg-p">Password</label><input id="lg-p" type="password" autocomplete="current-password" minlength="8" required></div>'+
 '<button class="btn" type="submit">Log in</button><button class="tlink" type="button" id="lg-new">First time? Create my password</button><p class="small" id="lg-m">'+(msg||'')+'</p><a class="tlink" href="/">View the shop</a></form>';
 var form=b.querySelector('#lgf'),m=b.querySelector('#lg-m');
 function go(fn){var e=b.querySelector('#lg-e').value.trim(),p=b.querySelector('#lg-p').value;if(p.length<8){m.textContent='Password needs at least 8 characters.';return}m.textContent='One moment…';
  fn(e,p).then(function(r){if(r.error){m.textContent=r.error.message;return}return sb.auth.signInWithPassword({email:e,password:p}).then(function(x){if(x.error){m.textContent=x.error.message;return}afterLogin()})})}
 form.addEventListener('submit',function(ev){ev.preventDefault();go(function(e,p){return sb.auth.signInWithPassword({email:e,password:p})})});
 b.querySelector('#lg-new').addEventListener('click',function(){go(function(e,p){return sb.auth.signUp({email:e,password:p})})});
}
function afterLogin(){sb.rpc('is_owner').then(function(r){if(r.data===true){var b=document.getElementById('lg');if(b)b.remove();canWrite=true;openEditor();addOut();opsStart()}else{sb.auth.signOut();loginBox('This account cannot edit this shop.')}})}
function addOut(){render();document.addEventListener('click',function(e){if(!e.target.closest('#lgout'))return;if(dirty){autoSave();toast('Saving first…');setTimeout(function(){sb.auth.signOut().then(function(){location.reload()})},1800);return}sb.auth.signOut().then(function(){location.reload()})})}
render();loadRemote().then(function(){var h=(location.hash||'').slice(1);if(h&&find(h))openView(h)});
if(window.EP_MODE==='admin'){
 if(!(window.supabase&&window.supabase.createClient)){toast('Login could not load. Check your internet and reload.')}
 else{ping().then(function(){sb=window.supabase.createClient(CFG.url,CFG.key);sb.auth.getSession().then(function(r){if(r.data&&r.data.session)afterLogin();else loginBox()})})}
}
})();
