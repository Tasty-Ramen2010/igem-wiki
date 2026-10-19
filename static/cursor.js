(function () {
  // The uploaded mosquito cursors are 500x500 (dark default is 1254x1254) AVIFs.
  // Browsers cap custom cursors at 128x128 and silently fall back to `auto` past
  // that, and AVIF isn't reliably decodable in `cursor:` at all. So decode each
  // one to a canvas, downscale to CURSOR_PX, and hand CSS a PNG data URL.
  var CURSOR_PX = 40;

  var SOURCES = {
    light: {
      def: 'https://static.igem.wiki/teams/6112/wiki/cursor/defaultcursorlight.avif',
      click: 'https://static.igem.wiki/teams/6112/wiki/cursor/clickcursorlight.avif',
    },
  };

  // Hotspot as a fraction of the artwork, so it survives the downscale.
  // Both point at the tip of the proboscis (the bite/burst point on click).
  var HOTSPOT = {
    def: [0.06, 0.80],
    click: [0.26, 0.83],
  };

  var style = document.createElement('style');
  document.head.appendChild(style);

  var resolved = {}; // source url -> "url(...) x y"; until an AVIF decodes, style.css's plain auto/pointer applies

  function value(kind, theme) {
    var v = resolved[SOURCES[theme][kind]];
    if (!v) return null;
    return v + ', ' + (kind === 'click' ? 'pointer' : 'auto');
  }

  function render() {
    var out = [];
    ['light'].forEach(function (theme) {
      var sel = ':root';
      var decls = [];
      var d = value('def', theme);
      var c = value('click', theme);
      if (d) decls.push('--cursor-default: ' + d + ';');
      if (c) decls.push('--cursor-click: ' + c + ';');
      if (decls.length) out.push(sel + ' { ' + decls.join(' ') + ' }');
    });
    // The UA stylesheet sets `cursor: pointer` on <a href>, which beats the
    // inherited value from body — so the mosquito has to be applied explicitly.
    out.push('*, *::before, *::after { cursor: var(--cursor-default); }');
    out.push([
      'a[href], button, [role="button"], summary, label[for], select,',
      'input[type="checkbox"], input[type="radio"], input[type="submit"],',
      'input[type="button"], input[type="range"]',
    ].join(' ') + ' { cursor: var(--cursor-click); }');
    // Press state: whatever is under the pointer shows the biting mosquito.
    out.push('body.cursor-clicking, body.cursor-clicking * { cursor: var(--cursor-click) !important; }');
    style.textContent = out.join('\n');
  }

  function cornersTransparent(ctx, w, h) {
    var pts = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    for (var i = 0; i < pts.length; i++) {
      if (ctx.getImageData(pts[i][0], pts[i][1], 1, 1).data[3] > 8) return false;
    }
    return true;
  }

  function load(kind, theme) {
    var src = SOURCES[theme][kind];
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      var w = img.naturalWidth || CURSOR_PX;
      var h = img.naturalHeight || CURSOR_PX;
      var scale = CURSOR_PX / Math.max(w, h);
      var cw = Math.max(1, Math.round(w * scale));
      var ch = Math.max(1, Math.round(h * scale));

      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, cw, ch);

      // Artwork whose corners aren't transparent would paint a box around the
      // cursor, so drop it and keep the plain system cursor.
      var data;
      try {
        if (!cornersTransparent(ctx, cw, ch)) return;
        data = canvas.toDataURL('image/png');
      } catch (e) {
        return; // tainted canvas — keep the plain system cursor
      }

      var hx = Math.round(HOTSPOT[kind][0] * cw);
      var hy = Math.round(HOTSPOT[kind][1] * ch);
      resolved[src] = 'url(' + data + ') ' + hx + ' ' + hy;
      render();
    };
    img.src = src;
  }

  ['light'].forEach(function (theme) {
    ['def', 'click'].forEach(function (kind) {
      load(kind, theme);
    });
  });

  document.addEventListener('mousedown', function () {
    document.body.classList.add('cursor-clicking');
  });
  document.addEventListener('mouseup', function () {
    document.body.classList.remove('cursor-clicking');
  });
  window.addEventListener('blur', function () {
    document.body.classList.remove('cursor-clicking');
  });
})();
