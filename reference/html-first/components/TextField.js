/* TextField · progressive enhancement only (§6.4). Native input, label, autocomplete and constraint validation work without JS.
   Adds: the labelled "Clear" IconButton (data-clearable), polite "Cleared" announcement, keeps blocked fields unchanged.
   Inline validation and ErrorSummary are owned by Form.js. Strings come from data-* attributes (glossary), with en-US fallbacks. */
DS.register('text-field', function (el) {
  var input = el.querySelector('.ds-text-field__input');
  if (!input) return;
  var blocked = input.getAttribute('aria-disabled') === 'true';
  if (el.hasAttribute('data-clearable') && !blocked && !input.readOnly) {
    var group = input.parentNode;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ds-text-field__clear';
    btn.setAttribute('aria-label', el.getAttribute('data-clear-label') || 'Clear');
    btn.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-close"/></svg>';
    group.appendChild(btn);
    var sync = function () { btn.hidden = !input.value; };
    input.addEventListener('input', sync);
    sync();
    btn.addEventListener('click', function () {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      DS.announce(el.getAttribute('data-cleared-text') || 'Cleared', 'polite');
    });
  }
  // paste is never blocked (SC 3.3.8); email/url values are trimmed on blur only
  if (/^(email|url)$/.test(input.type)) {
    input.addEventListener('blur', function () {
      var v = input.value.trim().replace(/^mailto:/i, '');
      if (v !== input.value) { input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); }
    });
  }
});
