/* Estilo Pinas — motion & 3D showroom engine (vanilla JS, no dependencies).
   EPM.hero(el, product)        cinematic CSS-3D phone hero
   EPM.showroom(el, models, o)  3D product circle with spring physics (drag / wheel / keys / click)
   EPM.reveal(root)             scroll reveals + staggered children
   EPM.tilt(root)               pointer tilt on cards
   EPM.tween(el, to)            smooth number transitions for prices
   EPM.flip(fromEl, toEl)       FLIP expand transition */
(function(){
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var LOW=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4)||(navigator.deviceMemory&&navigator.deviceMemory<=4)||false;
document.documentElement.classList.toggle('lowfx',!!LOW);document.documentElement.classList.toggle('rm',!!RM);
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

/* ---------- hero: CSS-3D phone ---------- */
function hero(el,m,pops){if(!el)return;pops=(pops||[]).filter(function(x){return x&&x.photo}).slice(0,3);
 var specs=m&&m.spec?m.spec.split('·').map(function(x){return x.trim()}).filter(Boolean).slice(0,3):[];
 el.innerHTML='<div class="h3-stage" aria-hidden="true"><div class="h3-glow"></div><div class="h3-ring r1"></div><div class="h3-ring r2"></div>'+
  '<div class="h3-orbit">'+[0,1,2,3,4,5].map(function(i){return '<i style="--k:'+i+'"></i>'}).join('')+'</div>'+
  '<div class="h3-float"><div class="h3-phone" id="h3p">'+
   '<div class="f front"><div class="scr"><div class="isl"></div><div class="wall"></div><img src="/wordmark-white.svg" alt=""><div class="sweep"></div></div></div>'+
   '<div class="f back"><div class="cam"><b></b><b></b><b></b><s></s></div><img src="/logo.svg" alt="" class="bl"></div>'+
   '<div class="f side l"></div><div class="f side r"></div><div class="f side t"></div><div class="f side b"></div></div><div class="h3-shadow"></div></div>'+
  pops.map(function(x,i){return '<span class="h3-pop p'+i+'"><img src="'+esc(x.photo)+'" alt="" decoding="async" onerror="this.parentNode.remove()"></span>'}).join('')+
  specs.map(function(s,i){return '<span class="h3-chip c'+i+'">'+esc(s)+'</span>'}).join('')+'</div>';
 var p=el.querySelector('#h3p'),rx=0,ry=0,tx=0,ty=0,raf=0,t0=performance.now(),vis=true;
 if(RM){p.style.transform='rotateY(-22deg) rotateX(6deg)';return}
 function loop(t){var e=(t-t0)/1000;rx+=(tx-rx)*.06;ry+=(ty-ry)*.06;
  p.style.transform='rotateX('+(8+rx).toFixed(2)+'deg) rotateY('+((e*24)%360+ry).toFixed(2)+'deg)';el.style.setProperty('--mx',(ry/30).toFixed(3));el.style.setProperty('--my',(rx/16).toFixed(3));raf=vis?requestAnimationFrame(loop):0}
 el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();ty=((e.clientX-r.left)/r.width-.5)*30;tx=-((e.clientY-r.top)/r.height-.5)*16});
 el.addEventListener('pointerleave',function(){tx=ty=0});
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!raf)raf=requestAnimationFrame(loop)}).observe(el);
 raf=requestAnimationFrame(loop)}

