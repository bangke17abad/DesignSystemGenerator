/* DateRangePicker · progressive enhancement only (§6.4). Without JS: fieldset + legend with two labelled text fields (format in the
   helper) that submit what was typed; the server parses them. Uses DS.dates / DS.dateCalendar from DatePicker.js. Adds:
   - parsing on blur per field (locale order, ISO, month names) normalised to the locale format; ISO values in hidden inputs that
     take over the field names; range-level validation with icon + text (end before start, longer than data-max-days, shorter than
     data-min-days, unavailable dates inside the range unless data-allow-unavailable) — typed text is kept; pasting one range
     ("3/3/2026 – 3/7/2026", "2026-03-03/2026-03-07") into the start field fills both.
   - the "Choose dates" IconButton and a labelled modal dialog: anchored popover with 2 months on desktop (1 on tablet), full-screen
     Sheet on phones with the same typed fields moved on top and Apply in a sticky bar. First pick = start ("Start date … Choose
     end date" announced), second = end (a day before the start becomes the new start); a preview ribbon follows hover/focus;
     end and start are solid fills + ribbon ends + "start date"/"end date" in the name; days beyond data-max-days become unavailable
     with the reason while choosing the end. Apply commits (focus back to the trigger, "{range} selected" announced); Esc / Cancel /
     outside = no change. data-variant="with-presets": data-presets='[{"label":"Last 7 days","from":-6,"to":0},{"label":"This month","month":0}]'.
   Shared attributes with DatePicker: data-min, data-max, data-unavailable, data-legend, data-first-day, data-today, data-loading,
   data-i18n-*. Static previews: data-default-open, data-presentation="sheet", data-draft="ISO/ISO" or "ISO/" (selecting end),
   data-hover="ISO" (preview ribbon), data-force-days. */
