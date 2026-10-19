// Home v2, the cost beat (between the four problems and malaria): the dotted globe from the earlier home page spins in, bills and coins
// peel off it, and the price of bringing one new drug to market counts up beside it.
// Called from home-v2.js:  var cost = HVCost(pin, K, helpers);  cost.update(s, t) every frame; cost.live(s) while it needs frames of its own.
window.HVCost = function (pin, K, H) {
  var el = pin.querySelector('.hv-cost'); if (!el) return null;
  var gcv = el.querySelector('.hv-cost-globe'), fx = el.querySelector('.hv-cost-fx'), card = el.querySelector('.hv-cost-card'), num = card.querySelector('.n');
  var clamp = H.clamp, ramp = H.ramp, ease = H.ease, back = function (x) { return x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2); };
  var COST = 2.6e9;   // dollars to bring one drug to market (DiMasi, Grabowski & Hansen 2016, capitalised cost to approval)
  var money = function (v) { return v >= 1e9 ? '$' + (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? '$' + Math.round(v / 1e6) + 'M' : v >= 1e3 ? '$' + Math.round(v / 1e3) + 'K' : '$' + Math.round(v); };
  var bill = new Image(), coin = new Image(); bill.src = 'static/home/money-bill.png'; coin.src = 'static/home/money-coin.png';
  var rng = (function (a) { return function () { a = (a * 16807) % 2147483647; return a / 2147483647; }; })(41), bills = [];
  for (var i = 0; i < 64; i++) bills.push({ th: -.5 + rng() * 2.7, t0: rng() * .8, dur: .16 + rng() * .12, vx: .5 + rng() * 1.2, vy: -.2 - rng() * .7, spin: (rng() - .5) * 7, coin: i % 4 === 3, sz: .8 + rng() * .5 });
  var globe = null, D0 = 0, cw = 0, ch = 0, ctx = fx.getContext('2d');
  var win = function (s) { return clamp((s - K.cost[0]) / (K.cost[1] - K.cost[0]), 0, 1); };

  return {
    live: function (s) { return s > K.cost[0] && s < K.cost[1]; },
    update: function (s, t) {
      var on = s > K.cost[0] - .02 && s < K.cost[1] + .02;
      el.style.visibility = on ? 'visible' : 'hidden'; if (!on) return;
      var p = win(s), W = pin.clientWidth, Hh = pin.clientHeight, narrow = W <= 860, dpr = Math.min(2, window.devicePixelRatio || 1);
      var D = narrow ? Math.min(W * .78, Hh * .4) : Math.min(Hh * .8, W * .44), cx = narrow ? W / 2 : W * .3, cy = narrow ? Hh * .3 : Hh * .5;
      // in (a bouncy grow), a slow drift left while the money falls, out (shrinks away)
      var gi = back(ramp(p, 0, .2)), out = ease(ramp(p, .86, 1)), sc = (.2 + .8 * gi) * (1 - .35 * out);
      cx -= (narrow ? 0 : W * .03) * ease(ramp(p, .2, .86));
      if (!globe && window.LabGlobe) globe = window.LabGlobe(gcv);
      if (globe && D !== D0) { D0 = D; gcv.style.width = gcv.style.height = D + 'px'; globe.resize(D, D); }
      gcv.style.transform = 'translate3d(' + (cx - D / 2).toFixed(1) + 'px,' + (cy - D / 2).toFixed(1) + 'px,0) scale(' + sc.toFixed(4) + ')';
      gcv.style.opacity = (ramp(p, 0, .08) * (1 - out)).toFixed(3);
      if (globe) globe.render(t * .18 + p * 2.4, t);
      // the card: in after the globe, the price counts up, out with it
      var co = ease(ramp(p, .12, .26)) * (1 - out);
      card.style.setProperty('--o', co.toFixed(3)); card.classList.toggle('is-on', co > .5);
      num.textContent = money(COST * ease(ramp(p, .2, .62)));
      // the money: every bill's path is a pure function of p, so scrolling back plays it backwards
      if (cw !== W || ch !== Hh) { cw = W; ch = Hh; fx.width = W * dpr; fx.height = Hh * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
      var bl = ramp(p, .22, .9), vis = ease(ramp(p, .2, .26)) * (1 - out), R = D / 2 * sc, z0 = clamp(R / 300, .5, 1.6);
      if (bl <= 0 || bl >= 1 || vis <= .01) return;
      bills.forEach(function (b) {
        var u = (bl - b.t0) / b.dur; if (u < 0 || u > 1) return;
        var a = Math.min(1, u * 8) * Math.min(1, (1 - u) * 5) * vis; if (a <= .01) return;
        var ca = Math.cos(b.th), sa = Math.sin(b.th), px = cx + ca * R * .98, py = cy + sa * R * .98;
        var x = px + ca * b.vx * R * .9 * u + .35 * R * u * b.vx, y = py + sa * b.vx * R * .5 * u + b.vy * R * .6 * u + 1.9 * R * u * u;
        var im = b.coin ? coin : bill, hh = (b.coin ? 24 : 44) * z0 * b.sz * (.45 + .55 * Math.min(1, u * 4));
        if (!im.complete || !im.naturalWidth) return;
        ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(b.spin * u + b.th);
        ctx.drawImage(im, -hh * im.naturalWidth / im.naturalHeight / 2, -hh / 2, hh * im.naturalWidth / im.naturalHeight, hh);
        ctx.restore();
      });
    }
  };
};
