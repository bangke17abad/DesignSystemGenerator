/* RadioGroup · progressive enhancement only (§6.4). Native radios submit, rove and respond to arrows without JS.
   Adds: read-only groups (aria-readonly) where arrows move focus without changing the choice, and blocked options/groups
   (aria-disabled) that stay reachable and readable but are never selected; the reason is announced politely. */
DS.register('radio-group', function (el) {
  var radios = function () { return Array.prototype.slice.call(el.querySelectorAll('.ds-radio-group__input')); };
  var readOnly = function () { return el.getAttribute('aria-readonly') === 'true'; };
  var blocked = function (r) { return el.getAttribute('aria-disabled') === 'true' || r.getAttribute('aria-disabled') === 'true'; };
  var reasonOf = function (r) {
    var ids = ((r.getAttribute('aria-describedby') || '') + ' ' + (el.getAttribute('aria-describedby') || '')).split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && /reason|description/.test(n.className)) return n.textContent.trim(); }
    return '';
  };
  var managed = function () { return readOnly() || radios().some(blocked); };
  el.addEventListener('click', function (e) {
    var r = e.target.closest && e.target.closest('.ds-radio-group__input');
    if (!r) return;
    if (readOnly() || blocked(r)) {
      e.preventDefault(); // keeps the previous choice
      if (blocked(r)) DS.announce(reasonOf(r), 'polite');
    }
  });
  el.addEventListener('keydown', function (e) {
    var r = e.target;
    if (!r.classList || !r.classList.contains('ds-radio-group__input') || !managed()) return;
    var rtl = getComputedStyle(el).direction === 'rtl';
    var step = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (e.key === ' ' && (readOnly() || blocked(r))) { e.preventDefault(); if (blocked(r)) DS.announce(reasonOf(r), 'polite'); return; }
    if (!step) return;
    e.preventDefault();
    var list = radios();
    var next = list[(list.indexOf(r) + step + list.length) % list.length];
    next.focus();
    if (!readOnly() && !blocked(next)) { next.checked = true; next.dispatchEvent(new Event('change', { bubbles: true })); }
  });
});
