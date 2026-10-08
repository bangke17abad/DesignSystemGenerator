/* Kbd · engine 1.8.0 reference module (catalog/components/Kbd.json). Progressive enhancement only (§6.4):
   static markup is the Windows/Linux format with a full readable name, which is the no-JS fallback.
   Markup: kbd.ds-kbd[data-ds-module="kbd"][data-keys="Mod+K"][data-variant="combination|single|sequence"][data-platform="auto|mac|windows|linux"].
   - "Mod" maps to ⌘ (Command) on Apple platforms and Ctrl (Control) elsewhere; modifiers are re-ordered per OS (L14):
     macOS ⌃ ⌥ ⇧ ⌘ without separator, Windows/Linux Ctrl+Alt+Shift with "+".
   - readable name: key names joined with the localised word (data-plus, default "plus"; data-then, default "then"),
     never the raw symbol. Elements that own the shortcut carry aria-keyshortcuts; Kbd is display only.
   DS.kbd.render(el) and DS.kbd.label(keys) are reused by Menu, Tooltip and CommandPalette. */
(function () {
  var DS = (window.DS = window.DS || {});
  var plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  var APPLE = /mac|iphone|ipad|ipod|ios/i.test(plat);
  // [windows/linux glyph, windows/linux name, mac glyph, mac name]
  var KEYS = {
    Mod: ['Ctrl', 'Control', '⌘', 'Command'],
    Control: ['Ctrl', 'Control', '⌃', 'Control'],
    Ctrl: ['Ctrl', 'Control', '⌃', 'Control'],
    Alt: ['Alt', 'Alt', '⌥', 'Option'],
    Shift: ['Shift', 'Shift', '⇧', 'Shift'],
    Meta: ['Win', 'Windows', '⌘', 'Command'],
    Enter: ['Enter', 'Enter', '↵', 'Return'],
    Escape: ['Esc', 'Escape', 'Esc', 'Escape'],
    Esc: ['Esc', 'Escape', 'Esc', 'Escape'],
    Tab: ['Tab', 'Tab', '⇥', 'Tab'],
    Backspace: ['Backspace', 'Backspace', '⌫', 'Delete'],
    Delete: ['Del', 'Delete', '⌦', 'Forward delete'],
    Space: ['Space', 'Space', 'Space', 'Space'],
    ArrowUp: ['↑', 'Up arrow', '↑', 'Up arrow'],
    ArrowDown: ['↓', 'Down arrow', '↓', 'Down arrow'],
    ArrowLeft: ['←', 'Left arrow', '←', 'Left arrow'],
    ArrowRight: ['→', 'Right arrow', '→', 'Right arrow'],
    PageUp: ['PgUp', 'Page up', 'PgUp', 'Page up'],
    PageDown: ['PgDn', 'Page down', 'PgDn', 'Page down']
  };
  var ORDER_MAC = ['Control', 'Ctrl', 'Alt', 'Shift', 'Mod', 'Meta'];
  var ORDER_WIN = ['Mod', 'Control', 'Ctrl', 'Meta', 'Alt', 'Shift'];

  function isMac(platform) { return platform === 'mac' || ((!platform || platform === 'auto') && APPLE); }
  function parse(keys, variant) {
    if (!keys) return [];
    return variant === 'sequence' ? keys.trim().split(/\s+/) : keys.split('+').map(function (k) { return k.trim(); }).filter(Boolean);
  }
  function sortMods(list, mac) {
    var order = mac ? ORDER_MAC : ORDER_WIN;
    var mods = list.filter(function (k) { return order.indexOf(k) >= 0; });
    var rest = list.filter(function (k) { return order.indexOf(k) < 0; });
    mods.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
    return mods.concat(rest);
  }
  function glyph(k, mac) { var d = KEYS[k]; return d ? d[mac ? 2 : 0] : (k.length === 1 ? k.toUpperCase() : k); }
  function name(k, mac) { var d = KEYS[k]; return d ? d[mac ? 3 : 1] : (k.length === 1 ? k.toUpperCase() : k); }

  /* readable label, e.g. "Control plus K", "Command K", "G then I" */
  function label(keys, opts) {
    opts = opts || {};
    var variant = opts.variant || (/\s/.test((keys || '').trim()) && !/\+/.test(keys) ? 'sequence' : 'combination');
    var mac = isMac(opts.platform);
    var list = parse(keys, variant);
    if (variant !== 'sequence') list = sortMods(list, mac);
    var words = list.map(function (k) { return name(k, mac); });
    if (variant === 'sequence') return words.join(' ' + (opts.then || 'then') + ' ');
    return words.join(mac ? ' ' : ' ' + (opts.plus || 'plus') + ' ');
  }

  function render(el) {
    var keys = el.getAttribute('data-keys');
    if (!keys) { el.hidden = true; return; } // empty shortcut: not rendered
    var variant = el.getAttribute('data-variant') || (parse(keys, 'combination').length > 1 ? 'combination' : 'single');
    var platform = el.getAttribute('data-platform') || 'auto';
    var mac = isMac(platform);
    var list = parse(keys, variant);
    if (variant !== 'sequence') list = sortMods(list, mac);
    var opts = { variant: variant, platform: platform, plus: el.getAttribute('data-plus'), then: el.getAttribute('data-then') };
    el.setAttribute('dir', 'ltr');
    el.setAttribute('data-variant', variant);
    el.textContent = '';
    var vh = document.createElement('span');
    vh.className = 'ds-vh';
    vh.textContent = el.getAttribute('data-label') || label(keys, opts);
    var vis = document.createElement('span');
    vis.className = 'ds-kbd__keys';
    vis.setAttribute('aria-hidden', 'true');
    list.forEach(function (k, i) {
      if (i > 0 && (variant === 'sequence' || !mac)) {
        var sep = document.createElement('span');
        sep.className = 'ds-kbd__sep';
        sep.textContent = variant === 'sequence' ? (opts.then || 'then') : '+';
        vis.appendChild(sep);
      }
      var key = document.createElement('kbd');
      key.className = 'ds-kbd__key';
      key.textContent = glyph(k, mac);
      vis.appendChild(key);
    });
    el.appendChild(vh);
    el.appendChild(vis);
  }

  /* aria-keyshortcuts value for an element that owns the shortcut ("Mod+K" -> "Meta+K" on Apple, "Control+K" elsewhere) */
  function ariaValue(keys) {
    var mac = isMac('auto');
    return parse(keys, 'combination').map(function (k) { return k === 'Mod' ? (mac ? 'Meta' : 'Control') : k === 'Ctrl' ? 'Control' : k; }).join('+');
  }

  DS.kbd = { render: render, label: label, isMac: function () { return APPLE; }, ariaValue: ariaValue };
  DS.register('kbd', function (el) {
    var p = el.getAttribute('data-platform');
    if (p === 'windows' || p === 'linux') return; // static markup is already in this format
    if (p === 'mac' || APPLE) render(el);
  });
})();
