/* CommandPalette · engine 1.8.0 reference module (catalog/components/CommandPalette.json). JS is required for the palette itself;
   the no-JS path is the visible opener, a link to an "All commands" page (§6.4).
   Markup: opener[data-ds-command-open=<id>] (a[href]) + dialog.ds-command-palette#<id>[data-ds-module="command-palette"]
   [data-shortcut="Mod+K"] > .ds-command-palette__input[role=combobox] + [role=listbox] > .ds-command-palette__group[role=group]
   [data-when="empty|query"] > .ds-command-palette__option[role=option][data-keywords][data-href|data-ds-announce].
   - Mod+K (⌘K / Ctrl+K, never a single key, SC 2.1.4) or the opener: opens, remembers the previously focused element, focus in input.
     Ignored inside [data-ds-shortcut-owner] (an editor that owns the same shortcut; the visible opener still works).
   - typing filters local options at once (labels + keywords, match marked bold + highlight), remote groups ([data-remote]) are
     debounced (--timing-debounce) with a "Searching…" row after the delay; stale responses are dropped by request id;
     the result count is announced politely; 0 results shows the empty state naming the query.
   - ↑/↓ (wrap), PageUp/PageDown move the active option via aria-activedescendant; Home/End stay with the caret.
   - Enter runs the active option (never during IME composition): blocked options announce their reason and stay open;
     others close the palette and focus the result (data-href target) or the element focused before opening.
   - Esc, Close and scrim close and return focus. Event: ds:command { id, label } on the dialog. */
