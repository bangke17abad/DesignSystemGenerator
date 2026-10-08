/* Select · progressive enhancement only (§6.4). The native <select> submits, validates and opens the OS picker without JS.
   Adds: (1) blocked selects (aria-disabled) never open or change, and the reason is announced; (2) data-variant="custom": a
   select-only combobox (APG) built from the same <select>, which keeps the value for form submission and serves phones.
   Value changes never navigate or submit (SC 3.2.2). data-default-open renders the list open (docs previews). */
DS.register('select', function (el) {
  var select = el.querySelector('select.ds-select__input');
  if (!select) return;
  var reasonText = function () {
    var ids = (select.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var r = ids[i] && document.getElementById(ids[i]); if (r && /__reason/.test(r.className)) return r.textContent.trim(); }
    return '';
  };
  var isBlocked = function () { return select.getAttribute('aria-disabled') === 'true'; };
  // (1) blocked native select: keep focusable, stop opening and value changes
  var locked = select.value;
  select.addEventListener('mousedown', function (e) { if (isBlocked()) { e.preventDefault(); DS.announce(reasonText(), 'polite'); } });
  select.addEventListener('keydown', function (e) {
    if (isBlocked() && e.key !== 'Tab' && e.key !== 'Shift') { e.preventDefault(); if (/^( |Enter|ArrowDown|ArrowUp)$/.test(e.key)) DS.announce(reasonText(), 'polite'); }
  });
  select.addEventListener('focus', function () { locked = select.value; });
  select.addEventListener('change', function (e) { if (isBlocked()) { select.value = locked; e.stopImmediatePropagation(); } });

  if (el.getAttribute('data-variant') !== 'custom') return;

  // (2) custom variant
  var id = select.id || ('ds-select-' + Math.random().toString(36).slice(2, 8));
  select.id = id;
  var label = el.querySelector('.ds-select__label');
  if (label && !label.id) label.id = id + '-label';
  var trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ds-select__trigger';
  trigger.id = id + '-trigger';
  trigger.setAttribute('role', 'combobox');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', id + '-listbox');
  if (label) trigger.setAttribute('aria-labelledby', label.id);
  ['aria-describedby', 'aria-invalid', 'aria-required', 'aria-disabled', 'aria-busy', 'data-force'].forEach(function (a) { if (select.hasAttribute(a)) trigger.setAttribute(a, select.getAttribute(a)); });
  if (select.required) trigger.setAttribute('aria-required', 'true');
  var valueEl = document.createElement('span');
  valueEl.className = 'ds-select__value';
  trigger.appendChild(valueEl);
  select.insertAdjacentElement('afterend', trigger);
  select.__dsFocusProxy = trigger; // ErrorSummary/Form move focus here while the native select is hidden

  var list = document.createElement('div');
  list.className = 'ds-select__listbox';
  list.id = id + '-listbox';
  list.setAttribute('role', 'listbox');
  if (label) list.setAttribute('aria-labelledby', label.id);
  list.hidden = true;
  var opts = [];
  var placeholder = '';
  var addOption = function (o, parent) {
    if (o.value === '') { placeholder = o.textContent.trim(); return; }
    var row = document.createElement('div');
    row.className = 'ds-select__option';
    row.id = id + '-opt-' + opts.length;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');
    var unavailable = o.hasAttribute('data-unavailable');
    if (unavailable) row.setAttribute('aria-disabled', 'true');
    var desc = o.getAttribute('data-reason') || o.getAttribute('data-description');
    row.innerHTML = '<svg class="ds-icon ds-select__option-check" aria-hidden="true"><use href="#ds-i-check"/></svg><span class="ds-select__option-text"><span></span>' + (desc ? '<span class="ds-select__option-description"></span>' : '') + '</span>';
    row.querySelector('.ds-select__option-text > span').textContent = o.getAttribute('data-label') || o.textContent.trim();
    if (desc) row.querySelector('.ds-select__option-description').textContent = desc;
    if (o.getAttribute('data-force')) row.setAttribute('data-force', o.getAttribute('data-force'));
    row.__opt = o;
    parent.appendChild(row);
    opts.push(row);
  };
  Array.prototype.forEach.call(select.children, function (c, gi) {
    if (c.tagName === 'OPTGROUP') {
      var g = document.createElement('div');
      g.setAttribute('role', 'group');
      var gl = document.createElement('div');
      gl.className = 'ds-select__group-label';
      gl.id = id + '-group-' + gi;
      gl.setAttribute('role', 'presentation');
      gl.textContent = c.label;
      g.setAttribute('aria-labelledby', gl.id);
      g.appendChild(gl);
      Array.prototype.forEach.call(c.children, function (o) { addOption(o, g); });
      list.appendChild(g);
    } else addOption(c, list);
  });
  if (!opts.length) {
    var empty = document.createElement('div');
    empty.className = 'ds-select__empty';
    empty.setAttribute('role', 'option');
    empty.setAttribute('aria-disabled', 'true');
    empty.setAttribute('aria-selected', 'false');
    empty.textContent = el.getAttribute('data-empty-text') || 'No options available';
    list.appendChild(empty);
  }
  var chevron = el.querySelector('.ds-select__chevron, .ds-select__spinner');
  (chevron || trigger).insertAdjacentElement('afterend', list);
  el.setAttribute('data-enhanced', '');
  if (label) label.addEventListener('click', function (e) { if (getComputedStyle(select).display === 'none') { e.preventDefault(); trigger.focus(); } });

  var active = -1;
  var render = function () {
    var sel = select.selectedOptions[0];
    var hasValue = sel && sel.value !== '';
    valueEl.textContent = hasValue ? (sel.getAttribute('data-label') || sel.textContent.trim()) : (placeholder || ' ');
    valueEl.toggleAttribute('data-placeholder', !hasValue);
    opts.forEach(function (r) { r.setAttribute('aria-selected', String(r.__opt === sel)); });
  };
  var setActive = function (i) {
    if (active >= 0 && opts[active]) opts[active].removeAttribute('data-active');
    active = i;
    if (i < 0 || !opts[i]) { trigger.removeAttribute('aria-activedescendant'); return; }
    opts[i].setAttribute('data-active', '');
    trigger.setAttribute('aria-activedescendant', opts[i].id);
    var r = opts[i], lb = list;
    if (r.offsetTop < lb.scrollTop) lb.scrollTop = r.offsetTop; else if (r.offsetTop + r.offsetHeight > lb.scrollTop + lb.clientHeight) lb.scrollTop = r.offsetTop + r.offsetHeight - lb.clientHeight;
  };
  var isOpen = function () { return trigger.getAttribute('aria-expanded') === 'true'; };
  var open = function () {
    if (trigger.getAttribute('aria-disabled') === 'true') { DS.announce(reasonText(), 'polite'); return; }
    if (trigger.getAttribute('aria-busy') === 'true') return; // options still loading: nothing can be chosen
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    var cur = -1;
    opts.forEach(function (r, i) { if (r.getAttribute('aria-selected') === 'true') cur = i; });
    opts.forEach(function (r, i) { if (r.__opt.hasAttribute('data-default-active') && !el.__dsOpened) cur = i; });
    el.__dsOpened = true;
    setActive(cur >= 0 ? cur : 0);
  };
  var close = function () { list.hidden = true; trigger.setAttribute('aria-expanded', 'false'); setActive(-1); };
  var choose = function (i) {
    var r = opts[i];
    if (!r || r.getAttribute('aria-disabled') === 'true') return false;
    if (select.value !== r.__opt.value) {
      select.value = r.__opt.value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    render();
    return true;
  };
  select.addEventListener('change', render);
  trigger.addEventListener('click', function () { if (isOpen()) close(); else open(); });
  list.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep DOM focus on the trigger
  list.addEventListener('click', function (e) {
    var r = e.target.closest('[role="option"]');
    if (!r) return;
    if (choose(opts.indexOf(r))) { close(); trigger.focus(); }
  });
  document.addEventListener('pointerdown', function (e) { if (isOpen() && !el.contains(e.target)) close(); });
  var typed = '', typedAt = 0;
  var typeaheadMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--timing-typeahead')) || 500;
  trigger.addEventListener('keydown', function (e) {
    var k = e.key, n = opts.length;
    if (!isOpen()) {
      if (/^(ArrowDown|ArrowUp|Enter| )$/.test(k) || (k === 'ArrowDown' && e.altKey)) { e.preventDefault(); open(); }
      return;
    }
    if (k === 'Escape') { e.preventDefault(); close(); return; }
    if (k === 'Tab') { if (!el.hasAttribute('data-default-open')) { choose(active); close(); } return; } // previews stay open
    if (k === 'Enter' || k === ' ') { e.preventDefault(); if (choose(active)) close(); return; }
    var next = { ArrowDown: Math.min(active + 1, n - 1), ArrowUp: Math.max(active - 1, 0), Home: 0, End: n - 1, PageDown: Math.min(active + 10, n - 1), PageUp: Math.max(active - 10, 0) }[k];
    if (next !== undefined) { e.preventDefault(); setActive(next); return; }
    if (k.length === 1 && /\S/.test(k)) {
      var now = Date.now();
      typed = (now - typedAt > typeaheadMs ? '' : typed) + k.toLowerCase();
      typedAt = now;
      for (var j = 1; j <= n; j++) {
        var idx = (active + (typed.length > 1 ? j - 1 : j)) % n;
        if (opts[idx].textContent.trim().toLowerCase().indexOf(typed) === 0) { setActive(idx); break; }
      }
    }
  });
  render();
  if (el.hasAttribute('data-default-open')) open();
});
