/* TimePicker · progressive enhancement only (§6.4). Without JS the labelled text input submits what was typed and the server
   parses it. Adds:
   - loose parsing on blur/Enter ("9", "930", "1430", "2:30 pm", "2.30PM", "14h30", Arabic-Indic digits, locale day-period
     markers) normalised to the locale clock (Intl, B1; data-hour-cycle="h12|h23" only when the brief demands it); "12" on a
     12-hour clock means 12 PM and is shown explicitly; 24:00 is rejected. Unreadable / out-of-range / off-step / unavailable
     input keeps the typed text and shows icon + error (aria-invalid, aria-describedby). HH:mm travels in a hidden input that
     takes over the field name.
   - data-variant="input-with-list": the input becomes a combobox (aria-expanded, aria-controls, aria-activedescendant) with a
     slot listbox per data-step minutes between data-min and data-max; ↓/↑ open and move, Enter chooses, Esc closes and restores
     the text, typing filters, the clock IconButton opens it for pointer/touch. Phones get a Sheet (modal) with the same slots.
     Unavailable slots: data-unavailable='{"09:00":"Fully booked"}' (aria-disabled + reason in the row). data-loading shows a
     status row (Spinner + text, aria-busy); typing stays possible.
   Strings: data-i18n-* with en-US fallbacks. Static previews: data-default-open, data-force-trigger, data-force-slots="HH:mm:hover". */
