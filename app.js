const data=window.CONTENT;
const find=id=>data.find(item=>item.id===id);
const workList=[
{id:'PR010',name:'봉황 화문석',detail:'assets/PR010-A004.webp'},
{id:'PR014',name:'4푼 완자 화문석',detail:'assets/PR014-A004.webp'},
{id:'PR011',name:'4푼 푸른 물결 화문석',detail:'assets/PR011-A004.webp'},
{id:'PR015',name:'황금빛 올리브 현대 완자',detail:'assets/PR015-A005.webp'}
];
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
const tabs=[...document.querySelectorAll('[data-work]')];
const workImage=document.querySelector('#work-image'),workPhoto=document.querySelector('#work-photo');
let selected=0,whole=false;
function updateWork(){
 const w=workList[selected],c=find(w.id);
 tabs.forEach((t,i)=>{t.setAttribute('aria-selected',String(i===selected));t.tabIndex=i===selected?0:-1;});
 document.querySelector('#work-panel').setAttribute('aria-labelledby','work-tab-'+selected);
 workImage.src=whole?c.image:w.detail;workImage.alt=w.name+(whole?' 전체 모습':' 문양 상세');
 workPhoto.classList.toggle('whole',whole);workPhoto.dataset.content=w.id;workPhoto.href='/ganghwa-hwamunseok/works/'+w.id.toLowerCase()+'/';workPhoto.setAttribute('aria-label',w.name+' 자세히 보기');
 document.querySelector('#work-detail').dataset.content=w.id;document.querySelector('#work-detail').href='/ganghwa-hwamunseok/works/'+w.id.toLowerCase()+'/';
 document.querySelector('#work-name').textContent=w.name;
 document.querySelector('#work-summary').textContent=c.body;
 document.querySelector('#work-size').textContent=c.specs.size.replaceAll('x',' × ').replaceAll('or',' / ')+' · '+c.specs.material;
 document.querySelector('#work-status').textContent=c.sale_status;
 document.querySelector('#work-counter').textContent=String(selected+1).padStart(2,'0')+' / 04';
 document.querySelector('#work-image-label').textContent=whole?'작품 전체 / FULL VIEW':'문양 상세 / DETAIL';
 document.querySelector('#view-detail').setAttribute('aria-pressed',String(!whole));document.querySelector('#view-whole').setAttribute('aria-pressed',String(whole));
 if(!reduce.matches){workImage.getAnimations().forEach(a=>a.cancel());workImage.animate([{opacity:.2,transform:'scale(1.04)'},{opacity:1,transform:'scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.65,.2,1)'});}
}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>{selected=i;whole=false;updateWork()});tab.addEventListener('keydown',e=>{
 let next=i;if(['ArrowDown','ArrowRight'].includes(e.key))next=(i+1)%tabs.length;else if(['ArrowUp','ArrowLeft'].includes(e.key))next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
 e.preventDefault();selected=next;whole=false;updateWork();tabs[next].focus();
})});
document.querySelector('#view-detail').addEventListener('click',()=>{whole=false;updateWork()});
document.querySelector('#view-whole').addEventListener('click',()=>{whole=true;updateWork()});
const preloader=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){workList.forEach(w=>{const im=new Image();im.src=w.detail;});preloader.disconnect();}},{rootMargin:'500px'});
preloader.observe(document.querySelector('#works'));

const opening=document.querySelector('.opening'),stage=document.querySelector('.exhibition-stage'),hands=document.querySelector('.hands-window'),header=document.querySelector('.site-header');
let queued=false;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function updateMotion(){
 queued=false;
 const r=opening.getBoundingClientRect(),v=innerHeight;
 const p=reduce.matches?0:clamp(-r.top/Math.max(1,opening.offsetHeight-v));
 opening.style.setProperty('--progress',p.toFixed(4));
 const s=stage.getBoundingClientRect();
 const drift=reduce.matches?0:(clamp((v-s.top)/(v+s.height))-.5)*70;
 stage.style.setProperty('--drift',drift.toFixed(1)+'px');
 header.classList.toggle('is-scrolled',scrollY>opening.offsetHeight-80);
}
function scheduleMotion(){if(!queued){queued=true;requestAnimationFrame(updateMotion);}}
addEventListener('scroll',scheduleMotion,{passive:true});addEventListener('resize',scheduleMotion);reduce.addEventListener('change',scheduleMotion);
if(!reduce.matches)document.documentElement.classList.add('motion-ready');
const handObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');handObserver.unobserve(e.target);}})},{threshold:.18});
handObserver.observe(hands);
document.fonts.ready.then(scheduleMotion);updateMotion();

