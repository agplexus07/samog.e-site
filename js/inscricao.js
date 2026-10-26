/* =========================================================
   Inscrição do público (gratuita) + interesse de patrocínio.

   Nesta primeira versão os dados ficam no navegador
   (localStorage). Para ligar a um backend, troque apenas as
   funções de SamogAPI por chamadas fetch() ao seu endpoint.
   ========================================================= */
(function () {
  const STORE_INSC = 'samoge27_inscricoes';
  const STORE_LEAD = 'samoge27_patrocinio';

  const SamogAPI = {
    async saveRegistration(data) {
      const record = { id: makeId(), criadoEm: new Date().toISOString(), ...data };
      const list = readStore(STORE_INSC);
      list.push(record);
      writeStore(STORE_INSC, list);
      return record;
    },
    async saveSponsorLead(data) {
      const record = { id: makeId('PAT'), criadoEm: new Date().toISOString(), ...data };
      const list = readStore(STORE_LEAD);
      list.push(record);
      writeStore(STORE_LEAD, list);
      return record;
    }
  };
  window.SamogAPI = SamogAPI;

  function readStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado: segue sem salvar */ }
  }
  function makeId(prefix = 'SMG27') {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(6);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return prefix + '-' + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }

  /* ---------- Máscaras ---------- */
  const onlyDigits = (v) => v.replace(/\D/g, '');
  const MASKS = {
    cpf: (v) => onlyDigits(v).slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    cnpj: (v) => onlyDigits(v).slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2'),
    phone: (v) => {
      const d = onlyDigits(v).slice(0, 11);
      if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
      return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
  };
  document.querySelectorAll('[data-mask]').forEach((input) => {
    input.addEventListener('input', () => { input.value = MASKS[input.dataset.mask](input.value); });
  });

  /* ---------- Validação ---------- */
  function validCPF(v) {
    const c = onlyDigits(v);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    let s = 0;
    for (let i = 0; i < 9; i++) s += +c[i] * (10 - i);
    let r = (s * 10) % 11; if (r === 10) r = 0;
    if (r !== +c[9]) return false;
    s = 0;
    for (let i = 0; i < 10; i++) s += +c[i] * (11 - i);
    r = (s * 10) % 11; if (r === 10) r = 0;
    return r === +c[10];
  }
  function validCNPJ(v) {
    const c = onlyDigits(v);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    const calc = (len) => {
      let s = 0, pos = len - 7;
      for (let i = len; i >= 1; i--) { s += +c[len - i] * pos--; if (pos < 2) pos = 9; }
      const r = s % 11 < 2 ? 0 : 11 - (s % 11);
      return r;
    };
    return calc(12) === +c[12] && calc(13) === +c[13];
  }
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const validPhone = (v) => onlyDigits(v).length >= 10;

  function fieldError(input, msg) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.toggle('is-invalid', !!msg);
    const err = field.querySelector('.form__error');
    if (err) err.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function checkInput(input) {
    const v = input.value.trim();
    if (input.required && !v) return 'Campo obrigatório.';
    if (!v) return '';
    if (input.dataset.mask === 'cpf' && !validCPF(v)) return 'CPF inválido. Confira os números.';
    if (input.dataset.mask === 'cnpj' && !validCNPJ(v)) return 'CNPJ inválido. Confira os números.';
    if (input.dataset.mask === 'phone' && !validPhone(v)) return 'Informe DDD e número.';
    if (input.type === 'email' && !validEmail(v)) return 'E-mail inválido.';
    if (input.tagName === 'SELECT' && input.required && !input.value) return 'Selecione uma opção.';
    return '';
  }

  function shake(el) {
    if (window.gsap && !reduce()) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
  }
  const reduce = () => !/[?&]motion=1/.test(location.search) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     FORMULÁRIO DE INSCRIÇÃO EM ETAPAS
     ========================================================= */
  const form = document.getElementById('form-inscricao');
  if (form) {
    const steps = [...form.querySelectorAll('.form__step')];
    const prevBtn = form.querySelector('[data-prev]');
    const nextBtn = form.querySelector('[data-next]');
    const submitBtn = form.querySelector('[data-submit]');
    const progress = document.querySelectorAll('[data-prog]');
    const done = document.querySelector('[data-done]');
    let current = 1;

    form.querySelectorAll('input, select').forEach((el) => {
      el.addEventListener('blur', () => { if (el.closest('.field') && el.value.trim()) fieldError(el, checkInput(el)); });
      el.addEventListener('input', () => { if (el.closest('.field.is-invalid')) fieldError(el, checkInput(el)); });
    });

    // nome no crachá: sugere o primeiro + último nome
    const nome = form.querySelector('#nome');
    const cracha = form.querySelector('#cracha');
    nome.addEventListener('blur', () => {
      if (cracha.value.trim()) return;
      const parts = nome.value.trim().split(/\s+/);
      if (!parts[0]) return;
      cracha.value = (parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1] : parts[0]).slice(0, 22);
    });

    // escolher "Estudante" ajusta o rótulo do cargo
    form.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener('change', () => {
      const lab = form.querySelector('label[for="cargo"]');
      lab.textContent = r.value === 'Estudante' ? 'Curso' : 'Cargo';
      const seg = form.querySelector('#segmento');
      if (r.value === 'Estudante') seg.value = 'Instituição de ensino';
      if (r.value === 'Imprensa') seg.value = 'Imprensa';
      if (r.value === 'Governo / Instituição') seg.value = 'Governo ou entidade';
    }));

    function validateStep(n) {
      const step = steps[n - 1];
      let ok = true;
      if (n === 1) {
        const picked = form.querySelector('input[name="perfil"]:checked');
        const err = form.querySelector('[data-error-for="perfil"]');
        err.textContent = picked ? '' : 'Escolha um perfil para continuar.';
        if (!picked) { ok = false; shake(step.querySelector('.choices')); }
        return ok;
      }
      step.querySelectorAll('.field input, .field select').forEach((el) => {
        const msg = checkInput(el);
        fieldError(el, msg);
        if (msg && ok) { ok = false; el.focus(); shake(el.closest('.field')); }
      });
      if (n === 4) {
        const dias = form.querySelectorAll('input[name="dias"]:checked').length;
        form.querySelector('[data-error-for="dias"]').textContent = dias ? '' : 'Escolha pelo menos um dia.';
        const lgpd = form.querySelector('input[name="lgpd"]').checked;
        form.querySelector('[data-error-for="lgpd"]').textContent = lgpd ? '' : 'Precisamos da sua autorização para emitir a credencial.';
        if (!dias || !lgpd) ok = false;
      }
      return ok;
    }

    function goTo(n, dir = 1) {
      const from = steps[current - 1];
      const to = steps[n - 1];
      const swap = () => {
        from.hidden = true; from.classList.remove('is-active');
        to.hidden = false; to.classList.add('is-active');
        if (window.gsap && !reduce()) {
          gsap.fromTo(to.children, { y: 24 * dir, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.05, ease: 'expo.out' });
        }
        const first = to.querySelector('input:not([type=hidden]), select');
        if (first && n > 1) first.focus({ preventScroll: true });
      };
      if (window.gsap && !reduce()) {
        gsap.to(from.children, { y: -16 * dir, autoAlpha: 0, duration: 0.3, stagger: 0.02, ease: 'power2.in', onComplete: swap });
      } else swap();

      current = n;
      prevBtn.hidden = n === 1;
      nextBtn.hidden = n === steps.length;
      submitBtn.hidden = n !== steps.length;
      progress.forEach((p) => {
        const k = +p.dataset.prog;
        p.classList.toggle('is-active', k === n);
        p.classList.toggle('is-done', k < n);
        p.querySelector('span').textContent = k < n ? '✓' : k;
      });
    }

    nextBtn.addEventListener('click', () => { if (validateStep(current)) goTo(current + 1, 1); });
    prevBtn.addEventListener('click', () => goTo(current - 1, -1));
    form.querySelectorAll('input[name="perfil"]').forEach((r) => r.addEventListener('change', () => {
      setTimeout(() => { if (current === 1) goTo(2, 1); }, 280);
    }));
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && current < steps.length) {
        e.preventDefault();
        nextBtn.click();
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep(current)) return;
      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Gerando credencial...';

      const fd = new FormData(form);
      const data = {
        perfil: fd.get('perfil'),
        nome: fd.get('nome').trim(),
        cracha: fd.get('cracha').trim(),
        cpf: fd.get('cpf'),
        email: fd.get('email').trim(),
        telefone: fd.get('telefone'),
        cidade: fd.get('cidade').trim(),
        uf: fd.get('uf'),
        empresa: fd.get('empresa').trim(),
        cargo: fd.get('cargo').trim(),
        cnpj: fd.get('cnpj') || '',
        segmento: fd.get('segmento'),
        dias: fd.getAll('dias'),
        interesses: fd.getAll('interesses'),
        lgpd: true,
        novidades: !!fd.get('novidades')
      };

      const record = await SamogAPI.saveRegistration(data);
      renderCredential(record);
      showDone(record);
    });

    function showDone(record) {
      document.querySelector('[data-done-name]').textContent = record.cracha.split(' ')[0];
      const reveal = () => {
        form.hidden = true;
        done.hidden = false;
        progress.forEach((p) => { p.classList.remove('is-active'); p.classList.add('is-done'); p.querySelector('span').textContent = '✓'; });
        if (window.gsap && !reduce()) {
          const tl = gsap.timeline();
          tl.from('.done__head > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.7, ease: 'expo.out' })
            .from('.credential', { rotateX: -70, y: -40, autoAlpha: 0, transformPerspective: 900, duration: 1.2, ease: 'expo.out' }, '-=0.4')
            .from('.cred__body > *, .cred__foot', { y: 12, autoAlpha: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' }, '-=0.7')
            .from('.done__actions > *', { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, '-=0.4');
          burst(document.querySelector('.credential'));
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      };
      if (window.gsap && !reduce()) gsap.to(form, { autoAlpha: 0, y: -20, duration: 0.35, ease: 'power2.in', onComplete: () => { gsap.set(form, { clearProps: 'all' }); reveal(); } });
      else reveal();
    }

    document.querySelector('[data-print]').addEventListener('click', () => window.print());
    document.querySelector('[data-new]').addEventListener('click', () => {
      form.reset();
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
      submitBtn.disabled = false;
      submitBtn.querySelector('span').textContent = 'Concluir inscrição';
      done.hidden = true;
      form.hidden = false;
      steps.forEach((s, i) => { s.hidden = i !== 0; s.classList.toggle('is-active', i === 0); if (window.gsap) gsap.set(s.children, { clearProps: 'all' }); });
      current = 1;
      prevBtn.hidden = true; nextBtn.hidden = false; submitBtn.hidden = true;
      progress.forEach((p) => { const k = +p.dataset.prog; p.classList.toggle('is-active', k === 1); p.classList.remove('is-done'); p.querySelector('span').textContent = k; });
    });
  }

  /* ---------- Credencial ---------- */
  const CATEGORIAS = {
    'Profissional do setor': { label: 'Visitante profissional', color: '#00b4f3' },
    'Empresário / Fornecedor': { label: 'Empresário', color: '#f2c230' },
    'Estudante': { label: 'Estudante', color: '#fc689a' },
    'Startup': { label: 'Startup', color: '#a98bff' },
    'Governo / Instituição': { label: 'Autoridade e instituições', color: '#cfd5e8' },
    'Imprensa': { label: 'Imprensa', color: '#ff8a3d' }
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function qrSvg(text) {
    if (typeof window.qrcode !== 'function') return '';
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  }

  function renderCredential(r) {
    const el = document.querySelector('[data-credential]');
    const cat = CATEGORIAS[r.perfil] || CATEGORIAS['Profissional do setor'];
    const dias = r.dias.length === 2 ? '03 e 04/03' : r.dias[0];
    el.style.setProperty('--cat', cat.color);
    el.innerHTML = `
      <div class="cred__top">
        <div class="cred__brand">
          <img src="assets/logos/samoge-drop.svg" alt="">
          <div><b>SAMOG<em>.e</em> 2027</b><small>São Mateus Óleo, Gás e Energia</small></div>
        </div>
        <div class="cred__kind">Credencial<br>de acesso</div>
      </div>
      <div class="cred__cat">${esc(cat.label)}</div>
      <div class="cred__body">
        <div class="cred__name">${esc(r.cracha)}<p class="cred__full">${esc(r.nome)}</p></div>
        <dl class="cred__info">
          <div><dt>Empresa</dt><dd>${esc(r.empresa)}</dd></div>
          <div><dt>${r.perfil === 'Estudante' ? 'Curso' : 'Cargo'}</dt><dd>${esc(r.cargo)}</dd></div>
          <div><dt>Cidade</dt><dd>${esc(r.cidade)}/${esc(r.uf)}</dd></div>
          <div><dt>Dias</dt><dd>${esc(dias)} · 14h às 20h</dd></div>
        </dl>
        <div class="cred__qr" aria-label="QR Code da inscrição ${esc(r.id)}">${qrSvg('SAMOGE27|' + r.id + '|' + r.cracha)}</div>
      </div>
      <div class="cred__foot">
        <span>CEPE · São Mateus/ES</span>
        <b>${esc(r.id)}</b>
      </div>`;
  }

  // pequena explosão de partículas em volta da credencial
  function burst(target) {
    if (!target || !window.gsap) return;
    const colors = ['#fc689a', '#00b4f3', '#f2c230', '#1b4fd6'];
    const rect = target.getBoundingClientRect();
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span');
      p.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top + 60}px;width:8px;height:${Math.random() > 0.5 ? 8 : 14}px;border-radius:2px;background:${colors[i % 4]};pointer-events:none;z-index:80`;
      document.body.appendChild(p);
      const a = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 220;
      gsap.to(p, {
        x: Math.cos(a) * dist, y: Math.sin(a) * dist - 80, rotation: Math.random() * 540,
        autoAlpha: 0, duration: 1.2 + Math.random() * 0.6, ease: 'expo.out',
        onComplete: () => p.remove()
      });
    }
  }

  /* =========================================================
     PATROCÍNIO: seletor de cotas + formulário
     ========================================================= */
  const tiersRoot = document.querySelector('[data-tiers]');
  if (tiersRoot && window.SamogStand) {
    const { TIERS, draw } = window.SamogStand;
    const standEl = tiersRoot.querySelector('[data-stand]');
    const buttons = tiersRoot.querySelectorAll('[data-tier]');
    const leadSelect = document.querySelector('[data-lead-cota]');
    function setTier(key, animate = true) {
      const t = TIERS[key];
      buttons.forEach((b) => {
        const on = b.dataset.tier === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-checked', on);
      });
      standEl.innerHTML = draw(key);
      tiersRoot.querySelector('[data-tier-title]').textContent = t.title;
      tiersRoot.querySelector('[data-tier-where]').textContent = t.where;
      tiersRoot.querySelector('[data-tier-inc]').textContent = t.inc;
      tiersRoot.querySelector('[data-tier-area]').textContent = t.perks.area;
      tiersRoot.querySelector('[data-tier-size]').textContent = `${t.d} × ${t.w} m · altura ${String(t.h).replace('.', ',')} m`;
      Object.entries(t.perks).forEach(([k, v]) => {
        const dd = tiersRoot.querySelector(`[data-perk="${k}"]`);
        dd.textContent = v;
        dd.classList.toggle('is-no', v === 'Não');
      });
      leadSelect.value = key;
      updateWhatsApp(key);

      if (animate && window.gsap && !reduce()) {
        const svg = standEl.querySelector('svg');
        const q = (sel) => svg.querySelectorAll(sel);
        gsap.fromTo(q('.s-floor'), { scale: 0.6, transformOrigin: '50% 50%', autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out' });
        gsap.fromTo(q('.s-wall, .s-art'), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.04, ease: 'expo.out', delay: 0.05 });
        gsap.fromTo(q('.s-beam'), { y: -60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.03, ease: 'expo.out', delay: 0.15 });
        gsap.fromTo(q('.s-furn'), { scale: 0, transformOrigin: '50% 100%', autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, stagger: 0.04, ease: 'back.out(2)', delay: 0.35 });
        gsap.fromTo(q('.s-led'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2, repeat: 3, yoyo: true, delay: 0.9 });
        gsap.fromTo(tiersRoot.querySelectorAll('.tiers__detail > *, .stand__dims > *'), { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.04, duration: 0.5, ease: 'power3.out', overwrite: true });
      }
    }

    // WhatsApp da equipe comercial já com a cota escolhida na mensagem
    const WA_NUMBER = '5527995123132';
    function updateWhatsApp(key) {
      const nome = TIERS[key].title.replace('Patrocinador ', 'Patrocínio ');
      const msg = `Olá! Tenho interesse na cota ${nome} da SAMOG.e 2027 e gostaria de conversar com a equipe comercial.`;
      document.querySelectorAll('[data-wa]').forEach((a) => { a.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`; });
    }

    buttons.forEach((b) => b.addEventListener('click', () => setTier(b.dataset.tier)));
    tiersRoot.querySelector('[role="radiogroup"]').addEventListener('keydown', (e) => {
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault();
      const arr = [...buttons];
      const i = arr.findIndex((b) => b.classList.contains('is-active'));
      const next = arr[(i + (e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : arr.length - 1)) % arr.length];
      setTier(next.dataset.tier); next.focus();
    });
    leadSelect.addEventListener('change', () => setTier(leadSelect.value, false));
    setTier('diamante', false);
    window.SamogSetTier = setTier;
  }

  const lead = document.getElementById('form-patrocinio');
  if (lead) {
    lead.querySelectorAll('.field input').forEach((el) => el.addEventListener('blur', () => { if (el.value.trim()) fieldError(el, checkInput(el)); }));
    lead.addEventListener('submit', async (e) => {
      e.preventDefault();
      let ok = true;
      lead.querySelectorAll('.field input').forEach((el) => {
        const msg = checkInput(el); fieldError(el, msg);
        if (msg && ok) { ok = false; el.focus(); shake(el.closest('.field')); }
      });
      if (!ok) return;
      const fd = new FormData(lead);
      await SamogAPI.saveSponsorLead({
        empresa: fd.get('empresa'), cnpj: fd.get('cnpj'), nome: fd.get('nome'),
        email: fd.get('email'), telefone: fd.get('telefone'), cota: fd.get('cota'),
        associado: !!fd.get('associado')
      });
      const okEl = lead.querySelector('[data-lead-ok]');
      okEl.hidden = false;
      lead.querySelector('button[type="submit"]').disabled = true;
      if (window.gsap && !reduce()) gsap.from(okEl, { y: 12, autoAlpha: 0, duration: 0.6, ease: 'expo.out' });
    });
  }
})();
