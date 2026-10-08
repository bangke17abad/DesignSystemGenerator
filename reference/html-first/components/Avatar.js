/* Avatar · enhancement only. The initials are server-rendered under the photo, so a slow, offline or failed photo already
   shows the fallback without JS; this only removes the failed <img> and closes an open "+N" list on Escape or outside click. */
DS.register('avatar', function (el) {
  var img = el.querySelector('.ds-avatar__image');
  if (img) {
    var fail = function () { img.hidden = true; };
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
  }
  if (el.matches('.ds-avatar-group__details')) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el.open) { el.open = false; el.querySelector('summary').focus(); }
    });
    document.addEventListener('click', function (e) { if (el.open && !el.contains(e.target)) el.open = false; });
  }
});
