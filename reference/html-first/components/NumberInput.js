/* NumberInput · progressive enhancement only (§6.4). Without JS: a text input (inputmode numeric/decimal) that submits what was typed.
   Adds: ± buttons (labelled "Increase/Decrease {label}", tabindex -1, step on release, repeat after a press-and-hold), ↑/↓ step,
   PageUp/PageDown (or Shift+↑/↓) large step, Home/End to min/max, letters rejected silently, decimal arithmetic (0.1 + 0.2 = 0.3,
   BigInt-scaled so very large values stay exact), locale parsing (grouping, decimal sign, U+2212 minus, full-width and
   Arabic-Indic digits) and locale formatting on blur/Enter while the RAW value is what is submitted (hidden input carrying the
   original name; data-value on the visible input), aria-valuenow/-valuetext/-valuemin/-valuemax, at-limit buttons
   (aria-disabled + "Minimum is …"), errors that name the accepted range (typed value kept, never clamped silently).
   data-min, data-max, data-step, data-large-step, data-fraction-digits, data-unit-text / data-valuetext, data-msg-* (glossary). */
DS.register('number-input', function (el) {
  var input = el.querySelector('.ds-number-input__input');
  if (!input) return;
  var lang = (el.closest('[lang]') || document.documentElement).getAttribute('lang') || 'en-US';
  var d = function (k, def) { var v = el.getAttribute('data-' + k); return v === null || v === '' ? def : v; };
  var field = el;
  var group = input.parentNode;

  // ---- decimal arithmetic on strings ----
  var dec = function (s) { var i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
  var toInt = function (s, k) { var neg = s.charAt(0) === '-'; if (neg) s = s.slice(1); var p = s.split('.'); var f = (p[1] || ''); while (f.length < k) f += '0'; var v = BigInt((p[0] || '0') + f.slice(0, k)); return neg ? -v : v; };
  var fromInt = function (v, k) {
    var neg = v < BigInt(0); if (neg) v = -v;
    var s = v.toString(); while (s.length < k + 1) s = '0' + s;
    var out = k ? s.slice(0, s.length - k) + '.' + s.slice(s.length - k) : s;
    if (k) out = out.replace(/0+$/, '').replace(/\.$/, '');
    return (neg && out !== '0' ? '-' : '') + out;
  };
  var K = function (a, b) { return Math.max(dec(a), dec(b)); };
  var add = function (a, b) { var k = K(a, b); return fromInt(toInt(a, k) + toInt(b, k), k); };
  var cmp = function (a, b) { var k = K(a, b), x = toInt(a, k), y = toInt(b, k); return x < y ? -1 : x > y ? 1 : 0; };
  var offStep = function (v, base, st) { var k = Math.max(dec(v), dec(base), dec(st)); return (toInt(v, k) - toInt(base, k)) % toInt(st, k) !== BigInt(0); };

  var min = d('min', null), max = d('max', null), step = d('step', '1');
  var largeStep = d('large-step', fromInt(toInt(step, dec(step)) * BigInt(10), dec(step)));
  var fd = parseInt(d('fraction-digits', '0'), 10);

  // ---- locale ----
  var parts = new Intl.NumberFormat(lang).formatToParts(-12345.6);
  var sym = function (type, def) { for (var i = 0; i < parts.length; i++) if (parts[i].type === type) return parts[i].value; return def; };
  var groupSym = sym('group', ','), decSym = sym('decimal', '.');
  var nf = function (raw, grouping) {
    try { return new Intl.NumberFormat(lang, { useGrouping: grouping, minimumFractionDigits: fd, maximumFractionDigits: Math.min(100, Math.max(fd, dec(raw))) }).format(raw); }
    catch (e) { return raw; }
  };
  var localRaw = function (raw) { return nf(raw, false); }; // editable: no grouping
  var fmt = function (raw) { return nf(raw, true); };
  var normDigits = function (s) {
    return s.replace(/[０-９]/g, function (c) { return String(c.charCodeAt(0) - 0xFF10); })
      .replace(/[٠-٩]/g, function (c) { return String(c.charCodeAt(0) - 0x0660); })
      .replace(/[۰-۹]/g, function (c) { return String(c.charCodeAt(0) - 0x06F0); })
      .replace(/[−－‒–]/g, '-').replace(/٫/g, decSym).replace(/٬/g, groupSym);
  };
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
  // returns '' (empty), a canonical decimal string, or null (cannot be parsed)
  var parse = function (text) {
    var s = normDigits(String(text)).replace(/[\s  ]/g, '');
    if (!s) return '';
    if (groupSym.trim()) s = s.replace(new RegExp(esc(groupSym.replace(/[  ]/g, ' ').trim() || groupSym), 'g'), '');
    s = s.split(decSym).join('.');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
    s = s.replace(/^(-?)0+(?=\d)/, '$1');
    return s === '-0' ? '0' : s;
  };

  // ---- strings ----
  var label = el.querySelector('.ds-text-field__label');
  var labelText = label ? label.textContent.replace(/\s*\(.*?\)\s*/g, ' ').trim() : '';
  var msg = function (k, def) { return d('msg-' + k, def).replace('{min}', min !== null ? fmt(min) : '').replace('{max}', max !== null ? fmt(max) : '').replace('{step}', fmt(step)); };

  // ---- raw value carrier ----
  var hidden = null;
  if (input.name) {
    hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = input.name;
    input.removeAttribute('name');
    el.appendChild(hidden);
  }
  var raw = parse(input.value);
  if (raw === null) raw = '';

  // ---- error ----
  var errorEl = function (create) {
    var e = field.querySelector('.ds-text-field__error');
    if (!e && create) {
      e = document.createElement('p');
      e.className = 'ds-text-field__error';
      e.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span></span>';
      group.insertAdjacentElement('afterend', e);
    }
    if (e && !e.id) e.id = (input.id || 'ds-number') + '-error';
    return e;
  };
  var setError = function (m) {
    var e = errorEl(!!m);
    if (!e) return;
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== e.id; });
    if (m) { e.querySelector('span').textContent = m; e.hidden = false; ids.unshift(e.id); input.setAttribute('aria-invalid', 'true'); }
    else { e.hidden = true; input.removeAttribute('aria-invalid'); }
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  };
  var validate = function (r) {
    if (r === null) return msg('format', 'Enter a number, for example ' + fmt(fd ? '1250.5' : '1250'));
    if (r === '') return '';
    var range = min !== null && max !== null ? msg('range', 'Enter a number from {min} to {max}') : '';
    if (min !== null && cmp(r, min) < 0) return range || msg('min', 'Enter {min} or more');
    if (max !== null && cmp(r, max) > 0) return range || msg('max', 'Enter {max} or less');
    if (offStep(r, min !== null ? min : '0', step) && el.getAttribute('data-allow-off-step') === null) return msg('step', 'Use steps of {step}');
    return '';
  };

  // ---- ± buttons ----
  var btns = Array.prototype.slice.call(group.querySelectorAll('.ds-number-input__step'));
  var limitNote = function (b, text) {
    var id = (input.id || 'ds-number') + '-' + b.getAttribute('data-dir') + '-limit';
    var n = document.getElementById(id);
    var ids = (b.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
    if (text) {
      if (!n) { n = document.createElement('span'); n.id = id; n.className = 'ds-vh'; el.appendChild(n); }
      n.textContent = text;
      ids.push(id);
    } else if (n) n.remove();
    if (ids.length) b.setAttribute('aria-describedby', ids.join(' ')); else b.removeAttribute('aria-describedby');
  };
  btns.forEach(function (b) {
    b.tabIndex = -1;
    if (input.id) b.setAttribute('aria-controls', input.id);
    if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', (b.getAttribute('data-dir') === 'up' ? d('increase-label', 'Increase') : d('decrease-label', 'Decrease')) + ' ' + labelText.toLowerCase());
  });
  var locked = function () { return input.readOnly || input.getAttribute('aria-disabled') === 'true' || input.getAttribute('aria-busy') === 'true'; };

  // ---- render ----
  var valueText = function (r) {
    if (r === '') return '';
    var tpl = d('valuetext', null);
    var f = fmt(r);
    return tpl ? tpl.replace('{value}', f) : f + (d('unit-text', '') ? ' ' + d('unit-text', '') : '');
  };
  var render = function (display) {
    if (hidden) hidden.value = raw;
    input.setAttribute('data-value', raw);
    if (raw === '') { input.removeAttribute('aria-valuenow'); input.removeAttribute('aria-valuetext'); }
    else { input.setAttribute('aria-valuenow', raw); input.setAttribute('aria-valuetext', valueText(raw)); }
    if (min !== null) input.setAttribute('aria-valuemin', min);
    if (max !== null) input.setAttribute('aria-valuemax', max);
    if (display) input.value = raw === '' ? '' : (document.activeElement === input ? localRaw(raw) : fmt(raw));
    var blocked = input.getAttribute('aria-disabled') === 'true';
    btns.forEach(function (b) {
      var up = b.getAttribute('data-dir') === 'up';
      var atLimit = raw !== '' && (up ? max !== null && cmp(raw, max) >= 0 : min !== null && cmp(raw, min) <= 0);
      if (blocked || atLimit) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      limitNote(b, atLimit ? (up ? msg('at-max', 'Maximum is {max}') : msg('at-min', 'Minimum is {min}')) : '');
    });
  };
  var stepBy = function (delta) {
    if (locked()) return false;
    var cur = parse(input.value);
    var base;
    if (cur === null) return false; // unparseable text is kept; the error explains it on blur
    if (cur === '') base = min !== null ? min : (max !== null && cmp('0', max) > 0 ? max : '0');
    else base = add(cur, delta);
    if (cur !== '' && min !== null && cmp(base, min) < 0) base = min;
    if (cur !== '' && max !== null && cmp(base, max) > 0) base = max;
    if (base === raw && cur !== '') { render(true); return false; }
    raw = base;
    render(true);
    if (input.getAttribute('aria-invalid') === 'true' && !validate(raw)) setError('');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    try { var n = input.value.length; input.setSelectionRange(n, n); } catch (e) { /* not focused */ }
    return true;
  };
  var neg = function (s) { return s.charAt(0) === '-' ? s.slice(1) : '-' + s; };
  var commit = function () {
    var r = parse(input.value);
    var m = validate(r);
    if (r !== null) { raw = r; render(!m); } // invalid text is kept as typed
    setError(m);
    return !m;
  };

  input.addEventListener('focus', function () { if (!locked() && raw !== '' && parse(input.value) === raw) input.value = localRaw(raw); });
  input.addEventListener('blur', function () { if (!input.readOnly) commit(); });
  input.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'Enter') { if (!input.readOnly) commit(); return; }
    var delta = null;
    if (k === 'ArrowUp') delta = e.shiftKey ? largeStep : step;
    else if (k === 'ArrowDown') delta = neg(e.shiftKey ? largeStep : step);
    else if (k === 'PageUp') delta = largeStep;
    else if (k === 'PageDown') delta = neg(largeStep);
    if (delta !== null) { e.preventDefault(); stepBy(delta); return; }
    if ((k === 'Home' && min !== null) || (k === 'End' && max !== null)) {
      e.preventDefault();
      if (locked()) return;
      raw = k === 'Home' ? min : max;
      render(true);
      setError('');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  var allowed = new RegExp('^[0-9\\uFF10-\\uFF19\\u0660-\\u0669\\u06F0-\\u06F9\\s\\u00A0\\u202F' + esc(decSym + groupSym) + '.,' + (min === null || cmp(min, '0') < 0 ? '\\-\\u2212' : '') + ']*$');
  input.addEventListener('beforeinput', function (e) {
    if (e.inputType === 'insertText' && e.data && !allowed.test(e.data)) e.preventDefault(); // letters rejected silently
  });

  // press-and-hold repeats after 500 ms, every 100 ms; one step on release otherwise (SC 2.5.2)
  btns.forEach(function (b) {
    var hold = 0, rep = 0, repeated = false;
    var stop = function () { clearTimeout(hold); clearInterval(rep); };
    var delta = function () { return b.getAttribute('data-dir') === 'up' ? step : neg(step); };
    b.addEventListener('mousedown', function (e) { if (document.activeElement === input) e.preventDefault(); }); // focus stays in the input
    b.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || locked() || b.getAttribute('aria-disabled') === 'true') return;
      repeated = false;
      hold = setTimeout(function () { repeated = true; rep = setInterval(function () { if (!stepBy(delta())) stop(); }, 100); }, 500);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, stop); });
    b.addEventListener('click', function () {
      if (repeated) { repeated = false; return; }
      if (b.getAttribute('aria-disabled') === 'true') {
        var t = document.getElementById((input.id || 'ds-number') + '-' + b.getAttribute('data-dir') + '-limit');
        if (t) DS.announce(t.textContent, 'polite');
        return;
      }
      stepBy(delta());
    });
  });

  el.setAttribute('data-enhanced', '');
  render(document.activeElement !== input && raw !== '' && !input.hasAttribute('aria-invalid'));
});
