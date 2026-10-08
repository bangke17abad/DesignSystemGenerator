/* NotificationItem · enhancement only. data-ds-module="notification-list" on section.ds-notification-list.
   Without JS: every item is a plain link to its object, and the per-item menu is a native popover (popovertarget) whose
   actions are submit buttons of a small form, so marking read/unread still reaches the server.
   With JS:
   - the popover is anchored under its button (inline-end aligned, kept inside the viewport); choosing an action closes it and
     returns focus to the button
   - Mark as read / unread toggles data-unread, the hidden "Unread." prefix and the action label, announced politely; the
     product confirms with the server (offline: queued, not shown as confirmed — I6)
   - "Mark all as read" → "All notifications marked as read" (polite)
   - items that arrive while the list is open stay hidden (data-pending) behind "Show N new"; one combined polite announcement
     ("3 new notifications") via DS.notificationsArrived(list, n). Critical events were already announced assertively where
     they happened and are not announced again here. */
(function () {
  function setRead(li, read) {
    if (read) li.removeAttribute('data-unread'); else li.setAttribute('data-unread', '');
    var sr = li.querySelector('.ds-notification-item__unread');
    if (sr) sr.textContent = read ? '' : 'Unread. ';
    var act = li.querySelector('[data-notification-action="toggle-read"]');
    if (act) act.textContent = read ? 'Mark as unread' : 'Mark as read';
  }
  function place(menu, btn) {
    var r = btn.getBoundingClientRect();
    var rtl = getComputedStyle(btn).direction === 'rtl';
    var w = menu.offsetWidth;
    var h = menu.offsetHeight;
    var gap = 4;
    var x = rtl ? r.left : r.right - w;
    x = Math.max(gap, Math.min(x, document.documentElement.clientWidth - w - gap));
    var y = r.bottom + gap;
    if (y + h > window.innerHeight && r.top - h - gap > 0) y = r.top - h - gap;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
  }
  DS.register('notification-list', function (list) {
    var menus = list.querySelectorAll('.ds-notification-item__menu');
    Array.prototype.forEach.call(menus, function (menu) {
      var btn = list.querySelector('[popovertarget="' + menu.id + '"]');
      menu.addEventListener('toggle', function (e) {
        if (e.newState === 'open' && btn) {
          place(menu, btn);
          var first = menu.querySelector('button');
          if (first) first.focus();
        }
      });
      menu.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        var items = Array.prototype.slice.call(menu.querySelectorAll('button'));
        var i = items.indexOf(document.activeElement);
        items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
        e.preventDefault();
      });
    });
    list.addEventListener('click', function (e) {
      var a = e.target.closest('[data-notification-action]');
      if (!a || !list.contains(a)) return;
      e.preventDefault();
      var kind = a.getAttribute('data-notification-action');
      var li = a.closest('.ds-notification-item');
      var menu = a.closest('.ds-notification-item__menu');
      var btn = menu && list.querySelector('[popovertarget="' + menu.id + '"]');
      if (kind === 'toggle-read' && li) {
        var nowRead = li.hasAttribute('data-unread');
        setRead(li, nowRead);
        DS.announce(nowRead ? 'Marked as read' : 'Marked as unread', 'polite');
        li.dispatchEvent(new CustomEvent('ds:readchange', { bubbles: true, detail: { read: nowRead } }));
      } else if (kind === 'mute' && li) {
        DS.announce('Notifications of this type are muted', 'polite');
        li.dispatchEvent(new CustomEvent('ds:mute', { bubbles: true }));
      } else if (kind === 'mark-all-read') {
        Array.prototype.forEach.call(list.querySelectorAll('.ds-notification-item[data-unread]'), function (x) { setRead(x, true); });
        DS.announce('All notifications marked as read', 'polite');
      } else if (kind === 'show-new') {
        var pending = list.querySelectorAll('.ds-notification-item[data-pending]');
        Array.prototype.forEach.call(pending, function (x) { x.removeAttribute('data-pending'); x.hidden = false; });
        a.hidden = true;
        var firstLink = pending[0] && pending[0].querySelector('.ds-notification-item__link');
        if (firstLink) firstLink.focus();
      }
      if (menu && menu.hidePopover) { menu.hidePopover(); if (btn) btn.focus(); }
    });
  });
  DS.notificationsArrived = function (list, n) {
    var holder = list.querySelector('[data-notification-action="show-new"]');
    if (holder) { holder.hidden = false; holder.textContent = 'Show ' + n + ' new'; }
    DS.announce(n === 1 ? '1 new notification' : n + ' new notifications', 'polite');
  };
})();
