/* Material-led page motion. Progressive enhancement; no scroll interception. */
(() => {
  if (!document.body.classList.contains('interior')) return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let manualReduced=false;
  try{manualReduced=localStorage.getItem('ganghwa-page-motion')==='reduced';}catch{}
  const isReduced=()=>reduce.matches||manualReduced;
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const $=(s,root=document)=>root.querySelector(s);
  const $$=(s,root=document)=>[...root.querySelectorAll(s)];
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
  const on=(el,event,fn,options)=>el?.addEventListener(event,fn,options);
  const motionAnimations=new Set();
  function animate(el,frames,options){
    if(isReduced()||!el?.animate)return null;
    const a=el.animate(frames,{duration:700,easing:'cubic-bezier(.2,.7,.15,1)',...options});
    motionAnimations.add(a);a.finished.catch(()=>{}).finally(()=>motionAnimations.delete(a));return a;
  }
  function threadReveal(el){
    el.dataset.revealed='true';
    if(isReduced())return;
    const previous=el.querySelector('.thread-veil');
    if(previous){previous.querySelectorAll('i').forEach(s=>s.getAnimations().forEach(a=>a.cancel()));previous.remove();}
    const veil=make('span','thread-veil');veil.setAttribute('aria-hidden','true');
    for(let i=0;i<9;i++){
      const strip=make('i');veil.append(strip);
      strip.style.transformOrigin=i%2?'left center':'right center';
      animate(strip,[{transform:'scaleX(1)'},{transform:'scaleX(0)'}],{duration:1050,delay:i*42,fill:'both'});
    }
    el.append(veil);
    const last=veil.lastElementChild?.getAnimations()[0];
    if(last)last.finished.catch(()=>{}).finally(()=>veil.remove());else veil.remove();
  }
  // A veil changes with the image instead of translating the entire layout.
  window.GanghwaMotion={imageChanged:el=>threadReveal(el)};
  document.body.classList.add('craft-motion');

  const imageSelectors='.story-opening-grid>figure,.process-row>figure,.collection-opening>figure,.archive-feature>a,.facility-panorama,.visit-page-layout>figure,.detail-image-stage';
  $$(imageSelectors).forEach(el=>{
    el.classList.add('thread-image');
    if(el.matches('figure')&&$('figcaption',el)){
      const image=$('img',el),wrap=make('div','thread-image image-window');
      image.before(wrap);wrap.append(image);el.classList.remove('thread-image');
    }
  });
  const revealTargets=$$('.thread-image,.editorial-split>h2,.section-heading>h2,.history-heading>h2,.detail-page-copy,.object-card,.timeline li,.inquiry-grid article');
  const seen=new WeakSet();
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(({target,isIntersecting})=>{
      if(!isIntersecting||seen.has(target))return;seen.add(target);revealObserver.unobserve(target);
      if(target.classList.contains('thread-image'))threadReveal(target);
      else animate(target,[{opacity:.18,transform:'translateY(22px)'},{opacity:1,transform:'translateY(0)'}],{duration:850});
    });
  },{threshold:.12});
  revealTargets.forEach(el=>revealObserver.observe(el));
  const h1=$('main h1');
  animate(h1,[{opacity:.15,clipPath:'inset(0 0 100% 0)',transform:'translateY(25px)'},{opacity:1,clipPath:'inset(0)',transform:'translateY(0)'}],{duration:1000});

  // One frame per scroll event. Off-screen elements do not receive transforms.
  const progress=make('div','reading-thread');progress.setAttribute('aria-hidden','true');document.body.append(progress);
  const driftTargets=$$('.story-year,.collection-script,.archive-feature-title,.experience-title .display-note');
  const archiveFeature=$('.archive-feature>a');
  if(archiveFeature)driftTargets.push(archiveFeature);
  const trackedSections=[];
  let scrollQueued=false;
  function measureScroll(){
    scrollQueued=false;
    const total=document.documentElement.scrollHeight-innerHeight;
    progress.style.setProperty('--read',total>0?clamp(scrollY/total):0);
    driftTargets.forEach(el=>{
      const parent=el.closest('section'),r=parent.getBoundingClientRect();
      if(isReduced()){el.style.removeProperty('translate');return;}
      if(r.bottom<0||r.top>innerHeight)return;
      const p=clamp((innerHeight-r.top)/(innerHeight+r.height))-.5;
      const depth=el===archiveFeature?34:65;
      el.style.translate='0 '+(p*depth).toFixed(2)+'px';
    });
    trackedSections.forEach(({items,links})=>{
      let active=0;
      items.forEach((item,i)=>{if(item.getBoundingClientRect().top<innerHeight*.46)active=i;});
      items.forEach((item,i)=>{
        const r=item.getBoundingClientRect();
        const p=clamp((innerHeight*.7-r.top)/Math.max(1,r.height));
        item.style.setProperty('--step-progress',p.toFixed(3));
        item.classList.toggle('step-current',i===active);
        if(links?.[i]){
          if(i===active)links[i].setAttribute('aria-current','step');else links[i].removeAttribute('aria-current');
        }
      });
    });
  }
  const queueScroll=()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(measureScroll);}};
  on(window,'scroll',queueScroll,{passive:true});on(window,'resize',queueScroll,{passive:true});

  // Brand: a quiet chapter rail follows the three material-making stages.
  const process=$('.process-section');
  if(process){
    const rows=$$('.process-row',process),rail=make('nav','process-rail');rail.setAttribute('aria-label','제작 과정 탐색');
    ['왕골 재배','재료 가공','손으로 짜기'].forEach((label,i)=>{
      const a=make('a');a.href='#making-'+(i+1);rows[i].id='making-'+(i+1);
      a.append(make('span','',String(i+1).padStart(2,'0')),make('span','',label));rail.append(a);
    });
    $('.section-heading',process).after(rail);
    trackedSections.push({items:rows,links:[...rail.children]});
  }
  const timeline=$$('.timeline li');
  if(timeline.length)trackedSections.push({items:timeline});
  const journey=$$('.journey-list li');
  if(journey.length)trackedSections.push({items:journey});
  const anchorNav=$('.page-anchor-nav');
  if(anchorNav)trackedSections.push({items:$$('a',anchorNav).map(a=>$(a.getAttribute('href'))),links:$$('a',anchorNav)});

  // Catalogues: alternate close-ups on focus/hover, keeping one actual link per work.
  $$('.object-card[data-texture]').forEach(card=>{
    const close=make('img','object-texture');close.src=card.dataset.texture;close.alt='';close.loading='lazy';
    $('.object-image',card).append(close);
    const label=make('span','texture-caption','문양 가까이 보기');label.setAttribute('aria-hidden','true');$('.object-image',card).append(label);
  });

  // Real photograph explorer, available to mouse, touch and keyboard alike.
  let viewer,viewImage,viewStage,zoomRange,zoomOut,zoomIn,zoomLabel,zoomTitle,returnFocus;
  let zoom=1,panX=0,panY=0,drag=null;
  function renderZoom(){
    if(!viewStage)return;
    const r=viewStage.getBoundingClientRect();
    const ratio=viewImage.naturalWidth/Math.max(1,viewImage.naturalHeight);
    const baseWidth=Math.min(r.width,r.height*(ratio||1));
    const baseHeight=baseWidth/(ratio||1);
    const maxX=Math.max(0,(baseWidth*zoom-r.width)/2),maxY=Math.max(0,(baseHeight*zoom-r.height)/2);
    panX=clamp(panX,-maxX,maxX);panY=clamp(panY,-maxY,maxY);
    viewImage.style.transform=`translate(${panX}px,${panY}px) scale(${zoom})`;
    viewStage.classList.toggle('is-zoomed',zoom>1);
    zoomRange.value=Math.round(zoom*100);zoomLabel.textContent=Math.round(zoom*100)+'%';
    zoomRange.setAttribute('aria-valuetext',zoomLabel.textContent);
    zoomOut.disabled=zoom<=1;zoomIn.disabled=zoom>=3;
  }
  function setZoom(v){zoom=clamp(v,1,3);renderZoom();}
  function createViewer(){
    viewer=make('dialog','texture-viewer');viewer.setAttribute('aria-labelledby','texture-viewer-title');
    const toolbar=make('div','texture-toolbar');zoomTitle=make('span','','사진 자세히 보기');zoomTitle.id='texture-viewer-title';
    const close=make('button','','닫기 ×');close.setAttribute('aria-label','사진 확대 닫기');on(close,'click',()=>viewer.close());toolbar.append(zoomTitle,close);
    viewStage=make('div','texture-viewport');viewStage.tabIndex=0;viewStage.setAttribute('role','region');viewStage.setAttribute('aria-label','확대한 사진. 방향키 또는 드래그로 이동');
    viewImage=make('img');viewImage.draggable=false;on(viewImage,'load',renderZoom);viewStage.append(viewImage);
    const controls=make('div','texture-controls');
    zoomOut=make('button','','−');zoomOut.setAttribute('aria-label','사진 축소');on(zoomOut,'click',()=>setZoom(zoom-.25));
    zoomIn=make('button','','＋');zoomIn.setAttribute('aria-label','사진 확대');on(zoomIn,'click',()=>setZoom(zoom+.25));
    zoomRange=make('input');zoomRange.type='range';zoomRange.min=100;zoomRange.max=300;zoomRange.step=5;zoomRange.value=100;zoomRange.setAttribute('aria-label','사진 확대 비율');
    on(zoomRange,'input',()=>setZoom(Number(zoomRange.value)/100));
    zoomLabel=make('output','','100%');zoomLabel.setAttribute('aria-live','off');
    const reset=make('button','texture-reset','원래 크기');on(reset,'click',()=>{panX=panY=0;setZoom(1);});
    controls.append(zoomOut,zoomRange,zoomIn,zoomLabel,reset);
    viewer.append(toolbar,viewStage,controls,make('p','texture-instruction','확대한 사진은 드래그하거나 방향키로 이동할 수 있습니다.'));
    document.body.append(viewer);
    on(viewer,'close',()=>{document.body.classList.remove('locked');returnFocus?.focus();});
    on(viewStage,'pointerdown',ev=>{if(zoom<=1||ev.button!==0)return;drag={x:ev.clientX,y:ev.clientY,px:panX,py:panY};viewStage.setPointerCapture(ev.pointerId);viewStage.classList.add('is-dragging');});
    on(viewStage,'pointermove',ev=>{if(!drag)return;panX=drag.px+ev.clientX-drag.x;panY=drag.py+ev.clientY-drag.y;renderZoom();});
    const endDrag=()=>{drag=null;viewStage.classList.remove('is-dragging');};
    on(viewStage,'pointerup',endDrag);on(viewStage,'pointercancel',endDrag);on(viewStage,'lostpointercapture',endDrag);
    on(viewStage,'keydown',ev=>{
      if(ev.key==='+'||ev.key==='='){ev.preventDefault();setZoom(zoom+.25);}
      else if(ev.key==='-'){ev.preventDefault();setZoom(zoom-.25);}
      else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)&&zoom>1){ev.preventDefault();if(ev.key==='ArrowLeft')panX+=40;if(ev.key==='ArrowRight')panX-=40;if(ev.key==='ArrowUp')panY+=40;if(ev.key==='ArrowDown')panY-=40;renderZoom();}
      else if(ev.key==='0'){ev.preventDefault();panX=panY=0;setZoom(1);}
    });
    on(window,'resize',()=>{if(viewer.open)renderZoom();});
  }
  function openViewer(image,trigger){
    if(!viewer)createViewer();returnFocus=trigger;
    viewImage.src=image.currentSrc||image.src;viewImage.alt=image.alt;zoomTitle.textContent=image.alt;
    viewer.showModal();document.body.classList.add('locked');zoom=1;panX=panY=0;renderZoom();
    animate(viewStage,[{opacity:.3},{opacity:1}],{duration:350});
  }
  const photoStage=$('.detail-image-stage')||$('body[data-page="works"] .collection-opening .image-window');
  if(photoStage){
    const b=make('button','texture-open','사진 확대');b.setAttribute('aria-haspopup','dialog');b.append(make('span','','＋'));photoStage.append(b);
    on(b,'click',()=>openViewer($('img',photoStage),b));
    if(fine.matches){
      photoStage.classList.add('has-photo-explorer');
      on(photoStage,'pointermove',ev=>{if(isReduced())return;const r=photoStage.getBoundingClientRect();photoStage.style.setProperty('--look-x',((ev.clientX-r.left)/r.width-.5)*5+'px');photoStage.style.setProperty('--look-y',((ev.clientY-r.top)/r.height-.5)*5+'px');});
      on(photoStage,'pointerleave',()=>{photoStage.style.setProperty('--look-x','0px');photoStage.style.setProperty('--look-y','0px');});
    }
  }

  // Jari: selectable photographs explain the two confirmed fabric placements.
  const compare=$('.jari-comparison');
  if(compare){
    const photo=$('.comparison-photo',compare),buttons=$$('[data-jari]',compare);
    const update=b=>{
      if(b.getAttribute('aria-pressed')==='true')return;
      $('img',photo).src=b.dataset.image;$('img',photo).alt=b.dataset.name;
      $('.comparison-name',compare).textContent=b.dataset.name;
      $('.comparison-description',compare).textContent=b.dataset.description;
      $('.comparison-link',compare).href=b.dataset.href;
      buttons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));threadReveal(photo);
    };
    buttons.forEach((b,i)=>{on(b,'click',()=>update(b));on(b,'keydown',ev=>{if(!['ArrowLeft','ArrowRight'].includes(ev.key))return;ev.preventDefault();const next=buttons[(i+1)%buttons.length];update(next);next.focus();});});
  }

  // DIY: the opening becomes a small, tactile sample index for the three kits.
  const sampleButtons=$$('[data-kit-sample]');
  if(sampleButtons.length){
    const photo=$('.collection-opening .image-window'),caption=$('.kit-sample-caption');
    sampleButtons.forEach(b=>on(b,'click',()=>{
      if(b.getAttribute('aria-pressed')==='true')return;
      $('img',photo).src=b.dataset.image;$('img',photo).alt=b.dataset.name;
      caption.textContent=b.dataset.name;$('.kit-sample-link').href=b.dataset.href;
      sampleButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));threadReveal(photo);
    }));
  }

  // Archive: deliberate browsing by period, then a real project page.
  const archiveRows=$$('.archive-row');
  const filters=$$('[data-period]');
  if(filters.length){
    filters.forEach(button=>on(button,'click',()=>{
      filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      let count=0;
      archiveRows.forEach(row=>{
        const y=Number(row.dataset.year),range=button.dataset.period;
        const show=range==='all'||(range==='2026'&&y===2026)||(range==='2020'&&y>=2020&&y<=2023)||(range==='2018'&&y>=2018&&y<=2019);
        row.hidden=!show;
        if(show){count++;animate(row,[{opacity:.3,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:400,delay:Math.min(count*35,180)});}
      });
      $('.archive-result-count').textContent=String(count).padStart(2,'0')+'개의 기록';queueScroll();
    }));
  }

  // Space photography can be browsed with arrows or a horizontal touch swipe.
  const space=$('#space-photo'),spaceTabs=$$('[data-space]');
  if(space){
    const controls=make('div','space-arrows');controls.setAttribute('role','group');controls.setAttribute('aria-label','체험관 공간 사진 이동');
    const previous=make('button','','←'),next=make('button','','→');previous.setAttribute('aria-label','이전 공간');next.setAttribute('aria-label','다음 공간');controls.append(previous,next);space.append(controls);
    const move=n=>{const i=spaceTabs.findIndex(b=>b.getAttribute('aria-pressed')==='true');spaceTabs[(i+n+spaceTabs.length)%spaceTabs.length].click();};
    on(previous,'click',()=>move(-1));on(next,'click',()=>move(1));
    let start=null;
    on(space,'pointerdown',ev=>{if(ev.pointerType==='mouse'||ev.target.closest('button'))return;start={x:ev.clientX,y:ev.clientY};});
    on(space,'pointerup',ev=>{if(!start)return;const dx=ev.clientX-start.x,dy=ev.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)move(dx<0?1:-1);});
    on(space,'pointercancel',()=>{start=null;});
  }
  // FAQ retains native details behavior and reduced-motion support.
  $$('.faq details').forEach(details=>on(details,'toggle',()=>{
    if(details.open)animate($('p',details),[{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'translateY(0)'}],{duration:350});
  }));

  const copy=$('[data-copy-address]');
  if(copy)on(copy,'click',async()=>{
    const status=$('.address-status');
    try{await navigator.clipboard.writeText(copy.dataset.copyAddress);status.textContent='주소를 복사했습니다.';}
    catch{status.textContent=copy.dataset.copyAddress+' — 주소를 선택해 복사해주세요.';}
  });
  const motionToggle=make('button','motion-toggle','움직임 줄이기');
  $('.footer-links')?.after(motionToggle);
  function syncPreference(){
    document.body.classList.toggle('motion-reduced',isReduced());
    motionToggle.setAttribute('aria-pressed',String(isReduced()));
    motionToggle.disabled=reduce.matches;
    motionToggle.textContent=reduce.matches?'기기 설정에 따라 움직임 줄임':manualReduced?'움직임 줄이기 · 켜짐':'움직임 줄이기';
    if(isReduced()){motionAnimations.forEach(a=>a.cancel());$$('.thread-veil').forEach(x=>x.remove());}
    queueScroll();
  }
  on(motionToggle,'click',()=>{manualReduced=!manualReduced;try{localStorage.setItem('ganghwa-page-motion',manualReduced?'reduced':'full');}catch{}syncPreference();});
  on(reduce,'change',syncPreference);syncPreference();
  document.fonts.ready.then(queueScroll);queueScroll();
})();