DS.register('date-range-picker', function (el) {
  var U = DS.dates;
  if (!U || !DS.dateCalendar) return;
  var inputs = el.querySelectorAll('.ds-date-picker__input');
  if (inputs.length < 2) return;
  var startIn = inputs[0], endIn = inputs[1];
  var t = U.strings(el), locale = U.localeOf(el), F = U.formatter(locale), today = U.todayOf(el);
  var min = el.getAttribute('data-min'), max = el.getAttribute('data-max');
  var maxDays = parseInt(el.getAttribute('data-max-days'), 10) || 0, minDays = parseInt(el.getAttribute('data-min-days'), 10) || 1;
  var allowUnavailable = el.hasAttribute('data-allow-unavailable');
  var blocked = startIn.getAttribute('aria-disabled') === 'true';
  var readOnly = startIn.readOnly && !blocked;
  var fields = el.querySelector('.ds-date-range-picker__fields');
  var row = el.querySelector('.ds-date-range-picker__row') || fields;
  var legendEl = el.querySelector('.ds-date-range-picker__legend');
  var id = el.id || startIn.id + '-range';
  var rules = {};
  try { rules = JSON.parse(el.getAttribute('data-unavailable') || '{}'); } catch (e) { rules = {}; }
  var baseReason = function (d) {
    if (min && d < min) return t('before-min', 'Dates before {date} can’t be selected.', { date: F.medium(min) });
    if (max && d > max) return t('after-max', 'Dates after {date} can’t be selected.', { date: F.medium(max) });
    if (rules.dates && rules.dates[d]) return rules.dates[d];
    if (rules.weekdays && rules.weekdays.indexOf(U.weekday(d)) >= 0) return rules.weekdaysReason || t('unavailable', 'Unavailable');
    if (typeof el.dsIsDateUnavailable === 'function') { var r = el.dsIsDateUnavailable(d); if (r) return String(r); }
    return null;
  };
  if (readOnly) { startIn.setAttribute('aria-readonly', 'true'); endIn.setAttribute('aria-readonly', 'true'); return; }

  // hidden ISO values
  var hid = [startIn, endIn].map(function (inp) {
    if (!inp.name) return null;
    var h = U.node('input', null, { type: 'hidden', name: inp.name });
    inp.removeAttribute('name');
    inp.parentNode.appendChild(h);
    return h;
  });
  var val = { start: F.parse(startIn.value) || null, end: F.parse(endIn.value) || null };
  var sync = function () {
    if (hid[0]) hid[0].value = val.start || '';
    if (hid[1]) hid[1].value = val.end || '';
  };
  sync();

  // range-level error
  var errEl = el.querySelector('.ds-date-range-picker__error');
  var helper = el.querySelector('.ds-date-range-picker__helper');
  var describe = function (inp, on, eid) {
    var ids = (inp.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== eid; });
    if (on) ids.unshift(eid);
    if (ids.length) inp.setAttribute('aria-describedby', ids.join(' ')); else inp.removeAttribute('aria-describedby');
  };
  var setError = function (msg, which) {
    if (!errEl) {
      errEl = U.node('p', 'ds-date-range-picker__error', { id: id + '-error' });
      errEl.innerHTML = U.icon('critical') + '<span></span>';
      (helper || row).insertAdjacentElement(helper ? 'beforebegin' : 'afterend', errEl);
    }
    errEl.id = errEl.id || id + '-error';
    errEl.querySelector('span').textContent = msg;
    errEl.hidden = false;
    [startIn, endIn].forEach(function (inp) {
      var on = which.indexOf(inp) >= 0;
      describe(inp, on, errEl.id);
      if (on) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
    });
  };
  var clearError = function () {
    if (errEl) { errEl.hidden = true; describe(startIn, false, errEl.id); describe(endIn, false, errEl.id); }
    startIn.removeAttribute('aria-invalid'); endIn.removeAttribute('aria-invalid');
  };
  var unavailableInside = function (s, e) {
    if (allowUnavailable || !s || !e) return null;
    for (var d = s; d <= e; d = U.addDays(d, 1)) { var r = baseReason(d); if (r) return { day: d, why: r }; }
    return null;
  };
  // returns '' when the range is acceptable
  var rangeMessage = function (s, e) {
    if (!s || !e) return '';
    if (e < s) return t('error-order', 'End date must be on or after the start date');
    var n = U.daysBetween(s, e) + 1;
    if (maxDays && n > maxDays) return t('error-max-days', 'Choose a range of {n} days or less', { n: maxDays });
    if (n < minDays) return t('error-min-days', 'Choose a range of at least {n} days', { n: minDays });
    var u = unavailableInside(s, e);
    if (u) return t('error-unavailable-inside', '{date} is unavailable ({reason}). Choose dates without it.', { date: F.medium(u.day), reason: u.why.replace(/\.$/, '') });
    return '';
  };
  function validateFields() {
    var labels = el.querySelectorAll('.ds-date-picker__label');
    var parsed = [startIn, endIn].map(function (inp) { return F.parse(inp.value); });
    for (var i = 0; i < 2; i++) {
      if (parsed[i] === undefined) {
        setError(t('error-format', 'Enter the {field} in the format {pattern}', { field: U.labelText(labels[i]).toLowerCase(), pattern: F.pattern }), [inputs[i]]);
        return;
      }
      if (parsed[i] && ((min && parsed[i] < min) || (max && parsed[i] > max))) {
        setError(parsed[i] < min ? t('error-min', 'Enter a date on or after {date}', { date: F.medium(min) }) : t('error-max', 'Enter a date on or before {date}', { date: F.medium(max) }), [inputs[i]]);
        return;
      }
    }
    val.start = parsed[0] || null;
    val.end = parsed[1] || null;
    if (val.start) startIn.value = F.num(val.start);
    if (val.end) endIn.value = F.num(val.end);
    sync();
    var msg = rangeMessage(val.start, val.end);
    if (msg) setError(msg, /End date/.test(msg) || val.end < val.start ? [endIn] : [startIn, endIn]); else clearError();
    if (dlg && dlg.open) { draft = { start: val.start, end: val.end }; phase = val.start && !val.end ? 'end' : 'start'; if (cal) { if (val.start) cal.show(U.monthStart(val.start), false); cal.paint(); } updateDraftUi(); }
  }
  [startIn, endIn].forEach(function (inp) {
    inp.addEventListener('change', validateFields);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') validateFields();
      if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); open(); }
    });
  });
  startIn.addEventListener('paste', function (e) {
    var text = ((e.clipboardData || window.clipboardData) && (e.clipboardData || window.clipboardData).getData('text')) || '';
    var m = /^\s*(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})\s*$/.exec(text) || /^\s*(.+?)\s*(?:–|—|\s-\s|\sto\s|\ss\.d\.\s|\ssampai\s)\s*(.+?)\s*$/i.exec(text);
    if (!m) return;
    var a = F.parse(m[1]), b = F.parse(m[2]);
    if (!a || !b) return;
    e.preventDefault();
    startIn.value = F.num(a);
    endIn.value = F.num(b);
    validateFields();
  });

  // trigger
  var trigger = U.node('button', 'ds-date-range-picker__trigger', { type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-controls': id + '-dialog', 'aria-label': t('choose', 'Choose dates') });
  trigger.innerHTML = U.icon('calendar');
  if (el.getAttribute('data-force-trigger')) trigger.setAttribute('data-force', el.getAttribute('data-force-trigger'));
  row.appendChild(trigger);
  if (blocked) {
    trigger.setAttribute('aria-disabled', 'true');
    if (startIn.getAttribute('aria-describedby')) trigger.setAttribute('aria-describedby', startIn.getAttribute('aria-describedby'));
    trigger.addEventListener('click', function () { DS.announce(U.reasonOf(startIn), 'polite'); });
    return;
  }

  // dialog
  var dlg = U.node('dialog', 'ds-date-range-picker__dialog', { id: id + '-dialog', 'aria-labelledby': id + '-dtitle', 'aria-describedby': id + '-instr' });
  dlg.innerHTML = '<div class="ds-date-range-picker__header"><h2 class="ds-date-range-picker__title" id="' + id + '-dtitle"></h2>' +
    '<p class="ds-date-range-picker__instruction" id="' + id + '-instr"></p>' +
    '<button type="button" class="ds-date-picker__nav-btn ds-date-range-picker__close">' + U.icon('close') + '</button></div>' +
    '<div class="ds-date-range-picker__sheet-fields"></div><div class="ds-date-range-picker__body"></div>' +
    '<p class="ds-date-range-picker__draft-error" id="' + id + '-derr" hidden>' + U.icon('critical') + '<span></span></p>' +
    '<div class="ds-date-range-picker__footer"><span class="ds-date-range-picker__summary" aria-hidden="true"></span>' +
    '<button type="button" class="ds-button" data-ds-cancel></button><button type="button" class="ds-button" data-variant="primary" data-ds-apply></button></div>';
  var q = function (s) { return dlg.querySelector(s); };
  q('.ds-date-range-picker__title').textContent = t('choose', 'Choose dates') + (legendEl ? ': ' + U.labelText(legendEl) : '');
  q('.ds-date-range-picker__close').setAttribute('aria-label', t('close', 'Close'));
  q('[data-ds-cancel]').textContent = t('cancel', 'Cancel');
  var applyBtn = q('[data-ds-apply]');
  applyBtn.textContent = t('apply', 'Apply');
  var instr = q('.ds-date-range-picker__instruction'), body = q('.ds-date-range-picker__body'), derr = q('.ds-date-range-picker__draft-error'), summary = q('.ds-date-range-picker__summary');
  el.appendChild(dlg);

  var presetsBox = null, presets = [];
  if (el.getAttribute('data-variant') === 'with-presets') {
    try { presets = JSON.parse(el.getAttribute('data-presets') || '[]'); } catch (e) { presets = []; }
    if (presets.length) {
      presetsBox = U.node('fieldset', 'ds-date-range-picker__presets');
      presetsBox.innerHTML = '<legend class="ds-date-range-picker__presets-legend"></legend>';
      presetsBox.firstChild.textContent = t('presets', 'Quick ranges');
      presets.forEach(function (p, i) {
        var lab = U.node('label', 'ds-date-range-picker__preset');
        lab.innerHTML = '<input type="radio" name="' + id + '-preset" value="' + i + '"><span></span>';
        lab.lastChild.textContent = p.label;
        presetsBox.appendChild(lab);
      });
      body.appendChild(presetsBox);
      presetsBox.addEventListener('change', function (e) {
        var p = presets[+e.target.value];
        var r = presetRange(p);
        draft = { start: r[0], end: r[1] };
        phase = 'start';
        hover = null;
        cal.show(U.monthStart(r[0]), false);
        cal.paint();
        updateDraftUi();
        DS.announce(t('selected', '{range} selected', { range: F.range(r[0], r[1]) }), 'polite');
      });
    }
  }
  function presetRange(p) {
    if (p.month !== undefined) { var ms = U.addMonths(U.monthStart(today), p.month), me = U.addDays(U.addMonths(ms, 1), -1); return [ms, me > today && p.month === 0 ? today : me]; }
    return [U.addDays(today, p.from || 0), U.addDays(today, p.to || 0)];
  }
  function syncPresets() {
    if (!presetsBox) return;
    Array.prototype.forEach.call(presetsBox.querySelectorAll('input'), function (r, i) { var pr = presetRange(presets[i]); r.checked = draft.start === pr[0] && draft.end === pr[1]; });
  }

  var draft = { start: null, end: null }, phase = 'start', hover = null, cal = null, sheet = false, isStatic = false, snapshot = null, placeholder = null;
  var forceDays = U.parseForce(el.getAttribute('data-force-days'));
  function reasonFor(d) {
    var r = baseReason(d);
    if (r) return r;
    if (phase === 'end' && draft.start && d > draft.start) {
      var n = U.daysBetween(draft.start, d) + 1;
      if (maxDays && n > maxDays) return t('beyond-max-days', 'Ranges can be up to {n} days.', { n: maxDays });
      if (n < minDays) return t('below-min-days', 'Ranges need at least {n} days.', { n: minDays });
    }
    return null;
  }
  function stateFor(d) {
    var s = draft.start, e = draft.end;
    if (s && e) {
      if (d === s && d === e) return { selected: true, extra: t('start-end', 'start and end date') };
      if (d === s) return { selected: true, range: 'start', extra: t('start', 'start date') };
      if (d === e) return { selected: true, range: 'end', extra: t('end', 'end date') };
      if (d > s && d < e) return { range: 'middle', extra: t('in-range', 'in range') };
      return {};
    }
    if (s) {
      var h = hover && hover > s ? hover : null;
      if (d === s) return { selected: true, range: h ? 'preview-start' : null, extra: t('start', 'start date') };
      if (h && d > s && d < h) return { range: 'preview' };
      if (h && d === h) return { range: 'preview-end' };
    }
    return {};
  }
  function updateDraftUi() {
    instr.setAttribute('data-phase', phase === 'end' ? 'end' : 'start');
    instr.textContent = phase === 'end' ? t('choose-end', 'Choose end date') : draft.start && draft.end ? F.range(draft.start, draft.end) : t('choose-start', 'Choose start date');
    summary.textContent = draft.start && draft.end ? F.range(draft.start, draft.end) : '';
    var msg = rangeMessage(draft.start, draft.end);
    var why = msg || (!draft.start || !draft.end ? t('apply-needs-range', 'Choose a start and an end date to apply.') : '');
    if (msg) { derr.hidden = false; derr.querySelector('span').textContent = msg; } else derr.hidden = true;
    if (why) { applyBtn.setAttribute('aria-disabled', 'true'); applyBtn.setAttribute('aria-describedby', msg ? derr.id : instr.id); }
    else { applyBtn.removeAttribute('aria-disabled'); applyBtn.removeAttribute('aria-describedby'); }
    syncPresets();
  }
  function onSelect(d) {
    if (phase === 'start' || !draft.start || d < draft.start) {
      draft = { start: d, end: null };
      phase = 'end';
      hover = null;
      DS.announce(t('announce-start', 'Start date {date}. Choose end date', { date: F.medium(d) }), 'polite');
    } else {
      draft.end = d;
      phase = 'start';
      hover = null;
      DS.announce(t('announce-range', '{range}. Press Apply to confirm', { range: F.range(draft.start, d) }), 'polite');
    }
    cal.paint();
    updateDraftUi();
  }
  function buildCalendar() {
    var months = sheet ? 1 : (parseInt(getComputedStyle(el).getPropertyValue('--_months'), 10) || 2);
    if (el.hasAttribute('data-months')) months = +el.getAttribute('data-months');
    var legend = [
      { kind: 'selected', text: t('legend-ends', 'Start and end date') },
      { kind: 'range', text: t('legend-range', 'Days in the range') },
      { kind: 'today', text: t('legend-today', 'Today (underlined)') }
    ];
    var lt = el.getAttribute('data-legend');
    if (lt) legend.push({ kind: 'unavailable', text: lt });
    if (maxDays) legend.push({ kind: 'bounds', text: t('legend-max-days', 'Ranges can be up to {n} days.', { n: maxDays }) });
    var initial = draft.start || U.clamp(today, min, max);
    cal = DS.dateCalendar({
      id: id + '-cal', fmt: F, t: t, firstDay: U.firstDayOf(el, locale), today: today, min: min, max: max, months: months, jump: false, heading: 'h3',
      initial: initial, loading: el.hasAttribute('data-loading'), reasonFor: reasonFor, stateFor: stateFor, legend: legend, forceDays: forceDays,
      onSelect: onSelect,
      onHover: function (d) { if (phase === 'end' && hover !== d) { hover = d; cal.paint(); } },
      onFocusDay: function (d) { if (!isStatic && phase === 'end' && hover !== d) { hover = d; cal.paint(); } }
    });
    var old = body.querySelector('.ds-date-picker__calendar');
    if (old) old.remove();
    body.appendChild(cal.el);
    cal.setFocused(initial);
    cal.build();
  }
  function place() {
    if (sheet) { dlg.style.top = dlg.style.left = ''; return; }
    var r = row.getBoundingClientRect(), d = dlg.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight, gap = 4;
    var rtl = getComputedStyle(el).direction === 'rtl';
    var left = rtl ? r.right - d.width : r.left;
    left = Math.max(gap * 4, Math.min(left, vw - d.width - gap * 4));
    var top = r.bottom + gap;
    if (top + d.height > vh && r.top - d.height - gap > 0) top = r.top - d.height - gap;
    else if (top + d.height > vh) top = Math.max(gap * 4, vh - d.height - gap * 4);
    dlg.style.left = left + 'px';
    dlg.style.top = top + 'px';
  }
  function open(asStatic) {
    if (dlg.open) return;
    isStatic = !!asStatic;
    sheet = U.presentationOf(el) === 'sheet';
    dlg.setAttribute('data-presentation', sheet ? 'sheet' : 'popover');
    snapshot = [startIn.value, endIn.value];
    draft = { start: val.start, end: val.end };
    phase = 'start';
    hover = null;
    var pd = el.getAttribute('data-draft');
    if (isStatic && pd) { var pp = pd.split('/'); draft = { start: pp[0] || null, end: pp[1] || null }; phase = draft.start && !draft.end ? 'end' : 'start'; hover = el.getAttribute('data-hover'); }
    if (sheet && fields) { placeholder = document.createComment('range fields'); fields.parentNode.insertBefore(placeholder, fields); q('.ds-date-range-picker__sheet-fields').appendChild(fields); }
    buildCalendar();
    updateDraftUi();
    trigger.setAttribute('aria-expanded', 'true');
    if (isStatic) { dlg.setAttribute('data-static', ''); dlg.setAttribute('open', ''); return; }
    dlg.showModal();
    place();
    cal.focusDay(cal.getFocused(), true);
    el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true } }));
  }
  function close(commit) {
    if (!dlg.open || isStatic) return;
    if (commit) {
      val = { start: draft.start, end: draft.end };
      startIn.value = val.start ? F.num(val.start) : '';
      endIn.value = val.end ? F.num(val.end) : '';
      sync();
      clearError();
    } else if (snapshot) { startIn.value = snapshot[0]; endIn.value = snapshot[1]; }
    if (placeholder) { placeholder.parentNode.replaceChild(fields, placeholder); placeholder = null; }
    dlg.close();
    trigger.setAttribute('aria-expanded', 'false');
    U.focusVisible(trigger);
    if (commit) {
      DS.announce(t('selected', '{range} selected', { range: F.range(val.start, val.end) }), 'polite');
      startIn.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: { start: val.start, end: val.end } }));
    }
    el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false } }));
  }
  trigger.addEventListener('click', function () { if (dlg.open && !isStatic) close(false); else open(); });
  q('[data-ds-cancel]').addEventListener('click', function () { close(false); });
  q('.ds-date-range-picker__close').addEventListener('click', function () { close(false); });
  applyBtn.addEventListener('click', function () {
    if (applyBtn.getAttribute('aria-disabled') === 'true') { DS.announce(derr.hidden ? instr.textContent : derr.textContent.trim(), 'polite'); return; }
    close(true);
  });
  dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(false); });
  dlg.addEventListener('click', function (e) {
    if (e.target !== dlg || isStatic) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(false);
  });
  window.addEventListener('resize', function () { if (dlg.open && !isStatic) place(); });
  if (el.hasAttribute('data-default-open')) open(true);
});
