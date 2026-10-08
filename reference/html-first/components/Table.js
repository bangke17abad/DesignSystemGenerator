/* Table · engine 1.8.0 reference module (catalog/components/Table.json). Progressive enhancement only (§6.4):
   without JS the table is complete and readable (sort/page links are query strings in a real app; secondary columns stay
   visible at tablet width). Enhancements:
   - scroll region: tabindex="0" + data-ds-scroll="x" only while its content actually overflows (SC 2.1.1, reflow honesty);
   - sort buttons: one aria-sort at a time, ascending → descending, rows reordered, announced politely;
   - selection: select-all (indeterminate = mixed), aria-disabled rows cannot change, bulk bar swaps with the toolbar;
   - stacked cards: missing data-label filled from the column header;
   - tablet expansion rows (aria-expanded + aria-controls);
   - role="grid" variant: one Tab stop, arrows, Home/End, Ctrl+Home/End, PageUp/PageDown, Enter/F2 edit, Esc restore;
   - virtualized variant (data-virtual-count + <template>): only visible rows rendered, aria-rowcount/aria-rowindex. */
(function () {
  var DS = (window.DS = window.DS || {});
  function announce(msg) { if (DS.announce) DS.announce(msg); }
  function txt(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }

  DS.register('table', function (root) {
    var scroll = root.querySelector('.ds-table__scroll');
    var table = root.querySelector('table');
    if (!table) return;
    var tbody = table.tBodies[0];
    var headRow = table.tHead && table.tHead.rows[table.tHead.rows.length - 1];
    var heads = headRow ? Array.prototype.slice.call(headRow.cells) : [];

    /* --- scroll region focusable only when it overflows --- */
    function syncOverflow() {
      if (!scroll) return;
      var over = scroll.scrollWidth > scroll.clientWidth + 1 || scroll.scrollHeight > scroll.clientHeight + 1;
      if (over) { scroll.setAttribute('tabindex', '0'); if (scroll.scrollWidth > scroll.clientWidth + 1) scroll.setAttribute('data-ds-scroll', 'x'); else scroll.removeAttribute('data-ds-scroll'); }
      else { scroll.removeAttribute('tabindex'); scroll.removeAttribute('data-ds-scroll'); }
    }

    /* --- data-label for stacked cards --- */
    function labelCells(rows) {
      for (var r = 0; r < rows.length; r++) {
        var cells = rows[r].cells;
        if (rows[r].classList.contains('ds-table__state-row') || rows[r].classList.contains('ds-table__expansion')) continue;
        for (var c = 0; c < cells.length; c++) {
          var h = heads[c];
          if (!h || cells[c].hasAttribute('data-label') || cells[c].classList.contains('ds-table__select-cell') || cells[c].classList.contains('ds-table__actions-cell') || cells[c].classList.contains('ds-table__expand-cell')) continue;
          var l = txt(h);
          if (l) cells[c].setAttribute('data-label', l);
        }
      }
    }
    if (tbody) labelCells(tbody.rows);

    /* --- sorting --- */
    function dataRows() {
      return Array.prototype.filter.call(tbody.rows, function (tr) { return !/ds-table__(state-row|skeleton-row|expansion|spacer)/.test(tr.className); });
    }
    function sortBy(th, dir) {
      var idx = heads.indexOf(th);
      heads.forEach(function (h) {
        if (h === th) h.setAttribute('aria-sort', dir); else h.removeAttribute('aria-sort');
        var icon = h.querySelector('.ds-table__sort use');
        if (icon) icon.setAttribute('href', h === th ? (dir === 'ascending' ? '#ds-i-chevron-up' : '#ds-i-chevron-down') : '#ds-i-sort');
      });
      var rows = dataRows();
      var key = function (tr) { var cell = tr.cells[idx]; if (!cell) return ''; var v = cell.getAttribute('data-sort-value'); return v !== null ? v : txt(cell); };
      var numeric = rows.every(function (tr) { var k = key(tr); return k === '' || !isNaN(parseFloat(k)); });
      rows.sort(function (a, b) {
        var x = key(a), y = key(b);
        var cmp = numeric ? (parseFloat(x) || 0) - (parseFloat(y) || 0) : x.localeCompare(y, document.documentElement.lang || undefined, { numeric: true });
        return dir === 'ascending' ? cmp : -cmp;
      });
      rows.forEach(function (tr) {
        var exp = tr.nextElementSibling && tr.nextElementSibling.classList.contains('ds-table__expansion') ? tr.nextElementSibling : null;
        tbody.appendChild(tr);
        if (exp) tbody.appendChild(exp);
      });
      var sel = root.querySelector('.ds-table__sort-by select');
      if (sel) sel.value = idx + ':' + dir;
      announce('Sorted by ' + txt(th.querySelector('.ds-table__sort') || th) + ', ' + dir);
      root.dispatchEvent(new CustomEvent('ds:sortchange', { bubbles: true, detail: { columnId: th.getAttribute('data-column') || String(idx), direction: dir } }));
    }
    root.addEventListener('click', function (e) {
      var b = e.target.closest('.ds-table__sort');
      if (!b || !root.contains(b)) return;
      var th = b.closest('th');
      sortBy(th, th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending');
    });
    var sortSelect = root.querySelector('.ds-table__sort-by select');
    if (sortSelect) sortSelect.addEventListener('change', function () {
      var p = sortSelect.value.split(':');
      if (heads[+p[0]]) sortBy(heads[+p[0]], p[1]);
    });

    /* --- selection + bulk bar --- */
    var all = root.querySelector('.ds-table__select-all');
    var bulk = root.querySelector('.ds-table__bulkbar');
    var toolbar = root.querySelector('.ds-table__toolbar');
    var countEl = root.querySelector('.ds-table__bulk-count');
    function boxes() { return Array.prototype.slice.call(tbody.querySelectorAll('.ds-table__check input[type="checkbox"]')); }
    function syncSelection(quiet) {
      var b = boxes();
      var enabled = b.filter(function (x) { return x.getAttribute('aria-disabled') !== 'true'; });
      var checked = b.filter(function (x) { return x.checked; });
      if (all) {
        var ce = enabled.filter(function (x) { return x.checked; }).length;
        all.checked = ce > 0 && ce === enabled.length;
        all.indeterminate = ce > 0 && ce < enabled.length;
      }
      if (bulk && toolbar) {
        var on = checked.length > 0;
        bulk.hidden = !on;
        toolbar.hidden = on;
      }
      if (countEl) countEl.textContent = checked.length + ' selected';
      if (!quiet) announce(checked.length + ' selected');
    }
    root.addEventListener('click', function (e) {
      var input = e.target.closest('.ds-table__check input');
      if (input && input.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        var why = input.getAttribute('aria-describedby');
        var n = why && document.getElementById(why.split(' ')[0]);
        if (n) announce(txt(n));
      }
      if (e.target.closest('[data-ds-clear-selection]')) {
        boxes().forEach(function (x) { if (x.getAttribute('aria-disabled') !== 'true') x.checked = false; });
        syncSelection();
        if (all) all.focus();
      }
    });
    root.addEventListener('change', function (e) {
      if (!e.target.matches('.ds-table__check input')) return;
      if (e.target === all) {
        var v = all.checked;
        boxes().forEach(function (x) { if (x.getAttribute('aria-disabled') !== 'true') x.checked = v; });
      }
      syncSelection();
      root.dispatchEvent(new CustomEvent('ds:selectedchange', { bubbles: true }));
    });
    if (tbody) syncSelection(true);

    /* --- expansion rows --- */
    root.addEventListener('click', function (e) {
      var t = e.target.closest('.ds-table__expand');
      if (!t) return;
      t.setAttribute('aria-expanded', String(t.getAttribute('aria-expanded') !== 'true'));
    });

    /* --- simple demo actions (Retry / Load more announce; a real app wires onRetry / onLoadMore) --- */
    root.addEventListener('click', function (e) {
      var a = e.target.closest('[data-ds-announce]');
      if (a && root.contains(a)) announce(a.getAttribute('data-ds-announce'));
    });

    /* --- interactive grid --- */
    if (table.getAttribute('role') === 'grid') initGrid(table);
    /* --- virtualization --- */
    if (table.hasAttribute('data-virtual-count') && scroll) initVirtual(table, scroll, function () { labelCells(tbody.rows); });

    root.setAttribute('data-ds-ready', '');
    syncOverflow();
    if (window.ResizeObserver && scroll) new ResizeObserver(syncOverflow).observe(scroll);
    else window.addEventListener('resize', syncOverflow);
  });

  function initGrid(table) {
    var cells = function () { return Array.prototype.slice.call(table.querySelectorAll('tr')).map(function (tr) { return Array.prototype.slice.call(tr.cells); }); };
    var grid = cells();
    var active = table.querySelector('[data-active]') || (grid[1] && grid[1][0]) || grid[0][0];
    grid.forEach(function (row) { row.forEach(function (c) { c.tabIndex = -1; }); });
    active.tabIndex = 0;
    function pos(cell) { for (var r = 0; r < grid.length; r++) { var i = grid[r].indexOf(cell); if (i >= 0) return [r, i]; } return [0, 0]; }
    function move(cell) { if (!cell) return; active.tabIndex = -1; active = cell; active.tabIndex = 0; active.focus(); }
    function editing(cell) { return cell.querySelector('.ds-table__editor'); }
    function startEdit(cell) {
      if (!cell.hasAttribute('data-editable') || editing(cell)) return;
      var original = cell.getAttribute('data-value') || txt(cell);
      cell.setAttribute('data-original', original);
      cell.textContent = '';
      var input = document.createElement('input');
      input.className = 'ds-table__editor';
      input.value = original;
      input.setAttribute('aria-label', (cell.getAttribute('data-label') || 'Value') + ', editing');
      if (cell.hasAttribute('data-numeric')) input.inputMode = 'decimal';
      cell.appendChild(input);
      input.focus();
      input.select();
    }
    function finish(cell, save) {
      var input = editing(cell);
      if (!input) return true;
      var v = input.value.trim();
      if (save && cell.getAttribute('data-validate') === 'number' && (v === '' || isNaN(Number(v.replace(',', '.'))))) {
        input.setAttribute('aria-invalid', 'true');
        var err = cell.querySelector('.ds-table__cell-error');
        if (!err) {
          err = document.createElement('span');
          err.className = 'ds-table__cell-error';
          err.id = 'ds-cell-err-' + Math.random().toString(36).slice(2, 8);
          err.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span>Enter a number</span>';
          cell.appendChild(err);
        }
        input.setAttribute('aria-describedby', err.id);
        cell.setAttribute('data-invalid', '');
        input.focus();
        return false; // error keeps focus in the cell
      }
      var value = save ? v : cell.getAttribute('data-original');
      cell.removeAttribute('data-invalid');
      cell.textContent = value;
      cell.setAttribute('data-value', value);
      if (save) table.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: value } }));
      cell.focus();
      return true;
    }
    table.addEventListener('click', function (e) {
      var c = e.target.closest('td, th');
      if (c && table.contains(c) && !editing(c)) move(c);
    });
    table.addEventListener('dblclick', function (e) { var c = e.target.closest('td'); if (c) startEdit(c); });
    table.addEventListener('keydown', function (e) {
      var cell = e.target.closest('td, th');
      if (!cell) return;
      var ed = editing(cell);
      if (ed) {
        if (e.key === 'Enter') { e.preventDefault(); finish(cell, true); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(cell, false); }
        else if (e.key === 'Tab') {
          if (!finish(cell, true)) { e.preventDefault(); return; }
          var editables = Array.prototype.slice.call(table.querySelectorAll('[data-editable]'));
          var nx = editables[editables.indexOf(cell) + (e.shiftKey ? -1 : 1)];
          if (nx) { e.preventDefault(); move(nx); startEdit(nx); }
        }
        return;
      }
      var p = pos(cell), r = p[0], c = p[1];
      var rtl = getComputedStyle(table).direction === 'rtl';
      var target = null;
      switch (e.key) {
        case 'ArrowRight': target = grid[r][c + (rtl ? -1 : 1)]; break;
        case 'ArrowLeft': target = grid[r][c + (rtl ? 1 : -1)]; break;
        case 'ArrowDown': target = grid[r + 1] && grid[r + 1][Math.min(c, grid[r + 1].length - 1)]; break;
        case 'ArrowUp': target = grid[r - 1] && grid[r - 1][Math.min(c, grid[r - 1].length - 1)]; break;
        case 'Home': target = e.ctrlKey ? grid[0][0] : grid[r][0]; break;
        case 'End': target = e.ctrlKey ? grid[grid.length - 1][grid[grid.length - 1].length - 1] : grid[r][grid[r].length - 1]; break;
        case 'PageDown': target = grid[Math.min(r + 5, grid.length - 1)][c]; break;
        case 'PageUp': target = grid[Math.max(r - 5, 0)][c]; break;
        case 'Enter': case 'F2': e.preventDefault(); startEdit(cell); return;
        default: return;
      }
      e.preventDefault();
      move(target);
    });
  }

  function initVirtual(table, scroll, after) {
    var tpl = table.parentNode.querySelector('template.ds-table__row-template') || document.querySelector('template.ds-table__row-template');
    if (!tpl) return;
    var count = parseInt(table.getAttribute('data-virtual-count'), 10) || 0;
    var tbody = table.tBodies[0];
    var cols = table.tHead.rows[0].cells.length;
    var rowH = 0, overscan = 6, first = -1;
    table.setAttribute('aria-rowcount', String(count + 1));
    function spacer(h) { var tr = document.createElement('tr'); tr.className = 'ds-table__spacer'; tr.setAttribute('aria-hidden', 'true'); var td = document.createElement('td'); td.colSpan = cols; td.style.blockSize = h + 'px'; td.style.padding = '0'; td.style.border = '0'; tr.appendChild(td); return tr; }
    function make(i) {
      var html = tpl.innerHTML.replace(/\{n\}/g, String(i + 1)).replace(/\{amount\}/g, ((i * 7919) % 900000 + 50000).toLocaleString((table.closest('[lang]') || document.documentElement).lang || undefined));
      var t = document.createElement('tbody');
      t.innerHTML = html.trim();
      var tr = t.rows[0];
      tr.setAttribute('aria-rowindex', String(i + 2)); // header row is 1
      return tr;
    }
    function render() {
      if (!rowH) { var probe = make(0); tbody.appendChild(probe); rowH = probe.getBoundingClientRect().height || 48; tbody.removeChild(probe); }
      var head = table.tHead.getBoundingClientRect().height;
      var visible = Math.ceil(scroll.clientHeight / rowH) + overscan * 2;
      var start = Math.max(0, Math.floor((scroll.scrollTop - head) / rowH) - overscan);
      var end = Math.min(count, start + visible);
      if (start === first) return;
      first = start;
      var frag = document.createDocumentFragment();
      frag.appendChild(spacer(start * rowH));
      for (var i = start; i < end; i++) frag.appendChild(make(i));
      frag.appendChild(spacer((count - end) * rowH));
      tbody.textContent = '';
      tbody.appendChild(frag);
      after();
    }
    scroll.addEventListener('scroll', render, { passive: true });
    render();
  }
})();
