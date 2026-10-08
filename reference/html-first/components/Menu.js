/* Menu · engine 1.8.0 reference module (catalog/components/Menu.json). Progressive enhancement only (§6.4).
   No-JS markup (works as a disclosure with real buttons and links):
     details.ds-menu#<id>[data-ds-module="menu"][data-align="start|end"][data-ds-label="<sheet title>"]
       > summary.ds-menu__trigger (Button / IconButton classes)
       + div.ds-menu__content > (.ds-menu__group[role=group] | .ds-menu__item | hr.ds-menu__separator | details.ds-menu__sub)…
     item types: button/a.ds-menu__item; [data-type="checkbox"|"radio"] with aria-pressed (no-JS) → aria-checked (JS).
   With JS: button[aria-haspopup=menu][aria-expanded][aria-controls] + .ds-menu__content[role=menu][popover=manual] (top layer).
   - Enter / Space / ↓ open on the first item, ↑ on the last; ↑/↓ wrap, Home/End, typeahead (--timing-typeahead).
   - Enter / Space / click run the item and close (focus back to the trigger, or stays with data-opens-dialog); Space on a
     checkbox item toggles without closing; blocked items (aria-disabled) announce their reason and the menu stays open.
   - Esc closes and returns focus; Tab closes and moves on from the trigger; outside press closes without running anything.
   - submenu: → (← in RTL) or hover (delay + grace period) opens, ← / Esc returns to the SubTrigger.
   - context variant: [data-ds-menu-context="<menu id>"] opens the same menu on right click, long press, Shift+F10 or the Menu key.
   - phone (< --bp-tablet): the items are presented in a bottom Sheet (DS.sheet) as plain buttons; submenus drill down with Back.
   Events on the wrapper: ds:openchange { open, reason }, ds:menuselect { item, value }, ds:selectedchange, ds:valuechange. */
