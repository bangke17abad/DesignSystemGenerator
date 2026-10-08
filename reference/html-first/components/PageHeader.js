/* PageHeader · progressive enhancement for data-sticky headers (opt in with data-ds-module="page-header"):
   sets data-stuck while the header is pinned (background + bottom edge appear, height unchanged, I4) and drops stickiness
   when the header is taller than a third of the viewport (200% text), so content and focus stay visible (SC 2.4.11).
   Without JS a sticky header still sticks, just without the stuck edge. */
DS.register('page-header', function (el) {
  if (!el.hasAttribute('data-sticky')) return;
  function check() {
    var tall = el.offsetHeight > window.innerHeight / 3;
    if (tall) el.setAttribute('data-ds-unstick', ''); else el.removeAttribute('data-ds-unstick');
    var top = parseFloat(getComputedStyle(el).insetBlockStart) || 0;
    var stuck = !tall && Math.abs(el.getBoundingClientRect().top - top) < 1 && window.scrollY > 0;
    if (stuck) el.setAttribute('data-stuck', ''); else el.removeAttribute('data-stuck');
  }
  check();
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
});
