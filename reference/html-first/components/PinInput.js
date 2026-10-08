/* PinInput: keeps only digits, caps the length, announces when complete; never clears without a user action. */
DS.register('pin-input', function (el) {
  var input = el.querySelector('.ds-pin-input__field');
  if (!input) return;
  var len = parseInt(input.getAttribute('maxlength') || '6', 10);
  input.addEventListener('input', function () {
    var v = input.value.replace(/\D/g, '').slice(0, len);
    if (v !== input.value) input.value = v;
    if (v.length === len) DS.announce((el.getAttribute('data-complete-text') || 'Code complete'), 'polite');
  });
});
