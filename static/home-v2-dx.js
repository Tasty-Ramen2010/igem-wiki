// Home v2, after the story: "the test itself". One pinned scene, driven by how far you have scrolled (s, in screens):
//   0 - 1.4     "Two ideas make one malaria test."          1.2 - 2.0   the LOCKR animation pops in as a card on the left
//   1.9 - 3.1   LOCKR text on the right                      3.2 - 4.0   the card flips over and becomes the coffee-ring animation
//   3.8 - 5.0   coffee-ring text on the right                4.4 - 5.4   the four steps of the test pop in along the bottom
(function () {
  var sec = document.querySelector('.hv-dx'), pin = sec && sec.querySelector('.dx-pin');
  if (!sec) return;
  var open = pin.querySelector('.dx-open'), disc = pin.querySelector('.dx-disc'), sh = pin.querySelector('.dx-shadow'), ts = [].slice.call(pin.querySelectorAll('.dx-t')), fl = [].slice.call(pin.querySelectorAll('.dx-flow li'));
  var clamp = function (x, a, b) { return Math.max(a, Math.min(b, x)); }, ramp = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); }, ease = function (x) { return x * x * (3 - 2 * x); };
  var back = function (x) { return 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion=1/.test(location.search);
  var s = 0, shown = 0, raf = 0;
  function progress() { var r = sec.getBoundingClientRect(), vh = window.innerHeight; return clamp(-r.top / vh, 0, r.height / vh - 1) * 1.26; }   // the timeline below is 5.8 long; the section is 4.6 screens of scrolling
  function layout(s) {
    var W = pin.clientWidth, H = pin.clientHeight, narrow = W <= 860, D = narrow ? W * .86 : Math.min(W * .46, H * .66 * 16 / 9), Dh = D * 9 / 16, cx = narrow ? W / 2 : W * .29, cy = narrow ? H * .3 : H * .47;
    var oo = 1 - ease(ramp(s, .9, 1.4));
    open.style.setProperty('--op-o', oo.toFixed(3)); open.style.setProperty('--op-y', (-(1 - oo) * 6).toFixed(2) + 'vh'); open.style.visibility = oo <= 0 ? 'hidden' : 'visible';
    var li = ease(ramp(s, 1.2, 2.0)), turn = ease(ramp(s, 3.2, 4.0)), sc = li <= 0 ? 0 : li < 1 ? .15 + .85 * back(li) : 1, bump = 1 + .06 * Math.sin(Math.PI * turn);
    var lo = 1 - ease(ramp(s, 5.6, 6.0));
    disc.style.width = D.toFixed(1) + 'px'; disc.style.height = Dh.toFixed(1) + 'px';
    disc.style.transform = 'perspective(1400px) translate3d(' + (cx - D / 2).toFixed(1) + 'px,' + (cy - Dh / 2).toFixed(1) + 'px,0) rotateY(' + (turn < .5 ? turn * 180 : (turn - 1) * 180).toFixed(1) + 'deg) rotate(' + (-1.2 * (1 - turn) + 1.2 * turn).toFixed(2) + 'deg) scale(' + (sc * bump).toFixed(4) + ')';
    disc.style.opacity = (clamp(li * 4, 0, 1) * lo).toFixed(3); disc.style.setProperty('--b-o', (turn > .5 ? 1 : 0).toFixed(3));
    sh.style.width = (D * .8).toFixed(0) + 'px'; sh.style.transform = 'translate3d(' + (cx - D * .4).toFixed(1) + 'px,' + (cy + D / 2 + 22).toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')'; sh.style.opacity = (li * lo).toFixed(3);
    var w = [[1.9, 2.4, 3.0, 3.4], [3.8, 4.3, 5.4, 5.8]];
    ts.forEach(function (t, i) { var o = ease(ramp(s, w[i][0], w[i][1])) * (1 - ease(ramp(s, w[i][2], w[i][3]))); t.style.setProperty('--o', o.toFixed(3)); t.style.visibility = o > .003 ? 'visible' : 'hidden'; t.classList.toggle('is-on', o > .5); });
    fl.forEach(function (f, i) { f.style.setProperty('--o', (ease(ramp(s, 4.4 + i * .25, 4.8 + i * .25)) * lo).toFixed(3)); });
  }
  // anything marked data-rise (the explore grid) rises in as it comes up the screen: opacity, 34px and a little blur, all from the scroll position
  var rise = [].slice.call(document.querySelectorAll('[data-rise]')), sine = function (x) { return -(Math.cos(Math.PI * x) - 1) / 2; };
  function rises() {
    if (reduce) return false; var vh = window.innerHeight, moving = false;
    rise.forEach(function (el) {
      var r = el.getBoundingClientRect(), k = sine(clamp((vh - r.top) / (vh * .3), 0, 1)), cur = el._k == null ? k : el._k;
      cur += (k - cur) * .2; if (Math.abs(k - cur) < .002) cur = k; else moving = true; el._k = cur;
      el.style.setProperty('--r-o', cur.toFixed(3)); el.style.setProperty('--r-y', ((1 - cur) * 34).toFixed(1) + 'px'); el.style.setProperty('--r-b', ((1 - cur) * 8).toFixed(1) + 'px');
    });
    return moving;
  }
  function frame() {
    raf = 0; s = progress(); shown += (s - shown) * (reduce ? 1 : .18); if (Math.abs(s - shown) < .001) shown = s;
    layout(shown); var m = rises(); if (shown !== s || m) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', kick, { passive: true }); window.addEventListener('resize', kick);
  s = shown = progress(); layout(shown); kick();
})();