/* ---------- 3D showroom ---------- */
function showroom(el,items,o){o=o||{};if(!el||!items.length)return null;var N=items.length;
 el.innerHTML='<div class="sr-stage" tabindex="0" role="listbox" aria-label="Gadget showroom. Use arrow keys, drag or scroll to browse; Enter to open."><div class="sr-floor"></div>'+
  items.map(function(m,i){return '<div class="sr-item" role="option" data-i="'+i+'" aria-label="'+esc(m.model)+'"><div class="sr-card">'+o.render(m)+'</div></div>'}).join('')+
  '</div><div class="sr-ui"><button type="button" class="sr-arw" data-d="-1" aria-label="Previous gadget">←</button><div class="sr-info" aria-live="polite"></div><button type="button" class="sr-arw" data-d="1" aria-label="Next gadget">→</button></div><div class="sr-dots">'+items.map(function(_,i){return '<i data-i="'+i+'"></i>'}).join('')+'</div>';
 var stage=el.querySelector('.sr-stage'),nodes=[].slice.call(el.querySelectorAll('.sr-item')),info=el.querySelector('.sr-info'),dots=[].slice.call(el.querySelectorAll('.sr-dots i'));
 var pos=0,target=0,vel=0,last=0,raf=0,vis=true,down=null,wheelAcc=0,wheelT=0,idleT=0,active=-1,W=0,R=0;
 function wrap(i){return ((i%N)+N)%N}
 function size(){W=stage.clientWidth;R=Math.max(140,Math.min(W*.36,420))}
 function preload(i){[0,1,-1,2,-2].forEach(function(d){var m=items[wrap(i+d)];if(m&&m.photo&&!m._pre){m._pre=1;var im=new Image();im.src=m.photo;if(im.decode)im.decode().catch(function(){})}})}
 function setActive(i){if(i===active)return;active=i;nodes.forEach(function(n,k){n.classList.toggle('on',k===i);n.setAttribute('aria-selected',String(k===i))});dots.forEach(function(d,k){d.classList.toggle('on',k===i)});
  info.innerHTML=o.info(items[i]);preload(i);o.onActive&&o.onActive(items[i],i)}
 function layout(){for(var k=0;k<N;k++){var d=k-pos;d=d-Math.round(d/N)*N;var a=d*(2*Math.PI/Math.max(N,5)),x=Math.sin(a)*R,z=(Math.cos(a)+1)*R*.42,ad=Math.abs(d);
   var s=(1-Math.min(ad,3)*.1)*.8,n=nodes[k];n.style.transform='translate3d('+x.toFixed(1)+'px,0,'+z.toFixed(1)+'px) rotateY('+(-a*180/Math.PI*.55).toFixed(1)+'deg) scale('+s.toFixed(3)+')';
   n.style.zIndex=String(100-Math.round(ad*10));n.style.opacity=ad>2.6?'0':String(1-Math.max(0,ad-1.4)*.5);n.style.filter=(LOW||ad<.6)?'none':'blur('+Math.min(ad*1.2,3).toFixed(1)+'px)';
   n.style.pointerEvents=ad>2.2?'none':'auto'}
  setActive(wrap(Math.round(pos)))}
 function tick(t){var dt=Math.min(.05,(t-(last||t))/1000);last=t;
  if(RM){pos=target;vel=0}else{var k=140,c=22;vel+=((target-pos)*k-vel*c)*dt;pos+=vel*dt}
  layout();if(Math.abs(target-pos)<.0005&&Math.abs(vel)<.0005&&!down){pos=target;layout();raf=0;last=0;return}
  raf=vis?requestAnimationFrame(tick):0}
 function kick(){if(!raf&&vis)raf=requestAnimationFrame(tick)}
 function go(i){target=Math.round(target)+i;kick();idle()}
 function goTo(k){var d=k-wrap(Math.round(target));if(d>N/2)d-=N;if(d<-N/2)d+=N;target=Math.round(target)+d;kick();idle()}
 function idle(){clearTimeout(idleT);if(RM||o.auto===false)return;idleT=setTimeout(function(){if(vis&&!down&&document.visibilityState==='visible'){target=Math.round(target)+1;kick()}idle()},5200)}
 stage.addEventListener('pointerdown',function(e){if(e.button!==undefined&&e.button!==0)return;down={x:e.clientX,y:e.clientY,t0:target,moved:false,id:e.pointerId};idle()});
 stage.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-down.x;if(!down.moved&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(e.clientY-down.y)){down.moved=true;try{stage.setPointerCapture(down.id)}catch(_){}stage.classList.add('drag')}
  if(down.moved){target=down.t0-dx/Math.max(120,R*.9);kick()}});
 function up(e){if(!down)return;var d=down;down=null;stage.classList.remove('drag');try{stage.releasePointerCapture(d.id)}catch(_){}
  if(d.moved){target=Math.round(target+vel*.08);kick();return}
  var it=e.target.closest&&e.target.closest('.sr-item');if(!it)return;var k=+it.dataset.i;if(k===active){o.open&&o.open(items[k],it)}else goTo(k)}
 stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',function(){if(down){down=null;stage.classList.remove('drag');target=Math.round(target);kick()}});
 stage.addEventListener('wheel',function(e){var dl=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(e.deltaX)<Math.abs(e.deltaY)&&!e.shiftKey&&!el.matches(':hover'))return;
  e.preventDefault();wheelAcc+=dl;clearTimeout(wheelT);wheelT=setTimeout(function(){wheelAcc=0},180);if(Math.abs(wheelAcc)>70){go(wheelAcc>0?1:-1);wheelAcc=0}},{passive:false});
 stage.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();go(1)}else if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}else if(e.key==='Enter'||e.key===' '){e.preventDefault();o.open&&o.open(items[active],nodes[active])}});
 el.querySelector('.sr-ui').addEventListener('click',function(e){var b=e.target.closest('.sr-arw');if(b)go(+b.dataset.d)});
 el.querySelector('.sr-dots').addEventListener('click',function(e){var d=e.target.closest('i');if(d)goTo(+d.dataset.i)});
 var ro;if(window.ResizeObserver){ro=new ResizeObserver(function(){size();layout()});ro.observe(stage)}else window.addEventListener('resize',function(){size();layout()});
 if('IntersectionObserver' in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis){kick();idle()}else clearTimeout(idleT)}).observe(el);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')kick()});
 size();var start=function(){layout();el.classList.add('ready');idle()};
 (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(start,start);
 return {go:go,goTo:goTo,get active(){return active}}}

