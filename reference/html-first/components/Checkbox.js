/* Checkbox · progressive enhancement only (§6.4). Native checkboxes toggle and submit without JS.
   Adds: indeterminate from data-indeterminate (aria-checked="mixed"), blocked (aria-disabled) and read-only (aria-readonly) rows
   that never toggle (the reason is announced politely), and "Select all" parents (aria-controls) that update enabled children
   only and announce "n of m selected". Module goes on a single .ds-checkbox or on a .ds-checkbox-group. */
DS.register('checkbox', function (el) {
  var inputs = el.querySelectorAll('.ds-checkbox__input');
  Array.prototype.forEach.call(inputs, function (i) { if (i.hasAttribute('data-indeterminate')) i.indeterminate = true; });
  var reasonOf = function (input) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var k = 0; k < ids.length; k++) { var r = ids[k] && document.getElementById(ids[k]); if (r) return r.textContent.trim(); }
    return '';
  };
  var locked = function (i) { return i.getAttribute('aria-disabled') === 'true' || i.getAttribute('aria-readonly') === 'true'; };
  var childrenOf = function (parent) {
    return (parent.getAttribute('aria-controls') || '').split(/\s+/).map(function (id) { return id && document.getElementById(id); }).filter(Boolean);
  };
  var syncParent = function (parent, announce) {
    var kids = childrenOf(parent);
    var on = kids.filter(function (k) { return k.checked; }).length;
    parent.checked = on === kids.length && on > 0;
    parent.indeterminate = on > 0 && on < kids.length;
    var count = parent.closest('.ds-checkbox').querySelector('[data-select-count]');
    var text = (parent.getAttribute('data-msg-count') || '{n} of {total} selected').replace('{n}', on).replace('{total}', kids.length);
    if (count) count.textContent = text;
    if (announce) DS.announce(text, 'polite');
  };
  var parents = el.querySelectorAll('.ds-checkbox__input[aria-controls]');
  Array.prototype.forEach.call(parents, function (p) { syncParent(p, false); });
  el.addEventListener('click', function (e) {
    var input = e.target.closest && e.target.closest('.ds-checkbox__input');
    if (!input || !el.contains(input)) return;
    if (locked(input)) {
      e.preventDefault(); // restores the previous checked/indeterminate state
      if (input.getAttribute('aria-disabled') === 'true') DS.announce(reasonOf(input), 'polite');
    }
  });
  el.addEventListener('change', function (e) {
    var input = e.target;
    if (!input.classList || !input.classList.contains('ds-checkbox__input')) return;
    if (input.hasAttribute('aria-controls')) {
      // mixed always moves to checked; only enabled children change
      childrenOf(input).forEach(function (k) { if (!locked(k)) k.checked = input.checked; });
      syncParent(input, true);
      return;
    }
    Array.prototype.forEach.call(parents, function (p) { if (childrenOf(p).indexOf(input) >= 0) syncParent(p, true); });
  });
});
