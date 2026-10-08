/* LiveAnnouncer · upgrades the minimal DS.announce from ds.js to the catalog behaviour (catalog/components/LiveAnnouncer.json):
   - empty messages are ignored; polite messages are debounced (150 ms) and a burst collapses to the last one;
   - at most one assertive message is active, the next waits in a queue;
   - the region is emptied first and refilled after ±100 ms, so an identical message is announced again;
   - the region is cleared after clearAfter (7 s) so reading navigation never finds a stale message;
   - the polite region gets role="status"; both get dir="auto" so mixed-direction messages read in the right order.
   Every change is also dispatched as a "ds:announce" event (detail: message, politeness, state) for docs/preview logs.
   Same signature as ds.js: DS.announce(message, politeness). */
(function () {
  var DEBOUNCE = 150, REFILL = 100, CLEAR_AFTER = 7000, ASSERTIVE_HOLD = 2000;
  var timers = { polite: null, assertive: null }, politeTimer = null, pendingPolite = null, assertiveQueue = [], assertiveActive = false;
  function region(p) { return document.getElementById(p === 'assertive' ? 'ds-live-assertive' : 'ds-live-polite'); }
  function prepare() {
    var p = region('polite'), a = region('assertive');
    if (p && !p.hasAttribute('role')) p.setAttribute('role', 'status');
    [p, a].forEach(function (r) { if (r && !r.hasAttribute('dir')) r.setAttribute('dir', 'auto'); });
  }
  function emit(message, politeness, state) {
    try { document.dispatchEvent(new CustomEvent('ds:announce', { detail: { message: message, politeness: politeness, state: state } })); } catch (e) { /* old engines: log only */ }
  }
  function write(p, message) {
    var r = region(p);
    if (!r) return;
    prepare();
    window.clearTimeout(timers[p]);
    r.textContent = '';
    window.setTimeout(function () {
      r.textContent = message;
      emit(message, p, 'announced');
      timers[p] = window.setTimeout(function () { r.textContent = ''; emit('', p, 'cleared'); }, CLEAR_AFTER);
    }, REFILL);
  }
  function pump() {
    if (assertiveActive || !assertiveQueue.length) return;
    assertiveActive = true;
    write('assertive', assertiveQueue.shift());
    window.setTimeout(function () { assertiveActive = false; pump(); }, ASSERTIVE_HOLD);
  }
  DS.announce = function (message, politeness) {
    message = message == null ? '' : String(message).trim();
    if (!message) return;
    if (politeness === 'assertive') { assertiveQueue.push(message); if (assertiveActive) emit(message, 'assertive', 'queued'); pump(); return; }
    if (pendingPolite) emit(pendingPolite, 'polite', 'merged');
    pendingPolite = message;
    window.clearTimeout(politeTimer);
    politeTimer = window.setTimeout(function () { var m = pendingPolite; pendingPolite = null; write('polite', m); }, DEBOUNCE);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepare); else prepare();

  /* Declarative trigger (docs and simple pages): <button data-ds-module="announce" data-ds-announce="Changes saved"
     data-ds-politeness="polite">. "|" separates a burst of messages sent in one go. */
  DS.register('announce', function (el) {
    el.addEventListener('click', function () {
      var msgs = (el.getAttribute('data-ds-announce') || '').split('|');
      var p = el.getAttribute('data-ds-politeness') || 'polite';
      for (var i = 0; i < msgs.length; i++) DS.announce(msgs[i], p);
    });
  });

  /* Announcement log for previews: a plain list (never aria-live itself) that mirrors what the regions receive. */
  DS.register('live-announcer-log', function (el) {
    document.addEventListener('ds:announce', function (e) {
      var d = e.detail || {};
      if (d.state === 'cleared') return;
      var li = document.createElement('li');
      li.className = 'ds-live-announcer__entry';
      li.setAttribute('data-politeness', d.politeness);
      li.setAttribute('data-state', d.state);
      var tag = document.createElement('span');
      tag.className = 'ds-live-announcer__politeness';
      tag.textContent = d.politeness + ' · ' + d.state;
      var msg = document.createElement('span');
      msg.setAttribute('dir', 'auto');
      msg.textContent = d.message;
      li.appendChild(tag);
      li.appendChild(msg);
      el.insertBefore(li, el.querySelector('.ds-live-announcer__entry'));
      var entries = el.querySelectorAll('.ds-live-announcer__entry');
      for (var i = 8; i < entries.length; i++) entries[i].remove();
    });
  });
})();
