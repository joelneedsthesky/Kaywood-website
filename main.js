/* Kaywood Capital — site script */
(function () {
  'use strict';

  /* ---------- Settings you can change ---------- */
  var CONFIG = {
    // When the forms service is connected (step 6), paste its URL here.
    // Until then, forms open a pre-filled email instead.
    formEndpoint: '',
    accessEmail: 'invest@kaywoodcapital.com',
    newsletterEmail: 'signals@kaywoodcapital.com'
  };

  /* ---------- Signal map data (edit regions here) ----------
     x / y are % positions on the map. labelLeft puts the code on the left of the dot.
     pillars decide which filter lights the node up. */
  var REGIONS = [
    { id: 'pt', code: 'PT', name: 'Portugal', x: 47.5, y: 30.6, status: 'Home base', pillars: ['Tokenization', 'Crypto'], themes: ['Lisbon property as tokenized assets', 'MiCA and the DLT Pilot Regime', 'EU gateway for Lusophone capital'] },
    { id: 'ao', code: 'AO', name: 'Angola', x: 53.6, y: 63.75, status: 'Core focus', pillars: ['Tokenization', 'Market access'], themes: ['Kwanza (AOA) liquidity and FX reform', 'Diversification beyond oil', 'Real estate and infrastructure for tokenization', 'Institutional partnerships'] },
    { id: 'ae', code: 'AE', name: 'UAE & Gulf', x: 65.3, y: 40.1, status: 'Partner market', pillars: ['Tokenization', 'Crypto'], themes: ['Digital asset licensing hubs', 'Investor demand for tokenized real assets', 'Sovereign capital flows into Africa'] },
    { id: 'mz', code: 'MZ', name: 'Mozambique', x: 59.1, y: 75.5, status: 'Market access', pillars: ['Tokenization', 'Market access'], themes: ['LNG-linked investment', 'Port and corridor infrastructure', 'Lusophone real estate opportunities'] },
    { id: 'br', code: 'BR', name: 'Brazil', x: 37.2, y: 73.75, status: 'Lusophone market', pillars: ['Tokenization'], themes: ['Lusophone trade links with Africa', 'Tokenization and digital asset regulation', 'A large, digital-first investor base'] },
    { id: 'st', code: 'ST', name: 'São Tomé & Príncipe', x: 51.9, y: 57.3, labelLeft: true, status: 'Emerging opportunity', pillars: ['Tokenization'], themes: ['Lusophone island economy', 'Tourism and real estate assets', 'A small market suited to early tokenization'] },
    { id: 'ng', code: 'NG', name: 'Nigeria', x: 50.9, y: 53, status: 'Market access', pillars: ['Market access'], themes: ['Naira reforms and fintech rails', 'Local stablecoins such as cNGN', 'Institutional and private partnerships'] },
    { id: 'lr', code: 'LR', name: 'Liberia', x: 47.0, y: 53.1, labelLeft: true, status: 'Market access', pillars: ['Market access'], themes: ['Resource and infrastructure projects', 'A dollarized economy (USD alongside LRD)', 'Early-stage partnerships'] },
    { id: 'rs', code: 'RS', name: 'Serbia', x: 55.7, y: 26.4, labelLeft: true, status: 'Market access', pillars: ['Market access'], themes: ['Gateway to Southeast Europe', 'Infrastructure and energy projects', 'Partnerships in the Western Balkans'] },
    { id: 'us', code: 'US', name: 'United States', x: 29.4, y: 29.2, status: 'Macro driver', pillars: ['Crypto', 'Macro'], themes: ['Federal Reserve policy and the dollar', 'Stablecoin law (GENIUS Act)', 'Crypto ETF flows'] },
    { id: 'cn', code: 'CN', name: 'China', x: 83.6, y: 36, status: 'Macro driver', pillars: ['Macro'], themes: ['Growth and commodity demand', 'Yuan internationalisation', 'Investment in Africa'] },
    { id: 'sv', code: 'SV', name: 'El Salvador', x: 25.3, y: 48.0, status: 'Crypto watch', pillars: ['Crypto'], themes: ['Bitcoin adoption at national level', 'Digital asset licensing framework', 'Lessons for emerging-market adoption'] },
    { id: 'tr', code: 'TR', name: 'Türkiye', x: 59.1, y: 29.8, status: 'Crypto watch', pillars: ['Crypto'], themes: ['High retail crypto adoption', 'Lira volatility and stablecoin demand', 'A bridge between Europe, the Gulf and Asia'] }
  ];
  var PILLARS = ['All', 'Tokenization', 'Crypto', 'Macro', 'Market access'];
  var HUB = { x: 475, y: 142 };      // Lisbon in map coordinates
  var ROTATE_MS = 5000;              // slideshow speed when a filter is selected

  var state = { pillar: 'All', sel: null, slide: 0, paused: false };
  var mapTimer = null;
  var mapReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function byId(id) { return REGIONS.filter(function (x) { return x.id === id; })[0]; }
  function inPillar(p) { return REGIONS.filter(function (r) { return p === 'All' || r.pillars.indexOf(p) !== -1; }); }

  /* ---------- Map ---------- */
  function buildGrid() {
    var g = $('#grid'); if (!g) return;
    var ns = 'http://www.w3.org/2000/svg';
    for (var y = 70; y <= 370; y += 50) { var l = document.createElementNS(ns, 'line'); l.setAttribute('x1', 0); l.setAttribute('x2', 1000); l.setAttribute('y1', y); l.setAttribute('y2', y); g.appendChild(l); }
    for (var x = 100; x <= 900; x += 100) { var v = document.createElementNS(ns, 'line'); v.setAttribute('y1', 20); v.setAttribute('y2', 420); v.setAttribute('x1', x); v.setAttribute('x2', x); g.appendChild(v); }
  }

  function arcFor(r) {
    if (r.id === 'pt') return '';
    var tx = r.x * 10, ty = r.y * 4 + 20, f = HUB;
    var dx = tx - f.x, dy = ty - f.y, dist = Math.sqrt(dx * dx + dy * dy);
    var cx = (f.x + tx) / 2, cy = Math.min(f.y, ty) - dist * 0.25;
    return 'M' + f.x + ',' + f.y + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + tx.toFixed(1) + ',' + ty.toFixed(1);
  }

  function buildFilters() {
    var wrap = $('#filters'); if (!wrap) return;
    PILLARS.forEach(function (p) {
      var b = el('button', { type: 'button', 'class': 'chip', 'aria-pressed': p === state.pillar ? 'true' : 'false' }, p);
      b.addEventListener('click', function () { state.pillar = p; state.sel = null; state.slide = 0; render(true); restartTimer(); });
      wrap.appendChild(b);
    });
  }

  function buildNodes() {
    var wrap = $('#nodes'); if (!wrap) return;
    REGIONS.forEach(function (r) {
      var b = el('button', { type: 'button', 'class': 'node' + (r.labelLeft ? ' node--left' : ''), 'data-id': r.id, 'aria-label': r.name + ' — ' + r.status });
      b.style.left = r.x + '%'; b.style.top = r.y + '%';
      b.appendChild(el('span', { 'class': 'node__dot', 'aria-hidden': 'true' }));
      b.appendChild(el('span', { 'class': 'node__label', 'aria-hidden': 'true' }, r.code));
      b.addEventListener('click', function () { selectCountry(r.id); });
      wrap.appendChild(b);
    });
  }

  function selectCountry(id) { state.sel = id; clearInterval(mapTimer); render(true); }

  function shownId() {
    if (state.sel) return state.sel;
    if (state.pillar === 'All') return null;
    var list = inPillar(state.pillar);
    return list.length ? list[state.slide % list.length].id : null;
  }

  function signalsLink(p) { p.appendChild(el('a', { href: '#signals', 'class': 'panel__signals' }, 'latest_signals →')); }

  function renderOverview(p) {
    var top = el('div', { 'class': 'panel__top' });
    top.appendChild(el('span', { 'class': 'mono muted' }, 'overview / all markets'));
    top.appendChild(el('span', { 'class': 'badge' }, REGIONS.length + ' markets'));
    p.appendChild(top);
    p.appendChild(el('h3', {}, 'Our map'));
    p.appendChild(el('p', { 'class': 'panel__intro' }, 'Each node is a market where Kaywood is active or watching, linked back to our hub in Lisbon. Filter by pillar to see where each part of the business works, or pick a market below.'));
    var list = el('div', { 'class': 'panel__list' });
    REGIONS.forEach(function (r) {
      var row = el('button', { type: 'button', 'class': 'panel__row' });
      row.appendChild(el('span', { 'class': 'mono accent panel__code' }, r.code));
      var txt = el('span', { 'class': 'panel__rowtxt' });
      txt.appendChild(el('span', { 'class': 'panel__rowname' }, r.name));
      txt.appendChild(el('span', { 'class': 'mono muted panel__rowtags' }, r.pillars.join(' · ')));
      row.appendChild(txt);
      row.addEventListener('click', function () { selectCountry(r.id); });
      list.appendChild(row);
    });
    p.appendChild(list);
    signalsLink(p);
  }

  function renderBrief(p, r) {
    var top = el('div', { 'class': 'panel__top' });
    top.appendChild(el('span', { 'class': 'mono muted' }, 'node / ' + r.code));
    top.appendChild(el('span', { 'class': 'badge' }, r.status));
    p.appendChild(top);
    p.appendChild(el('h3', {}, r.name));
    p.appendChild(el('p', { 'class': 'mono blue' }, r.pillars.join(' · ')));
    var ul = el('ul', {});
    r.themes.forEach(function (t) { ul.appendChild(el('li', {}, t)); });
    p.appendChild(ul);

    var foot = el('div', { 'class': 'panel__foot' });
    if (state.sel) {
      var back = el('button', { type: 'button', 'class': 'panel__back mono' }, state.pillar === 'All' ? '← all markets' : '← back to ' + state.pillar.toLowerCase() + ' tour');
      back.addEventListener('click', function () { state.sel = null; render(true); restartTimer(); });
      foot.appendChild(back);
    } else {
      var list = inPillar(state.pillar), idx = state.slide % list.length;
      var nav = el('div', { 'class': 'panel__nav' });
      var prev = el('button', { type: 'button', 'class': 'panel__arrow', 'aria-label': 'Previous market' }, '‹');
      var next = el('button', { type: 'button', 'class': 'panel__arrow', 'aria-label': 'Next market' }, '›');
      prev.addEventListener('click', function () { state.slide = (idx - 1 + list.length) % list.length; render(true); restartTimer(); });
      next.addEventListener('click', function () { state.slide = (idx + 1) % list.length; render(true); restartTimer(); });
      var dots = el('span', { 'class': 'panel__dots', 'aria-hidden': 'true' });
      list.forEach(function (x, i) { dots.appendChild(el('span', { 'class': 'panel__dot' + (i === idx ? ' on' : '') })); });
      nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
      foot.appendChild(nav);
      foot.appendChild(el('span', { 'class': 'mono muted panel__count' }, state.pillar.toLowerCase() + ' · ' + (idx + 1) + '/' + list.length));
      if (!mapReduce && list.length > 1) { var bar = el('span', { 'class': 'panel__prog', 'aria-hidden': 'true' }); bar.appendChild(el('span', {})); p.appendChild(bar); }
    }
    p.appendChild(foot);
    signalsLink(p);
  }

  function render(animate) {
    var active = 0, sid = shownId();
    document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c.textContent === state.pillar ? 'true' : 'false'); });
    document.querySelectorAll('.node').forEach(function (n) {
      var r = byId(n.getAttribute('data-id'));
      var on = state.pillar === 'All' || r.pillars.indexOf(state.pillar) !== -1;
      if (on) active++;
      n.classList.toggle('is-dim', !on);
      n.classList.toggle('is-active', r.id === sid);
      n.setAttribute('aria-pressed', r.id === sid ? 'true' : 'false');
    });
    var arc = $('#arc');
    if (arc) { var d = sid ? arcFor(byId(sid)) : ''; arc.setAttribute('d', d); arc.classList.remove('draw'); if (d) { void arc.getBoundingClientRect(); arc.classList.add('draw'); } }
    var count = $('#count'); if (count) count.textContent = 'nodes_active: ' + active + '/' + REGIONS.length;
    var p = $('#panel'); if (!p) return;
    p.innerHTML = '';
    if (sid) renderBrief(p, byId(sid)); else renderOverview(p);
    if (animate) { p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade'); }
  }

  function restartTimer() {
    clearInterval(mapTimer);
    if (mapReduce || state.pillar === 'All' || state.sel) return;
    mapTimer = setInterval(function () {
      if (state.paused || state.sel || state.pillar === 'All' || document.hidden) return;
      var n = inPillar(state.pillar).length; if (n < 2) return;
      state.slide = (state.slide + 1) % n; render(true);
    }, ROTATE_MS);
  }

  function initMapPause() {
    var p = $('#panel'); if (!p) return;
    p.addEventListener('mouseenter', function () { state.paused = true; p.classList.add('is-paused'); });
    p.addEventListener('mouseleave', function () { state.paused = false; p.classList.remove('is-paused'); if (state.pillar !== 'All' && !state.sel) { render(false); restartTimer(); } });
  }

  /* ---------- Ticker ---------- */
  var tickReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  // Writes a value into every matching slot, flipping changed characters like an airport board.
  function setTick(k, v) {
    if (!v) return;
    document.querySelectorAll('[data-tick="' + k + '"]').forEach(function (n) {
      var old = n.getAttribute('data-v') || '';
      if (old === v) return;
      n.setAttribute('data-v', v);
      if (tickReduce) { n.textContent = v; return; }
      n.textContent = '';
      v.split('').forEach(function (c, i) {
        var s = document.createElement('span');
        s.textContent = c;
        if (c !== old.charAt(i)) { s.className = 'flip'; s.style.animationDelay = (i * 45) + 'ms'; }
        n.appendChild(s);
      });
    });
  }
  function getJSON(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(); return r.json(); }); }
  function coinbase(pair, key, d) { return getJSON('https://api.coinbase.com/v2/prices/' + pair + '/spot').then(function (j) { setTick(key, fmt(j.data.amount, d)); }).catch(function () {}); }
  function loadCrypto() {
    // CoinGecko first, Coinbase as a backup if CoinGecko is busy.
    getJSON('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
      .then(function (j) { setTick('btc', fmt(j.bitcoin.usd, 0)); setTick('eth', fmt(j.ethereum.usd, 0)); })
      .catch(function () { coinbase('BTC-USD', 'btc', 0); coinbase('ETH-USD', 'eth', 0); });
  }
  function loadMetals() {
    // Spot gold and silver (USD per troy ounce). Gold falls back to PAXG, a gold-backed token.
    getJSON('https://api.gold-api.com/price/XAU').then(function (j) { setTick('xau', '$' + fmt(j.price, 0)); })
      .catch(function () { coinbase('PAXG-USD', 'xau', 0).then(function () {}); });
    getJSON('https://api.gold-api.com/price/XAG').then(function (j) { setTick('xag', '$' + fmt(j.price, 2)); }).catch(function () {});
  }
  function loadFX() {
    getJSON('https://open.er-api.com/v6/latest/USD').then(function (j) {
      var r = j.rates || {};
      if (r.EUR) setTick('eurusd', fmt(1 / r.EUR, 4));
      if (r.JPY) setTick('usdjpy', fmt(r.JPY, 2));
      if (r.GBP) setTick('gbpusd', fmt(1 / r.GBP, 4));
    }).catch(function () {});
  }
  function loadTicker() {
    if (!window.fetch || !document.querySelector('[data-tick]')) return;
    loadCrypto(); loadMetals(); loadFX();
    // Crypto and metals refresh every minute (FX rates are daily).
    setInterval(function () { if (!document.hidden) { loadCrypto(); loadMetals(); } }, 60000);
  }

  /* ---------- Forms ---------- */
  function handleForm(form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      var email = form.querySelector('input[type="email"]');
      var consent = form.querySelector('input[name="consent"]');
      msg.className = 'form-msg';
      if (!email.value || !email.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; msg.classList.add('err'); email.focus(); return; }
      if (consent && !consent.checked) { msg.textContent = 'Please tick the consent box to continue.'; msg.classList.add('err'); consent.focus(); return; }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.form = form.getAttribute('data-form');
      data.page = location.href;

      if (CONFIG.formEndpoint) {
        msg.textContent = 'Sending…';
        fetch(CONFIG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
          .then(function (r) { if (!r.ok) throw new Error(); form.reset(); msg.textContent = 'Thank you. We will be in touch shortly.'; msg.classList.add('ok'); })
          .catch(function () { msg.textContent = 'Something went wrong. Please email ' + CONFIG.accessEmail + '.'; msg.classList.add('err'); });
        return;
      }
      // Fallback until a forms service is connected: open a pre-filled email.
      var isAccess = data.form === 'access';
      var to = isAccess ? CONFIG.accessEmail : CONFIG.newsletterEmail;
      var subject = isAccess ? 'Access request (' + (data.type || 'investor') + ')' : 'Subscribe to Kaywood Signals';
      var body = isAccess ? 'Name: ' + (data.name || '') + '\nCompany: ' + (data.company || '-') + '\nEmail: ' + data.email + '\nI am: ' + (data.type || '') : 'Please add ' + data.email + ' to the weekly briefing.';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Opening your email app to send the request…'; msg.classList.add('ok');
    });
  }

  /* ---------- Background network mesh ---------- */
  function initMeshBg() {
    var cv = document.getElementById('bg-mesh');
    if (!cv || !cv.getContext) return;
    var cx = cv.getContext('2d');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, pts = [], raf = null, fade = 1;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0, on: false };
    var LIME = '197,242,90', GREY = '138,148,163', D = 140;

    function seed() {
      var n = Math.round(Math.min(W < 760 ? 45 : 110, (W * H) / (W < 760 ? 16000 : 14000)));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.4 + .8, lime: Math.random() < .12 });
    }
    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed(); if (reduce) draw();
    }
    function updateFade() {
      // Full strength over the hero, calmer further down the page
      var hero = document.querySelector('.hero');
      var limit = hero ? hero.offsetTop + hero.offsetHeight : H;
      fade = Math.max(.35, 1 - (window.pageYOffset / limit) * .65);
    }
    function draw() {
      cx.clearRect(0, 0, W, H);
      var i, a, b;
      for (i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; }
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        if (mouse.on) { var dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 180 && d > 1) { p.x += dx / d * .15; p.y += dy / d * .15; } }
      }
      cx.lineWidth = 1;
      for (a = 0; a < pts.length; a++) for (b = a + 1; b < pts.length; b++) {
        var A = pts[a], B = pts[b], ex = A.x - B.x, ey = A.y - B.y, dd = ex * ex + ey * ey;
        if (dd < D * D) { cx.strokeStyle = 'rgba(' + ((A.lime || B.lime) ? LIME : GREY) + ',' + ((1 - Math.sqrt(dd) / D) * .32 * fade) + ')'; cx.beginPath(); cx.moveTo(A.x, A.y); cx.lineTo(B.x, B.y); cx.stroke(); }
      }
      if (mouse.on) for (i = 0; i < pts.length; i++) {
        var P = pts[i], mx = P.x - mouse.x, my = P.y - mouse.y, md = Math.sqrt(mx * mx + my * my);
        if (md < 180) { cx.strokeStyle = 'rgba(' + LIME + ',' + ((1 - md / 180) * .45 * fade) + ')'; cx.beginPath(); cx.moveTo(P.x, P.y); cx.lineTo(mouse.x, mouse.y); cx.stroke(); }
      }
      for (i = 0; i < pts.length; i++) {
        var q = pts[i];
        cx.fillStyle = q.lime ? 'rgba(' + LIME + ',' + (.9 * fade) + ')' : 'rgba(200,210,222,' + (.5 * fade) + ')';
        if (q.lime) { cx.shadowColor = 'rgba(' + LIME + ',.8)'; cx.shadowBlur = 10; }
        cx.beginPath(); cx.arc(q.x, q.y, q.lime ? q.r + .8 : q.r, 0, Math.PI * 2); cx.fill(); cx.shadowBlur = 0;
      }
    }
    function frame() {
      mouse.x += (mouse.tx - mouse.x) * .12; mouse.y += (mouse.ty - mouse.y) * .12;
      draw(); raf = requestAnimationFrame(frame);
    }
    function start() { if (reduce) return; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', updateFade, { passive: true });
    window.addEventListener('mousemove', function (e) { mouse.tx = e.clientX; mouse.ty = e.clientY; if (!mouse.on) { mouse.x = mouse.tx; mouse.y = mouse.ty; } mouse.on = true; });
    document.addEventListener('mouseleave', function () { mouse.on = false; });
    document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else start(); });
    resize(); updateFade(); start();
  }

  /* ---------- Tokenization machine ---------- */
  var ICONS = {
    land: '<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',
    art: '<path d="M3 4h18v16H3z"/><path d="M3 16l5-5 4 4 3-3 6 6"/><circle cx="16" cy="9" r="1.5"/>',
    shares: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    crypto: '<circle cx="12" cy="12" r="9"/><path d="M9.5 7.5h4a2.2 2.2 0 0 1 0 4.4h-4zM9.5 11.9h4.6a2.3 2.3 0 0 1 0 4.6H9.5zM9.5 7.5v9M11 6v1.5M11 16.5V18M13 6v1.5M13 16.5V18"/>'
  };
  var ASSETS = {
    land: {
      name: 'Lisbon Land Plot', type: 'Real estate · tokenized',
      stages: ['VERIFY', 'STRUCTURE', 'MINT', 'DISTRIBUTE'],
      status: ['Checking title, valuation and permits…', 'Placing the land in an SPV with a legal opinion…', 'Minting 10,000 permissioned tokens…', 'Opening the offering to verified investors…'],
      rows: [['asset', 'Land · Lisbon'], ['wrapper', 'SPV'], ['token', 'Permissioned'], ['supply', '10,000 fractions'], ['holders', 'KYC-verified only'], ['income', 'Rent & sale proceeds']],
      cta: ['Tokenize a property with us →', 'owner']
    },
    art: {
      name: 'Contemporary Artwork', type: 'Art & IP · NFT + fractions',
      stages: ['VERIFY', 'STRUCTURE', 'MINT', 'DISTRIBUTE'],
      status: ['Confirming authenticity and provenance…', 'Securing the work and setting up the rights…', 'Minting 1 NFT, split into 5,000 fractions…', 'Listing for verified collectors and investors…'],
      rows: [['asset', 'Artwork · original'], ['custody', 'Insured storage'], ['token', 'NFT + fractions'], ['supply', '5,000 fractions'], ['provenance', 'Recorded on-chain'], ['royalties', 'Paid to holders']],
      cta: ['Tokenize art or IP with us →', 'owner']
    },
    shares: {
      name: 'Private Company Shares', type: 'Equity · tokenized cap table',
      stages: ['VERIFY', 'STRUCTURE', 'MINT', 'DISTRIBUTE'],
      status: ['Reviewing the cap table and company records…', 'Setting transfer rules and shareholder rights…', 'Minting share tokens with rules built in…', 'Distributing to approved shareholders…'],
      rows: [['asset', 'Private equity'], ['wrapper', 'Share class'], ['token', 'Permissioned'], ['supply', '250,000 shares'], ['transfers', 'Rules enforced on-chain'], ['dividends', 'Paid on-chain']],
      cta: ['Tokenize your company shares →', 'owner']
    },
    crypto: {
      name: 'Bitcoin (BTC)', type: 'Digital asset · already native',
      stages: ['VERIFY', 'CUSTODY', 'ALLOCATE', 'REPORT'],
      status: ['Checking the source of funds…', 'Moving to qualified cold storage…', 'Allocating within the risk budget…', 'Reporting holdings to investors…'],
      rows: [['asset', 'Bitcoin'], ['minting', 'Not needed: native'], ['custody', 'Qualified, cold first'], ['sizing', 'Risk-budgeted'], ['reporting', 'Regular to investors'], ['holders', 'Fund investors']],
      cta: ['Request the strategy overview →', 'investor']
    }
  };

  function initMachine() {
    var svg = document.getElementById('machine-svg');
    if (!svg) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var picks = Array.prototype.slice.call(document.querySelectorAll('.asset-pick'));
    var go = document.getElementById('machine-go'), again = document.getElementById('machine-again');
    var status = document.getElementById('machine-status');
    var inAsset = document.getElementById('in-asset'), inIcon = document.getElementById('in-asset-icon');
    var coins = document.getElementById('dome-coins'), outCoin = document.getElementById('out-coin'), outIcon = document.getElementById('out-coin-icon');
    var stages = Array.prototype.slice.call(svg.querySelectorAll('.stage')), progress = document.getElementById('progress');
    var empty = document.getElementById('token-empty'), result = document.getElementById('token-result');
    var current = 'land', busy = false;

    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
    function setProgress(f) { var h = 94 * f; progress.setAttribute('height', h); progress.setAttribute('y', 383 + 0 - h + 0); }
    function labels(a) { stages.forEach(function (s, i) { s.querySelector('text').textContent = ASSETS[a].stages[i]; }); }
    function reset() {
      stages.forEach(function (s) { s.classList.remove('on'); });
      setProgress(0);
      outCoin.classList.remove('drop', 'rest');
      inAsset.classList.remove('show', 'drop');
      empty.hidden = false; result.hidden = true;
      status.textContent = 'Ready. Pick an asset and press tokenize.';
    }
    function lock(on) { busy = on; go.disabled = on; picks.forEach(function (p) { p.disabled = on; }); svg.classList.toggle('busy', on); }
    function choose(a) {
      if (busy) return;
      current = a;
      picks.forEach(function (p) { p.setAttribute('aria-pressed', p.getAttribute('data-asset') === a ? 'true' : 'false'); });
      labels(a); reset();
    }
    function showResult(a) {
      var d = ASSETS[a];
      document.getElementById('token-icon').innerHTML = ICONS[a];
      document.getElementById('token-name').textContent = d.name;
      document.getElementById('token-type').textContent = d.type;
      var rows = document.getElementById('token-rows'); rows.innerHTML = '';
      d.rows.forEach(function (r) {
        var div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
        dt.textContent = r[0]; dd.textContent = r[1]; div.appendChild(dt); div.appendChild(dd); rows.appendChild(div);
      });
      var cta = document.getElementById('token-cta'); cta.textContent = d.cta[0]; cta.setAttribute('data-role', d.cta[1]);
      empty.hidden = true; result.hidden = false;
    }
    async function run() {
      if (busy) return;
      var a = current, d = ASSETS[a];
      reset(); lock(true);
      var rb = svg.getBoundingClientRect();
      if (rb.top < 80 || rb.bottom > window.innerHeight) svg.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      inIcon.innerHTML = ICONS[a]; outIcon.innerHTML = ICONS[a];
      status.textContent = 'Feeding the ' + d.name.toLowerCase() + ' into the machine…';
      inAsset.classList.add('show'); await wait(350);
      inAsset.classList.add('drop'); await wait(800);
      coins.classList.add('spin');
      for (var i = 0; i < 4; i++) {
        status.textContent = (i + 1) + '/4 · ' + d.status[i];
        stages[i].classList.add('on'); setProgress((i + 1) / 4);
        await wait(850);
      }
      coins.classList.remove('spin');
      status.textContent = 'Done. Your token is ready.';
      outCoin.classList.add(reduce ? 'rest' : 'drop');
      await wait(700);
      showResult(a);
      lock(false);
    }

    picks.forEach(function (p) { p.addEventListener('click', function () { choose(p.getAttribute('data-asset')); }); });
    go.addEventListener('click', run);
    again.addEventListener('click', function () {
      var idx = (Object.keys(ASSETS).indexOf(current) + 1) % 4;
      choose(Object.keys(ASSETS)[idx]); go.focus();
    });
    document.getElementById('token-cta').addEventListener('click', function () {
      var r = document.getElementById('r-' + this.getAttribute('data-role')); if (r) r.checked = true;
    });
    labels(current); setProgress(0);
  }

  /* ---------- Pillar tabs ---------- */
  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.pillars [role="tab"]'));
    if (!tabs.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function select(tab, opts) {
      opts = opts || {};
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (!p) return;
        if (on) { p.hidden = false; p.classList.remove('is-active'); void p.offsetWidth; p.classList.add('is-active'); }
        else { p.hidden = true; p.classList.remove('is-active'); }
      });
      if (opts.focus) tab.focus();
      if (opts.scroll) {
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        var top = panel.getBoundingClientRect().top;
        // Only scroll if the panel's top is out of comfortable view
        if (top > window.innerHeight * 0.75 || top < 0) {
          var y = window.pageYOffset + top - 90;
          window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
        }
      }
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, { scroll: true }); history.replaceState(null, '', '#' + t.getAttribute('aria-controls')); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === 'Home') n = tabs[0];
        else if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, { focus: true }); }
      });
    });

    // Links like #market-access or #tokenization open the matching tab
    function fromHash(hash, scroll) {
      var id = (hash || '').replace('#', '');
      var tab = tabs.filter(function (t) { return t.getAttribute('aria-controls') === id; })[0];
      if (tab) {
        select(tab);
        if (scroll) {
          var panel = document.getElementById(id);
          window.scrollTo({ top: window.pageYOffset + panel.getBoundingClientRect().top - 90, behavior: reduce ? 'auto' : 'smooth' });
        }
        return true;
      }
      return false;
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (fromHash(a.getAttribute('href'), true)) { e.preventDefault(); history.replaceState(null, '', a.getAttribute('href')); }
      });
    });
    if (location.hash) setTimeout(function () { fromHash(location.hash, true); }, 50);
  }

  /* ---------- Nav + misc ---------- */
  function initNav() {
    var btn = $('.menu-btn'), nav = $('#nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }); });
  }

  function initCtas() {
    document.querySelectorAll('[data-role]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = document.getElementById('r-' + a.getAttribute('data-role')); if (r) r.checked = true;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if ($('#map')) { buildGrid(); buildFilters(); buildNodes(); render(false); initMapPause(); }
    loadTicker();
    document.querySelectorAll('form[data-form]').forEach(handleForm);
    initNav(); initCtas(); initTabs(); initMeshBg(); initMachine();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  });
})();
