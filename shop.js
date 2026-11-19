/* Estilo Pinas — customer tools: Payment Guide (/pay), Quotation (/q), Order request (/order), Assistant (/ask).
   All prices come from the price list the owner edits in /admin → Price list (saved shop data).
   Payment rules (card terminal fee etc.) come from /admin → Payment settings. Nothing here invents prices. */
(function(){
var CFG=window.EP_CONFIG||{},PAGE=document.body.getAttribute('data-page'),root=document.getElementById('app');
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var DATA={priceList:JSON.parse(JSON.stringify(window.EP_PRICES_DEFAULT||{categories:[]})),settings:{}};
var PAY_DEFAULT={cardFee:5,highValue:100000,
 feeNote:'Card payments have a 5% terminal fee on the amount you swipe. Our price stays the dealer price: the fee only covers the card terminal charge.',
 feeCashNote:'Many customers pay the 5% fee in cash and swipe only the item price. Same total, lighter on your card.',
 pointsNote:'Have credit card reward points? Some banks let you use points to cover charges like this. Check your bank\'s rewards program.',
 faq:[]};
var SET_DEFAULT={fb:'https://www.facebook.com/share/1FWGJJsKv8/',messenger:'',phone:'0995 883 1899',address:'06 Macapagal St., Brgy. Lakandula, Mabalacat, Pampanga',hours:'By appointment',shopName:'Estilo Pinas'};

/* ---------- helpers ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(v){var n=Number(String(v==null?'':v).replace(/[^0-9.]/g,''));return isFinite(n)&&n>0?n:0}
function php(n){return '₱'+Math.round(n).toLocaleString('en-PH')}
function S(){var s=Object.assign({},SET_DEFAULT,DATA.settings||{});return s}
function P(){return Object.assign({},PAY_DEFAULT,(DATA.settings||{}).payment||{})}
function fee(){var f=Number(P().cardFee);return isFinite(f)&&f>=0?f:5}
function msgr(text){var s=S(),m=(s.messenger||'').trim();if(!m)return (s.fb||'').trim();var base=/^https?:\/\//.test(m)?m:'https://m.me/'+m.replace(/^@/,'').replace(/^(www\.)?(facebook\.com|m\.me)\//,'');return base+(base.indexOf('?')<0?'?':'&')+'text='+encodeURIComponent(text)}
function tel(){return 'tel:'+String(S().phone||'').replace(/[^0-9+]/g,'')}
function qs(){var o={};location.search.slice(1).split('&').forEach(function(kv){if(!kv)return;var i=kv.indexOf('=');o[decodeURIComponent(i<0?kv:kv.slice(0,i))]=decodeURIComponent((i<0?'':kv.slice(i+1)).replace(/\+/g,' '))});return o}
function toQS(o){return Object.keys(o).filter(function(k){return o[k]!==''&&o[k]!=null}).map(function(k){return encodeURIComponent(k)+'='+encodeURIComponent(o[k])}).join('&')}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2600)}
function today(){return new Date().toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}
/* flat list of every priced option from the price list */
function items(){var out=[];(DATA.priceList.categories||[]).forEach(function(c){(c.items||[]).forEach(function(it){(it.variants||[]).forEach(function(v,i){
 out.push({key:it.id+'~'+i,id:it.id,vi:i,cat:c.name,model:it.model,label:v.label||'',price:num(v.price),off:v.status==='unavailable',name:it.model+(v.label?' '+v.label:''),photo:it.photo||''})})})});return out}
function findItem(id,label){var L=items();return L.find(function(x){return x.id===id&&(label==null||x.label===label)})||L.find(function(x){return x.id===id})||null}

/* ---------- payment engine (one place for all math) ---------- */
/* method: cash | card | split. cardAmt: amount put on the card (split). feeBy: 'card' (added to swipe) or 'cash' (paid in cash). */
function quote(price,method,cardAmt,feeBy){price=Math.max(0,Math.round(num(price)));var f=fee(),card=0;
 if(method==='card')card=price;else if(method==='split')card=Math.min(price,Math.max(0,Math.round(num(cardAmt))));
 var cash=price-card,tf=Math.round(card*f/100),swipe=card+(feeBy==='cash'?0:tf),cashDue=cash+(feeBy==='cash'?tf:0);
 return {price:price,method:card===0?'cash':method,cash:cash,card:card,fee:tf,feeRate:f,feeBy:feeBy==='cash'?'cash':'card',swipe:swipe,cashDue:cashDue,total:price+tf}}
function quoteLines(q){var L=[['Item price (dealer price)',php(q.price)]];
 if(q.card>0){if(q.cash>0)L.push(['Cash portion',php(q.cash)]);L.push(['Card portion',php(q.card)]);L.push(['Terminal fee '+q.feeRate+'% of '+php(q.card)+(q.feeBy==='cash'?' · paid in cash':' · added to card'),php(q.fee)])}
 return L}
function methodName(q){return q.card===0?'Cash':q.cash===0?'Credit card':'Split: cash + card'}

/* ---------- receipt (quotation) ---------- */
function receipt(it,q,o){o=o||{};var lines=quoteLines(q);
 return '<article class="rcpt'+(o.anim&&!RM?' anim':'')+'" aria-label="Quotation"><div class="rc-h"><img src="/wordmark.svg" alt="Estilo Pinas" width="96" height="45"><div><b>QUOTATION</b><span>'+esc(o.code?'No. '+o.code:today())+'</span></div></div>'+
  '<div class="rc-item"><span class="lbl2">'+esc(it?it.cat:'Item')+'</span><h3>'+esc(it?it.model:(o.title||'Custom amount'))+'</h3>'+(it&&it.label?'<p>'+esc(it.label)+' · Brand new, sealed</p>':'')+(o.customer?'<p>For: '+esc(o.customer)+'</p>':'')+'</div>'+
  '<ul class="rc-lines">'+lines.map(function(l,i){return '<li style="--i:'+i+'"><span>'+esc(l[0])+'</span><b>'+l[1]+'</b></li>'}).join('')+'</ul>'+
  '<div class="rc-tot"><span>Total</span><b>'+php(q.total)+'</b></div>'+
  '<div class="rc-pay">'+(q.card>0?'<div><span>Pay in cash</span><b>'+php(q.cashDue)+'</b></div><div><span>Swipe on card</span><b>'+php(q.swipe)+'</b></div>':'<div><span>Pay in cash</span><b>'+php(q.cashDue)+'</b></div>')+'</div>'+
  '<p class="rc-note">'+esc(methodName(q))+(o.note?' · '+esc(o.note):'')+'. Prices follow dealer availability and may change. Message us to confirm stock and the latest price before paying.</p>'+
  '<div class="rc-cut" aria-hidden="true"></div></article>'}

/* ---------- shared layout ---------- */
function header(){var a=function(h,t,k){return '<a href="'+h+'"'+(PAGE===k?' aria-current="page"':'')+'>'+t+'</a>'};
 return '<a class="skip" href="#main">Skip to content</a><header class="top"><div class="wrap top-in"><a class="brand" href="/" aria-label="Estilo Pinas home"><img src="/wordmark.svg" alt="Estilo Pinas" width="92" height="43"></a>'+
 '<nav class="top-links" aria-label="Main">'+a('/gadgets','Gadgets','gadgets')+a('/payment-guide','Payment guide','pay')+a('/how-to-order','How to order','howto')+a('/track-order','Track order','track')+a('/contact','Contact','contact')+'</nav>'+
 '<a class="btn sm-hide" href="/ask">Ask us</a><button class="bagbtn" type="button" id="bagbtn" aria-label="Open bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg><b id="bagn">0</b></button></div></header>'}
function tabbar(){var a=function(h,t,k,ic){return '<a href="'+h+'"'+(PAGE===k?' aria-current="page"':'')+'><svg viewBox="0 0 24 24" aria-hidden="true">'+ic+'</svg><span>'+t+'</span></a>'};
 return '<nav class="tabbar" aria-label="Shop menu">'+a('/','Home','home','<path d="M4 11l8-7 8 7v9H4z"/>')+a('/gadgets','Gadgets','gadgets','<rect x="6" y="2.5" width="12" height="19" rx="3.2"/>')+a('/payment-guide','Payment','pay','<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18"/>')+a('/ask','Ask us','ask','<path d="M5 5h14v10H10l-5 4z"/>')+'</nav>'}
function footer(){var s=S();return '<footer class="foot"><div class="wrap foot-in"><img src="/wordmark.svg" alt="" width="64" height="30"><span>Legit trusted seller since 2014 · '+esc(s.address)+'</span>'+
 '<nav class="fnav" aria-label="Footer"><a href="/prices">Price list</a><a href="/how-to-order">How to order</a><a href="/track-order">Track order</a><a href="/contact">Contact</a><a href="'+esc(S().fb)+'" target="_blank" rel="noopener">Facebook</a></nav></div></footer>'}
function shell(main){root.innerHTML=header()+'<main id="main">'+main+'</main>'+footer()+tabbar()+'<div class="drawer" id="drawer" aria-hidden="true"><div class="bg" data-close="1"></div><aside class="pn" role="dialog" aria-modal="true" aria-label="Your bag"><header><h2>Your bag</h2><button class="sr-arw" type="button" data-close="1" aria-label="Close bag">×</button></header><div class="lst" id="baglst"></div><footer id="bagft"></footer></aside></div>';
 bagCount(false);document.getElementById('bagbtn').onclick=openBag;document.getElementById('drawer').addEventListener('click',bagClick);
 if(window.EPM){EPM.reveal(root);EPM.tilt(root)}}
/* ---------- bag (kept in this browser; sent to us as one order request) ---------- */
function bagGet(){try{var b=JSON.parse(localStorage.getItem('ep_bag')||'[]');return Array.isArray(b)?b:[]}catch(e){return window.__bag||[]}}
function bagSet(b){window.__bag=b;try{localStorage.setItem('ep_bag',JSON.stringify(b))}catch(e){}}
function bagLines(){var M=models();return bagGet().map(function(x){var m=M.find(function(k){return k.id===x.m});var v=m&&m.variants.find(function(k){return k.label===x.v});return m&&v&&v.price&&!v.off?{m:m,v:v,q:Math.min(5,Math.max(1,x.q||1))}:null}).filter(Boolean)}
function bagTotal(){return bagLines().reduce(function(a,l){return a+l.v.price*l.q},0)}
function bagCount(pop){var n=bagLines().reduce(function(a,l){return a+l.q},0),b=document.getElementById('bagn');if(!b)return;b.textContent=n;b.classList.toggle('has',n>0);if(pop){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}}
function bagAdd(m,v,fromEl){var b=bagGet(),f=b.find(function(x){return x.m===m.id&&x.v===v.label});if(f)f.q=Math.min(5,(f.q||1)+1);else b.push({m:m.id,v:v.label,q:1});bagSet(b);
 var t=document.getElementById('bagbtn');if(fromEl&&t&&!(window.EPM&&EPM.RM)&&m.photo){var a=fromEl.getBoundingClientRect(),c=t.getBoundingClientRect(),fx=document.createElement('div');fx.className='addfx';fx.innerHTML='<img src="'+esc(m.photo)+'" alt="">';document.body.appendChild(fx);
  fx.animate([{transform:'translate('+(a.left+a.width/2-27)+'px,'+(a.top+a.height/2-27)+'px) scale(1)'},{transform:'translate('+(c.left-7)+'px,'+(c.top-7)+'px) scale(.3)',opacity:.4}],{duration:650,easing:'cubic-bezier(.5,0,.2,1)'}).onfinish=function(){fx.remove();bagCount(true)}}else bagCount(true);
 toast('Added to bag: '+m.model+' '+v.label)}
function openBag(){var d=document.getElementById('drawer'),L=bagLines(),f=fee();
 document.getElementById('baglst').innerHTML=L.length?L.map(function(l,i){return '<div class="bi"><div class="ph">'+(l.m.photo?'<img src="'+esc(l.m.photo)+'" alt="">':'')+'</div><div><b>'+esc(l.m.model)+'</b><span>'+esc(l.v.label)+' · '+php(l.v.price)+'</span></div><div class="q"><button type="button" data-q="'+i+'" data-d="-1" aria-label="Less">−</button><span>'+l.q+'</span><button type="button" data-q="'+i+'" data-d="1" aria-label="More">+</button></div></div>'}).join(''):'<p class="empty">Your bag is empty.<br><a href="/gadgets">Browse gadgets</a></p>';
 document.getElementById('bagft').innerHTML=L.length?'<div class="tot"><span>Cash total</span><b>'+php(bagTotal())+'</b></div><p class="mini" style="margin:0">Card adds '+f+'% on the swiped amount. Choose how to pay on the next step.</p><a class="btn big" href="/order?bag=1">Send order request</a>':'';
 d.classList.add('open');d.setAttribute('aria-hidden','false')}
function bagClick(e){var t=e.target.closest('[data-close],[data-q]');if(!t)return;if(t.dataset.close){var d=document.getElementById('drawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');return}
 var L=bagLines(),l=L[+t.dataset.q],b=bagGet(),k=b.findIndex(function(x){return x.m===l.m.id&&x.v===l.v.label});if(k<0)return;b[k].q=(b[k].q||1)+Number(t.dataset.d);if(b[k].q<1)b.splice(k,1);if(b[k]&&b[k].q>5)b[k].q=5;bagSet(b);bagCount(true);openBag()}
window.__dev=function(id){var m=models().find(function(x){return x.id===id});return m?devHTML(m):''};

/* ---------- data ---------- */
function getSite(u){return fetch(u+'/rest/v1/site?id=eq.main&select=data',{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
function load(){if(!CFG.url)return Promise.resolve();
 return getSite(CFG.url).catch(function(e){if(CFG.direct&&CFG.direct!==CFG.url){CFG.url=CFG.direct;return getSite(CFG.url)}throw e}).then(function(rows){var d=rows&&rows[0]&&rows[0].data;if(!d)return;
  if(d.priceList&&d.priceList.categories)DATA.priceList=d.priceList;DATA.settings=d.settings||{}}).catch(function(){})}
function rpc(fn,args){if(!CFG.url)return Promise.reject(new Error('Not connected'));
 return fetch(CFG.url+'/rest/v1/rpc/'+fn,{method:'POST',headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key,'Content-Type':'application/json'},body:JSON.stringify(args)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error((j&&(j.message||j.hint))||'Could not send');return j})})}

/* ---------- item picker ---------- */
function picker(sel,id){var L=items(),cats=[];L.forEach(function(x){if(cats.indexOf(x.cat)<0)cats.push(x.cat)});
 return '<label class="fl"><span>Gadget</span><select id="'+id+'"><option value="">Choose a gadget…</option>'+cats.map(function(c){return '<optgroup label="'+esc(c)+'">'+L.filter(function(x){return x.cat===c}).map(function(x){return '<option value="'+x.key+'"'+(x.key===sel?' selected':'')+(x.off||!x.price?' disabled':'')+'>'+esc(x.name)+' — '+(x.off?'unavailable':x.price?php(x.price):'message for price')+'</option>'}).join('')+'</optgroup>'}).join('')+'<option value="custom"'+(sel==='custom'?' selected':'')+'>Other amount (type a price)</option></select></label>'}
function byKey(k){return items().find(function(x){return x.key===k})||null}

/* ---------- calculator widget (used on /pay, /order) ---------- */
function calcHTML(st){var f=fee();
 return '<div class="calc" id="calc"><div class="calc-in">'+(st.key==='bag'?bagSummary():picker(st.key,'c-item'))+
 '<label class="fl" id="c-custom-w"'+(st.key==='custom'?'':' hidden')+'><span>Price (₱)</span><input id="c-custom" inputmode="numeric" placeholder="e.g. 50000" value="'+(st.custom||'')+'"></label>'+
 '<div class="seg" role="radiogroup" aria-label="Payment method">'+[['cash','Cash'],['card','Credit card'],['split','Split']].map(function(m){return '<button type="button" role="radio" aria-checked="'+(st.method===m[0])+'" data-m="'+m[0]+'">'+m[1]+'</button>'}).join('')+'</div>'+
 '<div class="split-w"'+(st.method==='split'?'':' hidden')+'><label class="fl"><span>Amount on card</span><input id="c-card" inputmode="numeric" value="'+(st.card||'')+'"></label><input type="range" id="c-range" min="0" step="500" aria-label="Amount on card"><div class="rng-l"><span>All cash</span><span>All card</span></div></div>'+
 '<div class="feeby-w"'+(st.method==='cash'?' hidden':'')+'><p class="mini">Pay the '+f+'% terminal fee:</p><div class="seg sm" role="radiogroup" aria-label="Pay the fee">'+[['cash','In cash'],['card','Add to card']].map(function(m){return '<button type="button" role="radio" aria-checked="'+(st.feeBy===m[0])+'" data-fb="'+m[0]+'">'+m[1]+'</button>'}).join('')+'</div></div>'+
 '</div><div class="calc-out" id="c-out" aria-live="polite"></div></div>'}
function wireCalc(st,onChange){var el=document.getElementById('calc');
 function price(){var it=byKey(st.key);return st.key==='bag'?bagTotal():st.key==='custom'?num(st.custom):it?it.price:0}
 function draw(anim){var it=byKey(st.key),p=price(),out=document.getElementById('c-out');var rg=document.getElementById('c-range');
  if(rg){rg.max=String(p||0);rg.value=String(Math.min(num(st.card),p))}
  if(!p){out.innerHTML='<div class="rc-empty">Choose a gadget to see the full breakdown.</div>';onChange&&onChange(null,null);return}
  if(st.method==='split'&&!num(st.card)){st.card=String(Math.round(p/2/500)*500)}
  var q=quote(p,st.method,st.card,st.feeBy);out.innerHTML=receipt(it,q,{anim:anim,title:st.key==='bag'?bagTitle():'Your amount'});onChange&&onChange(it,q)}
 el.addEventListener('change',function(e){if(e.target.id==='c-item'){st.key=e.target.value;st.card='';document.getElementById('c-custom-w').hidden=st.key!=='custom';draw(true)}});
 el.addEventListener('input',function(e){var t=e.target;if(t.id==='c-custom'){st.custom=t.value.replace(/[^0-9]/g,'');draw(false)}
  if(t.id==='c-card'){st.card=t.value.replace(/[^0-9]/g,'');draw(false)}
  if(t.id==='c-range'){st.card=t.value;document.getElementById('c-card').value=Number(t.value).toLocaleString('en-PH');draw(false)}});
 el.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.m){st.method=b.dataset.m;el.querySelectorAll('[data-m]').forEach(function(x){x.setAttribute('aria-checked',String(x===b))});el.querySelector('.split-w').hidden=st.method!=='split';el.querySelector('.feeby-w').hidden=st.method==='cash';draw(true)}
  if(b.dataset.fb){st.feeBy=b.dataset.fb;el.querySelectorAll('[data-fb]').forEach(function(x){x.setAttribute('aria-checked',String(x===b))});draw(true)}});
 draw(true)}
