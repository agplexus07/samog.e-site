/* =========================================================
   Estande isométrico: desenha em SVG o estande de cada cota
   (largura x profundidade x altura do material comercial).
   ========================================================= */
(function () {
  const TIERS = {
    diamante: {
      title: 'Patrocinador Diamante', w: 6, d: 4, h: 4.5, color: '#f2c230', accent: '#fc689a',
      where: 'Região central da feira, com abertura para três ruas e fluxo intenso de visitantes.',
      perks: { area: '24 m²', totens: 'Sim', apresentacao: '40 min', redes: 'Sim' },
      inc: 'Estrutura metálica amarela com altura de 4,5 m, LED integrado e trilhos de iluminação, painel de fundo personalizável, balcão com TV de 43", mesa com 4 cadeiras, banqueta, carpete e plantas.'
    },
    ouro: {
      title: 'Patrocinador Ouro', w: 6, d: 4, h: 3.6, color: '#f2c230', accent: '#00b4f3',
      where: 'Região central da feira, com abertura para três ruas e fluxo intenso de visitantes.',
      perks: { area: '24 m²', totens: 'Sim', apresentacao: '30 min', redes: 'Sim' },
      inc: 'Estrutura metálica amarela, LED integrado e trilhos de iluminação, painel de fundo personalizável, balcão com TV de 43", mesa com 4 cadeiras, banqueta, carpete e plantas.'
    },
    prata: {
      title: 'Patrocinador Prata', w: 4, d: 4, h: 3.4, color: '#b9bec9', accent: '#00b4f3',
      where: 'Próximo aos acessos da feira e à Arena RedePetro ES, área de grande circulação.',
      perks: { area: '16 m²', totens: 'Sim', apresentacao: '20 min', redes: 'Sim' },
      inc: 'Estrutura metálica cinza com LED na fachada, balcão com TV de 43", mesa com 4 cadeiras, banqueta, carpete e cachepot com plantas.'
    },
    bronze: {
      title: 'Patrocinador Bronze', w: 3, d: 3, h: 3.2, color: '#e07a2e', accent: '#fc689a',
      where: 'Ao lado da Rodada de Negócios, perto das oportunidades comerciais.',
      perks: { area: '9 m²', totens: 'Sim', apresentacao: '10 min', redes: 'Sim' },
      inc: 'Estrutura metálica laranja com LED, logotipo na testeira, balcão com TV de 43", mesa com 4 cadeiras, banqueta e carpete.'
    },
    padrao: {
      title: 'Estande Padrão', w: 3, d: 3, h: 3, color: '#2f5ee0', accent: '#00b4f3',
      where: 'Bem distribuídos pela feira, em pontos de circulação do público.',
      perks: { area: '9 m²', totens: 'Não', apresentacao: 'Não', redes: 'Sim' },
      inc: 'Estrutura metálica azul-escura com LED, logotipo na testeira, balcão com TV de 43", mesa com 4 cadeiras, banqueta e carpete.'
    }
  };

  // projeção isométrica simples
  const S = 34;
  const COS = Math.cos(Math.PI / 6), SIN = Math.sin(Math.PI / 6);
  const iso = (x, y, z) => [(x - y) * COS * S, (x + y) * SIN * S - z * S];
  const pts = (arr) => arr.map((p) => iso(...p).map((n) => n.toFixed(1)).join(',')).join(' ');

  function draw(key) {
    const t = TIERS[key];
    const { w, d, h, color, accent } = t;
    const beam = 0.16;
    const parts = [];

    // piso / carpete
    parts.push(`<polygon class="s-floor" points="${pts([[0,0,0],[w,0,0],[w,d,0],[0,d,0]])}" fill="#262c47"/>`);
    parts.push(`<polygon class="s-floor" points="${pts([[0.15,0.15,0.01],[w-0.15,0.15,0.01],[w-0.15,d-0.15,0.01],[0.15,d-0.15,0.01]])}" fill="#323a5c"/>`);

    // paredes do fundo (painel personalizável)
    parts.push(`<polygon class="s-wall" points="${pts([[0,0,0],[w,0,0],[w,0,h-0.4],[0,0,h-0.4]])}" fill="#e9ecf6"/>`);
    parts.push(`<polygon class="s-wall" points="${pts([[0,0,0],[0,d,0],[0,d,h-0.4],[0,0,h-0.4]])}" fill="#cfd5e8"/>`);
    // arte do painel
    parts.push(`<polygon class="s-art" points="${pts([[w*0.18,0,0.9],[w*0.82,0,0.9],[w*0.82,0,h-0.9],[w*0.18,0,h-0.9]])}" fill="${accent}" opacity="0.9"/>`);
    parts.push(`<polygon class="s-art" points="${pts([[w*0.3,0,1.3],[w*0.7,0,1.3],[w*0.7,0,h-1.3],[w*0.3,0,h-1.3]])}" fill="#1b4fd6" opacity="0.85"/>`);

    // mesa redonda (elipse aproximada)
    const [mx, my] = iso(w * 0.62, d * 0.6, 0.75);
    parts.push(`<ellipse class="s-furn" cx="${mx}" cy="${my}" rx="${0.75*S}" ry="${0.4*S}" fill="#f5f6fb"/>`);
    parts.push(`<rect class="s-furn" x="${mx-2}" y="${my}" width="4" height="${0.75*S}" fill="#9aa3c2"/>`);

    // balcão com TV
    const bx = w * 0.18, by = d * 0.7;
    parts.push(`<polygon class="s-furn" points="${pts([[bx,by,1],[bx+1,by,1],[bx+1,by+0.5,1],[bx,by+0.5,1]])}" fill="#ffffff"/>`);
    parts.push(`<polygon class="s-furn" points="${pts([[bx,by+0.5,0],[bx+1,by+0.5,0],[bx+1,by+0.5,1],[bx,by+0.5,1]])}" fill="#dde2f0"/>`);
    parts.push(`<polygon class="s-furn" points="${pts([[bx+1,by,0],[bx+1,by+0.5,0],[bx+1,by+0.5,1],[bx+1,by,1]])}" fill="#c4cbe0"/>`);
    parts.push(`<polygon class="s-furn" points="${pts([[bx+0.1,by+0.25,1.05],[bx+0.9,by+0.25,1.05],[bx+0.9,by+0.25,1.55],[bx+0.1,by+0.25,1.55]])}" fill="#0d1226"/>`);

    // planta
    const [px, py] = iso(w - 0.5, 0.5, 0.9);
    parts.push(`<circle class="s-furn" cx="${px}" cy="${py}" r="${0.42*S}" fill="#3fae6a"/>`);

    // estrutura metálica: pilares e vigas
    const posts = [[0,0],[w,0],[0,d],[w,d]];
    posts.forEach(([x, y]) => {
      parts.push(`<polygon class="s-beam" points="${pts([[x-beam,y,0],[x+beam,y,0],[x+beam,y,h],[x-beam,y,h]])}" fill="${color}"/>`);
    });
    const top = [[[0,0],[w,0]],[[0,0],[0,d]],[[w,0],[w,d]],[[0,d],[w,d]]];
    top.forEach(([[x1,y1],[x2,y2]]) => {
      parts.push(`<polygon class="s-beam" points="${pts([[x1,y1,h-0.35],[x2,y2,h-0.35],[x2,y2,h],[x1,y1,h]])}" fill="${color}"/>`);
    });
    // testeira com logo
    parts.push(`<polygon class="s-beam" points="${pts([[w*0.3,d,h-0.3],[w*0.7,d,h-0.3],[w*0.7,d,h+0.15],[w*0.3,d,h+0.15]])}" fill="#ffffff"/>`);
    // LED
    parts.push(`<polyline class="s-led" points="${pts([[0,d,h-0.38],[w,d,h-0.38]])}" fill="none" stroke="#bfe9ff" stroke-width="2.5"/>`);

    // enquadramento: calcula bbox aproximado
    const corners = [[0,0,0],[w,0,0],[0,d,0],[w,d,0],[0,0,h],[w,0,h],[0,d,h],[w,d,h]].map((p) => iso(...p));
    const xs = corners.map((c) => c[0]), ys = corners.map((c) => c[1]);
    // viewBox fixo baseado na maior cota, para a área "crescer" visualmente entre as cotas
    const ref = { w: 6, d: 4, h: 4.5 };
    const rc = [[0,0,0],[ref.w,0,0],[0,ref.d,0],[ref.w,ref.d,0],[0,0,ref.h],[ref.w,0,ref.h]].map((p) => iso(...p));
    const rx = rc.map((c) => c[0]), ry = rc.map((c) => c[1]);
    const pad = 30;
    const vb = [Math.min(...rx) - pad, Math.min(...ry) - pad, Math.max(...rx) - Math.min(...rx) + pad * 2, Math.max(...ry) - Math.min(...ry) + pad * 2];
    // centraliza o estande menor no mesmo quadro
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 - (Math.min(...rx) + Math.max(...rx)) / 2;
    const cy = Math.max(...ys) - Math.max(...ry);

    return `<svg viewBox="${vb.map((n) => n.toFixed(1)).join(' ')}" role="img"><g transform="translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})">${parts.join('')}</g></svg>`;
  }

  window.SamogStand = { TIERS, draw };
})();
