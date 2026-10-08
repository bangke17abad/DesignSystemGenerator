/* CountdownTimer · enhancement only. data-ds-module="countdown-timer" on .ds-countdown-timer[role=timer] with
   data-ends-at="ISO 8601 deadline from the server" (or data-ends-in="seconds", demos only), data-threshold="seconds",
   data-end-status="critical|neutral-negative", optional data-server-offset="ms" (server clock − local clock) and texts
   data-label-below, data-label-end, data-value-end, data-threshold-message, data-end-message.
   - remaining time is always recomputed from the absolute deadline (+ server offset), also after a background tab / sleep
   - digits update every second inside an aria-hidden span; the spoken sentence ("4 minutes 59 seconds") is refreshed at most
     every 10 s, so navigation never stutters; role=timer is aria-live off — no per-second announcements
   - DS.announce exactly twice: crossing the threshold (polite) and reaching zero (assertive for expired C1, polite for ended C3);
     a timer that is already past its deadline on load goes straight to the end state with one announcement
   - "ds:threshold" and "ds:expire" events bubble for the product (show Extend, release the hold, …). */
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function format(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? h + ':' + pad(m) + ':' + pad(sec) : m + ':' + pad(sec);
  }
  function spoken(s) {
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60, out = [];
    if (h) out.push(h + (h === 1 ? ' hour' : ' hours'));
    if (m) out.push(m + (m === 1 ? ' minute' : ' minutes'));
    if (sec || !out.length) out.push(sec + (sec === 1 ? ' second' : ' seconds'));
    return out.join(' ');
  }
  DS.register('countdown-timer', function (el) {
    var label = el.querySelector('.ds-countdown-timer__label');
    var value = el.querySelector('.ds-countdown-timer__value');
    var statusUse = el.querySelector('.ds-countdown-timer__status use');
    var offset = Number(el.getAttribute('data-server-offset') || 0);
    var threshold = Number(el.getAttribute('data-threshold') || 60);
    var endStatus = el.getAttribute('data-end-status') === 'neutral-negative' ? 'ended' : 'expired';
    var endsAt = el.getAttribute('data-ends-at') ? new Date(el.getAttribute('data-ends-at')).getTime() : Date.now() + Number(el.getAttribute('data-ends-in') || 0) * 1000;
    if (isNaN(endsAt)) return;
    var digits = el.querySelector('.ds-countdown-timer__digits');
    var said = el.querySelector('.ds-countdown-timer__spoken');
    var lastSpoken = 0;
    var first = true;
    var timer = null;
    var label0 = label ? label.textContent : '';
    var valueHTML = value ? value.innerHTML : '';

    function setState(state) {
      el.setAttribute('data-state', state);
      if (statusUse) statusUse.setAttribute('href', '#ds-i-' + (state === 'expired' ? 'critical' : state === 'ended' ? 'neutral-negative' : 'warning'));
    }
    function remaining() { return Math.max(0, Math.ceil((endsAt - (Date.now() + offset)) / 1000)); }
    function tick() {
      var s = remaining();
      var state = el.getAttribute('data-state');
      if (s <= 0) {
        if (state !== endStatus) {
          window.clearInterval(timer);
          setState(endStatus);
          if (label && el.getAttribute('data-label-end')) label.textContent = el.getAttribute('data-label-end');
          if (value) value.textContent = el.getAttribute('data-value-end') || (endStatus === 'expired' ? 'expired' : 'ended');
          var msg = el.getAttribute('data-end-message') || ((label ? label.textContent : '') + ' ' + (value ? value.textContent : ''));
          DS.announce(msg, endStatus === 'expired' ? 'assertive' : 'polite');
          el.dispatchEvent(new CustomEvent('ds:expire', { bubbles: true, detail: { endsAt: new Date(endsAt).toISOString() } }));
        }
        return;
      }
      if (s <= threshold && state === 'running') {
        setState('below-threshold');
        if (label && el.getAttribute('data-label-below')) label.textContent = el.getAttribute('data-label-below');
        if (!first) {
          DS.announce(el.getAttribute('data-threshold-message') || (spoken(s) + ' left: ' + label0), 'polite');
          el.dispatchEvent(new CustomEvent('ds:threshold', { bubbles: true, detail: { remaining: s } }));
        }
      }
      if (s > 86400) {
        if (digits) digits.textContent = new Date(endsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
      } else if (digits) digits.textContent = format(s);
      if (said && (first || Date.now() - lastSpoken >= 10000 || el.getAttribute('data-state') !== state)) { said.textContent = spoken(s); lastSpoken = Date.now(); }
      first = false;
    }
    tick();
    timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });
    el.dsCountdown = {
      extend: function (iso) {
        endsAt = new Date(iso).getTime();
        setState('running');
        if (label) label.textContent = label0;
        if (value) { value.innerHTML = valueHTML; digits = el.querySelector('.ds-countdown-timer__digits'); said = el.querySelector('.ds-countdown-timer__spoken'); }
        window.clearInterval(timer);
        first = true; tick(); timer = window.setInterval(tick, 1000);
        DS.announce(label0 + ' extended', 'polite');
      },
    };
  });
})();
