/* Sheet · engine 1.8.0 reference module (catalog/components/Sheet.json). Progressive enhancement only (§6.4).
   No-JS: the trigger is a link to the same content as a page (href); with JS it opens dialog#id via showModal().
   Markup: trigger[data-ds-sheet-open=<id>] + dialog.ds-sheet#<id>[data-ds-module="sheet"][aria-labelledby][data-variant][data-detent]
   (persistent: aside.ds-sheet[data-variant=persistent][data-ds-module="sheet"]).
   - open: detent from data-detent (default medium); focus to the first field (form) or the title (tabindex -1); trigger gets
     aria-haspopup=dialog + aria-expanded + aria-controls; focus returns to the trigger on close.
   - Esc (native cancel), Close, scrim and swipe-down past the threshold = Cancel; a dirty form (data-ds-discard=<confirm dialog id>)
     asks "Discard changes?" first. Handle: Enter/Space toggles medium <-> large (announced), drag moves between detents.
   - persistent: Esc collapses, F6 moves focus between main and the sheet, no focus trap.
   - virtual keyboard: visualViewport keeps the sheet (and its footer) above it via --_kb.
   DS.sheet.present({ title, nodes, returnFocus, onClose, busy }) shows arbitrary nodes in a bottom Sheet (used by Menu and Popover
   on phone) and returns { dialog, close(reason, refocus) }; the nodes move back where they were on close. */
