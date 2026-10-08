/* Tabs · engine 1.8.0 reference module (catalog/components/Tabs.json). Progressive enhancement only (§6.4).
   No-JS: ul > li > a[href="#panel"] + section#panel (all panels visible in sequence, each with its heading).
   JS: role tablist/tab/tabpanel, roving tabindex (one Tab stop), ←/→ (↑/↓ when vertical; swapped in RTL) with wrap-around,
   Home/End, activation automatic (focus selects) or manual (data-activation="manual": Enter/Space selects), blocked tabs
   (aria-disabled) take focus but never select and announce their reason, pointer-only scroll buttons on overflow. */
(function () {
  var DS = (window.DS = window.DS || {});
  var uid = 0;
  DS.register('tabs', function (root) {
    if (root.getAttribute('data-variant') === 'links') return; // links variant is plain navigation
    var list = root.querySelector('.ds-tabs__list');
    var bar = root.querySelector('.ds-tabs__bar') || list.parentNode;
    if (!list) return;
    var vertical = root.getAttribute('data-orientation') === 'vertical';
    var manual = root.getAttribute('data-activation') === 'manual';
    var tabs = Array.prototype.slice.call(list.querySelectorAll('.ds-tabs__tab'));
    if (tabs.length < 2) return; // 0/1 tab: no tablist (panel shows directly with its heading)
    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
    var items = list.querySelectorAll('.ds-tabs__item');
    for (var k = 0; k < items.length; k++) items[k].setAttribute('role', 'presentation');
    var selected = null;
    tabs.forEach(function (tab) {
      var href = tab.getAttribute('href') || '';
      var panel = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
      if (!tab.id) tab.id = 'ds-tab-' + (++uid);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('data-href', href);
      tab.removeAttribute('href');
      if (panel) {
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        if (!panel.querySelector('a[href], button, input, select, textarea, [tabindex]')) panel.setAttribute('tabindex', '0');
      }
      tab.__panel = panel;
      if (tab.hasAttribute('data-selected') && tab.getAttribute('aria-disabled') !== 'true') selected = tab;
    });
    if (!selected) selected = tabs.filter(function (t) { return t.getAttribute('aria-disabled') !== 'true'; })[0] || tabs[0];

    function select(tab, announce) {
      if (tab.getAttribute('aria-disabled') === 'true') return;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (t.__panel) t.__panel.hidden = !on;
      });
      if (announce) root.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: tab.getAttribute('data-value') || tab.id }));
    }
    function reason(tab) {
      var ids = (tab.getAttribute('aria-describedby') || '').split(/\s+/);
      var txt = ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
      if (txt && DS.announce) DS.announce(txt);
    }
    function reveal(tab) {
      var lr = list.getBoundingClientRect(), tr = tab.getBoundingClientRect();
      if (tr.left < lr.left) list.scrollLeft -= lr.left - tr.left + 8;
      else if (tr.right > lr.right) list.scrollLeft += tr.right - lr.right + 8;
    }
    select(selected, false);
    root.setAttribute('data-ds-ready', '');
    reveal(selected);

    list.addEventListener('click', function (e) {
      var tab = e.target.closest('.ds-tabs__tab');
      if (!tab || !list.contains(tab)) return;
      e.preventDefault();
      if (tab.getAttribute('aria-disabled') === 'true') { reason(tab); tab.focus(); return; }
      select(tab, true);
    });
    list.addEventListener('keydown', function (e) {
      var tab = e.target.closest('.ds-tabs__tab');
      if (!tab) return;
      var rtl = getComputedStyle(root).direction === 'rtl';
      var nextKey = vertical ? 'ArrowDown' : (rtl ? 'ArrowLeft' : 'ArrowRight');
      var prevKey = vertical ? 'ArrowUp' : (rtl ? 'ArrowRight' : 'ArrowLeft');
      var i = tabs.indexOf(tab), target = null;
      if (e.key === nextKey) target = tabs[(i + 1) % tabs.length];
      else if (e.key === prevKey) target = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') target = tabs[0];
      else if (e.key === 'End') target = tabs[tabs.length - 1];
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (tab.getAttribute('aria-disabled') === 'true') reason(tab); else select(tab, true);
        return;
      }
      if (!target) return;
      e.preventDefault();
      tabs.forEach(function (t) { t.tabIndex = t === target ? 0 : -1; });
      target.focus();
      reveal(target);
      if (!manual && target.getAttribute('aria-disabled') !== 'true') select(target, true);
    });
    // roving tabindex: when focus leaves the list, the selected tab is the single Tab stop again
    list.addEventListener('focusout', function (e) {
      if (list.contains(e.relatedTarget)) return;
      tabs.forEach(function (t) { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    });

    // scroll buttons: pointer devices only, hidden from AT and out of the Tab order
    if (!vertical && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      ['start', 'end'].forEach(function (dir) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ds-tabs__scroll';
        b.setAttribute('data-dir', dir);
        b.setAttribute('tabindex', '-1');
        b.setAttribute('aria-hidden', 'true');
        b.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-chevron-' + (dir === 'start' ? 'left' : 'right') + '"/></svg>';
        b.addEventListener('click', function () {
          var rtl = getComputedStyle(root).direction === 'rtl';
          var step = list.clientWidth * 0.8 * (dir === 'end' ? 1 : -1) * (rtl ? -1 : 1);
          list.scrollBy({ left: step, behavior: 'smooth' });
        });
        bar.appendChild(b);
      });
      var update = function () {
        var max = list.scrollWidth - list.clientWidth;
        var pos = Math.abs(list.scrollLeft); // RTL scrollLeft is negative
        if (max > 1 && pos > 1) bar.setAttribute('data-overflow-start', ''); else bar.removeAttribute('data-overflow-start');
        if (max > 1 && pos < max - 1) bar.setAttribute('data-overflow-end', ''); else bar.removeAttribute('data-overflow-end');
      };
      list.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  });
})();
