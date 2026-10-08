/* FileDropzone · progressive enhancement only (§6.4). Without JS the labelled <input type="file"> (inside the "Choose files" label)
   submits with a multipart form; server-rendered items (existing files) stay listed. Adds ([data-enhanced]):
   - drop on the zone (thick border + "Drop to upload"; known unaccepted types show "This file type isn't accepted" with an icon);
     drops outside the zone never open the file in the tab; clicking the zone opens the same picker (not a second Tab stop).
   - client validation before upload: type (accept), size (data-max-size bytes), count (data-max-files), duplicates; each rejected
     file is listed with its reason and Remove. The accepted files are kept in input.files (DataTransfer) for form submission.
   - upload through el.dsUploader(file, { signal, onProgress }) → Promise (product code); data-ds-preview simulates one for docs
     previews; without either the files are only collected ("Added"). Per file: determinate <progress> + %, Cancel (AbortSignal),
     Retry after a failure, Remove; status = locked icon + text (StatusLabel C5 / C4 / C1 / C3).
   - announcements (polite): "{n} files added", "{name} uploaded", "{name} failed", "{name} removed" — never per percent.
   - focus after Remove: next item's action, previous one, or the Choose input (§9.5); max reached: the input is aria-disabled
     with a visible reason "You can add up to {max} files" and drops are refused with the same text.
   Strings: data-i18n-* with en-US fallbacks. Static previews: data-force-zone="hover | dragover | reject". */
