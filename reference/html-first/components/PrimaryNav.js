/* PrimaryNav · engine 1.8.0 reference module (catalog/components/PrimaryNav.json). Progressive enhancement only (§6.4):
   without JS every destination is a plain link in Tab order and groups render open.
   Adds: ↓/↑ (vertical) or →/← (horizontal, swapped in RTL) + Home/End between visible items without wrapping; group
   disclosure (Enter/Space, → opens / ← closes); collapse-toggle full ↔ rail (auto-rail between bp-tablet and bp-desktop);
   rail labels as visual Tooltip duplicates (DS.tooltip, when Tooltip.js is loaded); blocked items announce their reason.
   Module "primary-nav-drawer" opens the phone/tablet drawer (<dialog>, showModal) from button[data-ds-opens="<id>"]:
   Esc / scrim / Close / swipe to inline-start close it and focus returns to the menu button. */
(function () {
  var DS = (window.DS = window.DS || {});
  function px(name, fallback) { var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); return isNaN(n) ? fallback : n; }
  function isRtl(el) { return getComputedStyle(el).direction === 'rtl'; }
  function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && !el.closest('[hidden]'); }
  function labelOf(item) {
    var l = item.querySelector('.ds-primary-nav__label');
    var r = item.querySelector('.ds-primary-nav__reason');
    return ((l ? l.textContent : item.textContent) + (r ? ' · ' + r.textContent : '')).replace(/\s+/g, ' ').trim();
  }

  DS.register('primary-nav', function (nav) {
    var horizontal = nav.getAttribute('data-variant') === 'horizontal';
    var toggle = nav.querySelector('.ds-primary-nav__toggle');
    var userRail = nav.hasAttribute('data-rail');
    var manual = false;
    var autoRail = !horizontal && nav.getAttribute('data-rail-auto') !== 'off' && nav.getAttribute('data-presentation') !== 'drawer';

    function applyRail(on, reason) {
      var was = nav.hasAttribute('data-rail');
      if (on) nav.setAttribute('data-rail', ''); else nav.removeAttribute('data-rail');
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!on));
        var lbl = toggle.getAttribute(on ? 'data-label-expand' : 'data-label-collapse');
        if (lbl) toggle.setAttribute('aria-label', lbl);
      }
      var items = nav.querySelectorAll('.ds-primary-nav__item');
      for (var i = 0; i < items.length; i++) {
        if (!DS.tooltip) break;
        if (on) DS.tooltip.attach(items[i], labelOf(items[i]), { side: 'inline-end' }); else DS.tooltip.detach(items[i]);
      }
      if (was !== on) nav.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: !on, reason: reason } }));
    }
    function evaluate() {
      if (horizontal) return;
      var w = window.innerWidth, t = px('--bp-tablet', 600), d = px('--bp-desktop', 1024);
      if (autoRail && !manual && w >= t && w < d) applyRail(true, 'resize'); else applyRail(userRail, 'resize');
    }
    if (toggle) toggle.addEventListener('click', function () {
      userRail = !nav.hasAttribute('data-rail');
      manual = true; // the user's choice wins until reload (apps persist it per user via the ds:openchange event)
      applyRail(userRail, 'toggle');
    });
    evaluate();
    window.addEventListener('resize', evaluate);

    function stops() {
      var all = nav.querySelectorAll('.ds-primary-nav__item, .ds-primary-nav__group-toggle, .ds-primary-nav__more > summary');
      var out = [];
      for (var i = 0; i < all.length; i++) if (visible(all[i]) && !all[i].closest('.ds-primary-nav__more-panel')) out.push(all[i]);
      return out;
    }
    function setGroup(btn, open) {
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(open));
      if (list) list.hidden = !open;
    }

    nav.addEventListener('click', function (e) {
      var btn = e.target.closest('.ds-primary-nav__group-toggle');
      if (btn && nav.contains(btn)) { setGroup(btn, btn.getAttribute('aria-expanded') !== 'true'); return; }
      var item = e.target.closest('.ds-primary-nav__item');
      if (!item || !nav.contains(item)) return;
      if (item.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        var r = item.querySelector('.ds-primary-nav__reason');
        if (r && DS.announce) DS.announce(r.textContent.trim());
        return;
      }
      // Reference router stand-in: in-page hrefs move aria-current (a real router does this on navigation).
      var href = item.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        e.preventDefault();
        var cur = nav.querySelectorAll('[aria-current="page"]');
        for (var i = 0; i < cur.length; i++) cur[i].removeAttribute('aria-current');
        item.setAttribute('aria-current', 'page');
        nav.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: item.getAttribute('data-value') || href, href: href } }));
        var drawer = nav.closest('dialog.ds-primary-nav__drawer');
        if (drawer && drawer.open) drawer.close('navigate');
      }
    });

    nav.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var t = e.target;
      if (t.closest('.ds-primary-nav__more-panel')) return;
      if (t.getAttribute('aria-disabled') === 'true' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        var r = t.querySelector('.ds-primary-nav__reason');
        if (r && DS.announce) DS.announce(r.textContent.trim());
        return;
      }
      var rtl = isRtl(nav);
      var next = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
      var prev = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
      var list = stops();
      var i = list.indexOf(t);
      if (i < 0) return;
      var target = null;
      if (e.key === next) target = list[Math.min(i + 1, list.length - 1)]; // no wrapping
      else if (e.key === prev) target = list[Math.max(i - 1, 0)];
      else if (e.key === 'Home') target = list[0];
      else if (e.key === 'End') target = list[list.length - 1];
      else if (!horizontal && t.classList.contains('ds-primary-nav__group-toggle')) {
        var open = rtl ? 'ArrowLeft' : 'ArrowRight', close = rtl ? 'ArrowRight' : 'ArrowLeft';
        if (e.key === open) { setGroup(t, true); e.preventDefault(); }
        else if (e.key === close) { setGroup(t, false); e.preventDefault(); }
        return;
      }
      if (target) { e.preventDefault(); target.focus(); }
    });
  });

  DS.register('primary-nav-drawer', function (dialog) {
    if (!dialog.showModal) return; // no <dialog> support: the menu link's no-JS fallback (#anchor) stays in charge
    var trigger = null;
    var openers = document.querySelectorAll('[data-ds-opens="' + dialog.id + '"]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].setAttribute('aria-haspopup', 'dialog');
      openers[i].setAttribute('aria-expanded', 'false');
      openers[i].addEventListener('click', function (e) {
        e.preventDefault();
        trigger = e.currentTarget;
        dialog.showModal();
        trigger.setAttribute('aria-expanded', 'true');
        var cur = dialog.querySelector('[aria-current="page"]');
        if (cur) cur.focus();
      });
    }
    var closeBtn = dialog.querySelector('.ds-primary-nav__drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close('close-button'); });
    dialog.addEventListener('click', function (e) { // scrim (::backdrop) clicks land on the dialog element outside its box
      if (e.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close('scrim');
    });
    dialog.addEventListener('close', function () {
      if (trigger) { trigger.setAttribute('aria-expanded', 'false'); if (trigger.isConnected) trigger.focus(); }
    });
    // swipe toward inline-start closes; the labelled Close button is the single-pointer path (SC 2.5.1)
    var x0 = null;
    dialog.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') x0 = e.clientX; });
    dialog.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      var w = dialog.getBoundingClientRect().width;
      if ((isRtl(dialog) ? dx : -dx) > w * 0.3) dialog.close('swipe');
    });
  });
})();
