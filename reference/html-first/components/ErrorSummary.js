/* ErrorSummary · progressive enhancement only (§6.4). Without JS the hash links scroll to the field and the server-rendered
   summary takes focus via autofocus. Adds: links move focus to the input itself (radio/checkbox group → checked or first option,
   enhanced Select → its trigger, collapsed <details> opened first), scrolls so the label stays visible under sticky headers
   (scroll-padding), updates the hash without trapping Back, and data-autofocus focuses the summary on render. */
(function () {
  DS.focusField = DS.focusField || function (id) {
    var t = document.getElementById(id);
    if (!t) return false;
    for (var p = t.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS' && !p.open) p.open = true;
    if (t.tagName === 'FIELDSET' || /^(radiogroup|group)$/.test(t.getAttribute('role') || '')) {
      var c = t.querySelector('input:checked') || t.querySelector('input, select, textarea, button');
      if (c) t = c;
    }
    if (t.__dsFocusProxy && getComputedStyle(t).display === 'none') t = t.__dsFocusProxy;
    var fs = t.closest('fieldset');
    var anchor = (t.id && document.querySelector('label[for="' + t.id + '"]')) || (fs && fs.querySelector('legend')) || t;
    anchor.scrollIntoView({ block: 'start' });
    t.focus({ preventScroll: true });
    return true;
  };
  DS.register('error-summary', function (el) {
    el.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || !el.contains(a)) return;
      var id = decodeURIComponent(a.getAttribute('href').slice(1));
      if (DS.focusField(id)) {
        e.preventDefault();
        if (history.replaceState && location.hash.indexOf('=') < 0) history.replaceState(null, '', '#' + id); // preview axes live in the hash
      }
    });
    if (el.hasAttribute('data-autofocus')) el.focus();
  });
})();
