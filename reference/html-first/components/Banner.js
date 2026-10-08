/* Banner · enhancement only.
   - data-ds-module="banner" on .ds-banner: dismiss for C3-C5 only (critical / warning stay until the condition changes). The
     dismissal is remembered per condition (data-banner-id + status) in localStorage when available; focus moves to the next
     focusable element after the banner (never lost). "ds:openchange" { open: false } bubbles for the product.
   - data-ds-module="banner-region" on .ds-banner-region (one per level, rendered empty with the AppShell so later insertions are
     read by the banner's own role=status / role=alert node): if several banners end up in one region, only the most urgent stays
     visible (C1 > C2 > C5 > C3 > C4) and the others are counted in its "N more notices" link. DS.announce is not called for the
     banner text: the role node reads it (no double read). */
(function () {
  var RANK = { critical: 0, warning: 1, info: 2, 'neutral-negative': 3, positive: 4 };
  function key(el) { return 'ds-banner-dismissed:' + (el.getAttribute('data-banner-id') || '') + ':' + el.getAttribute('data-status'); }
  function remembered(el) { try { return !!el.getAttribute('data-banner-id') && window.localStorage.getItem(key(el)) === '1'; } catch (e) { return false; } }
  function remember(el) { try { if (el.getAttribute('data-banner-id')) window.localStorage.setItem(key(el), '1'); } catch (e) { /* storage blocked */ } }

  DS.register('banner', function (el) {
    var status = el.getAttribute('data-status');
    var dismiss = el.querySelector('.ds-banner__dismiss');
    if (!dismiss) return;
    if (status === 'critical' || status === 'warning') { dismiss.hidden = true; return; }
    if (remembered(el)) { el.hidden = true; return; }
    dismiss.addEventListener('click', function () {
      var all = Array.prototype.slice.call(document.querySelectorAll('a[href], button:not([hidden]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'));
      var next = null;
      for (var i = 0; i < all.length; i++) {
        if (!el.contains(all[i]) && (el.compareDocumentPosition(all[i]) & Node.DOCUMENT_POSITION_FOLLOWING)) { next = all[i]; break; }
      }
      remember(el);
      el.hidden = true;
      el.dispatchEvent(new CustomEvent('ds:openchange', { bubbles: true, detail: { open: false } }));
      if (next) next.focus();
    });
  });

  DS.register('banner-region', function (region) {
    function arrange() {
      var banners = Array.prototype.slice.call(region.querySelectorAll(':scope > .ds-banner')).filter(function (b) { return !remembered(b); });
      if (banners.length < 2) return;
      banners.sort(function (a, b) { return (RANK[a.getAttribute('data-status')] || 9) - (RANK[b.getAttribute('data-status')] || 9); });
      banners.forEach(function (b, i) { b.hidden = i > 0; });
      var more = banners[0].querySelector('.ds-banner__more');
      if (more) more.textContent = (banners.length - 1) + (banners.length === 2 ? ' more notice' : ' more notices');
    }
    new MutationObserver(arrange).observe(region, { childList: true });
    arrange();
  });
})();
