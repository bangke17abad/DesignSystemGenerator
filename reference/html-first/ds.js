/* Engine 1.8.0 · html-first reference · module loader (classic script: works from file:// without a server).
   Components register with DS.register(name, init). Elements opt in with data-ds-module="name".
   Core content and actions work without JavaScript (§6.4); modules only enhance. "DS" is renamed to {NS} when packaged. */
(function () {
  var DS = (window.DS = window.DS || {});
  var registry = {};
  DS.register = function (name, init) { registry[name] = init; };
  DS.init = function (root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-ds-module]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.__dsInit) continue;
      var names = el.getAttribute('data-ds-module').split(/\s+/);
      for (var j = 0; j < names.length; j++) {
        var fn = registry[names[j]];
        if (fn) { try { fn(el); } catch (e) { console.error('[DS] ' + names[j] + ' failed to initialise', e); } }
      }
      el.__dsInit = true;
    }
  };
  /* LiveAnnouncer: one polite and one assertive region per document, created at load (not when a message appears). */
  DS.announce = function (message, politeness) {
    var id = politeness === 'assertive' ? 'ds-live-assertive' : 'ds-live-polite';
    var region = document.getElementById(id);
    if (!region) return;
    region.textContent = '';
    window.setTimeout(function () { region.textContent = message; }, 50);
  };
  function ensureRegions() {
    ['polite', 'assertive'].forEach(function (p) {
      if (document.getElementById('ds-live-' + p)) return;
      var r = document.createElement('div');
      r.id = 'ds-live-' + p;
      r.className = 'ds-vh';
      r.setAttribute('aria-live', p);
      r.setAttribute('aria-atomic', 'true');
      document.body.appendChild(r);
    });
  }
  /* Theme, brand and density axes come from the URL hash or a postMessage from the docs site (§16.2). */
  function applyAxes(axes) {
    var html = document.documentElement;
    ['theme', 'brand', 'density', 'modality'].forEach(function (k) {
      if (axes[k]) html.setAttribute('data-' + k, axes[k]);
    });
    if (axes.dir) html.setAttribute('dir', axes.dir);
  }
  function fromHash() {
    var out = {};
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return out;
  }
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'ds:axes') applyAxes(e.data.axes || {});
  });
  window.addEventListener('hashchange', function () { applyAxes(fromHash()); });
  applyAxes(fromHash());
  function boot() {
    ensureRegions();
    DS.init(document);
    if (window.parent !== window) {
      var post = function () { window.parent.postMessage({ type: 'ds:height', height: document.documentElement.scrollHeight, page: location.pathname }, '*'); };
      post();
      if (window.ResizeObserver) new ResizeObserver(post).observe(document.body);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
