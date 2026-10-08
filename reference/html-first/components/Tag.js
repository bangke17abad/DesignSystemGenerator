/* Tag · enhancement only. data-ds-module="tag-list" on ul.ds-tag-list (inside the editor form).
   Without JS each remove button is a submit button (name/value) of the editor form, so removal still works server side.
   With JS: the tag is removed in place, "{label} removed" is announced (polite), focus moves to the next tag's remove button,
   else the previous one, else the owner (data-owner="id": the Combobox input or the section heading).
   "ds:tagremove" (bubbles, cancelable, detail { label, value }) lets the product sync with the server; a product that calls
   preventDefault() keeps the tag with data-state="pending" until the server confirms (I6). */
DS.register('tag-list', function (list) {
  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.ds-tag__remove');
    if (!btn || !list.contains(btn)) return;
    e.preventDefault();
    if (btn.getAttribute('aria-disabled') === 'true' || btn.getAttribute('aria-busy') === 'true') return;
    var li = btn.closest('li');
    var tag = btn.closest('.ds-tag');
    var labelEl = tag && tag.querySelector('.ds-tag__label');
    var label = labelEl ? labelEl.textContent.trim() : '';
    var ev = new CustomEvent('ds:tagremove', { bubbles: true, cancelable: true, detail: { label: label, value: btn.value || label } });
    if (!list.dispatchEvent(ev)) { tag.setAttribute('data-state', 'pending'); btn.setAttribute('aria-busy', 'true'); return; }
    var items = Array.prototype.slice.call(list.querySelectorAll('.ds-tag__remove:not([aria-disabled="true"])'));
    var i = items.indexOf(btn);
    var next = items[i + 1] || items[i - 1] || null;
    if (!next) {
      var owner = list.getAttribute('data-owner') && document.getElementById(list.getAttribute('data-owner'));
      if (owner) { if (!owner.matches('a, button, input, select, textarea, [tabindex]')) owner.setAttribute('tabindex', '-1'); next = owner; }
    }
    if (next) next.focus();
    li.parentNode.removeChild(li);
    DS.announce(label + ' removed', 'polite');
  });
});