function stFromQS(){var o=qs();var it=o.m?findItem(o.m,o.v):null;
 return {key:it?it.key:(o.price?'custom':''),custom:o.price||'',method:['cash','card','split'].indexOf(o.pay)>-1?o.pay:'cash',card:o.card||'',feeBy:o.fee==='card'?'card':'cash',name:o.name||''}}
function stToQS(st){var it=byKey(st.key);return toQS({m:it?it.id:'',v:it?it.label:'',price:st.key==='custom'?st.custom:'',pay:st.method,card:st.method==='split'?st.card:'',fee:st.method==='cash'?'':st.feeBy})}

function bagTitle(){var L=bagLines();return L.length===1?L[0].m.model+' '+L[0].v.label+(L[0].q>1?' ×'+L[0].q:''):L.length+' items in your bag'}
function bagSummary(){return '<div class="fl"><span>Your bag</span>'+bagLines().map(function(l){return '<div class="kv"><span>'+esc(l.m.model)+' '+esc(l.v.label)+(l.q>1?' ×'+l.q:'')+'</span><b>'+php(l.v.price*l.q)+'</b></div>'}).join('')+'<a class="mini" href="/gadgets">+ Add more gadgets</a></div>'}
/* ---------- PAGE: payment guide ---------- */
function pagePay(){var p=P(),f=fee(),st=stFromQS();
 shell('<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>Payment guide</p><h1 class="disp">Pay your way.</h1><p class="lead">See the full cost before you order — cash, credit card, or a mix of both. Same dealer price either way.</p></div></section>'+
 '<section class="wrap opts">'+
  '<div class="opt"><span class="n">01</span><h2>Cash</h2><p>The simplest way. You pay the dealer price shown on our price list. Nothing added.</p></div>'+
  '<div class="opt"><span class="n">02</span><h2>Credit card</h2><p>'+esc(p.feeNote.replace(/5%/g,f+'%'))+'</p><p class="ex">Example: '+php(30000)+' on card + '+f+'% = <b>'+php(30000*(1+f/100))+'</b></p></div>'+
  '<div class="opt"><span class="n">03</span><h2>Split: cash + card</h2><p>Pay part in cash and part on card. The '+f+'% fee is charged only on the card part.</p><p class="ex">'+esc(p.feeCashNote.replace(/5%/g,f+'%'))+'</p></div>'+
  '<div class="opt"><span class="n">04</span><h2>Bank credit-to-cash</h2><p>Some banks can turn part of your credit limit into cash you pay monthly. Approval, rates and fees are set by your bank.</p><a class="ask" href="#c2c">See how it works →</a></div>'+
 '</section>'+
 '<section class="wrap blk" id="calc-sec"><div class="blk-h"><h2 class="disp">Payment calculator</h2><p>Pick a gadget, choose how you want to pay, and see exactly what goes on the card and what you pay in cash.</p></div>'+calcHTML(st)+
  '<div class="calc-acts"><a class="btn" id="go-order" href="/order">Order with this quote</a><button class="btn ghost" id="copy-q" type="button">Copy quote link</button></div>'+
  '<p class="tip"><b>Tip:</b> '+esc(p.pointsNote)+'</p></section>'+
 '<section class="wrap blk" id="c2c"><div class="blk-h"><h2 class="disp">Bank credit-to-cash</h2><p>If your card has this feature, the money comes from your bank, so you can pay us in cash. Ask your bank first.</p></div>'+
  '<ol class="steps"><li><b>Check which bank issued your card.</b> It is printed on the front.</li><li><b>Get the official hotline</b> from the back of your card or the bank\'s official website or app.</li><li><b>Call or open your bank app</b> and ask if you are eligible for credit-to-cash (some banks call it cash installment or credit-to-cash).</li><li><b>Ask for the full terms:</b> monthly rate, processing fee, number of months, and total you will pay back.</li><li><b>Compare</b> the bank\'s total with paying by card or split. Choose what is lighter for you.</li></ol>'+
  '<div class="est"><h3>Estimate your monthly payment</h3><p class="mini">For estimates only. Your bank\'s official quotation is the one that counts.</p><div class="est-g">'+
   '<label class="fl"><span>Amount (₱)</span><input id="e-amt" inputmode="numeric" placeholder="e.g. 60000"></label><label class="fl"><span>Monthly add-on rate (%) from your bank</span><input id="e-rate" inputmode="decimal" placeholder="ask your bank"></label>'+
   '<label class="fl"><span>Months</span><select id="e-mo">'+[3,6,9,12,18,24,36].map(function(m){return '<option'+(m===12?' selected':'')+'>'+m+'</option>'}).join('')+'</select></label><label class="fl"><span>Processing fee (₱), if any</span><input id="e-fee" inputmode="numeric" placeholder="0"></label></div>'+
   '<div class="est-out" id="e-out" aria-live="polite"></div></div></section>'+
 '<section class="contact"><div class="wrap contact-in"><div><h2 class="disp">Not sure which is lighter?</h2><p>Tell us your budget and we will compute it with you.</p></div><div class="c-acts"><a class="btn big" href="/ask">Ask our assistant</a><a class="btn ghost big" href="'+esc(msgr('Hi Estilo Pinas! Can you help me compute cash vs card?'))+'" target="_blank" rel="noopener">Message on Facebook</a></div></div></section>');
 var cur=st;wireCalc(st,function(it,q){var a=document.getElementById('go-order');if(a)a.href='/order?'+stToQS(cur)});
 document.getElementById('copy-q').addEventListener('click',function(){var u=location.origin+'/q?'+stToQS(cur);copy(u,'Quote link copied')});
 function est(){var a=num(document.getElementById('e-amt').value),r=Number(document.getElementById('e-rate').value),m=Number(document.getElementById('e-mo').value),pf=num(document.getElementById('e-fee').value),o=document.getElementById('e-out');
  if(!a||!(r>=0)||document.getElementById('e-rate').value===''){o.innerHTML='<p class="mini">Enter the amount and the rate your bank gave you.</p>';return}
  var interest=a*(r/100)*m,tot=a+interest+pf;o.innerHTML='<div class="kv"><span>Estimated monthly</span><b>'+php((a+interest)/m)+'</b></div><div class="kv"><span>Estimated interest</span><b>'+php(interest)+'</b></div><div class="kv"><span>Estimated total to repay</span><b>'+php(tot)+'</b></div><p class="mini">Estimate using an add-on rate. Banks compute differently — always confirm with your bank.</p>'}
 ['e-amt','e-rate','e-mo','e-fee'].forEach(function(i){document.getElementById(i).addEventListener('input',est)});est()}
