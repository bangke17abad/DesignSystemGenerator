/* FilterChip: toggles aria-pressed, keeps the "Filter (n)" count in sync and announces the result count change politely.
   Blocked chips announce their reason instead of toggling. */
DS.register('filter-chips', function (bar) {
  var chips = bar.querySelectorAll('.ds-filter-chip');
  var count = bar.querySelector('.ds-filter-bar__count');
  function sync() {
    var n = bar.querySelectorAll('.ds-filter-chip[aria-pressed="true"]').length;
    if (count) count.textContent = String(n);
    return n;
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      if (c.getAttribute('aria-disabled') === 'true') {
        var r = document.getElementById(c.getAttribute('aria-describedby') || '');
        if (r) DS.announce(r.textContent, 'polite');
        return;
      }
      c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var n = sync();
      DS.announce((bar.getAttribute('data-active-text') || '{n} filters active').replace('{n}', n), 'polite');
    });
  });
  var clear = bar.querySelector('.ds-filter-bar__clear');
  if (clear) clear.addEventListener('click', function () { chips.forEach(function (c) { if (c.getAttribute('aria-disabled') !== 'true') c.setAttribute('aria-pressed', 'false'); }); sync(); DS.announce(bar.getAttribute('data-cleared-text') || 'Filters cleared', 'polite'); });
  sync();
});
