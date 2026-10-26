/* =========================================================
   SAMOG.e 2027 · animações (GSAP + ScrollTrigger + ScrollSmoother
   + SplitText + DrawSVG + CustomEase)
   ========================================================= */
(function () {
  // ?motion=1 força as animações (útil para testar com "reduzir movimento" ligado no sistema)
  const FORCE_MOTION = /[?&]motion=1/.test(location.search);
  const REDUCE = !FORCE_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (FORCE_MOTION) document.documentElement.classList.add('force-motion');
  const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const EVENT_DATE = new Date('2027-03-03T14:00:00-03:00');

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin, CustomEase);
  CustomEase.create('samog', 'M0,0 C0.16,1 0.3,1 1,1');
  gsap.defaults({ ease: 'expo.out', duration: 1 });

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // elementos fixos não podem ficar dentro do conteúdo transformado do smoother
  const floatImg = $('.audience__float');
  if (floatImg) document.body.appendChild(floatImg);

  let smoother = null;
  if (!REDUCE) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.15,
      smoothTouch: 0.1,
      effects: true,
      normalizeScroll: false
    });
  }

  /* ---------------- Contagem regressiva ---------------- */
  function tick() {
    const diff = Math.max(0, EVENT_DATE - Date.now());
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff % 864e5) / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    $('[data-cd="d"]').textContent = String(d).padStart(3, '0');
    $('[data-cd="h"]').textContent = String(h).padStart(2, '0');
    $('[data-cd="m"]').textContent = String(m).padStart(2, '0');
    $('[data-cd="s"]').textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);

  /* ---------------- Navegação por âncoras ---------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (smoother) smoother.scrollTo(target, true, 'top top');
      else target.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth' });
    });
  });
  $$('[data-open-lead]').forEach((b) => b.addEventListener('click', () => {
    setTimeout(() => $('#l-empresa') && $('#l-empresa').focus({ preventScroll: true }), 1200);
  }));

  /* ---------------- Menu mobile ---------------- */
  const burger = $('[data-burger]');
  const menu = $('[data-menu]');
  let menuOpen = false;
  function openMenu() {
    menuOpen = true;
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    gsap.set(menu, { visibility: 'visible' });
    gsap.to(menu, { clipPath: 'circle(150% at calc(100% - 40px) 40px)', duration: 0.9, ease: 'expo.inOut' });
    gsap.fromTo($$('.menu__list a', menu), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: 0.05, delay: 0.3, duration: 0.8 });
    if (smoother) smoother.paused(true);
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 40px) 40px)', duration: 0.7, ease: 'expo.inOut', onComplete: () => gsap.set(menu, { visibility: 'hidden' }) });
    if (smoother) smoother.paused(false);
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));

  /* ---------------- Cursor + botões magnéticos ---------------- */
  if (FINE && !REDUCE) {
    const cursor = $('.cursor');
    const label = $('.cursor__label');
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });
    window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); gsap.to(cursor, { opacity: 1, duration: 0.3, overwrite: 'auto' }); }, { passive: true });
    document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0, duration: 0.3 }));

    $$('a, button, label.choice, label.pill').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        const txt = el.dataset.cursor;
        if (txt) {
          label.textContent = txt;
          cursor.classList.add('has-label');
          gsap.to(cursor, { width: 96, height: 96, margin: -48, duration: 0.5 });
          gsap.to(label, { opacity: 1, duration: 0.3, delay: 0.1 });
        } else {
          gsap.to(cursor, { scale: 2.6, duration: 0.5 });
        }
      });
      el.addEventListener('pointerleave', () => {
        cursor.classList.remove('has-label');
        gsap.to(label, { opacity: 0, duration: 0.15 });
        gsap.to(cursor, { width: 14, height: 14, margin: -7, scale: 1, duration: 0.5 });
      });
    });

    $$('[data-magnetic]').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.28);
        my((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }

  /* ---------------- Nav: sólida, some ao descer, volta ao subir ---------------- */
  const nav = $('[data-nav]');
  ScrollTrigger.create({
    start: 'top top-=80',
    end: 'max',
    onUpdate(self) {
      nav.classList.toggle('is-solid', self.scroll() > window.innerHeight * 0.6);
      if (!menuOpen) nav.classList.toggle('is-hidden', self.direction === 1 && self.scroll() > window.innerHeight);
    }
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // link ativo
  $$('.nav__links a').forEach((a) => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: (s) => a.classList.toggle('is-current', s.isActive) });
  });

  /* =========================================================
     LOADER + ENTRADA DO HERO
     ========================================================= */
  const heroSplit = new SplitText('[data-hero-word]', { type: 'chars', charsClass: 'char' });

  function intro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(heroSplit.chars, { yPercent: 120, rotate: 8, duration: 1.4, stagger: 0.05 })
      .from('[data-hero-fade]', { y: 40, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, '-=1.1');
    return tl;
  }

  function runLoader() {
    const loader = $('.loader');
    const num = $('.loader__num');
    const counter = { v: 0 };
    let assetsReady = false;
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise((res) => { const img = new Image(); img.onload = img.onerror = res; img.src = 'assets/img/03-feira-aerea.webp'; })
    ]).then(() => { assetsReady = true; });

    const tl = gsap.timeline();
    tl.to(counter, {
      v: 100, duration: 2, ease: 'power2.inOut',
      onUpdate: () => {
        num.textContent = Math.round(counter.v);
        gsap.set('.loader__fill', { clipPath: `inset(${100 - counter.v}% 0 0 0)` });
      }
    })
      .add(() => { if (!assetsReady) { tl.pause(); const w = setInterval(() => { if (assetsReady) { clearInterval(w); tl.resume(); } }, 60); } })
      .to('.loader__count, .loader__line', { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
      .to('.loader__drop', { scale: 14, autoAlpha: 0, duration: 1.1, ease: 'expo.in' }, '<0.1')
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, '-=0.35')
      .add(() => {
        loader.remove();
        document.body.classList.remove('is-loading');
        ScrollTrigger.refresh();
      })
      .add(intro(), '-=0.75');
  }

  if (REDUCE) {
    $('.loader').remove();
    document.body.classList.remove('is-loading');
  } else {
    runLoader();
  }

  if (REDUCE) return; // daqui pra baixo é tudo animação de scroll

  /* ---------------- Hero: o título se afasta ao rolar ---------------- */
  gsap.to('.hero__title', {
    yPercent: -40, scale: 0.92, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__countdown, .hero__ctas, .hero__row', {
    y: -80, autoAlpha: 0, ease: 'none', stagger: 0.05,
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true }
  });

  /* ---------------- Reveal: a gota abre para a feira ---------------- */
  const photo = $('.reveal__photo');
  const vmin = () => Math.min(innerWidth, innerHeight);
  const vmax = () => Math.max(innerWidth, innerHeight);
  gsap.set(photo, { '--m': vmin() * 0.16 + 'px' });
  photo.style.webkitMaskSize = 'var(--m)';
  photo.style.maskSize = 'var(--m)';

  const captionSplit = $$('.reveal__big span').map((s) => {
    s.innerHTML = `<i style="display:block;font-style:normal">${s.textContent}</i>`;
    return s.firstChild;
  });

  const revealTl = gsap.timeline({
    scrollTrigger: { trigger: '.reveal', start: 'top top', end: '+=180%', scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true }
  });
  revealTl
    .fromTo('.reveal__logo', { scale: 1, autoAlpha: 1 }, { scale: 2.2, autoAlpha: 0, ease: 'power2.in', duration: 0.28 }, 0)
    .fromTo(photo, { '--m': () => vmin() * 0.16 + 'px' }, { '--m': () => vmax() * 6 + 'px', ease: 'power3.in', duration: 1 }, 0)
    .fromTo('.reveal__photo img', { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
    .from(captionSplit, { yPercent: 110, stagger: 0.08, duration: 0.35, ease: 'power3.out' }, 0.72)
    .from('.reveal__small', { autoAlpha: 0, duration: 0.25 }, 0.85)
    .to({}, { duration: 0.25 });

  /* ---------------- Faixas de logos dos parceiros ---------------- */
  function loop(track, speed, reverse) {
    // duplica o conteúdo para o loop ficar contínuo
    track.innerHTML += track.innerHTML;
    $$('img', track).forEach((img) => img.removeAttribute('loading'));
    return gsap.fromTo(track, { xPercent: reverse ? -50 : 0 }, { xPercent: reverse ? 0 : -50, duration: speed, ease: 'none', repeat: -1 });
  }
  const logoLoops = $$('.logo-marquee__track').map((t, i) => loop(t, 38, i === 1));
  $$('[data-logo-marquee]').forEach((m, i) => {
    m.addEventListener('pointerenter', () => gsap.to(logoLoops[i], { timeScale: 0.15, duration: 0.6 }));
    m.addEventListener('pointerleave', () => gsap.to(logoLoops[i], { timeScale: 1, duration: 0.6 }));
  });

  /* ---------------- Títulos: linhas sobem de dentro de uma máscara ---------------- */
  // Só divide depois da fonte carregar (senão as linhas são medidas com a fonte
  // reserva, mais estreita, e a palavra final é cortada). autoSplit refaz ao redimensionar.
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => {
    $$('.h-display').forEach((h) => {
      SplitText.create(h, {
        type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            yPercent: 115, duration: 1.3, stagger: 0.1,
            scrollTrigger: { trigger: h, start: 'top 85%' }
          });
        }
      });
    });
    ScrollTrigger.refresh();
  });
  $$('.eyebrow').forEach((e) => {
    gsap.from(e, { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'expo.inOut', scrollTrigger: { trigger: e, start: 'top 90%' } });
  });

  /* ---------------- Manifesto: palavras acendem com o scroll ---------------- */
  const manifesto = new SplitText('[data-scrub-words]', { type: 'words', wordsClass: 'word' });
  gsap.to(manifesto.words, {
    color: 'oklch(0.975 0.006 255)', stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '[data-scrub-words]', start: 'top 80%', end: 'bottom 45%', scrub: true }
  });
  // palavras-chave ganham cor
  manifesto.words.forEach((w) => {
    if (/^(negócios|parcerias|onshore|fornecedores)/i.test(w.textContent)) w.dataset.key = '1';
  });
  gsap.to(manifesto.words.filter((w) => w.dataset.key), {
    color: 'oklch(0.86 0.16 92)', stagger: 0.2, ease: 'none',
    scrollTrigger: { trigger: '[data-scrub-words]', start: 'top 60%', end: 'bottom 40%', scrub: true }
  });

  /* ---------------- Linha do tempo ---------------- */
  const tlLine = $('.timeline__line path');
  if (tlLine) {
    gsap.from(tlLine, { drawSVG: '0%', ease: 'none', scrollTrigger: { trigger: '[data-timeline]', start: 'top 80%', end: 'top 35%', scrub: true } });
  }
  gsap.from('.timeline li', { y: 50, autoAlpha: 0, stagger: 0.15, duration: 1.2, scrollTrigger: { trigger: '[data-timeline]', start: 'top 75%' } });

  /* ---------------- Contadores ---------------- */
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('pt-BR'); }
    });
  });
  gsap.from('.numbers__list li', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.1, scrollTrigger: { trigger: '.numbers__list', start: 'top 80%' } });

  /* ---------------- Parallax dentro das molduras ---------------- */
  $$('[data-parallax-frame]').forEach((f) => {
    const img = $('img', f);
    gsap.fromTo(img, { yPercent: -12 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from(f, { clipPath: 'inset(18% 10% 18% 10%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: f, start: 'top 85%' } });
  });

  /* ---------------- Responsivo: pins só em telas grandes ---------------- */
  const mm = gsap.matchMedia();

  mm.add('(min-width: 761px)', () => {
    // Experiências: rolagem horizontal
    const track = $('.exp__track');
    const pinEl = $('.exp__pin');
    const distance = () => track.scrollWidth + $('.exp__intro').offsetWidth - innerWidth + 40;
    const horiz = gsap.to([track, '.exp__intro'], {
      x: () => -distance(), ease: 'none',
      scrollTrigger: { trigger: '.exp', start: 'top top', end: () => '+=' + distance(), pin: pinEl, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    $$('.panel', track).forEach((p) => {
      gsap.fromTo($('img', p), { scale: 1.35, xPercent: 8 }, {
        scale: 1.05, xPercent: -4, ease: 'none',
        scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true }
      });
      gsap.from($('.panel__body', p).children, {
        y: 30, autoAlpha: 0, stagger: 0.06, duration: 1,
        scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left 80%' }
      });
    });

  });

  mm.add('(max-width: 760px)', () => {
    $$('.panel').forEach((p) => {
      gsap.from(p, { y: 60, autoAlpha: 0, duration: 1.2, scrollTrigger: { trigger: p, start: 'top 85%' } });
    });
  });

  /* ---------------- Programação: abas dos dias ---------------- */
  const tabs = $$('.daytab');
  const pill = $('.daytabs__pill');
  function placePill(btn, instant) {
    const r = btn.getBoundingClientRect();
    const pr = btn.parentElement.getBoundingClientRect();
    gsap.to(pill, { x: r.left - pr.left - 6, width: r.width, duration: instant ? 0 : 0.7, ease: 'expo.out' });
  }
  tabs.forEach((t) => t.addEventListener('click', () => {
    if (t.classList.contains('is-active')) return;
    tabs.forEach((o) => { const on = o === t; o.classList.toggle('is-active', on); o.setAttribute('aria-selected', on); });
    placePill(t);
    $$('.agenda').forEach((a) => {
      const on = a.id === 'dia-' + t.dataset.day;
      a.hidden = !on; a.classList.toggle('is-active', on);
      if (on) gsap.from($$('li', a), { x: 40, autoAlpha: 0, stagger: 0.06, duration: 0.8 });
    });
    ScrollTrigger.refresh();
  }));
  $('.daytabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const other = tabs.find((t) => !t.classList.contains('is-active'));
    other.click(); other.focus();
  });
  document.fonts && document.fonts.ready.then(() => placePill($('.daytab.is-active'), true));
  window.addEventListener('resize', () => placePill($('.daytab.is-active'), true));
  gsap.from('#dia-1 li', { x: 40, autoAlpha: 0, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '#dia-1', start: 'top 80%' } });

  /* ---------------- Galeria: cortinas ---------------- */
  $$('.g').forEach((g, i) => {
    gsap.fromTo(g, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: g, start: 'top 90%' } });
    gsap.fromTo($('img', g), { scale: 1.4 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 90%' } });
  });

  /* ---------------- Público: foto segue o cursor ---------------- */
  if (FINE && floatImg) {
    const img = $('img', floatImg);
    const fx = gsap.quickTo(floatImg, 'x', { duration: 0.7, ease: 'power3' });
    const fy = gsap.quickTo(floatImg, 'y', { duration: 0.7, ease: 'power3' });
    const fr = gsap.quickTo(floatImg, 'rotation', { duration: 0.9, ease: 'power3' });
    let lastX = 0;
    const list = $('[data-hover-list]');
    list.addEventListener('pointermove', (e) => {
      fx(e.clientX + 30); fy(e.clientY - floatImg.offsetHeight / 2);
      fr(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6)); lastX = e.clientX;
    });
    $$('li', list).forEach((li) => {
      li.addEventListener('pointerenter', () => {
        img.src = li.dataset.img;
        gsap.to(floatImg, { autoAlpha: 1, scale: 1, duration: 0.5 });
      });
    });
    list.addEventListener('pointerleave', () => gsap.to(floatImg, { autoAlpha: 0, scale: 0.8, duration: 0.4 }));
    gsap.set(floatImg, { scale: 0.8 });
  }
  gsap.from('.audience__list li', { y: 40, autoAlpha: 0, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.audience__list', start: 'top 80%' } });

  /* ---------------- Como participar ---------------- */
  gsap.from('.steps__path path', { drawSVG: '0%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'top 30%', scrub: true } });
  gsap.from('.step__n', { scale: 0, rotate: -90, stagger: 0.2, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.steps', start: 'top 70%' } });
  gsap.from('.step h3, .step p', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.steps', start: 'top 65%' } });

  /* ---------------- Inscrição ---------------- */
  gsap.from('.signup__card', { y: 120, rotate: 2, autoAlpha: 0, duration: 1.6, scrollTrigger: { trigger: '.signup', start: 'top 75%' } });
  gsap.from('.signup__progress li', { x: -30, autoAlpha: 0, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.signup__progress', start: 'top 85%' } });

  /* ---------------- Patrocínio ---------------- */
  gsap.from('.tier', { x: -40, autoAlpha: 0, stagger: 0.06, duration: 1, scrollTrigger: { trigger: '.tiers', start: 'top 75%' } });
  gsap.from('.tiers__stage', { scale: 0.85, autoAlpha: 0, duration: 1.6, scrollTrigger: { trigger: '.tiers', start: 'top 75%' }, onStart: () => window.SamogSetTier && window.SamogSetTier($('.tier.is-active').dataset.tier) });

  /* ---------------- Local ---------------- */
  gsap.fromTo('.place__img img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.place', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.place__img', { clipPath: 'inset(0 100% 0 0)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.place', start: 'top 70%' } });
  gsap.from('.place__body > *:not(.h-display)', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1, scrollTrigger: { trigger: '.place__body', start: 'top 70%' } });

  /* ---------------- Parceiros e FAQ ---------------- */
  $$('.credits__row').forEach((row) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%' } });
    tl.from($('.credits__label', row), { x: -30, autoAlpha: 0, duration: 1 })
      .from($$('.credits__logos li', row), { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1 }, '<0.1');
  });
  gsap.from('.faq details', { y: 30, autoAlpha: 0, stagger: 0.06, duration: 1, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => setTimeout(() => ScrollTrigger.refresh(), 520)));

  /* ---------------- Footer ---------------- */
  const footSplit = new SplitText('.foot__big', { type: 'chars' });
  gsap.from(footSplit.chars, { yPercent: 100, autoAlpha: 0, stagger: 0.03, duration: 1.2, scrollTrigger: { trigger: '.foot', start: 'top 75%' } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
