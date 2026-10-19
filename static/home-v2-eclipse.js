// Home v2, ECLIPSE: the full name spelled out folds into its initials, then a rail on the right walks through the three tools: HybriDock-Pep, LATTE, LOCKR.
// On the left a short text and a small animation run each stage; then the rail fills to the next stop.
// Called from home-v2.js:  var ec = HVEclipse(pin, K, helpers);  ec.update(s, t) every frame, ec.setData(pepData) once the real coordinates are loaded.
window.HVEclipse = function (pin, K, H) {
  var T = H.T, clamp = H.clamp, ramp = H.ramp, ease = H.ease, lerp = function (a, b, t) { return a + (b - a) * t; };
  var ec = pin.querySelector('.hv-ec'), dark = pin.querySelector('.hv-dark');
  if (!ec || !dark) return null;
  var intro = ec.querySelector('.hv-ec-intro'), word = ec.querySelector('.hv-ec-word'), rail = ec.querySelector('.hv-ec-rail'), fill = rail.querySelector('.fill'), pal = rail.querySelector('.hv-ec-pal');
  // the name folds into ECLIPSE with transforms only (no font-size or width changes, so nothing re-wraps mid-scroll): the rest of each word fades,
  // and seven letters that start exactly on top of the initials glide and grow into the word. Positions are measured once (and on resize / font load).
  var rests = [].slice.call(word.querySelectorAll('.r')), inis = [].slice.call(word.querySelectorAll('.i')), mascot = intro.querySelector('.hv-ec-mascot');
  var fin = document.createElement('div'); fin.className = 'hv-ec-final'; fin.setAttribute('aria-hidden', 'true');
  fin.innerHTML = inis.map(function (c) { return '<span class="L">' + c.textContent + '</span>'; }).join('') + '<span class="hl"></span>'; intro.appendChild(fin);
  var Ls = [].slice.call(fin.querySelectorAll('.L')), hl = fin.querySelector('.hl'), M = null;
  if (document.fonts) document.fonts.ready.then(function () { M = null; });
  function measure(W, narrow) {
    word.style.fontSize = (narrow ? W * .085 : Math.min(W * .05, 76)).toFixed(1) + 'px';
    fin.style.fontSize = (narrow ? W * .2 : Math.min(W * .13, 190)).toFixed(1) + 'px';
    var fw = fin.offsetWidth, fh = fin.offsetHeight, fl = (intro.offsetWidth - fw) / 2, ft = word.offsetTop + word.offsetHeight / 2 - fh / 2;
    fin.style.left = fl.toFixed(1) + 'px'; fin.style.top = ft.toFixed(1) + 'px';
    return { W: W, d: Ls.map(function (L, k) { var c = inis[k]; return { x: c.offsetLeft - (fl + L.offsetLeft), y: c.offsetTop - (ft + L.offsetTop), s: c.offsetHeight / L.offsetHeight }; }) };
  }
  var nodes = [].slice.call(ec.querySelectorAll('.hv-ec-node')), panels = [].slice.call(ec.querySelectorAll('.hv-ec-panel'));
  var NS = 'http://www.w3.org/2000/svg';
  var el = function (svg, n, a, parent) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); (parent || svg).appendChild(e); return e; };

  // The three illustrations are the originals' own renderers: Hybri3D (hybridock-3d.js, real poses of our MDM2 test run) and Lockr3D (lockr-3d.js, the real cage from our PDBs).
  var DATA = {}, loading = {};
  function need(key, url, cb) {
    if (DATA[key]) return cb && cb(DATA[key]);
    if (loading[key]) { loading[key].push(cb); return; }
    loading[key] = [cb];
    fetch(url).then(function (r) { return r.json(); }).then(function (d) { DATA[key] = d; loading[key].forEach(function (f) { f && f(d); }); H.kick && H.kick(); }).catch(function () {});
  }
  var win = function (k, a, b) { return ease(ramp(k, a, b)); };

  // 1. HybriDock-Pep: a random coil of a peptide flies into the groove on the protein, the real peptide shows over it, the score locks in
  function hybri(box) {
    var cv = box.querySelector('canvas'), h3 = null, tried = false;
    function init() { if (tried || !window.Hybri3D) return; tried = true; need('hp', 'static/hybridock-data.json?v=2', function (d) { try { h3 = window.Hybri3D(cv, d); } catch (e) {} }); }
    function set(k, t) {
      init(); if (!h3) return;
      var f = win(k, .16, .8);
      h3.render({ rec: win(k, 0, .1), hero: win(k, .05, .13), hfly: f, step: true, halo: win(k, .82, .9), xt: win(k, .88, .96), spin: -.3 + .5 * k, tilt: 0, sx: 0, sy: 0, zoom: 1, t: t * .1 });
    }
    return { set: set, init: init };
  }

  // 2. LATTE: the binder walks the latch one position at a time, each position is scored (REU, lower is better), and it settles on the lowest
  var N = 40, BEST = 23, rr = (function (seed) { var x = seed; return function () { x = (x * 16807) % 2147483647; return x / 2147483647; }; })(11);
  var REU = (function () { var o = []; for (var i = 0; i < N; i++) { var d = Math.abs(i - BEST), v = .28 + .5 * Math.min(1, d / 14) + .2 * rr(); if (i === BEST) v = .1; else if (v < .22) v += .12; o.push(-(1 - v) * 200); } return o; })();
  var reuAt = function (i) { var a = clamp(Math.floor(i), 0, N - 1), b = clamp(a + 1, 0, N - 1); return lerp(REU[a], REU[b], i - a); };
  function latte(box) {
    var cv = box.querySelector('canvas'), v = null, tried = false;
    function init() { if (tried || !window.Lockr3D) return; tried = true; need('lk', 'static/lockr-motion.json?v=3', function (d) { try { v = window.Lockr3D(cv, JSON.parse(JSON.stringify(d))); } catch (e) {} }); }
    function set(k) {
      init(); if (!v) return 0;
      var walk = ease(ramp(k, .04, .72)), fin = ease(ramp(k, .8, 1)), i = k < .04 ? -1 : lerp(walk * (N - 1), BEST, ease(ramp(k, .72, .84)));
      v.render({ build: 1, open: 1, tgt: 1, hide: 1, focus: 1, spin: .5 * k, face: 1, tilt: .12, fitK: .95, wide: 1, try: -1, win: i < 0 ? -1 : clamp(i, 0, N - 1), winBest: fin });
      return i < 0 ? 0 : Math.round(clamp(i, 0, N - 1)) + 1;
    }
    return { set: set, init: init };
  }

  // 3. LOCKR: the cage builds, PfLDH flies in and docks, the latch swings open, LucKey clips on, furimazine drops fall, it glows
  function lockr(box) {
    var cv = box.querySelector('canvas'), v = null, tried = false;
    function init() { if (tried || !window.Lockr3D) return; tried = true; need('lk', 'static/lockr-motion.json?v=3', function (d) { try { v = window.Lockr3D(cv, JSON.parse(JSON.stringify(d))); } catch (e) {} }); }
    function set(k) {
      init(); if (!v) return;
      v.render({ build: win(k, 0, .16), tgt: win(k, .16, .38), open: win(k, .32, .52), key: win(k, .52, .7), drop: win(k, .68, .84), glow: win(k, .82, .96), spin: -.4 + .9 * k, tilt: .18 });
    }
    return { set: set, init: init };
  }


  // ---- the widgets in the three stage panels
  // HybriDock-Pep: the same peptide docked to malaria LDH and to human LDH (hb-data.json: sel.t / sel.o, ten best poses each); dots drop onto two lanes
  var selDots = [], selMeans = [];
  need('hb', 'static/hb-data.json?v=1', function (d) {
    var lo = -9.2, hi = -5.8, X = function (v) { return ((v - lo) / (hi - lo) * 100).toFixed(2) + '%'; };
    [['t', d.sel.t], ['o', d.sel.o]].forEach(function (row) {
      var tr = panels[0].querySelector('.lane[data-k="' + row[0] + '"] .tr'), placed = [];
      row[1].slice().sort(function (a, b) { return a - b; }).forEach(function (v) {
        var lvl = 0; while (placed.some(function (p) { return p.l === lvl && Math.abs(p.v - v) < .1; })) lvl++; placed.push({ v: v, l: lvl });
        var dot = document.createElement('i'); dot.style.left = X(v); dot.style.setProperty('--lv', lvl); tr.appendChild(dot); selDots.push(dot);
      });
      var m = row[1].reduce(function (a, b) { return a + b; }, 0) / row[1].length, mk = document.createElement('b'); mk.style.left = X(m); mk.textContent = m.toFixed(2); tr.appendChild(mk); selMeans.push(mk);
    });
  });
  // LATTE: one bar per latch position, filling in as the binder walks the latch; the lowest score lights up at the end
  var barsEl = panels[1].querySelector('.bars'), bestEl = panels[1].querySelector('.best'), bars = REU.map(function (v, i) { var b = document.createElement('i'); b.style.height = (-v / 2).toFixed(1) + '%'; barsEl.appendChild(b); return b; });
  // LOCKR: PfLB-1's sequence as tiles, greasy and charged residues coloured
  var SEQ = 'LISDAELEAIFAEELDC', tilesEl = panels[2].querySelector('.tiles'), tiles = SEQ.split('').map(function (a) { var t = document.createElement('i'); t.textContent = a; t.className = 'LIAFVMW'.indexOf(a) >= 0 ? 'g' : 'DEKR'.indexOf(a) >= 0 ? 'c' : ''; tilesEl.appendChild(t); return t; });
  function widgets(i, k, r) {
    if (i === 0) {
      var n = selDots.length; selDots.forEach(function (d, j) { var e = ease(clamp((k - .45 - j / n * .35) / .1, 0, 1)); d.style.opacity = e.toFixed(3); d.style.setProperty('--dy', ((1 - e) * -18).toFixed(1) + 'px'); });
      selMeans.forEach(function (m) { m.style.opacity = ease(ramp(k, .82, .9)).toFixed(3); });
      panels[0].querySelector('.res').style.opacity = ease(ramp(k, .88, .96)).toFixed(3);
    }
    if (i === 1) {
      var fin = ease(ramp(k, .8, 1));
      bars.forEach(function (b, j) { b.className = j < (r || 0) ? (j === BEST && fin > .5 ? 'on best' : 'on') : ''; });
      bestEl.textContent = fin > .5 ? 'best: position ' + (BEST + 1) : (r ? 'position ' + r : '');
    }
    if (i === 2) { var lit = Math.round(ease(ramp(k, .02, .3)) * tiles.length); tiles.forEach(function (t, j) { t.classList.toggle('on', j < lit); }); }
  }

  var anims = [hybri(ec.querySelector('#hv-an0')), latte(ec.querySelector('#hv-an1')), lockr(ec.querySelector('#hv-an2'))];

  var warmed = false, stat1 = panels[1].querySelector('.n'), steps = [].slice.call(panels[2].querySelectorAll('.steps li'));
  function update(s, t) {
    var dk = ease(ramp(s, K.dark[0], K.dark[1]));
    dark.style.opacity = dk.toFixed(3);
    if (dk > 0 && !warmed) { warmed = true; anims.forEach(function (a) { a.init(); }); }
    var show = dk > .004; ec.style.visibility = show ? 'visible' : 'hidden';
    if (!show) return;
    var W = pin.clientWidth, Hh = pin.clientHeight, narrow = W <= 860;
    // 1. the name, spelled out, collapses into its initials: every word but its first letter folds away and the type grows into ECLIPSE
    var io = ease(ramp(s, K.ringIn[0], K.ringIn[1])), f = ramp(s, K.acro[0] + .3, K.acro[1] + .3), out = ease(ramp(s, K.ecZoom[0], K.ecZoom[0] + .5));
    if (!M || M.W !== W) M = measure(W, narrow);
    rests.forEach(function (r, i) { r.style.opacity = (1 - ease(ramp(f, i * .035, .3 + i * .035))).toFixed(3); });
    Ls.forEach(function (L, k) { var g = ease(ramp(f, .25 + k * .06, .55 + k * .06)), d = M.d[k], sc = d.s + (1 - d.s) * g;
      L.style.transform = 'translate3d(' + (d.x * (1 - g)).toFixed(1) + 'px,' + (d.y * (1 - g)).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')'; });
    hl.style.transform = 'scaleX(' + ease(ramp(f, .84, 1)).toFixed(4) + ')';
    if (mascot) { var me = ramp(f, .86, 1), mb = me <= 0 ? 0 : 1 + 2.70158 * Math.pow(me - 1, 3) + 1.70158 * Math.pow(me - 1, 2); mascot.style.transform = 'scale(' + mb.toFixed(4) + ') rotate(' + (-8 - 30 * (1 - me)).toFixed(1) + 'deg)'; }
    intro.style.opacity = (io * (1 - out)).toFixed(3); intro.style.transform = 'translate3d(-50%, calc(-50% + ' + ((1 - io) * 30 - out * 60).toFixed(1) + 'px), 0)';
    intro.style.visibility = io * (1 - out) > .003 ? 'visible' : 'hidden';
    // 2. a rail on the right fills as you go through the three tools; the mascot rides the head of the fill
    var a0 = K.anim[0][0], a1 = K.anim[2][1], prog = clamp((s - a0) / (a1 - a0), 0, 1), ro = ease(ramp(s, K.ecZoom[0], K.ecZoom[1])) * (narrow ? 0 : 1);
    var top = Hh * .2, bot = Hh * .8, x = W * .9;
    rail.style.opacity = ro.toFixed(3); rail.style.left = x.toFixed(1) + 'px'; rail.style.top = top.toFixed(1) + 'px'; rail.style.height = (bot - top).toFixed(1) + 'px';
    fill.style.transform = 'scaleY(' + prog.toFixed(4) + ')';
    pal.style.transform = 'translate3d(8px, ' + ((bot - top) * prog - 30).toFixed(1) + 'px, 0) rotate(' + (Math.sin(s * 3) * 6).toFixed(1) + 'deg)';
    var pos = ease(ramp(s, K.rot12[0], K.rot12[1])) + ease(ramp(s, K.rot23[0], K.rot23[1]));
    nodes.forEach(function (n, i) {
      var at = (K.anim[i][0] - a0) / (a1 - a0), y = top + (bot - top) * at, w = 1 - clamp(Math.abs(i - pos), 0, 1);
      n.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      n.style.opacity = ro.toFixed(3); n.classList.toggle('on', prog >= at - .001); n.style.setProperty('--ns', (1 + .45 * w).toFixed(3)); n.style.setProperty('--nl', (.45 + .55 * w).toFixed(3));
    });
    // the stage panels
    panels.forEach(function (p, i) {
      var w = K.panels[i], po = ease(ramp(s, w[0], w[1])) * (1 - ease(ramp(s, w[2], w[3])));
      p.style.setProperty('--po', po.toFixed(3)); p.style.visibility = po > .003 ? 'visible' : 'hidden'; p.classList.toggle('is-on', po > .5);
      if (po > .003) {
        var k = ramp(s, K.anim[i][0], K.anim[i][1]), r = anims[i].set(k, t);
        if (i === 1) stat1.textContent = r || 0;
        widgets(i, k, r);
        if (i === 2) { var at = k < .16 ? 0 : k < .38 ? 1 : k < .52 ? 2 : k < .7 ? 3 : 4; steps.forEach(function (li, j) { li.classList.toggle('on', j <= at); }); }
      }
    });
  }
  return { update: update, setData: function () {}, live: function (s) { return s > K.panels[0][0] - .2 && s < K.panels[0][3] + .2; } };
};
