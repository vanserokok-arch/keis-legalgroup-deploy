
(function(){
  const $=(s,r=document)=>r.querySelector(s); const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  $('[data-burger]')?.addEventListener('click',()=>$('.nav')?.classList.toggle('is-open'));
  $$('[data-submenu]').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault(); btn.parentElement.classList.toggle('is-open')}));
  document.addEventListener('click',e=>{ if(!e.target.closest('.has-menu')) $$('.has-menu.is-open').forEach(x=>x.classList.remove('is-open')); });
  $$('.cases-archive').forEach(root=>{
    const tabs=$$('[data-case-tab]',root), panels=$$('[data-case-panel]',root);
    tabs.forEach(tab=>tab.addEventListener('click',()=>{ const id=tab.dataset.caseTab; tabs.forEach(t=>t.classList.toggle('is-active',t===tab)); panels.forEach(p=>p.classList.toggle('is-active',p.dataset.casePanel===id)); }));
  });
  $$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{ const el=$(a.getAttribute('href')); if(el){e.preventDefault(); el.scrollIntoView({behavior:'smooth',block:'start'});} }));
  const obs=('IntersectionObserver' in window) ? new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('is-visible');obs.unobserve(en.target)}}),{threshold:.12}) : null;
  $$('.case-section,.case-hero').forEach(el=>obs?obs.observe(el):el.classList.add('is-visible'));
  $$('[data-lead-form]').forEach(form=>form.addEventListener('submit',e=>{ e.preventDefault(); const btn=form.querySelector('button[type="submit"]'); const old=btn.textContent; btn.textContent='Заявка подготовлена'; form.classList.add('is-sent'); setTimeout(()=>{btn.textContent=old; form.classList.remove('is-sent')},2200); }));
})();
