/* Skeleton · enhancement only. Put data-ds-module="skeleton" on the labelled region that carries aria-busy="true".
   - waits under 2 s are not announced; after 2 s "Loading {label}" is announced once (polite)
   - after 10 s the hidden .ds-skeleton__status ("Still loading {label}…") is shown, announced once, and motion stops (SC 2.2.2)
   - when the product sets aria-busy="false" (content arrived) all timers stop; the product announces the result ("24 invoices"). */
DS.register('skeleton', function (region) {
  var label = region.getAttribute('data-ds-label') || '';
  var status = region.querySelector('.ds-skeleton__status');
  var t1 = null;
  var t2 = null;
  function busy() { return region.getAttribute('aria-busy') === 'true'; }
  function clear() { window.clearTimeout(t1); window.clearTimeout(t2); t1 = t2 = null; }
  function arm() {
    clear();
    if (!busy()) return;
    t1 = window.setTimeout(function () { if (busy() && label) DS.announce('Loading ' + label, 'polite'); }, 2000);
    t2 = window.setTimeout(function () {
      if (!busy()) return;
      region.setAttribute('data-effect', 'none');
      if (status) { status.hidden = false; DS.announce(status.textContent.trim(), 'polite'); }
    }, 10000);
  }
  new MutationObserver(function () { if (busy()) arm(); else clear(); }).observe(region, { attributes: true, attributeFilter: ['aria-busy'] });
  arm();
});
