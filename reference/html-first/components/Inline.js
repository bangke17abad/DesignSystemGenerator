/* Inline · progressive enhancement: hides a vertical Divider that lands at the start or end of a wrapped row (orphan line).
   Without JS every Divider stays visible; nothing else depends on this module. Opt in with data-ds-module="inline". */
DS.register('inline', function (el) {
  function update() {
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      var d = kids[i];
      if (!d.classList.contains('ds-divider')) continue;
      var prev = d.previousElementSibling, next = d.nextElementSibling;
      var top = d.offsetTop;
      var orphan = !prev || !next || prev.offsetTop + prev.offsetHeight <= top || next.offsetTop >= top + d.offsetHeight;
      if (orphan) d.setAttribute('data-ds-orphan', ''); else d.removeAttribute('data-ds-orphan');
    }
  }
  update();
  if (window.ResizeObserver) new ResizeObserver(update).observe(el);
});