/* ---------- scroll reveal ---------- */
function reveal(root){var els=[].slice.call((root||document).querySelectorAll('[data-rv]'));if(RM||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
 document.documentElement.classList.add('rvon');
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var t=e.target;[].forEach.call(t.querySelectorAll('[data-st]'),function(c,i){c.style.transitionDelay=(i*60)+'ms'});t.classList.add('in');io.unobserve(t)}})},{rootMargin:'0px 0px -8% 0px'});
 els.forEach(function(e){io.observe(e)})}

/* ---------- pointer tilt ---------- */
function tilt(root){root=root||document;if(RM||LOW||!window.matchMedia('(hover:hover)').matches||root.__tilt)return;root.__tilt=1;
 (root||document).addEventListener('pointermove',function(e){var c=e.target.closest&&e.target.closest('[data-tilt]');if(!c)return;var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  c.style.transform='perspective(700px) rotateX('+(-y*6).toFixed(2)+'deg) rotateY('+(x*8).toFixed(2)+'deg) translateY(-3px)'});
 (root||document).addEventListener('pointerout',function(e){var c=e.target.closest&&e.target.closest('[data-tilt]');if(c&&!c.contains(e.relatedTarget))c.style.transform=''})}

/* ---------- number tween ---------- */
function tween(el,to,fmt){if(!el)return;var from=Number(el.getAttribute('data-v')||0);el.setAttribute('data-v',to);fmt=fmt||function(n){return Math.round(n).toLocaleString('en-PH')};
 if(RM||!from||from===to){el.textContent=fmt(to);return}var t0=performance.now(),D=420;
 (function f(t){var k=Math.min(1,(t-t0)/D),e=1-Math.pow(1-k,3);el.textContent=fmt(from+(to-from)*e);if(k<1)requestAnimationFrame(f)})(t0)}

