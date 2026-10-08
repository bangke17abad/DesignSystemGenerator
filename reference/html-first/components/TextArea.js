/* TextArea · progressive enhancement only (§6.4). The native textarea submits and validates without JS; the server renders the
   counter's first value. Adds: live counter (grapheme clusters), polite announcements at 80% and 100% only (never per keystroke,
   no aria-live on the counter), over-limit state (no truncation, no native maxlength) and auto-grow where field-sizing is missing.
   Strings: data-msg-left-one/-other, data-msg-over-one/-other on the root ("#" = number), en-US fallbacks. */
DS.register('text-area', function (el) {
  var ta = el.querySelector('.ds-text-area__input');
  if (!ta) return;
  var counter = el.querySelector('.ds-text-area__counter');
  var counterText = counter && (counter.querySelector('[data-counter-text]') || counter);
  var max = parseInt(ta.getAttribute('data-max-length'), 10) || 0;
  var rules = window.Intl && Intl.PluralRules ? new Intl.PluralRules(document.documentElement.lang || 'en') : null;
  var seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var count = function (s) { if (!seg) return Array.from(s).length; var n = 0; for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) n++; return n; };
  var msg = function (kind, n) {
    var cat = rules ? rules.select(n) : (n === 1 ? 'one' : 'other');
    var t = el.getAttribute('data-msg-' + kind + '-' + cat) || el.getAttribute('data-msg-' + kind + '-other');
    if (!t) t = kind === 'left' ? (n === 1 ? '# character left' : '# characters left') : (n === 1 ? '# character too many' : '# characters too many');
    return t.replace('#', n.toLocaleString());
  };
  var zone = 'ok'; // ok | near | full | over — announcements fire only when the zone changes
  function update(initial) {
    if (!max || !counter) return;
    var n = count(ta.value);
    var over = n > max;
    counterText.textContent = over ? msg('over', n - max) : n.toLocaleString() + '/' + max.toLocaleString();
    el.toggleAttribute('data-over-limit', over);
    if (over) ta.setAttribute('aria-invalid', 'true');
    else if (!el.querySelector('.ds-text-area__error:not([hidden])')) ta.removeAttribute('aria-invalid');
    var z = over ? 'over' : n === max ? 'full' : n >= max * 0.8 ? 'near' : 'ok';
    if (!initial && z !== zone && z !== 'ok') DS.announce(z === 'over' ? msg('over', n - max) : msg('left', max - n), 'polite');
    zone = z;
  }
  ta.addEventListener('input', function () { update(false); });
  update(true);
  // auto-grow fallback: grow per line up to max rows, measured once per frame
  if (!(window.CSS && CSS.supports && CSS.supports('field-sizing', 'content')) && el.getAttribute('data-variant') !== 'fixed') {
    var raf = 0;
    var grow = function () {
      raf = 0;
      ta.style.blockSize = 'auto';
      var cs = getComputedStyle(ta);
      var maxH = parseFloat(cs.maxBlockSize) || Infinity;
      ta.style.blockSize = Math.min(ta.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth), maxH) + 'px';
    };
    ta.addEventListener('input', function () { if (!raf) raf = requestAnimationFrame(grow); });
    grow();
  }
});
