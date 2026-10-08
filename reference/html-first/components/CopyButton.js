/* CopyButton · engine 1.8.0 reference module (catalog/components/CopyButton.json). Progressive enhancement only (§6.4):
   without JS the value stays visible and selectable next to the button (the manual path always exists).
   Markup: button.ds-copy-button[data-ds-module="copy-button"] with one source:
     data-ds-copy-from="<id>" (input/textarea value or element text; .ds-vh and bidi control characters are never copied),
     data-ds-copy-text="<raw value>" (e.g. digits without display grouping), or button.__dsCopySource = () => string | Promise<string>.
   Optional: data-ds-success="Link copied" (label + announcement), data-feedback-duration (ms, default 2000),
   data-ds-hint="<id>" (fallback hint element), data-sensitive (value never announced, which is the default anyway).
   - success: check icon + success label, polite announcement, focus stays; pressing again copies and announces again.
   - denied / unsupported: the source text is selected, the hint (with the OS shortcut, ⌘C on Apple) is shown and announced politely.
   - async source: copy happens in the same activation (ClipboardItem with a Promise); spinner + aria-busy meanwhile.
   - blocked (aria-disabled): announces the reason, copies nothing. Event: ds:copyresult { status: success | denied | unsupported }. */
(function () {
  var DS = (window.DS = window.DS || {});
  var BIDI = /[‎‏‪-‮⁦-⁩]/g;
  function announce(m) { if (m && DS.announce) DS.announce(m, 'polite'); }
  function reasonOf(el) {
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n && n.textContent.trim()) return n.textContent.replace(/\s+/g, ' ').trim(); }
    return '';
  }
  function sourceEl(btn) { return document.getElementById(btn.getAttribute('data-ds-copy-from') || ''); }
  function textOf(el) {
    if (!el) return '';
    if (el.matches('input, textarea')) return el.value;
    var c = el.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('.ds-vh, [aria-hidden="true"]'), function (n) { n.remove(); });
    return c.textContent;
  }
  function selectSource(btn) {
    var el = sourceEl(btn);
    if (!el) return;
    if (el.matches('input, textarea')) { el.focus(); el.select(); return; }
    var r = document.createRange(); r.selectNodeContents(el);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  function busy(btn, on) {
    var spin = btn.querySelector('.ds-button__spinner, .ds-icon-button__spinner');
    if (on) {
      btn.setAttribute('aria-busy', 'true');
      if (!spin) { spin = document.createElement('span'); spin.className = btn.classList.contains('ds-icon-button') ? 'ds-icon-button__spinner' : 'ds-button__spinner'; spin.setAttribute('aria-hidden', 'true'); btn.appendChild(spin); }
    } else { btn.removeAttribute('aria-busy'); if (spin && !spin.hasAttribute('data-static')) spin.remove(); }
  }
  function writeText(value) {
    if (!navigator.clipboard || !navigator.clipboard.writeText || !window.isSecureContext) return Promise.reject(new Error('unsupported'));
    return navigator.clipboard.writeText(value);
  }
  function writeAsync(promise) {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      // the write starts inside the user activation; the value resolves later
      var item = new ClipboardItem({ 'text/plain': promise.then(function (t) { return new Blob([String(t).replace(BIDI, '')], { type: 'text/plain' }); }) });
      return navigator.clipboard.write([item]);
    }
    return promise.then(function (t) { return writeText(String(t).replace(BIDI, '')); });
  }

  DS.register('copy-button', function (btn) {
    var timer = 0;
    var successLabel = btn.getAttribute('data-ds-success') || 'Copied';
    var hint = document.getElementById(btn.getAttribute('data-ds-hint') || '');
    var tipText = null;
    function setState(s) {
      clearTimeout(timer);
      if (s) btn.setAttribute('data-state', s); else btn.removeAttribute('data-state');
      var tip = btn.__dsTooltip;
      if (tip) { if (tipText === null) tipText = tip.textContent; tip.textContent = s === 'success' ? successLabel : tipText; }
    }
    function done(status) {
      busy(btn, false);
      btn.dispatchEvent(new CustomEvent('ds:copyresult', { bubbles: true, detail: { status: status } }));
      if (status === 'success') {
        if (hint) hint.hidden = true;
        setState('success');
        announce(successLabel); // identical messages are re-announced (LiveAnnouncer clears first)
        timer = setTimeout(function () { setState(null); }, parseInt(btn.getAttribute('data-feedback-duration') || '2000', 10));
        return;
      }
      setState('error');
      selectSource(btn);
      if (hint) {
        var k = hint.querySelector('.ds-kbd[data-keys]');
        if (k && DS.kbd) DS.kbd.render(k);
        hint.hidden = false;
        announce(hint.textContent.replace(/\s+/g, ' ').trim());
      }
    }
    btn.addEventListener('click', function (e) {
      if (btn.getAttribute('aria-busy') === 'true') { e.preventDefault(); return; }
      if (btn.getAttribute('aria-disabled') === 'true') { e.preventDefault(); announce(reasonOf(btn)); return; }
      var p;
      var simulate = btn.getAttribute('data-ds-copy-simulate'); // reference demo only: "denied" exercises the fallback path
      if (simulate === 'denied') p = Promise.reject(new Error('denied'));
      else if (btn.__dsCopySource) {
        var v = btn.__dsCopySource();
        if (v && typeof v.then === 'function') { busy(btn, true); p = writeAsync(v); }
        else p = writeText(String(v).replace(BIDI, ''));
      } else if (btn.hasAttribute('data-ds-copy-delay')) { // reference demo: value fetched asynchronously
        var raw = btn.getAttribute('data-ds-copy-text') || '';
        busy(btn, true);
        p = writeAsync(new Promise(function (res) { setTimeout(function () { res(raw); }, parseInt(btn.getAttribute('data-ds-copy-delay'), 10) || 600); }));
      } else {
        var text = btn.hasAttribute('data-ds-copy-text') ? btn.getAttribute('data-ds-copy-text') : textOf(sourceEl(btn));
        p = writeText(text.replace(BIDI, ''));
      }
      p.then(function () { done('success'); }, function (err) { done(err && /unsupported/.test(err.message) ? 'unsupported' : 'denied'); });
    });
  });
})();
