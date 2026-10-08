/* Link · progressive enhancement for a blocked link (role="link" aria-disabled="true", no href): Enter or click does not
   navigate (there is no href) and the visible reason is announced politely. Without JS the reason is already visible and
   referenced by aria-describedby. Opt in with data-ds-module="link". */
DS.register('link', function (el) {
  if (el.getAttribute('aria-disabled') !== 'true') return;
  function say(e) {
    if (e.type === 'keydown' && e.key !== 'Enter') return;
    e.preventDefault();
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    var text = ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
    if (text && DS.announce) DS.announce(text, 'polite');
  }
  el.addEventListener('click', say);
  el.addEventListener('keydown', say);
});
