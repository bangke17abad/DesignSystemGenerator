/* AppShell · progressive enhancement (catalog/components/AppShell.json). Opt in with data-ds-module="app-shell" on the root.
   Without JS: every region is in the page, the phone nav stays in the flow, the menu button stays hidden.
   With JS: phone/tablet nav becomes a modal drawer (menu button aria-expanded/aria-controls, background inert, focus to the
   first item, Esc / scrim / close button close it and return focus); Esc closes a tablet overlay panel; the nav collapses
   to a rail on desktop when nav + panel + layout-content-min do not fit; header and bottom bar stop being sticky when they
   take more than a third of the viewport (200% text). The live regions stay outside the inert subtree (ds.js, body end). */
DS.register('app-shell', function (root) {
  var nav = root.querySelector('.ds-app-shell__nav');
  var toggle = root.querySelector('.ds-app-shell__menu-button');
  var scrim = root.querySelector('.ds-app-shell__scrim');
  var header = root.querySelector('.ds-app-shell__header');
  var bottom = root.querySelector('.ds-app-shell__bottom-bar');
  var aside = root.querySelector('.ds-app-shell__aside');
  var cs = function (name) { return parseFloat(getComputedStyle(root).getPropertyValue(name)) || 0; };
  root.setAttribute('data-ds-enhanced', '');

  function background() {
    return Array.prototype.filter.call(root.children, function (c) { return c !== nav && c !== scrim && !c.classList.contains('ds-skip-links'); });
  }
  function isDrawer() { return window.innerWidth < cs('--bp-desktop'); } /* same viewport test as the CSS media query */
  function open() {
    if (!nav || !isDrawer()) return;
    root.setAttribute('data-nav', 'open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    background().forEach(function (el) { el.inert = true; });
    var first = nav.querySelector('a[href], button:not([disabled])');
    if (first) first.focus();
  }
  function close(restore) {
    if (root.getAttribute('data-nav') !== 'open') return;
    root.removeAttribute('data-nav');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    background().forEach(function (el) { el.inert = false; });
    if (restore !== false && toggle) toggle.focus();
  }
  if (toggle && nav) {
    if (!nav.id) nav.id = 'ds-shell-nav-' + Math.random().toString(36).slice(2, 8);
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-expanded', root.getAttribute('data-nav') === 'open' ? 'true' : 'false');
    toggle.addEventListener('click', function () { if (root.getAttribute('data-nav') === 'open') close(); else open(); });
  }
  if (scrim) scrim.addEventListener('click', function () { close(); });
  Array.prototype.forEach.call(root.querySelectorAll('.ds-app-shell__nav-close button, button.ds-app-shell__nav-close'), function (b) {
    b.addEventListener('click', function () { close(); });
  });
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (root.getAttribute('data-nav') === 'open') { e.preventDefault(); close(); return; }
    /* tablet overlay panel: Esc closes it and returns focus to its trigger */
    if (aside && !aside.hidden && aside.contains(document.activeElement) && getComputedStyle(aside).zIndex !== 'auto') {
      e.preventDefault();
      aside.hidden = true;
      var trigger = aside.id && root.querySelector('[aria-controls="' + aside.id + '"]');
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); }
    }
  });
  function layout() {
    var w = root.clientWidth;
    if (root.getAttribute('data-nav') === 'open' && !isDrawer()) close(false);
    var needsRail = aside && !aside.hidden && !isDrawer() && cs('--layout-nav-width') + cs('--layout-panel-width') + cs('--layout-content-min') > w;
    if (needsRail) root.setAttribute('data-ds-nav-auto', 'collapsed'); else root.removeAttribute('data-ds-nav-auto');
    var bars = (header ? header.offsetHeight : 0) + (bottom && bottom.offsetParent ? bottom.offsetHeight : 0);
    if (!root.hasAttribute('data-contained') && bars > window.innerHeight / 3) root.setAttribute('data-ds-unstick', ''); else root.removeAttribute('data-ds-unstick');
    if (header && !root.hasAttribute('data-contained')) root.style.setProperty('--ds-shell-header-h', header.offsetHeight + 'px');
  }
  layout();
  if (window.ResizeObserver) new ResizeObserver(layout).observe(root);
  window.addEventListener('resize', layout);
});
