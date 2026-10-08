/* Spinner · enhancement only. Put data-ds-module="spinner" on a standalone .ds-spinner[role=status].
   - the label text is inserted only when the spinner appears (after --timing-indicator-delay), so waits under the delay are
     never announced; without JS the text is simply present
   - after --timing-spinner-max (2 s) it dispatches "ds:escalate" (bubbles) once: the owner swaps in Skeleton or ProgressBar
     and announces "Loading {content}" once; a spinner never keeps turning on its own
   - DS.spinnerDone(el, cb) keeps a shown spinner for at least --timing-indicator-min-visible so it never flickers.
   in-control spinners need no script: the control carries aria-busy="true" and the result is announced by its owner. */
(function () {
  function ms(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return /ms$/.test(v) ? n : (/s$/.test(v) ? n * 1000 : n);
  }
  DS.register('spinner', function (el) {
    if (el.getAttribute('data-variant') === 'in-control') return;
    var label = el.querySelector('.ds-spinner__label');
    var text = label ? label.textContent : '';
    var delay = ms('--timing-indicator-delay', 300);
    el.__dsShownAt = Date.now() + delay;
    if (label) {
      label.textContent = '';
      window.setTimeout(function () { if (document.contains(el)) label.textContent = text; }, delay);
    }
    window.setTimeout(function () {
      if (!document.contains(el) || el.hidden) return;
      el.dispatchEvent(new CustomEvent('ds:escalate', { bubbles: true, detail: { label: text } }));
    }, ms('--timing-spinner-max', 2000));
  });
  DS.spinnerDone = function (el, cb) {
    var shown = el.__dsShownAt || 0;
    var now = Date.now();
    if (now < shown) { cb(); return; } // never became visible
    var wait = Math.max(0, shown + ms('--timing-indicator-min-visible', 500) - now);
    window.setTimeout(cb, wait);
  };
})();
