/* StepUpDialog · engine 1.8.0 reference module (catalog/components/StepUpDialog.json). Progressive enhancement only (§6.4):
   without JS the trigger is a link to the authorization page (the form posts there).
   Module "step-up-dialog" on dialog.ds-modal.ds-step-up-dialog (opened from [data-ds-step-up-open="<id>"] with showModal):
   - focus goes to the credential field; paste and autofill are never blocked (spaces/dashes from a pasted code are removed);
   - the verify action stays aria-disabled with its visible reason until the code is complete (data-length); it never runs on
     the last digit by itself: Enter or the button runs it;
   - verifying: body aria-busy, field read-only, spinner at a locked width; Cancel stays available;
   - the app answers the cancelable "ds:verify" event via event.detail.respond({ ok, errorText, attemptsLeft }); without a
     listener the reference compares with data-ds-demo-code (previews only);
   - error: aria-invalid + message (+ remaining attempts only when data-attempts-left is set = policy known), announced
     assertively, value kept and selected; 0 attempts → locked (field + verify aria-disabled with reason; dialog closable);
   - Esc / Cancel / Close = cancel (no error announced); scrim clicks are ignored; focus returns to the trigger (or the parent
     Modal's action when nested); success closes, runs the action and announces data-ds-announce politely;
   - "Use another method" swaps the credential pane in place ([data-method]) and focuses its first control. */
