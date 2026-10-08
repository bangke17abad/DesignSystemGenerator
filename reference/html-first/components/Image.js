/* Image · engine 1.8.0 reference module (catalog/components/Image.json). Progressive enhancement only (§6.4):
   without JS the frame still reserves its ratio, lazy loading is native, a failed image shows the browser's alt text and the
   zoom trigger is a link to the full-size image. This module adds:
   - loading → loaded / error states (data-state) on .ds-image[data-ds-module="image"]; empty src fails at once, no request;
   - the error fallback text mirrors the alt (never "image of"), decorative images fall back to nothing but the frame;
   - zoom in / zoom out buttons inside the full-size Modal (SC 2.5.1 alternative to pinch); the Modal itself is Modal.js. */
(function () {
  var DS = (window.DS = window.DS || {});
  DS.register('image', function (fig) {
    if (fig.hasAttribute('data-static')) return;
    var img = fig.querySelector('.ds-image__img');
    if (!img) return;
    var fallback = fig.querySelector('.ds-image__fallback-text');
    function fail() {
      fig.setAttribute('data-state', 'error');
      if (fallback && !fallback.textContent.trim()) fallback.textContent = img.getAttribute('alt') || fig.getAttribute('data-unavailable') || 'Image unavailable';
      var zoom = fig.querySelector('.ds-image__zoom');
      if (zoom) zoom.setAttribute('tabindex', '-1');
      fig.dispatchEvent(new CustomEvent('ds:imageerror', { bubbles: true }));
    }
    function done() {
      fig.removeAttribute('data-state');
      fig.dispatchEvent(new CustomEvent('ds:imageload', { bubbles: true }));
    }
    if (!img.getAttribute('src')) { fail(); return; }
    if (img.complete) { if (img.naturalWidth > 0) done(); else fail(); return; }
    fig.setAttribute('data-state', 'loading');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', fail, { once: true });
  });

  DS.register('image-zoom', function (dialog) {
    var full = dialog.querySelector('.ds-image__full');
    if (!full) return;
    var level = 1;
    function apply() {
      // zoom by width inside a scrolling wrapper, so every part of the enlarged image can be reached by scrolling
      full.style.inlineSize = level === 1 ? '' : (level * 100) + '%';
      full.style.maxInlineSize = level === 1 ? '' : 'none';
      full.style.maxBlockSize = level === 1 ? '' : 'none';
      var out = dialog.querySelector('[data-ds-zoom="out"]');
      if (out) out.setAttribute('aria-disabled', String(level <= 1));
      if (DS.announce) DS.announce('Zoom ' + Math.round(level * 100) + '%', 'polite');
    }
    dialog.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ds-zoom]');
      if (!b || !dialog.contains(b)) return;
      if (b.getAttribute('data-ds-zoom') === 'in') level = Math.min(level + 0.5, 3);
      else if (level > 1) level = Math.max(level - 0.5, 1);
      else return;
      apply();
    });
    dialog.addEventListener('close', function () { level = 1; full.style.inlineSize = full.style.maxInlineSize = full.style.maxBlockSize = ''; });
  });
})();
