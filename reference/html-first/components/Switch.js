/* Switch · progressive enhancement only (§6.4). <input type="checkbox" role="switch"> toggles and submits without JS.
   Adds: blocked (aria-disabled) and read-only (aria-readonly) switches that never toggle (reason announced politely), busy
   switches that ignore input, and the optimistic server pattern: listeners of "ds:switch-change" may call
   event.detail.wait(promise); while it runs the thumb has moved, aria-busy is set and a spinner shows; on rejection the state
   rolls back, the message + Retry appear and are announced. data-simulate="fail|ok" fakes the server in previews. */
DS.register('switch', function (el) {
  var input = el.querySelector('.ds-switch__input');
  if (!input) return;
  var err = el.querySelector('.ds-switch__error');
  var msg = function (k, d) { return el.getAttribute('data-msg-' + k) || d; };
  var label = (el.querySelector('.ds-switch__label') || {}).textContent || '';
  var reason = function () {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var n = ids[i] && document.getElementById(ids[i]); if (n) return n.textContent.trim(); }
    return '';
  };
  input.addEventListener('click', function (e) {
    var a = function (n) { return input.getAttribute(n) === 'true'; };
    if (a('aria-disabled') || a('aria-readonly') || a('aria-busy')) {
      e.preventDefault();
      if (a('aria-disabled')) DS.announce(reason(), 'polite');
    }
  });
  var setError = function (on) {
    if (!err) return;
    err.hidden = !on;
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== err.id; });
    if (on) ids.unshift(err.id);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  };
  input.addEventListener('change', function () {
    var now = input.checked;
    var pending = null;
    var ev = new CustomEvent('ds:switch-change', { bubbles: true, detail: { checked: now, wait: function (p) { pending = p; } } });
    el.dispatchEvent(ev);
    var sim = el.getAttribute('data-simulate');
    if (!pending && sim) pending = new Promise(function (res, rej) { setTimeout(sim === 'fail' ? rej : res, 900); });
    if (!pending) return; // local setting: applies immediately
    setError(false);
    input.setAttribute('aria-busy', 'true');
    pending.then(function () {
      input.removeAttribute('aria-busy');
      DS.announce(label.trim() + ' ' + (now ? msg('on', 'on') : msg('off', 'off')), 'polite');
    }, function () {
      input.removeAttribute('aria-busy');
      input.checked = !now; // rollback; focus stays on the switch
      setError(true);
      DS.announce(err ? (err.querySelector('span') || err).textContent.trim() : msg('failed', 'Change not saved'), 'polite');
    });
  });
  var retry = el.querySelector('.ds-switch__retry');
  if (retry) retry.addEventListener('click', function () { input.focus(); input.click(); });
});