function copy(t,msg){try{navigator.clipboard.writeText(t).then(function(){toast(msg)},function(){prompt('Copy this link:',t)})}catch(e){prompt('Copy this link:',t)}}

/* ---------- PAGE: quotation (/q) ---------- */
function pageQuote(){var o=qs();var fp=location.pathname.match(/^\/for\/([^\/?#]+)/);if(fp){var sg=decodeURIComponent(fp[1]).split('-');o.c=sg.pop();}
 function hi(n){n=String(n||'').trim().split(/\s+/)[0];return n?'<h1 class="disp qhi">Hi '+esc(n)+'!</h1><p class="lead">Here’s your personal quotation from Estilo Pinas, with the full price and payment breakdown.</p>':''}
 function show(it,q,meta){shell('<section class="wrap qwrap"><p class="eyebrow"><span class="dot"></span>Your quotation</p>'+hi(meta.customer)+(it&&it.photo?'<div class="qph"><span class="fl">'+pic(it,true)+'</span><i class="gs"></i></div>':'')+receipt(it,q,{anim:true,customer:meta.customer,code:meta.code,note:meta.note,title:meta.title})+
  '<div class="calc-acts"><a class="btn" href="/order?'+esc(meta.orderQS)+'">Order this</a><a class="btn ghost" href="'+esc(msgr('Hi Estilo Pinas! About my quotation'+(meta.code?' '+meta.code:'')+': '+(it?it.name:'')+' — total '+php(q.total)+'.'))+'" target="_blank" rel="noopener">Message us</a></div>'+
  '<p class="mini center">Want to try another payment mix? <a href="/payment-guide?'+esc(meta.orderQS)+'#calc-sec">Open the calculator</a></p></section>')}
 if(o.c){rpc('get_quote',{p_code:o.c}).then(function(r){if(!r||!r.price)throw 0;var it=r.m?findItem(r.m,r.v):null;var q=quote(r.price,r.pay||'cash',r.card,r.fee);
   show(it&&it.price===r.price?it:{cat:it?it.cat:'Item',model:r.title||(it?it.model:'Quoted item'),label:r.title?'':(r.v||''),name:r.title||'',photo:it?it.photo:'',id:it?it.id:''},q,{customer:r.name,code:o.c,note:r.note,orderQS:toQS({q:o.c})})})
  .catch(function(){shell('<section class="wrap qwrap"><h1 class="disp">Quote not found</h1><p class="lead">This link may have expired. Message us and we will send a fresh one.</p><a class="btn" href="'+esc(msgr('Hi Estilo Pinas! My quotation link is not opening.'))+'">Message us</a></section>')});return}
 var st=stFromQS(),it=byKey(st.key),price=st.key==='custom'?num(st.custom):it?it.price:0;
 if(!price){location.replace('/payment-guide');return}
 show(it,quote(price,st.method,st.card,st.feeBy),{customer:o.name,orderQS:stToQS(st)})}

/* ---------- PAGE: order request (/order) ---------- */
function pageOrder(){var o=qs(),st=stFromQS(),saved=null,step=0;if(o.bag&&bagLines().length){st.key='bag';st.method=st.method||'cash'}
 var data={name:'',mobile:'',email:'',how:'pickup',addr:'',notes:'',consent:true};
 function go(){var main='<section class="wrap ord"><p class="eyebrow"><span class="dot"></span>Order request</p><h1 class="disp">'+['Your gadget','Your details','Review'][step]+'</h1>'+
  '<ol class="prog">'+['Gadget & payment','Contact & delivery','Review & send'].map(function(t,i){return '<li class="'+(i<step?'done':i===step?'on':'')+'">'+t+'</li>'}).join('')+'</ol>';
  if(step===0)main+=calcHTML(st)+'<div class="calc-acts"><button class="btn" id="n0" type="button">Continue</button></div>';
  if(step===1)main+='<form class="frm" id="f1" novalidate>'+
   '<label class="fl"><span>Full name</span><input name="name" autocomplete="name" required maxlength="80" value="'+esc(data.name)+'"></label>'+
   '<label class="fl"><span>Mobile number</span><input name="mobile" autocomplete="tel" inputmode="tel" required maxlength="20" placeholder="09XX XXX XXXX" value="'+esc(data.mobile)+'"></label>'+
   '<label class="fl"><span>Email (optional)</span><input name="email" type="email" autocomplete="email" maxlength="120" value="'+esc(data.email)+'"></label>'+
   '<fieldset class="fl"><legend>How do you want to get it?</legend>'+[['pickup','Pick up at the store (by appointment)'],['meetup','Meet-up COD in Pampanga'],['sameday','Same-day COD (NCR & nearby)'],['lbc','LBC nationwide']].map(function(w){return '<label class="rad"><input type="radio" name="how" value="'+w[0]+'"'+(data.how===w[0]?' checked':'')+'> '+w[1]+'</label>'}).join('')+'</fieldset>'+
   '<label class="fl"><span>Address or meet-up place</span><textarea name="addr" maxlength="300" rows="2">'+esc(data.addr)+'</textarea></label>'+
   '<label class="fl"><span>Notes (color, schedule, questions)</span><textarea name="notes" maxlength="500" rows="2">'+esc(data.notes)+'</textarea></label>'+
   '<label class="rad"><input type="checkbox" name="consent"'+(data.consent?' checked':'')+'> You may contact me about this order by text, call or Messenger.</label>'+
   '<p class="err" id="ferr" role="alert"></p><div class="calc-acts"><button class="btn ghost" type="button" id="b1">Back</button><button class="btn" type="submit">Continue</button></div></form>';
  if(step===2){var it=byKey(st.key),price=st.key==='bag'?bagTotal():st.key==='custom'?num(st.custom):it?it.price:0,q=quote(price,st.method,st.card,st.feeBy);
   main+=receipt(it,q,{customer:data.name,title:st.key==='bag'?bagTitle():''})+'<dl class="rev"><div><dt>Mobile</dt><dd>'+esc(data.mobile)+'</dd></div>'+(data.email?'<div><dt>Email</dt><dd>'+esc(data.email)+'</dd></div>':'')+'<div><dt>Delivery</dt><dd>'+esc({pickup:'Store pick-up',meetup:'Meet-up COD',sameday:'Same-day COD',lbc:'LBC'}[data.how])+(data.addr?' · '+esc(data.addr):'')+'</dd></div>'+(data.notes?'<div><dt>Notes</dt><dd>'+esc(data.notes)+'</dd></div>':'')+'</dl>'+
    '<p class="mini">This sends an order request. Nothing is paid yet — we will confirm stock and the final price with you first.</p><p class="err" id="serr" role="alert"></p><div class="calc-acts"><button class="btn ghost" type="button" id="b2">Back</button><button class="btn" type="button" id="send">Send order request</button></div>'}
  main+='</section>';shell(main);window.scrollTo(0,0);
  if(step===0){wireCalc(st);document.getElementById('n0').onclick=function(){var it=byKey(st.key);if(!(st.key==='bag'?bagTotal():st.key==='custom'?num(st.custom):it&&it.price)){toast('Choose a gadget first');return}step=1;go()}}
  if(step===1){var f=document.getElementById('f1');document.getElementById('b1').onclick=function(){step=0;go()};
   f.onsubmit=function(e){e.preventDefault();var fd=new FormData(f);data.name=String(fd.get('name')).trim();data.mobile=String(fd.get('mobile')).trim();data.email=String(fd.get('email')).trim();data.how=String(fd.get('how')||'pickup');data.addr=String(fd.get('addr')).trim();data.notes=String(fd.get('notes')).trim();data.consent=!!fd.get('consent');
    var er='';if(data.name.length<2)er='Please enter your name.';else if(!/^(\+?63|0)9\d{9}$/.test(data.mobile.replace(/[\s-]/g,'')))er='Please enter a valid PH mobile number (09XX XXX XXXX).';else if(data.email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email))er='Please check your email.';else if(data.how!=='pickup'&&data.addr.length<4)er='Please add your address or meet-up place.';
    if(er){document.getElementById('ferr').textContent=er;return}step=2;go()}}
  if(step===2){document.getElementById('b2').onclick=function(){step=1;go()};document.getElementById('send').onclick=function(){var b=this;b.disabled=true;b.textContent='Sending…';var it=byKey(st.key);
   rpc('submit_order',{p:{items:st.key==='bag'?bagLines().map(function(l){return {item_id:l.m.id,variant:l.v.label,qty:l.q}}):undefined,item_id:it?it.id:'',variant:it?it.label:'',custom_price:st.key==='custom'?num(st.custom):0,quote_code:o.q||'',pay:st.method,card:num(st.card),fee_by:st.feeBy,name:data.name,mobile:data.mobile,email:data.email,how:data.how,addr:data.addr,notes:data.notes,consent:data.consent,source:sessionStorageGet('ep_src')||document.referrer.slice(0,120)}})
   .then(function(r){if(st.key==='bag')bagSet([]);done(r,it||(st.key==='bag'?{name:bagTitle()}:null))}).catch(function(err){b.disabled=false;b.textContent='Send order request';document.getElementById('serr').innerHTML='Could not send: '+esc(err.message)+'. You can also <a href="'+esc(msgr('Hi Estilo Pinas! I want to order '+(it?it.name:'')+'.'))+'" target="_blank" rel="noopener">message us on Facebook</a>.'})}}}
 function done(r,it){shell('<section class="wrap ord okk"><p class="eyebrow"><span class="dot"></span>Request received</p><h1 class="disp">Salamat, '+esc(data.name.split(' ')[0])+'!</h1><p class="lead">Your reference number is</p><p class="ref">'+esc(r.ref)+'</p><p>We will contact you at <b>'+esc(data.mobile)+'</b> to confirm stock and the final price. Nothing has been charged.</p>'+
  '<div class="calc-acts"><a class="btn" href="'+esc(msgr('Hi Estilo Pinas! I sent order request '+r.ref+' for '+(it?it.name:'a gadget')+'.'))+'" target="_blank" rel="noopener">Tell us on Messenger</a><a class="btn ghost" href="/">Back to shop</a></div></section>')}
 if(o.q){rpc('get_quote',{p_code:o.q}).then(function(r){if(r&&r.price){var it=r.m?findItem(r.m,r.v):null;if(it&&it.price===r.price)st.key=it.key;else{st.key='custom';st.custom=String(r.price)}st.method=r.pay||'cash';st.card=String(r.card||'');st.feeBy=r.fee||'cash';data.name=r.name||''}}).catch(function(){}).then(go)}else go()}
function sessionStorageGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}

/* ---------- PAGE: assistant (/ask) — guided, uses only live price list + owner-approved answers ---------- */
function pageAsk(){var s=S(),pay=P(),L=items().filter(function(x){return x.price&&!x.off}),need={},hist=[],busy=false;
 shell('<section class="wrap chat-w"><div class="chat-h"><div class="av" aria-hidden="true"><img src="/logo.svg" alt=""></div><div><b>Estilo Pinas assistant</b><span>Automated helper · Rodz can join anytime</span></div><button class="btn ghost sm" id="human" type="button">Talk to Rodz</button></div>'+
  '<div class="chat" id="chat" aria-live="polite"></div><form class="chat-in" id="cin"><input id="ctext" autocomplete="off" maxlength="300" placeholder="Type your question…" aria-label="Your message"><button class="btn" type="submit">Send</button></form></section>');
 var chat=document.getElementById('chat');
 function add(who,html,chips){hist.push({who:who,text:html.replace(/<[^>]+>/g,'')});var d=document.createElement('div');d.className='msg '+who;d.innerHTML='<div class="bub">'+html+'</div>'+(chips&&chips.length?'<div class="chips">'+chips.map(function(c){return '<button type="button" data-v="'+esc(c[1]||c[0])+'">'+esc(c[0])+'</button>'}).join('')+'</div>':'');chat.appendChild(d);d.scrollIntoView({block:'end',behavior:RM?'auto':'smooth'})}
 function bot(html,chips,delay){busy=true;var t=document.createElement('div');t.className='msg bot typing';t.innerHTML='<div class="bub"><i></i><i></i><i></i></div>';chat.appendChild(t);
  setTimeout(function(){t.remove();busy=false;add('bot',html,chips)},RM?0:(delay||550))}
 var cats=[];L.forEach(function(x){if(cats.indexOf(x.cat)<0)cats.push(x.cat)});
 var stepQ=['cat','model','use','budget','pay','when'];
 function ask(k){need._at=k;
  if(k==='cat')return bot('Hi! Welcome to Estilo Pinas. Ano pong gadget ang hinahanap ninyo?',cats.map(function(c){return [c]}).concat([['Not sure yet']]));
  if(k==='model'){var ms=uniq(L.filter(function(x){return !need.cat||x.cat===need.cat}).map(function(x){return x.model}));return bot('May specific model na po ba kayong gusto, or open kayo sa suggestions?',ms.map(function(m){return [m]}).concat([['Open to suggestions']]))}
  if(k==='use')return bot('Saan niyo po siya madalas gagamitin?',[['Personal / everyday'],['Work or business'],['Content creation'],['Gaming'],['For school']]);
  if(k==='budget')return bot('Magkano po ang comfortable budget ninyo?',[['Below ₱40,000','40000'],['₱40,000–₱60,000','60000'],['₱60,000–₱90,000','90000'],['Above ₱90,000','999999']]);
  if(k==='pay')return bot('Cash po ba or credit card? (Card has a '+fee()+'% terminal fee on the swiped amount.)',[['Cash'],['Credit card'],['Split: cash + card'],['Not sure']]);
  if(k==='when')return bot('Kailan niyo po kailangan?',[['As soon as possible'],['This week'],['Just checking prices']]);
  recommend()}
 function next(){for(var i=0;i<stepQ.length;i++){if(need[stepQ[i]]===undefined)return ask(stepQ[i])}recommend()}
 function uniq(a){return a.filter(function(v,i){return a.indexOf(v)===i})}
 function recommend(){need._at='done';var pool=L.filter(function(x){return !need.cat||need.cat==='Not sure yet'||x.cat===need.cat});
  if(need.model&&need.model!=='Open to suggestions')pool=pool.filter(function(x){return x.model===need.model});
  var cap=num(need.budget)||Infinity,within=pool.filter(function(x){return x.price<=cap});
  var heavy=/content|gaming/i.test(need.use||''),pick;
  var ordered=within.slice().sort(function(a,b){return heavy?b.price-a.price:a.price-b.price});
  if(!ordered.length){var cheapest=pool.slice().sort(function(a,b){return a.price-b.price})[0];
   if(!cheapest)return bot('Pasensya na po, wala pa po kaming nakalistang ganyan sa price list ngayon. Gusto niyo po bang i-check ni Rodz kung kaya pong i-source?',[['Yes, ask Rodz','human'],['Start over','restart']]);
   return bot('Sa budget po na yan, wala pa pong pasok sa current list. Pinakamalapit po: <b>'+esc(cheapest.name)+'</b> at '+php(cheapest.price)+'. '+payLine(cheapest.price),[['Get quotation','q:'+cheapest.key],['Ask Rodz about options','human'],['Start over','restart']])}
  pick=ordered[0];var alt=ordered.find(function(x){return x.model!==pick.model})||ordered[1];
  var why=heavy?'Para sa '+esc((need.use||'').toLowerCase())+', mas maganda po ang mas malakas na model sa loob ng budget ninyo.':'Pasok po siya sa budget at sapat para sa '+esc((need.use||'everyday use').toLowerCase())+' — hindi niyo po kailangang i-max ang budget.';
  bot('Based sa sagot niyo, ito po ang suggestion ko: <b>'+esc(pick.name)+'</b> — '+php(pick.price)+' (dealer price).<br>'+why+(alt?'<br>Alternative: '+esc(alt.name)+' — '+php(alt.price)+'.':'')+'<br>'+payLine(pick.price)+'<br><span class="mini">Prices follow dealer availability. Ise-confirm po namin ang stock bago kayo magbayad.</span>',
   [['Get quotation','q:'+pick.key]].concat(alt?[['Quote '+alt.name,'q:'+alt.key]]:[]).concat([['Talk to Rodz','human'],['Start over','restart']]),800)}
 function payLine(price){var f=fee();if(/card/i.test(need.pay||'')&&!/split/i.test(need.pay)){return 'Kung card: '+php(price)+' + '+f+'% = '+php(price*(1+f/100))+'. Pwede niyo pong i-cash ang '+f+'% ('+php(price*f/100)+') at i-swipe lang ang '+php(price)+'.'}
  if(/split/i.test(need.pay||''))return 'Sa split, ang '+f+'% ay sa card portion lang. Subukan niyo po sa <a href="/payment-guide">payment calculator</a>.';return 'Cash: '+php(price)+'.'}
 function answerFree(t){var low=t.toLowerCase();
  if(/\b(rodz|owner|tao|human|call|tawag|agent|kausap)\b/.test(low))return escalate('Customer asked to talk to Rodz');
  if(/(tawad|discount|less|negotiate|lower price|bawas|special price)/.test(low))return escalate('Price negotiation / special price request');
  if(/(complain|reklamo|sira|defect|refund|scam|problem|issue|dispute)/.test(low))return escalate('Complaint or problem reported');
  var faqs=(pay.faq||[]).filter(function(f){return f&&f.q&&f.a&&f.on!==false}),best=null,bs=0;
  faqs.forEach(function(f){var words=(f.q+' '+(f.k||'')).toLowerCase().split(/[^a-z0-9ñ]+/).filter(function(w){return w.length>3}),sc=0;words.forEach(function(w){if(low.indexOf(w)>-1)sc++});if(sc>bs){bs=sc;best=f}});
  if(best&&bs>=2)return bot(esc(best.a),[['Continue','continue'],['Talk to Rodz','human']]);
  var hit=L.filter(function(x){return low.indexOf(x.model.toLowerCase())>-1});
  if(hit.length)return bot(hit.map(function(x){return esc(x.name)+': <b>'+php(x.price)+'</b>'}).join('<br>')+'<br><span class="mini">Dealer price, cash. Card adds '+fee()+'% on the swiped amount. Confirm stock with us before paying.</span>',hit.slice(0,2).map(function(x){return ['Quote '+x.name,'q:'+x.key]}).concat([['Talk to Rodz','human']]));
  if(/(price|presyo|magkano|how much)/.test(low))return bot('Nasa <a href="/prices">price list</a> po lahat ng current prices. Anong model po ang tinitingnan ninyo?',[['Continue','continue']]);
  if(/(card|install|hulugan|split|fee|terminal)/.test(low))return bot('Card: '+fee()+'% terminal fee sa swiped amount. Pwede niyo pong i-cash ang fee at i-swipe lang ang item price. Kita niyo po ang exact breakdown sa <a href="/payment-guide">payment calculator</a>.',[['Continue','continue']]);
  return bot('Hindi ko po sigurado ang tamang sagot diyan, kaya ayokong manghula. Gusto niyo po bang si Rodz mismo ang sumagot?',[['Yes, ask Rodz','human'],['Continue','continue']])}
 function escalate(reason){need._reason=reason;
  bot('Sige po, ipapasa ko po kay Rodz. Paano po kayo pinakamadaling ma-contact?<form class="hf" id="hf"><input name="n" placeholder="Your name" maxlength="80" required><input name="c" placeholder="Mobile number or FB name" maxlength="80" required><select name="p"><option>Text or call</option><option>Messenger</option><option>Viber</option></select><button class="btn sm" type="submit">Send to Rodz</button></form>',null,400);
  setTimeout(function(){var f=document.getElementById('hf');if(!f)return;f.onsubmit=function(e){e.preventDefault();var fd=new FormData(f),b=f.querySelector('button');b.disabled=true;b.textContent='Sending…';
   rpc('submit_alert',{p:{reason:need._reason,name:String(fd.get('n')),contact:String(fd.get('c')),pref:String(fd.get('p')),need:need,history:hist.slice(-30)}}).then(function(r){f.outerHTML='<p><b>Sent.</b> Rodz will reply as soon as he can'+(r&&r.ref?' (ticket '+esc(r.ref)+')':'')+'. For urgent concerns, call or Viber <a href="'+tel()+'">'+esc(s.phone)+'</a>.</p>'})
   .catch(function(){b.disabled=false;b.textContent='Send to Rodz';toast('Could not send. Please message us on Facebook.')})}},RM?50:500)}
 chat.addEventListener('click',function(e){var b=e.target.closest('.chips button');if(!b||busy)return;var v=b.dataset.v,lab=b.textContent;b.parentNode.remove();
  if(v==='human'){add('me',esc(lab));return escalate('Customer asked to talk to Rodz')}
  if(v==='restart'){need={};chat.innerHTML='';return ask('cat')}
  if(v==='continue'){add('me','Continue');return next()}
  if(v.indexOf('q:')===0){var it=byKey(v.slice(2));add('me',esc(lab));var st={key:it.key,method:/split/i.test(need.pay||'')?'split':/card/i.test(need.pay||'')?'card':'cash',card:String(Math.round(it.price/2/500)*500),feeBy:'cash'};
   return bot('Heto po ang quotation. Pwede niyo pong i-adjust ang payment sa calculator.'+receipt(it,quote(it.price,st.method,st.card,st.feeBy),{})+'<div class="calc-acts"><a class="btn sm" href="/order?'+esc(stToQS(st))+'">Order this</a><a class="btn ghost sm" href="/q?'+esc(stToQS(st))+'">Open quote link</a></div>',[['Talk to Rodz','human'],['Start over','restart']],700)}
  add('me',esc(lab));var k=need._at;if(k){need[k]=v;if(k==='cat'&&v==='Not sure yet')need.cat='Not sure yet'}
  next()});
 document.getElementById('cin').addEventListener('submit',function(e){e.preventDefault();var i=document.getElementById('ctext'),t=i.value.trim();if(!t||busy)return;i.value='';add('me',esc(t));answerFree(t)});
 document.getElementById('human').addEventListener('click',function(){add('me','Talk to Rodz');escalate('Customer asked to talk to Rodz')});
 var _b=qs().budget;if(_b){need.budget=_b}
 ask('cat')}


/* ---------- catalog helpers (models from the price list) ---------- */
var ICON={iphone:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3.4"/><path d="M10.5 4.6h3"/></svg>',macbook:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.6"/><path d="M2 18.5h20"/></svg>',ipad:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2.5" width="16" height="19" rx="2.6"/></svg>'};
function iconKey(c){var k=String((c&&(c.id||c.name))||'').toLowerCase();return k.indexOf('mac')>-1?'macbook':k.indexOf('pad')>-1?'ipad':'iphone'}
function models(){var out=[];(DATA.priceList.categories||[]).forEach(function(c){(c.items||[]).forEach(function(it){if(it.hidden)return;var vs=(it.variants||[]).map(function(v,i){return {i:i,label:v.label||'',price:num(v.price),off:v.status==='unavailable'}});
 var av=vs.filter(function(v){return !v.off&&v.price});out.push({id:it.id,cat:c.name,catId:c.id||c.name,icon:iconKey(c),model:it.model,spec:it.spec||'',colors:it.colors||'',photo:it.photo||'',variants:vs,from:av.length?Math.min.apply(null,av.map(function(v){return v.price})):0,avail:av.length>0})})});return out}
function devHTML(m){var k=m.icon;return '<div class="dev">'+(k==='macbook'?'<div class="d-mac"><i></i><b></b></div>':k==='ipad'?'<div class="d-pad"><i></i></div>':'<div class="d-ph"></div>')+'<small>Photo coming soon</small></div>'}
function pic(m,eager){return m.photo?'<img src="'+esc(m.photo)+'" alt="'+esc(m.model)+'"'+(eager?' decoding="async"':' loading="lazy" decoding="async"')+' onerror="if(!this.dataset.r&&this.src.indexOf(\'/sb/\')>0&&window.EP_CONFIG&&EP_CONFIG.direct){this.dataset.r=1;this.src=EP_CONFIG.direct+this.src.split(\'/sb\')[1];return}this.replaceWith(document.createRange().createContextualFragment(window.__dev&&window.__dev(\''+esc(m.id)+'\')||\'\'))">':devHTML(m)}
function pnum(n){return '<i>₱</i>'+Math.round(n).toLocaleString('en-PH')}
function FD(m){var h=0,s=String(m.id||'');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%997;return ((h%20)/10).toFixed(1)}
function pcard(m){return '<a class="pc2 tile" data-st data-tilt href="/product/'+encodeURIComponent(m.id)+'"><div class="ph" style="--d:'+FD(m)+'s"><span class="fl">'+pic(m)+'</span><i class="gs"></i></div><span class="cat">'+esc(m.cat)+'</span><h3>'+esc(m.model)+'</h3><p class="sp">'+esc(m.variants.map(function(v){return v.label}).filter(Boolean).join(' · '))+'</p>'+
 '<div class="pp">'+(m.avail?'<small>from</small>'+pnum(m.from):'<small>Message for availability</small>')+'</div></a>'}
function wireDrag(el){if(!el)return;var down=false,x0=0,s0=0,moved=false;el.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;moved=false;x0=e.clientX;s0=el.scrollLeft;el.classList.add('drag')});
 window.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-x0;if(Math.abs(dx)>4)moved=true;el.scrollLeft=s0-dx});window.addEventListener('pointerup',function(){down=false;el.classList.remove('drag')});
 el.addEventListener('click',function(e){if(moved){e.preventDefault();moved=false}},true)}
