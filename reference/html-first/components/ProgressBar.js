/* ProgressBar · enhancement only. data-ds-module="progress-bar" on .ds-progress-bar exposes
   el.dsProgress.update({ value, max, valueText, status, description, indeterminate }).
   - renders at most ~4 times per second (fast progress events are coalesced); value is clamped to 0..max
   - the bar is not a live region: announcements go through DS.announce only at start, every 25 % milestone (never more often
     than every 10 s), completion / cancel / needs-attention (polite) and failure (assertive). Never per percent.
   - the status-line (a composed StatusLabel) gets the locked glyph + text of the new phase, so the outcome is never colour only. */
(function () {
  var GLYPH = { info: 'info', positive: 'positive', critical: 'critical', warning: 'warning', 'neutral-negative': 'neutral-negative' };
  DS.register('progress-bar', function (el) {
    var track = el.querySelector('[role="progressbar"]');
    if (!track) return;
    var valueEl = el.querySelector('.ds-progress-bar__value');
    var labelEl = el.querySelector('.ds-progress-bar__label');
    var status = el.querySelector('.ds-progress-bar__status .ds-status-label');
    var name = labelEl ? labelEl.textContent.trim() : '';
    var state = { lastMilestone: 0, lastAnnounce: 0, started: false, status: el.getAttribute('data-status') || 'info' };
    var pending = null;
    var timer = null;

    function setStatusLine(cls, text) {
      if (!status || !text) return;
      status.setAttribute('data-status', cls);
      var use = status.querySelector('use');
      if (use) use.setAttribute('href', '#ds-i-' + (GLYPH[cls] || 'info'));
      var t = status.querySelector('.ds-status-label__container > span:last-child');
      if (t) t.textContent = text;
    }
    function flush() {
      timer = null;
      var s = pending; pending = null;
      if (!s) return;
      var max = s.max != null ? Number(s.max) : Number(track.getAttribute('aria-valuemax') || 100);
      if (s.indeterminate) {
        el.setAttribute('data-variant', 'indeterminate');
        track.removeAttribute('aria-valuenow');
      } else if (s.value != null) {
        if (el.getAttribute('data-variant') === 'indeterminate') el.removeAttribute('data-variant');
        var v = Math.min(Math.max(Number(s.value) || 0, 0), max);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', String(max));
        track.setAttribute('aria-valuenow', String(v));
        var pct = max ? (v / max) * 100 : 0;
        track.style.setProperty('--ds-progress', pct + '%');
        if (!state.started && v > 0) { state.started = true; DS.announce(name + ' started', 'polite'); state.lastAnnounce = Date.now(); }
        var milestone = Math.floor(pct / 25) * 25;
        if (milestone > state.lastMilestone && milestone < 100 && Date.now() - state.lastAnnounce >= 10000) {
          state.lastMilestone = milestone;
          state.lastAnnounce = Date.now();
          DS.announce(name + ': ' + (s.valueText || Math.round(pct) + '%'), 'polite');
        }
      }
      if (s.valueText) {
        track.setAttribute('aria-valuetext', s.valueText);
        if (valueEl) valueEl.textContent = s.valueText;
      }
      if (s.status && s.status !== state.status) {
        state.status = s.status;
        el.setAttribute('data-status', s.status);
        setStatusLine(s.status, s.description);
        var msg = name + '. ' + (s.description || '');
        if (s.status === 'critical') DS.announce(msg, 'assertive');
        else if (s.status !== 'info') DS.announce(msg, 'polite');
      } else if (s.description) setStatusLine(state.status, s.description);
    }
    el.dsProgress = {
      update: function (s) {
        pending = pending || {};
        for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) pending[k] = s[k];
        // phase changes render at once; plain value updates are throttled to ~4 per second
        if (s.status && s.status !== state.status) { window.clearTimeout(timer); flush(); return; }
        if (!timer) timer = window.setTimeout(flush, 250);
      },
      reset: function () { state.started = false; state.lastMilestone = 0; state.lastAnnounce = 0; },
    };
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-progress-action]');
      if (!b || !el.contains(b) || b.getAttribute('aria-disabled') === 'true') return;
      el.dispatchEvent(new CustomEvent('ds:progress-action', { bubbles: true, detail: { action: b.getAttribute('data-progress-action') } }));
    });
  });

  /* demo driver: <button data-ds-module="progress-demo" data-target="id-of-progress-bar">Run import</button> */
  DS.register('progress-demo', function (btn) {
    var running = null;
    btn.addEventListener('click', function () {
      var bar = document.getElementById(btn.getAttribute('data-target'));
      if (!bar || !bar.dsProgress || running) return;
      var total = 1000;
      var done = 0;
      bar.dsProgress.reset();
      bar.dsProgress.update({ status: 'info', value: 0, max: total, valueText: '0 of 1,000 rows', description: 'About 1 minute left' });
      running = window.setInterval(function () {
        done = Math.min(total, done + 40);
        bar.dsProgress.update({ value: done, valueText: done.toLocaleString('en-US') + ' of 1,000 rows' });
        if (done >= total) {
          window.clearInterval(running); running = null;
          bar.dsProgress.update({ status: 'positive', description: 'Import complete. 1,000 rows imported.' });
        }
      }, 200);
      bar.addEventListener('ds:progress-action', function onAct(e) {
        if (e.detail.action !== 'cancel' || !running) return;
        window.clearInterval(running); running = null;
        bar.removeEventListener('ds:progress-action', onAct);
        bar.dsProgress.update({ status: 'neutral-negative', description: 'Import cancelled. ' + done.toLocaleString('en-US') + ' rows were imported.' });
      });
    });
  });
})();
