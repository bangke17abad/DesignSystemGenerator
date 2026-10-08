/* DescriptionList · engine 1.8.0 reference module (catalog/components/DescriptionList.json). Progressive enhancement only (§6.4):
   the list itself needs no JS (values stay selectable and copyable by hand). This module, on dl[data-ds-module="description-list"]:
   - reveals Copy buttons ([data-ds-copy], rendered hidden for no-JS) and copies the value, announcing "Copied" politely;
   - marks a row changed (data-changed) when its value is replaced via the ds:valuechange event, announces "Updated" once and
     removes the highlight after a while (no highlight animation under reduced motion). */
(function () {
  var DS = (window.DS = window.DS || {});
  DS.register('description-list', function (dl) {
    Array.prototype.forEach.call(dl.querySelectorAll('[data-ds-copy][hidden]'), function (b) { b.hidden = false; });
    dl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-copy]');
      if (!b || !dl.contains(b) || b.getAttribute('aria-disabled') === 'true') return;
      var dd = b.closest('dd');
      var src = dd && (dd.querySelector('.ds-description-list__value') || dd);
      var text = src ? src.textContent.replace(/\s+/g, ' ').trim() : '';
      var done = function () { if (DS.announce) DS.announce(b.getAttribute('data-msg-copied') || 'Copied', 'polite'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done); else done();
    });
    dl.addEventListener('ds:valuechange', function (e) {
      var g = e.target.closest('.ds-description-list__group');
      if (!g) return;
      g.setAttribute('data-changed', '');
      var term = g.querySelector('dt');
      if (DS.announce) DS.announce((term ? term.textContent.trim() + ' ' : '') + 'updated', 'polite');
      window.setTimeout(function () { g.removeAttribute('data-changed'); }, 4000);
    });
  });
})();
