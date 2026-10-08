/* Documentation site behaviour · engine 1.8.0. No network; storage wrapped in try/catch; works when storage is empty (§16.2). */
(function () {
  var INDEX = /*SEARCH_INDEX*/null;
  var html = document.documentElement;
  var root = (document.querySelector('link[href$="assets/site.css"]').getAttribute('href') || '').replace('assets/site.css', '');
  function store(k, v) { try { if (v === undefined) return localStorage.getItem('ds-site-' + k); localStorage.setItem('ds-site-' + k, v); } catch (e) { return null; } }
  function axes() { var o = {}; document.querySelectorAll('[data-axis]').forEach(function (s) { o[s.getAttribute('data-axis')] = s.value; }); return o; }
  function apply() {
    var a = axes();
    ['theme', 'brand', 'density'].forEach(function (k) { if (a[k]) html.setAttribute('data-' + k, a[k]); });
    if (a.dir) html.setAttribute('dir', a.dir);
    document.querySelectorAll('iframe.site-preview').forEach(function (f) {
      try { f.contentWindow.postMessage({ type: 'ds:axes', axes: a }, '*'); } catch (e) {}
      var base = f.getAttribute('src').split('#')[0];
      f.setAttribute('data-src', base + '#' + Object.keys(a).map(function (k) { return k + '=' + encodeURIComponent(a[k]); }).join('&'));
    });
  }
  document.querySelectorAll('[data-axis]').forEach(function (s) {
    var saved = store(s.getAttribute('data-axis'));
    if (saved && [].some.call(s.options, function (o) { return o.value === saved; })) s.value = saved;
    s.addEventListener('change', function () { store(s.getAttribute('data-axis'), s.value); apply(); });
  });
  document.querySelectorAll('iframe.site-preview').forEach(function (f) { f.addEventListener('load', apply); });
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'ds:height') return;
    document.querySelectorAll('iframe.site-preview').forEach(function (f) { if (f.contentWindow === e.source) f.style.blockSize = Math.max(320, e.data.height + 16) + 'px'; });
  });
  apply();
  // phone: collapse the navigation behind a toggle (visible as a full list without JavaScript)
  var nav = document.querySelector('.site-nav');
  if (nav && window.matchMedia('(max-width: 1023.98px)').matches) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'site-nav__toggle'; b.setAttribute('aria-expanded', 'false');
    b.textContent = (html.lang === 'id' ? 'Menu navigasi' : 'Navigation menu');
    var list = document.createElement('div'); list.id = 'site-nav-list'; list.hidden = true;
    while (nav.firstChild) list.appendChild(nav.firstChild);
    b.setAttribute('aria-controls', 'site-nav-list');
    nav.appendChild(b); nav.appendChild(list);
    b.addEventListener('click', function () { var open = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', String(!open)); list.hidden = open; });
  }
  // offline search (Ctrl/Cmd + K)
  var input = document.getElementById('site-search'), out = document.getElementById('site-search-results'), count = document.getElementById('site-search-count');
  if (input && INDEX) {
    var run = function () {
      var q = input.value.trim().toLowerCase();
      if (!q) { out.hidden = true; out.innerHTML = ''; count.textContent = ''; return; }
      var hits = INDEX.filter(function (p) { return (p.t + ' ' + p.x).toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
      out.innerHTML = hits.map(function (h) { return '<a href="' + root + h.p + '">' + h.t.replace(/</g, '&lt;') + '<span>' + h.p + '</span></a>'; }).join('');
      out.hidden = !hits.length;
      count.textContent = hits.length + ' ' + input.getAttribute('data-results');
    };
    var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 300); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; run(); } });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); } });
  }
})();
