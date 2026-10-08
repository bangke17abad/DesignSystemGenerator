/* Tooltip · engine 1.8.0 reference module (catalog/components/Tooltip.json). Progressive enhancement only (§6.4):
   without JS the trigger keeps its name (aria-label / visible text) and its description (aria-describedby), so nothing is lost.
   Markup: trigger[data-ds-module="tooltip"][data-ds-tooltip="<id>"] + .ds-tooltip#<id>[role=tooltip][popover=manual].
   Variant label: trigger aria-label = tooltip text, tooltip aria-hidden="true". Variant description: trigger aria-describedby=<id>.
   Hover opens after --timing-tooltip-delay, keyboard focus opens at once, Esc dismisses (and does not reach a parent dialog),
   the bubble is hoverable (SC 1.4.13), pressing the trigger closes it, touch opens on long press. One tooltip at a time. */
(function () {
  var DS = (window.DS = window.DS || {});
  var current = null; // { trigger, tip }
  var showTimer = 0, hideTimer = 0, lastHide = 0, uid = 0;
  var TOUCH_READ_MS = 1500; // catalog: read pause >= 1.5 s after the finger lifts

  function tokenMs(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!v) return fallback;
    var n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  }
  function tokenPx(name, fallback) {
    var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return isNaN(n) ? fallback : n;
  }
  function tipOf(trigger) {
    var id = trigger.getAttribute('data-ds-tooltip');
    if (!id) {
      var ids = (trigger.getAttribute('aria-describedby') || '').split(/\s+/);
      for (var i = 0; i < ids.length; i++) { var c = ids[i] && document.getElementById(ids[i]); if (c && c.classList.contains('ds-tooltip')) return c; }
      return null;
    }
    return document.getElementById(id);
  }

  function place(trigger, tip) {
    var gap = tokenPx('--space-2', 8);
    var r = trigger.getBoundingClientRect();
    var t = tip.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var rtl = getComputedStyle(trigger).direction === 'rtl';
    var side = trigger.getAttribute('data-ds-tooltip-side') || tip.getAttribute('data-prefer') || 'block-start';
    var phys = side === 'block-start' ? 'top' : side === 'block-end' ? 'bottom' : ((side === 'inline-start') !== rtl ? 'left' : 'right');
    var fits = { top: r.top - gap - t.height >= 0, bottom: r.bottom + gap + t.height <= vh, left: r.left - gap - t.width >= 0, right: r.right + gap + t.width <= vw };
    var opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    if (!fits[phys] && fits[opposite[phys]]) phys = opposite[phys];
    if (!fits[phys] && (phys === 'left' || phys === 'right')) phys = fits.top ? 'top' : 'bottom';
    var x, y;
    if (phys === 'top' || phys === 'bottom') { y = phys === 'top' ? r.top - gap - t.height : r.bottom + gap; x = r.left + r.width / 2 - t.width / 2; }
    else { x = phys === 'left' ? r.left - gap - t.width : r.right + gap; y = r.top + r.height / 2 - t.height / 2; }
    x = Math.max(gap, Math.min(x, vw - t.width - gap));
    y = Math.max(gap, Math.min(y, vh - t.height - gap));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    var logical = phys === 'top' ? 'block-start' : phys === 'bottom' ? 'block-end' : ((phys === 'left') !== rtl ? 'inline-start' : 'inline-end');
    tip.setAttribute('data-side', logical);
    var off;
    if (phys === 'top' || phys === 'bottom') { off = r.left + r.width / 2 - x; if (rtl) off = t.width - off; }
    else off = r.top + r.height / 2 - y;
    tip.style.setProperty('--_arrow-offset', Math.max(gap, Math.min(off, (phys === 'top' || phys === 'bottom' ? t.width : t.height) - gap)) + 'px');
  }

  function show(trigger) {
    var tip = tipOf(trigger);
    if (!tip || !tip.textContent.trim()) return; // empty text: no tooltip
    clearTimeout(showTimer); clearTimeout(hideTimer);
    if (current && current.trigger !== trigger) hide(true);
    if (tip.hasAttribute('popover') && tip.showPopover) { try { if (!tip.matches(':popover-open')) tip.showPopover(); } catch (e) { /* not connected */ } }
    else tip.hidden = false;
    place(trigger, tip);
    tip.setAttribute('data-open', '');
    current = { trigger: trigger, tip: tip };
  }
  function hide(immediate) {
    clearTimeout(showTimer); clearTimeout(hideTimer);
    if (!current) return;
    var tip = current.tip;
    tip.removeAttribute('data-open');
    if (tip.hasAttribute('popover') && tip.hidePopover) { try { if (tip.matches(':popover-open')) tip.hidePopover(); } catch (e) { /* ignore */ } }
    else tip.hidden = true;
    current = null;
    lastHide = immediate === true ? 0 : Date.now();
  }
  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, tokenMs('--timing-close-delay', 100));
  }

  function setup(trigger) {
    var tip = tipOf(trigger);
    if (!tip) return;
    if (!tip.id) tip.id = 'ds-tooltip-' + (++uid);
    if (!tip.hasAttribute('data-static') && !tip.hasAttribute('popover') && 'popover' in HTMLElement.prototype) tip.setAttribute('popover', 'manual');
    if (!tip.hasAttribute('role')) tip.setAttribute('role', 'tooltip');
    if (!tip.__dsBound) {
      tip.__dsBound = true;
      tip.addEventListener('pointerenter', function () { clearTimeout(hideTimer); }); // hoverable (SC 1.4.13)
      tip.addEventListener('pointerleave', function () { if (current && current.tip === tip && document.activeElement !== current.trigger) scheduleHide(); });
    }
    if (trigger.__dsBound) return;
    trigger.__dsBound = true;
    var dismissed = false, pressTimer = 0;

    trigger.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch' || dismissed) return;
      clearTimeout(hideTimer);
      if (current && current.trigger === trigger) return;
      var grouped = current || Date.now() - lastHide < tokenMs('--timing-close-delay', 100) * 3; // next tooltip in a group: no delay
      clearTimeout(showTimer);
      showTimer = setTimeout(function () { show(trigger); }, grouped ? 0 : tokenMs('--timing-tooltip-delay', 500));
    });
    trigger.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'touch') return;
      dismissed = false;
      clearTimeout(showTimer);
      if (current && current.trigger === trigger && !trigger.contains(document.activeElement)) scheduleHide();
    });
    trigger.addEventListener('ds:tooltip-dismissed', function () { dismissed = true; });
    trigger.addEventListener('focus', function () {
      if (dismissed) return;
      var kb = true;
      try { kb = trigger.matches(':focus-visible'); } catch (e) { /* old engines */ }
      if (kb) show(trigger);
    });
    trigger.addEventListener('blur', function () { dismissed = false; if (current && current.trigger === trigger) hide(); });
    trigger.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') {
        clearTimeout(pressTimer);
        pressTimer = setTimeout(function () { show(trigger); }, tokenMs('--timing-tooltip-delay', 500)); // long press
        return;
      }
      clearTimeout(showTimer);
      if (current && current.trigger === trigger) hide(); // pressing closes so the result is not covered
      dismissed = true;
    });
    var endPress = function () {
      clearTimeout(pressTimer);
      if (current && current.trigger === trigger) { clearTimeout(hideTimer); hideTimer = setTimeout(hide, TOUCH_READ_MS); }
    };
    trigger.addEventListener('pointerup', endPress);
    trigger.addEventListener('pointercancel', endPress);
  }

  // Esc closes the open tooltip only; the event stops here so a parent Modal/drawer stays open (catalog behaviour).
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && current) {
      var trig = current.trigger;
      hide();
      e.preventDefault();
      e.stopPropagation();
      trig.dispatchEvent(new CustomEvent('ds:tooltip-dismissed'));
    }
  }, true);
  // keep position while scrolling; close when the trigger leaves the viewport
  window.addEventListener('scroll', function () {
    if (!current) return;
    var r = current.trigger.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) hide(); else place(current.trigger, current.tip);
  }, true);
  window.addEventListener('resize', function () { if (current) place(current.trigger, current.tip); });
  document.addEventListener('pointerdown', function (e) {
    if (current && !current.trigger.contains(e.target) && !current.tip.contains(e.target)) hide();
  }, true);

  DS.register('tooltip', setup);

  /* Programmatic use (e.g. PrimaryNav rail labels): creates a label-variant tooltip (aria-hidden: the name already exists). */
  DS.tooltip = {
    attach: function (trigger, text, opts) {
      if (trigger.__dsTooltip) { trigger.__dsTooltip.textContent = text; return trigger.__dsTooltip; }
      var tip = document.createElement('div');
      tip.className = 'ds-tooltip';
      tip.setAttribute('role', 'tooltip');
      tip.setAttribute('aria-hidden', 'true');
      tip.setAttribute('data-ds-text', 'supporting');
      tip.id = 'ds-tooltip-' + (++uid);
      tip.textContent = text;
      if (opts && opts.side) tip.setAttribute('data-prefer', opts.side);
      trigger.insertAdjacentElement('afterend', tip);
      trigger.setAttribute('data-ds-tooltip', tip.id);
      trigger.__dsTooltip = tip;
      setup(trigger);
      return tip;
    },
    detach: function (trigger) {
      var tip = trigger.__dsTooltip;
      if (!tip) return;
      if (current && current.tip === tip) hide(true);
      tip.remove();
      trigger.removeAttribute('data-ds-tooltip');
      trigger.__dsTooltip = null;
    },
    hide: hide
  };
})();
