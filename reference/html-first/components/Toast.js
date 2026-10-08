/* Toast · enhancement only. One region per AppShell: <section class="ds-toast-region" aria-label="Notifications" data-ds-module="toast-region">.
   DS.toast({ label, status, actionLabel, onAction, duration, returnFocus }) → handle { dismiss() } | null.
   - max 3 visible on desktop, 2 on tablet, 1 on phone; the rest queue (never pile up)
   - duration ≥ --timing-toast-default, ≥ --timing-toast-with-action when there is an action, + reading time for long text
   - all timers pause while the pointer is over the stack or focus is inside; resume with at least 2 s left
   - announced through DS.announce (polite) once it becomes visible; status="critical" is refused (§12.2: use InlineAlert/Banner)
   - Esc inside a toast closes it; focus inside a closing toast returns to where it came from before the node is removed. */
(function () {
  var MIN_RESUME = 2000;
  function ms(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    var n = parseFloat(v);
    if (isNaN(n)) return fallback;
    return /ms$/.test(v) ? n : (/s$/.test(v) ? n * 1000 : n);
  }
  function px(name, fallback) { var n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)); return isNaN(n) ? fallback : n; }
  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'ds-icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#ds-i-' + name);
    svg.appendChild(use);
    return svg;
  }

  DS.register('toast-region', function (region) {
    var visible = [];
    var queue = [];
    var paused = false;
    var focusOrigin = null;

    function maxVisible() {
      if (window.matchMedia('(min-width: ' + px('--bp-desktop', 1024) + 'px)').matches) return 3;
      if (window.matchMedia('(min-width: ' + px('--bp-tablet', 600) + 'px)').matches) return 2;
      return 1;
    }
    function start(t) {
      if (paused || t.timer || t.closing) return;
      t.startedAt = Date.now();
      t.timer = window.setTimeout(function () { close(t); }, t.remaining);
    }
    function stop(t) {
      if (!t.timer) return;
      window.clearTimeout(t.timer);
      t.timer = null;
      t.remaining = Math.max(t.remaining - (Date.now() - t.startedAt), MIN_RESUME);
    }
    function pause() { if (paused) return; paused = true; visible.forEach(stop); }
    function resume() { if (!paused) return; paused = false; visible.forEach(start); }

    function show(t) {
      visible.push(t);
      region.appendChild(t.el);
      DS.announce(t.label + (t.actionLabel ? '. ' + t.actionLabel + ' available.' : ''), 'polite');
      start(t);
    }
    function pump() { while (queue.length && visible.length < maxVisible()) show(queue.shift()); }

    function close(t) {
      if (t.closing) return;
      t.closing = true;
      stop(t);
      var hadFocus = t.el.contains(document.activeElement);
      if (hadFocus) {
        var back = t.returnFocus || focusOrigin;
        if (back && document.contains(back)) back.focus(); else document.body.focus();
      }
      t.el.setAttribute('data-state', 'exiting');
      window.setTimeout(function () {
        if (t.el.parentNode) t.el.parentNode.removeChild(t.el);
        visible.splice(visible.indexOf(t), 1);
        if (typeof t.onOpenChange === 'function') t.onOpenChange(false);
        pump();
      }, ms('--motion-base-duration', 0));
    }

    function build(t) {
      var el = document.createElement('div');
      el.className = 'ds-toast';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', t.label);
      if (t.status) el.setAttribute('data-status', t.status);
      var glyph = { positive: 'positive', info: 'info', 'neutral-negative': 'neutral-negative', warning: 'warning' }[t.status];
      if (glyph) { var i = icon(glyph); i.classList.add('ds-toast__icon'); el.appendChild(i); }
      var msg = document.createElement('p');
      msg.className = 'ds-toast__message';
      msg.textContent = t.label;
      el.appendChild(msg);
      var controls = document.createElement('div');
      controls.className = 'ds-toast__controls';
      if (t.actionLabel) {
        var action = document.createElement('button');
        action.type = 'button';
        action.className = 'ds-toast__action';
        action.textContent = t.actionLabel;
        action.addEventListener('click', function () {
          if (action.getAttribute('aria-busy') === 'true') return;
          var r = typeof t.onAction === 'function' ? t.onAction() : null;
          if (r && typeof r.then === 'function') {
            action.setAttribute('aria-busy', 'true');
            r.then(function () { close(t); }, function () { action.removeAttribute('aria-busy'); });
          } else close(t);
        });
        controls.appendChild(action);
      }
      var dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'ds-toast__dismiss';
      dismiss.setAttribute('aria-label', t.dismissLabel || 'Dismiss notification');
      dismiss.appendChild(icon('close'));
      dismiss.addEventListener('click', function () { close(t); });
      controls.appendChild(dismiss);
      el.appendChild(controls);
      el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close(t); } });
      return el;
    }

    region.addEventListener('pointerenter', pause);
    region.addEventListener('pointerleave', function () { if (!region.contains(document.activeElement)) resume(); });
    region.addEventListener('focusin', function (e) { if (!region.contains(e.relatedTarget)) focusOrigin = e.relatedTarget; pause(); });
    region.addEventListener('focusout', function (e) { if (!region.contains(e.relatedTarget) && !region.matches(':hover')) resume(); });
    // keyboard route to the stack (catalog: F6 or Alt+T; recorded in the shortcut glossary)
    document.addEventListener('keydown', function (e) {
      if (!(e.altKey && (e.key === 't' || e.key === 'T'))) return;
      var last = visible[visible.length - 1];
      var target = last && last.el.querySelector('button');
      if (target) { e.preventDefault(); target.focus(); }
    });
    window.addEventListener('resize', pump);

    DS.toast = function (opts) {
      opts = opts || {};
      if (!opts.label) return null;
      if (opts.status === 'critical') {
        if (window.console) console.warn('[DS] toast: status "critical" is not allowed; show an InlineAlert (C1) or Banner instead.');
        return null;
      }
      var words = String(opts.label).split(/\s+/).length;
      var floor = opts.actionLabel ? ms('--timing-toast-with-action', 10000) : ms('--timing-toast-default', 5000);
      var reading = Math.max(0, words - 8) * 300;
      var t = {
        label: opts.label, status: opts.status || null, actionLabel: opts.actionLabel || null, onAction: opts.onAction,
        onOpenChange: opts.onOpenChange, dismissLabel: opts.dismissLabel, returnFocus: opts.returnFocus || document.activeElement,
        remaining: Math.max(opts.duration || 0, floor + reading), timer: null, closing: false,
      };
      t.el = build(t);
      queue.push(t);
      pump();
      return { dismiss: function () { var qi = queue.indexOf(t); if (qi >= 0) queue.splice(qi, 1); else close(t); } };
    };
  });

  /* demo / no-code trigger: <button data-ds-module="toast-trigger" data-toast-label="…" data-toast-status="…" data-toast-action="Undo"> */
  DS.register('toast-trigger', function (btn) {
    btn.addEventListener('click', function () {
      if (!DS.toast) return;
      DS.toast({
        label: btn.getAttribute('data-toast-label'),
        status: btn.getAttribute('data-toast-status') || undefined,
        actionLabel: btn.getAttribute('data-toast-action') || undefined,
        returnFocus: btn,
      });
    });
  });
})();
