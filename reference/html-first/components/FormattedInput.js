/* FormattedInput: formats on input with a mask like "#### #### #### ####" while keeping the caret stable,
   normalises pasted values, and mirrors digits-only into the hidden raw input (name moves there when JS runs). */
DS.register('formatted-input', function (el) {
  var input = el.querySelector('.ds-text-field__input');
  var raw = el.querySelector('.ds-formatted-input__raw-value');
  var mask = el.getAttribute('data-mask') || '';
  if (!input || !mask) return;
  if (raw && input.name) { raw.name = input.name; input.removeAttribute('name'); }
  var slots = mask.split('').filter(function (c) { return c === '#'; }).length;
  function digits(s) { return (s || '').replace(/\D/g, '').slice(0, slots); }
  function format(d) {
    var out = '', i = 0;
    for (var k = 0; k < mask.length && i < d.length; k++) out += mask[k] === '#' ? d[i++] : mask[k];
    return out;
  }
  function apply() {
    var pos = input.selectionStart || 0;
    var before = digits(input.value.slice(0, pos)).length;
    var d = digits(input.value);
    input.value = format(d);
    if (raw) raw.value = d;
    var p = 0, seen = 0;
    while (p < input.value.length && seen < before) { if (/\d/.test(input.value[p])) seen++; p++; }
    if (document.activeElement === input) input.setSelectionRange(p, p);
  }
  input.addEventListener('input', apply);
  apply();
});
