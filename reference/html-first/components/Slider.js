/* Slider · progressive enhancement only (§6.4). Without JS the labelled native range input(s) submit, move with arrows / Page keys
   and jump on a track click (single-pointer path). Adds ([data-enhanced]):
   - token track + fill, the always-visible value text (<output>, locale Intl.NumberFormat from data-format, formatRange for the
     range variant), aria-valuetext with spelled units (data-valuetext="{value} percent") or named steps (data-names='{"1":"Low"}'),
     the value bubble (aria-hidden) while pressed / dragged / focused.
   - keys: →/↑ +step, ←/↓ −step (← increases in RTL), PageUp/PageDown ± data-large-step (default 10 % of the range), Home/End to the
     effective bounds; Esc while dragging restores the start value (SC 2.5.2).
   - range variant: thumbs never cross (data-min-steps-between), the last moved thumb is on top, a track click moves the nearest
     thumb; each thumb's aria-valuemin/max is the other thumb's value.
   - companion NumberInput(s) (revealed from [hidden], SC 2.5.7): paste "1.000.000", "1,000,000" or "40%" is normalised; out of
     range or crossing = icon + error text, thumb stays at the last valid value.
   - blocked (aria-disabled + reason): no change, reason announced on attempts; read-only (aria-readonly): focusable, no change,
     companion hidden. Static previews: data-force on the range input (hover, pressed, focus). */
