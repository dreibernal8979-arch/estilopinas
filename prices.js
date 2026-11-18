/* Estilo Pinas — public price list page (/prices).
   Reads the price list saved by the owner editor; falls back to pricelist.js until the first save. */
(function(){
var CFG=window.EP_CONFIG||{},el=document.getElementById('pl');
var data=JSON.parse(JSON.stringify(window.EP_PRICES_DEFAULT)),set={fb:'https://www.facebook.com/share/1aQGnn61Tp/',messenger:'',phone:'0995 883 1899',address:'06 Macapagal St., Brgy. Lakandula, Mabalacat, Pampanga',hours:'By appointment'};
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function num(p){var n=Number(String(p).replace(/[^0-9.]/g,''));return n>0?n:0}
function money(p){var n=num(p);return n?'<span class="cur">₱</span>'+n.toLocaleString('en-PH'):'<span class="ask-p">Message for price</span>'}
function plain(p){var n=num(p);return n?'₱'+n.toLocaleString('en-PH'):''}
function msgr(text){var m=(set.messenger||'').trim();if(!m)return (set.fb||'').trim();var base=/^https?:\/\//.test(m)?m:'https://m.me/'+m.replace(/^@/,'').replace(/^(www\.)?(facebook\.com|m\.me)\//,'');return base+(base.indexOf('?')<0?'?':'&')+'text='+encodeURIComponent(text)}
function tel(){return 'tel:'+String(set.phone||'').replace(/[^0-9+]/g,'')}
function dateStr(d){var t=new Date(d+'T00:00:00');return isNaN(t)?esc(d):t.toLocaleDateString('en-PH',{year:'numeric',month:'long',day:'numeric'})}
var CAT_ICON={iphone:'<svg viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="3.4"/><rect x="10" y="4.2" width="4" height="1.3" rx=".65" class="n"/></svg>',
 macbook:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="11" rx="1.6"/><path d="M2 18.5h20"/></svg>',
 ipad:'<svg viewBox="0 0 24 24"><rect x="4" y="2.5" width="16" height="19" rx="2.6"/></svg>'};
function iconFor(c){var k=String(c.id||c.name||'').toLowerCase();return CAT_ICON[k.indexOf('mac')>-1?'macbook':k.indexOf('pad')>-1?'ipad':'iphone']}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'cat'}

function render(){
 var cats=(data.categories||[]).filter(function(c){return (c.items||[]).length});
 var h='';
 h+='<header class="top"><div class="wrap top-in"><a class="brand" href="/" aria-label="Estilo Pinas home"><img src="/wordmark.svg" alt="Estilo Pinas" width="124" height="58"></a>'+
  '<nav class="top-links"><a href="/">Shop</a><a href="/pay">Payment guide</a><a href="/ask">Ask us</a><a class="btn" href="'+esc(msgr('Hi Estilo Pinas! I saw your price list. Can I ask about stock?'))+'" target="_blank" rel="noopener">Message us</a></nav></div></header>';
 h+='<section class="hero"><div class="wrap"><p class="eyebrow"><span class="dot"></span>Updated '+dateStr(data.updated)+'</p>'+
  '<h1 class="disp">Price list</h1><p class="lead">Brand new, sealed units. Message us before ordering to confirm the latest stock and price.</p></div></section>';
 h+='<nav class="cats" aria-label="Categories"><div class="wrap cats-in">'+cats.map(function(c){return '<a href="#'+slug(c.id||c.name)+'">'+iconFor(c)+'<span>'+esc(c.name)+'</span></a>'}).join('')+'<a href="#reminder" class="rem-l">Price reminder</a></div></nav>';
 h+='<main class="wrap">';
 cats.forEach(function(c){
  var n=0;c.items.forEach(function(it){n+=(it.variants||[]).length});
  h+='<section class="cat" id="'+slug(c.id||c.name)+'"><div class="cat-h"><h2 class="disp">'+esc(c.name)+'</h2><span class="cnt">'+n+' option'+(n===1?'':'s')+'</span></div><div class="grid">';
  c.items.forEach(function(it){
   var vs=(it.variants||[]),avail=vs.some(function(v){return v.status!=='unavailable'});
   h+='<article class="card'+(avail?'':' off')+'"><div class="card-h"><h3>'+esc(it.model)+'</h3>'+(it.spec?'<p class="spec">'+esc(it.spec)+'</p>':'')+'</div><ul class="vars">'+
    vs.map(function(v){var off=v.status==='unavailable';
     return '<li class="'+(off?'off':'')+'"><span class="lab">'+esc(v.label||'Price')+'</span><span class="lead-dots" aria-hidden="true"></span>'+(off?'<span class="na">Unavailable</span>':'<span class="pr">'+money(v.price)+'</span>')+'</li>'}).join('')+
    '</ul><div class="card-acts"><a class="ask" href="/pay?m='+encodeURIComponent(it.id)+(vs.length===1?'&v='+encodeURIComponent(vs[0].label||''):'')+'#calc-sec">Card / split price →</a><a class="ask" href="'+esc(msgr('Hi Estilo Pinas! Is the '+it.model+(vs.length===1&&vs[0].label?' '+vs[0].label:'')+' available? I saw it on your price list.'))+'" target="_blank" rel="noopener">Ask for stock <span aria-hidden="true">→</span></a></div></article>'});
  h+='</div></section>'});
 var note=(data.note||[]).filter(Boolean),last=note.length>1&&/thank you/i.test(note[note.length-1])?note.pop():'';
 h+='<section class="rem" id="reminder"><div class="rem-in"><p class="eyebrow">'+esc(data.noteLabel||'Important price reminder')+'</p><h2>'+esc(data.noteTitle||'A quick note about our pricing')+'</h2>'+
  note.map(function(p){return '<p>'+esc(p)+'</p>'}).join('')+(last?'<p class="thanks">'+esc(last)+'</p>':'')+'</div></section>';
 h+='</main>';
 h+='<section class="contact"><div class="wrap contact-in"><div><h2 class="disp">Confirm before you order</h2><p>Prices and stock move fast. Send us the model and storage and we will reply with the latest price.</p></div>'+
  '<div class="c-acts"><a class="btn big" href="'+esc(msgr('Hi Estilo Pinas! I want to confirm the latest price and stock.'))+'" target="_blank" rel="noopener">Message on Facebook</a>'+
  (set.phone?'<a class="btn ghost big" href="'+tel()+'">Call / Viber '+esc(set.phone)+'</a>':'')+'</div>'+
  '<p class="addr">'+esc(set.address||'')+(set.hours?' · '+esc(set.hours):'')+'</p></div></section>';
 h+='<footer class="foot"><div class="wrap foot-in"><img src="/wordmark.svg" alt="" width="86" height="40"><span>Brand new &amp; sealed since 2014 · Prices may change without prior notice</span><button class="print" type="button" onclick="window.print()">Print / Save PDF</button></div></footer>';
 el.innerHTML=h;
}
render();
if(CFG.url){fetch(CFG.url+'/rest/v1/site?id=eq.main&select=data',{headers:{apikey:CFG.key,Authorization:'Bearer '+CFG.key}}).then(function(r){return r.json()}).then(function(rows){
 var d=rows&&rows[0]&&rows[0].data;if(!d)return;if(d.settings)Object.keys(set).forEach(function(k){if(d.settings[k])set[k]=d.settings[k]});
 if(d.priceList&&d.priceList.categories)data=d.priceList;render();
 if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}}).catch(function(){})}
})();
