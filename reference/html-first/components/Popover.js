/* Popover · engine 1.8.0 reference module (catalog/components/Popover.json). Progressive enhancement only (§6.4):
   without JS the native popover attribute still opens (centred), light-dismisses and closes on Esc.
   Markup: button[popovertarget=<id>][aria-haspopup=dialog] (or [data-ds-popover=<id>] for a JS-only trigger, e.g. one that is
   blocked with a reason) + div.ds-popover#<id>[popover=auto][role=dialog][aria-labelledby][data-ds-module="popover"]
   [data-variant="info|form"][data-side="block-end|block-start|inline-start|inline-end"][data-align="start|center|end"].
   - opens on press only (never on hover); trigger gets aria-expanded + aria-controls.
   - info: focus to the labelled container (tabindex -1); form: focus to the first field.
   - Esc (native, topmost first: inside a Modal the Popover closes before the Modal), outside press, Close and focus leaving the
     popover close it; Esc / Close / Apply return focus to the trigger; focus-out leaves focus where the user moved it.
   - form: Enter submits = Apply (validation keeps it open, error shown); data-ds-announce is announced politely on Apply.
   - phone (< --bp-tablet): form variant (and any popover taller than the viewport) is presented in a bottom Sheet (DS.sheet).
   - a blocked trigger (aria-disabled) does not open; its reason is announced (except data-role="reason" popovers, which ARE the reason).
   Events: ds:openchange { open, reason } on the popover. API: DS.popover.open(pop, trigger) / close(pop, reason) / toggle(pop, trigger). */
