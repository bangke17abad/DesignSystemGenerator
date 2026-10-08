/* SearchField · progressive enhancement only (§6.4). Without JS: <search><form method="get"> submits on Enter; Esc clears natively.
   Adds: labelled "Clear search" IconButton (only while there is text, focus back to the input, "Search cleared" polite),
   live variant: filtering after --timing-debounce (paused during IME composition, Enter runs at once, focus never moves),
   submit variant: Enter / Search runs the search, empty query ignored, Search button aria-busy (no second press),
   result count shown near the results (aria-controls region) and announced polite once per stable result (ICU-like plural),
   EmptyState that repeats the query (bdi), maxlength as a visible error instead of silent truncation,
   phone full-screen view opened from a top-bar "Search" IconButton (Esc on an empty query / Back closes, focus returns).
   Strings come from data-* attributes (glossary) with en-US fallbacks. */
DS.register('search-field', function (el) {
  var input = el.querySelector('.ds-search-field__input');
  if (!input) return;
  var form = input.form;
  var variant = el.getAttribute('data-variant') || 'live';
  var group = input.parentNode;
  var field = input.closest('.ds-text-field');
  var results = document.getElementById(input.getAttribute('aria-controls') || '');
  var view = el.closest('.ds-search-field__view');
  var submitBtn = el.querySelector('.ds-search-field__submit');
  var root = document.documentElement;
  var lang = (el.closest('[lang]') || root).getAttribute('lang') || 'en-US';
  var debounceMs = parseFloat(getComputedStyle(root).getPropertyValue('--timing-debounce')) || 300;
  var minVisible = parseFloat(getComputedStyle(root).getPropertyValue('--timing-indicator-min-visible')) || 500;
  var t = function (k, d) { return el.getAttribute('data-' + k) || d; };
  var blocked = function () { return input.getAttribute('aria-disabled') === 'true'; };
  var reasonText = function () {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/);
    for (var i = 0; i < ids.length; i++) { var r = ids[i] && document.getElementById(ids[i]); if (r && /__reason/.test(r.className)) return r.textContent.trim(); }
    return '';
  };
  var norm = function (s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase(lang).replace(/\s+/g, ' ').trim(); };
  var graphemes = function (s) { if (!(window.Intl && Intl.Segmenter)) return Array.from(s).length; var n = 0, it = new Intl.Segmenter(lang, { granularity: 'grapheme' }).segment(s)[Symbol.iterator](); while (!it.next().done) n++; return n; };

  // Clear: an existing <button type="reset"> (works without JS) or one rendered here
  var clear = group.querySelector('.ds-text-field__clear');
  if (!clear && !blocked() && !input.readOnly) {
    clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'ds-text-field__clear';
    clear.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-close"/></svg>';
    group.appendChild(clear);
  }
  if (clear) clear.setAttribute('aria-label', t('clear-label', 'Clear search'));
  var syncClear = function () { if (clear) clear.hidden = !input.value || blocked(); };

  // inline error (only for queries that cannot be processed, e.g. over the maximum length)
  var errorEl = function (create) {
    var e = field.querySelector('.ds-text-field__error');
    if (!e && create) {
      e = document.createElement('p');
      e.className = 'ds-text-field__error';
      e.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-critical"/></svg><span></span>';
      var after = field.querySelector(':scope > .ds-search-field__row, :scope > .ds-text-field__group');
      after.insertAdjacentElement('afterend', e);
    }
    if (e && !e.id) e.id = (input.id || 'ds-search') + '-error';
    return e;
  };
  var setError = function (msg) {
    var e = errorEl(!!msg);
    if (!e) return;
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== e.id; });
    if (msg) { e.querySelector('span').textContent = msg; e.hidden = false; ids.unshift(e.id); input.setAttribute('aria-invalid', 'true'); }
    else { e.hidden = true; input.removeAttribute('aria-invalid'); }
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  };
  var maxLen = parseInt(input.getAttribute('data-max-length') || el.getAttribute('data-max-length') || '256', 10);
  var tooLong = function () { return graphemes(input.value) > maxLen; };

  // results
  var countText = function (n, q) {
    if (n === 0) return t('count-zero', 'No results for “{query}”').replace('{query}', q);
    var cat = new Intl.PluralRules(lang).select(n);
    var tpl = t('count-' + cat, '') || (cat === 'one' ? t('count-one', '# result') : t('count-other', '# results'));
    return tpl.replace('#', new Intl.NumberFormat(lang).format(n));
  };
  var lastAnnounced = null;
  var run = function () {
    if (!results) return;
    var raw = input.value.replace(/[\r\n]+/g, ' ');
    var q = norm(raw);
    var items = results.querySelectorAll('[data-search-text]');
    var n = 0;
    Array.prototype.forEach.call(items, function (it) {
      var hit = !q || norm(it.getAttribute('data-search-text') + ' ' + it.textContent).indexOf(q) >= 0;
      it.hidden = !hit;
      if (hit) n++;
    });
    var count = results.querySelector('.ds-search-field__count');
    var empty = results.querySelector('.ds-search-field__empty');
    var list = results.querySelector('.ds-search-field__list');
    var display = raw.trim();
    if (count) { count.textContent = countText(n, display); count.hidden = !!(q && n === 0 && empty); } // the EmptyState repeats the query
    if (empty) {
      empty.hidden = !(q && n === 0);
      var qEl = empty.querySelector('.ds-search-field__query');
      if (qEl) qEl.textContent = display;
    }
    if (list) list.hidden = q && n === 0;
    results.removeAttribute('aria-busy');
    var msg = q ? countText(n, display) : '';
    if (q && msg !== lastAnnounced) { DS.announce(msg, 'polite'); lastAnnounced = msg; }
    if (!q) lastAnnounced = null;
  };

  var timer = 0, composing = false;
  var schedule = function () {
    clearTimeout(timer);
    if (tooLong()) { setError(t('msg-too-long', 'Use # characters or fewer').replace('#', new Intl.NumberFormat(lang).format(maxLen))); return; }
    if (input.getAttribute('aria-invalid') === 'true') setError('');
    if (variant !== 'live') return;
    timer = setTimeout(run, debounceMs);
  };
  input.addEventListener('compositionstart', function () { composing = true; });
  input.addEventListener('compositionend', function () { composing = false; syncClear(); schedule(); });
  input.addEventListener('input', function () { syncClear(); if (!composing) schedule(); });

  var doClear = function () {
    input.value = '';
    syncClear();
    setError('');
    clearTimeout(timer);
    run();
    input.focus();
    DS.announce(t('cleared-text', 'Search cleared'), 'polite');
  };
  if (clear) clear.addEventListener('click', function (e) { e.preventDefault(); doClear(); });

  if (form) form.addEventListener('submit', function (e) {
    if (blocked()) { e.preventDefault(); DS.announce(reasonText(), 'polite'); return; }
    var q = input.value.trim();
    if (variant === 'live') { e.preventDefault(); clearTimeout(timer); if (!tooLong()) run(); return; }
    if (!q || tooLong()) { e.preventDefault(); return; } // empty query is ignored; over-long shows its error
    if (submitBtn && submitBtn.getAttribute('aria-busy') === 'true') { e.preventDefault(); return; } // no second press
    if (!form.hasAttribute('data-ds-preview')) return; // real search: native GET to the results page (focus goes to its h1)
    e.preventDefault();
    if (submitBtn) submitBtn.setAttribute('aria-busy', 'true');
    if (results) results.setAttribute('aria-busy', 'true'); // old results stay visible while loading
    group.insertAdjacentHTML('beforeend', '<span class="ds-text-field__spinner" aria-hidden="true"></span>');
    setTimeout(function () {
      var s = group.querySelector('.ds-text-field__spinner');
      if (s) s.remove();
      if (submitBtn) submitBtn.removeAttribute('aria-busy');
      run();
    }, minVisible);
  });

  // Esc: clear a non-empty query; on an empty one, close the full-screen view
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (input.value) { e.preventDefault(); if (!blocked()) doClear(); return; }
    if (view && view.hasAttribute('data-open') && !view.hasAttribute('data-static')) { e.preventDefault(); closeView(); }
  });

  // phone full-screen view
  var opener = view && view.id ? document.querySelector('[data-ds-search-open="' + view.id + '"]') : null;
  var closeView = function () {
    if (!view) return;
    view.removeAttribute('data-open');
    if (opener) { opener.setAttribute('aria-expanded', 'false'); opener.focus(); }
  };
  if (view && !view.__dsView && !view.hasAttribute('data-static')) {
    view.__dsView = true;
    view.setAttribute('data-enhanced', '');
    if (opener) {
      opener.setAttribute('data-enhanced', '');
      opener.setAttribute('aria-expanded', 'false');
      opener.setAttribute('aria-controls', view.id);
      opener.addEventListener('click', function () { view.setAttribute('data-open', ''); opener.setAttribute('aria-expanded', 'true'); input.focus(); });
    }
    var back = view.querySelector('.ds-search-field__back');
    if (back) back.addEventListener('click', closeView);
  }

  syncClear();
  if (variant === 'live' && input.value && results && !results.hasAttribute('data-ds-static')) run();
});
