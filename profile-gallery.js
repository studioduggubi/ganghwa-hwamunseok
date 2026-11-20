/* Native horizontal browsing, with a quiet, pausable five-image loop. */
(() => {
  const section=document.querySelector('.maker-profile');
  if(!section)return;
  const viewport=section.querySelector('.profile-viewport');
  const track=section.querySelector('.profile-track');
  const originals=[...track.children],count=originals.length;
  const controls=section.querySelector('.profile-controls');
  const play=section.querySelector('[data-profile-play]');
  const counter=section.querySelector('.profile-count');
  const dialog=section.querySelector('.profile-viewer');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=matchMedia('(max-width:760px)');
  let paused=false,hovered=false,visible=false,cycle=0,current=0;
  let timer,settleTimer,drag=null,ignoreClickUntil=0,returnFocus;
  const reduced=()=>reduce.matches||document.body.classList.contains('motion-reduced');
  originals.forEach(card=>{
    const copy=card.cloneNode(true);
    copy.setAttribute('aria-hidden','true');copy.dataset.duplicate='true';
    copy.querySelector('button').tabIndex=-1;
    track.append(copy);
  });
  const cards=[...track.children];
  controls.hidden=false;
  function updateHeight(){
    if(mobile.matches)viewport.style.height=(originals[current].getBoundingClientRect().height+10)+'px';
    else viewport.style.removeProperty('height');
  }
  function measure(){
    cycle=cards[count].offsetLeft-cards[0].offsetLeft;
    updateHeight();
  }
  function updateCurrent(){
    if(!cycle)return;
    const position=((viewport.scrollLeft%cycle)+cycle)%cycle;
    current=originals.reduce((best,card,i)=>Math.abs(card.offsetLeft-position)<Math.abs(originals[best].offsetLeft-position)?i:best,0);
    counter.textContent=(current+1)+' / '+count;
    updateHeight();
  }
  function canPlay(){
    return !paused&&!reduced()&&!hovered&&visible&&!document.hidden&&!dialog.open&&!viewport.contains(document.activeElement)&&!drag;
  }
  function schedule(){
    clearTimeout(timer);
    if(canPlay())timer=setTimeout(()=>move(1,false),6500);
  }
  function sync(){
    const stopped=paused||reduced();
    play.setAttribute('aria-pressed',String(!stopped));
    play.textContent=reduced()?'자동 넘김 꺼짐':stopped?'자동 넘김 재생':'자동 넘김 멈춤';
    play.disabled=reduced();
    schedule();
  }
  function stop(){paused=true;sync();}
  function move(direction,manual=true){
    if(!cycle)return;
    if(manual)stop();
    updateCurrent();
    let destination=current+direction;
    if(direction<0&&current===0){
      viewport.scrollTo({left:cycle,behavior:'instant'});
      destination=count-1;
    }
    viewport.scrollTo({left:cards[destination].offsetLeft,behavior:reduced()?'instant':'smooth'});
    schedule();
  }
  viewport.addEventListener('scroll',()=>{
    clearTimeout(timer);clearTimeout(settleTimer);updateCurrent();
    settleTimer=setTimeout(()=>{
      if(cycle&&viewport.scrollLeft>=cycle-.5){
        viewport.scrollTo({left:Math.max(0,viewport.scrollLeft-cycle),behavior:'instant'});
      }
      updateCurrent();schedule();
    },160);
  },{passive:true});
  section.querySelector('[data-profile-prev]').addEventListener('click',()=>move(-1));
  section.querySelector('[data-profile-next]').addEventListener('click',()=>move(1));
  play.addEventListener('click',()=>{paused=!paused;sync();});
  viewport.addEventListener('mouseenter',()=>{hovered=true;schedule();});
  viewport.addEventListener('mouseleave',()=>{hovered=false;schedule();});
  viewport.addEventListener('focusin',schedule);
  viewport.addEventListener('focusout',()=>setTimeout(schedule,0));
  viewport.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();move(event.key==='ArrowRight'?1:-1);
    }
  });
  viewport.addEventListener('wheel',event=>{if(Math.abs(event.deltaX)>1)stop();},{passive:true});
  viewport.addEventListener('pointerdown',event=>{
    stop();
    if(event.pointerType==='mouse'&&event.button===0)drag={x:event.clientX,left:viewport.scrollLeft,moved:false,id:event.pointerId};
  });
  viewport.addEventListener('pointermove',event=>{
    if(!drag)return;
    const dx=event.clientX-drag.x;
    if(!drag.moved&&Math.abs(dx)>6){
      drag.moved=true;viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');
    }
    if(drag.moved){event.preventDefault();viewport.scrollLeft=drag.left-dx;}
  });
  function endDrag(){
    if(drag?.moved)ignoreClickUntil=performance.now()+350;
    if(drag&&viewport.hasPointerCapture(drag.id))viewport.releasePointerCapture(drag.id);
    drag=null;viewport.classList.remove('is-dragging');schedule();
  }
  window.addEventListener('pointerup',endDrag);
  viewport.addEventListener('pointercancel',endDrag);
  track.addEventListener('click',event=>{
    const button=event.target.closest('[data-profile-photo]');
    if(!button||performance.now()<ignoreClickUntil)return;
    stop();
    const source=originals[Number(button.dataset.profilePhoto)];
    const photo=source.querySelector('img'),large=dialog.querySelector('img');
    large.src=photo.currentSrc||photo.src;large.alt=photo.alt;
    dialog.querySelector('.profile-viewer-title').textContent=source.querySelector('figcaption strong').textContent;
    dialog.querySelector('.profile-viewer-caption').textContent=source.querySelector('figcaption>span').textContent;
    returnFocus=button;dialog.showModal();document.body.classList.add('locked');
  });
  dialog.querySelector('[data-profile-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('locked');returnFocus?.focus({preventScroll:true});schedule();
  });
  new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;schedule();
  },{threshold:.15}).observe(viewport);
  new ResizeObserver(measure).observe(track);
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',()=>{
    measure();viewport.scrollTo({left:originals[current].offsetLeft,behavior:'instant'});
  });
  document.addEventListener('visibilitychange',schedule);
  reduce.addEventListener('change',sync);
  mobile.addEventListener('change',measure);
  originals.forEach(card=>card.querySelector('img').addEventListener('load',measure));
  document.fonts.ready.then(measure);
  measure();sync();
})();
