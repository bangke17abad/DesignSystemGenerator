/* InlineMetrics · engine 1.8.0 reference module (catalog/components/InlineMetrics.json). Progressive enhancement only (§6.4):
   values, deltas and freshness are plain text; the metric definition is a native <details> disclosure that works without JS.
   This module (on dl[data-ds-module="inline-metrics"]) adds: Esc closes an open definition and returns focus to its trigger,
   opening one definition closes the others, and Retry ([data-ds-retry]) shows a busy state and announces the result politely.
   It never announces every live tick (no aria-live on values). */
(function () {
  var DS = (window.DS = window.DS || {});
  DS.register('inline-metrics', function (dl) {
    var defs = function () { return Array.prototype.slice.call(dl.querySelectorAll('.ds-inline-metrics__def')); };
    dl.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d.classList || !d.classList.contains('ds-inline-metrics__def') || !d.open) return;
      defs().forEach(function (o) { if (o !== d) o.open = false; });
    }, true);
    dl.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var d = e.target.closest('.ds-inline-metrics__def[open]');
      if (!d) return;
      e.stopPropagation();
      d.open = false;
      d.querySelector('summary').focus();
    });
    dl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-retry]');
      if (!b || !dl.contains(b) || b.getAttribute('aria-busy') === 'true') return;
      b.setAttribute('aria-busy', 'true');
      var item = b.closest('.ds-inline-metrics__item');
      var label = item && item.querySelector('dt');
      dl.dispatchEvent(new CustomEvent('ds:retry', { bubbles: true, detail: { metricId: item && item.getAttribute('data-metric-id') } }));
      window.setTimeout(function () {
        b.removeAttribute('aria-busy');
        if (DS.announce) DS.announce((label ? label.textContent.trim() + ': ' : '') + (b.getAttribute('data-msg-failed') || "still couldn't load"), 'polite');
      }, 600);
    });
  });
})();