DS.register('time-picker', function (el) {
  var input = el.querySelector('.ds-time-picker__input');
  if (!input) return;
  var group = input.parentNode;
  var label = el.querySelector('.ds-time-picker__label');
  var t = function (k, d, vars) { var s = el.getAttribute('data-i18n-' + k) || d; if (vars) for (var x in vars) s = s.split('{' + x + '}').join(vars[x]); return s; };
  var lang = (el.closest('[lang]') && el.closest('[lang]').getAttribute('lang')) || 'en-US';
  try { if (!Intl.DateTimeFormat.supportedLocalesOf([lang]).length) lang = 'en-US'; } catch (e) { lang = 'en-US'; }
  var cycle = el.getAttribute('data-hour-cycle') || new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hourCycle || 'h23';
  var h12 = cycle === 'h12' || cycle === 'h11';
  var fmt = new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit', hourCycle: h12 ? 'h12' : 'h23', timeZone: 'UTC' });
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var hhmm = function (h, m) { return pad(h) + ':' + pad(m); };
  var mins = function (v) { return +v.slice(0, 2) * 60 + +v.slice(3, 5); };
  var show = function (v) { return fmt.format(new Date(Date.UTC(2026, 0, 1, +v.slice(0, 2), +v.slice(3, 5)))); };
  var digits = function (s) {
    return String(s || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); }).replace(/[‎‏؜  ]/g, ' ');
  };
  // locale day-period markers (AM/PM, a.m./p.m., ص/م …) for parsing
  var periods = { am: ['am', 'a'], pm: ['pm', 'p'] };
  [[9, 'am'], [21, 'pm']].forEach(function (x) {
    new Intl.DateTimeFormat(lang, { hour: 'numeric', hourCycle: 'h12', timeZone: 'UTC' }).formatToParts(new Date(Date.UTC(2026, 0, 1, x[0]))).forEach(function (p) {
      if (p.type === 'dayPeriod') periods[x[1]].unshift(digits(p.value).toLowerCase().replace(/[.\s]/g, ''));
    });
  });
  function parse(text) {
    var s = digits(text).toLowerCase().replace(/\(.*?\)/g, '').trim();
    if (!s) return null;
    var mark = null, flat = s.replace(/[.\s]/g, '');
    ['pm', 'am'].forEach(function (k) {
      if (mark) return;
      periods[k].forEach(function (p) {
        if (mark || !p) return;
        if (flat.slice(-p.length) === p && /\d/.test(flat.slice(0, -p.length))) { mark = k; s = flat.slice(0, -p.length); }
        else if (flat.slice(0, p.length) === p && /^\D*\d/.test(flat.slice(p.length)) && p.length > 1) { mark = k; s = flat.slice(p.length); }
      });
    });
    s = s.replace(/h/g, ':').trim();
    var h, m, mm = /^(\d{1,2})\s*[:.]\s*(\d{2})$/.exec(s);
    if (mm) { h = +mm[1]; m = +mm[2]; }
    else if (/^\d{1,4}$/.test(s)) {
      if (s.length <= 2) { h = +s; m = 0; } else if (s.length === 3) { h = +s[0]; m = +s.slice(1); } else { h = +s.slice(0, 2); m = +s.slice(2); }
    } else return undefined;
    if (m > 59) return undefined;
    if (mark) {
      if (h < 1 || h > 12) return undefined;
      if (mark === 'pm' && h < 12) h += 12;
      if (mark === 'am' && h === 12) h = 0;
    } else if (h12 && h === 12 && !mm) { h = 12; }
    if (h > 23) return undefined;
    return hhmm(h, m);
  }

  var min = el.getAttribute('data-min'), max = el.getAttribute('data-max');
  var stepMin = parseInt(el.getAttribute('data-step'), 10) || 15;
  var enforce = el.hasAttribute('data-enforce-step');
  var rules = {};
  try { rules = JSON.parse(el.getAttribute('data-unavailable') || '{}'); } catch (e) { rules = {}; }
  var reasonFor = function (v) { return rules[v] || (typeof el.dsIsTimeUnavailable === 'function' && el.dsIsTimeUnavailable(v)) || null; };
  var blocked = input.getAttribute('aria-disabled') === 'true';
  var readOnly = input.readOnly && !blocked;
  var list = el.getAttribute('data-variant') === 'input-with-list';
  var id = input.id || ('ds-tp-' + Math.random().toString(36).slice(2, 8));
  input.id = id;
  input.setAttribute('autocomplete', 'off');
  if (readOnly) { input.setAttribute('aria-readonly', 'true'); return; }

  var hidden = null;
  if (input.name) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = input.name;
    input.removeAttribute('name');
    group.appendChild(hidden);
  }
  var value = parse(input.value) || null;
  if (value) input.value = show(value);
  if (hidden) hidden.value = value || '';

  var errEl = el.querySelector('.ds-time-picker__error');
  var describe = function (on, eid) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== eid; });
    if (on) ids.unshift(eid);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  };
  var setError = function (msg) {
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'ds-time-picker__error';
      errEl.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span></span>';
      group.insertAdjacentElement('afterend', errEl);
    }
    errEl.id = errEl.id || id + '-error';
    errEl.querySelector('span').textContent = msg;
    errEl.hidden = false;
    describe(true, errEl.id);
    input.setAttribute('aria-invalid', 'true');
  };
  var clearError = function () { if (errEl) { errEl.hidden = true; describe(false, errEl.id); } input.removeAttribute('aria-invalid'); };
  var reasonText = function () {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var r = ids[i] && document.getElementById(ids[i]); if (r && /__reason/.test(r.className)) return r.textContent.trim(); }
    return '';
  };
  function validate(v) {
    if ((min && mins(v) < mins(min)) || (max && mins(v) > mins(max))) {
      return min && max ? t('error-range', 'Choose a time between {min} and {max}', { min: show(min), max: show(max) }) : min ? t('error-min', 'Choose a time at or after {min}', { min: show(min) }) : t('error-max', 'Choose a time at or before {max}', { max: show(max) });
    }
    if (enforce && mins(v) % stepMin) return t('error-step', 'Choose a time in {step}-minute steps', { step: stepMin });
    var why = reasonFor(v);
    if (why) return t('error-unavailable', '{reason}. Choose another time.', { reason: String(why).replace(/\.$/, '') });
    return '';
  }
  function commit(v) {
    value = v;
    input.value = v ? show(v) : '';
    if (hidden) hidden.value = v || '';
    clearError();
    el.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { value: v } }));
  }
  function commitTyped() {
    if (blocked) return;
    var r = parse(input.value);
    if (r === null) { commit(null); return; }
    if (r === undefined) { setError(t('error-format', 'Enter a time like {example}', { example: show('14:30') })); return; }
    var msg = validate(r);
    if (msg) { input.value = show(r); setError(msg); return; }
    commit(r);
  }
  input.addEventListener('change', commitTyped);

  if (!list) {
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') commitTyped(); });
    return;
  }

  // ---- input-with-list: combobox + listbox (popover) / Sheet -------------------------------------------------------------
  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ds-time-picker__trigger';
  trigger.tabIndex = -1;
  trigger.setAttribute('aria-label', t('choose', 'Choose time'));
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', id + '-listbox');
  trigger.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-time"/></svg>';
  if (el.getAttribute('data-force-trigger')) trigger.setAttribute('data-force', el.getAttribute('data-force-trigger'));
  group.appendChild(trigger);
  if (blocked) {
    trigger.setAttribute('aria-disabled', 'true');
    trigger.addEventListener('click', function () { DS.announce(reasonText(), 'polite'); });
    input.addEventListener('keydown', function (e) { if (/^Arrow(Down|Up)$/.test(e.key)) DS.announce(reasonText(), 'polite'); });
    return;
  }
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', id + '-listbox');

  var pop = document.createElement('dialog');
  pop.className = 'ds-time-picker__popover';
  pop.setAttribute('aria-label', (label ? label.textContent.replace(/\s+/g, ' ').trim() : t('choose', 'Choose time')));
  var head = document.createElement('div');
  head.className = 'ds-time-picker__sheet-header';
  head.innerHTML = '<h2 class="ds-time-picker__sheet-title"></h2><button type="button" class="ds-time-picker__close"><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-close"/></svg></button>';
  head.querySelector('h2').textContent = pop.getAttribute('aria-label');
  var closeBtn = head.querySelector('button');
  closeBtn.setAttribute('aria-label', t('close', 'Close'));
  var lb = document.createElement('ul');
  lb.className = 'ds-time-picker__listbox';
  lb.id = id + '-listbox';
  lb.setAttribute('role', 'listbox');
  if (label) { label.id = label.id || id + '-label'; lb.setAttribute('aria-labelledby', label.id); }
  pop.appendChild(head);
  pop.appendChild(lb);
  group.appendChild(pop);

  var slots = [];
  for (var m = min ? mins(min) : 0; m <= (max ? mins(max) : 23 * 60 + 59); m += stepMin) slots.push(hhmm(Math.floor(m / 60), m % 60));
  var force = {};
  (el.getAttribute('data-force-slots') || '').split(',').forEach(function (p) { var i = p.lastIndexOf(':'); if (i > 0) force[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  var loading = el.hasAttribute('data-loading');
  var rows = [], active = -1, sheet = false, isStatic = false, before = '';
  function optionLabel(v) {
    var s = show(v);
    if (h12 && v === '00:00') s += ' (' + t('midnight', 'midnight') + ')';
    if (h12 && v === '12:00') s += ' (' + t('noon', 'noon') + ')';
    return s;
  }
  function render(filter) {
    lb.innerHTML = '';
    rows = [];
    active = -1;
    if (loading) {
      lb.setAttribute('aria-busy', 'true');
      var st = document.createElement('li');
      st.className = 'ds-time-picker__status';
      st.setAttribute('role', 'option');
      st.setAttribute('aria-disabled', 'true');
      st.setAttribute('aria-selected', 'false');
      st.innerHTML = '<span class="ds-time-picker__spinner" aria-hidden="true"></span><span></span>';
      st.lastChild.textContent = t('loading', 'Loading available times…');
      lb.appendChild(st);
      return;
    }
    lb.removeAttribute('aria-busy');
    var f = (filter || '').toLowerCase().replace(/\s/g, '');
    var shown = slots.filter(function (v) { return !f || optionLabel(v).toLowerCase().replace(/\s/g, '').indexOf(f) === 0 || v.replace(':', '').indexOf(f.replace(/[:.]/g, '')) === 0; });
    if (!shown.length) shown = slots;
    shown.forEach(function (v, i) {
      var li = document.createElement('li');
      li.className = 'ds-time-picker__option';
      li.id = id + '-opt-' + v.replace(':', '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(v === value));
      var why = reasonFor(v);
      li.innerHTML = '<svg class="ds-icon ds-time-picker__option-check" aria-hidden="true"><use href="#ds-i-check"/></svg><span class="ds-time-picker__option-text"><span></span>' + (why ? '<span class="ds-time-picker__option-reason"></span>' : '') + '</span>';
      li.querySelector('.ds-time-picker__option-text > span').textContent = optionLabel(v);
      if (why) { li.setAttribute('aria-disabled', 'true'); li.querySelector('.ds-time-picker__option-reason').textContent = why; }
      if (force[v]) li.setAttribute('data-force', force[v]);
      li.__v = v;
      lb.appendChild(li);
      rows.push(li);
    });
  }
  function nearest() {
    var target = value || parse(input.value) || null;
    if (!target) return 0;
    var best = 0, d = Infinity;
    rows.forEach(function (r, i) { var x = Math.abs(mins(r.__v) - mins(target)); if (x < d) { d = x; best = i; } });
    return best;
  }
  function setActive(i) {
    if (rows[active]) rows[active].removeAttribute('data-active');
    active = i;
    var owner = sheet ? lb : input;
    if (!rows[i]) { owner.removeAttribute('aria-activedescendant'); return; }
    rows[i].setAttribute('data-active', '');
    owner.setAttribute('aria-activedescendant', rows[i].id);
    var r = rows[i];
    if (r.offsetTop < lb.scrollTop) lb.scrollTop = r.offsetTop;
    else if (r.offsetTop + r.offsetHeight > lb.scrollTop + lb.clientHeight) lb.scrollTop = r.offsetTop + r.offsetHeight - lb.clientHeight;
  }
  function isOpen() { return pop.open; }
  function open(asStatic) {
    if (isOpen()) return;
    before = input.value;
    var pres = el.getAttribute('data-presentation') || (getComputedStyle(el).getPropertyValue('--_sheet').trim() === '1' ? 'sheet' : 'popover');
    isStatic = !!asStatic;
    sheet = pres === 'sheet' && !isStatic;
    pop.setAttribute('data-presentation', pres);
    render();
    input.setAttribute('aria-expanded', 'true');
    trigger.setAttribute('aria-expanded', 'true');
    if (isStatic) { pop.setAttribute('data-static', ''); pop.setAttribute('open', ''); }
    else if (sheet) { lb.tabIndex = 0; input.removeAttribute('aria-activedescendant'); pop.showModal(); lb.focus(); }
    else {
      pop.setAttribute('open', ''); // non-modal, DOM focus stays in the input (aria-activedescendant)
      pop.removeAttribute('data-side');
      var r = pop.getBoundingClientRect();
      if (r.bottom > window.innerHeight && group.getBoundingClientRect().top - r.height > 0) pop.setAttribute('data-side', 'top');
    }
    setActive(rows.length && !isStatic ? nearest() : -1); // static previews show selection only; data-force-slots shows focus
    el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true } }));
  }
  function close(restore, focusInput) {
    if (!isOpen() || isStatic) return;
    if (sheet) pop.close(); else pop.removeAttribute('open');
    lb.removeAttribute('tabindex');
    setActive(-1);
    input.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-expanded', 'false');
    if (restore) input.value = before;
    if (focusInput) input.focus();
    el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false } }));
  }
  function choose(i) {
    var r = rows[i];
    if (!r) return false;
    if (r.getAttribute('aria-disabled') === 'true') { DS.announce(r.textContent.trim(), 'polite'); return false; }
    commit(r.__v);
    rows.forEach(function (x) { x.setAttribute('aria-selected', String(x === r)); });
    return true;
  }
  function keys(e) {
    var k = e.key, n = rows.length;
    if (!isOpen()) {
      if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); open(); }
      else if (k === 'Enter') commitTyped();
      return;
    }
    if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true, true); return; }
    if (k === 'Enter' || (k === ' ' && sheet)) { e.preventDefault(); if (active >= 0 ? choose(active) : (commitTyped(), true)) close(false, true); return; }
    if (k === 'Tab') { close(false, false); return; }
    var next = { ArrowDown: Math.min(active + 1, n - 1), ArrowUp: Math.max(active - 1, 0), PageDown: Math.min(active + 8, n - 1), PageUp: Math.max(active - 8, 0) }[k];
    if (sheet && (k === 'Home' || k === 'End')) next = k === 'Home' ? 0 : n - 1;
    if (next !== undefined && n) { e.preventDefault(); setActive(next); }
  }
  input.addEventListener('keydown', keys);
  lb.addEventListener('keydown', keys);
  input.addEventListener('input', function () {
    if (!isOpen()) open();
    if (isStatic) return;
    render(input.value.trim());
    setActive(rows.length ? nearest() : -1);
  });
  trigger.addEventListener('click', function () { if (isOpen() && !isStatic) close(false, true); else { open(); if (!sheet) input.focus(); } });
  closeBtn.addEventListener('click', function () { close(true, true); });
  pop.addEventListener('cancel', function (e) { e.preventDefault(); close(true, true); });
  lb.addEventListener('mousedown', function (e) { if (!sheet) e.preventDefault(); });
  lb.addEventListener('click', function (e) {
    var r = e.target.closest('.ds-time-picker__option');
    if (r && choose(rows.indexOf(r))) close(false, true);
  });
  document.addEventListener('pointerdown', function (e) { if (isOpen() && !sheet && !isStatic && !el.contains(e.target)) close(false, false); });
  if (el.hasAttribute('data-default-open')) open(true);
});
