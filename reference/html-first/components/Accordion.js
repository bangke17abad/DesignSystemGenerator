/* Accordion · engine 1.8.0 reference module (catalog/components/Accordion.json). Progressive enhancement only (§6.4):
   every item is a native <details>, so toggling, keyboard (Enter/Space on summary) and find-in-page work without JS.
   This module (on .ds-accordion[data-ds-module="accordion"]) adds:
   - panels that contain an error ([aria-invalid="true"], .ds-accordion__item[data-invalid]) open automatically on load,
     after a failed submit (invalid events) and on the ds:errors event; ErrorSummary links into a closed panel open it;
   - deep links (#id inside a closed panel) open the panel and move focus to the target;
   - variant single: native `name` exclusivity, polyfilled where unsupported;
   - ↑/↓/Home/End between triggers (groups of more than five items, or data-arrows);
   - Expand all / Collapse all ([data-ds-accordion-all="open|close"], aria-controls = accordion id);
   - lazy panels (data-lazy + <template>): Skeleton + aria-busy, content after load; closing cancels the load. */
(function () {
  var DS = (window.DS = window.DS || {});
  function items(root) { return Array.prototype.slice.call(root.querySelectorAll(':scope > .ds-accordion__item')); }
  function openFor(el) {
    var d = el && el.closest && el.closest('details.ds-accordion__item');
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest('details.ds-accordion__item'); }
  }

  DS.register('accordion', function (root) {
    function openErrors() {
      root.querySelectorAll('[aria-invalid="true"], .ds-accordion__item[data-invalid] > .ds-accordion__panel').forEach(openFor);
    }
    openErrors();
    root.addEventListener('invalid', function (e) { openFor(e.target); }, true);
    root.addEventListener('ds:errors', openErrors);
    var form = root.closest('form');
    if (form) form.addEventListener('submit', function () { window.setTimeout(openErrors, 0); });

    function fromHash() {
      if (!location.hash || location.hash.length < 2) return;
      var t = null;
      try { t = root.querySelector(location.hash); } catch (err) { return; }
      if (!t) return;
      openFor(t);
      if (!t.matches('a, button, input, select, textarea, summary, [tabindex]')) t.setAttribute('tabindex', '-1');
      t.focus();
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (t && root.contains(t)) openFor(t);
    });

    // single: polyfill the exclusive `name` group where the browser does not close siblings itself
    root.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d.classList || !d.classList.contains('ds-accordion__item')) return;
      var name = d.getAttribute('name');
      if (d.open && name) items(root).forEach(function (o) { if (o !== d && o.getAttribute('name') === name && o.open) o.open = false; });
      if (d.hasAttribute('data-lazy')) lazy(d);
    }, true);

    function lazy(d) {
      var panel = d.querySelector('.ds-accordion__panel');
      var tpl = d.querySelector('template');
      if (!panel || !tpl) return;
      if (!d.open) { window.clearTimeout(d.__dsLoad); if (panel.getAttribute('aria-busy') === 'true') panel.removeAttribute('aria-busy'); return; }
      if (d.__dsLoaded) return;
      panel.setAttribute('aria-busy', 'true');
      d.__dsLoad = window.setTimeout(function () {
        var sk = panel.querySelector('.ds-accordion__skeleton');
        if (sk) sk.remove();
        panel.appendChild(tpl.content.cloneNode(true));
        panel.removeAttribute('aria-busy');
        d.__dsLoaded = true;
      }, 700);
    }

    var arrows = root.hasAttribute('data-arrows') || items(root).length > 5;
    if (arrows) root.addEventListener('keydown', function (e) {
      var s = e.target.closest('.ds-accordion__trigger');
      if (!s || !root.contains(s)) return;
      var all = Array.prototype.slice.call(root.querySelectorAll(':scope > .ds-accordion__item > .ds-accordion__trigger, :scope > .ds-accordion__item > .ds-accordion__heading-wrap > .ds-accordion__trigger'));
      var i = all.indexOf(s), t = null;
      if (e.key === 'ArrowDown') t = all[Math.min(i + 1, all.length - 1)];
      else if (e.key === 'ArrowUp') t = all[Math.max(i - 1, 0)];
      else if (e.key === 'Home') t = all[0];
      else if (e.key === 'End') t = all[all.length - 1];
      if (!t) return;
      e.preventDefault();
      t.focus();
    });

    if (root.id) document.querySelectorAll('[data-ds-accordion-all][aria-controls="' + root.id + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('data-ds-accordion-all') === 'open';
        items(root).forEach(function (d) { if (d.tagName === 'DETAILS' && !d.hasAttribute('name')) d.open = open; });
        if (DS.announce) DS.announce(open ? 'All sections expanded' : 'All sections collapsed', 'polite');
      });
    });

    // blocked items (aria-disabled button, no panel): read the reason
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.ds-accordion__trigger[aria-disabled="true"]');
      if (!b) return;
      var r = document.getElementById((b.getAttribute('aria-describedby') || '').split(' ')[0]);
      if (r && DS.announce) DS.announce(r.textContent.trim(), 'polite');
    });
  });
})();