(function () {
  var DS = (window.DS = window.DS || {});
  var uid = 0;
  function cssVal(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function px(name, fallback) { var n = parseFloat(cssVal(name)); return isNaN(n) ? fallback : n; }
  function ms(name, fallback) { var v = cssVal(name); var n = parseFloat(v); if (isNaN(n)) return fallback; return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n; }
  function focusVisible(el) { try { el.focus({ focusVisible: true, preventScroll: false }); } catch (e) { el.focus(); } }
  function isPhone() { return window.matchMedia('(max-width: ' + (px('--bp-tablet', 600) - 0.02) + 'px)').matches; }
  function announce(m) { if (m && DS.announce) DS.announce(m, 'polite'); }
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && n.textContent.trim()) return n.textContent.replace(/\s+/g, ' ').trim(); }
    return '';
  }
  function supportsPopover() { return 'popover' in HTMLElement.prototype; }

  /* same helper as Popover.js (whichever loads first defines it) */
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

  /* ---- upgrade: details/summary → button + role=menu ---- */
  function toButton(summary, extra) {
    var b = document.createElement('button');
    b.type = 'button';
    for (var i = 0; i < summary.attributes.length; i++) b.setAttribute(summary.attributes[i].name, summary.attributes[i].value);
    b.innerHTML = summary.innerHTML;
    if (!b.id) b.id = 'ds-menu-t' + (++uid);
    for (var k in extra) b.setAttribute(k, extra[k]);
    return b;
  }
  function upgradeItems(content) {
    var kids = Array.prototype.slice.call(content.children);
    kids.forEach(function (el) {
      if (el.matches('details.ds-menu__sub')) {
        var sum = el.querySelector(':scope > summary');
        var sub = el.querySelector(':scope > .ds-menu__content');
        if (!sub.id) sub.id = 'ds-menu-s' + (++uid);
        var st = toButton(sum, { role: 'menuitem', tabindex: '-1', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': sub.id });
        sub.setAttribute('role', 'menu');
        sub.setAttribute('data-sub', '');
        sub.setAttribute('aria-labelledby', st.id);
        if (supportsPopover()) sub.setAttribute('popover', 'manual');
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'ds-menu__item ds-menu__back';
        back.setAttribute('data-ds-back', '');
        back.innerHTML = '<svg class="ds-icon" data-mirror aria-hidden="true"><use href="#ds-i-chevron-left"/></svg><span class="ds-menu__label"></span>';
        back.querySelector('.ds-menu__label').textContent = el.getAttribute('data-back-label') || 'Back';
        sub.insertBefore(back, sub.firstChild);
        el.parentNode.insertBefore(st, el);
        el.parentNode.insertBefore(sub, el);
        el.remove();
        upgradeItems(sub);
        return;
      }
      if (el.matches('.ds-menu__group, [role="group"]')) { upgradeItems(el); return; }
      if (!el.matches('.ds-menu__item')) return;
      var type = el.getAttribute('data-type');
      if (type === 'checkbox' || type === 'radio') {
        el.setAttribute('role', type === 'checkbox' ? 'menuitemcheckbox' : 'menuitemradio');
        el.setAttribute('aria-checked', el.getAttribute('aria-pressed') === 'true' ? 'true' : 'false');
        el.removeAttribute('aria-pressed');
      } else el.setAttribute('role', 'menuitem');
      el.setAttribute('tabindex', '-1');
    });
  }
  function itemsOf(menu) {
    // items of this menu level (inside groups too, never inside a submenu), rendered only (Back exists only in the Sheet)
    return Array.prototype.slice.call(menu.querySelectorAll('.ds-menu__item')).filter(function (it) {
      return it.parentElement.closest('.ds-menu__content') === menu && it.getClientRects().length > 0;
    });
  }
  function labelOf(it) { var l = it.querySelector('.ds-menu__label'); return (l ? l.textContent : it.textContent).trim().toLowerCase(); }

  DS.register('menu', function (details) {
    if (details.tagName !== 'DETAILS') return;
    var summary = details.querySelector(':scope > summary');
    var content = details.querySelector(':scope > .ds-menu__content');
    if (!summary || !content) return;
    if (!content.id) content.id = (details.id || 'ds-menu-' + (++uid)) + '-content';
    var trigger = toButton(summary, { 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': content.id });
    trigger.classList.add('ds-menu__trigger');
    var root = document.createElement('div');
    for (var i = 0; i < details.attributes.length; i++) if (details.attributes[i].name !== 'open') root.setAttribute(details.attributes[i].name, details.attributes[i].value);
    root.removeAttribute('data-ds-module');
    root.__dsInit = true;
    content.setAttribute('role', 'menu');
    content.setAttribute('aria-labelledby', trigger.id);
    if (supportsPopover()) content.setAttribute('popover', 'manual');
    upgradeItems(content);
    root.appendChild(trigger);
    root.appendChild(content);
    details.parentNode.replaceChild(root, details);
    // keep a trigger-only Tooltip for icon triggers (label = name)
    if (trigger.classList.contains('ds-icon-button') && DS.tooltip && trigger.getAttribute('aria-label')) DS.tooltip.attach(trigger, trigger.getAttribute('data-ds-label') || trigger.getAttribute('aria-label'));

    var state = { open: false, sheet: null, returnTo: trigger, anchor: trigger, subs: [] };
    var typeBuf = '', typeTimer = 0, subTimer = 0;

    function setActive(menu, it, viaKeyboard) {
      if (!it) return;
      if (viaKeyboard) focusVisible(it); else it.focus({ preventScroll: true });
    }
    function showContent(menu, anchor, opts) {
      if (menu.showPopover && menu.hasAttribute('popover') && !menu.matches(':popover-open')) { try { menu.showPopover(); } catch (e) { /* */ } }
      DS.anchor(menu, anchor, opts);
    }
    function hideContent(menu) {
      if (menu.hasAttribute('popover') && menu.matches(':popover-open')) menu.hidePopover();
      menu.removeAttribute('data-placed');
    }
    function closeSubs(except) {
      state.subs = state.subs.filter(function (s) {
        if (s === except) return true;
        hideContent(s);
        var st = document.getElementById(s.getAttribute('aria-labelledby'));
        if (st) st.setAttribute('aria-expanded', 'false');
        return false;
      });
    }
    function openSub(st, focusFirst) {
      var sub = document.getElementById(st.getAttribute('aria-controls'));
      if (!sub) return;
      if (state.sheet) { // drill-down inside the Sheet
        content.setAttribute('data-drill', '');
        var holder = sub; while (holder.parentElement && holder.parentElement !== content) holder = holder.parentElement;
        holder.setAttribute('data-drill-active', ''); sub.setAttribute('data-drill-active', '');
        state.drill = { st: st, sub: sub, holder: holder };
        var first = itemsOf(sub)[0]; if (first) focusVisible(first);
        return;
      }
      closeSubs();
      st.setAttribute('aria-expanded', 'true');
      showContent(sub, st, { side: 'inline-end', align: 'start', gap: 0, dirFrom: st });
      state.subs.push(sub);
      if (focusFirst) { var f = itemsOf(sub)[0]; if (f) focusVisible(f); }
    }
    function closeDrill() {
      if (!state.drill) return;
      content.removeAttribute('data-drill');
      state.drill.holder.removeAttribute('data-drill-active'); state.drill.sub.removeAttribute('data-drill-active');
      var st = state.drill.st; state.drill = null; focusVisible(st);
    }

    function setSheetMode(on) {
      var nodes = [content].concat(Array.prototype.slice.call(content.querySelectorAll('[role="menu"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], .ds-menu__item')));
      nodes.forEach(function (n) {
        if (on) {
          if (n.hasAttribute('role')) n.setAttribute('data-ds-role', n.getAttribute('role'));
          n.removeAttribute('role');
          if (n.getAttribute('tabindex') === '-1') n.removeAttribute('tabindex');
          if (n.hasAttribute('aria-checked')) { n.setAttribute('aria-pressed', n.getAttribute('aria-checked')); n.removeAttribute('aria-checked'); }
          if (n.hasAttribute('popover')) { n.setAttribute('data-ds-popover-attr', ''); n.removeAttribute('popover'); }
        } else {
          if (n.hasAttribute('data-ds-role')) { n.setAttribute('role', n.getAttribute('data-ds-role')); n.removeAttribute('data-ds-role'); }
          if (n.classList.contains('ds-menu__item')) n.setAttribute('tabindex', '-1');
          if (n.hasAttribute('aria-pressed') && /menuitem(checkbox|radio)/.test(n.getAttribute('role') || '')) { n.setAttribute('aria-checked', n.getAttribute('aria-pressed')); n.removeAttribute('aria-pressed'); }
          if (n.hasAttribute('data-ds-popover-attr')) { n.setAttribute('popover', 'manual'); n.removeAttribute('data-ds-popover-attr'); }
        }
      });
      if (on) content.setAttribute('data-sheet', ''); else { content.removeAttribute('data-sheet'); content.removeAttribute('data-drill'); }
    }

    function loadAsync(done) {
      var tplId = root.getAttribute('data-ds-async-template');
      var tpl = tplId && document.getElementById(tplId);
      if (!tpl || root.__dsLoaded) { done(); return; }
      root.__dsLoaded = true;
      content.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        content.textContent = '';
        content.appendChild(tpl.content.cloneNode(true));
        upgradeItems(content);
        if (state.sheet) setSheetMode(true);
        content.removeAttribute('aria-busy');
        if (state.open) { var f = itemsOf(content)[0]; if (f) focusVisible(f); if (!state.sheet) DS.anchor(content, state.anchor, { side: 'block-end', align: root.getAttribute('data-align') || 'start', dirFrom: trigger }); }
      }, parseInt(root.getAttribute('data-ds-async-delay') || '800', 10));
      done();
    }

    function open(which, opts) {
      opts = opts || {};
      if (state.open) return;
      state.open = true;
      state.returnTo = opts.returnTo || trigger;
      state.anchor = opts.anchor || trigger;
      trigger.setAttribute('aria-expanded', 'true');
      if (DS.tooltip) DS.tooltip.hide(true);
      if (isPhone() && DS.sheet && DS.sheet.present) {
        setSheetMode(true);
        state.sheet = DS.sheet.present({
          title: root.getAttribute('data-ds-label') || trigger.getAttribute('aria-label') || trigger.textContent.trim(),
          nodes: [content],
          returnFocus: state.returnTo,
          onClose: function (reason) { if (!state.sheet) return; state.sheet = null; setSheetMode(false); finish(reason || 'escape', false); }
        });
      } else {
        showContent(content, state.anchor, { side: 'block-end', align: root.getAttribute('data-align') || 'start', dirFrom: trigger });
      }
      loadAsync(function () {
        var items = itemsOf(content);
        var target = which === 'last' ? items[items.length - 1] : items[0];
        if (target) setActive(content, target, opts.keyboard !== false);
      });
      root.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: opts.reason || 'trigger' } }));
    }
    function finish(reason, refocus) {
      state.open = false;
      trigger.setAttribute('aria-expanded', 'false');
      closeSubs();
      if (refocus && state.returnTo && state.returnTo.isConnected) focusVisible(state.returnTo);
      root.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: reason } }));
    }
    function close(reason, refocus) {
      if (!state.open) return;
      if (state.sheet) { var s = state.sheet; state.sheet = null; s.close(reason, false); setSheetMode(false); finish(reason, refocus); return; }
      hideContent(content);
      finish(reason, refocus);
    }

    function activate(it, how) {
      var menu = it.parentElement.closest('.ds-menu__content');
      if (it.hasAttribute('data-ds-back')) { closeDrill(); return; }
      if (it.getAttribute('aria-disabled') === 'true') { announce(reasonOf(it) || labelOf(it)); return; }
      if (it.getAttribute('aria-haspopup') === 'menu') { openSub(it, true); return; }
      var role = it.getAttribute('role') || it.getAttribute('data-ds-role');
      var checkedAttr = state.sheet ? 'aria-pressed' : 'aria-checked';
      if (role === 'menuitemcheckbox') {
        var on = it.getAttribute(checkedAttr) !== 'true';
        it.setAttribute(checkedAttr, String(on));
        root.dispatchEvent(new CustomEvent('ds:selectedchange', { bubbles: true, detail: { item: it, selected: on } }));
        if (how === 'space') return;
      } else if (role === 'menuitemradio') {
        var group = it.closest('[role="group"], .ds-menu__group') || menu;
        Array.prototype.slice.call(group.querySelectorAll('.ds-menu__item[data-type="radio"]')).forEach(function (r) { r.setAttribute(checkedAttr, String(r === it)); });
        root.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { item: it, value: it.getAttribute('data-value') || labelOf(it) } }));
        if (how === 'space') return;
      } else {
        root.dispatchEvent(new CustomEvent('ds:menuselect', { bubbles: true, detail: { item: it, value: it.getAttribute('data-value') || labelOf(it) } }));
        var msg = it.getAttribute('data-ds-announce');
        if (msg) setTimeout(function () { announce(msg); }, 0);
      }
      close('item', !it.hasAttribute('data-opens-dialog'));
      if (it.tagName === 'A' && how !== 'pointer') it.click(); // links navigate after the menu closed
    }

    function onKey(e) {
      var it = e.target.closest('.ds-menu__item');
      var menu = e.target.closest('.ds-menu__content');
      if (!menu) return;
      var items = itemsOf(menu), i = items.indexOf(it), rtl = getComputedStyle(menu).direction === 'rtl';
      var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
      var t = null;
      if (e.key === 'ArrowDown') t = items[(i + 1) % items.length];
      else if (e.key === 'ArrowUp') t = items[(i - 1 + items.length) % items.length];
      else if (e.key === 'Home' || e.key === 'PageUp') t = items[0];
      else if (e.key === 'End' || e.key === 'PageDown') t = items[items.length - 1];
      else if (e.key === fwd && it && it.getAttribute('aria-haspopup') === 'menu' && !state.sheet) { e.preventDefault(); openSub(it, true); return; }
      else if ((e.key === back || e.key === 'Escape') && menu.hasAttribute('data-sub') && !state.sheet) {
        e.preventDefault(); e.stopPropagation();
        var st = document.getElementById(menu.getAttribute('aria-labelledby'));
        closeSubs(); if (st) focusVisible(st); return;
      }
      else if (e.key === back && state.sheet && state.drill) { e.preventDefault(); closeDrill(); return; }
      else if (e.key === 'Escape' && !state.sheet) { e.preventDefault(); e.stopPropagation(); close('escape', true); return; }
      else if (e.key === 'Tab' && !state.sheet) { close('tab', true); return; } // focus is on the trigger; the default Tab moves on from there
      else if ((e.key === 'Enter' || e.key === ' ') && it) {
        if (it.tagName === 'A' && e.key === 'Enter') { close('item', true); return; } // native link activation
        e.preventDefault(); activate(it, e.key === ' ' ? 'space' : 'enter'); return;
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\S/.test(e.key)) {
        clearTimeout(typeTimer);
        typeBuf += e.key.toLowerCase();
        typeTimer = setTimeout(function () { typeBuf = ''; }, ms('--timing-typeahead', 500));
        var same = typeBuf.split('').every(function (c) { return c === typeBuf[0]; });
        var q = same ? typeBuf[0] : typeBuf;
        var order = items.slice(i + 1).concat(items.slice(0, i + 1));
        if (!same) order = items.slice(i).concat(items.slice(0, i));
        t = order.filter(function (x) { return labelOf(x).indexOf(q) === 0; })[0] || null;
        if (!t) return;
      } else return;
      e.preventDefault();
      if (t) { if (!menu.hasAttribute('data-sub')) closeSubs(); setActive(menu, t, true); }
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (state.open) close('trigger', true); else open('first', { keyboard: e.detail === 0, reason: 'trigger' });
    });
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!state.open) open(e.key === 'ArrowUp' ? 'last' : 'first', { keyboard: true }); }
    });
    content.addEventListener('keydown', onKey);
    content.addEventListener('click', function (e) {
      var it = e.target.closest('.ds-menu__item');
      if (!it || !content.contains(it)) return;
      if (it.tagName === 'A' && it.getAttribute('aria-disabled') !== 'true' && !it.hasAttribute('data-ds-back')) { close('item', false); return; } // let the link navigate
      e.preventDefault();
      if (e.detail === 0) return; // keyboard-generated clicks are handled in keydown
      activate(it, 'pointer');
    });
    // hover moves the active item (pointer only); SubTrigger opens after a delay, with a grace period towards the submenu
    content.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || state.sheet) return;
      var it = e.target.closest('.ds-menu__item');
      if (!it || document.activeElement === it) return;
      var menu = it.parentElement.closest('.ds-menu__content');
      it.focus({ preventScroll: true });
      clearTimeout(subTimer);
      if (it.getAttribute('aria-haspopup') === 'menu') subTimer = setTimeout(function () { openSub(it, false); }, ms('--timing-indicator-delay', 300));
      else if (!menu.hasAttribute('data-sub') && state.subs.length) subTimer = setTimeout(function () { closeSubs(); }, ms('--timing-close-delay', 100) * 3);
    });
    document.addEventListener('pointerdown', function (e) {
      if (!state.open || state.sheet) return;
      if (root.contains(e.target) || e.target.closest('.ds-menu__content[data-sub]')) return;
      var focusable = e.target.closest('a[href], button, input, select, textarea, [tabindex]');
      close('outside', !focusable);
    }, true);
    window.addEventListener('resize', function () { if (state.open && !state.sheet) { closeSubs(); DS.anchor(content, state.anchor, { side: 'block-end', align: root.getAttribute('data-align') || 'start', dirFrom: trigger }); } });
    window.addEventListener('scroll', function (e) {
      if (!state.open || state.sheet || content.contains(e.target)) return;
      var r = state.anchor.getBoundingClientRect ? state.anchor.getBoundingClientRect() : null;
      if (r && (r.bottom < 0 || r.top > window.innerHeight)) close('outside', false); else if (r) { closeSubs(); DS.anchor(content, state.anchor, { side: 'block-end', align: root.getAttribute('data-align') || 'start', dirFrom: trigger }); }
    }, true);

    // context variant: same menu from the object (right click / long press / Shift+F10 / Menu key)
    if (root.id) {
      var targets = document.querySelectorAll('[data-ds-menu-context="' + root.id + '"]');
      Array.prototype.forEach.call(targets, function (obj) {
        obj.addEventListener('contextmenu', function (e) {
          e.preventDefault();
          if (state.open) close('outside', false);
          var pt = { left: e.clientX, right: e.clientX, top: e.clientY, bottom: e.clientY, width: 0, height: 0 };
          open('first', { anchor: e.clientX || e.clientY ? pt : obj, returnTo: obj, keyboard: false, reason: 'trigger' });
        });
        obj.addEventListener('keydown', function (e) {
          if ((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu') { e.preventDefault(); open('first', { anchor: obj, returnTo: obj, keyboard: true }); }
        });
      });
    }
    root.__dsMenu = { open: open, close: close };
  });
})();