function deliveryList(){var w=(S().ways||[]).filter(function(x){return x&&x.t});return w.length?w:[{t:'Same-day COD',d:'NCR and nearby provinces: Rizal, Laguna, Cavite, Bulacan, Pampanga.'},{t:'Meet-up COD',d:'By schedule at SM Pampanga, SM Clark, Marquee Mall and SM Telabastagan.'},{t:'Physical store',d:'Pampanga, by appointment or rush.'},{t:'Nationwide shipping',d:'Cash on pick-up via LBC.'},{t:'COD / COP',d:'Available in Luzon, Visayas and Mindanao, subject to serviceability and confirmation.'}]}
function payMethods(){var m=S().payMethods;return (m&&m.length?m:['Cash','Credit card'])}
var STEPS=[['Choose your gadget','Browse the latest available gadgets and select your preferred model.'],['Ask for the latest quotation','Send your preferred model, storage and color. We confirm availability and the applicable price.'],['Choose your payment method','Understand the cash and credit card arrangements before confirming.'],['Select delivery or pickup','Choose an available delivery, COD, scheduled meet-up or store arrangement.'],['Confirm your order','Submit your contact details and order information.'],['Wait for confirmation','The Estilo Pinas team verifies your order and coordinates the next steps.']];
function stepsHTML(){return '<ol class="steps2">'+STEPS.map(function(x){return '<li><h3>'+x[0]+'</h3><p>'+x[1]+'</p></li>'}).join('')+'</ol>'}
function faqs(){var f=fee(),L=[['What payment methods do you accept?',payMethods().join(' and ')+'. Card payments have a '+f+'% terminal fee on the amount you swipe — you can pay that fee in cash and swipe only the item price.'],
 ['Where can I get my unit?',deliveryList().map(function(x){return x.t+': '+x.d}).join(' ')],
 ['Can I visit your store?','Yes, by appointment or rush. '+S().address+'. Search "'+(S().mapsQuery||'Estilo Pinas Gadget Shop')+'" on Google Maps or Waze.'],
 ['Why can prices change?',(DATA.priceList.note||[]).slice(0,3).join(' ')]];
 (P().faq||[]).forEach(function(x){if(x&&x.on!==false&&x.q&&x.a)L.push([x.q,x.a])});return L}