(function () {
  var DS = (window.DS = window.DS || {});
  function px(name, fallback) { var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); return isNaN(n) ? fallback : n; }
  function focusVisible(el) { try { el.focus({ focusVisible: true, preventScroll: true }); } catch (e) { el.focus(); } }
  function isPhone() { return window.matchMedia('(max-width: ' + (px('--bp-tablet', 600) - 0.02) + 'px)').matches; }
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && n.textContent.trim()) return n.textContent.replace(/\s+/g, ' ').trim(); }
    return '';
  }

  /* Shared anchoring helper (also defined identically by Menu.js): places a fixed top-layer panel next to an anchor rect,
     logical side + align, flips to the opposite side when it does not fit, then shifts inside the viewport. */
  DS.anchor = DS.anchor || function (panel, anchor, opts) {
    opts = opts || {};
    var gap = opts.gap != null ? opts.gap : px('--space-1', 4);
    var edge = px('--space-2', 8);
    var r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
    panel.setAttribute('data-placed', '');
    panel.style.left = '0px'; panel.style.top = '0px';
    var p = panel.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var rtl = getComputedStyle(opts.dirFrom || panel).direction === 'rtl';
    var side = opts.side || 'block-end', align = opts.align || 'start';
    var phys = side === 'block-start' ? 'top' : side === 'block-end' ? 'bottom' : ((side === 'inline-start') !== rtl ? 'left' : 'right');
    var room = { top: r.top - gap, bottom: vh - r.bottom - gap, left: r.left - gap, right: vw - r.right - gap };
    var need = { top: p.height, bottom: p.height, left: p.width, right: p.width };
    var opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    if (room[phys] < need[phys] && room[opposite[phys]] > room[phys]) phys = opposite[phys];
    var x, y;
    if (phys === 'top' || phys === 'bottom') {
      y = phys === 'top' ? r.top - gap - p.height : r.bottom + gap;
      var startX = rtl ? r.right - p.width : r.left, endX = rtl ? r.left : r.right - p.width;
      x = align === 'center' ? r.left + r.width / 2 - p.width / 2 : align === 'end' ? endX : startX;
    } else {
      x = phys === 'left' ? r.left - gap - p.width : r.right + gap;
      y = align === 'center' ? r.top + r.height / 2 - p.height / 2 : align === 'end' ? r.bottom - p.height : r.top;
    }
    x = Math.max(edge, Math.min(x, vw - p.width - edge));
    y = Math.max(edge, Math.min(y, vh - p.height - edge));
    panel.style.left = Math.round(x) + 'px';
    panel.style.top = Math.round(y) + 'px';
    panel.setAttribute('data-side', phys === 'top' ? 'block-start' : phys === 'bottom' ? 'block-end' : ((phys === 'left') !== rtl ? 'inline-start' : 'inline-end'));
    return phys;
  };

  var openOne = null; // { pop, trigger, sheet }

  function triggersOf(pop) {
    return Array.prototype.slice.call(document.querySelectorAll('[popovertarget="' + pop.id + '"]:not([popovertargetaction="hide"]), [data-ds-popover="' + pop.id + '"]'));
  }
  function setExpanded(pop, on) {
    triggersOf(pop).forEach(function (t) { t.setAttribute('aria-expanded', String(on)); });
  }
  function initialFocus(pop, viaKeyboard) {
    var host = pop.__dsSheet ? pop.__dsSheet.dialog : pop;
    var field = pop.getAttribute('data-variant') === 'form' ? host.querySelector('input:not([type="hidden"]):not([readonly]), select, textarea') : null;
    if (field) { focusVisible(field); return; }
    if (pop.__dsSheet) return; // the Sheet focuses its title
    if (!pop.hasAttribute('tabindex')) pop.setAttribute('tabindex', '-1');
    if (viaKeyboard) focusVisible(pop); else pop.focus({ preventScroll: true });
  }
  function place(pop) {
    if (!openOne || openOne.pop !== pop || pop.__dsSheet) return;
    DS.anchor(pop, openOne.trigger, { side: pop.getAttribute('data-side-prefer') || 'block-end', align: pop.getAttribute('data-align') || 'start', dirFrom: openOne.trigger });
  }

  function open(pop, trigger, viaKeyboard) {
    if (openOne && openOne.pop !== pop) close(openOne.pop, 'trigger', false); // one Popover at a time
    trigger = trigger || triggersOf(pop)[0];
    if (!pop.hasAttribute('data-side-prefer')) pop.setAttribute('data-side-prefer', pop.getAttribute('data-side') || 'block-end');
    openOne = { pop: pop, trigger: trigger, keyboard: !!viaKeyboard };
    pop.__dsTrigger = trigger;
    setExpanded(pop, true);
    var asSheet = isPhone() && DS.sheet && (pop.getAttribute('data-variant') === 'form' || pop.hasAttribute('data-sheet-on-phone'));
    if (asSheet) {
      var title = pop.querySelector('.ds-popover__title');
      var parts = Array.prototype.slice.call(pop.children).filter(function (c) { return !c.classList.contains('ds-popover__header'); });
      pop.__dsSheet = DS.sheet.present({
        title: title ? title.textContent.trim() : (pop.getAttribute('aria-label') || ''),
        nodes: parts,
        returnFocus: trigger,
        busy: pop.getAttribute('aria-busy') === 'true',
        onClose: function (reason) { if (!pop.__dsSheet) return; pop.__dsSheet = null; finish(pop, reason, false); } // the Sheet returns focus itself
      });
    } else {
      if (pop.showPopover && !pop.matches(':popover-open')) {
        try { pop.showPopover({ source: trigger }); } catch (e) { try { pop.showPopover(); } catch (e2) { /* detached */ } }
      }
      place(pop);
      // too tall for the phone viewport: present as a Sheet instead (catalog responsive)
      if (isPhone() && DS.sheet && pop.scrollHeight > window.innerHeight * 0.7) { try { pop.hidePopover(); } catch (e) { /* */ } pop.setAttribute('data-sheet-on-phone', ''); openOne = null; open(pop, trigger, viaKeyboard); return; }
    }
    initialFocus(pop, viaKeyboard);
    pop.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: 'trigger' } }));
  }
  function finish(pop, reason, refocus) {
    var t = pop.__dsTrigger;
    pop.__dsTrigger = null;
    if (openOne && openOne.pop === pop) openOne = null;
    setExpanded(pop, false);
    pop.removeAttribute('data-placed');
    if (refocus && t && t.isConnected) focusVisible(t);
    pop.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: reason } }));
  }
  function close(pop, reason, refocus) {
    if (pop.__dsSheet) { var s = pop.__dsSheet; pop.__dsSheet = null; s.close(reason, false); finish(pop, reason, refocus); return; }
    if (pop.matches(':popover-open')) { pop.__dsClosing = { reason: reason, refocus: refocus }; pop.hidePopover(); }
    else if (pop.__dsTrigger) finish(pop, reason, refocus);
  }
  function toggle(pop, trigger, viaKeyboard) {
    if (pop.__dsTrigger) close(pop, 'trigger', true); else open(pop, trigger, viaKeyboard);
  }

  DS.register('popover', function (pop) {
    if (!pop.id) return;
    if (!pop.getAttribute('aria-labelledby') && !pop.getAttribute('aria-label')) console.error('[DS] Popover without a title (lint)', pop);
    var keyboardPress = false;
    triggersOf(pop).forEach(function (t) {
      t.setAttribute('aria-expanded', 'false');
      t.setAttribute('aria-controls', pop.id);
      if (!t.hasAttribute('aria-haspopup')) t.setAttribute('aria-haspopup', 'dialog');
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') keyboardPress = true; });
      t.addEventListener('click', function (e) {
        e.preventDefault(); // JS owns opening (positioning, focus, Sheet on phone); native popovertarget is the no-JS path
        var kb = keyboardPress || e.detail === 0;
        keyboardPress = false;
        if (t.getAttribute('aria-disabled') === 'true' && pop.getAttribute('data-role') !== 'reason') {
          var r = reasonOf(t);
          if (r && DS.announce) DS.announce(r, 'polite');
          return;
        }
        toggle(pop, t, kb);
      });
    });
    // Close buttons inside (popovertargetaction="hide" or data-ds-popover-close)
    pop.addEventListener('click', function (e) {
      var c = e.target.closest('[popovertargetaction="hide"], [data-ds-popover-close]');
      if (!c) return;
      e.preventDefault();
      close(pop, 'close-button', true);
    });
    // native light dismiss / Esc arrive as a toggle to closed
    pop.addEventListener('toggle', function (e) {
      if (e.newState !== 'closed') return;
      var how = pop.__dsClosing; pop.__dsClosing = null;
      if (pop.__dsTrigger && !pop.__dsSheet) {
        var focusLost = pop.contains(document.activeElement) || document.activeElement === document.body;
        finish(pop, how ? how.reason : (pop.__dsEsc ? 'escape' : 'outside'), how ? how.refocus : (pop.__dsEsc || focusLost));
      }
      pop.__dsEsc = false;
    });
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape') pop.__dsEsc = true; });
    // focus leaving the popover (Tab past the last element, Shift+Tab before the first) closes it without moving focus
    pop.addEventListener('focusout', function (e) {
      var to = e.relatedTarget;
      if (!openOne || openOne.pop !== pop || pop.__dsSheet || !to) return;
      if (pop.contains(to)) return;
      close(pop, 'focus-out', false);
    });
    // form: Enter = Apply; invalid keeps it open with the error
    var form = pop.querySelector('form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var all = Array.prototype.slice.call(form.querySelectorAll('[required]'));
      var bad = all.filter(function (f) { return !f.value.trim(); })[0];
      all.forEach(function (f) {
        var err = f.getAttribute('aria-errormessage') && document.getElementById(f.getAttribute('aria-errormessage'));
        var invalid = !f.value.trim();
        f.setAttribute('aria-invalid', String(invalid));
        if (err) err.hidden = !invalid;
      });
      if (bad) { focusVisible(bad); return; }
      var msg = pop.getAttribute('data-ds-announce');
      close(pop, 'action', true);
      if (msg && DS.announce) DS.announce(msg.replace('{value}', (form.querySelector('input') || {}).value || ''), 'polite');
    });
    form && form.addEventListener('reset', function () { setTimeout(function () { close(pop, 'action', true); }, 0); });
  });

  // keep it attached while scrolling; close when the trigger leaves the viewport (focus returns to the trigger)
  window.addEventListener('scroll', function () {
    if (!openOne || openOne.pop.__dsSheet) return;
    var r = openOne.trigger.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) close(openOne.pop, 'outside', true); else place(openOne.pop);
  }, true);
  window.addEventListener('resize', function () { if (openOne) place(openOne.pop); });

  DS.popover = { open: open, close: function (pop, reason) { close(pop, reason || 'action', true); }, toggle: toggle };
})();
