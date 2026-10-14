const header=document.getElementById('header'),drawer=document.getElementById('drawer');
addEventListener('scroll',()=>header.classList.toggle('is-compact',scrollY>52),{passive:true});
document.getElementById('menu').onclick=()=>drawer.classList.toggle('visible');
drawer.querySelectorAll('button').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.target).scrollIntoView({behavior:'smooth'});drawer.classList.remove('visible')});
document.querySelectorAll('.carousel').forEach(carousel=>{
  const rail=carousel.querySelector('.carousel-rail');
  if(!rail||!window.CheshuyaCarousel)return;
  const controller=window.CheshuyaCarousel.createCardCarousel(rail);
  carousel.querySelectorAll('.carousel-actions button').forEach((button,index)=>button.onclick=()=>controller.move(index?1:-1));
});
const ru={"Уличное рисование":"Street drawing","Снаружи":"Outside","Внутри":"Inside","Выставки":"Exhibitions","Объекты":"Objects","Графика":"Graphics","Зины":"Zines","Цианотипия":"Cyanotype","Футболки":"T-shirts","Смотреть раздел":"View section","Раздел готовится":"Section coming soon"};let english=false;document.getElementById('locale').onclick=()=>{english=!english;document.getElementById('locale').innerHTML=english?'RU<span>/</span><b>EN</b>':'<b>RU</b><span>/</span>EN';document.querySelectorAll('h1,h2,.section-tag span:last-child,.pending,.shirt-card span,.drawer button,.section-intro a').forEach(el=>{if(english&&ru[el.textContent.trim()])el.dataset.ru=el.textContent,el.textContent=ru[el.textContent.trim()];else if(!english&&el.dataset.ru)el.textContent=el.dataset.ru})};