function faqHTML(){return '<div class="faq">'+faqs().map(function(x){return '<details><summary>'+esc(x[0])+'</summary><p>'+esc(x[1])+'</p></details>'}).join('')+'</div>'}
function contactHTML(){var s=S();return '<div class="ct g2"><div class="tile it"><dl><div><dt>Store</dt><dd>'+esc(s.address)+'</dd></div><div><dt>Visits</dt><dd>By appointment or rush</dd></div><div><dt>Call / Viber</dt><dd><a href="'+tel()+'">'+esc(s.phone)+'</a></dd></div><div><dt>Google Maps / Waze</dt><dd>'+esc(s.mapsQuery||'Estilo Pinas Gadget Shop')+'</dd></div></dl>'+
 '<div class="acts"><a class="btn" href="'+esc(s.fb)+'" target="_blank" rel="noopener">Contact Estilo Pinas</a><a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(s.mapsQuery||'Estilo Pinas Gadget Shop')+'" target="_blank" rel="noopener">Google Maps</a><a class="btn ghost" href="https://waze.com/ul?q='+encodeURIComponent(s.mapsQuery||'Estilo Pinas Gadget Shop')+'" target="_blank" rel="noopener">Waze</a></div></div>'+
 '<div class="tile blue it"><span class="n">DELIVERY &amp; PICKUP</span>'+deliveryList().map(function(x){return '<h3>'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p>'}).join('')+'</div></div>'}

/* ---------- detail overlay (FLIP from showroom / cards) ---------- */
function openDetail(m,fromEl){var sel=m.variants.findIndex(function(v){return !v.off&&v.price});if(sel<0)sel=0;var f=fee();
 var ov=document.createElement('div');ov.className='ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label',m.model);
 ov.innerHTML='<div class="ov-in"><button class="ov-x" type="button" aria-label="Close">×</button><div class="ov-ph">'+pic(m,true)+'</div><div class="ov-tx"><span class="lbl2">'+esc(m.cat)+'</span><h2 class="disp" style="font-size:clamp(24px,3.4vw,34px);margin:0">'+esc(m.model)+'</h2>'+(m.spec?'<p class="pd-spec">'+esc(m.spec)+'</p>':'')+(m.colors?'<p class="pd-col"><b>COLORS</b>'+esc(m.colors)+'</p>':'')+
  '<div class="vsel" role="group" aria-label="Choose option">'+m.variants.map(function(v,i){return '<button type="button" data-i="'+i+'"'+(v.off||!v.price?' disabled':'')+'>'+esc(v.label||'Standard')+(v.off?' · unavailable':'')+'</button>'}).join('')+'</div>'+
  '<div class="tile pd-price"><div class="cash"><span>CASH PRICE</span><b><i>₱</i><span class="tw" data-v="0"></span></b></div><div class="card"><span>Credit card (+'+f+'%)</span><b class="cp"></b></div><div class="card"><span>Stock</span><b class="stk"></b></div></div>'+
  '<div class="pd-acts"><button class="btn big" type="button" data-add>Add to bag</button><a class="btn ghost big" data-ord>Order now</a><a class="btn ghost big" href="/product/'+encodeURIComponent(m.id)+'">Full details <span class="ar">→</span></a></div><p class="pd-note">'+esc(payMethods().join(' · '))+' · We confirm stock and the latest price before you pay.</p></div></div>';
 document.body.appendChild(ov);document.body.style.overflow='hidden';var img=ov.querySelector('.ov-ph img,.ov-ph .dev');if(fromEl&&window.EPM)EPM.flip(fromEl.querySelector('img,.dev')||fromEl,img);
 function draw(){var v=m.variants[sel];ov.querySelectorAll('.vsel button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.i===sel))});
  window.EPM?EPM.tween(ov.querySelector('.tw'),v.price):ov.querySelector('.tw').textContent=v.price.toLocaleString('en-PH');ov.querySelector('.cp').textContent=php(v.price*(1+f/100));ov.querySelector('.stk').textContent=v.off?'Unavailable':'Available — we confirm before payment';
  ov.querySelector('[data-ord]').href='/order?'+toQS({m:m.id,v:v.label,pay:'cash'})}
 function close(){ov.remove();document.body.style.overflow='';document.removeEventListener('keydown',key);if(fromEl&&fromEl.focus)try{fromEl.focus({preventScroll:true})}catch(_){}}
 function key(e){if(e.key==='Escape')close()}document.addEventListener('keydown',key);
 ov.addEventListener('click',function(e){if(e.target===ov||e.target.closest('.ov-x'))return close();var b=e.target.closest('.vsel button');if(b&&!b.disabled){sel=+b.dataset.i;draw()}
  if(e.target.closest('[data-add]')){var v=m.variants[sel];bagAdd(m,v,ov.querySelector('.ov-ph'));}});
 draw();ov.querySelector('.ov-x').focus()}

/* ---------- real Facebook reviews (owner-editable in admin) ---------- */
function reviewsHTML(){var s=S(),L=(s.reviews||[]).filter(function(r){return r&&r.on!==false&&r.t});
 var head='<div class="sh2"><div><p class="eyebrow">Customer reviews</p><h2>'+(s.reviewCount?esc(s.reviewCount)+' reviews. ':'Real buyers. ')+(s.reviewPct?esc(s.reviewPct)+'% recommend.':'')+'</h2><p>Straight from our Facebook page.</p></div><a href="'+esc(s.fb)+'" target="_blank" rel="noopener">See all on Facebook →</a></div>';
 if(!L.length)return '<section class="wrap sec2" data-rv>'+head+'<div data-st class="tile cream rev2"><div><h3>Real buyers, real posts</h3><p>See our customers’ reviews and legit-check posts on our Facebook page.</p></div><a class="btn" href="'+esc(s.fb)+'" target="_blank" rel="noopener">See reviews on Facebook</a></div></section>';
 function card(r){return '<figure class="rvc'+(r.photo?' hasph':'')+'" data-st>'+(r.photo?'<img src="'+esc(r.photo)+'" alt="Photo posted by '+esc(r.n)+'" loading="lazy" decoding="async">':'')+'<figcaption><div class="rvh"><span class="av" aria-hidden="true">'+esc(String(r.n||'?').trim().charAt(0).toUpperCase())+'</span><div><b>'+esc(r.n)+'</b> <span class="mu">recommends</span> <b>Estilo Pinas</b><small>'+esc(r.d||'')+(r.d?' · ':'')+'Facebook review</small></div></div><blockquote>'+esc(r.t)+'</blockquote></figcaption></figure>'}
 return '<section class="wrap sec2" data-rv>'+head+'<div class="rvw" id="rvw">'+L.map(card).join('')+'</div></section>'}

/* ---------- PAGE: home ---------- */
function pageHome(){var M=models();var hero=M.find(function(m){return m.photo&&m.avail&&m.spec})||M[0];var f=fee();
 var cats=[];(DATA.priceList.categories||[]).forEach(function(c){var n=(c.items||[]).length;if(n)cats.push({id:c.id||c.name,name:c.name,n:n,icon:iconKey(c)})});
 var show=M.filter(function(m){return m.avail}).slice(0,10);
 shell(
 '<section class="cine" aria-label="Welcome"><div class="cine-grid" aria-hidden="true"></div><div class="wrap cine-in"><div><img class="cine-logo" src="/wordmark-white.svg" alt="Estilo Pinas"><h1><span class="ln"><span>Your next</span></span><span class="ln"><span>gadget starts</span></span><span class="ln"><span class="acc">here.</span></span></h1>'+
  '<p class="sub">Premium gadgets. Smart choices. Legit transactions. Personal assistance.</p><div class="acts"><a class="btn big" href="#showroom">Explore gadgets <span class="ar">→</span></a><a class="btn ghost big" href="/ask">Talk to our assistant</a></div>'+
  '<div class="cine-trust"><span>Brand new, sealed</span><span>Legit since 2014</span><span>'+esc(payMethods().join(' · '))+'</span></div></div><div class="h3" id="h3"></div></div><a class="scrollcue" href="#showroom" aria-label="Scroll to showroom"><i></i>SCROLL</a></section>'+
 '<section class="wrap sec2" id="showroom"><div class="sh2"><div><p class="eyebrow">3D showroom</p><h2>Spin through the latest</h2><p>Drag, swipe, scroll or use the arrow keys. Tap the front gadget for details.</p></div><div class="viewtog" role="group" aria-label="View"><button type="button" data-view="3d" aria-pressed="true">3D</button><button type="button" data-view="grid" aria-pressed="false">Grid</button></div></div>'+
  '<div class="sr" id="sr"></div><div class="pgrid" id="srgrid" hidden>'+M.map(pcard).join('')+'</div></section>'+
 '<section class="wrap sec2" id="floatsec" data-rv><div class="sh2"><div><p class="eyebrow">Floating lineup</p><h2>Every gadget, up close</h2><p>Drag or swipe to glide, hover to spotlight, or hit Shuffle. Tap any gadget for prices.</p></div></div><div class="fr" id="fr"></div></section>'+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">Gadget categories</p><h2>Shop by category</h2></div><a href="/gadgets">All gadgets →</a></div><div class="catg">'+cats.map(function(c,i){return '<a data-st data-tilt class="tile catt '+['ink','blue','cream'][i%3]+'" href="/gadgets?cat='+encodeURIComponent(c.id)+'"><div><h3>'+esc(c.name)+'</h3><p>'+c.n+' model'+(c.n>1?'s':'')+'</p></div>'+ICON[c.icon]+'</a>'}).join('')+'</div></section>'+
 '<section class="wrap sec2" data-rv><div data-st class="tile blue disc"><p class="eyebrow" style="color:#cfd6de">Product discovery</p><h3>Not sure what to get? Start with your budget.</h3><div class="chips2"><a href="/ask?budget=40000">Below ₱40,000</a><a href="/ask?budget=60000">₱40,000–₱60,000</a><a href="/ask?budget=90000">₱60,000–₱90,000</a><a href="/ask?budget=999999">Above ₱90,000</a></div></div></section>'+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">Why Estilo Pinas</p><h2>Presyo + tiwala + legit transaction</h2></div></div><div class="g3"><div data-st data-tilt class="tile it"><span class="n">01</span><h3>Brand new, sealed</h3><p>Every unit is factory sealed.</p></div><div data-st data-tilt class="tile it"><span class="n">02</span><h3>Legit since 2014</h3><p>A real store in Mabalacat, Pampanga you can visit by appointment.</p></div><div data-st data-tilt class="tile it"><span class="n">03</span><h3>Direct dealer prices</h3><p>We work with direct dealers so you get competitive prices.</p></div></div></section>'+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">Transparent pricing</p><h2>See the full cost first</h2><p>Same dealer price for cash and card. Card payments add a '+f+'% terminal fee on the swiped amount only.</p></div><a href="/prices">Price list →</a></div><div class="g2"><div data-st class="tile price-ex"><span class="lbl2">Example · ₱30,000 item</span><div class="row"><span>Cash</span><b>'+pnum(30000)+'</b></div><div class="row"><span>Credit card (+'+f+'%)</span><b>'+pnum(30000*(1+f/100))+'</b></div><div class="row"><span>Card, fee paid in cash</span><span><b>'+pnum(30000)+'</b> swipe + '+php(30000*f/100)+' cash</span></div></div>'+
  '<div data-st class="tile ink it"><span class="n" style="color:#cfd6de">PAYMENT OPTIONS</span><h3>'+esc(payMethods().join(' · '))+'</h3><p>Pay all in cash, all on card, or split between the two. Some banks also offer credit-to-cash — ask your bank directly.</p><p style="margin-top:14px"><a class="btn light" href="/payment-guide">Open payment calculator <span class="ar">→</span></a></p></div></div></section>'+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">How to avail</p><h2>Six simple steps</h2></div><a href="'+esc(S().fb)+'" target="_blank" rel="noopener">Contact Estilo Pinas →</a></div>'+stepsHTML().replace(/<li>/g,'<li data-st>')+'</section>'+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">Delivery &amp; pickup</p><h2>Get it your way</h2></div></div><div class="g3">'+deliveryList().map(function(x,i){return '<div data-st class="tile it'+(i===0?' blue':'')+'"><h3>'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p></div>'}).join('')+'</div></section>'+
 reviewsHTML()+
 '<section class="wrap sec2" data-rv><div class="sh2"><div><p class="eyebrow">FAQ</p><h2>Good to know</h2></div></div><div data-st>'+faqHTML()+'</div></section>'+
 '<section class="wrap sec2" data-rv><div data-st class="tile ink rev2"><div><p class="eyebrow" style="color:#cfd6de">Shopping assistant</p><h3>Ask us anything</h3><p>Tell us your budget and how you’ll use it — we’ll help you pick. Rodz can join anytime.</p></div><a class="btn light" href="/ask">Ask our assistant <span class="ar">→</span></a></div></section>'+
 '<section class="wrap sec2" data-rv style="padding-bottom:48px"><div class="sh2"><div><p class="eyebrow">Contact &amp; store</p><h2>Visit or message us</h2></div></div><div data-st>'+contactHTML()+'</div></section>');
 wireDrag(document.getElementById('rvw'));if(window.EPM){var pops=[],seen={};seen[hero&&hero.catId]=1;M.forEach(function(m){if(m.photo&&m.avail&&!seen[m.catId]){seen[m.catId]=1;pops.push(m)}});M.forEach(function(m){if(pops.length<3&&m.photo&&m.avail&&m!==hero&&pops.indexOf(m)<0&&m.catId===(hero&&hero.catId))pops.push(m)});
  EPM.hero(document.getElementById('h3'),hero,pops);
  var fl=M.filter(function(m){return m.photo});if(fl.length>2&&EPM.rail)EPM.rail(document.getElementById('fr'),fl,{render:function(m){return pic(m,true)},label:function(m){return esc(m.model)+'<b>'+(m.avail?pnum(m.from):'Ask us')+'</b>'},open:function(m,n){openDetail(m,n.querySelector('img')||n)}});else{var fs=document.getElementById('floatsec');if(fs)fs.remove()}
  EPM.showroom(document.getElementById('sr'),show.length?show:M,{render:function(m){return '<div class="ph" style="--d:'+FD(m)+'s"><span class="fl">'+pic(m,true)+'</span><i class="gs"></i></div><p class="nm">'+esc(m.model)+'</p>'},
   info:function(m){return '<h3>'+esc(m.model)+'</h3><p>'+esc(m.spec||m.variants.map(function(v){return v.label}).join(' · '))+'</p><div class="pp">'+(m.avail?'<small>from</small>'+pnum(m.from):'Message for availability')+'</div><div class="row"><button class="btn" type="button" data-open="'+esc(m.id)+'">View details</button><a class="btn ghost" href="/product/'+encodeURIComponent(m.id)+'">Full page</a></div>'},
   open:function(m,node){openDetail(m,node)}})}
 document.getElementById('showroom').addEventListener('click',function(e){var b=e.target.closest('[data-open]');if(b){var m=models().find(function(x){return x.id===b.dataset.open});if(m)openDetail(m,document.querySelector('.sr-item.on'))}
  var v=e.target.closest('[data-view]');if(v){var g=v.dataset.view==='grid';document.getElementById('sr').hidden=g;document.getElementById('srgrid').hidden=!g;document.querySelectorAll('[data-view]').forEach(function(x){x.setAttribute('aria-pressed',String(x===v))})}})}

/* ---------- PAGE: gadgets ---------- */
function pageGadgets(){var o=qs(),cat=o.cat||'all',q='';var cats=[];(DATA.priceList.categories||[]).forEach(function(c){if((c.items||[]).length)cats.push({id:c.id||c.name,name:c.name})});
 shell('<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>All gadgets</p><h1 class="disp">Gadgets</h1><p class="lead">Brand new, sealed. Tap a gadget to see storage options, prices and payment breakdown.</p></div></section>'+
  '<section class="wrap" style="padding-bottom:48px"><div class="filt" role="toolbar" aria-label="Filter"><button type="button" data-c="all">All</button>'+cats.map(function(c){return '<button type="button" data-c="'+esc(c.id)+'">'+esc(c.name)+'</button>'}).join('')+'<input type="search" id="gq" placeholder="Search model…" aria-label="Search model"></div><div class="pgrid" id="pg"></div></section>');
 function draw(){var M=models().filter(function(m){return (cat==='all'||m.catId===cat)&&(!q||m.model.toLowerCase().indexOf(q)>-1)});
  document.querySelectorAll('.filt button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.c===cat))});
  document.getElementById('pg').innerHTML=M.length?M.map(pcard).join(''):'<p class="empty">No gadgets match. Try another search or <a href="/ask">ask us</a>.</p>'}
 document.querySelector('.filt').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;cat=b.dataset.c;try{history.replaceState(null,'',cat==='all'?'/gadgets':'/gadgets?cat='+encodeURIComponent(cat))}catch(_){}draw()});
 document.getElementById('gq').addEventListener('input',function(e){q=e.target.value.trim().toLowerCase();draw()});draw()}

