/* Timeline · engine 1.8.0 reference module (catalog/components/Timeline.json). Progressive enhancement only (§6.4):
   entries, links and exact times (VisuallyHidden + datetime) need no JS; "Show older activity" is a link to the next page and
   the exact-time Tooltip is Tooltip.js. This module (on .ds-timeline[data-ds-module="timeline"]) adds:
   - Show older activity ([data-ds-timeline="older"] + <template data-older>): entries appended at the end, focus stays on the
     button, "{n} older entries loaded" announced politely;
   - new entries ([data-ds-timeline="new"] + <template data-new>): nothing moves until activated; then entries are inserted at
     the top, focus moves to the first new entry and the count is announced once per batch;
   - Retry on a failed send ([data-ds-timeline="retry"]): back to "Sending…". */
(function () {
  var DS = (window.DS = window.DS || {});
  function say(m) { if (DS.announce) DS.announce(m, 'polite'); }
  DS.register('timeline', function (root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-timeline]');
      if (!b || !root.contains(b)) return;
      var kind = b.getAttribute('data-ds-timeline');
      var lists = root.querySelectorAll('.ds-timeline__list');
      var list = kind === 'older' ? lists[lists.length - 1] : lists[0];
      if (kind === 'older') {
        var tpl = root.querySelector('template[data-older]');
        if (!tpl || !list) return;
        e.preventDefault();
        if (b.getAttribute('aria-busy') === 'true') return;
        b.setAttribute('aria-busy', 'true');
        window.setTimeout(function () {
          var frag = tpl.content.cloneNode(true);
          var n = frag.querySelectorAll('.ds-timeline__entry').length;
          list.appendChild(frag);
          b.removeAttribute('aria-busy');
          tpl.remove();
          if (!root.querySelector('template[data-older]')) { b.setAttribute('aria-disabled', 'true'); b.removeAttribute('href'); }
          if (DS.init) DS.init(list);
          say(n + ' older entries loaded');
        }, 500);
      } else if (kind === 'new') {
        var nt = root.querySelector('template[data-new]');
        if (!nt || !list) return;
        var frag2 = nt.content.cloneNode(true);
        var entries = frag2.querySelectorAll('.ds-timeline__entry');
        var first = entries[0];
        list.insertBefore(frag2, list.firstChild);
        nt.remove();
        b.hidden = true;
        if (DS.init) DS.init(list);
        if (first) { first.setAttribute('tabindex', '-1'); first.focus(); }
        say(entries.length + ' new entries shown');
      } else if (kind === 'retry') {
        var p = b.closest('.ds-timeline__entry');
        var st = p && p.querySelector('.ds-timeline__pending');
        if (st) { st.removeAttribute('data-failed'); st.lastChild.textContent = 'Sending…'; }
        b.hidden = true;
        say('Sending');
      }
    });
  });
})();
