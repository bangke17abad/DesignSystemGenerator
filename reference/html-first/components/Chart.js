/* Chart · engine 1.8.0 reference module (catalog/components/Chart.json). Progressive enhancement only (§6.4):
   without JS the plot is a static SVG (role="img", named by title + summary) and the data table (details/summary) holds every
   value. This module, on figure.ds-chart[data-ds-module="chart"]:
   - turns the plot into role="group" with one Tab stop: data points (.ds-chart__point, data-series/data-index/data-label/data-cx)
     get role="img" + aria-label and a roving tabindex; ←/→ move along the category axis (visual direction, so swapped in RTL),
     ↑/↓ switch series at the same position, Home/End jump to the first/last point, Esc closes the crosshair tooltip;
   - shows a crosshair + tooltip with every visible series at that position on focus, hover (nearest point) and tap; the value is
     announced politely; the tooltip is hoverable-safe (pointer-events none) and complements, never replaces, the table;
   - makes legend items toggles (button[aria-pressed]); at least one series stays visible; hover/focus emphasises a series. */
(function () {
  var DS = (window.DS = window.DS || {});
  function say(m) { if (DS.announce) DS.announce(m, 'polite'); }

  DS.register('chart', function (fig) {
    var plot = fig.querySelector('.ds-chart__plot');
    var area = fig.querySelector('.ds-chart__area');
    if (!plot || !area) return;
    var points = Array.prototype.slice.call(area.querySelectorAll('.ds-chart__point'));
    if (!points.length) return;
    var names = {};
    Array.prototype.forEach.call(fig.querySelectorAll('.ds-chart__legend-item[data-series]'), function (li) { names[li.getAttribute('data-series')] = li.textContent.replace(/\s+/g, ' ').trim(); });

    plot.setAttribute('role', 'group');
    points.forEach(function (p) {
      p.setAttribute('role', 'img');
      p.setAttribute('aria-label', p.getAttribute('data-label') || '');
      p.tabIndex = -1;
    });
    var hidden = {};
    function visible() { return points.filter(function (p) { return !hidden[p.getAttribute('data-series')]; }); }
    function seriesList() { var s = []; visible().forEach(function (p) { var k = p.getAttribute('data-series'); if (s.indexOf(k) < 0) s.push(k); }); return s; }
    function maxIndex() { return Math.max.apply(null, points.map(function (p) { return +p.getAttribute('data-index'); })); }
    function find(series, index) { return visible().filter(function (p) { return p.getAttribute('data-series') === series && +p.getAttribute('data-index') === index; })[0]; }
    var active = visible()[0];
    active.tabIndex = 0;

    var cross = document.createElement('div');
    cross.className = 'ds-chart__crosshair'; cross.hidden = true; cross.setAttribute('aria-hidden', 'true');
    var tip = document.createElement('div');
    tip.className = 'ds-chart__tooltip'; tip.hidden = true; tip.setAttribute('aria-hidden', 'true'); tip.setAttribute('data-ds-text', 'supporting');
    area.appendChild(cross); area.appendChild(tip);

    function show(index) {
      var at = visible().filter(function (p) { return +p.getAttribute('data-index') === index; });
      if (!at.length) return hide();
      var cx = at[0].getAttribute('data-cx') + '%';
      cross.style.setProperty('--x', cx); tip.style.setProperty('--x', cx);
      tip.setAttribute('data-anchor', parseFloat(cx) > 50 ? 'end' : 'start');
      tip.textContent = '';
      var head = document.createElement('strong');
      head.textContent = at[0].getAttribute('data-category') || '';
      tip.appendChild(head);
      at.forEach(function (p) {
        var row = document.createElement('div');
        row.className = 'ds-chart__tooltip-row';
        row.textContent = (names[p.getAttribute('data-series')] ? names[p.getAttribute('data-series')] + ': ' : '') + (p.getAttribute('data-value') || '');
        tip.appendChild(row);
      });
      cross.hidden = false; tip.hidden = false;
    }
    function hide() { cross.hidden = true; tip.hidden = true; }
    function go(p) {
      if (!p) return;
      points.forEach(function (x) { x.tabIndex = -1; });
      p.tabIndex = 0; active = p; p.focus();
    }

    area.addEventListener('focusin', function (e) {
      var p = e.target.closest('.ds-chart__point');
      if (!p) return;
      show(+p.getAttribute('data-index'));
      say(p.getAttribute('aria-label'));
    });
    plot.addEventListener('focusout', function (e) { if (!plot.contains(e.relatedTarget)) hide(); });
    area.addEventListener('keydown', function (e) {
      var p = e.target.closest('.ds-chart__point');
      if (!p) return;
      var s = p.getAttribute('data-series'), i = +p.getAttribute('data-index'), max = maxIndex();
      var rtl = getComputedStyle(area).direction === 'rtl';
      var list = seriesList(), si = list.indexOf(s), t = null;
      if (e.key === 'ArrowRight') t = find(s, Math.min(max, Math.max(0, i + (rtl ? -1 : 1))));
      else if (e.key === 'ArrowLeft') t = find(s, Math.min(max, Math.max(0, i + (rtl ? 1 : -1))));
      else if (e.key === 'ArrowUp') t = find(list[Math.max(0, si - 1)], i);
      else if (e.key === 'ArrowDown') t = find(list[Math.min(list.length - 1, si + 1)], i);
      else if (e.key === 'Home') t = find(s, 0);
      else if (e.key === 'End') t = find(s, max);
      else if (e.key === 'Escape') { if (!tip.hidden) { e.stopPropagation(); hide(); } return; }
      else return;
      e.preventDefault();
      go(t || p);
    });
    // pointer: nearest position on the category axis (tap keeps the tooltip until a tap outside)
    function nearest(clientX) {
      var r = area.getBoundingClientRect();
      var f = (clientX - r.left) / r.width * 100;
      if (getComputedStyle(area).direction === 'rtl') f = 100 - f;
      var best = null, d = Infinity;
      visible().forEach(function (p) { var dd = Math.abs(+p.getAttribute('data-cx') - f); if (dd < d) { d = dd; best = p; } });
      return best;
    }
    area.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { var p = nearest(e.clientX); if (p) show(+p.getAttribute('data-index')); } });
    area.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !area.contains(document.activeElement)) hide(); });
    area.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { var p = nearest(e.clientX); if (p) { show(+p.getAttribute('data-index')); say(p.getAttribute('aria-label')); } } });
    document.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && !area.contains(e.target)) hide(); });

    // legend toggles
    Array.prototype.forEach.call(fig.querySelectorAll('.ds-chart__legend-item[data-series]'), function (li) {
      var k = li.getAttribute('data-series');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ds-chart__legend-button';
      b.setAttribute('aria-pressed', 'true');
      while (li.firstChild) b.appendChild(li.firstChild);
      var state = document.createElement('span');
      state.className = 'ds-vh';
      b.appendChild(state);
      li.className = '';
      li.appendChild(b);
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') === 'true';
        if (on && seriesList().length <= 1) { say('At least one series stays visible'); return; }
        b.setAttribute('aria-pressed', String(!on));
        state.textContent = on ? ', hidden' : '';
        if (on) hidden[k] = true; else delete hidden[k];
        fig.setAttribute('data-hide', Object.keys(hidden).join(' '));
        if (hidden[active.getAttribute('data-series')]) { points.forEach(function (x) { x.tabIndex = -1; }); active = visible()[0]; active.tabIndex = 0; }
        hide();
        say((names[k] || 'Series') + (on ? ' hidden' : ' shown'));
      });
      var emph = function () { fig.setAttribute('data-emphasis', k); };
      var off = function () { fig.removeAttribute('data-emphasis'); };
      b.addEventListener('mouseenter', emph); b.addEventListener('focus', emph);
      b.addEventListener('mouseleave', off); b.addEventListener('blur', off);
    });
  });
})();
