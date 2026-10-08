/* Form · progressive enhancement only (§6.4). Without JS: native submit to method/action and native constraint validation.
   Adds: noValidate + system-voice messages (data-msg-required / -type / -pattern / -too-long on a control or group fieldset,
   en-US fallbacks), inline errors (icon + text + aria-describedby + aria-invalid) on submit and on blur after a change,
   re-validation while fixing, ErrorSummary in the alert slot (stays until the next submit), focus to the first invalid field,
   assertive count announcement, "Error: " document-title prefix (page variant), double-submit guard (aria-busy), dirty guard
   (beforeunload for page forms, Esc/Cancel confirmation for embedded forms, Esc restore for inline-edit).
   data-ds-preview simulates the server round trip instead of navigating (docs previews). */
DS.register('form', function (form) {
  form.noValidate = true;
  var variant = form.getAttribute('data-variant') || 'page';
  var slot = form.querySelector('.ds-form__alerts');
  var a = function (el, k, d) { return (el && el.getAttribute('data-msg-' + k)) || form.getAttribute('data-msg-' + k) || d; };
  var plural = function (n, one, other) { return (n === 1 ? one : other).replace('#', n); };
  var uid = 0;
  var ensureId = function (el, p) { if (!el.id) el.id = (form.id || 'ds-form') + '-' + p + '-' + (++uid); return el.id; };
  var ERR = { 'ds-text-field': 'ds-text-field__error', 'ds-text-area': 'ds-text-area__error', 'ds-select': 'ds-select__error', 'ds-radio-group': 'ds-radio-group__error', 'ds-checkbox-group': 'ds-checkbox__error', 'ds-checkbox': 'ds-checkbox__error' };
  var blockOf = function (root) { for (var k in ERR) if (root.classList.contains(k)) return k; return null; };
  var graphemes = function (s) { if (!(window.Intl && Intl.Segmenter)) return Array.from(s).length; var n = 0, it = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s)[Symbol.iterator](); while (!it.next().done) n++; return n; };

  // Validation units in DOM order: a control, or a radio / required checkbox group (fieldset)
  function entries() {
    var out = [], seen = [];
    var nodes = form.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea');
    Array.prototype.forEach.call(nodes, function (c) {
      var group = (c.type === 'radio' && c.closest('fieldset')) || (c.type === 'checkbox' && c.closest('fieldset.ds-checkbox-group[data-required]'));
      var unit = group || c;
      if (seen.indexOf(unit) >= 0) return;
      seen.push(unit);
      out.push(unit);
    });
    return out;
  }
  function locked(u) { return u.getAttribute('aria-disabled') === 'true' || u.readOnly || u.getAttribute('aria-readonly') === 'true' || u.closest('[aria-disabled="true"], [aria-readonly="true"]') !== null && u.tagName !== 'FIELDSET'; }
  function labelOf(u) {
    var l = u.tagName === 'FIELDSET' ? u.querySelector('legend') : (u.id && form.querySelector('label[for="' + u.id + '"]')) || u.closest('label');
    if (!l) return u.getAttribute('aria-label') || u.name || '';
    var c = l.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[class$="__optional"], .ds-checkbox__description'), function (n) { n.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function validate(u) {
    if (u.tagName === 'FIELDSET') {
      if (u.getAttribute('aria-disabled') === 'true' || u.getAttribute('aria-readonly') === 'true') return '';
      var required = u.hasAttribute('data-required') || u.getAttribute('aria-required') === 'true' || u.querySelector('input[required]');
      if (required && !u.querySelector('input:checked')) return a(u, 'required', (u.classList.contains('ds-radio-group') ? 'Select ' : 'Select at least one ') + labelOf(u).toLowerCase());
      return '';
    }
    if (locked(u)) return '';
    if (u.type === 'checkbox') return u.required && !u.checked ? a(u, 'required', 'Select ' + labelOf(u)) : '';
    var v = (u.value || '').trim();
    if (u.required && !v) return a(u, 'required', (u.tagName === 'SELECT' ? 'Select ' : 'Enter ') + labelOf(u).toLowerCase());
    if (!v) return '';
    if (u.validity && u.validity.typeMismatch) return a(u, 'type', u.validationMessage);
    if (u.validity && u.validity.patternMismatch) return a(u, 'pattern', u.validationMessage);
    var max = parseInt(u.getAttribute('data-max-length'), 10);
    if (max && graphemes(u.value) > max) return a(u, 'too-long', 'Shorten ' + labelOf(u).toLowerCase() + ' to ' + max + ' characters or fewer');
    return '';
  }
  function rootOf(u) {
    if (u.tagName === 'FIELDSET') return u;
    return u.closest('.ds-text-field, .ds-text-area, .ds-select') || (u.type === 'checkbox' && u.closest('.ds-checkbox')) || u.parentElement;
  }
  function describe(el, id, on) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
    if (on) ids.unshift(id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  }
  function errorEl(u, create) {
    var root = rootOf(u), block = blockOf(root) || 'ds-text-field';
    var cls = ERR[block];
    var holder = block === 'ds-checkbox' ? root.parentElement : root;
    var e = null;
    for (var n = holder.firstElementChild; n; n = n.nextElementSibling) if (n.classList.contains(cls) && (block !== 'ds-checkbox' || n.previousElementSibling === root)) e = n;
    if (!e && create) {
      e = document.createElement('p');
      e.className = cls;
      e.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span></span>';
      var after = block === 'ds-checkbox' ? root : (root.querySelector(':scope > .ds-text-field__group, :scope > .ds-select__group, :scope > textarea') || null);
      if (after) after.insertAdjacentElement('afterend', e); else root.appendChild(e);
    }
    if (e) e.id = e.id || ensureId(u, 'f') + '-error';
    return e;
  }
  function setError(u, m) {
    var e = errorEl(u, true);
    e.querySelector('span').textContent = m;
    e.hidden = false;
    describe(u, e.id, true);
    if (u.classList.contains('ds-checkbox-group')) u.setAttribute('data-invalid', ''); else u.setAttribute('aria-invalid', 'true');
  }
  function clearError(u) {
    var e = errorEl(u, false);
    if (e) { e.hidden = true; describe(u, e.id, false); }
    u.removeAttribute('aria-invalid');
    u.removeAttribute('data-invalid');
  }
  function isInvalid(u) { return u.getAttribute('aria-invalid') === 'true' || u.hasAttribute('data-invalid'); }
  function unitOf(c) { return (c.type === 'radio' && c.closest('fieldset')) || (c.type === 'checkbox' && c.closest('fieldset.ds-checkbox-group[data-required]')) || c; }

  // ErrorSummary in the alert slot: one item per field, in field order
  var originalTitle = document.title;
  function renderSummary(list) {
    if (!slot) return;
    var s = slot.querySelector('.ds-error-summary');
    if (!s) {
      slot.innerHTML = '';
      s = document.createElement('section');
      s.className = 'ds-error-summary';
      if (variant === 'embedded') s.setAttribute('data-variant', 'embedded');
      s.tabIndex = -1;
      s.setAttribute('data-ds-focus-target', '');
      s.setAttribute('data-ds-module', 'error-summary');
      var tid = ensureId(s, 'summary') + '-title';
      s.setAttribute('aria-labelledby', tid);
      s.innerHTML = '<div class="ds-error-summary__header"><svg class="ds-icon ds-error-summary__icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><h2 class="ds-error-summary__title" id="' + tid + '"></h2></div><ul class="ds-error-summary__list"></ul>';
      slot.appendChild(s);
    }
    s.removeAttribute('aria-busy');
    s.querySelector('.ds-error-summary__title').textContent = plural(list.length, a(null, 'summary-one', 'There is # problem'), a(null, 'summary-other', 'There are # problems'));
    var ul = s.querySelector('.ds-error-summary__list');
    ul.innerHTML = '';
    list.forEach(function (x) {
      var li = document.createElement('li'), link = document.createElement('a');
      link.className = 'ds-error-summary__link';
      link.href = '#' + ensureId(x.u, 'f');
      link.textContent = labelOf(x.u) + ': ' + x.m;
      li.appendChild(link);
      ul.appendChild(li);
    });
    DS.init(slot);
  }
  function removeSummary() {
    var s = slot && slot.querySelector('.ds-error-summary');
    if (s) s.remove();
    if (variant === 'page') document.title = originalTitle;
  }
  function focusUnit(u) {
    if (DS.focusField && DS.focusField(ensureId(u, 'f'))) return;
    var t = u.tagName === 'FIELDSET' ? (u.querySelector('input:checked') || u.querySelector('input')) : u;
    if (t) t.focus();
  }

  // submit
  var submitter = null;
  form.addEventListener('click', function (e) { var b = e.target.closest('button[type="submit"], button:not([type])'); if (b) submitter = b; });
  form.addEventListener('submit', function (e) {
    if (form.getAttribute('aria-busy') === 'true') { e.preventDefault(); return; } // double submit ignored
    var btn = submitter || form.querySelector('button[type="submit"]');
    if (btn && btn.getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    var errors = [];
    entries().forEach(function (u) { var m = validate(u); if (m) { setError(u, m); errors.push({ u: u, m: m }); } else clearError(u); });
    if (errors.length) {
      e.preventDefault();
      renderSummary(errors);
      if (variant === 'page') document.title = a(null, 'title-prefix', 'Error: ') + originalTitle;
      focusUnit(errors[0].u);
      DS.announce(plural(errors.length, a(null, 'count-one', '# error.'), a(null, 'count-other', '# errors.')) + ' ' + labelOf(errors[0].u) + ': ' + errors[0].m, 'assertive');
      form.dispatchEvent(new CustomEvent('ds:form-invalid', { bubbles: true, detail: { count: errors.length } }));
      return;
    }
    removeSummary();
    dirty = false;
    form.setAttribute('aria-busy', 'true');
    if (btn) btn.setAttribute('aria-busy', 'true');
    if (form.hasAttribute('data-ds-preview')) {
      e.preventDefault();
      setTimeout(function () {
        form.removeAttribute('aria-busy');
        if (btn) btn.removeAttribute('aria-busy');
        DS.announce(a(null, 'success', 'Submitted'), 'polite');
      }, 900);
    }
  });

  // inline validation: on blur after a change, and live while fixing a field that already shows an error
  var before = new WeakMap();
  form.addEventListener('focusin', function (e) { var u = unitOf(e.target); if (u) before.set(u, serialize(u)); });
  form.addEventListener('focusout', function (e) {
    var u = unitOf(e.target);
    if (!u || u.tagName === 'FIELDSET' || !before.has(u) || before.get(u) === serialize(u)) return;
    var m = validate(u);
    if (m) setError(u, m); else clearError(u);
  });
  var dirty = false;
  var onChange = function (e) {
    var t = e.target;
    if (!t.matches || !t.matches('input, select, textarea')) return;
    dirty = true;
    var u = unitOf(t);
    if (isInvalid(u) && !validate(u)) clearError(u); // errors disappear as soon as the value is right
  };
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
  function serialize(u) { return u.tagName === 'FIELDSET' ? Array.prototype.map.call(u.querySelectorAll('input:checked'), function (i) { return i.value; }).join(',') : (u.type === 'checkbox' ? String(u.checked) : u.value); }

  // dirty guards
  window.addEventListener('beforeunload', function (e) { if (dirty && variant === 'page' && form.getAttribute('data-confirm-discard') !== 'false') { e.preventDefault(); e.returnValue = ''; } });
  var confirmBox = form.querySelector('.ds-form__confirm');
  var returnTo = null;
  function askDiscard() {
    if (!confirmBox) { form.reset(); dirty = false; return; }
    returnTo = document.activeElement;
    confirmBox.hidden = false;
    var keep = confirmBox.querySelector('[data-ds-keep]');
    if (keep) keep.focus();
  }
  function closeConfirm(discard) {
    confirmBox.hidden = true;
    if (discard) { form.reset(); dirty = false; entries().forEach(clearError); removeSummary(); form.dispatchEvent(new CustomEvent('ds:form-discard', { bubbles: true })); }
    else if (returnTo && returnTo.focus) returnTo.focus();
  }
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (confirmBox && !confirmBox.hidden) { e.preventDefault(); closeConfirm(false); return; } // Esc again = Keep editing
    if (variant === 'inline-edit') { e.preventDefault(); form.reset(); dirty = false; form.dispatchEvent(new CustomEvent('ds:form-cancel', { bubbles: true })); return; }
    if (variant === 'embedded' && dirty) { e.preventDefault(); e.stopPropagation(); askDiscard(); }
  });
  form.addEventListener('click', function (e) {
    var t = e.target.closest('[data-ds-cancel], [data-ds-keep], [data-ds-discard]');
    if (!t) return;
    if (t.hasAttribute('data-ds-keep')) closeConfirm(false);
    else if (t.hasAttribute('data-ds-discard')) closeConfirm(true);
    else if (dirty) askDiscard();
    else if (variant === 'inline-edit') { form.reset(); form.dispatchEvent(new CustomEvent('ds:form-cancel', { bubbles: true })); }
  });
});
