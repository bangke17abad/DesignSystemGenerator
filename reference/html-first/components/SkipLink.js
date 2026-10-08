/* SkipLink · progressive enhancement for hash-based routers: activation focuses the target programmatically instead of
   changing the route. Without JS the native href="#id" + target tabindex="-1" already moves focus. Opt in with
   data-ds-module="skip-link" on the link. */
DS.register('skip-link', function (el) {
  el.addEventListener('click', function (e) {
    var id = (el.getAttribute('href') || '').replace(/^#/, '');
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start' });
  });
});
