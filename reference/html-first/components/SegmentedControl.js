/* SegmentedControl · engine 1.8.0 reference module (catalog/components/SegmentedControl.json). Progressive enhancement only (§6.4):
   native radios already give one Tab stop, ←/→/↑/↓ with wrap (swapped in RTL) and selection-follows-focus without JS.
   Adds: blocked segments (input[aria-disabled]) stay reachable by arrows but are never selected and announce their reason
   (native arrows would select them); Home/End; multiple (checkboxes): arrows move focus only, Space toggles;
   icon-only segments get a Tooltip (DS.tooltip) with their hidden label; ds:valuechange; sync with the phone Select fallback. */
(function () {
  var DS = (window.DS = window.DS || {});
  function reasonOf(input) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    return ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
  }
  function blocked(input) { return input.getAttribute('aria-disabled') === 'true'; }

  DS.register('segmented-control', function (root) {
    var inputs = Array.prototype.slice.call(root.querySelectorAll('.ds-segmented-control__input'));
    if (inputs.length < 2) return;
    var multiple = inputs[0].type === 'checkbox';
    var fallback = root.parentNode && root.parentNode.querySelector('.ds-segmented-control__fallback select');

    function value() {
      var on = inputs.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
      return multiple ? on : on[0];
    }
    function emit() {
      if (fallback && !multiple) fallback.value = value();
      root.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: value() }));
    }
    // multiple: one Tab stop (roving tabindex) like the single variant; arrows move it
    function rove(to) { if (multiple) inputs.forEach(function (i) { i.tabIndex = i === to ? 0 : -1; }); }
    rove(inputs.filter(function (i) { return i.checked; })[0] || inputs[0]);
    root.addEventListener('focusin', function (e) { if (inputs.indexOf(e.target) >= 0) rove(e.target); });
    function announceReason(input) { var r = reasonOf(input); if (r && DS.announce) DS.announce(r, 'polite'); }

    root.addEventListener('keydown', function (e) {
      var i = inputs.indexOf(e.target);
      if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
      var rtl = getComputedStyle(root).direction === 'rtl';
      var fwd = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
      var t = null;
      if (fwd) t = inputs[(i + fwd + inputs.length) % inputs.length]; // wraps (radio pattern)
      else if (e.key === 'Home') t = inputs[0];
      else if (e.key === 'End') t = inputs[inputs.length - 1];
      else if ((e.key === ' ' || e.key === 'Enter') && blocked(e.target)) { e.preventDefault(); announceReason(e.target); return; }
      else if (e.key === 'Enter' && !multiple && !e.target.checked) { e.preventDefault(); e.target.checked = true; emit(); return; }
      if (!t) return;
      e.preventDefault();
      t.focus();
      if (blocked(t)) { announceReason(t); return; }
      if (!multiple && !t.checked) { t.checked = true; emit(); }
    });
    root.addEventListener('click', function (e) {
      var input = e.target.closest('.ds-segmented-control__input');
      if (!input || !root.contains(input)) return;
      if (blocked(input)) { e.preventDefault(); input.focus(); announceReason(input); }
    });
    root.addEventListener('change', emit);
    if (fallback && !multiple) fallback.addEventListener('change', function () {
      inputs.forEach(function (i) { i.checked = i.value === fallback.value; });
      emit();
    });

    // icon-only segments: the hidden label stays the accessible name; the Tooltip only repeats it visually
    if (DS.tooltip) inputs.forEach(function (input) {
      var seg = input.closest('.ds-segmented-control__segment');
      if (!seg || !seg.hasAttribute('data-icon-only')) return;
      var name = seg.querySelector('.ds-vh');
      if (name) DS.tooltip.attach(input, name.textContent.trim());
    });
  });
})();
