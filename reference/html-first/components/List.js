/* List · engine 1.8.0 reference module (catalog/components/List.json). Progressive enhancement only (§6.4):
   static and navigable lists are plain ul/li + links and need no JS. This module adds:
   - listbox (ul[role=listbox]): roving tabindex (one Tab stop), ↑/↓, Home/End, Space selects (toggles on multiple),
     Shift+↑/↓ extends on multiple, click selects; aria-disabled options never change and announce their reason;
     no-JS fallback: render the same items as a list of Checkboxes in a form (see fixture);
   - reorderable lists ([data-reorderable]): Move up / Move down buttons and Alt+↑/↓ on the item action, position announced;
   - Load more ([data-ds-load-more]): spinner with locked width, items appended from a <template>, focus stays, count announced. */
(function () {
  var DS = (window.DS = window.DS || {});
  function announce(m) { if (DS.announce) DS.announce(m); }
  function reasonOf(el) {
    var id = el.getAttribute('aria-describedby');
    var n = id && document.getElementById(id.split(' ')[0]);
    return n ? n.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  DS.register('list', function (list) {
    if (list.getAttribute('role') === 'listbox') initListbox(list);
    if (list.hasAttribute('data-reorderable')) initReorder(list);
  });

  function initListbox(list) {
    var multi = list.getAttribute('aria-multiselectable') === 'true';
    var opts = function () { return Array.prototype.slice.call(list.querySelectorAll('[role="option"]')); };
    var all = opts();
    var start = all.filter(function (o) { return o.getAttribute('aria-selected') === 'true'; })[0] || all[0];
    var anchor = start;
    all.forEach(function (o) { o.tabIndex = o === start ? 0 : -1; if (!o.hasAttribute('aria-selected')) o.setAttribute('aria-selected', 'false'); });
    function focus(o) { opts().forEach(function (x) { x.tabIndex = x === o ? 0 : -1; }); o.focus(); }
    function set(o, on) {
      if (o.getAttribute('aria-disabled') === 'true') { var r = reasonOf(o); if (r) announce(r); return false; }
      o.setAttribute('aria-selected', String(on));
      return true;
    }
    function choose(o, extend) {
      var list_ = opts();
      if (!multi) { list_.forEach(function (x) { if (x !== o && x.getAttribute('aria-disabled') !== 'true') x.setAttribute('aria-selected', 'false'); }); set(o, true); }
      else if (extend) {
        var a = list_.indexOf(anchor), b = list_.indexOf(o);
        for (var i = Math.min(a, b); i <= Math.max(a, b); i++) set(list_[i], true);
      } else { set(o, o.getAttribute('aria-selected') !== 'true'); anchor = o; }
      var n = list_.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; }).length;
      announce(n + ' selected');
      list.dispatchEvent(new CustomEvent('ds:selectedchange', { bubbles: true, detail: list_.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; }).map(function (x) { return x.getAttribute('data-value') || x.id; }) }));
    }
    list.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]');
      if (!o || !list.contains(o)) return;
      focus(o);
      choose(o, multi && e.shiftKey);
    });
    list.addEventListener('keydown', function (e) {
      var o = e.target.closest('[role="option"]');
      if (!o) return;
      var list_ = opts(), i = list_.indexOf(o), t = null;
      if (e.key === 'ArrowDown') t = list_[Math.min(i + 1, list_.length - 1)];
      else if (e.key === 'ArrowUp') t = list_[Math.max(i - 1, 0)];
      else if (e.key === 'Home') t = list_[0];
      else if (e.key === 'End') t = list_[list_.length - 1];
      else if (e.key === ' ' || (e.key === 'Enter' && !multi)) { e.preventDefault(); choose(o, false); return; }
      if (!t) return;
      e.preventDefault();
      focus(t);
      if (multi && e.shiftKey) choose(t, true);
    });
  }

  function initReorder(list) {
    function items() { return Array.prototype.slice.call(list.children).filter(function (li) { return li.classList.contains('ds-list__item'); }); }
    function move(li, dir, focusSel) {
      var all = items(), i = all.indexOf(li), j = i + dir;
      if (j < 0 || j >= all.length) return;
      if (dir < 0) list.insertBefore(li, all[j]); else list.insertBefore(li, all[j].nextSibling);
      var title = li.querySelector('.ds-list__title');
      announce('Moved ' + (title ? title.textContent.trim() + ' ' : '') + 'to position ' + (j + 1) + ' of ' + all.length);
      list.dispatchEvent(new CustomEvent('ds:reorder', { bubbles: true, detail: { itemId: li.getAttribute('data-value') || '', fromIndex: i, toIndex: j } }));
      var menu = li.querySelector('details[open]');
      if (menu) menu.open = false;
      var f = li.querySelector(focusSel || '.ds-list__action, .ds-list__menu > summary');
      if (f) f.focus();
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-move]');
      if (!b || !list.contains(b)) return;
      move(b.closest('.ds-list__item'), b.getAttribute('data-ds-move') === 'up' ? -1 : 1, '.ds-list__menu > summary');
    });
    list.addEventListener('keydown', function (e) {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      var a = e.target.closest('.ds-list__action');
      if (!a) return;
      e.preventDefault();
      move(a.closest('.ds-list__item'), e.key === 'ArrowUp' ? -1 : 1);
    });
  }

  DS.register('list-load-more', function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-busy') === 'true' || btn.getAttribute('aria-disabled') === 'true') return;
      var list = document.getElementById(btn.getAttribute('aria-controls'));
      var tpl = btn.parentNode.querySelector('template');
      if (!list || !tpl) return;
      btn.style.inlineSize = btn.getBoundingClientRect().width + 'px'; // lock width while loading
      btn.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        var frag = tpl.content.cloneNode(true);
        var n = frag.querySelectorAll('li').length;
        list.appendChild(frag);
        btn.removeAttribute('aria-busy');
        btn.style.inlineSize = '';
        announce(n + ' more items loaded');
      }, 400);
    });
  });
})();