(function () {
  var DS = (window.DS = window.DS || {});
  function cssVal(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function ms(n, f) { var v = cssVal(n), x = parseFloat(v); if (isNaN(x)) return f; return /ms$/.test(v) ? x : /s$/.test(v) ? x * 1000 : x; }
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }
  function announce(m) { if (m && DS.announce) DS.announce(m, 'polite'); }
  function norm(s) { return (s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); }
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && n.textContent.trim()) return n.textContent.replace(/\s+/g, ' ').trim(); }
    return '';
  }
  function matchShortcut(e, spec) {
    var parts = spec.split('+'), key = parts.pop().toLowerCase();
    var mac = DS.kbd ? DS.kbd.isMac() : /mac|iphone|ipad/i.test(navigator.platform || '');
    var wantMod = parts.indexOf('Mod') >= 0;
    var mod = mac ? e.metaKey : e.ctrlKey;
    if (!wantMod || !mod) return false; // modifier is mandatory (SC 2.1.4)
    if ((parts.indexOf('Shift') >= 0) !== e.shiftKey || (parts.indexOf('Alt') >= 0) !== e.altKey) return false;
    return (e.key || '').toLowerCase() === key;
  }

  DS.register('command-palette', function (dlg) {
    if (!dlg.showModal) return;
    var input = dlg.querySelector('.ds-command-palette__input');
    var list = dlg.querySelector('[role="listbox"]');
    var empty = dlg.querySelector('.ds-command-palette__empty');
    var emptyQuery = dlg.querySelector('[data-ds-query]');
    var searching = dlg.querySelector('.ds-command-palette__status[data-searching]');
    var shortcut = dlg.getAttribute('data-shortcut') || 'Mod+K';
    var previous = null, active = null, reqId = 0, remoteTimer = 0, announceTimer = 0, lastPt = '';
    var options = Array.prototype.slice.call(dlg.querySelectorAll('.ds-command-palette__option'));
    options.forEach(function (o) { var l = o.querySelector('.ds-command-palette__label'); if (l) o.__dsLabel = l.textContent; });

    function visibleOptions() { return options.filter(function (o) { return !o.hidden && !(o.closest('.ds-command-palette__group') || {}).hidden; }); }
    function setActive(o, scroll) {
      if (active) active.setAttribute('aria-selected', 'false');
      active = o || null;
      if (active) { active.setAttribute('aria-selected', 'true'); input.setAttribute('aria-activedescendant', active.id); if (scroll !== false) active.scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    }
    function mark(o, q) {
      var l = o.querySelector('.ds-command-palette__label');
      if (!l) return;
      var text = o.__dsLabel, i = q ? norm(text).indexOf(q) : -1;
      l.textContent = '';
      if (i < 0) { l.textContent = text; return; }
      l.appendChild(document.createTextNode(text.slice(0, i)));
      var m = document.createElement('mark'); m.className = 'ds-command-palette__match'; m.textContent = text.slice(i, i + q.length);
      l.appendChild(m);
      l.appendChild(document.createTextNode(text.slice(i + q.length)));
    }
    function filter() {
      var raw = input.value.trim(), q = norm(raw), tokens = q.split(/\s+/).filter(Boolean);
      var groups = Array.prototype.slice.call(dlg.querySelectorAll('.ds-command-palette__group'));
      groups.forEach(function (g) {
        var when = g.getAttribute('data-when');
        var remote = g.hasAttribute('data-remote');
        var show = when === 'empty' ? !q : when === 'query' ? !!q : true;
        var any = false;
        Array.prototype.forEach.call(g.querySelectorAll('.ds-command-palette__option'), function (o) {
          var hay = norm(o.__dsLabel + ' ' + (o.getAttribute('data-keywords') || ''));
          var ok = show && !remote && tokens.every(function (t) { return hay.indexOf(t) >= 0; });
          o.hidden = !ok;
          if (ok) { any = true; mark(o, q); }
        });
        g.hidden = remote ? true : !any;
      });
      var remoteGroups = groups.filter(function (g) { return g.hasAttribute('data-remote'); });
      clearTimeout(remoteTimer);
      if (searching) searching.hidden = true;
      list.removeAttribute('aria-busy');
      if (q && remoteGroups.length) {
        var my = ++reqId;
        remoteTimer = setTimeout(function () { // debounce, then "Searching…" while the source answers
          if (my !== reqId) return;
          if (searching) searching.hidden = false;
          list.setAttribute('aria-busy', 'true');
          setTimeout(function () {
            if (my !== reqId) return; // stale response dropped
            remoteGroups.forEach(function (g) {
              var any = false;
              Array.prototype.forEach.call(g.querySelectorAll('.ds-command-palette__option'), function (o) {
                var hay = norm(o.__dsLabel + ' ' + (o.getAttribute('data-keywords') || ''));
                var ok = tokens.every(function (t) { return hay.indexOf(t) >= 0; });
                o.hidden = !ok; if (ok) { any = true; mark(o, q); }
              });
              g.hidden = !any;
            });
            if (searching) searching.hidden = true;
            list.removeAttribute('aria-busy');
            settle(raw, true);
          }, parseInt(dlg.getAttribute('data-ds-remote-delay') || '600', 10));
        }, ms('--timing-debounce', 300));
      } else ++reqId;
      settle(raw, false);
    }
    function settle(raw, final) {
      var vis = visibleOptions();
      if (!active || vis.indexOf(active) < 0) setActive(vis[0], true);
      var none = !vis.length && (final || !list.getAttribute('aria-busy'));
      if (empty) { empty.hidden = !(none && raw); if (emptyQuery) emptyQuery.textContent = raw; }
      clearTimeout(announceTimer);
      announceTimer = setTimeout(function () {
        if (!raw) return;
        var n = visibleOptions().length;
        announce(n ? n + (n === 1 ? ' result' : ' results') : (empty ? empty.textContent.replace(/\s+/g, ' ').trim() : 'No results'));
      }, ms('--timing-debounce', 300) + 50);
    }
    function open(trigger) {
      if (dlg.open) { focusVisible(input); input.select(); return; }
      previous = trigger || document.activeElement;
      input.value = '';
      dlg.showModal();
      filter();
      focusVisible(input);
      dlg.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: trigger ? 'trigger' : 'shortcut' } }));
    }
    function close(reason, target) {
      dlg.__dsReason = reason; dlg.__dsTarget = target || null;
      dlg.close(reason);
    }
    function run(o) {
      if (!o) return;
      if (o.getAttribute('aria-disabled') === 'true') { announce(reasonOf(o) || o.__dsLabel); return; } // stays open
      var href = o.getAttribute('data-href');
      var target = href && href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
      dlg.dispatchEvent(new CustomEvent('ds:command', { bubbles: true, detail: { id: o.getAttribute('data-command') || o.id, label: o.__dsLabel } }));
      close('command', target);
      if (href && !target) { location.href = href; return; }
      var msg = o.getAttribute('data-ds-announce');
      if (msg) setTimeout(function () { announce(msg); }, 60);
    }

    var openers = document.querySelectorAll('[data-ds-command-open="' + dlg.id + '"]');
    Array.prototype.forEach.call(openers, function (op) {
      op.setAttribute('aria-haspopup', 'dialog');
      if (DS.kbd && !op.hasAttribute('aria-keyshortcuts')) op.setAttribute('aria-keyshortcuts', DS.kbd.ariaValue(shortcut));
      op.addEventListener('click', function (e) { e.preventDefault(); open(op); });
    });
    document.addEventListener('keydown', function (e) {
      if (!matchShortcut(e, shortcut)) return;
      if (e.target.closest && e.target.closest('[data-ds-shortcut-owner]')) return; // the editor keeps its own shortcut
      e.preventDefault();
      open(null);
    });
    input.addEventListener('input', function (e) { if (!e.isComposing) filter(); });
    input.addEventListener('compositionend', filter);
    input.addEventListener('keydown', function (e) {
      var vis = visibleOptions(), i = vis.indexOf(active), t = null;
      if (e.key === 'ArrowDown') t = vis[(i + 1) % vis.length];
      else if (e.key === 'ArrowUp') t = vis[(i - 1 + vis.length) % vis.length];
      else if (e.key === 'PageDown') t = vis[Math.min(i + 5, vis.length - 1)];
      else if (e.key === 'PageUp') t = vis[Math.max(i - 5, 0)];
      else if (e.key === 'Enter') {
        if (e.isComposing || e.keyCode === 229) return; // IME: Enter confirms the composition, never a command
        e.preventDefault();
        if (list.getAttribute('aria-busy') === 'true' && active && active.closest('[data-remote]')) return; // wait for stable results
        run(active); return;
      } else return;
      e.preventDefault();
      if (t) setActive(t, true);
    });
    list.addEventListener('pointermove', function (e) {
      var pt = e.clientX + ',' + e.clientY; if (pt === lastPt) return; lastPt = pt; // ignore synthetic moves while scrolling
      var o = e.target.closest('.ds-command-palette__option');
      if (o && o !== active) setActive(o, false);
    });
    list.addEventListener('click', function (e) { var o = e.target.closest('.ds-command-palette__option'); if (o) { setActive(o, false); run(o); } });
    list.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep DOM focus in the input
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('.ds-command-palette__close, [data-ds-command-close]')) { close('escape'); return; }
      if (e.target.closest('[data-ds-retry]')) { var a = e.target.closest('.ds-inline-alert'); if (a) a.hidden = true; filter(); focusVisible(input); return; }
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close('scrim');
    });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close('escape'); });
    dlg.addEventListener('close', function () {
      clearTimeout(remoteTimer); ++reqId;
      var target = dlg.__dsTarget;
      if (target) { if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1'); focusVisible(target); }
      else if (previous && previous.isConnected && previous !== document.body) focusVisible(previous);
      dlg.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: dlg.__dsReason || 'escape' } }));
    });
    DS.commandPalette = { open: open, close: close };
  });
})();