(function () {
  var DS = (window.DS = window.DS || {});
  var uid = 0;
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }
  function announce(m) { if (DS.announce) DS.announce(m, 'polite'); }
  function reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  var LABELS = { expand: 'Expand sheet', collapse: 'Collapse sheet', expanded: 'Expanded', collapsed: 'Collapsed', close: 'Close' };

  function syncHandle(sheet) {
    var h = sheet.querySelector('.ds-sheet__handle');
    if (!h) return;
    var large = sheet.getAttribute('data-detent') === 'large';
    h.setAttribute('aria-expanded', String(large));
    h.setAttribute('aria-label', large ? (h.getAttribute('data-label-collapse') || LABELS.collapse) : (h.getAttribute('data-label-expand') || LABELS.expand));
  }
  function setDetent(sheet, d, say) {
    sheet.setAttribute('data-detent', d);
    syncHandle(sheet);
    if (say) announce(d === 'large' ? LABELS.expanded : LABELS.collapsed);
    sheet.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: d } }));
  }
  function initialFocus(sheet) {
    var field = sheet.querySelector('.ds-sheet__body :is(input:not([type="hidden"]):not([readonly]), select, textarea)');
    if (field && sheet.getAttribute('data-initial-focus') !== 'title') { focusVisible(field); return; }
    var title = sheet.querySelector('.ds-sheet__title');
    if (title) { title.setAttribute('tabindex', '-1'); focusVisible(title); }
  }

  /* drag on handle + header: follows the pointer, scrim fades, release decides the detent (or Cancel past the threshold) */
  function bindDrag(sheet, requestClose) {
    var zones = sheet.querySelectorAll('.ds-sheet__handle, .ds-sheet__header');
    var start = 0, dy = 0, dragging = false, moved = false, id = null;
    function down(e) {
      if (e.button > 0 || e.target.closest('button:not(.ds-sheet__handle), a, input')) return;
      if (window.matchMedia('(min-width: ' + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bp-tablet') || 600) + 'px)').matches && sheet.getAttribute('data-variant') === 'side') return;
      start = e.clientY; dy = 0; dragging = true; moved = false; id = e.pointerId;
    }
    function move(e) {
      if (!dragging || e.pointerId !== id) return;
      dy = e.clientY - start;
      if (!moved && Math.abs(dy) < 4) return;
      if (!moved) { moved = true; sheet.setAttribute('data-dragging', ''); try { e.target.setPointerCapture(id); } catch (x) { /* */ } }
      var h = sheet.getBoundingClientRect().height;
      sheet.style.setProperty('--_drag', Math.max(0, dy) + 'px');
      sheet.style.setProperty('--_scrim', String(Math.max(0, 1 - Math.max(0, dy) / h)));
    }
    function up(e) {
      if (!dragging || e.pointerId !== id) return;
      dragging = false;
      sheet.removeAttribute('data-dragging');
      sheet.style.removeProperty('--_drag');
      sheet.style.removeProperty('--_scrim');
      if (!moved) return;
      sheet.__dsDragged = true; setTimeout(function () { sheet.__dsDragged = false; }, 0); // the click after a drag is not a press
      var h = sheet.getBoundingClientRect().height;
      var d = sheet.getAttribute('data-detent') || 'medium';
      if (dy < -h * 0.15 && d !== 'large') setDetent(sheet, 'large', true);
      else if (dy > h * 0.35) {
        if (sheet.getAttribute('data-variant') === 'persistent') setDetent(sheet, 'collapsed', true);
        else requestClose('swipe');
      } else if (dy > h * 0.15 && d === 'large') setDetent(sheet, 'medium', true);
    }
    for (var i = 0; i < zones.length; i++) {
      zones[i].addEventListener('pointerdown', down);
      zones[i].addEventListener('pointermove', move);
      zones[i].addEventListener('pointerup', up);
      zones[i].addEventListener('pointercancel', up);
    }
  }
  function bindHandle(sheet) {
    var h = sheet.querySelector('.ds-sheet__handle');
    if (!h) return;
    syncHandle(sheet);
    h.addEventListener('click', function () {
      if (sheet.__dsDragged) return;
      var d = sheet.getAttribute('data-detent') || 'medium';
      var persistent = sheet.getAttribute('data-variant') === 'persistent';
      setDetent(sheet, d === 'large' ? (persistent ? 'collapsed' : 'medium') : 'large', true);
    });
  }
  function keyboardInset(sheet) {
    var vv = window.visualViewport;
    if (!vv) return function () {};
    var on = function () { var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop); sheet.style.setProperty('--_kb', kb + 'px'); if (kb > 0 && sheet.getAttribute('data-detent') === 'medium') setDetent(sheet, 'large', false); };
    vv.addEventListener('resize', on);
    return function () { vv.removeEventListener('resize', on); sheet.style.removeProperty('--_kb'); };
  }

  function setupModal(sheet, opts) {
    opts = opts || {};
    var trigger = null, dirty = false, unKb = null;
    var discard = sheet.getAttribute('data-ds-discard') ? document.getElementById(sheet.getAttribute('data-ds-discard')) : null;
    function requestClose(reason) {
      if (dirty && discard && !discard.open) {
        discard.__dsBack = document.activeElement; discard.__dsReason = reason; discard.__dsSheet = sheet;
        discard.showModal();
        var dt = discard.querySelector('.ds-modal__title');
        if (dt) { dt.setAttribute('tabindex', '-1'); focusVisible(dt); }
        return;
      }
      sheet.__dsReason = reason;
      sheet.close(reason);
    }
    function open(t) {
      trigger = t || null; dirty = false;
      if (!sheet.hasAttribute('data-detent')) sheet.setAttribute('data-detent', 'medium');
      syncHandle(sheet);
      sheet.showModal();
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      unKb = keyboardInset(sheet);
      initialFocus(sheet);
      sheet.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: 'trigger' } }));
    }
    sheet.addEventListener('cancel', function (e) { e.preventDefault(); requestClose('escape'); });
    sheet.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-ds-sheet-close], .ds-sheet__close');
      if (closer && sheet.contains(closer)) { e.preventDefault(); if (closer.getAttribute('aria-disabled') !== 'true') requestClose('close-button'); return; }
      if (e.target !== sheet) return; // ::backdrop clicks target the dialog outside its box
      var r = sheet.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) requestClose('scrim');
    });
    sheet.addEventListener('input', function () { dirty = true; });
    sheet.addEventListener('close', function () {
      if (unKb) { unKb(); unKb = null; }
      dirty = false;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      var target = opts.returnFocus || (trigger && trigger.isConnected ? trigger : null);
      if (opts.refocus !== false && sheet.__dsRefocus !== false) {
        if (!target || !target.isConnected) { target = document.querySelector('main h1, h1'); if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); }
        if (target) focusVisible(target);
      }
      sheet.__dsRefocus = undefined;
      var reason = sheet.__dsReason || sheet.returnValue || 'action';
      sheet.__dsReason = null;
      var msg = sheet.returnValue && sheet.returnValue !== 'cancel' ? sheet.getAttribute('data-ds-announce') : null;
      if (msg) announce(msg);
      sheet.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: reason } }));
      if (opts.onClose) opts.onClose(reason);
    });
    if (discard && !discard.__dsSheetBound) {
      discard.__dsSheetBound = true;
      discard.addEventListener('click', function (e) {
        var s = discard.__dsSheet;
        if (e.target.closest('[data-ds-discard-confirm]')) { discard.close('discard'); if (s) { s.__dsReason = discard.__dsReason; s.close('cancel'); } }
        else if (e.target.closest('[data-ds-discard-keep], .ds-modal__close')) discard.close('keep');
      });
      discard.addEventListener('cancel', function (e) { e.preventDefault(); discard.close('keep'); }); // Esc = Keep editing
      discard.addEventListener('close', function () {
        if (discard.returnValue !== 'discard' && discard.__dsBack && discard.__dsBack.isConnected) focusVisible(discard.__dsBack);
        discard.returnValue = '';
      });
    }
    bindHandle(sheet);
    bindDrag(sheet, requestClose);
    return { open: open, close: requestClose };
  }

  function setupPersistent(sheet) {
    if (!sheet.hasAttribute('data-detent')) sheet.setAttribute('data-detent', 'medium');
    bindHandle(sheet);
    bindDrag(sheet, function () { setDetent(sheet, 'collapsed', true); });
    sheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet.getAttribute('data-detent') !== 'collapsed') { setDetent(sheet, 'collapsed', true); var h = sheet.querySelector('.ds-sheet__handle'); if (h) h.focus(); }
    });
    sheet.addEventListener('click', function (e) {
      if (e.target.closest('[data-ds-sheet-close], .ds-sheet__close')) setDetent(sheet, 'collapsed', true);
    });
    // F6: move focus between the main content and the sheet (landmark cycling)
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'F6') return;
      e.preventDefault();
      if (sheet.contains(document.activeElement)) { var m = document.querySelector('main'); if (m) { if (!m.hasAttribute('tabindex')) m.setAttribute('tabindex', '-1'); focusVisible(m); } }
      else { var t = sheet.querySelector('.ds-sheet__title'); if (t) { t.setAttribute('tabindex', '-1'); focusVisible(t); } }
    });
  }

  DS.register('sheet', function (sheet) {
    if (!sheet.querySelector('.ds-sheet__close, [data-ds-sheet-close]')) console.error('[DS] Sheet without a Close button (UB7)', sheet);
    if (sheet.getAttribute('data-variant') === 'persistent' || !sheet.showModal) { setupPersistent(sheet); return; }
    var api = setupModal(sheet);
    var openers = document.querySelectorAll('[data-ds-sheet-open="' + sheet.id + '"]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].setAttribute('aria-haspopup', 'dialog');
      openers[i].setAttribute('aria-expanded', 'false');
      openers[i].setAttribute('aria-controls', sheet.id);
      openers[i].addEventListener('click', function (e) { e.preventDefault(); api.open(e.currentTarget); });
    }
    DS.sheet = DS.sheet || {};
    DS.sheet[sheet.id] = api;
  });

  /* Present arbitrary nodes in a bottom Sheet (Menu / Popover on phone). */
  function present(o) {
    var id = 'ds-sheet-p' + (++uid);
    var d = document.createElement('dialog');
    d.className = 'ds-sheet';
    d.id = id;
    d.setAttribute('data-variant', 'bottom');
    d.setAttribute('data-detent', o.detent || 'medium');
    d.setAttribute('aria-labelledby', id + '-title');
    if (o.busy) d.setAttribute('aria-busy', 'true');
    d.innerHTML = '<button type="button" class="ds-sheet__handle"></button>' +
      '<div class="ds-sheet__header"><h2 class="ds-sheet__title" id="' + id + '-title"></h2>' +
      '<button type="button" class="ds-icon-button ds-sheet__close" aria-label="' + (o.closeLabel || LABELS.close) + '"><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-close"/></svg></button></div>' +
      '<div class="ds-sheet__body"></div>';
    d.querySelector('.ds-sheet__title').textContent = o.title || '';
    var body = d.querySelector('.ds-sheet__body');
    var homes = (o.nodes || []).map(function (n) { var mark = document.createComment('ds-sheet-home'); n.parentNode.insertBefore(mark, n); body.appendChild(n); return [n, mark]; });
    // the Sheet lives next to the original content so inherited dir/lang stay correct
    var host = homes.length ? homes[0][1].parentNode : document.body;
    (host.closest ? host.closest('[dir], body') || document.body : document.body).appendChild(d);
    var restored = false;
    function restore() {
      if (restored) return; restored = true;
      homes.forEach(function (h) { h[1].parentNode.insertBefore(h[0], h[1]); h[1].remove(); });
      d.remove();
    }
    var api = setupModal(d, {
      returnFocus: o.returnFocus,
      onClose: function (reason) { restore(); if (o.onClose) o.onClose(reason); }
    });
    api.open(null);
    if (o.focus) focusVisible(o.focus);
    return {
      dialog: d,
      body: body,
      close: function (reason, refocus) { if (refocus === false) d.__dsRefocus = false; if (d.open) { d.__dsReason = reason; d.close(reason); } else restore(); }
    };
  }
  DS.sheet = DS.sheet || {};
  DS.sheet.present = present;
})();
