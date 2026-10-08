/* Stepper · engine 1.8.0 reference module (catalog/components/Stepper.json). Progressive enhancement only (§6.4):
   without JS the Stepper is a static list (aria-current="step"); visitable steps are links to the step page and the phone
   compact summary is a native details/summary.
   Adds (reference router stand-in for in-page hrefs): opening a visitable step moves aria-current="step" and the hidden status
   texts, keeps the data of other steps (nothing is cleared, SC 3.3.7), moves focus to the step heading (tabindex −1,
   [data-controls] → .ds-stepper__heading), announces "Step n of N: label" politely, updates the document title and closes the
   phone summary; blocked steps (aria-disabled) announce their reason. */
(function () {
  var DS = (window.DS = window.DS || {});
  DS.register('stepper', function (root) {
    var steps = Array.prototype.slice.call(root.querySelectorAll('.ds-stepper__step'));
    if (steps.length < 2) return;
    var words = { complete: root.getAttribute('data-text-complete') || 'completed', current: root.getAttribute('data-text-current') || 'current step', upcoming: root.getAttribute('data-text-upcoming') || 'not started' };
    var baseTitle = document.title;
    function labelOf(step) { var l = step.querySelector('[data-name]') || step.querySelector('.ds-stepper__label'); return l ? l.textContent.trim() : ''; }
    function setStatusText(step, status) { var s = step.querySelector('[data-status-text]'); if (s && words[status]) s.textContent = ', ' + words[status]; }

    root.addEventListener('click', function (e) {
      var t = e.target.closest('a.ds-stepper__target');
      if (!t || !root.contains(t)) return;
      if (t.getAttribute('aria-disabled') === 'true') {
        e.preventDefault();
        var ids = (t.getAttribute('aria-describedby') || '').split(/\s+/);
        var r = ids.map(function (id) { var n = id && document.getElementById(id); return n ? n.textContent.trim() : ''; }).join(' ').trim();
        if (r && DS.announce) DS.announce(r, 'polite');
        return;
      }
      var href = t.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return; // real navigation: the destination page renders the Stepper
      e.preventDefault();
      var step = t.closest('.ds-stepper__step'), idx = steps.indexOf(step);
      var cur = root.querySelector('.ds-stepper__step[data-status="current"]');
      if (cur && cur !== step) {
        // the step being left keeps its data: it reads "completed" when it was finished, otherwise stays visitable
        var leftDone = cur.hasAttribute('data-done');
        cur.setAttribute('data-status', leftDone ? 'complete' : 'upcoming');
        setStatusText(cur, leftDone ? 'complete' : 'upcoming');
        var curTarget = cur.querySelector('.ds-stepper__target');
        if (curTarget) curTarget.removeAttribute('aria-current');
        if (curTarget && curTarget.tagName === 'SPAN' && cur.getAttribute('data-href')) {
          var a = document.createElement('a');
          a.className = curTarget.className; a.href = cur.getAttribute('data-href'); a.innerHTML = curTarget.innerHTML;
          curTarget.replaceWith(a);
        }
      }
      if (!step.hasAttribute('data-href')) step.setAttribute('data-href', href);
      step.setAttribute('data-status', 'current');
      setStatusText(step, 'current');
      var span = document.createElement('span');
      span.className = t.className; span.innerHTML = t.innerHTML; span.setAttribute('aria-current', 'step');
      t.replaceWith(span);
      var text = (root.getAttribute('data-text-step') || 'Step {n} of {total}').replace('{n}', idx + 1).replace('{total}', steps.length) + ': ' + labelOf(step);
      var compact = root.querySelector('.ds-stepper__compact');
      if (compact) {
        compact.open = false;
        var sumText = compact.querySelector('[data-summary-text]');
        if (sumText) sumText.textContent = text.replace(': ', ' · ');
        var bar = compact.querySelector('.ds-stepper__progress');
        if (bar) bar.style.setProperty('--ds-progress', Math.round(((idx + 1) / steps.length) * 100) + '%');
      }
      var region = document.getElementById(root.getAttribute('data-controls') || '');
      var h = region && region.querySelector('.ds-stepper__heading');
      if (h) { h.textContent = labelOf(step); h.setAttribute('tabindex', '-1'); h.focus(); }
      if (DS.announce) DS.announce(text, 'polite');
      if (root.hasAttribute('data-update-title')) document.title = labelOf(step) + ' · ' + text.split(':')[0] + ' · ' + baseTitle;
      root.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: step.getAttribute('data-value') || href }));
    });
  });
})();
