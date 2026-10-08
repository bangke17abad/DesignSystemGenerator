/* BottomNav · engine 1.8.0 reference module (catalog/components/BottomNav.json). Progressive enhancement only (§6.4):
   without JS every destination is a plain link in Tab order and "More" is a link to the in-page list of remaining destinations.
   Adds: ←/→ + Home/End between items without wrapping (swapped in RTL); reselect of the current item scrolls to the top and is
   announced politely (ds:valuechange { reselect: true }); blocked items show their reason (Toast when loaded, else announce)
   and keep focus; "More" opens the sheet (<dialog>, showModal) with focus on its first destination, Esc / scrim / Close return
   focus to "More"; the bar hides while the virtual keyboard is open (visualViewport), shows labels beside icons in short
   landscape viewports, and stops being sticky when it takes more than a fifth of the viewport (200% text). */
(function () {
  var DS = (window.DS = window.DS || {});
  function px(name, fallback) { var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); return isNaN(n) ? fallback : n; }
  function labelOf(item) { var l = item.querySelector('.ds-bottom-nav__label'); return (l ? l.textContent : item.textContent).replace(/\s+/g, ' ').trim(); }
  function reasonOf(item) {
    var ids = (item.getAttribute('aria-describedby') || '').split(/\s+/);
    return ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
  }
  function isTextField(el) { return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) && !/^(button|submit|checkbox|radio|range|reset)$/.test(el.type || ''); }

  DS.register('bottom-nav', function (nav) {
    var items = Array.prototype.slice.call(nav.querySelectorAll('.ds-bottom-nav__item'));
    if (!items.length) { nav.hidden = true; return; } // 0 items: no empty bar
    var isStatic = nav.hasAttribute('data-static');

    function setCurrent(item) {
      items.forEach(function (i) { i.removeAttribute('aria-current'); i.removeAttribute('data-contains-current'); });
      if (item) item.setAttribute('aria-current', 'page');
    }

    nav.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var i = items.indexOf(e.target);
      if (i < 0) return;
      var rtl = getComputedStyle(nav).direction === 'rtl';
      var next = rtl ? 'ArrowLeft' : 'ArrowRight', prev = rtl ? 'ArrowRight' : 'ArrowLeft', t = null;
      if (e.key === next) t = items[Math.min(i + 1, items.length - 1)]; // no wrapping
      else if (e.key === prev) t = items[Math.max(i - 1, 0)];
      else if (e.key === 'Home') t = items[0];
      else if (e.key === 'End') t = items[items.length - 1];
      if (t) { e.preventDefault(); t.focus(); }
    });

    nav.addEventListener('click', function (e) {
      var item = e.target.closest('.ds-bottom-nav__item');
      if (!item || !nav.contains(item) || item.hasAttribute('data-ds-opens')) return;
      if (item.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        var r = reasonOf(item);
        if (r) { if (DS.toast) DS.toast({ label: r, returnFocus: item }); else if (DS.announce) DS.announce(r, 'polite'); }
        return;
      }
      var href = item.getAttribute('href') || '';
      if (item.getAttribute('aria-current') === 'page') { // reselect: back to the top / root of this destination
        e.preventDefault();
        var top = nav.closest('[data-ds-scroll-root]') || document.scrollingElement;
        if (top && top.scrollTo) top.scrollTo({ top: 0, behavior: 'smooth' });
        if (DS.announce) DS.announce(labelOf(item) + ', top', 'polite');
        nav.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: item.getAttribute('data-value') || href, href: href, reselect: true } }));
        return;
      }
      // Reference router stand-in: in-page hrefs move aria-current (a real router navigates and focuses the destination h1, §9.5).
      if (href.charAt(0) === '#') {
        e.preventDefault();
        setCurrent(item);
        nav.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: item.getAttribute('data-value') || href, href: href, reselect: false } }));
      }
    });

    // "More": sheet with the remaining destinations
    var more = nav.querySelector('.ds-bottom-nav__item[data-ds-opens]');
    var sheet = more && document.getElementById(more.getAttribute('data-ds-opens'));
    if (more && sheet && sheet.showModal) {
      more.setAttribute('role', 'button');
      more.setAttribute('aria-haspopup', 'dialog');
      more.setAttribute('aria-expanded', 'false');
      more.setAttribute('aria-controls', sheet.id);
      var open = function (e) {
        e.preventDefault();
        sheet.showModal();
        more.setAttribute('aria-expanded', 'true');
        var first = sheet.querySelector('[aria-current="page"]') || sheet.querySelector('.ds-bottom-nav__sheet-item');
        if (first) first.focus();
      };
      more.addEventListener('click', open);
      more.addEventListener('keydown', function (e) { if (e.key === ' ') open(e); });
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('.ds-bottom-nav__sheet-close')) { sheet.close('close-button'); return; }
        var link = e.target.closest('.ds-bottom-nav__sheet-item');
        if (link) {
          var href = link.getAttribute('href') || '';
          if (href.charAt(0) === '#') e.preventDefault();
          var cur = sheet.querySelectorAll('[aria-current="page"]');
          for (var k = 0; k < cur.length; k++) cur[k].removeAttribute('aria-current');
          link.setAttribute('aria-current', 'page');
          setCurrent(null);
          more.setAttribute('data-contains-current', '');
          sheet.close('navigate');
          nav.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: link.getAttribute('data-value') || href, href: href, reselect: false } }));
          return;
        }
        if (e.target === sheet) { // ::backdrop
          var b = sheet.getBoundingClientRect();
          if (e.clientY < b.top || e.clientY > b.bottom || e.clientX < b.left || e.clientX > b.right) sheet.close('scrim');
        }
      });
      sheet.addEventListener('close', function () { more.setAttribute('aria-expanded', 'false'); if (more.isConnected) more.focus(); });
      // destinations chosen inside the sheet keep "More" marked as containing the current page
      items.forEach(function (i) { if (i !== more) i.addEventListener('click', function () { if (i.getAttribute('aria-disabled') !== 'true') more.removeAttribute('data-contains-current'); }); });
    }

    if (isStatic) return; // previews: no viewport-driven behaviour

    // virtual keyboard open → hide (hideOnKeyboard, default true); short landscape → inline labels; 200% text → not sticky
    var hideOnKeyboard = nav.getAttribute('data-hide-on-keyboard') !== 'false';
    function layout() {
      var vv = window.visualViewport;
      var kb = hideOnKeyboard && vv && isTextField(document.activeElement) && window.innerHeight - vv.height > window.innerHeight * 0.25;
      if (kb) nav.setAttribute('data-keyboard-open', ''); else nav.removeAttribute('data-keyboard-open');
      var shortLandscape = window.innerHeight < px('--bp-tablet', 600) && window.innerWidth > window.innerHeight;
      if (shortLandscape) nav.setAttribute('data-layout', 'inline'); else nav.removeAttribute('data-layout');
      nav.removeAttribute('data-unstick');
      if (nav.offsetHeight > window.innerHeight / 5) nav.setAttribute('data-unstick', '');
    }
    layout();
    window.addEventListener('resize', layout);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
    document.addEventListener('focusin', layout);
    document.addEventListener('focusout', function () { window.setTimeout(layout, 0); });
  });
})();
