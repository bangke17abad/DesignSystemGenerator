/* Combobox (APG pattern: editable combobox with list autocomplete). Enhances <input list>: removes the datalist, renders a
   listbox, keeps DOM focus on the input and moves aria-activedescendant. Result count is announced politely (debounced). */
DS.register('combobox', function (el) {
  var input = el.querySelector('.ds-text-field__input');
  var list = el.querySelector('datalist');
  if (!input || !list) return;
  var options = [].map.call(list.options, function (o) { return { value: o.value, label: o.label || o.value, disabled: o.disabled }; });
  var id = input.id + '-listbox';
  var lb = document.createElement('ul');
  lb.className = 'ds-combobox__listbox'; lb.id = id; lb.setAttribute('role', 'listbox'); lb.hidden = true;
  lb.setAttribute('aria-label', el.querySelector('.ds-text-field__label').textContent);
  el.querySelector('.ds-text-field__group').after(lb);
  input.removeAttribute('list'); list.remove();
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', id);
  var toggle = el.querySelector('.ds-combobox__toggle');
  var active = -1, shown = [], timer;
  function render() {
    var q = input.value.trim().toLowerCase();
    shown = options.filter(function (o) { return !q || o.label.toLowerCase().indexOf(q) >= 0; });
    lb.innerHTML = shown.length ? shown.map(function (o, i) {
      return '<li role="option" id="' + id + '-' + i + '" class="ds-combobox__option" aria-selected="' + (o.value === input.value) + '"' + (o.disabled ? ' aria-disabled="true"' : '') + '><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-check"/></svg><span></span></li>';
    }).join('') : '<li class="ds-combobox__empty">' + (el.getAttribute('data-empty-text') || 'No matches') + '</li>';
    // an empty listbox breaks the required-children rule: the no-results message is a status, not a listbox
    if (shown.length) lb.setAttribute('role', 'listbox'); else lb.removeAttribute('role');
    lb.querySelectorAll('.ds-combobox__option span').forEach(function (s, i) { s.textContent = shown[i].label; });
    clearTimeout(timer);
    timer = setTimeout(function () { DS.announce((el.getAttribute('data-count-text') || '{n} results').replace('{n}', shown.length), 'polite'); }, 500);
  }
  function open() { render(); lb.hidden = false; el.setAttribute('data-open', ''); input.setAttribute('aria-expanded', 'true'); }
  function close() { lb.hidden = true; el.removeAttribute('data-open'); input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
  function move(d) {
    if (lb.hidden) open();
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    lb.querySelectorAll('.ds-combobox__option').forEach(function (o, i) { if (i === active) { o.setAttribute('data-active', ''); o.scrollIntoView({ block: 'nearest' }); } else o.removeAttribute('data-active'); });
    input.setAttribute('aria-activedescendant', id + '-' + active);
  }
  function choose(i) { var o = shown[i]; if (!o || o.disabled) return; input.value = o.value; close(); input.dispatchEvent(new Event('change', { bubbles: true })); }
  input.addEventListener('input', open);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter' && !lb.hidden && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { if (!lb.hidden) { e.preventDefault(); close(); } else input.value = ''; }
    else if (e.key === 'Tab') close();
  });
  lb.addEventListener('mousedown', function (e) { e.preventDefault(); });
  lb.addEventListener('click', function (e) { var li = e.target.closest('.ds-combobox__option'); if (li) choose([].indexOf.call(lb.children, li)); });
  if (toggle) toggle.addEventListener('click', function () { if (lb.hidden) { open(); input.focus(); } else close(); });
  input.addEventListener('blur', function () { setTimeout(close, 0); });
});
