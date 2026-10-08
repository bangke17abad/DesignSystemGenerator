/* PasswordInput · progressive enhancement only (§6.4). Without JS: input type="password" with the right autocomplete, rules visible.
   Adds: Show/Hide toggle (label changes "Show password"/"Hide password", no aria-pressed, caret and selection kept, "Password
   shown/hidden" polite, focus stays on the toggle), field masked again on submit (password managers save it as a password),
   rules marked met while typing (icon + hidden "met") and unmet only on blur/submit, strength word + segments, Caps Lock note
   (polite once). Paste/drop are never blocked. Strings from data-* (glossary) with en-US fallbacks. */
DS.register('password-input', function (el) {
  var input = el.querySelector('.ds-password-input__input');
  if (!input) return;
  var t = function (k, d) { return el.getAttribute('data-' + k) || d; };
  var toggle = el.querySelector('.ds-password-input__toggle');
  var blocked = input.getAttribute('aria-disabled') === 'true';
  var revealed = false;

  var setReveal = function (on, announce) {
    revealed = on;
    var s = input.selectionStart, e = input.selectionEnd, dir = input.selectionDirection;
    input.type = on ? 'text' : 'password';
    try { if (s !== null) input.setSelectionRange(s, e, dir); } catch (x) { /* not focused */ }
    el.toggleAttribute('data-revealed', on);
    if (toggle) toggle.setAttribute('aria-label', on ? t('hide-label', 'Hide password') : t('show-label', 'Show password'));
    if (announce) DS.announce(on ? t('shown-text', 'Password shown') : t('hidden-text', 'Password hidden'), 'polite');
  };
  if (toggle && !blocked) {
    toggle.type = 'button';
    if (input.id) toggle.setAttribute('aria-controls', input.id);
    toggle.addEventListener('mousedown', function (e) { if (document.activeElement === input) e.preventDefault(); }); // caret stays put
    toggle.addEventListener('click', function () { setReveal(!revealed, true); });
    el.setAttribute('data-enhanced', '');
    setReveal(el.hasAttribute('data-default-revealed'), false);
  }
  if (input.form) input.form.addEventListener('submit', function () { if (revealed) setReveal(false, false); });

  // rules
  var rules = Array.prototype.slice.call(el.querySelectorAll('.ds-password-input__rule[data-rule]'));
  var test = function (r, v) {
    var min = r.getAttribute('data-min');
    if (min) return Array.from(v).length >= parseInt(min, 10);
    var p = r.getAttribute('data-pattern');
    if (p) return new RegExp(p, 'u').test(v);
    return true;
  };
  var paint = function (r, state) {
    r.setAttribute('data-state', state);
    var st = r.querySelector('.ds-password-input__rule-status');
    if (!st) { st = document.createElement('span'); st.className = 'ds-vh ds-password-input__rule-status'; r.appendChild(st); }
    st.textContent = state === 'met' ? t('met-text', ' (met)') : state === 'unmet' ? t('unmet-text', ' (not met)') : '';
  };
  var evaluate = function (final) {
    var v = input.value, unmet = 0;
    rules.forEach(function (r) {
      var ok = test(r, v);
      if (!ok) unmet++;
      paint(r, ok ? 'met' : (final && v ? 'unmet' : (r.getAttribute('data-state') === 'unmet' ? 'unmet' : 'pending')));
    });
    return unmet;
  };

  // strength (word + segments)
  var strength = el.querySelector('.ds-password-input__strength');
  var meter = strength && strength.querySelector('.ds-password-input__meter');
  var word = strength && strength.querySelector('.ds-password-input__strength-text');
  var level = function (v) {
    if (!v) return 0;
    var n = Array.from(v).length, kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(function (re) { return re.test(v); }).length;
    var s = (n >= 12 ? 1 : 0) + (n >= 16 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
    return Math.max(1, Math.min(3, s));
  };
  var paintStrength = function () {
    if (!strength) return;
    var l = level(input.value);
    strength.hidden = !l;
    if (meter) meter.setAttribute('data-level', String(l));
    if (word && l) word.textContent = t('strength-' + l, ['', 'Strength: weak', 'Strength: fair', 'Strength: strong'][l]);
  };

  // Caps Lock
  var caps = el.querySelector('.ds-password-input__caps');
  var capsOn = false;
  var checkCaps = function (e) {
    if (!caps || !e.getModifierState) return;
    var on = e.getModifierState('CapsLock');
    if (on === capsOn) return;
    capsOn = on;
    caps.hidden = !on;
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== caps.id; });
    if (on) { ids.push(caps.id); DS.announce(caps.textContent.trim(), 'polite'); }
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  };
  input.addEventListener('keydown', checkCaps);
  input.addEventListener('keyup', checkCaps);
  input.addEventListener('input', function () { evaluate(false); paintStrength(); });
  input.addEventListener('blur', function () { if (input.value) evaluate(true); if (caps) { caps.hidden = true; capsOn = false; } });
  if (input.form) input.form.addEventListener('submit', function () { evaluate(true); });

  if (rules.length && input.value) evaluate(el.hasAttribute('data-evaluated'));
  if (!el.hasAttribute('data-ds-static-strength')) paintStrength();
});
