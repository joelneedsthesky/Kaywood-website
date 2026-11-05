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

  /* ---------- Signal map data (edit regions here) ---------- */
  var REGIONS = [
    { id: 'ao', code: 'AO', name: 'Angola', x: 53.6, y: 63.75, status: 'Core focus', pillars: ['Tokenization', 'FX', 'Market access'], themes: ['Kwanza (AOA) liquidity and FX reform', 'Diversification beyond oil', 'Real estate and infrastructure for tokenization', 'Institutional partnerships'] },
    { id: 'mz', code: 'MZ', name: 'Mozambique', x: 59.1, y: 75.5, status: 'Watching', pillars: ['FX', 'Market access'], themes: ['LNG-linked investment', 'Metical stability', 'Port and corridor infrastructure'] },
    { id: 'wa', code: 'NG·GH', name: 'Nigeria & Ghana', x: 50.8, y: 53, status: 'Active research', pillars: ['Crypto', 'FX'], themes: ['Naira and cedi currency reforms', 'Stablecoin adoption and remittances', 'Fintech and digital payment rails'] },
    { id: 'pt', code: 'PT', name: 'Portugal', x: 47.5, y: 30.6, status: 'Home base', pillars: ['Tokenization', 'Crypto'], themes: ['EU gateway for Lusophone capital', 'Lisbon property as tokenized assets', 'MiCA and the DLT Pilot Regime'] },
    { id: 'br', code: 'BR', name: 'Brazil', x: 37.2, y: 73.75, status: 'Watching', pillars: ['Tokenization', 'Crypto', 'FX'], themes: ['The real (BRL) and the rate cycle', 'Central bank tokenization pilots', 'Lusophone trade links with Africa'] },
    { id: 'ae', code: 'AE', name: 'UAE & Gulf', x: 65.3, y: 40.1, status: 'Partner market', pillars: ['Tokenization', 'Crypto', 'Market access'], themes: ['Sovereign capital flows into Africa', 'Digital asset licensing hubs', 'Investor demand for tokenized real assets'] },
    { id: 'us', code: 'US', name: 'United States', x: 29.4, y: 29.2, status: 'Macro driver', pillars: ['FX', 'Crypto', 'Tokenization'], themes: ['Federal Reserve policy and the dollar', 'Crypto ETF flows', 'Tokenized treasuries and funds'] },
    { id: 'cn', code: 'CN', name: 'China', x: 83.6, y: 36, status: 'Macro driver', pillars: ['FX', 'Market access'], themes: ['Yuan internationalisation', 'Commodity demand and investment in Africa', 'Supply-chain realignment'] }
  ];
  var PILLARS = ['All', 'Tokenization', 'Crypto', 'FX', 'Market access'];
  var HUB = { x: 475, y: 142 };      // Lisbon in map coordinates
  var HUB2 = { x: 536, y: 275 };     // Luanda

  var state = { sel: 'ao', pillar: 'All' };

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- Map ---------- */
  function buildGrid() {
    var g = $('#grid'); if (!g) return;
    var ns = 'http://www.w3.org/2000/svg';
    for (var y = 70; y <= 370; y += 50) { var l = document.createElementNS(ns, 'line'); l.setAttribute('x1', 0); l.setAttribute('x2', 1000); l.setAttribute('y1', y); l.setAttribute('y2', y); g.appendChild(l); }
    for (var x = 100; x <= 900; x += 100) { var v = document.createElementNS(ns, 'line'); v.setAttribute('y1', 20); v.setAttribute('y2', 420); v.setAttribute('x1', x); v.setAttribute('x2', x); g.appendChild(v); }
  }

  function arcFor(r) {
    var tx = r.x * 10, ty = r.y * 4 + 20;
    var f = r.id === 'pt' ? HUB2 : HUB;
    var dx = tx - f.x, dy = ty - f.y, dist = Math.sqrt(dx * dx + dy * dy);
    var cx = (f.x + tx) / 2, cy = Math.min(f.y, ty) - dist * 0.25;
    return 'M' + f.x + ',' + f.y + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + tx.toFixed(1) + ',' + ty.toFixed(1);
  }

  function buildFilters() {
    var wrap = $('#filters'); if (!wrap) return;
    PILLARS.forEach(function (p) {
      var b = el('button', { type: 'button', 'class': 'chip', 'aria-pressed': p === state.pillar ? 'true' : 'false' }, p);
      b.addEventListener('click', function () { state.pillar = p; render(); });
      wrap.appendChild(b);
    });
  }

  function buildNodes() {
    var wrap = $('#nodes'); if (!wrap) return;
    REGIONS.forEach(function (r) {
      var b = el('button', { type: 'button', 'class': 'node', 'data-id': r.id, 'aria-label': r.name + ' — ' + r.status });
      b.style.left = r.x + '%'; b.style.top = r.y + '%';
      b.appendChild(el('span', { 'class': 'node__dot', 'aria-hidden': 'true' }));
      b.appendChild(el('span', { 'class': 'node__label', 'aria-hidden': 'true' }, r.code));
      b.addEventListener('click', function () { if (state.sel !== r.id) { state.sel = r.id; render(true); } });
      wrap.appendChild(b);
    });
  }

  function renderPanel(r, animate) {
    var p = $('#panel'); if (!p) return;
    p.innerHTML = '';
    var top = el('div', { 'class': 'panel__top' });
    top.appendChild(el('span', { 'class': 'mono muted' }, 'node / ' + r.code));
    top.appendChild(el('span', { 'class': 'badge' }, r.status));
    p.appendChild(top);
    p.appendChild(el('h3', {}, r.name));
    p.appendChild(el('p', { 'class': 'mono blue' }, r.pillars.join(' · ')));
    var ul = el('ul', {});
    r.themes.forEach(function (t) { ul.appendChild(el('li', {}, t)); });
    p.appendChild(ul);
    p.appendChild(el('a', { href: '#signals' }, 'latest_signals →'));
    if (animate) { p.classList.remove('fade'); void p.offsetWidth; p.classList.add('fade'); }
  }

  function render(animate) {
    var active = 0;
    document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c.textContent === state.pillar ? 'true' : 'false'); });
    document.querySelectorAll('.node').forEach(function (n) {
      var r = REGIONS.filter(function (x) { return x.id === n.getAttribute('data-id'); })[0];
      var on = state.pillar === 'All' || r.pillars.indexOf(state.pillar) !== -1;
      if (on) active++;
      n.classList.toggle('is-dim', !on);
      n.classList.toggle('is-active', r.id === state.sel);
      n.setAttribute('aria-pressed', r.id === state.sel ? 'true' : 'false');
    });
    var cur = REGIONS.filter(function (x) { return x.id === state.sel; })[0];
    var arc = $('#arc');
    if (arc) { arc.setAttribute('d', arcFor(cur)); arc.classList.remove('draw'); void arc.getBoundingClientRect(); arc.classList.add('draw'); }
    var count = $('#count'); if (count) count.textContent = 'nodes_active: ' + active + '/' + REGIONS.length;
    renderPanel(cur, animate);
  }

  /* ---------- Ticker ---------- */
  function fmt(n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); }
  function setTick(k, v) { var n = document.querySelector('[data-tick="' + k + '"]'); if (n && v) n.textContent = v; }
  function loadTicker() {
    if (!window.fetch) return;
    // Crypto: CoinGecko first, Coinbase as a backup if CoinGecko is busy.
    function coinbase(pair, key) {
      return fetch('https://api.coinbase.com/v2/prices/' + pair + '/spot')
        .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
        .then(function (j) { setTick(key, fmt(j.data.amount, 0)); })
        .catch(function () {});
    }
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd')
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (j) { setTick('btc', fmt(j.bitcoin.usd, 0)); setTick('eth', fmt(j.ethereum.usd, 0)); })
      .catch(function () { coinbase('BTC-USD', 'btc'); coinbase('ETH-USD', 'eth'); });
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var r = j.rates || {};
        if (r.EUR) setTick('eurusd', fmt(1 / r.EUR, 4));
        if (r.AOA) setTick('usdaoa', fmt(r.AOA, 1));
        if (r.BRL) setTick('usdbrl', fmt(r.BRL, 3));
      })
      .catch(function () {});
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
      var body = isAccess ? 'Name: ' + (data.name || '') + '\nEmail: ' + data.email + '\nI am: ' + (data.type || '') : 'Please add ' + data.email + ' to the weekly briefing.';
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Opening your email app to send the request…'; msg.classList.add('ok');
    });
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
        var sel = $('#a-type'); if (sel) sel.value = a.getAttribute('data-role');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if ($('#map')) { buildGrid(); buildFilters(); buildNodes(); render(false); }
    loadTicker();
    document.querySelectorAll('form[data-form]').forEach(handleForm);
    initNav(); initCtas(); initTabs();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  });
})();
