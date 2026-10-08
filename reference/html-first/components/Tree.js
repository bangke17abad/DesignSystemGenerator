/* Tree · engine 1.8.0 reference module (catalog/components/Tree.json). Progressive enhancement only (§6.4).
   No-JS: a nested list of links (ul > li > a.ds-tree__row + ul), fully expanded. On ul.ds-tree[data-ds-module="tree"]:
   - tree mode (bp-tablet and up, or data-drill="never"): role=tree/treeitem/group, aria-expanded (parents only),
     aria-level/setsize/posinset, roving tabindex (one Tab stop), ↓/↑, →/← (swapped in RTL), Home/End, typeahead
     (--timing-typeahead), * expands siblings, Enter activates, Space selects; variants navigation (aria-selected),
     single-select (aria-selected), multi-select (aria-multiselectable + aria-checked tri-state); toggle click opens without
     selecting, row click selects, double click toggles; lazy children (data-lazy + <template>, data-fail-once demo) with a
     loading row and an error row whose Retry is reached with ↓; blocked nodes (aria-disabled) announce their reason;
   - drill mode (below bp-tablet): one level per screen; parent rows open their level, a header gives Back + the parent name;
     leaves stay links. Modes switch live when the width crosses the breakpoint. */
(function () {
  var DS = (window.DS = window.DS || {});
  function say(m) { if (DS.announce) DS.announce(m, 'polite'); }
  function kids(el, sel) { return Array.prototype.filter.call(el.children, function (c) { return c.matches(sel); }); }
  function rowOf(li) { return kids(li, '.ds-tree__row')[0]; }
  function groupOf(li) { return kids(li, 'ul')[0]; }
  function labelOf(li) { var r = rowOf(li); var l = r && r.querySelector('.ds-tree__label'); return l ? l.textContent.trim() : (li.textContent || '').trim(); }
  function tokenMs(name, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); var n = parseFloat(v); return isNaN(n) ? fb : (/ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n); }

  DS.register('tree', function (root) {
    var variant = root.getAttribute('data-variant') || 'navigation';
    var multi = variant === 'multi-select';
    var header = null, mode = null, typed = '', typedAt = 0;
    var allLis = function () { return Array.prototype.slice.call(root.querySelectorAll('li')); };
    var nodes = function () { return allLis().filter(function (li) { return rowOf(li) || li.hasAttribute('data-status-row'); }); };
    var visibleNodes = function () { return nodes().filter(function (li) { return !li.closest('ul[hidden]'); }); };
    var parentLi = function (li) { var u = li.parentElement; return u && u !== root ? u.closest('li') : null; };

    /* ---------- tree mode ---------- */
    function setupTree() {
      mode = 'tree';
      root.setAttribute('role', 'tree');
      if (multi) root.setAttribute('aria-multiselectable', 'true');
      var first = null, selected = null;
      nodes().forEach(function (li) {
        initNode(li);
        if (li.getAttribute('aria-selected') === 'true') selected = selected || li;
        if (!first) first = li;
      });
      var start = (selected && !selected.closest('ul[hidden]')) ? selected : first;
      if (start) start.tabIndex = 0;
    }
    function initNode(li) {
      li.setAttribute('role', 'treeitem');
      var row = rowOf(li), g = groupOf(li);
      if (row && row.tagName === 'A' && row.hasAttribute('href')) { row.setAttribute('data-href', row.getAttribute('href')); row.removeAttribute('href'); }
      if (row) row.removeAttribute('role');
      var sibs = kids(li.parentElement, 'li');
      li.setAttribute('aria-level', String(levelOf(li)));
      li.setAttribute('aria-setsize', String(sibs.length));
      li.setAttribute('aria-posinset', String(sibs.indexOf(li) + 1));
      if (li.hasAttribute('data-status-row')) { if (!li.hasAttribute('data-error')) li.setAttribute('aria-disabled', 'true'); }
      else if (g || li.hasAttribute('data-lazy')) {
        var open = li.hasAttribute('data-expanded');
        li.setAttribute('aria-expanded', String(open));
        if (g) { g.setAttribute('role', 'group'); g.hidden = !open; }
      } else li.removeAttribute('aria-expanded');
      if (multi && !li.hasAttribute('data-status-row')) li.setAttribute('aria-checked', li.getAttribute('data-checked') || 'false');
      else if (!multi && !li.hasAttribute('data-status-row')) {
        if (li.hasAttribute('data-selected')) li.setAttribute('aria-selected', 'true');
        else if (variant === 'single-select') li.setAttribute('aria-selected', 'false');
        else li.removeAttribute('aria-selected');
      }
      li.tabIndex = -1;
    }
    function levelOf(li) { var n = 1, p = parentLi(li); while (p) { n++; p = parentLi(p); } return n; }
    function teardownTree() {
      root.removeAttribute('role'); root.removeAttribute('aria-multiselectable');
      allLis().forEach(function (li) {
        // keep the user's state for the next tree setup (mode switches when the width crosses the breakpoint)
        if (li.hasAttribute('aria-checked')) li.setAttribute('data-checked', li.getAttribute('aria-checked'));
        if (li.getAttribute('aria-selected') === 'true') li.setAttribute('data-selected', ''); else li.removeAttribute('data-selected');
        ['role', 'aria-level', 'aria-setsize', 'aria-posinset', 'aria-expanded', 'aria-selected', 'aria-checked', 'tabindex', 'aria-busy'].forEach(function (a) { li.removeAttribute(a); });
        if (li.hasAttribute('data-status-row')) li.removeAttribute('aria-disabled');
        var row = rowOf(li);
        if (row && row.hasAttribute('data-href')) row.setAttribute('href', row.getAttribute('data-href'));
        var g = groupOf(li); if (g) { g.removeAttribute('role'); g.hidden = false; }
      });
    }
    function focusNode(li) {
      if (!li) return;
      nodes().forEach(function (n) { n.tabIndex = -1; });
      li.tabIndex = 0; li.focus();
    }
    function setOpen(li, open) {
      if (!li.hasAttribute('aria-expanded') || li.getAttribute('aria-disabled') === 'true') return;
      li.setAttribute('aria-expanded', String(open));
      if (open) li.setAttribute('data-expanded', ''); else li.removeAttribute('data-expanded');
      var g = groupOf(li);
      if (li.hasAttribute('data-lazy') && open && !li.__dsLoaded) return loadChildren(li);
      if (g) g.hidden = !open;
      if (!open && li.__dsTimer) { window.clearTimeout(li.__dsTimer); li.removeAttribute('aria-busy'); if (g) g.remove(); li.__dsLoading = false; }
      root.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: nodes().filter(function (n) { return n.getAttribute('aria-expanded') === 'true'; }).map(function (n) { return n.getAttribute('data-node-id'); }) }));
    }
    function statusRow(text, error) {
      var li = document.createElement('li');
      li.setAttribute('data-status-row', '');
      li.className = 'ds-tree__status';
      var row = document.createElement('div');
      row.className = 'ds-tree__status-row';
      if (error) { row.setAttribute('data-error', ''); li.setAttribute('data-error', ''); }
      row.innerHTML = error
        ? '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span>' + text + '</span><span class="ds-tree__retry" aria-hidden="true">Retry</span><span class="ds-vh">. Press Enter to retry.</span>'
        : '<span class="ds-tree__spinner" aria-hidden="true"></span><span>' + text + '</span>';
      li.appendChild(row);
      return li;
    }
    function loadChildren(li) {
      var g = groupOf(li);
      if (g) g.remove();
      g = document.createElement('ul');
      g.setAttribute('role', 'group');
      var loading = statusRow(root.getAttribute('data-msg-loading') || 'Loading…', false);
      g.appendChild(loading);
      li.appendChild(g);
      decorate(loading, li);
      li.setAttribute('aria-busy', 'true');
      li.__dsLoading = true;
      li.__dsTimer = window.setTimeout(function () {
        li.removeAttribute('aria-busy');
        li.__dsLoading = false;
        g.textContent = '';
        if (li.hasAttribute('data-fail-once') && !li.__dsFailed) {
          li.__dsFailed = true;
          var err = statusRow(root.getAttribute('data-msg-error') || "Couldn't load items.", true);
          g.appendChild(err); decorate(err, li);
          say("Couldn't load items for " + labelOf(li));
          return;
        }
        var tpl = kids(li, 'template')[0];
        if (tpl) g.appendChild(tpl.content.cloneNode(true));
        li.__dsLoaded = true;
        Array.prototype.forEach.call(g.querySelectorAll('li'), initNode);
        focusNode(li);
        say(kids(g, 'li').length + ' items loaded in ' + labelOf(li));
      }, 700);
    }
    function decorate(statusLi, parent) {
      statusLi.setAttribute('role', 'treeitem');
      statusLi.setAttribute('aria-level', String(levelOf(parent) + 1));
      statusLi.setAttribute('aria-setsize', '1'); statusLi.setAttribute('aria-posinset', '1');
      if (!statusLi.hasAttribute('data-error')) statusLi.setAttribute('aria-disabled', 'true');
      statusLi.tabIndex = -1;
    }
    function reasonOf(li) { var id = (li.getAttribute('aria-describedby') || '').split(' ')[0]; var r = id && document.getElementById(id); return r ? r.textContent.trim() : ''; }
    function select(li, how) {
      if (li.hasAttribute('data-status-row')) {
        if (li.hasAttribute('data-error')) { var p = parentLi(li); if (p) { p.__dsLoaded = false; loadChildren(p); } }
        return;
      }
      if (li.getAttribute('aria-disabled') === 'true') { var r = reasonOf(li); if (r) say(r); return; }
      if (multi) {
        var on = li.getAttribute('aria-checked') !== 'true';
        li.setAttribute('aria-checked', String(on));
        Array.prototype.forEach.call(li.querySelectorAll('li[role="treeitem"]:not([data-status-row]):not([aria-disabled="true"])'), function (c) { c.setAttribute('aria-checked', String(on)); });
        var p2 = parentLi(li);
        while (p2) {
          var cs = kids(groupOf(p2), 'li').filter(function (c) { return !c.hasAttribute('data-status-row'); });
          var n = cs.filter(function (c) { return c.getAttribute('aria-checked') === 'true'; }).length;
          var mixed = cs.some(function (c) { return c.getAttribute('aria-checked') === 'mixed'; });
          p2.setAttribute('aria-checked', n === cs.length ? 'true' : (n || mixed) ? 'mixed' : 'false');
          p2 = parentLi(p2);
        }
        say(labelOf(li) + (on ? ' checked' : ' not checked') + ', ' + root.querySelectorAll('[aria-checked="true"]').length + ' selected');
      } else {
        nodes().forEach(function (n) { if (n.getAttribute('aria-selected') === 'true' && n.getAttribute('aria-disabled') !== 'true') { n.setAttribute('aria-selected', 'false'); n.removeAttribute('data-selected'); } });
        li.setAttribute('data-selected', '');
        li.setAttribute('aria-selected', 'true');
        say(labelOf(li) + ' selected');
      }
      root.dispatchEvent(new CustomEvent(how === 'activate' ? 'ds:press' : 'ds:selectedchange', { bubbles: true, detail: { nodeId: li.getAttribute('data-node-id'), href: (rowOf(li) || {}).getAttribute ? rowOf(li).getAttribute('data-href') : null } }));
    }
    function onKey(e) {
      if (mode !== 'tree') return;
      var li = e.target.closest('li[role="treeitem"]');
      if (!li || !root.contains(li)) return;
      var vis = visibleNodes(), i = vis.indexOf(li), t = null;
      var rtl = getComputedStyle(root).direction === 'rtl';
      var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft';
      var expanded = li.getAttribute('aria-expanded');
      if (e.key === 'ArrowDown') t = vis[Math.min(i + 1, vis.length - 1)];
      else if (e.key === 'ArrowUp') t = vis[Math.max(i - 1, 0)];
      else if (e.key === 'Home') t = vis[0];
      else if (e.key === 'End') t = vis[vis.length - 1];
      else if (e.key === fwd) {
        e.preventDefault();
        if (expanded === 'false') setOpen(li, true);
        else if (expanded === 'true') { var g = groupOf(li); var c = g && kids(g, 'li')[0]; if (c) focusNode(c); }
        return;
      } else if (e.key === back) {
        e.preventDefault();
        if (expanded === 'true') setOpen(li, false); else focusNode(parentLi(li));
        return;
      } else if (e.key === 'Enter') { e.preventDefault(); select(li, 'activate'); return; }
      else if (e.key === ' ') { e.preventDefault(); select(li, 'select'); return; }
      else if (e.key === '*') { e.preventDefault(); kids(li.parentElement, 'li').forEach(function (s) { if (s.getAttribute('aria-expanded') === 'false') setOpen(s, true); }); return; }
      else if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        var now = Date.now();
        typed = (now - typedAt > tokenMs('--timing-typeahead', 500) ? '' : typed) + e.key.toLowerCase();
        typedAt = now;
        var order = vis.slice(i + 1).concat(vis.slice(0, i + 1));
        t = order.filter(function (n) { return labelOf(n).toLowerCase().indexOf(typed) === 0; })[0];
        if (!t && typed.length > 1) t = order.filter(function (n) { return labelOf(n).toLowerCase().indexOf(e.key.toLowerCase()) === 0; })[0];
      } else return;
      if (t) { e.preventDefault(); focusNode(t); }
    }
    function onClick(e) {
      if (mode === 'tree') {
        var li = e.target.closest('li[role="treeitem"]');
        if (!li || !root.contains(li)) return;
        e.preventDefault();
        focusNode(li);
        if (e.target.closest('.ds-tree__toggle')) { setOpen(li, li.getAttribute('aria-expanded') !== 'true'); return; }
        select(li, variant === 'navigation' ? 'activate' : 'select');
      } else if (mode === 'drill') {
        var row = e.target.closest('.ds-tree__row');
        if (!row || !root.contains(row)) return;
        var node = row.parentElement;
        if (!groupOf(node)) return; // leaves stay links
        e.preventDefault();
        drillTo(node);
      }
    }
    function onDbl(e) {
      if (mode !== 'tree') return;
      var li = e.target.closest('li[role="treeitem"]');
      if (li && !e.target.closest('.ds-tree__toggle')) setOpen(li, li.getAttribute('aria-expanded') !== 'true');
    }

    /* ---------- drill mode ---------- */
    function setupDrill() {
      mode = 'drill';
      root.setAttribute('data-mode', 'drill');
      if (!header) {
        header = document.createElement('div');
        header.className = 'ds-tree__drill-header';
        header.innerHTML = '<button type="button" class="ds-tree__back"><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-arrow-left"/></svg><span></span></button><h3 class="ds-tree__drill-title" tabindex="-1" data-ds-focus-target></h3>';
        header.querySelector('.ds-tree__back').addEventListener('click', function () {
          var cur = root.querySelector('[data-current]');
          if (cur) drillTo(parentLi(cur), cur);
        });
        root.parentNode.insertBefore(header, root);
      }
      allLis().forEach(function (li) {
        var row = rowOf(li);
        if (row && groupOf(li)) row.setAttribute('role', 'button'); // name = visible label + count (SC 2.5.3)
      });
      drillTo(null);
    }
    function drillTo(node, from) {
      var cur = root.querySelector('[data-current]');
      if (cur) cur.removeAttribute('data-current');
      var rootName = root.getAttribute('aria-label') || 'Top level';
      if (!node) { header.hidden = true; if (from) { var r = rowOf(from); if (r) r.focus(); } say(rootName); return; }
      node.setAttribute('data-current', '');
      var p = parentLi(node);
      header.hidden = false;
      header.querySelector('.ds-tree__back span').textContent = 'Back to ' + (p ? labelOf(p) : rootName);
      var title = header.querySelector('.ds-tree__drill-title');
      title.textContent = labelOf(node);
      if (from) { var fr = rowOf(from); if (fr) fr.focus(); } else title.focus();
    }
    function teardownDrill() {
      root.removeAttribute('data-mode');
      var cur = root.querySelector('[data-current]'); if (cur) cur.removeAttribute('data-current');
      if (header) header.hidden = true;
      allLis().forEach(function (li) { var row = rowOf(li); if (row && row.getAttribute('role') === 'button') row.removeAttribute('role'); });
    }
    root.addEventListener('keydown', function (e) {
      if (mode === 'drill' && e.key === ' ' && e.target.matches('[role="button"].ds-tree__row')) { e.preventDefault(); e.target.click(); return; }
      onKey(e);
    });
    root.addEventListener('click', onClick);
    root.addEventListener('dblclick', onDbl);

    var bp = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bp-tablet')) || 600;
    var mq = window.matchMedia('(max-width: ' + (bp - 0.02) + 'px)');
    function apply() {
      var drill = mq.matches && root.getAttribute('data-drill') !== 'never';
      if (drill && mode !== 'drill') { if (mode === 'tree') teardownTree(); setupDrill(); }
      else if (!drill && mode !== 'tree') { if (mode === 'drill') teardownDrill(); setupTree(); }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
  });
})();