(function () {
  var DS = (window.DS = window.DS || {});
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }
  function ms(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(), n = parseFloat(v);
    return isNaN(n) ? fallback : (/ms$/.test(v) ? n : (/s$/.test(v) ? n * 1000 : n));
  }

  DS.register('step-up-dialog', function (dialog) {
    if (!dialog.showModal) return;
    var trigger = null;
    var body = dialog.querySelector('.ds-modal__body');
    var verify = dialog.querySelector('[data-ds-step-up-verify]');
    var reason = dialog.querySelector('[data-ds-step-up-reason]');
    var errorBox = dialog.querySelector('.ds-step-up-dialog__error');
    var methodBtn = dialog.querySelector('.ds-step-up-dialog__method');
    var methods = dialog.querySelector('.ds-step-up-dialog__methods');
    var attemptsLeft = dialog.hasAttribute('data-attempts-left') ? parseInt(dialog.getAttribute('data-attempts-left'), 10) : null;
    var busy = false;

    function field() { var pane = dialog.querySelector('[data-method]:not([hidden])') || dialog; return pane.querySelector('.ds-step-up-dialog__input'); }
    function needed() { var f = field(); return f ? parseInt(f.getAttribute('data-length') || '0', 10) : 0; }
    function complete() { var f = field(); return !!f && f.value.length > 0 && (!needed() || f.value.length >= needed()); }
    function sync() {
      if (!verify || dialog.hasAttribute('data-locked')) return;
      var ok = complete();
      if (ok) { verify.removeAttribute('aria-disabled'); if (reason) reason.hidden = true; }
      else { verify.setAttribute('aria-disabled', 'true'); if (reason) reason.hidden = false; }
    }
    function setError(text) {
      var f = field();
      if (!errorBox) return;
      if (!text) { errorBox.hidden = true; if (f) f.removeAttribute('aria-invalid'); return; }
      var t = errorBox.querySelector('[data-text]'), a = errorBox.querySelector('.ds-step-up-dialog__attempts');
      if (t) t.textContent = text;
      if (a) {
        if (attemptsLeft === null) a.textContent = '';
        else a.textContent = ' ' + (dialog.getAttribute(attemptsLeft === 1 ? 'data-attempts-one' : 'data-attempts-many') || '{n} attempts left.').replace('{n}', attemptsLeft);
      }
      errorBox.hidden = false;
      if (f) f.setAttribute('aria-invalid', 'true');
      if (DS.announce) DS.announce(errorBox.textContent.replace(/\s+/g, ' ').trim(), 'assertive');
    }
    function lock() {
      dialog.setAttribute('data-locked', '');
      var f = field();
      if (f) { f.setAttribute('aria-disabled', 'true'); f.readOnly = true; }
      if (verify) verify.setAttribute('aria-disabled', 'true');
      if (reason) { reason.textContent = dialog.getAttribute('data-locked-reason') || 'Too many attempts. Use another method or try again later.'; reason.hidden = false; }
    }
    function open(t) {
      trigger = t || null;
      dialog.showModal();
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      setError(null);
      sync();
      var f = field();
      if (f) focusVisible(f);
      dialog.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: 'trigger' } }));
    }
    function finish(reasonCode) {
      if (busy && reasonCode !== 'authorized') { /* a cancellable request: abandon it */ busy = false; }
      dialog.close(reasonCode);
    }

    var openers = document.querySelectorAll('[data-ds-step-up-open="' + dialog.id + '"]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].setAttribute('aria-haspopup', 'dialog');
      openers[i].setAttribute('aria-expanded', 'false');
      openers[i].addEventListener('click', function (e) { e.preventDefault(); open(e.currentTarget); });
    }
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); finish('escape'); }); // Esc = Cancel
    dialog.addEventListener('click', function (e) {
      if (e.target.closest('[data-ds-step-up-cancel], .ds-modal__close')) { e.preventDefault(); finish(e.target.closest('.ds-modal__close') ? 'close-button' : 'cancel'); return; }
      // scrim clicks (::backdrop) are ignored on purpose
      if (methodBtn && e.target.closest('.ds-step-up-dialog__method')) {
        e.preventDefault();
        if (!methods) return;
        var show = methods.hidden;
        methods.hidden = !show;
        methodBtn.setAttribute('aria-expanded', String(show));
        if (show) { var first = methods.querySelector('button, a[href]'); if (first) first.focus(); }
        return;
      }
      var pick = e.target.closest('[data-ds-method-pick]');
      if (pick) {
        e.preventDefault();
        var name = pick.getAttribute('data-ds-method-pick');
        Array.prototype.forEach.call(dialog.querySelectorAll('[data-method]'), function (p) { p.hidden = p.getAttribute('data-method') !== name; });
        if (methods) methods.hidden = true;
        if (methodBtn) methodBtn.setAttribute('aria-expanded', 'false');
        setError(null);
        sync();
        var pane = dialog.querySelector('[data-method="' + name + '"]');
        var target = pane && pane.querySelector('input, button, a[href]');
        if (target) focusVisible(target);
        dialog.dispatchEvent(new CustomEvent('ds:methodchange', { bubbles: true, detail: name }));
      }
      var resend = e.target.closest('[data-ds-step-up-resend]');
      if (resend) {
        e.preventDefault();
        var exp = dialog.querySelector('[data-ds-step-up-expired]');
        if (exp) exp.hidden = true;
        if (DS.announce) DS.announce(resend.getAttribute('data-ds-announce') || 'A new code was sent', 'polite');
        var f = field(); if (f) focusVisible(f);
      }
    });
    dialog.addEventListener('input', function (e) {
      var f = e.target.closest('.ds-step-up-dialog__input');
      if (!f) return;
      if (f.getAttribute('inputmode') === 'numeric') { var v = f.value.replace(/[\s-]/g, ''); if (v !== f.value) f.value = v; }
      if (f.getAttribute('aria-invalid') === 'true') setError(null);
      sync();
      dialog.dispatchEvent(new CustomEvent('ds:valuechange', { bubbles: true, detail: f.value }));
    });
    dialog.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy || dialog.hasAttribute('data-locked')) return;
      var f = field();
      if (!complete()) { if (reason && DS.announce) DS.announce(reason.textContent.trim(), 'polite'); if (f) f.focus(); return; }
      busy = true;
      if (body) body.setAttribute('aria-busy', 'true');
      if (f) f.readOnly = true;
      if (verify) { verify.style.minInlineSize = verify.offsetWidth + 'px'; verify.setAttribute('aria-busy', 'true'); var s = document.createElement('span'); s.className = 'ds-modal__spinner'; s.setAttribute('aria-hidden', 'true'); verify.appendChild(s); }
      var answered = false;
      function respond(result) {
        if (answered || !busy) return;
        answered = true; busy = false;
        if (body) body.removeAttribute('aria-busy');
        if (verify) { verify.removeAttribute('aria-busy'); verify.style.minInlineSize = ''; var sp = verify.querySelector('.ds-modal__spinner'); if (sp) sp.remove(); }
        if (f) f.readOnly = false;
        if (result.ok) {
          dialog.close('authorized');
          var msg = dialog.getAttribute('data-ds-announce');
          if (msg && DS.announce) DS.announce(msg, 'polite');
          return;
        }
        if (typeof result.attemptsLeft === 'number') attemptsLeft = result.attemptsLeft;
        else if (attemptsLeft !== null) attemptsLeft = Math.max(0, attemptsLeft - 1);
        setError(result.errorText || dialog.getAttribute('data-error-text') || 'That code is not correct.');
        if (attemptsLeft === 0) { lock(); return; }
        if (f) { focusVisible(f); f.select(); }
      }
      var ev = new CustomEvent('ds:verify', { bubbles: true, cancelable: true, detail: { method: (dialog.querySelector('[data-method]:not([hidden])') || dialog).getAttribute('data-method') || 'pin', value: f ? f.value : '', respond: respond } });
      var handled = !dialog.dispatchEvent(ev);
      if (!handled) window.setTimeout(function () { respond({ ok: !!f && f.value === dialog.getAttribute('data-ds-demo-code') }); }, ms('--timing-indicator-delay', 300));
    });
    dialog.addEventListener('close', function () {
      busy = false;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      var target = trigger && trigger.isConnected ? trigger : (dialog.getAttribute('data-ds-return-focus') && document.querySelector(dialog.getAttribute('data-ds-return-focus')));
      if (target) focusVisible(target);
      dialog.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: dialog.returnValue || 'cancel' } }));
    });
    DS.stepUp = DS.stepUp || {};
    DS.stepUp[dialog.id] = { open: open, close: finish };
  });
})();
