/* Pagination · engine 1.8.0 reference module (catalog/components/Pagination.json). Progressive enhancement only (§6.4):
   without JS every page / Previous / Next is a link (?page=n) that reloads the page, and the tools form submits with GET.
   Module "pagination" (nav[data-total][data-page-size][data-page][data-href="?page={page}"][data-controls=<collection id>]):
   page change in place (stand-in for fetch): the collection is aria-busy while loading, the pressed control shows a spinner at its
   locked width and further presses are ignored; afterwards the window (first, …, current ±2, …, last) is rebuilt, focus moves to
   the collection heading (tabindex −1) and the new range is announced politely. Go to page validates 1…total (error text,
   aria-invalid); Rows per page keeps the first visible item on screen. Boundary Previous/Next stay focusable (aria-disabled) and
   announce their reason. Module "pagination-load-more": appends items, focuses the first new one, announces the count. */
(function () {
  var DS = (window.DS = window.DS || {});
  function ms(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(), n = parseFloat(v);
    return isNaN(n) ? fallback : (/ms$/.test(v) ? n : (/s$/.test(v) ? n * 1000 : n));
  }
  function fmt(el) { var lang = (el.closest('[lang]') || document.documentElement).getAttribute('lang') || undefined; try { return new Intl.NumberFormat(lang); } catch (e) { return new Intl.NumberFormat(); } }
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    return ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
  }
  function spin(el, on) {
    if (on) { el.style.minInlineSize = el.offsetWidth + 'px'; el.setAttribute('aria-busy', 'true'); var s = document.createElement('span'); s.className = 'ds-pagination__spinner'; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); }
    else { el.removeAttribute('aria-busy'); el.style.minInlineSize = ''; var x = el.querySelector('.ds-pagination__spinner'); if (x) x.remove(); }
  }

  DS.register('pagination', function (nav) {
    var list = nav.querySelector('.ds-pagination__list');
    var prev = nav.querySelector('[data-step="prev"]'), next = nav.querySelector('[data-step="next"]');
    if (!list || !prev || !next) return;
    var total = parseInt(nav.getAttribute('data-total'), 10);
    var size = parseInt(nav.getAttribute('data-page-size') || '20', 10);
    var page = parseInt(nav.getAttribute('data-page') || '1', 10);
    var tpl = nav.getAttribute('data-href') || '?page={page}';
    var collection = document.getElementById(nav.getAttribute('data-controls') || '');
    var summary = nav.querySelector('.ds-pagination__summary');
    var status = nav.querySelector('.ds-pagination__status');
    var nf = fmt(nav);
    var pageWord = nav.getAttribute('data-label-page') || 'Page';
    var ofWord = nav.getAttribute('data-label-of') || 'of';
    var busy = false;
    function pages() { return Math.max(1, Math.ceil(total / size)); }
    function href(n) { return tpl.replace('{page}', n); }
    function range() { var from = (page - 1) * size + 1, to = Math.min(total, page * size); return nf.format(from) + '–' + nf.format(to) + ' ' + ofWord + ' ' + nf.format(total); }

    function render() {
      var last = pages();
      Array.prototype.slice.call(list.querySelectorAll('[data-kind="page"], [data-kind="gap"]')).forEach(function (li) { li.remove(); });
      var base = [];
      for (var n = 1; n <= last; n++) if (n === 1 || n === last || Math.abs(n - page) <= 2) base.push(n);
      var want = [];
      base.forEach(function (n, i) { if (i && n - base[i - 1] === 2) want.push(n - 1); want.push(n); }); // a one-page gap shows that page
      var anchor = list.querySelector('[data-kind="status"]') || next.closest('li');
      var prevN = 0;
      want.forEach(function (n) {
        if (prevN && n - prevN > 1) {
          var g = document.createElement('li');
          g.className = 'ds-pagination__item'; g.setAttribute('data-kind', 'gap'); g.setAttribute('aria-hidden', 'true');
          g.innerHTML = '<span class="ds-pagination__gap">…</span>';
          list.insertBefore(g, anchor);
        }
        var li = document.createElement('li');
        li.className = 'ds-pagination__item'; li.setAttribute('data-kind', 'page');
        if (Math.abs(n - page) >= 2 && n !== 1 && n !== last) li.setAttribute('data-near', '2');
        var a = document.createElement('a');
        a.className = 'ds-pagination__page'; a.href = href(n); a.setAttribute('data-page', n);
        a.innerHTML = '<span class="ds-vh">' + pageWord + ' </span><span>' + nf.format(n) + '</span>';
        if (n === page) a.setAttribute('aria-current', 'page');
        li.appendChild(a);
        list.insertBefore(li, anchor);
        prevN = n;
      });
      [[prev, page <= 1, page - 1], [next, page >= last, page + 1]].forEach(function (s) {
        var el = s[0];
        if (s[1]) { el.setAttribute('aria-disabled', 'true'); el.removeAttribute('href'); el.setAttribute('role', 'link'); el.tabIndex = 0; el.setAttribute('aria-describedby', el.getAttribute('data-reason-id') || ''); }
        else { el.removeAttribute('aria-disabled'); el.setAttribute('href', href(s[2])); el.removeAttribute('role'); el.removeAttribute('tabindex'); el.removeAttribute('aria-describedby'); }
      });
      if (summary) summary.textContent = range();
      if (status) status.textContent = pageWord + ' ' + nf.format(page) + ' ' + ofWord + ' ' + nf.format(last);
      nav.setAttribute('data-page', page);
    }

    function go(n, from) {
      if (busy || n < 1 || n > pages() || n === page) return;
      busy = true;
      if (from) spin(from, true);
      nav.setAttribute('aria-busy', 'true');
      if (collection) collection.setAttribute('aria-busy', 'true');
      window.setTimeout(function () { // stand-in for the fetch
        page = n;
        render();
        busy = false;
        nav.removeAttribute('aria-busy');
        if (from && from.isConnected) spin(from, false);
        if (collection) {
          collection.removeAttribute('aria-busy');
          var rows = collection.querySelectorAll('[data-row]');
          for (var i = 0; i < rows.length; i++) rows[i].textContent = (collection.getAttribute('data-row-label') || 'Row') + ' ' + nf.format((page - 1) * size + i + 1);
          var h = collection.querySelector('.ds-pagination-collection__heading');
          if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
        }
        if (DS.announce) DS.announce(range(), 'polite');
        nav.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: page }));
      }, ms('--motion-base-duration', 200));
    }

    nav.addEventListener('click', function (e) {
      var a = e.target.closest('.ds-pagination__page, .ds-pagination__step');
      if (!a || !nav.contains(a)) return;
      e.preventDefault();
      if (busy) return;
      if (a.getAttribute('aria-disabled') === 'true') { var r = reasonOf(a); if (r && DS.announce) DS.announce(r, 'polite'); return; }
      if (a.hasAttribute('data-page')) go(parseInt(a.getAttribute('data-page'), 10), a);
      else go(a.getAttribute('data-step') === 'prev' ? page - 1 : page + 1, a);
    });
    nav.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute && e.target.getAttribute('aria-disabled') === 'true') { e.preventDefault(); var r = reasonOf(e.target); if (r && DS.announce) DS.announce(r, 'polite'); }
    });

    var form = nav.querySelector('.ds-pagination__tools');
    var jump = form && form.querySelector('[name="page"]');
    var err = form && form.querySelector('.ds-pagination__error');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!jump) return;
      var n = parseInt(String(jump.value).replace(/[^\d]/g, ''), 10);
      if (!n || n < 1 || n > pages()) {
        jump.setAttribute('aria-invalid', 'true');
        if (err) { err.hidden = false; var t = err.querySelector('[data-text]'); if (t) t.textContent = (err.getAttribute('data-template') || 'Enter a page from 1 to {n}').replace('{n}', nf.format(pages())); }
        jump.focus();
        return;
      }
      jump.removeAttribute('aria-invalid');
      if (err) err.hidden = true;
      go(n, form.querySelector('.ds-pagination__go'));
    });
    var sizeSel = form && form.querySelector('[name="size"]');
    if (sizeSel) sizeSel.addEventListener('change', function () {
      var first = (page - 1) * size + 1;
      size = parseInt(sizeSel.value, 10);
      nav.setAttribute('data-page-size', size);
      page = Math.floor((first - 1) / size) + 1;
      render();
      if (DS.announce) DS.announce(range(), 'polite');
      nav.dispatchEvent(new CustomEvent('ds:pagesizechange', { bubbles: true, detail: size }));
    });
    render();
  });

  DS.register('pagination-load-more', function (root) {
    var btn = root.querySelector('.ds-pagination__more');
    var list = document.getElementById(root.getAttribute('data-controls') || '');
    var summary = root.querySelector('.ds-pagination__summary');
    if (!btn || !list) return;
    var total = parseInt(root.getAttribute('data-total'), 10), step = parseInt(root.getAttribute('data-page-size') || '20', 10);
    var nf = fmt(root), busy = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (busy || btn.getAttribute('aria-disabled') === 'true') return;
      busy = true;
      spin(btn, true);
      window.setTimeout(function () {
        var have = list.children.length, add = Math.min(step, total - have), firstNew = null;
        var label = list.getAttribute('data-row-label') || 'Item';
        for (var i = 0; i < add; i++) {
          var li = document.createElement('li');
          li.textContent = label + ' ' + nf.format(have + i + 1);
          list.appendChild(li);
          if (!firstNew) firstNew = li;
        }
        spin(btn, false);
        busy = false;
        var shown = list.children.length;
        if (summary) summary.textContent = (root.getAttribute('data-summary') || 'Showing {n} of {total}').replace('{n}', nf.format(shown)).replace('{total}', nf.format(total));
        if (shown >= total) { btn.setAttribute('aria-disabled', 'true'); btn.removeAttribute('href'); btn.setAttribute('role', 'button'); btn.tabIndex = 0; }
        if (firstNew) { firstNew.setAttribute('tabindex', '-1'); firstNew.focus(); }
        if (DS.announce) DS.announce((root.getAttribute('data-announce') || '{n} more items loaded').replace('{n}', nf.format(add)), 'polite');
      }, ms('--motion-base-duration', 200));
    });
  });
})();