DS.register('slider', function (el) {
  var ranges = Array.prototype.slice.call(el.querySelectorAll('.ds-slider__range'));
  if (!ranges.length) return;
  var isRange = ranges.length > 1;
  var control = el.querySelector('.ds-slider__control');
  var output = el.querySelector('.ds-slider__value');
  var inputs = Array.prototype.slice.call(el.querySelectorAll('.ds-slider__input'));
  var inputsBox = el.querySelector('.ds-slider__inputs');
  var lang = (el.closest('[lang]') && el.closest('[lang]').getAttribute('lang')) || 'en-US';
  var t = function (k, d, vars) { var s = el.getAttribute('data-i18n-' + k) || d; if (vars) for (var x in vars) s = s.split('{' + x + '}').join(vars[x]); return s; };
  var opts = {};
  try { opts = JSON.parse(el.getAttribute('data-format') || '{}'); } catch (e) { opts = {}; }
  var names = {};
  try { names = JSON.parse(el.getAttribute('data-names') || '{}'); } catch (e) { names = {}; }
  var nf, plain;
  try { nf = new Intl.NumberFormat(lang, opts); } catch (e) { nf = new Intl.NumberFormat('en-US'); }
  var min = +ranges[0].min || 0, max = ranges[0].max === '' ? 100 : +ranges[0].max, step = +ranges[0].step || 1;
  var dec = (String(step).split('.')[1] || '').length;
  plain = new Intl.NumberFormat(lang, { maximumFractionDigits: dec, useGrouping: true });
  var large = +el.getAttribute('data-large-step') || Math.max(step, Math.round((max - min) / 10 / step) * step);
  var gap = (+el.getAttribute('data-min-steps-between') || 0) * step;
  var tmpl = el.getAttribute('data-valuetext');
  var blocked = ranges[0].getAttribute('aria-disabled') === 'true';
  var ro = ranges[0].getAttribute('aria-readonly') === 'true';
  var pctOf = function (v) { return max === min ? 0 : (v - min) / (max - min); };
  var show = function (v) { return names[v] || nf.format(opts.style === 'percent' ? v / 100 : v); };
  var spoken = function (v) { return names[v] || (tmpl ? tmpl.replace('{value}', plain.format(v)) : show(v)); };
  var reasonText = function () {
    var ids = (ranges[0].getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var r = ids[i] && document.getElementById(ids[i]); if (r && /__reason/.test(r.className)) return r.textContent.trim(); }
    return '';
  };

  el.setAttribute('data-enhanced', '');
  var track = document.createElement('span'); track.className = 'ds-slider__track'; track.setAttribute('aria-hidden', 'true');
  var fill = document.createElement('span'); fill.className = 'ds-slider__fill'; fill.setAttribute('aria-hidden', 'true');
  control.insertBefore(fill, control.firstChild);
  control.insertBefore(track, fill);
  var bubbles = ranges.map(function (r, i) {
    r.setAttribute('data-thumb', String(i));
    var b = document.createElement('span');
    b.className = 'ds-slider__bubble';
    b.setAttribute('data-thumb', String(i));
    b.setAttribute('aria-hidden', 'true');
    b.setAttribute('data-ds-text', 'supporting');
    control.appendChild(b);
    return b;
  });
  if (output) output.hidden = false;
  if (inputsBox && !ro) inputsBox.hidden = false;
  if (blocked) inputs.forEach(function (n) { n.readOnly = true; n.setAttribute('aria-disabled', 'true'); });
  inputs.forEach(function (n, i) { if (ranges[i]) { ranges[i].id = ranges[i].id || (el.id || 'ds-slider') + '-r' + i; n.setAttribute('aria-controls', ranges[i].id); } });

  function vals() { return ranges.map(function (r) { return +r.value; }); }
  function update(skipInput) {
    var v = vals();
    el.style.setProperty('--_a', String(pctOf(v[0])));
    if (isRange) el.style.setProperty('--_b', String(pctOf(v[1])));
    ranges.forEach(function (r, i) {
      r.setAttribute('aria-valuetext', spoken(v[i]));
      if (isRange) {
        r.setAttribute('aria-valuemin', String(i ? v[0] + gap : min));
        r.setAttribute('aria-valuemax', String(i ? max : v[1] - gap));
      }
      bubbles[i].textContent = show(v[i]);
      if (inputs[i] && inputs[i] !== skipInput && inputs[i].getAttribute('aria-invalid') !== 'true') inputs[i].value = plain.format(v[i]);
    });
    if (output) output.textContent = isRange && v[0] !== v[1] ? (nf.formatRange ? nf.formatRange(opts.style === 'percent' ? v[0] / 100 : v[0], opts.style === 'percent' ? v[1] / 100 : v[1]) : show(v[0]) + ' – ' + show(v[1])) : show(v[0]);
  }
  function clampFor(i, v) {
    v = Math.round((v - min) / step) * step + min;
    v = +v.toFixed(dec);
    var lo = min, hi = max;
    if (isRange) { var o = vals(); if (i === 0) hi = o[1] - gap; else lo = o[0] + gap; }
    return Math.min(hi, Math.max(lo, v));
  }
  function setVal(i, v, commit) {
    var c = clampFor(i, v);
    if (+ranges[i].value === c) { update(); return; }
    ranges[i].value = String(c);
    ranges.forEach(function (r, j) { r.toggleAttribute('data-top', j === i); });
    update();
    ranges[i].dispatchEvent(new Event('input', { bubbles: true }));
    if (commit !== false) ranges[i].dispatchEvent(new Event('change', { bubbles: true }));
  }

  var dragging = -1, dragStart = null;
  ranges.forEach(function (r, i) {
    r.addEventListener('keydown', function (e) {
      var k = e.key;
      if (!/^(Arrow(Up|Down|Left|Right)|Page(Up|Down)|Home|End|Escape)$/.test(k)) return;
      if (k === 'Escape') {
        if (dragging === i && dragStart !== null) { e.preventDefault(); setVal(i, dragStart); dragging = -1; r.removeAttribute('data-dragging'); }
        return;
      }
      e.preventDefault();
      if (blocked) { DS.announce(reasonText(), 'polite'); return; }
      if (ro) return;
      var rtl = getComputedStyle(r).direction === 'rtl', v = +r.value, d = 0;
      if (k === 'ArrowUp' || k === (rtl ? 'ArrowLeft' : 'ArrowRight')) d = step;
      if (k === 'ArrowDown' || k === (rtl ? 'ArrowRight' : 'ArrowLeft')) d = -step;
      if (k === 'PageUp') d = large;
      if (k === 'PageDown') d = -large;
      if (k === 'Home') { setVal(i, -Infinity); return; }
      if (k === 'End') { setVal(i, Infinity); return; }
      setVal(i, v + d);
    });
    r.addEventListener('input', function () {
      if (blocked || ro) { return; }
      var c = clampFor(i, +r.value);
      if (c !== +r.value) r.value = String(c);
      ranges.forEach(function (x, j) { x.toggleAttribute('data-top', j === i); });
      update();
    });
    r.addEventListener('pointerdown', function (e) {
      if (blocked || ro) { e.preventDefault(); if (blocked) DS.announce(reasonText(), 'polite'); return; }
      dragging = i; dragStart = +r.value; r.setAttribute('data-dragging', '');
    });
  });
  window.addEventListener('pointerup', function () { if (dragging >= 0) { ranges[dragging].removeAttribute('data-dragging'); dragging = -1; dragStart = null; } });
  // value guard for blocked / read-only native inputs (the browser may still move them)
  var locked = vals();
  if (blocked || ro) ranges.forEach(function (r, i) { r.addEventListener('input', function () { r.value = String(locked[i]); update(); }); });

  // range variant: track click moves the nearest thumb (inputs ignore pointer events outside their thumbs)
  if (isRange) control.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.ds-slider__range') || blocked || ro || e.button) return;
    var rect = ranges[0].getBoundingClientRect();
    var hit = parseFloat(getComputedStyle(ranges[0]).getPropertyValue('--_hit')) || rect.height;
    var x = (e.clientX - rect.left - hit / 2) / Math.max(1, rect.width - hit);
    if (getComputedStyle(ranges[0]).direction === 'rtl') x = 1 - x;
    var v = min + Math.min(1, Math.max(0, x)) * (max - min), cur = vals();
    var i = Math.abs(v - cur[0]) <= Math.abs(v - cur[1]) ? (v < cur[0] || cur[0] !== cur[1] ? 0 : 1) : 1;
    e.preventDefault();
    setVal(i, v);
    ranges[i].focus();
  });

  // companion inputs
  var errEl = el.querySelector('.ds-slider__error');
  var parts = new Intl.NumberFormat(lang).formatToParts(12345.6);
  var groupSep = (parts.filter(function (p) { return p.type === 'group'; })[0] || {}).value || ',';
  var decSep = (parts.filter(function (p) { return p.type === 'decimal'; })[0] || {}).value || '.';
  function parseNum(s) {
    s = String(s || '').replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); }).replace(/[^\d.,\-]/g, '');
    if (!s) return NaN;
    ['.', ','].forEach(function (c) { if (s.split(c).length > 2) s = s.split(c).join(''); });
    if (s.indexOf('.') >= 0 && s.indexOf(',') >= 0) { var last = Math.max(s.lastIndexOf('.'), s.lastIndexOf(',')); s = s.slice(0, last).replace(/[.,]/g, '') + '.' + s.slice(last + 1); }
    else if (s.indexOf(groupSep) >= 0 && (dec === 0 || /[.,]\d{3}$/.test(s))) s = s.split(groupSep).join('');
    else s = s.replace(decSep, '.').replace(',', '.');
    return parseFloat(s);
  }
  function setError(inp, msg) {
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.className = 'ds-slider__error';
      errEl.id = (el.id || ranges[0].id) + '-error';
      errEl.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span></span>';
      el.querySelector('.ds-slider__body').insertAdjacentElement('afterend', errEl);
    }
    errEl.querySelector('span').textContent = msg;
    errEl.hidden = false;
    inp.setAttribute('aria-invalid', 'true');
    var ids = (inp.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== errEl.id; });
    ids.unshift(errEl.id);
    inp.setAttribute('aria-describedby', ids.join(' '));
  }
  function clearError(inp) {
    inp.removeAttribute('aria-invalid');
    if (!errEl) return;
    var ids = (inp.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== errEl.id; });
    if (ids.length) inp.setAttribute('aria-describedby', ids.join(' ')); else inp.removeAttribute('aria-describedby');
    if (!inputs.some(function (n) { return n.getAttribute('aria-invalid') === 'true'; })) errEl.hidden = true;
  }
  inputs.forEach(function (inp, i) {
    var commit = function () {
      if (blocked) return;
      var v = parseNum(inp.value);
      if (isNaN(v) || v < min || v > max) { setError(inp, t('error-range', 'Enter a value from {min} to {max}', { min: show(min), max: show(max) })); return; }
      if (isRange) {
        var o = vals();
        if (i === 0 && v > o[1] - gap) { setError(inp, t('error-cross-min', 'The minimum can’t be more than the maximum ({max})', { max: show(o[1]) })); return; }
        if (i === 1 && v < o[0] + gap) { setError(inp, t('error-cross-max', 'The maximum can’t be less than the minimum ({min})', { min: show(o[0]) })); return; }
      }
      clearError(inp);
      setVal(i, v);
      inp.value = plain.format(+ranges[i].value);
    };
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
  });
  update();
});
