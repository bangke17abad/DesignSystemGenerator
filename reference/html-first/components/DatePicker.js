/* DatePicker · progressive enhancement only (§6.4). Without JS the labelled text input submits what was typed (format in the
   helper) and the server parses it. Adds:
   - locale parsing on blur/Enter (locale order, ISO YYYY-MM-DD, month names, Arabic-Indic digits) and normalisation to the
     locale format (Intl, B1); unreadable / out-of-range / unavailable text keeps the typed value and shows icon + error;
     ambiguous numeric dates (03/04) are echoed with the month name in the helper; the ISO value is submitted through a hidden
     input that takes over the field name (the visible text is the display only).
   - the labelled calendar button ("Choose date, selected …", aria-haspopup="dialog", aria-expanded, aria-controls) and the APG
     date-picker dialog: non-modal popover from tablet width up, modal Sheet (showModal) below it with title, Close and Done.
     Grid keys: arrows (visual order, RTL aware), Home/End (week), PageUp/PageDown (month), Shift+PageUp/PageDown (year),
     Enter/Space selects (unavailable: reason announced), Esc closes without change and returns focus to the button,
     Tab out / click outside closes. Today = underline + aria-current="date" + "today" in the name; unavailable = strike +
     aria-disabled + aria-describedby reason (still focusable) + legend. Month/year selects for far jumps.
   - data-variant="calendar-inline": the calendar is always on the page above the typed input.
   Attributes: data-min / data-max (ISO), data-unavailable='{"weekdays":[0,6],"weekdaysReason":"…","dates":{"2026-10-20":"…"}}',
   data-legend, data-first-day (0–6), data-today (ISO; pins "today" for previews/tests), data-loading, data-i18n-* strings
   (en-US fallbacks). el.dsIsDateUnavailable = function (iso) { return reason | null } adds product rules.
   Static previews: data-default-open, data-presentation="sheet", data-force-trigger, data-force-days="ISO:hover,ISO:focus".
   DS.dates and DS.dateCalendar are shared with DateRangePicker (depends_on DatePicker). */