/* ---------- PAGE: product ---------- */
function pageProduct(){var slug=decodeURIComponent((location.pathname.split('/product/')[1]||qs().id||'').replace(/\/$/,''));var m=models().find(function(x){return x.id===slug});
 if(!m){shell('<section class="hero"><div class="wrap"><h1 class="disp">Gadget not found</h1><p class="lead">It may have been removed. See all available gadgets.</p><p><a class="btn" href="/gadgets">See gadgets</a></p></div></section>');return}
 document.title=m.model+' · Estilo Pinas';var sel=m.variants.findIndex(function(v){return !v.off&&v.price});if(sel<0)sel=0;var f=fee();
 shell('<section class="wrap"><p style="margin:16px 0 0;font-size:13px"><a href="/gadgets" style="color:var(--mute)">← All gadgets</a></p><div class="pd"><div class="tile pd-ph">'+pic(m)+'</div><div class="pd-info"><span class="lbl2">'+esc(m.cat)+'</span><h1>'+esc(m.model)+'</h1>'+(m.spec?'<p class="pd-spec">'+esc(m.spec)+'</p>':'')+(m.colors?'<p class="pd-col"><b>COLORS</b>'+esc(m.colors)+'</p>':'')+
  '<div><span class="lbl2">Storage / option</span><div class="vsel" role="group" aria-label="Choose option" style="margin-top:8px">'+m.variants.map(function(v,i){return '<button type="button" data-i="'+i+'"'+(v.off||!v.price?' disabled':'')+'>'+esc(v.label||'Standard')+(v.off?' · unavailable':'')+'</button>'}).join('')+'</div></div>'+
  '<div class="tile pd-price" id="pp" aria-live="polite"></div><div class="pd-acts" id="pa"></div><p class="pd-note">Brand new, sealed. Prices follow dealer availability — we confirm stock and the latest price before you pay.</p>'+
  '<div class="trust"><div class="tile">Brand new, sealed</div><div class="tile">Legit since 2014</div><div class="tile">'+esc(payMethods().join(' · '))+'</div></div></div></div></section>'+
  '<section class="wrap sec2" style="padding-bottom:48px"><div class="sh2"><div><p class="eyebrow">How to avail</p><h2>Six simple steps</h2></div></div>'+stepsHTML()+'</section>');
 function draw(){var v=m.variants[sel];document.querySelectorAll('.vsel button').forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.i===sel))});
  var pp=document.getElementById('pp'),pa=document.getElementById('pa');
  if(!v||!v.price||v.off){pp.innerHTML='<div class="cash"><span>PRICE</span><b style="font-size:20px">Message us</b></div>';pa.innerHTML='<a class="btn big" href="'+esc(msgr('Hi Estilo Pinas! Is the '+m.model+' available?'))+'" target="_blank" rel="noopener">Ask for availability</a>';return}
  var st={m:m.id,v:v.label};pp.innerHTML='<div class="cash"><span>CASH PRICE</span><b><i>₱</i><span class="tw" data-v="'+(window.__lastP||0)+'"></span></b></div><div class="card"><span>Credit card (+'+f+'% terminal fee)</span><b>'+php(v.price*(1+f/100))+'</b></div><div class="card"><span>Card, fee paid in cash</span><b>swipe '+php(v.price)+' + '+php(v.price*f/100)+' cash</b></div>';
  pa.innerHTML='<button class="btn big" type="button" data-add>Add to bag</button><a class="btn ghost big" href="/order?'+esc(toQS({m:m.id,v:v.label,pay:'cash'}))+'">Order now</a><a class="btn ghost big" href="/payment-guide?'+esc(toQS({m:m.id,v:v.label,pay:'split',fee:'cash'}))+'#calc-sec">Payment calculator</a><a class="btn ghost big" href="'+esc(msgr('Hi Estilo Pinas! Is the '+m.model+' '+v.label+' available? Cash price '+php(v.price)+'.'))+'" target="_blank" rel="noopener">Ask for stock</a>'}
 document.querySelector('.vsel').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||b.disabled)return;sel=+b.dataset.i;draw()});
 document.getElementById('pa').addEventListener('click',function(e){if(e.target.closest('[data-add]'))bagAdd(m,m.variants[sel],document.querySelector('.pd-ph'))});
 var _d=draw;draw=function(){_d();var v=m.variants[sel],tw=document.querySelector('#pp .tw');if(tw&&v&&v.price){window.EPM?EPM.tween(tw,v.price):tw.textContent=v.price.toLocaleString('en-PH');window.__lastP=v.price}};draw()}

