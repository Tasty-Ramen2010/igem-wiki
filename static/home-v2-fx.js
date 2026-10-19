// Home v2 effects (GSAP): a background of our own protein models (cartoon renders of the PDBs), drifting with the scroll,
// and a pop-in each time a beat lands (a note, a stat card, a stage card, the ECLIPSE letters and the mascot, the explore cards).
(function () {
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]motion=1/.test(location.search);
  if (!gsap) return;
  if (ST) gsap.registerPlugin(ST);
  var $ = function (s, c) { return (c || document).querySelector(s); }, $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };

  // ---- background: [model, left %, top %, width vw]. Every piece is a render of one of our real structures, in the wiki's ink-outlined cartoon style:
  // PfLDH chains (pfA..pfD, four blues), the PfLB-1 peptide (pep gold, pep2 sky), and the LOCKR cage closed, opened by its target, and glowing with LucKey
  var DEC = {
    story: [['pfA', -4, 3, 15], ['pep', 87, 3, 8], ['cageO', 1, 72, 9], ['pfC', 89, 64, 11], ['cageG', 56, 1, 5], ['pep2', 24, 86, 5]],
    dx: [['cage', 1, 4, 8], ['pfB', -3, 72, 13], ['pep', 91, 6, 7]],
    go: [['pfA', 86, 1, 12], ['cageO', 3, 72, 8], ['pep', 2, 4, 7]],
    next: [['pfD', -3, 8, 14], ['cageG', 88, 58, 9], ['pep', 84, 6, 6]]
  };

  var snaps = {};
  Object.keys(DEC).forEach(function (k) {
    var box = $('.hv-dec[data-dec="' + k + '"]'); if (!box) return;
    DEC[k].forEach(function (d) {
      var el = document.createElement('img'); el.className = 'dc'; el.alt = ''; el.style.visibility = 'hidden'; (snaps[d[0]] = snaps[d[0]] || []).push(el);
      el.style.left = d[1] + '%'; el.style.top = d[2] + '%'; el.style.width = d[3] + 'vw';
      box.appendChild(el);
      gsap.set(el, { rotation: Math.round(Math.sin(d[1] * 7 + d[2]) * 30) });
      // drift with the scroll: the story is long, so its pieces travel further
      if (ST && !reduce) {
        var sec = box.closest('.hv-story, .hv-dx, .hv-go, .hv-next'), far = k === 'story' ? 520 : 160;
        gsap.to(el, { y: (Math.random() - .5) * far, rotation: '+=' + Math.round((Math.random() - .5) * (k === 'story' ? 120 : 50)), ease: 'none',
          scrollTrigger: { trigger: sec, start: k === 'go' || k === 'next' ? 'top bottom' : 'top top', end: k === 'go' || k === 'next' ? 'bottom top' : 'bottom bottom', scrub: 1 } });
      }
    });
  });
  // the protein snapshots: rendered once with the same ink-outlined renderers as the rest of the wiki, then used as plain images
  if (window.CartoonTube && window.Lockr3D && window.fetch) {
    Promise.all([fetch('static/malaria-pf.json?v=1').then(function (r) { return r.json(); }), fetch('static/lockr-motion.json?v=3').then(function (r) { return r.json(); })]).then(function (d) {
      var D = d[0], box = document.createElement('div'); box.style.cssText = 'position:fixed;left:-9999px;top:0;width:360px;height:360px'; document.body.appendChild(box);
      var snap = function (make) {
        var cv = document.createElement('canvas'); cv.style.cssText = 'width:360px;height:360px'; box.appendChild(cv);
        var o = make(cv), url = ''; if (o) { o(); url = cv.toDataURL('image/png'); var g = cv.getContext('webgl2') || cv.getContext('webgl'), x = g && g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
        cv.remove(); return url;
      };
      var tube = function (pts, r, col, rot) { return function (c) { var o = window.CartoonTube(c, pts, r, col); return o && function () { o.draw(rot); }; }; };
      var cage = function (P) { return function (c) { var lk = window.Lockr3D(c, JSON.parse(JSON.stringify(d[1]))); return lk && function () { lk.render(P); }; }; };
      var url = { pfA: snap(tube(D.A, .8, 0xffffff, .7)), pfB: snap(tube(D.B, .8, 0xcfe3f7, 2.4)), pfC: snap(tube(D.C, .8, 0x8ec1f0, 1.5)), pfD: snap(tube(D.D, .8, 0x5da3d9, 3.6)),
        pep: snap(tube(D.E, 1.15, 0xf0c050, .5)), pep2: snap(tube(D.E, 1.15, 0x6fb0e8, 2.2)),
        cage: snap(cage({ build: 1, open: 0, tgt: 0, spin: .4, key: 0, drop: 0, glow: 0 })),
        cageO: snap(cage({ build: 1, open: 1, tgt: 1, spin: 1.3, key: 0, drop: 0, glow: 0 })),
        cageG: snap(cage({ build: 1, open: 1, tgt: 1, spin: 2.3, key: 1, drop: 0, glow: 1 })) };
      box.remove();
      Object.keys(snaps).forEach(function (k) { if (url[k]) snaps[k].forEach(function (im) { im.src = url[k]; im.style.visibility = ''; }); });
    }).catch(function () {});
  }

  if (reduce) return;

  // ---- pop-ins: the scroll scripts toggle a class when a beat lands; when it turns on, its pieces bounce in
  var watch = function (el, cls, on, off) {
    var was = el.classList.contains(cls);
    new MutationObserver(function () { var now = el.classList.contains(cls); if (now === was) return; was = now; if (now) on(); else if (off) off(); }).observe(el, { attributes: true, attributeFilter: ['class'] });
  };
  var bounce = function (els, o) {
    els = els.filter(Boolean); if (!els.length) return;
    gsap.fromTo(els, { y: 26, opacity: 0, scale: .92 }, { y: 0, opacity: 1, scale: 1, duration: .6, stagger: .08, ease: 'back.out(2)', overwrite: true, delay: (o && o.delay) || 0 });
  };
  $$('.hv-note').forEach(function (n) { watch(n, 'is-on', function () { bounce($$('h2, .sum', n)); }); });
  var mal = $('.hv-mal'); if (mal) watch(mal, 'is-on', function () { bounce($$('.hv-pct, h2, p', mal)); });
  var costCard = $('.hv-cost-card'); if (costCard) watch(costCard, 'is-on', function () { bounce($$('h2, .big, .more, .src', costCard)); });
  var world = $('.hv-world'); if (world) watch(world, 'is-on', function () { bounce($$('.hv-stat, .src, .key', world)); });
  $$('.hv-ec-panel').forEach(function (p) { watch(p, 'is-on', function () { bounce($$('.txt > *', p)); gsap.fromTo($('.lensd', p), { scale: .8, rotation: -8 }, { scale: 1, rotation: 0, duration: .9, ease: 'elastic.out(1, .55)', overwrite: true }); }); });
  $$('.dx-t').forEach(function (t) { watch(t, 'is-on', function () { bounce($$(':scope > *', t)); }); });

  // scrubbed with the scroll: the "is hard" lines climb in one by one as the hero slides away, and the footer's rows rise as it comes up
  if (ST) {
    gsap.from('.hv-say > span', { yPercent: 70, opacity: 0, rotation: 3, stagger: .25, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.hv-story', start: 'top 85%', end: 'top 5%', scrub: .6 } });
    var foot = $('#footer'), rows = function () {
      var els = $$('.footer-main > *, .sponsor-strip, .footer-legal-bar', foot); if (!els.length) return false;
      els.forEach(function (el) { gsap.from(el, { y: 50, opacity: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 75%', scrub: .6 } }); });
      return true;
    };
    if (foot && !rows()) { var mo = new MutationObserver(function () { if (rows()) mo.disconnect(); }); mo.observe(foot, { childList: true, subtree: true }); }
  }

  // explore: the card art pops out of each card, and the heading's highlighter wipes in
  if (ST) {
    ST.batch('.go-card img', { start: 'top 88%', once: true, onEnter: function (b) { gsap.from(b, { scale: 0, rotation: -30, duration: .8, stagger: .1, ease: 'back.out(2)', clearProps: 'transform' }); } });
    var gh = $('.go-head h2');
    if (gh) gsap.fromTo(gh, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: .9, ease: 'power2.out', scrollTrigger: { trigger: gh, start: 'top 80%', once: true } });
  }
})();