(function () {
  var DS = (window.DS = window.DS || {});

  // ---- calendar dates as ISO strings; arithmetic in UTC so DST and time zones never shift a day -------------------------
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }
  function iso(y, m, d) { var t = new Date(Date.UTC(y, m, d)); return pad(t.getUTCFullYear(), 4) + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate()); }
  function parts(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function toDate(s) { var p = parts(s); return new Date(Date.UTC(p.y, p.m, p.d)); }
  function addDays(s, n) { var p = parts(s); return iso(p.y, p.m, p.d + n); }
  function addMonths(s, n) { var p = parts(s); var last = new Date(Date.UTC(p.y, p.m + n + 1, 0)).getUTCDate(); return iso(p.y, p.m + n, Math.min(p.d, last)); }
  function monthStart(s) { var p = parts(s); return iso(p.y, p.m, 1); }
  function weekday(s) { return toDate(s).getUTCDay(); }
  function daysBetween(a, b) { return Math.round((toDate(b) - toDate(a)) / 864e5); }
  function clamp(s, min, max) { return min && s < min ? min : max && s > max ? max : s; }
  function todayOf(el) { var f = el.closest('[data-today]'); if (f) return f.getAttribute('data-today'); var n = new Date(); return iso(n.getFullYear(), n.getMonth(), n.getDate()); }
  function localeOf(el) {
    var l = el.closest('[lang]'), v = (l && l.getAttribute('lang')) || 'en-US';
    try { return Intl.DateTimeFormat.supportedLocalesOf([v]).length ? v : 'en-US'; } catch (e) { return 'en-US'; }
  }
  function firstDayOf(el, locale) {
    var a = el.getAttribute('data-first-day');
    if (a !== null && a !== '') return (+a) % 7;
    try { var L = new Intl.Locale(locale); var w = (L.getWeekInfo && L.getWeekInfo()) || L.weekInfo; if (w && w.firstDay) return w.firstDay % 7; } catch (e) { /* older engines */ }
    return 0;
  }
  function digits(s) { // Arabic-Indic / Persian digits → ASCII; strip bidi marks
    return String(s || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); }).replace(/[‎‏؜]/g, '');
  }
  function formatter(locale) {
    var o = function (x) { x.timeZone = 'UTC'; return new Intl.DateTimeFormat(locale, x); };
    var num = o({ year: 'numeric', month: '2-digit', day: '2-digit' });
    var long = o({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    var medium = o({ year: 'numeric', month: 'long', day: 'numeric' });
    var short = o({ year: 'numeric', month: 'short', day: 'numeric' });
    var monthYear = o({ month: 'long', year: 'numeric' });
    var dayNum = o({ day: 'numeric' });
    var sample = num.formatToParts(new Date(Date.UTC(2026, 9, 8)));
    var order = [], pattern = '';
    sample.forEach(function (p) {
      if (p.type === 'day' || p.type === 'month' || p.type === 'year') { order.push(p.type); pattern += { day: 'DD', month: 'MM', year: 'YYYY' }[p.type]; }
      else if (p.type === 'literal') pattern += digits(p.value);
    });
    var names = [], mLong = o({ month: 'long' }), mShort = o({ month: 'short' });
    for (var i = 0; i < 12; i++) {
      var d = new Date(Date.UTC(2026, i, 15));
      names.push([mLong.format(d).toLowerCase(), mShort.format(d).toLowerCase().replace(/\.$/, '')]);
    }
    var valid = function (y, m, d) {
      if (!(y > 0) || !(m >= 0 && m < 12) || !(d >= 1 && d <= 31)) return undefined;
      if (y < 100) y += 2000;
      var s = iso(y, m, d), p = parts(s);
      return p.m === m && p.d === d ? s : undefined;
    };
    // returns null (empty), undefined (unreadable) or an ISO date; .ambiguous is set for numeric day/month that both fit
    var parse = function (text) {
      parse.ambiguous = false;
      var s = digits(text).trim();
      if (!s) return null;
      var m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
      if (m) return valid(+m[1], +m[2] - 1, +m[3]);
      var lower = s.toLowerCase();
      if (/[^\d\s/.,\-]/.test(lower)) {
        var best = '', month = -1;
        names.forEach(function (n, i) { n.forEach(function (x) { if (x && lower.indexOf(x) >= 0 && x.length > best.length) { best = x; month = i; } }); });
        if (month < 0) return undefined;
        var nums = lower.replace(best, ' ').match(/\d+/g) || [];
        if (nums.length !== 2) return undefined;
        var yi = nums[0].length > 2 ? 0 : 1;
        return valid(+nums[yi], month, +nums[1 - yi]);
      }
      var g = s.match(/\d+/g) || [];
      if (g.length === 1 && g[0].length === 8) { var c = g[0], at = 0; g = order.map(function (k) { var n = k === 'year' ? 4 : 2; var v = c.substr(at, n); at += n; return v; }); }
      if (g.length !== 3) return undefined;
      var v = {};
      order.forEach(function (k, i) { v[k] = +g[i]; });
      parse.ambiguous = v.day <= 12 && v.month <= 12 && v.day !== v.month;
      return valid(v.year, v.month - 1, v.day);
    };
    return {
      locale: locale, pattern: pattern, parse: parse,
      num: function (s) { return num.format(toDate(s)); },
      long: function (s) { return long.format(toDate(s)); },
      medium: function (s) { return medium.format(toDate(s)); },
      monthYear: function (s) { return monthYear.format(toDate(s)); },
      monthName: function (m) { return names[m][0].charAt(0).toUpperCase() + names[m][0].slice(1); },
      day: function (s) { return dayNum.format(toDate(s)); },
      range: function (a, b) { return short.formatRange ? short.formatRange(toDate(a), toDate(b)) : short.format(toDate(a)) + ' – ' + short.format(toDate(b)); }
    };
  }
  function strings(el) {
    return function (k, d, vars) {
      var s = el.getAttribute('data-i18n-' + k) || d;
      if (vars) for (var key in vars) s = s.split('{' + key + '}').join(vars[key]);
      return s;
    };
  }
  function labelText(label) {
    if (!label) return '';
    var c = label.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[class$="__optional"]'), function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function reasonOf(control) {
    var ids = (control.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var r = ids[i] && document.getElementById(ids[i]); if (r && /__reason/.test(r.className)) return r.textContent.trim(); }
    return '';
  }
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }
  function node(tag, cls, attrs) { var n = document.createElement(tag); if (cls) n.className = cls; for (var k in attrs || {}) n.setAttribute(k, attrs[k]); return n; }
  function icon(name, mirror) { return '<svg class="ds-icon" aria-hidden="true"' + (mirror ? ' data-mirror' : '') + '><use href="#ds-i-' + name + '"/></svg>'; }
  function parseForce(s) { var out = {}; (s || '').split(',').forEach(function (p) { var kv = p.split(':'); if (kv[0]) out[kv[0].trim()] = (kv[1] || '').trim(); }); return out; }
  function presentationOf(el) { return el.getAttribute('data-presentation') || (getComputedStyle(el).getPropertyValue('--_sheet').trim() === '1' ? 'sheet' : 'popover'); }

  DS.dates = { iso: iso, parts: parts, addDays: addDays, addMonths: addMonths, monthStart: monthStart, weekday: weekday, daysBetween: daysBetween, clamp: clamp,
    todayOf: todayOf, localeOf: localeOf, firstDayOf: firstDayOf, formatter: formatter, strings: strings, labelText: labelText, reasonOf: reasonOf,
    focusVisible: focusVisible, node: node, icon: icon, parseForce: parseForce, presentationOf: presentationOf };

  /* ---- shared calendar: nav (prev / month-year / next) + 1–2 month grids + status + legend --------------------------------
     o: { id, fmt, t, firstDay, today, min, max, months, jump, heading, reasonFor(iso)->string|null, stateFor(iso)->{selected,range,extra},
          onSelect(iso, via), onFocusDay(iso), onHover(iso), legend:[{kind,text}], forceDays:{iso:'hover'}, loading } */
  DS.dateCalendar = function (o) {
    var F = o.fmt, t = o.t, months = o.months || 1, uid = o.id;
    var root = node('div', 'ds-date-picker__calendar');
    if (!o.jump) root.setAttribute('data-titles', '');
    var nav = node('div', 'ds-date-picker__nav');
    var live = node('span', 'ds-vh', { 'aria-live': 'polite' });
    var prev = node('button', 'ds-date-picker__nav-btn', { type: 'button', 'aria-label': t('prev', 'Previous month') });
    var next = node('button', 'ds-date-picker__nav-btn', { type: 'button', 'aria-label': t('next', 'Next month') });
    prev.innerHTML = icon('chevron-left', true);
    next.innerHTML = icon('chevron-right', true);
    var middle = node('div', 'ds-date-picker__jump');
    nav.appendChild(prev); nav.appendChild(middle); nav.appendChild(next); nav.appendChild(live);
    var wrap = node('div', 'ds-date-picker__months');
    var status = node('p', 'ds-date-picker__status', { id: uid + '-status' });
    status.hidden = true;
    var reasons = node('div', null, { hidden: '' });
    root.appendChild(nav); root.appendChild(wrap); root.appendChild(status); root.appendChild(reasons);
    if (o.legend && o.legend.length) {
      var lg = node('ul', 'ds-date-picker__legend', { id: uid + '-legend' });
      o.legend.forEach(function (x) {
        var li = node('li');
        li.innerHTML = '<span class="ds-date-picker__swatch" data-kind="' + x.kind + '" aria-hidden="true"></span><span></span>';
        li.lastChild.textContent = x.text;
        lg.appendChild(li);
      });
      root.appendChild(lg);
    }
    var reasonIds = {}, rc = 0;
    var reasonId = function (text) {
      if (!reasonIds[text]) { var s = node('span', null, { id: uid + '-why-' + (++rc) }); s.textContent = text; reasons.appendChild(s); reasonIds[text] = s.id; }
      return reasonIds[text];
    };
    var navWhy = { prev: reasonId(t('no-earlier', 'No earlier dates can be chosen.')), next: reasonId(t('no-later', 'No later dates can be chosen.')) };

    var first = monthStart(o.initial || o.today), focused = o.initial || o.today, buttons = {}, loading = !!o.loading;
    var minM = o.min && monthStart(o.min), maxM = o.max && monthStart(o.max);
    var lastVisible = function () { return addMonths(first, months - 1); };
    var monthSel, yearSel;
    if (o.jump) {
      var mk = function (cls, label) {
        var f = node('span', 'ds-date-picker__jump-field');
        var s = node('select', 'ds-date-picker__jump-select ' + cls, { 'aria-label': label });
        f.appendChild(s);
        f.insertAdjacentHTML('beforeend', icon('chevron-down'));
        middle.appendChild(f);
        return s;
      };
      monthSel = mk('ds-date-picker__jump-month', t('month', 'Month'));
      yearSel = mk('ds-date-picker__jump-year', t('year', 'Year'));
      var ty = parts(o.today).y;
      var y0 = o.min ? parts(o.min).y : ty - 100, y1 = o.max ? parts(o.max).y : ty + 10;
      for (var y = y1; y >= y0; y--) { var op = node('option', null, { value: y }); op.textContent = new Intl.NumberFormat(F.locale, { useGrouping: false }).format(y); yearSel.appendChild(op); }
      for (var m = 0; m < 12; m++) { var om = node('option', null, { value: m }); om.textContent = F.monthName(m); monthSel.appendChild(om); }
      var jump = function () { show(iso(+yearSel.value, +monthSel.value, 1), true); };
      monthSel.addEventListener('change', jump);
      yearSel.addEventListener('change', jump);
    }

    function inView(s) { return s >= first && s < addMonths(lastVisible(), 1); }
    function reason(s) {
      if (loading) return t('loading', 'Loading available dates…');
      return o.reasonFor(s);
    }
    function build() {
      if (minM && first < minM) first = minM;
      if (maxM && lastVisible() > maxM) first = minM && addMonths(maxM, 1 - months) < minM ? minM : addMonths(maxM, 1 - months);
      wrap.innerHTML = '';
      buttons = {};
      var wdShort = [], wdLong = [], tooLong = false;
      var ws = new Intl.DateTimeFormat(F.locale, { weekday: 'short', timeZone: 'UTC' }), wl = new Intl.DateTimeFormat(F.locale, { weekday: 'long', timeZone: 'UTC' }), wn = new Intl.DateTimeFormat(F.locale, { weekday: 'narrow', timeZone: 'UTC' });
      for (var i = 0; i < 7; i++) {
        var d = new Date(Date.UTC(2026, 9, 4 + ((o.firstDay + i) % 7))); // 2026-10-04 is a Sunday
        wdShort.push(ws.format(d)); wdLong.push(wl.format(d));
        if (ws.format(d).length > 4) tooLong = true;
      }
      if (tooLong) wdShort = wdLong.map(function (x, i) { return wn.format(new Date(Date.UTC(2026, 9, 4 + ((o.firstDay + i) % 7)))); });
      for (var k = 0; k < months; k++) {
        var ms = addMonths(first, k), p = parts(ms);
        var sec = node('div', 'ds-date-picker__month');
        var title = node(o.heading || 'h2', o.jump ? 'ds-vh' : 'ds-date-picker__month-title', { id: uid + '-title-' + k });
        title.textContent = F.monthYear(ms);
        var table = node('table', 'ds-date-picker__grid', { role: 'grid', 'aria-labelledby': title.id });
        if (loading) table.setAttribute('aria-busy', 'true');
        var head = '<thead data-ds-text="supporting"><tr>';
        for (var w = 0; w < 7; w++) head += '<th scope="col" abbr="' + wdLong[w] + '">' + wdShort[w] + '</th>';
        table.innerHTML = head + '</tr></thead>';
        var tb = node('tbody');
        var lead = (weekday(ms) - o.firstDay + 7) % 7;
        var dim = new Date(Date.UTC(p.y, p.m + 1, 0)).getUTCDate();
        var tr = node('tr');
        for (var b = 0; b < lead; b++) tr.appendChild(node('td'));
        for (var day = 1; day <= dim; day++) {
          if (tr.children.length === 7) { tb.appendChild(tr); tr = node('tr'); }
          var s = iso(p.y, p.m, day);
          var td = node('td', null, { role: 'gridcell' });
          var btn = node('button', 'ds-date-picker__day', { type: 'button', tabindex: '-1', 'data-iso': s });
          btn.textContent = F.day(s);
          td.appendChild(btn);
          tr.appendChild(td);
          buttons[s] = btn;
        }
        while (tr.children.length < 7) tr.appendChild(node('td'));
        tb.appendChild(tr);
        table.appendChild(tb);
        sec.appendChild(title);
        sec.appendChild(table);
        wrap.appendChild(sec);
      }
      if (!inView(focused)) focused = clamp(inView(o.today) ? o.today : first, o.min, o.max);
      if (!inView(focused)) focused = first;
      paint();
    }
    function paint() {
      var anyAvailable = false;
      for (var s in buttons) {
        var btn = buttons[s], td = btn.parentNode, why = reason(s), st = o.stateFor(s) || {};
        var name = F.long(s);
        if (s === o.today) { name += ', ' + t('today', 'today'); btn.setAttribute('aria-current', 'date'); btn.setAttribute('data-today', ''); }
        if (st.extra) name += ', ' + st.extra;
        btn.setAttribute('aria-label', name);
        btn.toggleAttribute('data-selected', !!st.selected);
        td.setAttribute('aria-selected', String(!!(st.selected || st.range === 'middle')));
        if (st.range) td.setAttribute('data-range', st.range); else td.removeAttribute('data-range');
        btn.toggleAttribute('data-loading', loading);
        if (why) { btn.setAttribute('aria-disabled', 'true'); btn.setAttribute('aria-describedby', reasonId(why)); }
        else { btn.removeAttribute('aria-disabled'); btn.removeAttribute('aria-describedby'); anyAvailable = true; }
        btn.tabIndex = s === focused ? 0 : -1;
        if (o.forceDays && o.forceDays[s]) btn.setAttribute('data-force', o.forceDays[s]);
      }
      var atMin = minM && first <= minM, atMax = maxM && lastVisible() >= maxM;
      [[prev, atMin, navWhy.prev], [next, atMax, navWhy.next]].forEach(function (x) {
        if (x[1]) { x[0].setAttribute('aria-disabled', 'true'); x[0].setAttribute('aria-describedby', x[2]); }
        else { x[0].removeAttribute('aria-disabled'); x[0].removeAttribute('aria-describedby'); }
      });
      if (monthSel) {
        var fp = parts(first);
        yearSel.value = String(fp.y);
        monthSel.value = String(fp.m);
        Array.prototype.forEach.call(monthSel.options, function (op, m) {
          var a = iso(fp.y, m, 1);
          op.disabled = !!((minM && a < minM) || (maxM && a > maxM));
        });
      }
      status.innerHTML = '';
      if (loading) { status.textContent = t('loading', 'Loading available dates…'); status.hidden = false; }
      else if (!anyAvailable) {
        var msg = node('span');
        msg.textContent = t('none-in-month', 'No dates available in {month}.', { month: F.monthYear(first) });
        status.appendChild(msg);
        var nxt = nextAvailable(addMonths(lastVisible(), 1));
        if (nxt) {
          var go = node('button', 'ds-date-picker__link', { type: 'button' });
          go.textContent = t('next-available', 'Next available date');
          go.addEventListener('click', function () { focused = nxt; show(monthStart(nxt)); focusDay(nxt, true); });
          status.appendChild(go);
        }
        status.hidden = false;
      } else status.hidden = true;
    }
    function nextAvailable(from) {
      for (var i = 0, s = from; i < 760; i++, s = addDays(s, 1)) {
        if (o.max && s > o.max) return null;
        if (!o.reasonFor(s)) return s;
      }
      return null;
    }
    function show(ms, announce) {
      var before = first;
      first = monthStart(ms);
      var bp = parts(before), fp = parts(first), delta = (fp.y - bp.y) * 12 + fp.m - bp.m;
      if (delta && inView(addMonths(focused, delta))) focused = addMonths(focused, delta);
      build();
      if (announce !== false) {
        live.textContent = '';
        var text = months > 1 ? F.monthYear(first) + ' – ' + F.monthYear(lastVisible()) : F.monthYear(first);
        window.setTimeout(function () { live.textContent = text; }, 50);
      }
      if (o.onMonthChange) o.onMonthChange(first);
    }
    function ensure(s) {
      if (inView(s)) return;
      if (s < first) show(monthStart(s)); else show(addMonths(monthStart(s), 1 - months));
    }
    function focusDay(s, visible) {
      s = clamp(s, o.min, o.max);
      focused = s;
      ensure(s);
      paint();
      var b = buttons[s];
      if (b) { if (visible) focusVisible(b); else b.focus(); }
    }
    var step = function (dir) {
      if ((dir < 0 ? prev : next).getAttribute('aria-disabled') === 'true') { DS.announce((dir < 0 ? t('no-earlier', 'No earlier dates can be chosen.') : t('no-later', 'No later dates can be chosen.')), 'polite'); return; }
      show(addMonths(first, dir));
    };
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });
    wrap.addEventListener('keydown', function (e) {
      var b = e.target.closest('.ds-date-picker__day');
      if (!b) return;
      var s = b.getAttribute('data-iso'), rtl = getComputedStyle(root).direction === 'rtl', to = null;
      var col = (weekday(s) - o.firstDay + 7) % 7;
      switch (e.key) {
        case 'ArrowRight': to = addDays(s, rtl ? -1 : 1); break;
        case 'ArrowLeft': to = addDays(s, rtl ? 1 : -1); break;
        case 'ArrowDown': to = addDays(s, 7); break;
        case 'ArrowUp': to = addDays(s, -7); break;
        case 'Home': to = addDays(s, -col); break;
        case 'End': to = addDays(s, 6 - col); break;
        case 'PageUp': to = addMonths(s, e.shiftKey ? -12 : -1); break;
        case 'PageDown': to = addMonths(s, e.shiftKey ? 12 : 1); break;
        case 'Enter': case ' ': e.preventDefault(); select(s, 'keyboard'); return;
        default: return;
      }
      e.preventDefault();
      var monthBefore = first;
      focusDay(to, true);
      if (first !== monthBefore) { live.textContent = ''; var txt = F.monthYear(first); window.setTimeout(function () { live.textContent = txt; }, 50); }
    });
    function select(s, via) {
      var why = reason(s);
      if (why) { DS.announce(why, 'polite'); return; }
      focused = s;
      o.onSelect(s, via);
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.ds-date-picker__day');
      if (b) select(b.getAttribute('data-iso'), e.detail === 0 ? 'keyboard' : 'pointer');
    });
    wrap.addEventListener('focusin', function (e) {
      var b = e.target.closest('.ds-date-picker__day');
      if (!b) return;
      focused = b.getAttribute('data-iso');
      for (var s in buttons) buttons[s].tabIndex = s === focused ? 0 : -1;
      if (o.onFocusDay) o.onFocusDay(focused);
    });
    wrap.addEventListener('mouseover', function (e) { var b = e.target.closest('.ds-date-picker__day'); if (b && o.onHover) o.onHover(b.getAttribute('data-iso')); });

    return {
      el: root,
      build: build, paint: paint, show: show, focusDay: focusDay, nextAvailable: nextAvailable,
      setFocused: function (s) { focused = clamp(s, o.min, o.max); first = monthStart(focused); if (months > 1 && maxM && first > addMonths(maxM, 1 - months)) first = addMonths(maxM, 1 - months); },
      getFocused: function () { return focused; },
      setLoading: function (v) { loading = !!v; paint(); var g = wrap.querySelectorAll('table'); for (var i = 0; i < g.length; i++) { if (loading) g[i].setAttribute('aria-busy', 'true'); else g[i].removeAttribute('aria-busy'); } },
      first: function () { return first; }
    };
  };

  /* ---- DatePicker module ------------------------------------------------------------------------------------------------ */
  DS.register('date-picker', function (el) {
    var input = el.querySelector('.ds-date-picker__input');
    if (!input) return;
    var group = input.parentNode;
    var label = el.querySelector('.ds-date-picker__label');
    var t = strings(el), locale = localeOf(el), F = formatter(locale), today = todayOf(el);
    var min = el.getAttribute('data-min'), max = el.getAttribute('data-max');
    var inline = el.getAttribute('data-variant') === 'calendar-inline';
    var blocked = input.getAttribute('aria-disabled') === 'true';
    var readOnly = input.readOnly && !blocked;
    var id = input.id || ('ds-dp-' + Math.random().toString(36).slice(2, 8));
    input.id = id;
    var rules = {};
    try { rules = JSON.parse(el.getAttribute('data-unavailable') || '{}'); } catch (e) { rules = {}; }
    var reasonFor = function (d) {
      if (min && d < min) return t('before-min', 'Dates before {date} can’t be selected.', { date: F.medium(min) });
      if (max && d > max) return t('after-max', 'Dates after {date} can’t be selected.', { date: F.medium(max) });
      if (rules.dates && rules.dates[d]) return rules.dates[d];
      if (rules.weekdays && rules.weekdays.indexOf(weekday(d)) >= 0) return rules.weekdaysReason || t('unavailable', 'Unavailable');
      if (typeof el.dsIsDateUnavailable === 'function') { var r = el.dsIsDateUnavailable(d); if (r) return String(r); }
      return null;
    };

    // ISO value travels in a hidden input that takes over the field name
    var hidden = null;
    if (input.name) {
      hidden = node('input', null, { type: 'hidden', name: input.name });
      input.removeAttribute('name');
      input.setAttribute('data-name', hidden.name);
      group.appendChild(hidden);
    }
    var value = F.parse(input.value) || null;
    if (value && !F.parse.ambiguous) input.value = F.num(value);
    if (hidden) hidden.value = value || '';

    // error + echo
    var helper = el.querySelector('.ds-date-picker__helper');
    var errEl = el.querySelector('.ds-date-picker__error');
    var describe = function (on, eid) {
      var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== eid; });
      if (on) ids.unshift(eid);
      if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
    };
    var setError = function (msg) {
      if (!errEl) {
        errEl = node('p', 'ds-date-picker__error', { id: id + '-error' });
        errEl.innerHTML = icon('critical') + '<span></span>';
        group.insertAdjacentElement('afterend', errEl);
      }
      errEl.id = errEl.id || id + '-error';
      (errEl.querySelector('span') || errEl).textContent = msg;
      errEl.hidden = false;
      describe(true, errEl.id);
      input.setAttribute('aria-invalid', 'true');
    };
    var clearError = function () {
      if (errEl) { errEl.hidden = true; describe(false, errEl.id); }
      input.removeAttribute('aria-invalid');
    };
    var echo = null;
    var setEcho = function (text) {
      if (!helper) return;
      if (!echo) { echo = node('span', 'ds-date-picker__echo'); helper.appendChild(document.createTextNode(' ')); helper.appendChild(echo); }
      echo.textContent = text;
    };

    // calendar button
    var btn = null;
    var labelBtn = function () {
      if (!btn) return;
      btn.setAttribute('aria-label', value ? t('choose-selected', '{choose}, selected {date}', { choose: t('choose', 'Choose date'), date: F.long(value) }) : t('choose', 'Choose date'));
    };
    if (!readOnly && !inline) {
      btn = node('button', 'ds-date-picker__trigger', { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': id + '-dialog' });
      btn.innerHTML = icon('calendar');
      if (blocked) {
        btn.setAttribute('aria-disabled', 'true');
        if (input.getAttribute('aria-describedby')) btn.setAttribute('aria-describedby', input.getAttribute('aria-describedby'));
      }
      if (el.getAttribute('data-force-trigger')) btn.setAttribute('data-force', el.getAttribute('data-force-trigger'));
      group.appendChild(btn);
      labelBtn();
    }
    if (readOnly) { input.setAttribute('aria-readonly', 'true'); return; }

    var legend = [{ kind: 'today', text: t('legend-today', 'Today (underlined)') }];
    var legendText = el.getAttribute('data-legend');
    if (legendText) legend.push({ kind: 'unavailable', text: legendText });
    else if (min || max || rules.weekdays || rules.dates) legend.push({ kind: 'unavailable', text: t('legend-unavailable', 'Struck-through dates can’t be selected. Focus one to hear why.') });
    if (min || max) legend.push({ kind: 'bounds', text: min && max ? t('legend-bounds', 'Choose a date from {min} to {max}.', { min: F.medium(min), max: F.medium(max) }) : min ? t('legend-min', 'Choose a date on or after {date}.', { date: F.medium(min) }) : t('legend-max', 'Choose a date on or before {date}.', { date: F.medium(max) }) });

    var pop = null, sheetMode = false, staticMode = false;
    var firstAvailable = function () {
      var start = clamp(today, min, max);
      return reasonFor(start) ? (cal.nextAvailable(start) || start) : start;
    };
    var cal = DS.dateCalendar({
      id: id, fmt: F, t: t, firstDay: firstDayOf(el, locale), today: today, min: min, max: max, months: 1, jump: true,
      heading: el.getAttribute('data-heading') || 'h2',
      initial: value || clamp(today, min, max), loading: el.hasAttribute('data-loading'),
      reasonFor: reasonFor, legend: legend, forceDays: parseForce(el.getAttribute('data-force-days')),
      stateFor: function (d) { return { selected: d === value }; },
      onSelect: function (d, via) {
        setValue(d);
        if (inline || staticMode || (sheetMode && via === 'pointer')) { cal.paint(); return; }
        close(input);
      }
    });

    function setValue(d) {
      value = d;
      input.value = d ? F.num(d) : '';
      if (hidden) hidden.value = d || '';
      if (echo) echo.textContent = '';
      clearError();
      labelBtn();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: d } }));
    }
    function commitTyped() {
      if (blocked) return;
      var r = F.parse(input.value);
      if (r === null) { if (value !== null) { value = null; if (hidden) hidden.value = ''; labelBtn(); } clearError(); return; }
      if (r === undefined) { setError(t('error-format', 'Enter a date in the format {pattern}', { pattern: F.pattern })); return; }
      if (min && r < min) { setError(t('error-min', 'Enter a date on or after {date}', { date: F.medium(min) })); return; }
      if (max && r > max) { setError(t('error-max', 'Enter a date on or before {date}', { date: F.medium(max) })); return; }
      var why = reasonFor(r);
      if (why) { setError(t('error-unavailable', '{reason} Choose another date.', { reason: why.replace(/\.?$/, '.') })); return; }
      var amb = F.parse.ambiguous;
      value = r;
      input.value = F.num(r);
      if (hidden) hidden.value = r;
      clearError();
      labelBtn();
      if (amb) setEcho(t('echo', 'Read as {date}.', { date: F.long(r) })); else if (echo) echo.textContent = '';
      if (pop && pop.open) { cal.setFocused(r); cal.build(); }
      el.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: r } }));
    }
    input.addEventListener('change', commitTyped);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { commitTyped(); }
      if (e.key === 'ArrowDown' && e.altKey && btn) { e.preventDefault(); open(); }
    });
    if (blocked) {
      if (btn) btn.addEventListener('click', function () { DS.announce(reasonOf(input), 'polite'); });
      return;
    }

    if (inline) {
      var box = node('div', 'ds-date-picker__inline');
      box.appendChild(cal.el);
      group.insertAdjacentElement('beforebegin', box);
      cal.setFocused(value || firstAvailable());
      cal.build();
      return;
    }

    // popover / Sheet
    pop = node('dialog', 'ds-date-picker__popover', { id: id + '-dialog', 'aria-label': labelText(label) || t('choose', 'Choose date') });
    var head = node('div', 'ds-date-picker__sheet-header');
    var title = node('h2', 'ds-date-picker__sheet-title');
    title.textContent = labelText(label);
    var x = node('button', 'ds-date-picker__nav-btn', { type: 'button', 'aria-label': t('close', 'Close') });
    x.innerHTML = icon('close');
    head.appendChild(title); head.appendChild(x);
    var foot = node('div', 'ds-date-picker__sheet-footer');
    var done = node('button', 'ds-date-picker__done', { type: 'button' });
    done.textContent = t('done', 'Done');
    foot.appendChild(done);
    pop.appendChild(head); pop.appendChild(cal.el); pop.appendChild(foot);
    group.appendChild(pop);

    function place() {
      pop.removeAttribute('data-side'); pop.removeAttribute('data-align');
      var r = pop.getBoundingClientRect(), g = group.getBoundingClientRect();
      if (r.bottom > window.innerHeight && g.top - r.height > 0) pop.setAttribute('data-side', 'top');
      var rtl = getComputedStyle(el).direction === 'rtl';
      if ((!rtl && r.right > document.documentElement.clientWidth) || (rtl && r.left < 0)) pop.setAttribute('data-align', 'end');
    }
    function open(asStatic) {
      if (pop.open) return;
      sheetMode = presentationOf(el) === 'sheet';
      staticMode = !!asStatic;
      pop.setAttribute('data-presentation', sheetMode ? 'sheet' : 'popover');
      var start = value || firstAvailable();
      cal.setFocused(start);
      cal.build();
      btn.setAttribute('aria-expanded', 'true');
      if (staticMode) { pop.setAttribute('data-static', ''); pop.setAttribute('open', ''); return; }
      if (sheetMode) pop.showModal(); else { pop.show(); place(); }
      cal.focusDay(cal.getFocused(), true);
      el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true } }));
    }
    function close(focusTo) {
      if (!pop.open || staticMode) { if (focusTo && staticMode) focusTo.focus(); return; }
      pop.close();
      btn.setAttribute('aria-expanded', 'false');
      if (focusTo) focusVisible(focusTo);
      el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false } }));
    }
    btn.addEventListener('click', function () { if (pop.open && !staticMode) close(btn); else open(); });
    x.addEventListener('click', function () { close(btn); });
    done.addEventListener('click', function () { close(input); });
    pop.addEventListener('cancel', function (e) { e.preventDefault(); close(btn); });
    pop.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !staticMode) { e.preventDefault(); e.stopPropagation(); close(btn); } });
    pop.addEventListener('click', function (e) { // Sheet scrim (::backdrop clicks target the dialog outside its box)
      if (e.target !== pop || !sheetMode) return;
      var r = pop.getBoundingClientRect();
      if (e.clientY < r.top) close(btn);
    });
    pop.addEventListener('focusout', function (e) {
      if (sheetMode || staticMode) return;
      var to = e.relatedTarget;
      if (to && !pop.contains(to) && to !== btn) close(null);
    });
    document.addEventListener('pointerdown', function (e) { if (pop.open && !sheetMode && !staticMode && !el.contains(e.target)) close(null); });
    if (el.hasAttribute('data-default-open')) open(true);
  });
})();