/* ---------- FLIP ---------- */
function flip(fromEl,toEl){if(RM||!fromEl||!toEl)return;var a=fromEl.getBoundingClientRect(),b=toEl.getBoundingClientRect();if(!b.width||!a.width)return;
 var sx=a.width/b.width,sy=a.height/b.height,s=Math.min(sx,sy);toEl.style.transformOrigin='0 0';
 toEl.animate([{transform:'translate('+(a.left-b.left)+'px,'+(a.top-b.top)+'px) scale('+s+')',opacity:.6},{transform:'none',opacity:1}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'})}

/* ---------- floating curved rail (hover spotlight + shuffle) ----------
   Items ride a curved arc: each one's offset from the centre sets its lift, tilt and scale every scroll frame.
   Hover/focus spotlights one gadget and dims the rest. Shuffle re-sorts the array and FLIP-animates to the new spots. */
function rail(el,items,o){o=o||{};if(!el||!items.length)return null;
 var order=items.map(function(_,i){return i});
 el.innerHTML='<div class="fr-track" tabindex="0" aria-label="Floating gadgets. Scroll sideways or use the arrow buttons.">'+
  items.map(function(m,i){return '<button type="button" class="fr-it" data-i="'+i+'" style="--d:'+((i*0.37)%2).toFixed(2)+'s" aria-label="'+esc(m.model)+'"><span class="fr-arc"><span class="fr-fl">'+o.render(m)+'</span><i class="gs"></i>'+(o.label?'<span class="fr-lb">'+o.label(m)+'</span>':'')+'</span></button>'}).join('')+
  '</div><div class="fr-ui"><button type="button" class="sr-arw" data-fr="-1" aria-label="Previous">←</button><button type="button" class="btn ghost" data-fr="shuffle">Shuffle <span aria-hidden="true">⤨</span></button><button type="button" class="sr-arw" data-fr="1" aria-label="Next">→</button></div>';
 var tr=el.querySelector('.fr-track'),nodes=[].slice.call(tr.children),raf=0;
 function place(){raf=0;var r=tr.getBoundingClientRect(),cx=r.left+r.width/2,half=r.width/2||1;
  nodes.forEach(function(n){var b=n.getBoundingClientRect(),d=Math.max(-1.2,Math.min(1.2,(b.left+b.width/2-cx)/half)),a=n.firstChild;
   a.style.transform='translateY('+(d*d*58).toFixed(1)+'px) rotate('+(d*7).toFixed(2)+'deg) scale('+(1-Math.min(1,Math.abs(d))*.22).toFixed(3)+')';
   n.style.zIndex=String(100-Math.round(Math.abs(d)*50))})}
 function q(){if(!raf)raf=requestAnimationFrame(place)}
 tr.addEventListener('scroll',q,{passive:true});window.addEventListener('resize',q);
 /* spotlight */
 function hot(n){nodes.forEach(function(x){x.classList.toggle('hot',x===n)});tr.classList.toggle('spot',!!n)}
 tr.addEventListener('pointerover',function(e){if(e.pointerType==='mouse'){var n=e.target.closest('.fr-it');if(n)hot(n)}});
 tr.addEventListener('pointerleave',function(){hot(null)});
 tr.addEventListener('focusin',function(e){var n=e.target.closest('.fr-it');if(n)hot(n)});tr.addEventListener('focusout',function(){hot(null)});
 /* mouse drag-to-scroll (touch already scrolls natively) */
 var dn=null,moved=false;
 tr.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button)return;dn={x:e.clientX,s:tr.scrollLeft};moved=false;tr.classList.add('drag')});
 window.addEventListener('pointermove',function(e){if(!dn)return;var dx=e.clientX-dn.x;if(Math.abs(dx)>6)moved=true;if(moved)tr.scrollLeft=dn.s-dx});
 window.addEventListener('pointerup',function(){if(dn){dn=null;tr.classList.remove('drag');setTimeout(function(){moved=false},0)}});
 tr.addEventListener('click',function(e){var n=e.target.closest('.fr-it');if(!n||moved){e.preventDefault();return}o.open&&o.open(items[+n.dataset.i],n)});
 function step(k){var w=nodes[0].getBoundingClientRect().width+parseFloat(getComputedStyle(tr).columnGap||0);tr.scrollBy({left:k*w,behavior:RM?'auto':'smooth'})}
 function shuffle(){var first=nodes.map(function(n){return n.getBoundingClientRect()});
  for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=order[i];order[i]=order[j];order[j]=t}
  order.forEach(function(k){tr.appendChild(nodes[k])});place();
  if(!RM)nodes.forEach(function(n,i){var b=n.getBoundingClientRect(),a=first[i],dx=a.left-b.left;if(dx)n.animate([{transform:'translateX('+dx+'px)'},{transform:'none'}],{duration:620,easing:'cubic-bezier(.2,.8,.2,1)'})});
  q()}
 el.querySelector('.fr-ui').addEventListener('click',function(e){var b=e.target.closest('[data-fr]');if(!b)return;if(b.dataset.fr==='shuffle')shuffle();else step(+b.dataset.fr)});
 if('ResizeObserver' in window)new ResizeObserver(q).observe(tr);
 [].forEach.call(el.querySelectorAll('img'),function(im){if(!im.complete)im.addEventListener('load',q,{once:true})});
 /* start near the middle so the arc reads on first view */
 requestAnimationFrame(function(){tr.scrollLeft=(tr.scrollWidth-tr.clientWidth)/2;place();el.classList.add('ready')});
 return {shuffle:shuffle,order:function(){return order.slice()}}}

window.EPM={hero:hero,showroom:showroom,rail:rail,reveal:reveal,tilt:tilt,tween:tween,flip:flip,RM:RM,LOW:LOW};
})();
