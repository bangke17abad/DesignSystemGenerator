/* ContextPanel · engine 1.8.0 reference module (catalog/components/ContextPanel.json). Progressive enhancement only (§6.4):
   without JS the panel is part of the page (rows are links to it; on phone list and panel stack).
   Module "context-panel" on aside.ds-context-panel (inside .ds-context-panel-layout):
   - triggers/rows = a|button[href="#<panel id>"] or [aria-controls=<panel id>] get aria-controls + aria-expanded; activating one
     opens the panel for that item and focuses the title (tabindex −1); ↑/↓ between rows while the panel is open swap its
     content without moving focus and announce the item politely; F6 / Shift+F6 move between list and panel;
   - Esc inside the panel, Close and (phone) Back close it and return focus to the row/trigger; never a scrim or focus trap;
   - variant edit + dirty: Close / Esc / another row open the "Discard changes?" dialog (data-ds-discard="<dialog id>");
   - overlay: when focus moves to an element in the list that the panel would cover entirely, the panel closes (SC 2.4.11);
   - resize handle (role=separator): ←/→ by --space-4 (swapped in RTL), Home/End to min/max, pointer drag, double-click or
     [data-ds-panel-reset] resets; the width is announced and emitted (ds:widthchange). */
(function () {
  var DS = (window.DS = window.DS || {});
  function px(el, name, fb) { var n = parseFloat(getComputedStyle(el).getPropertyValue(name)); return isNaN(n) ? fb : n; }
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }

  DS.register('context-panel', function (panel) {
    var layout = panel.closest('.ds-context-panel-layout') || panel.parentNode;
    var title = panel.querySelector('.ds-context-panel__title');
    var handle = panel.querySelector('.ds-context-panel__resize');
    var discard = panel.getAttribute('data-ds-discard') ? document.getElementById(panel.getAttribute('data-ds-discard')) : null;
    var rows = Array.prototype.slice.call(document.querySelectorAll('a[href="#' + panel.id + '"], [aria-controls="' + panel.id + '"]')).filter(function (r) { return r !== handle; });
    var trigger = null, dirty = false, pending = null;
    layout.setAttribute('data-ds-ready', '');

    function isOverlay() { var p = getComputedStyle(panel).position; return p === 'absolute' || p === 'fixed'; }
    function emit(open, reason) { panel.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: open, reason: reason } })); }
    function select(row) {
      rows.forEach(function (r) { var on = r === row; r.setAttribute('aria-expanded', String(on && !panel.hidden)); if (on) r.setAttribute('aria-current', 'true'); else r.removeAttribute('aria-current'); });
      var t = row && row.getAttribute('data-ds-panel-title');
      if (t && title) { title.textContent = t; title.setAttribute('title', t); }
    }
    function open(row, explicit) {
      trigger = row || trigger;
      panel.hidden = false;
      layout.setAttribute('data-panel', 'open');
      select(trigger);
      if (explicit && title) { title.setAttribute('tabindex', '-1'); focusVisible(title); }
      emit(true, 'trigger');
    }
    function guard(then) {
      if (dirty && discard && discard.showModal) { pending = then; discard.showModal(); var dt = discard.querySelector('.ds-modal__title'); if (dt) { dt.setAttribute('tabindex', '-1'); focusVisible(dt); } return; }
      then();
    }
    function close(reason) {
      guard(function () {
        dirty = false;
        panel.hidden = true;
        layout.setAttribute('data-panel', 'closed');
        rows.forEach(function (r) { r.setAttribute('aria-expanded', 'false'); });
        if (reason !== 'focus-obscured' && trigger && trigger.isConnected) focusVisible(trigger);
        emit(false, reason);
      });
    }

    rows.forEach(function (r) {
      r.setAttribute('aria-controls', panel.id);
      r.setAttribute('aria-expanded', String(!panel.hidden && r.getAttribute('aria-current') === 'true'));
      if (r.getAttribute('aria-current') === 'true') trigger = r;
      r.addEventListener('click', function (e) {
        e.preventDefault();
        if (r === trigger && !panel.hidden) { if (title) { title.setAttribute('tabindex', '-1'); focusVisible(title); } return; }
        guard(function () { dirty = false; open(r, true); });
      });
    });
    // ↑/↓ in the list: move focus; with the panel open the content follows the selection without moving focus
    var list = rows.length ? rows[0].closest('ul, ol, [role="list"]') : null;
    if (list) list.addEventListener('keydown', function (e) {
      var i = rows.indexOf(e.target);
      if (i < 0 || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      var t = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
      t.focus();
      if (!panel.hidden && t !== trigger) guard(function () {
        dirty = false;
        trigger = t;
        select(t);
        if (DS.announce) DS.announce(t.getAttribute('data-ds-panel-title') || t.textContent.trim(), 'polite');
      });
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('.ds-context-panel__close')) { close('close-button'); return; }
      var back = e.target.closest('.ds-context-panel__back');
      if (back) { e.preventDefault(); close('system-back'); return; }
      if (e.target.closest('[data-ds-panel-reset]')) { setWidth(px(document.documentElement, '--layout-panel-width', 400), true); var d = e.target.closest('details'); if (d) d.open = false; }
    });
    panel.addEventListener('input', function () { if (panel.getAttribute('data-variant') === 'edit') dirty = true; });
    panel.addEventListener('submit', function (e) { e.preventDefault(); dirty = false; if (DS.announce) DS.announce(panel.getAttribute('data-ds-saved') || 'Changes saved', 'polite'); });
    layout.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.contains(document.activeElement) && !panel.hidden) {
        var menu = e.target.closest('details[open]');
        if (menu) { menu.open = false; menu.querySelector('summary').focus(); e.preventDefault(); return; }
        e.preventDefault(); close('escape'); return;
      }
      if (e.key === 'F6' && !panel.hidden) { // region cycling: list ↔ panel
        e.preventDefault();
        if (panel.contains(document.activeElement)) { var back = trigger || rows[0]; if (back) back.focus(); }
        else if (title) { title.setAttribute('tabindex', '-1'); focusVisible(title); }
      }
    });
    // SC 2.4.11: an overlay never hides the focused element
    layout.addEventListener('focusin', function (e) {
      if (panel.hidden || panel.contains(e.target) || !isOverlay()) return;
      var a = e.target.getBoundingClientRect(), b = panel.getBoundingClientRect();
      var covered = a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
      if (covered) { close('focus-obscured'); if (DS.announce) DS.announce(panel.getAttribute('data-ds-closed') || 'Details closed', 'polite'); }
    });
    if (discard) {
      discard.addEventListener('click', function (e) {
        if (e.target.closest('[data-ds-discard-confirm]')) { dirty = false; discard.close('discard'); var p = pending; pending = null; if (p) p(); }
        else if (e.target.closest('[data-ds-discard-keep]')) discard.close('keep');
      });
      discard.addEventListener('close', function () { if (discard.returnValue !== 'discard') { pending = null; var f = panel.querySelector('input, textarea, select') || title; if (f) focusVisible(f); } discard.returnValue = ''; });
    }

    // resize
    function setWidth(w, announce) {
      var min = Math.round(px(document.documentElement, '--layout-panel-width', 400) * 0.75);
      var max = Math.max(min, Math.min(Math.round(px(document.documentElement, '--layout-panel-width', 400) * 1.5), layout.clientWidth - px(document.documentElement, '--layout-rail-width', 72)));
      w = Math.round(Math.max(min, Math.min(max, w)));
      panel.style.setProperty('--ds-panel-w', w + 'px');
      if (handle) { handle.setAttribute('aria-valuemin', min); handle.setAttribute('aria-valuemax', max); handle.setAttribute('aria-valuenow', w); handle.setAttribute('aria-valuetext', w + ' px'); }
      if (announce && DS.announce) DS.announce((handle && handle.getAttribute('aria-label') || 'Panel width') + ' ' + w, 'polite');
      panel.dispatchEvent(new CustomEvent('ds:widthchange', { bubbles: true, detail: w }));
      return w;
    }
    if (handle) {
      handle.setAttribute('aria-controls', panel.id);
      setWidth(panel.getBoundingClientRect().width || px(document.documentElement, '--layout-panel-width', 400), false);
      handle.addEventListener('keydown', function (e) {
        var rtl = getComputedStyle(panel).direction === 'rtl';
        var step = px(document.documentElement, '--space-4', 16), w = panel.getBoundingClientRect().width;
        // the handle sits at the panel's inline-start: moving it toward inline-start widens the panel
        var widen = rtl ? 'ArrowRight' : 'ArrowLeft', narrow = rtl ? 'ArrowLeft' : 'ArrowRight';
        if (e.key === widen) setWidth(w + step, true);
        else if (e.key === narrow) setWidth(w - step, true);
        else if (e.key === 'Home') setWidth(0, true);
        else if (e.key === 'End') setWidth(1e6, true);
        else return;
        e.preventDefault();
      });
      handle.addEventListener('dblclick', function () { setWidth(px(document.documentElement, '--layout-panel-width', 400), true); });
      handle.addEventListener('pointerdown', function (e) {
        var x0 = e.clientX, w0 = panel.getBoundingClientRect().width, rtl = getComputedStyle(panel).direction === 'rtl';
        handle.setPointerCapture(e.pointerId);
        handle.setAttribute('data-dragging', '');
        function move(ev) { setWidth(w0 + (rtl ? ev.clientX - x0 : x0 - ev.clientX), false); }
        function up() { handle.removeAttribute('data-dragging'); handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); handle.removeEventListener('pointercancel', up); }
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
      });
    }
    // a scrolling body without focusable content must be reachable by keyboard (SC 2.1.1)
    var body = panel.querySelector('.ds-context-panel__body');
    function syncBody() {
      if (!body || body.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')) return;
      if (body.scrollHeight > body.clientHeight + 1) { body.tabIndex = 0; body.setAttribute('role', 'region'); if (title) body.setAttribute('aria-label', title.textContent.trim()); }
      else if (body.getAttribute('tabindex') === '0') { body.removeAttribute('tabindex'); body.removeAttribute('role'); body.removeAttribute('aria-label'); }
    }
    syncBody();
    // the body box is fixed by the layout, so content reflow (font load, wrapping, locale) is observed on the children too
    if (window.ResizeObserver && body) { var ro = new ResizeObserver(syncBody); ro.observe(body); for (var k = 0; k < body.children.length; k++) ro.observe(body.children[k]); }
    window.addEventListener('load', syncBody);
    if (!panel.hidden) layout.setAttribute('data-panel', 'open');
  });
})();