DS.register('file-dropzone', function (el) {
  var input = el.querySelector('.ds-file-dropzone__input');
  var zone = el.querySelector('.ds-file-dropzone__zone');
  if (!input) return;
  var list = el.querySelector('.ds-file-dropzone__list');
  var t = function (k, d, vars) { var s = el.getAttribute('data-i18n-' + k) || d; if (vars) for (var x in vars) s = s.split('{' + x + '}').join(vars[x]); return s; };
  var lang = (el.closest('[lang]') && el.closest('[lang]').getAttribute('lang')) || 'en-US';
  var plural = function (n, one, other) { return (new Intl.PluralRules(lang).select(n) === 'one' ? one : other).replace('#', new Intl.NumberFormat(lang).format(n)); };
  var maxSize = +el.getAttribute('data-max-size') || 0;
  var maxFiles = +el.getAttribute('data-max-files') || (input.multiple ? 0 : 1);
  var accept = (input.getAttribute('accept') || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  var blocked = input.getAttribute('aria-disabled') === 'true';
  var uid = el.id || input.id || ('ds-fd-' + Math.random().toString(36).slice(2, 8));
  el.setAttribute('data-enhanced', '');
  if (!list) { list = document.createElement('ul'); list.className = 'ds-file-dropzone__list'; (zone || input).insertAdjacentElement('afterend', list); }
  if (zone && el.getAttribute('data-force-zone')) {
    var fz = el.getAttribute('data-force-zone');
    if (fz === 'hover') zone.setAttribute('data-force', 'hover'); else zone.setAttribute('data-dragover', fz === 'reject' ? 'reject' : 'accept');
  }

  var size = function (b) {
    var mb = b >= 1048576, v = mb ? b / 1048576 : Math.max(1, Math.round(b / 1024));
    try { return new Intl.NumberFormat(lang, { style: 'unit', unit: mb ? 'megabyte' : 'kilobyte', maximumFractionDigits: mb ? 1 : 0 }).format(v); } catch (e) { return v + (mb ? ' MB' : ' KB'); }
  };
  var accepts = function (type, name) {
    if (!accept.length) return true;
    var n = (name || '').toLowerCase(), ty = (type || '').toLowerCase();
    return accept.some(function (a) { return a.charAt(0) === '.' ? n.slice(-a.length) === a : a.slice(-2) === '/*' ? ty.indexOf(a.slice(0, -1)) === 0 : ty === a; });
  };
  var STATUS = {
    uploading: ['info', 'info', 'Uploading'], queued: ['info', 'info', 'Waiting for connection'], success: ['positive', 'positive', 'Uploaded'],
    error: ['critical', 'critical', 'Failed'], canceled: ['neutral-negative', 'neutral-negative', 'Canceled'], added: ['', '', 'Added']
  };
  var items = [];

  // reason line for blocked / max reached (referenced by the input)
  var reasonEl = el.querySelector('.ds-file-dropzone__reason');
  function describe(node, on) {
    var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== node.id; });
    if (on) ids.push(node.id);
    if (ids.length) input.setAttribute('aria-describedby', ids.join(' ')); else input.removeAttribute('aria-describedby');
  }
  function syncLimit() {
    if (blocked) { if (zone) zone.setAttribute('data-blocked', ''); return; }
    var live = items.filter(function (it) { return it.status !== 'canceled' && (it.status !== 'error' || it.retry); }).length;
    var full = maxFiles && live >= maxFiles;
    if (full) {
      if (!reasonEl) {
        reasonEl = document.createElement('p');
        reasonEl.className = 'ds-file-dropzone__reason';
        reasonEl.id = uid + '-max';
        reasonEl.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-restricted"/></svg><span></span>';
        (zone || input).insertAdjacentElement('afterend', reasonEl);
      }
      reasonEl.querySelector('span').textContent = t('max-reached', 'You can add up to {max} files. Remove one to add another.', { max: maxFiles });
      reasonEl.hidden = false;
      describe(reasonEl, true);
      input.setAttribute('aria-disabled', 'true');
      if (zone) zone.setAttribute('data-blocked', '');
    } else {
      if (reasonEl && reasonEl.id === uid + '-max') { reasonEl.hidden = true; describe(reasonEl, false); }
      input.removeAttribute('aria-disabled');
      if (zone) zone.removeAttribute('data-blocked');
    }
  }
  function reasonText() { return reasonEl && !reasonEl.hidden ? reasonEl.textContent.trim() : ''; }

  function splitName(name) {
    var dot = name.lastIndexOf('.'), keep = Math.min(name.length, (dot > 0 ? name.length - dot : 0) + 6);
    return [name.slice(0, name.length - keep), name.slice(name.length - keep)];
  }
  function render(it) {
    var li = it.li || document.createElement('li');
    it.li = li;
    li.className = 'ds-file-dropzone__item';
    li.setAttribute('data-status', it.status);
    if (it.status === 'uploading') li.setAttribute('aria-busy', 'true'); else li.removeAttribute('aria-busy');
    var st = STATUS[it.status], parts = splitName(it.name);
    var html = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-' + (/^image\//.test(it.type || '') ? 'image' : 'file') + '"/></svg><div class="ds-file-dropzone__meta">' +
      '<span class="ds-file-dropzone__name"><span class="ds-file-dropzone__name-start"></span><span class="ds-file-dropzone__name-end"></span></span>' +
      '<span class="ds-file-dropzone__size"><bdi></bdi></span>' +
      '<span class="ds-status-label"' + (st[0] ? ' data-status="' + st[0] + '"' : '') + '><span class="ds-status-label__container">' + (st[1] ? '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-' + st[1] + '"/></svg>' : '') + '<span></span></span></span>';
    if (it.status === 'uploading') html += '<span class="ds-file-dropzone__progress"><progress max="100"></progress><span class="ds-file-dropzone__percent" data-ds-text="supporting" aria-hidden="true"><bdi></bdi></span></span>';
    if (it.detail) html += '<p class="ds-file-dropzone__detail"></p>';
    html += '</div><div class="ds-file-dropzone__actions"></div>';
    li.innerHTML = html;
    li.querySelector('.ds-file-dropzone__name-start').textContent = parts[0];
    li.querySelector('.ds-file-dropzone__name-end').textContent = parts[1];
    li.querySelector('.ds-file-dropzone__name').title = it.name;
    li.querySelector('.ds-file-dropzone__size bdi').textContent = size(it.size);
    li.querySelector('.ds-status-label__container > span').textContent = t('status-' + it.status, st[2]);
    if (it.detail) li.querySelector('.ds-file-dropzone__detail').textContent = it.detail;
    var pg = li.querySelector('progress');
    if (pg) { pg.value = it.progress || 0; pg.setAttribute('aria-label', t('uploading-label', 'Uploading {name}', { name: it.name })); li.querySelector('.ds-file-dropzone__percent bdi').textContent = new Intl.NumberFormat(lang, { style: 'percent' }).format((it.progress || 0) / 100); }
    var acts = li.querySelector('.ds-file-dropzone__actions');
    var add = function (action, iconName, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ds-file-dropzone__action';
      b.setAttribute('data-action', action);
      b.setAttribute('aria-label', label);
      b.innerHTML = '<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-' + iconName + '"/></svg>';
      acts.appendChild(b);
    };
    if (!blocked) {
      if (it.status === 'uploading' || it.status === 'queued') add('cancel', 'close', t('cancel', 'Cancel upload {name}', { name: it.name }));
      else {
        if ((it.status === 'error' && it.retry) || it.status === 'canceled') add('retry', 'refresh', t('retry', 'Retry {name}', { name: it.name }));
        add('remove', 'close', t('remove', 'Remove {name}', { name: it.name }));
      }
    }
    if (!li.parentNode) list.appendChild(li);
  }
  // adopt server-rendered items (existing files and static preview states)
  Array.prototype.forEach.call(list.querySelectorAll('.ds-file-dropzone__item'), function (li) {
    var it = { li: li, name: li.getAttribute('data-name') || (li.querySelector('.ds-file-dropzone__name') || li).textContent.trim(), size: +li.getAttribute('data-size') || 0, status: li.getAttribute('data-status') || 'success', adopted: true, retry: li.hasAttribute('data-retry') };
    items.push(it);
    if (blocked) Array.prototype.forEach.call(li.querySelectorAll('[data-action="remove"]'), function (b) { b.remove(); });
  });

  function syncInput() {
    if (!window.DataTransfer) return;
    try {
      var dt = new DataTransfer();
      items.forEach(function (it) { if (it.file && it.status !== 'error' && it.status !== 'canceled') dt.items.add(it.file); });
      input.files = dt.files;
    } catch (e) { /* older engines keep the last picked FileList */ }
  }
  var uploader = typeof el.dsUploader === 'function' ? el.dsUploader : el.hasAttribute('data-ds-preview') ? function (file, ctx) {
    return new Promise(function (resolve, reject) {
      var p = 0, tick = parseFloat(getComputedStyle(el).getPropertyValue('--motion-slow-duration')) || 300;
      (function step() {
        if (ctx.signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
        p = Math.min(100, p + 20);
        ctx.onProgress(p);
        if (p >= 100) return /fail/i.test(file.name) ? reject(new Error(t('network', 'Upload failed. Check your connection and retry.'))) : resolve({ id: file.name });
        setTimeout(step, tick);
      })();
    });
  } : null;
  function upload(it) {
    if (!uploader) { it.status = 'added'; render(it); return; }
    if (navigator.onLine === false) { it.status = 'queued'; it.detail = ''; render(it); window.addEventListener('online', function () { if (it.status === 'queued') upload(it); }, { once: true }); return; }
    it.ctrl = new AbortController();
    it.status = 'uploading'; it.progress = 0; it.detail = '';
    render(it);
    uploader(it.file, { signal: it.ctrl.signal, onProgress: function (p) {
      it.progress = p;
      var pg = it.li.querySelector('progress');
      if (pg) { pg.value = p; it.li.querySelector('.ds-file-dropzone__percent bdi').textContent = new Intl.NumberFormat(lang, { style: 'percent' }).format(p / 100); }
    } }).then(function () {
      it.status = 'success'; render(it);
      DS.announce(t('announce-uploaded', '{name} uploaded', { name: it.name }), 'polite');
    }, function (err) {
      if (it.ctrl.signal.aborted) return;
      it.status = 'error'; it.retry = true; it.detail = (err && err.message) || t('network', 'Upload failed. Check your connection and retry.');
      render(it);
      DS.announce(t('announce-failed', '{name} failed. {reason}', { name: it.name, reason: it.detail }), 'polite');
    });
  }
  function addFiles(fileList) {
    var added = 0, rejected = 0;
    Array.prototype.forEach.call(fileList, function (f) {
      var it = { file: f, name: f.name, size: f.size, type: f.type, status: 'error', retry: false };
      var live = items.filter(function (x) { return x.status !== 'error' && x.status !== 'canceled'; }).length;
      var extMatch = accept.filter(function (a) { return a.charAt(0) === '.'; }).map(function (a) { return a.slice(1).toUpperCase(); }).join(', ');
      if (!accepts(f.type, f.name)) it.detail = t('reject-type', '{name} isn’t accepted. Upload {types}.', { name: f.name, types: extMatch || t('accepted-types', 'an accepted file type') });
      else if (maxSize && f.size > maxSize) it.detail = t('reject-size', 'Larger than {max}. Choose a smaller file.', { max: size(maxSize) });
      else if (maxFiles && live >= maxFiles) it.detail = t('reject-count', 'You can add up to {max} files.', { max: maxFiles });
      else if (items.some(function (x) { return x.name === f.name && x.size === f.size && x.status !== 'error'; })) it.detail = t('reject-duplicate', 'This file is already in the list.');
      else { it.status = 'pending'; added++; }
      if (it.status === 'error') rejected++;
      items.push(it);
      if (it.status === 'pending') upload(it); else render(it);
    });
    syncInput();
    syncLimit();
    var msg = plural(added, t('added-one', '# file added'), t('added-other', '# files added'));
    if (rejected) msg += '. ' + plural(rejected, t('rejected-one', '# file can’t be added'), t('rejected-other', '# files can’t be added'));
    DS.announce(msg, 'polite');
  }

  input.addEventListener('click', function (e) {
    if (input.getAttribute('aria-disabled') === 'true') { e.preventDefault(); DS.announce(reasonText() || el.querySelector('.ds-file-dropzone__reason') && el.querySelector('.ds-file-dropzone__reason').textContent.trim() || '', 'polite'); }
  });
  input.addEventListener('change', function () {
    if (!input.files || !input.files.length) return;
    var picked = Array.prototype.slice.call(input.files);
    addFiles(picked);
    input.focus(); // focus returns to Choose files after the system picker
  });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-action]');
    if (!b) return;
    var li = b.closest('.ds-file-dropzone__item'), idx = -1;
    items.forEach(function (x, i) { if (x.li === li) idx = i; });
    var it = items[idx];
    if (!it) return;
    var action = b.getAttribute('data-action');
    if (action === 'cancel') {
      if (it.ctrl) it.ctrl.abort();
      it.status = 'canceled'; it.detail = '';
      render(it);
      syncInput(); syncLimit();
      DS.announce(t('announce-canceled', 'Upload of {name} canceled', { name: it.name }), 'polite');
      var rb = it.li.querySelector('[data-action]');
      if (rb) rb.focus();
    } else if (action === 'retry') {
      if (it.file) upload(it); else { it.status = 'uploading'; it.progress = 0; render(it); }
      var cb = it.li.querySelector('[data-action]');
      if (cb) cb.focus();
    } else if (action === 'remove') {
      var next = items[idx + 1] || items[idx - 1];
      li.remove();
      items.splice(idx, 1);
      syncInput(); syncLimit();
      DS.announce(t('announce-removed', '{name} removed', { name: it.name }), 'polite');
      var target = next && next.li.querySelector('[data-action]');
      if (target) target.focus(); else input.focus();
    }
  });

  if (!zone) return;
  var hasFiles = function (e) { var ty = e.dataTransfer && e.dataTransfer.types; return ty && Array.prototype.indexOf.call(ty, 'Files') >= 0; };
  var depth = 0;
  zone.addEventListener('dragenter', function (e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth++;
    if (blocked || input.getAttribute('aria-disabled') === 'true') return; // blocked zones never show dragover
    var mimes = accept.filter(function (a) { return a.charAt(0) !== '.'; }), ok = true;
    if (mimes.length) Array.prototype.forEach.call(e.dataTransfer.items || [], function (i) {
      if (i.kind === 'file' && i.type && !mimes.some(function (a) { return a.slice(-2) === '/*' ? i.type.indexOf(a.slice(0, -1)) === 0 : i.type === a; })) ok = false;
    });
    zone.setAttribute('data-dragover', ok ? 'accept' : 'reject');
  });
  zone.addEventListener('dragover', function (e) { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = (blocked || input.getAttribute('aria-disabled') === 'true') ? 'none' : 'copy'; } });
  zone.addEventListener('dragleave', function () { if (--depth <= 0) { depth = 0; zone.removeAttribute('data-dragover'); } });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    depth = 0;
    zone.removeAttribute('data-dragover');
    if (blocked || input.getAttribute('aria-disabled') === 'true') { DS.announce(reasonText() || (el.querySelector('.ds-file-dropzone__reason') || {}).textContent || '', 'polite'); return; }
    if (!hasFiles(e)) { DS.announce(t('drop-text', 'Drop files, not text.'), 'polite'); return; }
    addFiles(e.dataTransfer.files);
  });
  // drops that miss the zone must not open the file in the tab
  document.addEventListener('dragover', function (e) { if (hasFiles(e) && !zone.contains(e.target)) { e.preventDefault(); e.dataTransfer.dropEffect = 'none'; } });
  document.addEventListener('drop', function (e) { if (hasFiles(e) && !zone.contains(e.target)) e.preventDefault(); });
  zone.addEventListener('click', function (e) {
    if (e.target.closest('label, button, a, input') || blocked) return;
    if (input.getAttribute('aria-disabled') === 'true') { DS.announce(reasonText(), 'polite'); return; }
    input.click();
  });
  syncLimit();
});
