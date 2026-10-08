/* Modal · engine 1.8.0 reference module (catalog/components/Modal.json). Progressive enhancement only (§6.4).
   No-JS: the trigger is a link to a confirmation page (href); with JS it opens dialog#id via showModal().
   Markup: trigger[data-ds-modal-open="<id>"] + dialog.ds-modal#<id>[data-ds-module="modal"][aria-labelledby].
   - initial focus: first field in the body (dialog/fullscreen) or the title (tabindex -1) for confirmation/destructive or
     data-initial-focus="title"; never the destructive action.
   - Esc (native cancel), Close, Cancel ([data-ds-modal-close]) and scrim = Cancel. Scrim is ignored for destructive and while
     submitting. When the form is dirty (data-ds-discard="<confirm-dialog-id>"), closing opens "Discard changes?" first;
     Esc there = Keep editing. Submitting with data-cancellable="false" blocks Esc/Cancel.
   - on close, focus returns to the trigger; if it is gone, to data-ds-return-focus (selector) or the page h1 (§9.5). */
(function () {
  var DS = (window.DS = window.DS || {});
  function focusVisible(el) { try { el.focus({ focusVisible: true }); } catch (e) { el.focus(); } }

  DS.register('modal', function (dialog) {
    if (!dialog.showModal) return;
    var trigger = null, dirty = false;
    var title = dialog.querySelector('.ds-modal__title');
    var body = dialog.querySelector('.ds-modal__body');
    var discard = dialog.getAttribute('data-ds-discard') ? document.getElementById(dialog.getAttribute('data-ds-discard')) : null;
    var variant = dialog.getAttribute('data-variant') || 'dialog';

    function busyBlocked() { return dialog.getAttribute('aria-busy') === 'true' && dialog.getAttribute('data-cancellable') === 'false'; }
    function initialFocus() {
      var mode = dialog.getAttribute('data-initial-focus') || (variant === 'confirmation' || variant === 'destructive' ? 'title' : 'first-field');
      var target = mode === 'title' ? null : dialog.querySelector('.ds-modal__body :is(input:not([type="hidden"]), select, textarea)');
      if (!target && title) { title.setAttribute('tabindex', '-1'); target = title; }
      if (target) focusVisible(target);
    }
    function syncScroll() {
      if (!body) return;
      var max = body.scrollHeight - body.clientHeight;
      if (body.scrollTop > 1) body.setAttribute('data-scroll-start', ''); else body.removeAttribute('data-scroll-start');
      if (max > 1 && body.scrollTop < max - 1) body.setAttribute('data-scroll-end', ''); else body.removeAttribute('data-scroll-end');
      // a scrolling body without focusable content must be reachable by keyboard (SC 2.1.1)
      if (max > 1 && !body.querySelector('a[href], button, input, select, textarea, [tabindex]')) {
        body.setAttribute('tabindex', '0');
        if (!body.hasAttribute('aria-label') && title) body.setAttribute('aria-label', title.textContent.trim());
      }
    }
    function open(t) {
      trigger = t || null;
      dirty = false;
      dialog.showModal();
      if (trigger) trigger.setAttribute('aria-expanded', 'true');
      syncScroll();
      initialFocus();
      dialog.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: true, reason: 'trigger' } }));
    }
    function requestClose(reason) {
      if (busyBlocked()) return;
      if (dirty && discard && !discard.open) {
        var back = document.activeElement;
        discard.showModal();
        var dt = discard.querySelector('.ds-modal__title');
        if (dt) { dt.setAttribute('tabindex', '-1'); focusVisible(dt); }
        discard.__dsBack = back;
        discard.__dsReason = reason;
        return;
      }
      dialog.close(reason);
    }

    var openers = document.querySelectorAll('[data-ds-modal-open="' + dialog.id + '"]');
    for (var i = 0; i < openers.length; i++) {
      openers[i].setAttribute('aria-haspopup', 'dialog');
      openers[i].setAttribute('aria-expanded', 'false');
      openers[i].addEventListener('click', function (e) { e.preventDefault(); open(e.currentTarget); });
    }
    dialog.addEventListener('cancel', function (e) { e.preventDefault(); requestClose('escape'); });
    dialog.addEventListener('click', function (e) {
      var closer = e.target.closest('[data-ds-modal-close], .ds-modal__close');
      if (closer && dialog.contains(closer)) {
        e.preventDefault();
        if (closer.getAttribute('aria-disabled') === 'true') return;
        requestClose(closer.classList.contains('ds-modal__close') ? 'close-button' : 'cancel');
        return;
      }
      if (e.target !== dialog) return; // ::backdrop clicks target the dialog element outside its box
      var r = dialog.getBoundingClientRect();
      var outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (outside && variant !== 'destructive' && dialog.getAttribute('aria-busy') !== 'true') requestClose('scrim');
    });
    dialog.addEventListener('input', function () { dirty = true; });
    if (body) body.addEventListener('scroll', syncScroll, { passive: true });
    // Enter never runs a destructive action by default
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && variant === 'destructive' && e.target.matches('input')) e.preventDefault();
    });
    dialog.addEventListener('close', function () {
      dirty = false;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      var target = trigger && trigger.isConnected ? trigger : null;
      if (!target) {
        var sel = dialog.getAttribute('data-ds-return-focus');
        target = (sel && document.querySelector(sel)) || document.querySelector('main h1, h1');
        if (target && !target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      }
      if (target) focusVisible(target);
      var msg = dialog.returnValue && dialog.returnValue !== 'cancel' ? dialog.getAttribute('data-ds-announce') : null;
      if (msg && DS.announce) DS.announce(msg);
      dialog.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false, reason: dialog.returnValue || 'cancel' } }));
    });

    if (discard) {
      discard.addEventListener('click', function (e) {
        if (e.target.closest('[data-ds-discard-confirm]')) { discard.close('discard'); dirty = false; dialog.close(discard.__dsReason || 'cancel'); }
        else if (e.target.closest('[data-ds-discard-keep], .ds-modal__close')) discard.close('keep');
      });
      discard.addEventListener('close', function () {
        if (discard.returnValue !== 'discard' && discard.__dsBack && discard.__dsBack.isConnected) focusVisible(discard.__dsBack);
        discard.returnValue = '';
      });
    }
    DS.modal = DS.modal || {};
    DS.modal[dialog.id] = { open: open, close: requestClose };
  });
})();