/* ---------- PAGE: how to order ---------- */
function pageHow(){shell('<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>How to avail</p><h1 class="disp">How to order</h1><p class="lead">Six simple steps from choosing your gadget to getting it in your hands.</p></div></section>'+
 '<section class="wrap">'+stepsHTML()+'<div class="calc-acts"><a class="btn big" href="'+esc(S().fb)+'" target="_blank" rel="noopener">Contact Estilo Pinas</a><a class="btn ghost big" href="/gadgets">Choose a gadget</a><a class="btn ghost big" href="/order">Send an order request</a></div></section>'+
 '<section class="wrap sec2"><div class="sh2"><div><p class="eyebrow">Delivery &amp; pickup</p><h2>Get it your way</h2></div></div><div class="g3">'+deliveryList().map(function(x){return '<div class="tile it"><h3>'+esc(x.t)+'</h3><p>'+esc(x.d)+'</p></div>'}).join('')+'</div></section>'+
 '<section class="wrap sec2" style="padding-bottom:48px"><div class="sh2"><div><p class="eyebrow">FAQ</p><h2>Good to know</h2></div></div>'+faqHTML()+'</section>')}

/* ---------- PAGE: track order ---------- */
var FLOW=['New Inquiry','For Owner Review','Quotation Sent','Awaiting Customer Confirmation','Order Confirmed','Awaiting Payment','Paid','Processing','Ready for Pickup','Shipped','Completed'];
function pageTrack(){var o=qs();shell('<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>Order status</p><h1 class="disp">Track your order</h1><p class="lead">Enter the reference number from your order request (e.g. EP-261119-AB12) and the mobile number you used.</p></div></section>'+
 '<section class="wrap" style="padding-bottom:48px"><form class="tile trk" id="tf" novalidate><label class="fl"><span>Reference number</span><input name="r" required maxlength="20" autocapitalize="characters" value="'+esc(o.ref||'')+'" placeholder="EP-XXXXXX-XXXX"></label><label class="fl"><span>Mobile number</span><input name="m" required inputmode="tel" maxlength="20" placeholder="09XX XXX XXXX"></label><button class="btn big" type="submit">Check status</button><div id="tr" aria-live="polite"></div></form></section>');
 document.getElementById('tf').onsubmit=function(e){e.preventDefault();var fd=new FormData(this),out=document.getElementById('tr'),b=this.querySelector('button');var r=String(fd.get('r')).trim(),m=String(fd.get('m')).trim();
  if(!r||!m){out.innerHTML='<p class="err">Please enter both.</p>';return}b.disabled=true;b.textContent='Checking…';
  rpc('track_order',{p_ref:r,p_mobile:m}).then(function(d){b.disabled=false;b.textContent='Check status';if(!d||!d.ref){out.innerHTML='<p class="err">No order found with that reference and mobile number.</p>';return}
   var k=FLOW.indexOf(d.status),cancelled=d.status==='Cancelled';out.innerHTML='<div class="trk-res"><span class="lbl2">'+esc(d.ref)+'</span><b>'+esc(d.status)+'</b><span>'+esc(d.item)+(d.total?' · '+php(d.total):'')+'</span>'+(cancelled?'':'<div class="tl" aria-hidden="true">'+FLOW.map(function(_,i){return '<i class="'+(i<=k?'on':'')+'"></i>'}).join('')+'</div>')+'<p class="mini">Updated '+new Date(d.updated_at).toLocaleString('en-PH')+'</p></div>'})
  .catch(function(){b.disabled=false;b.textContent='Check status';out.innerHTML='<p class="err">Could not check right now. Please message us on Facebook.</p>'})}}

/* ---------- PAGE: contact ---------- */
function pageContact(){shell('<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>Contact &amp; store</p><h1 class="disp">Visit or message us</h1><p class="lead">Physical store in Mabalacat, Pampanga — by appointment or rush. Message us anytime.</p></div></section><section class="wrap" style="padding-bottom:48px">'+contactHTML()+'</section>')}
/* ---------- boot ---------- */
(function src(){var o=qs();if(o.utm_source||o.src){try{sessionStorage.setItem('ep_src',(o.utm_source||o.src)+(o.utm_campaign?'/'+o.utm_campaign:''))}catch(e){}}})();
var PAGES={home:pageHome,gadgets:pageGadgets,product:pageProduct,howto:pageHow,track:pageTrack,contact:pageContact,pay:pagePay,q:pageQuote,order:pageOrder,ask:pageAsk};
root.innerHTML='<div class="loading" aria-busy="true"><img src="/wordmark.svg" alt="Estilo Pinas" width="110" height="51"></div>';
load().then(function(){(PAGES[PAGE]||pagePay)()});
window.EPQ={quote:quote};
})();
