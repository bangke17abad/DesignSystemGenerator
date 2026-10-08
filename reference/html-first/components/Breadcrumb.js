/* Breadcrumb · engine 1.8.0 reference module (catalog/components/Breadcrumb.json). Progressive enhancement only (§6.4):
   without JS every ancestor is a link in Tab order and the list wraps.
   Adds: with more than maxItems (data-max-items, default 4) items, the middle ancestors are hidden and replaced by a labelled
   "…" button ("Show {n} more levels", aria-expanded/aria-controls). Enter/Space opens the list of hidden ancestors and focuses
   its first link; ↓/↑ move between them; Esc or Tab out closes and Esc returns focus to "…". The first item and the two nearest
   ancestors + current stay visible. Ellipsized labels get a title with the full name. */
(function () {
  var DS = (window.DS = window.DS || {});
  var uid = 0;
  DS.register('breadcrumb', function (nav) {
    var list = nav.querySelector('.ds-breadcrumb__list');
    if (!list) return;
    // full name for ellipsized labels (accessible name already holds it)
    Array.prototype.forEach.call(list.querySelectorAll('.ds-breadcrumb__label'), function (l) {
      if (l.scrollWidth > l.clientWidth + 1 && !l.closest('[title]')) l.parentNode.setAttribute('title', l.textContent.trim());
    });
    var items = Array.prototype.slice.call(list.children).filter(function (li) { return li.classList.contains('ds-breadcrumb__item'); });
    var max = parseInt(nav.getAttribute('data-max-items') || '4', 10);
    if (items.length <= max || items.length < 4) return;
    var hidden = items.slice(1, items.length - 3); // keep root, two nearest ancestors, current
    if (!hidden.length) return;
    var label = (nav.getAttribute('data-overflow-label') || 'Show {n} more levels').replace('{n}', hidden.length);
    var id = 'ds-breadcrumb-menu-' + (++uid);
    var li = document.createElement('li');
    li.className = 'ds-breadcrumb__item';
    li.setAttribute('data-overflow', '');
    li.innerHTML = '<button type="button" class="ds-breadcrumb__overflow" aria-expanded="false" aria-controls="' + id + '"><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-more-horizontal"/></svg></button><ul class="ds-breadcrumb__menu" id="' + id + '" hidden></ul>';
    var btn = li.firstChild, menu = li.lastChild;
    btn.setAttribute('aria-label', label);
    hidden.forEach(function (h) {
      var src = h.querySelector('.ds-breadcrumb__link, .ds-breadcrumb__text');
      var m = document.createElement('li');
      var a = document.createElement(src && src.tagName === 'A' ? 'a' : 'span');
      a.className = src && src.tagName === 'A' ? 'ds-breadcrumb__menu-link' : 'ds-breadcrumb__text';
      if (src && src.getAttribute('href')) a.setAttribute('href', src.getAttribute('href'));
      a.textContent = src ? src.textContent.trim() : h.textContent.trim();
      m.appendChild(a);
      menu.appendChild(m);
      h.hidden = true;
    });
    list.insertBefore(li, hidden[hidden.length - 1].nextSibling);
    var links = function () { return Array.prototype.slice.call(menu.querySelectorAll('a')); };

    function open() { menu.hidden = false; btn.setAttribute('aria-expanded', 'true'); var f = links()[0]; if (f) f.focus(); }
    function close(restore) { if (menu.hidden) return; menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (restore) btn.focus(); }
    btn.addEventListener('click', function () { if (menu.hidden) open(); else close(false); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { e.preventDefault(); close(true); return; }
      var ls = links(), i = ls.indexOf(document.activeElement);
      if (i < 0) return;
      var t = null;
      if (e.key === 'ArrowDown') t = ls[Math.min(i + 1, ls.length - 1)];
      else if (e.key === 'ArrowUp') t = ls[Math.max(i - 1, 0)];
      else if (e.key === 'Home') t = ls[0];
      else if (e.key === 'End') t = ls[ls.length - 1];
      if (t) { e.preventDefault(); t.focus(); }
    });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) close(false); });
    document.addEventListener('click', function (e) { if (!li.contains(e.target)) close(false); });
  });
})();
