(() => {
  const menu = document.querySelector('#site-menu');
  let trigger;
  function closeMenu() { menu?.close(); }
  function openMenu(e) {
    trigger=e.currentTarget;
    if (!menu.open) { menu.showModal(); document.body.classList.add('locked'); }
  }
  document.querySelectorAll('#menu-open,#footer-menu').forEach(b=>b.addEventListener('click',openMenu));
  document.querySelector('[data-menu-close]')?.addEventListener('click',closeMenu);
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  menu?.addEventListener('close',()=>{document.body.classList.remove('locked');trigger?.focus();});

  const stage=document.querySelector('.detail-image-stage>img');
  document.querySelectorAll('[data-detail-photo]').forEach(b=>b.addEventListener('click',()=>{
    if(b.getAttribute('aria-pressed')==='true')return;
    stage.src=b.dataset.detailPhoto;stage.alt=b.dataset.alt;
    document.querySelectorAll('[data-detail-photo]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    window.GanghwaMotion?.imageChanged(stage.parentElement);
  }));

  const spacePhoto=document.querySelector('#space-photo');
  const spaceButtons=[...document.querySelectorAll('[data-space]')];
  const lightbox=document.querySelector('#image-lightbox');
  let spaceIndex=0;
  function setSpace(i){
    if(i===spaceIndex)return;
    spaceIndex=i; const b=spaceButtons[i];
    spacePhoto.className='space-photo '+b.dataset.space;
    spacePhoto.querySelector('img').src=b.dataset.image;
    spacePhoto.querySelector('img').alt=b.dataset.title;
    document.querySelector('#space-title').textContent=b.dataset.title;
    document.querySelector('#space-description').textContent=b.dataset.description;
    document.querySelector('#space-count').textContent=String(i+1).padStart(2,'0')+' / 04';
    spaceButtons.forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    window.GanghwaMotion?.imageChanged(spacePhoto);
  }
  spaceButtons.forEach((b,i)=>{
    b.addEventListener('click',()=>setSpace(i));
    b.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const n=e.key==='Home'?0:e.key==='End'?spaceButtons.length-1:(i+(e.key==='ArrowRight'?1:-1)+spaceButtons.length)%spaceButtons.length;
      setSpace(n);spaceButtons[n].focus();
    });
  });
  document.querySelector('#space-enlarge')?.addEventListener('click',()=>{
    const b=spaceButtons[spaceIndex];
    document.querySelector('#lightbox-image').src=b.dataset.image;
    document.querySelector('#lightbox-image').alt=b.dataset.title+' 전체 사진';
    document.querySelector('#lightbox-title').textContent=b.dataset.title;
    lightbox.showModal();document.body.classList.add('locked');
  });
  document.querySelector('[data-lightbox-close]')?.addEventListener('click',()=>lightbox.close());
  lightbox?.addEventListener('close',()=>{document.body.classList.remove('locked');document.querySelector('#space-enlarge').focus();});
})();
