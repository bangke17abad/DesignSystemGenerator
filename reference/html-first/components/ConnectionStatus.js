/* ConnectionStatus · enhancement only. data-ds-module="connection-status" on .ds-connection-status exposes
   el.dsConnection.set(state, { lastUpdated, queuedCount }) with state live | reconnecting | stale | offline | syncing |
   sync-conflict | offline-during-task. navigator.onLine / online / offline events are hints only; the product feeds the truth
   from its server heartbeat.
   - transitions are debounced (2 s) and the worst state inside the window wins, so a flapping connection gives one update
   - the summary node is role=status and reads its own text change once (polite); repeated reconnect attempts are not announced
   - offline-during-task (C1) goes to the assertive LiveAnnouncer region while the status node is muted, so it is read once
   - relative freshness ("2 min ago") is refreshed every minute inside an aria-hidden span (the absolute time in the visually
     hidden twin is what assistive tech reads), so the refresh is never announced. */
(function () {
  var RANK = { 'offline-during-task': 0, offline: 1, stale: 2, 'sync-conflict': 2, reconnecting: 3, syncing: 4, live: 5 };
  var GLYPH = { live: 'dot', reconnecting: 'info', syncing: 'info', stale: 'warning', offline: 'warning', 'sync-conflict': 'warning', 'offline-during-task': 'critical' };
  var LABEL = { live: 'Live', reconnecting: 'Reconnecting', syncing: 'Sending changes', stale: 'Data may be out of date', offline: 'Offline', 'sync-conflict': 'Changes need review', 'offline-during-task': 'Connection lost' };
  function rel(d) {
    var m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function abs(d) { return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function plural(n) { return n > 999 ? '999+ changes waiting to send' : n + (n === 1 ? ' change' : ' changes') + ' waiting to send'; }

  DS.register('connection-status', function (el) {
    var summary = el.querySelector('.ds-connection-status__summary');
    var label = el.querySelector('.ds-connection-status__label');
    var use = el.querySelector('.ds-connection-status__container use');
    var fresh = el.querySelector('.ds-connection-status__freshness');
    var queue = el.querySelector('.ds-connection-status__queue');
    var pending = null;
    var timer = null;
    var opts = {};

    function tick() {
      var nodes = el.querySelectorAll('time[datetime] [data-ds-relative]');
      for (var i = 0; i < nodes.length; i++) {
        var d = new Date(nodes[i].parentNode.getAttribute('datetime'));
        if (!isNaN(d)) nodes[i].textContent = rel(d);
      }
    }
    function render(state) {
      var critical = state === 'offline-during-task';
      if (critical && summary) summary.setAttribute('aria-live', 'off');
      el.setAttribute('data-state', state);
      if (use) use.setAttribute('href', '#ds-i-' + GLYPH[state]);
      if (label) label.textContent = el.getAttribute('data-label-' + state) || LABEL[state];
      var showFresh = state !== 'live' && state !== 'syncing' && opts.lastUpdated;
      if (fresh) {
        fresh.hidden = !showFresh;
        if (showFresh) {
          var d = new Date(opts.lastUpdated);
          fresh.innerHTML = '';
          fresh.appendChild(document.createTextNode('Last updated '));
          var t = document.createElement('time');
          t.setAttribute('datetime', d.toISOString());
          var v = document.createElement('span'); v.setAttribute('aria-hidden', 'true'); v.setAttribute('data-ds-relative', ''); v.textContent = rel(d);
          var h = document.createElement('span'); h.className = 'ds-vh'; h.textContent = abs(d);
          t.appendChild(v); t.appendChild(h); fresh.appendChild(t);
        }
      }
      if (queue) {
        var n = Number(opts.queuedCount) || 0;
        queue.hidden = !(n > 0 && state !== 'live');
        if (n > 0) queue.textContent = state === 'syncing' ? 'Sending ' + (n === 1 ? '1 change' : n + ' changes') : plural(n);
      }
      if (critical) {
        DS.announce(summary ? summary.textContent.replace(/\s+/g, ' ').trim() : LABEL[state], 'assertive');
        window.setTimeout(function () { if (summary) summary.removeAttribute('aria-live'); }, 1500);
      }
    }
    el.dsConnection = {
      set: function (state, o) {
        if (!(state in RANK)) return;
        if (o) for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) opts[k] = o[k];
        if (pending === null || RANK[state] <= RANK[pending]) pending = state;
        if (timer) return;
        timer = window.setTimeout(function () { timer = null; var s = pending; pending = null; render(s); }, 2000);
      },
    };
    window.setInterval(tick, 60000);
  });

  /* demo: <button data-ds-module="connection-demo" data-target="id" data-state="offline" data-queued="3"> */
  DS.register('connection-demo', function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.getAttribute('data-target'));
      if (!el || !el.dsConnection) return;
      var minutes = Number(btn.getAttribute('data-age') || 0);
      el.dsConnection.set(btn.getAttribute('data-state'), { lastUpdated: new Date(Date.now() - minutes * 60000).toISOString(), queuedCount: Number(btn.getAttribute('data-queued') || 0) });
    });
  });
})();
