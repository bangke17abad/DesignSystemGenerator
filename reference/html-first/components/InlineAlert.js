/* InlineAlert · enhancement only: dismiss for C3-C5 (critical and warning stay until the condition clears).
   The alert's own role=status/alert node reads insertions; DS.announce is not called for the same text (no double read). */
DS.register('inline-alert', function (el) {
  var status = el.getAttribute('data-status');
  var dismiss = el.querySelector('.ds-inline-alert__dismiss');
  if (!dismiss) return;
  if (status === 'critical' || status === 'warning') { dismiss.hidden = true; return; }
  dismiss.addEventListener('click', function () {
    // focus moves to the next focusable after the alert, or to the nearest section heading (§9.5)
    var focusables = Array.prototype.slice.call(document.querySelectorAll('a[href], button:not([hidden]), input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    var next = null;
    for (var i = 0; i < focusables.length; i++) {
      if (!el.contains(focusables[i]) && (el.compareDocumentPosition(focusables[i]) & Node.DOCUMENT_POSITION_FOLLOWING)) { next = focusables[i]; break; }
    }
    if (!next) {
      var section = el.closest('section, main');
      next = section && section.querySelector('h1, h2, h3, h4');
      if (next && !next.hasAttribute('tabindex')) next.setAttribute('tabindex', '-1');
    }
    el.hidden = true;
    el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false } }));
    if (next) next.focus();
  });
});
