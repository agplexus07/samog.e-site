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
      .to('.loader__drop', { scale: 0.6, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '<0.1')
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

  /* ---------------- Experiências: setas ---------------- */
  // No desktop as setas rolam a página até o painel (a faixa horizontal é guiada pelo scroll);
  // sem animação, a faixa vira uma rolagem lateral comum e as setas a movem direto.
  const expTrack = $('.exp__track');
  const expPanels = $$('.panel', expTrack);
  const expPrev = $('[data-exp="prev"]');
  const expNext = $('[data-exp="next"]');
  const expCur = $('[data-exp-current]');
  const exp = { st: null, distance: null, index: 0 };
  function expSetIndex(i) {
    exp.index = i;
    expCur.textContent = String(i + 1).padStart(2, '0');
    expPrev.disabled = i === 0;
    expNext.disabled = i === expPanels.length - 1;
  }
  const expGutter = () => parseFloat(getComputedStyle($('.exp__intro')).paddingLeft) || 24;
  // progresso da faixa em que o painel i encosta na margem esquerda
  const expPanelProgress = (i) => gsap.utils.clamp(0, 1, (expTrack.offsetLeft + expPanels[i].offsetLeft - expGutter()) / exp.distance());
  function expSync(progress) {
    let i = 0;
    expPanels.forEach((_, k) => { if (expPanelProgress(k) <= progress + 0.02) i = k; });
    if (progress > 0.98) i = expPanels.length - 1;
    if (i !== exp.index) expSetIndex(i);
  }
  function expGo(i) {
    i = gsap.utils.clamp(0, expPanels.length - 1, i);
    if (exp.st) {
      exp.pending = expPanelProgress(i);
      clearTimeout(exp.pendingTimer);
      exp.pendingTimer = setTimeout(() => { exp.pending = null; }, 1200);
      const y = exp.st.start + exp.pending * (exp.st.end - exp.st.start) + 1;
      if (smoother) smoother.scrollTo(y, true);
      else window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      expTrack.scrollTo({ left: expPanels[i].offsetLeft - expTrack.offsetLeft, behavior: REDUCE ? 'auto' : 'smooth' });
    }
    expSetIndex(i);
  }
  // no fim da faixa vários painéis cabem na tela, então o destino sai do progresso atual, não do índice
  function expStep(dir) {
    if (!exp.st) return expGo(exp.index + dir);
    const p = exp.pending != null ? exp.pending : exp.st.progress;
    const ks = expPanels.map((_, k) => k);
    const k = dir > 0 ? ks.find((i) => expPanelProgress(i) > p + 0.01) : ks.reverse().find((i) => expPanelProgress(i) < p - 0.01);
    expGo(k === undefined ? (dir > 0 ? expPanels.length - 1 : 0) : k);
  }
  expPrev.addEventListener('click', () => expStep(-1));
  expNext.addEventListener('click', () => expStep(1));
  expTrack.addEventListener('scroll', () => {
    if (exp.st) return;
    const max = expTrack.scrollWidth - expTrack.clientWidth;
    let i = 0;
    expPanels.forEach((p, k) => { if (p.offsetLeft - expTrack.offsetLeft <= expTrack.scrollLeft + 20) i = k; });
    if (expTrack.scrollLeft >= max - 4) i = expPanels.length - 1;
    if (i !== exp.index) expSetIndex(i);
  }, { passive: true });

  /* ---------------- Galeria: órbita 3D de fotos (Three.js) + lightbox ---------------- */
  const orbitEl = $('[data-orbit]');
  const orbitBtns = orbitEl ? $$('.orbit__btn', orbitEl) : [];
  const orbit = { paused: false, boost: 0, box: null };

  const lightbox = (() => {
    const lb = $('[data-lightbox]');
    if (!lb || !orbitBtns.length) return null;
    const img = $('.lightbox__img', lb);
    const pad = (n) => String(n).padStart(2, '0');
    $('[data-lb-total]', lb).textContent = pad(orbitBtns.length);
    let cur = -1;
    let lastFocus = null;

    const ratioOf = (i) => +orbitBtns[i].dataset.ratio || 1.5;
    function fitBox(ratio) {
      const maxW = innerWidth * (innerWidth < 761 ? 0.94 : 0.84);
      const maxH = innerHeight * 0.78;
      let w = maxW, h = w / ratio;
      if (h > maxH) { h = maxH; w = h * ratio; }
      return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
    }
    // a foto parte do ponto onde está na órbita; sem essa posição, nasce pequena no centro
    function startBox(i) {
      const b = orbit.box && orbit.box(i);
      if (b) return b;
      const s = Math.min(innerWidth, innerHeight) * 0.2;
      return { left: (innerWidth - s) / 2, top: (innerHeight - s) / 2, width: s, height: s };
    }
    function show(i) {
      cur = i;
      img.src = orbitBtns[i].dataset.full;
      img.alt = orbitBtns[i].dataset.alt;
      $('[data-lb-n]', lb).textContent = pad(i + 1);
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      orbit.paused = true;
      if (smoother) smoother.paused(true); else document.documentElement.style.overflow = 'hidden';
      const end = fitBox(ratioOf(i));
      if (REDUCE) gsap.set(img, end);
      else {
        gsap.fromTo('.lightbox__veil', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
        gsap.fromTo(img, { ...startBox(i), x: 0, autoAlpha: 1 }, { ...end, duration: 0.9, ease: 'expo.inOut' });
        gsap.fromTo('.lightbox__btn, .lightbox__count', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, delay: 0.5 });
      }
      $('.lightbox__close', lb).focus({ preventScroll: true });
    }
    function close() {
      if (lb.hidden) return;
      const done = () => {
        lb.hidden = true;
        orbit.paused = false;
        if (smoother) smoother.paused(false); else document.documentElement.style.overflow = '';
        if (lastFocus) lastFocus.focus({ preventScroll: true });
      };
      if (REDUCE) return done();
      gsap.to('.lightbox__btn, .lightbox__count', { autoAlpha: 0, duration: 0.2 });
      gsap.to('.lightbox__veil', { autoAlpha: 0, duration: 0.5, delay: 0.3 });
      gsap.to(img, { ...startBox(cur), x: 0, duration: 0.8, ease: 'expo.inOut', onComplete: done });
    }
    function go(dir) {
      const next = (cur + dir + orbitBtns.length) % orbitBtns.length;
      if (REDUCE) { show(next); gsap.set(img, fitBox(ratioOf(next))); return; }
      gsap.to(img, {
        autoAlpha: 0, x: -dir * 60, duration: 0.25, ease: 'power2.in',
        onComplete: () => {
          show(next);
          gsap.set(img, fitBox(ratioOf(next)));
          gsap.fromTo(img, { x: dir * 60, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.6, ease: 'expo.out' });
        }
      });
    }
    $$('[data-lb-close]', lb).forEach((el) => el.addEventListener('click', close));
    $$('[data-lb]', lb).forEach((el) => el.addEventListener('click', () => go(+el.dataset.lb)));
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        // mantém o foco dentro da foto ampliada
        const f = $$('.lightbox__btn', lb);
        const k = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    window.addEventListener('resize', () => { if (!lb.hidden) gsap.set(img, fitBox(ratioOf(cur))); });
    return { open };
  })();
  // botões para teclado e leitor de tela (a órbita em si é um canvas)
  orbitBtns.forEach((b, i) => b.addEventListener('click', () => lightbox && lightbox.open(i)));

  function initOrbit() {
    if (!orbitEl || !window.THREE) return;
    const T = window.THREE;
    const holder = $('.orbit__canvas', orbitEl);
    let renderer;
    try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    holder.appendChild(renderer.domElement);
    orbitEl.classList.add('is-3d');

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 200);
    const group = new T.Group();
    scene.add(group);

    // fotos distribuídas numa esfera (espiral de Fibonacci), viradas para fora
    const count = orbitBtns.length;
    const SIZE = 1.75;
    const radius = Math.sqrt(count) * 1.15;
    const geo = new T.PlaneGeometry(SIZE, SIZE);
    const meshes = orbitBtns.map((b, i) => {
      const phi = Math.acos(-1 + (2 * i + 1) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const mat = new T.MeshBasicMaterial({ transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false });
      const m = new T.Mesh(geo, mat);
      m.position.setFromSphericalCoords(radius, phi, theta);
      m.lookAt(m.position.clone().multiplyScalar(2));
      m.userData = { i, alpha: 0, hover: 1 };
      group.add(m);
      roundedTexture(b.dataset.thumb, (tex) => {
        mat.map = tex; mat.needsUpdate = true;
        gsap.to(m.userData, { alpha: 1, duration: 1.4, delay: 0.2 + i * 0.03, ease: 'power2.out' });
      });
      return m;
    });

    function roundedTexture(src, done) {
      const im = new Image();
      im.onload = () => {
        const S = 512, r = S * 0.08;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.arcTo(S, 0, S, S, r); ctx.arcTo(S, S, 0, S, r); ctx.arcTo(0, S, 0, 0, r); ctx.arcTo(0, 0, S, 0, r);
        ctx.closePath(); ctx.clip();
        const side = Math.min(im.width, im.height);
        ctx.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, S, S);
        const tex = new T.CanvasTexture(c);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        done(tex);
      };
      im.src = src;
    }

    function resize() {
      const w = holder.clientWidth, h = holder.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // enquadra a esfera inteira tanto na largura quanto na altura
      const v = T.MathUtils.degToRad(camera.fov);
      const hor = 2 * Math.atan(Math.tan(v / 2) * camera.aspect);
      camera.position.set(0, 0, (radius + SIZE) / Math.sin(Math.min(v, hor) / 2));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // arrastar gira (com inércia); clique sem arrastar amplia a foto
    const rot = { x: -0.15, y: 0, vx: 0, vy: 0 };
    const pointer = new T.Vector2();
    const ray = new T.Raycaster();
    let drag = null;
    let hovered = null;
    const canvas = renderer.domElement;
    function pick(e) {
      const r = canvas.getBoundingClientRect();
      pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(meshes).find((h) => h.object.userData.alpha > 0.5 && facing(h.object) > -0.2);
      return hit ? hit.object : null;
    }
    const wp = new T.Vector3();
    // 1 = de frente para a câmera, -1 = do outro lado da esfera
    const facing = (m) => m.getWorldPosition(wp).z / radius;
    canvas.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: 0 };
      rot.vx = rot.vy = 0;
    });
    window.addEventListener('pointermove', (e) => {
      if (drag) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        drag.x = e.clientX; drag.y = e.clientY;
        drag.moved = Math.max(drag.moved, Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy));
        rot.vy = dx * 0.006; rot.vx = dy * 0.006;
        rot.y += rot.vy; rot.x = gsap.utils.clamp(-1.1, 1.1, rot.x + rot.vx);
        return;
      }
      if (e.target !== canvas) { if (hovered) setHover(null); return; }
      setHover(pick(e));
    }, { passive: true });
    window.addEventListener('pointerup', (e) => {
      if (!drag) return;
      const click = drag.moved < 6 && e.target === canvas;
      drag = null;
      if (click) { const m = pick(e); if (m && lightbox) lightbox.open(m.userData.i); }
    });
    canvas.addEventListener('pointercancel', () => { drag = null; });
    function setHover(m) {
      if (m === hovered) return;
      if (hovered) gsap.to(hovered.userData, { hover: 1, duration: 0.5, ease: 'expo.out' });
      hovered = m;
      if (m) gsap.to(m.userData, { hover: 1.35, duration: 0.6, ease: 'expo.out' });
      canvas.style.cursor = m ? 'zoom-in' : 'grab';
    }

    // posição da foto na tela, para o lightbox nascer dela
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new T.Vector3(x * SIZE / 2, y * SIZE / 2, 0));
    orbit.box = (i) => {
      const m = meshes[i];
      if (facing(m) < 0) return null;
      m.updateMatrixWorld();
      const r = canvas.getBoundingClientRect();
      const pts = corners.map((c) => c.clone().applyMatrix4(m.matrixWorld).project(camera));
      const xs = pts.map((p) => r.left + ((p.x + 1) / 2) * r.width);
      const ys = pts.map((p) => r.top + ((1 - p.y) / 2) * r.height);
      const left = Math.min(...xs), top = Math.min(...ys);
      return { left, top, width: Math.max(...xs) - left, height: Math.max(...ys) - top };
    };

    let visible = false;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { rootMargin: '100px' }).observe(orbitEl);
    gsap.ticker.add((time, dt) => {
      if (!visible || orbit.paused) return;
      const k = Math.min(dt, 50) / 16.67;
      if (!drag) {
        if (!REDUCE) rot.y += 0.0025 * k * (1 + orbit.boost);
        rot.y += rot.vy * k; rot.x = gsap.utils.clamp(-1.1, 1.1, rot.x + rot.vx * k);
        rot.vx *= 0.93; rot.vy *= 0.93;
      }
      group.rotation.set(rot.x, rot.y, 0);
      group.updateMatrixWorld();
      meshes.forEach((m) => {
        // as fotos do fundo ficam apagadas, dando profundidade
        const f = facing(m);
        m.material.opacity = m.userData.alpha * (0.18 + 0.82 * gsap.utils.clamp(0, 1, (f + 0.6) / 1.4));
        m.scale.setScalar(m.userData.hover);
      });
      renderer.render(scene, camera);
    });
  }
  initOrbit();

  if (REDUCE) {
    $('.exp').classList.add('is-static');
    return; // daqui pra baixo é tudo animação de scroll
  }

  /* ---------------- Hero: o título se afasta ao rolar ---------------- */
  gsap.to('.hero__title', {
    yPercent: -40, scale: 0.92, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero__countdown, .hero__ctas, .hero__row', {
    y: -80, autoAlpha: 0, ease: 'none', stagger: 0.05,
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true }
  });

  /* ---------------- Hero: colunas de fotos em fluxo contínuo ---------------- */
  $$('.hero__col').forEach((col, i) => {
    col.innerHTML += col.innerHTML; // duplica para o loop não ter emenda
    const up = i % 2 === 0;
    gsap.fromTo(col, { yPercent: up ? 0 : -50 }, { yPercent: up ? -50 : 0, duration: 70 + i * 8, ease: 'none', repeat: -1 });
  });
  gsap.to('.hero__media', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.from('.hero__media', { autoAlpha: 0, scale: 1.08, duration: 2.4, ease: 'expo.out', delay: 0.2 });

  /* ---------------- Reveal: a gota abre para a feira ---------------- */
  const photo = $('.reveal__photo');
  const vmin = () => Math.min(innerWidth, innerHeight);
  const vmax = () => Math.max(innerWidth, innerHeight);
  gsap.set(photo, { '--m': vmin() * 0.26 + 'px' });
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
    .fromTo(photo, { '--m': () => vmin() * 0.26 + 'px' }, { '--m': () => vmax() * 6 + 'px', ease: 'power3.in', duration: 1 }, 0)
    .fromTo('.reveal__photo img', { scale: 1.35 }, { scale: 1, ease: 'none', duration: 1 }, 0)
    .from(captionSplit, { yPercent: 150, stagger: 0.08, duration: 0.35, ease: 'power3.out' }, 0.72)
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
            yPercent: 135, duration: 1.3, stagger: 0.1,
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
      scrollTrigger: { trigger: '.exp', start: 'top top', end: () => '+=' + distance(), pin: pinEl, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (self) => expSync(self.progress) }
    });
    exp.st = horiz.scrollTrigger;
    exp.distance = distance;
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

    return () => { exp.st = null; };
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

  /* ---------------- Galeria: o scroll dá um impulso na órbita ---------------- */
  ScrollTrigger.create({
    trigger: '.gallery', start: 'top bottom', end: 'bottom top',
    onUpdate(self) {
      const boost = Math.min(Math.abs(self.getVelocity()) / 200, 10);
      if (boost > orbit.boost) gsap.fromTo(orbit, { boost }, { boost: 0, duration: 1.6, ease: 'power2.out', overwrite: true });
    }
  });
  gsap.from('.gallery__head > *', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.2, scrollTrigger: { trigger: '.gallery', start: 'top 70%' } });
  gsap.from('.orbit__canvas', { scale: 0.6, autoAlpha: 0, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: '.gallery', start: 'top 70%' } });

  /* ---------------- O evento: baralho de fotos ---------------- */
  const deck = $('[data-deck]');
  if (deck) {
    const cards = $$('.deck__card', deck);
    const order = cards.slice().reverse(); // order[0] é a carta do topo
    const layout = (dur) => order.forEach((c, k) => gsap.to(c, {
      zIndex: cards.length - k,
      rotation: k === 0 ? 0 : (k % 2 ? 1 : -1) * Math.min(3 + k * 1.5, 9),
      x: Math.min(k, 3) * 10, y: Math.min(k, 3) * -10,
      scale: 1 - Math.min(k, 3) * 0.035,
      autoAlpha: k < 4 ? 1 : 0,
      duration: dur, ease: 'expo.out'
    }));
    layout(0);
    let timer = null;
    let deckActive = false;
    const deal = () => {
      const top = order[0];
      gsap.to(top, {
        xPercent: -115, rotation: -16, duration: 0.7, ease: 'power3.in',
        onComplete: () => {
          order.push(order.shift());
          gsap.set(top, { xPercent: 0, zIndex: 0, autoAlpha: 0 });
          layout(0.9);
          timer = deckActive ? gsap.delayedCall(2.6, deal) : null;
        }
      });
    };
    gsap.from(cards, { y: 80, rotation: 10, autoAlpha: 0, stagger: 0.07, duration: 1.2, scrollTrigger: { trigger: deck, start: 'top 80%' }, onComplete: () => layout(0.6) });
    ScrollTrigger.create({
      trigger: deck, start: 'top bottom', end: 'bottom top',
      onToggle: (self) => {
        deckActive = self.isActive;
        if (self.isActive && !timer) timer = gsap.delayedCall(2.6, deal);
        else if (!self.isActive && timer) { timer.kill(); timer = null; }
      }
    });
  }

  /* ---------------- Público ---------------- */
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
