(function(){
var state=JSON.parse(document.getElementById('shop-data').textContent),saved=JSON.stringify(state),CFG=window.EP_CONFIG||{},sb=null;
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
function mark(fg,notch){return '<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="epg" gradientUnits="userSpaceOnUse" x1="222" y1="0" x2="290" y2="0"><stop offset="0" stop-color="#ff4f9a"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#3d8bff"/></linearGradient></defs><path d="M92 262H420V196A76 76 0 0 0 344 120H168A76 76 0 0 0 92 196V316A76 76 0 0 0 168 392H392" fill="none" stroke="'+fg+'" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/><path d="M222 172H290" stroke="'+(notch||fg)+'" stroke-width="18" stroke-linecap="round"/></svg>'}
function logoMk(){return S().logo?'<img alt="" src="'+S().logo+'">':mark('currentColor','url(#epg)')}
function box(){return '<div class="bx"><div class="scr"></div><span class="seal">SEALED</span></div>'}
function pic(p){return p.photo?'<img alt="'+esc(p.name+' '+p.spec)+'" src="'+p.photo+'">':box()}
function msgrUrl(text){var m=(S().messenger||'').trim();if(!m)return (S().fb||'').trim();var base=/^https?:\/\//.test(m)?m:'https://m.me/'+m.replace(/^@/,'').replace(/^(www\.)?(facebook\.com|m\.me)\//,'');return base+(base.indexOf('?')<0?'?':'&')+'text='+encodeURIComponent(text)}
function mapsUrl(){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(S().mapsQuery||S().address)}
function wazeUrl(){return 'https://waze.com/ul?q='+encodeURIComponent(S().mapsQuery||S().address)}
function featured(){var f=state.products.filter(function(p){return p.featured});return f.length?f:state.products}
var SPOTS=[{x:'30%',y:'8%',w:'40%',d:22,z:3,r:'-2deg'},{x:'2%',y:'30%',w:'30%',d:12,z:2,r:'3deg'},{x:'66%',y:'30%',w:'30%',d:14,z:2,r:'-3deg'},{x:'20%',y:'60%',w:'22%',d:6,z:1,r:'2deg'},{x:'58%',y:'64%',w:'20%',d:5,z:1,r:'-2deg'}];
function stage(items,cls){return '<div class="stage'+(cls?' '+cls:'')+'" aria-hidden="true">'+items.slice(0,SPOTS.length).map(function(p,i){var s=SPOTS[i];return '<div class="fl" style="--x:'+s.x+';--y:'+s.y+';--w:'+s.w+';--d:'+s.d+';--z:'+s.z+';--r:'+s.r+';--i:'+i+'"><div class="obj">'+pic(p)+'</div><div class="sh"></div></div>'}).join('')+'</div>'}

function render(){
 stopRail();
 var s=S(),h='';
 h+='<nav class="nav"><div class="wrap"><a class="logo" href="#top"><span class="mk">'+logoMk()+'</span><span class="wm">'+esc(s.shopName)+'</span></a>'+
  '<div class="navlinks"><a href="#drop">Shop</a><a href="#all">All units</a><a href="#ways">Ways to buy</a><a href="#visit">Visit</a></div><div class="acts">'+
  (canWrite&&!editing?'<button class="ownerbtn" id="b-edit">Edit site</button>':'')+'<button class="btn sm" data-msg="1">Message</button></div></div></nav>';
 var lines=String(s.heroTitle||'').split('\n').filter(Boolean),fp=featured();
 h+='<header class="hero" id="top"><div class="wrap"><div><p class="lbl">'+esc(s.heroEyebrow)+'</p><h1 class="disp">'+lines.map(function(l){return '<span>'+esc(l)+'</span>'}).join('')+'</h1>'+
  '<p class="sub">'+esc(s.heroSub)+'</p><div class="cta"><a class="btn" href="#drop">Shop now</a><button class="btn ghost" data-msg="1">Message us</button></div>'+
  '<dl class="stats">'+(s.stats||[]).filter(function(x){return x.n}).map(function(x){return '<div><dt>'+esc(x.n)+'</dt><dd class="lbl">'+esc(x.l)+'</dd></div>'}).join('')+'</dl><div class="gl"></div></div>'+
  stage(fp,'hero-stage')+'</div></header>';
 var tk=(s.ticker||[]).filter(Boolean);
 if(tk.length){var one=tk.map(function(t){return '<span>'+esc(t)+'</span>'}).join('');h+='<div class="ticker" aria-label="'+esc(tk.join(', '))+'"><div class="tk" aria-hidden="true">'+one+one+one+one+'</div></div>'}
 h+='<section class="sec" id="drop"><div class="wrap sh2"><div><p class="lbl">New arrivals</p><h2 class="disp">'+esc(s.railTitle)+'</h2><p>'+esc(s.railSub)+'</p></div><div class="arrows"><button aria-label="Previous" data-rail="-1">←</button><button aria-label="Next" data-rail="1">→</button></div></div>'+
  '<div class="track" id="track">'+fp.map(function(p,i){return '<button class="slot" data-slot="'+p.id+'" style="--i:'+i+'" aria-label="'+esc(p.name+' '+p.spec)+'"><div class="in"><div class="obj">'+pic(p)+'</div><div class="sh"></div></div></button>'}).join('')+'</div>'+
  '<div class="wrap focus" id="focus" aria-live="polite"></div><div class="dots" id="dots">'+fp.map(function(){return '<i></i>'}).join('')+'</div></section>';
 var c=cats(),list=state.products.filter(function(p){return filter==='All'||p.cat===filter});
 h+='<section class="sec" id="all" style="padding-top:20px"><div class="wrap"><div class="sh2"><div><p class="lbl">Full list</p><h2 class="disp">All units</h2><p>Prices can change. We confirm stock and price before you pay.</p></div></div>'+
  (c.length>1?'<div class="chips" role="group" aria-label="Category">'+['All'].concat(c).map(function(x){return '<button class="chip" aria-pressed="'+(filter===x)+'" data-cat="'+esc(x)+'">'+esc(x)+'</button>'}).join('')+'</div>':'')+
  '<div class="grid">'+(list.length?list.map(card).join(''):'<div class="empty">No units listed yet. Message us for what we have today.</div>')+'</div></div></section>';
 h+='<section class="sec" id="ways" style="padding-top:20px"><div class="wrap"><div class="promise">'+(s.promise||[]).map(function(x,i){return '<div><span class="lbl">0'+(i+1)+'</span><b>'+esc(x.t)+'</b><p>'+esc(x.d)+'</p></div>'}).join('')+'</div>'+
  '<div class="sh2" style="margin-top:88px"><div><p class="lbl">Delivery & payment</p><h2 class="disp">Ways to buy</h2></div></div><div class="ways">'+
  (s.ways||[]).map(function(w,i){return '<article class="way"><span class="n">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(w.t)+'</h3><p>'+esc(w.d)+'</p></div></article>'}).join('')+'</div></div></section>';
 h+='<section class="sec visit" id="visit"><div class="wrap"><div><p class="lbl">Physical store</p><h2 class="disp">Come see it sealed.</h2><dl>'+
  (s.address?'<div><dt class="lbl">Address</dt><dd>'+esc(s.address)+'</dd></div>':'')+(s.hours?'<div><dt class="lbl">Hours</dt><dd>'+esc(s.hours)+'</dd></div>':'')+
  (s.phone?'<div><dt class="lbl">Call / Viber</dt><dd><span class="sel">'+esc(s.phone)+'</span></dd></div>':'')+'</dl><div class="cta"><a class="btn" target="_blank" rel="noopener" href="'+esc(mapsUrl())+'">Google Maps</a><a class="btn ghost" target="_blank" rel="noopener" href="'+esc(wazeUrl())+'">Waze</a>'+(s.fb?'<a class="btn ghost" target="_blank" rel="noopener" href="'+esc(s.fb)+'">Facebook</a>':'')+'</div></div>'+
  '<div class="storeimg">'+(s.storePhoto?'<img alt="Estilo Pinas store" src="'+s.storePhoto+'">':stage(fp.slice().reverse()))+'</div></div></section>';
 h+='<footer><div class="wrap"><a class="logo" href="#top"><span class="mk">'+logoMk()+'</span><span class="wm">'+esc(s.shopName)+'</span></a><span class="lbl">Since 2014 · All units brand new & sealed</span></div></footer>';
 if(!editing)h+='<button class="btn fab" data-msg="1">Order on Messenger</button>';
 app.innerHTML=h;
 setupRail();setupParallax();
}
function card(p){var sold=p.status==='soldout',pr=peso(p.price);
 return '<article class="pc'+(sold?' sold':'')+'"><div class="ph">'+pic(p)+(p.sample?'<span class="sample">SAMPLE</span>':'')+'</div><div class="sh"></div><div class="bd"><div class="nm">'+esc(p.name)+'</div><div class="sp">'+esc(p.spec)+'</div>'+
 '<div class="rw"><span class="pr'+(pr?'':' ask')+'">'+(pr||'Message for price')+'</span><span class="st s-'+p.status+'">'+STATUS[p.status]+'</span></div>'+
 '<button class="tlink" data-order="'+p.id+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':p.status==='preorder'?'Pre-order →':'Order →')+'</button></div></article>'}

function setupParallax(){if(RM)return;var st=document.querySelector('.hero-stage'),hero=document.querySelector('.hero');if(!st||!hero)return;
 hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();st.style.setProperty('--mx',((e.clientX-r.left)/r.width-.5).toFixed(3));st.style.setProperty('--my',((e.clientY-r.top)/r.height-.5).toFixed(3))});
 hero.addEventListener('pointerleave',function(){st.style.setProperty('--mx',0);st.style.setProperty('--my',0)})}
function setupRail(){var t=document.getElementById('track');if(!t)return;var dots=[].slice.call(document.querySelectorAll('#dots i'));
 var upd=function(){railRAF=0;var r=t.getBoundingClientRect(),cx=r.left+r.width/2,best=null,bd=1e9,bi=0;
  t.querySelectorAll('.slot').forEach(function(el,i){var b=el.getBoundingClientRect(),d=Math.abs(b.left+b.width/2-cx),n=Math.min(d/(b.width*1.4),1);
   el.querySelector('.in').style.setProperty('--s',(1-n*.42).toFixed(3));el.style.opacity=(1-n*.6).toFixed(2);if(d<bd){bd=d;best=el;bi=i}});
  dots.forEach(function(d,i){d.classList.toggle('on',i===bi)});
  if(best&&best.dataset.slot!==focusId){focusId=best.dataset.slot;showFocus()}};
 t.addEventListener('scroll',function(){if(!railRAF)railRAF=requestAnimationFrame(upd)},{passive:true});
 ['pointerdown','wheel','touchstart'].forEach(function(e){t.addEventListener(e,function(){railUser=true},{passive:true})});
 focusId=null;upd();
 if(!RM)railTimer=setInterval(function(){if(railUser||editing||document.hidden)return;var items=t.querySelectorAll('.slot');if(items.length<2)return;
  var cur=[].findIndex.call(items,function(x){return x.dataset.slot===focusId}),nx=items[(cur+1)%items.length];
  t.scrollTo({left:nx.offsetLeft-(t.clientWidth-nx.offsetWidth)/2,behavior:'smooth'})},3600);
}
function stopRail(){if(railTimer)clearInterval(railTimer);railTimer=null}
function showFocus(){var f=document.getElementById('focus'),p=find(focusId);if(!f||!p)return;var pr=peso(p.price),sold=p.status==='soldout';
 f.innerHTML='<span class="st s-'+p.status+'">'+STATUS[p.status]+'</span><div class="disp nm">'+esc(p.name)+'</div><div class="sp">'+esc(p.spec)+'</div><div class="pr">'+(pr||'Message for price')+'</div>'+
 '<button class="btn sm" data-order="'+p.id+'"'+(sold?' disabled':'')+'>'+(sold?'Sold out':'See availability')+'</button>'}

function openOrder(id){var p=id?find(id):null,s=S();
 var text=p?'Hi '+s.shopName+'! I want to '+(p.status==='preorder'?'pre-order':'order')+': '+p.name+(p.spec?' ('+p.spec+')':'')+(peso(p.price)?' – '+peso(p.price):'')+'. Is it available?':'Hi '+s.shopName+'! I have a question about a unit.';
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

app.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;
 if(t.dataset.order)return openOrder(t.dataset.order);
 if(t.dataset.msg)return openOrder(null);
 if(t.dataset.cat){filter=t.dataset.cat;return render()}
 if(t.dataset.slot){if(t.dataset.slot===focusId)return openOrder(t.dataset.slot);railUser=true;var tr=document.getElementById('track');tr.scrollTo({left:t.offsetLeft-(tr.clientWidth-t.offsetWidth)/2,behavior:RM?'auto':'smooth'});return}
 if(t.dataset.rail){railUser=true;document.getElementById('track').scrollBy({left:Number(t.dataset.rail)*250,behavior:RM?'auto':'smooth'});return}
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
  '<div class="two"><div class="f"><label>Status</label><select data-p="status" data-id="'+p.id+'">'+o+'</select></div><label class="chk"><input type="checkbox" data-p="featured" data-id="'+p.id+'"'+(p.featured?' checked':'')+'> Show in top section</label></div>'+
  '<div class="tools">'+(i>0?'<button data-mv="-1" data-id="'+p.id+'">↑ Up</button>':'')+(i<state.products.length-1?'<button data-mv="1" data-id="'+p.id+'">↓ Down</button>':'')+'<button class="del" data-del="'+p.id+'">Delete</button></div></div>'}).join('');
 var ways=(s.ways||[]).map(function(w,i){return '<div class="erow">'+f('Title','data-w="t" data-i="'+i+'"',w.t)+f('Details','data-w="d" data-i="'+i+'"',w.d,'',1)+'<div class="tools"><button class="del" data-wdel="'+i+'">Delete</button></div></div>'}).join('');
 var prom=(s.promise||[]).map(function(w,i){return '<div class="two">'+f('Promise '+(i+1),'data-pm="t" data-i="'+i+'"',w.t)+f('Line','data-pm="d" data-i="'+i+'"',w.d)+'</div>'}).join('');
 var stats=(s.stats||[]).map(function(x,i){return '<div class="two">'+f('Number','data-st="n" data-i="'+i+'"',x.n)+f('Label','data-st="l" data-i="'+i+'"',x.l)+'</div>'}).join('');
 return '<div class="ed-h"><b>Edit site</b><button class="btn ghost sm" id="ed-close">Close</button></div><div class="ed-b">'+
  '<datalist id="catlist">'+['iPhone','iPad','Android','Mac','Accessories'].concat(cats()).filter(function(v,i,a){return a.indexOf(v)===i}).map(function(c){return '<option value="'+esc(c)+'">'}).join('')+'</datalist>'+
  '<details open><summary>Products ('+state.products.length+')</summary><div class="g"><button class="addrow" id="ed-add">+ Add product</button>'+prods+'</div></details>'+
  '<details><summary>Top of page</summary><div class="g">'+f('Small line on top','data-s="heroEyebrow"',s.heroEyebrow)+f('Big headline (one line per row)','data-s="heroTitle"',s.heroTitle,'',1)+f('Description','data-s="heroSub"',s.heroSub,'',1)+stats+'</div></details>'+
  '<details><summary>Moving banner</summary><div class="g">'+f('One message per line','data-s="ticker"',(s.ticker||[]).join('\n'),'',1)+'</div></details>'+
  '<details><summary>Latest drop section</summary><div class="g">'+f('Title','data-s="railTitle"',s.railTitle)+f('Line under title','data-s="railSub"',s.railSub)+'</div></details>'+
  '<details><summary>Promises</summary><div class="g">'+prom+'</div></details>'+
  '<details><summary>Ways to buy</summary><div class="g">'+ways+'<button class="addrow" id="ed-wadd">+ Add a way to buy</button></div></details>'+
  '<details><summary>Contact & store</summary><div class="g">'+f('Facebook page username (for Messenger)','data-s="messenger"',s.messenger,'e.g. estilopinas')+f('Facebook page link','data-s="fb"',s.fb,'https://facebook.com/...')+f('Call / Viber','data-s="phone"',s.phone)+f('Address','data-s="address"',s.address,'',1)+f('Hours','data-s="hours"',s.hours)+f('Name to search on maps','data-s="mapsQuery"',s.mapsQuery)+
   '<div class="tools"><label class="up">'+(s.storePhoto?'Change store photo':'Add store photo')+'<input type="file" accept="image/*" data-upk="storePhoto"></label>'+(s.storePhoto?'<button data-clr="storePhoto">Remove</button>':'')+'</div></div></details>'+
  '<details><summary>Brand</summary><div class="g">'+f('Shop name','data-s="shopName"',s.shopName)+'<div class="tools"><label class="up">'+(s.logo?'Change logo (PNG)':'Use my own logo file (PNG)')+'<input type="file" accept="image/*" data-upk="logo"></label>'+(s.logo?'<button data-clr="logo">Use built-in logo</button>':'')+'</div></div></details>'+
  '</div><div class="ed-f"><span class="small" id="ed-state">'+(dirty?'Unsaved changes':'Changes show live. Tap Save to publish.')+'</span><div class="tools"><button class="btn ghost sm" id="ed-cancel">Undo all</button><button class="btn sm" id="ed-save">Save</button></div></div>'}
function openEditor(){editing=true;stopRail();if(!ed){ed=document.createElement('aside');ed.className='ed';ed.setAttribute('aria-label','Edit site');document.body.appendChild(ed);wireEd()}paintEd();render()}
function paintEd(){var open=[].map.call(ed.querySelectorAll('details'),function(d){return d.open}),sc=(ed.querySelector('.ed-b')||{}).scrollTop||0;ed.innerHTML=edHTML();
 if(open.length)ed.querySelectorAll('details').forEach(function(d,i){d.open=!!open[i]});var b=ed.querySelector('.ed-b');if(b)b.scrollTop=sc}
var rt=0;function live(){dirty=true;var st=document.getElementById('ed-state');if(st)st.textContent='Unsaved changes';clearTimeout(rt);rt=setTimeout(render,180)}
function wireEd(){
 ed.addEventListener('input',function(e){var t=e.target,d=t.dataset,s=S();
  if(d.p){var p=find(d.id);p[d.p]=t.type==='checkbox'?t.checked:t.value;p.sample=false}
  else if(d.s){s[d.s]=d.s==='ticker'?t.value.split('\n').map(function(x){return x.trim()}).filter(Boolean):t.value}
  else if(d.w){s.ways[+d.i][d.w]=t.value}else if(d.pm){s.promise[+d.i][d.pm]=t.value}else if(d.st){s.stats[+d.i][d.st]=t.value}else return;
  live()});
 ed.addEventListener('change',function(e){var t=e.target,d=t.dataset;
  if(d.p==='status'||d.p==='featured'){var p=find(d.id);p[d.p]=t.type==='checkbox'?t.checked:t.value;p.sample=false;live()}
  if((d.up||d.upk)&&t.files&&t.files[0]){toast('Adding photo…');resizeImg(t.files[0],d.upk==='storePhoto'?1400:900,function(du){uploadImg(du,function(url){if(d.up){var p=find(d.up);p.photo=url;p.sample=false}else S()[d.upk]=url;live();paintEd()})})}});
 ed.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;var d=t.dataset,s=S();
  if(t.id==='ed-close'){editing=false;ed.remove();ed=null;render();if(dirty)toast('Not saved yet. Open Edit site and tap Save.');return}
  if(t.id==='ed-cancel'){state=JSON.parse(saved);dirty=false;paintEd();render();return}
  if(t.id==='ed-save')return save(t);
  if(t.id==='ed-add'){state.products.unshift({id:'p'+Date.now().toString(36),name:'New unit',spec:'Brand new, sealed',cat:'iPhone',price:'',status:'available',photo:'',featured:true});live();paintEd();return}
  if(t.id==='ed-wadd'){s.ways.push({t:'New way to buy',d:''});live();paintEd();return}
  if(d.wdel){s.ways.splice(+d.wdel,1);live();paintEd();return}
  if(d.del){if(d.confirm){state.products=state.products.filter(function(x){return x.id!==d.del});live();paintEd();return}d.confirm='1';t.textContent='Tap again to delete';return}
  if(d.nophoto){find(d.nophoto).photo='';live();paintEd();return}
  if(d.clr){s[d.clr]='';live();paintEd();return}
  if(d.mv){var a=state.products,i=a.findIndex(function(x){return x.id===d.id}),j=i+Number(d.mv),tmp=a[i];a[i]=a[j];a[j]=tmp;live();paintEd();return}});
}
function resizeImg(file,max,cb){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){
  var png=/png/i.test(file.type),sc=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');
  c.width=Math.round(img.width*sc);c.height=Math.round(img.height*sc);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  var out=png?c.toDataURL('image/png'):c.toDataURL('image/jpeg',.86);
  if(png&&out.length>1500000){c.width=Math.round(c.width*.72);c.height=Math.round(c.height*.72);c.getContext('2d').drawImage(img,0,0,c.width,c.height);out=c.toDataURL('image/png')}
  cb(out)};img.onerror=function(){toast('This photo type can\'t be read. Use a PNG or JPG.')};img.src=r.result};r.readAsDataURL(file)}


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
function loadRemote(){if(!CFG.url)return Promise.resolve();
 return fetch(CFG.url+'/rest/v1/site?id=eq.main&select=data',{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(function(r){return r.json()}).then(function(rows){
  if(rows&&rows[0]&&rows[0].data&&!dirty){state=rows[0].data;saved=JSON.stringify(state);render();if(ed)paintEd()}}).catch(function(){})}
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
function afterLogin(){sb.rpc('is_owner').then(function(r){if(r.data===true){var b=document.getElementById('lg');if(b)b.remove();canWrite=true;openEditor();addOut()}else{sb.auth.signOut();loginBox('This account cannot edit this shop.')}})}
function addOut(){var o=document.createElement('button');o.className='tlink lgout';o.textContent='Log out';o.onclick=function(){sb.auth.signOut().then(function(){location.reload()})};document.body.appendChild(o)}
render();loadRemote();
if(window.EP_MODE==='admin'){
 if(!(window.supabase&&window.supabase.createClient)){toast('Login could not load. Check your internet and reload.')}
 else{sb=window.supabase.createClient(CFG.url,CFG.key);sb.auth.getSession().then(function(r){if(r.data&&r.data.session)afterLogin();else loginBox()})}
}
})();
