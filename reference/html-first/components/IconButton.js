/* IconButton · engine 1.8.0 reference module (catalog/components/IconButton.json). Progressive enhancement only (§6.4):
   without JS the button keeps its aria-label (name), aria-pressed (state) and a native popovertarget for the blocked reason.
   Markup: button.ds-icon-button[data-ds-module="icon-button"][aria-label] (+ data-ds-label when the name carries extra text,
   e.g. aria-label="Notifications, 3 unread" and data-ds-label="Notifications" for the Tooltip).
   - label Tooltip through DS.tooltip (Tooltip.js): same text as the name (SC 2.5.3); aria-hidden, never read twice.
   - toggle: aria-pressed flips on press; fires ds:selectedchange { selected }.
   - blocked (aria-disabled): the press never reaches the action; the reason (aria-describedby) is announced politely and the
     reason Popover ([popovertarget] / data-ds-popover) opens, because an icon-only control has no room for visible text.
   - loading (aria-busy): presses are ignored (no double submit).
   DS.iconButton.setBadge(button, count, { one, other, max }) keeps the badge and the accessible name in sync (0 hides it). */
(function () {
  var DS = (window.DS = window.DS || {});
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && n.textContent.trim()) return n.textContent.replace(/\s+/g, ' ').trim(); }
    return '';
  }

  DS.register('icon-button', function (btn) {
    var label = btn.getAttribute('data-ds-label') || btn.getAttribute('aria-label') || '';
    if (!btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) console.error('[DS] IconButton without a label (UB10)', btn);
    if (label && DS.tooltip && !btn.hasAttribute('data-ds-tooltip') && btn.getAttribute('data-ds-tooltip-off') === null) {
      DS.tooltip.attach(btn, label, { side: btn.getAttribute('data-ds-tooltip-side') || undefined });
    }
    // capture phase: blocked / busy presses stop here, before any product handler
    btn.addEventListener('click', function (e) {
      if (btn.getAttribute('aria-busy') === 'true') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (btn.getAttribute('aria-disabled') === 'true') {
        var reason = reasonOf(btn);
        if (reason && DS.announce) DS.announce(reason, 'polite');
        if (DS.tooltip) DS.tooltip.hide(true);
        // no product handler runs; only the reason Popover opens (Popover.js when present, else the native popovertarget)
        e.stopImmediatePropagation();
        var pop = document.getElementById(btn.getAttribute('data-ds-popover') || btn.getAttribute('popovertarget') || '');
        if (pop && DS.popover) { e.preventDefault(); DS.popover.toggle(pop, btn); }
        else if (!pop) e.preventDefault();
        return;
      }
      if (btn.hasAttribute('aria-pressed')) {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(on));
        btn.dispatchEvent(new CustomEvent('ds:selectedchange', { bubbles: true, detail: { selected: on } }));
      }
    }, true);
  });

  DS.iconButton = {
    setBadge: function (btn, count, opts) {
      opts = opts || {};
      var base = btn.getAttribute('data-ds-label') || btn.getAttribute('aria-label') || '';
      if (!btn.hasAttribute('data-ds-label')) btn.setAttribute('data-ds-label', base);
      var badge = btn.querySelector('.ds-badge');
      if (!count) { if (badge) badge.hidden = true; btn.setAttribute('aria-label', base); return; }
      var max = opts.max || 99;
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ds-badge';
        badge.setAttribute('data-placement', 'corner');
        if (opts.status) badge.setAttribute('data-status', opts.status); // attention class chosen by the product (Badge tokens)
        badge.setAttribute('aria-hidden', 'true');
        btn.appendChild(badge);
      }
      badge.hidden = false;
      badge.textContent = count > max ? max + '+' : String(count);
      var phrase = count > max ? (opts.more || 'more than {n}').replace('{n}', max) : (count === 1 ? (opts.one || '{n} unread') : (opts.other || '{n} unread')).replace('{n}', count);
      btn.setAttribute('aria-label', base + ', ' + phrase);
    }
  };
})();
