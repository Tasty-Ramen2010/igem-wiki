(function () {
  var anim = document.getElementById('hero-intro-anim');
  var hero = anim && anim.closest('.home-hero, .hv-hero');
  if (!anim || !hero) return;

  var root = document.documentElement;

  // Lock scrolling at the top while the intro plays. Manual restoration so a
  // reload doesn't drop the viewer mid-page with the intro playing offscreen.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  document.body.scrollTop = 0;
  root.classList.add('intro-lock');

  // titleanimation.webp (6.05s) loops forever and has faded to blank paper by 5.6s;
  // start the 0.6s crossfade at 5.4s so it ends before the loop restarts.
  var PLAY_MS = 5400;

  var done = false, timer;
  var reveal = function () {
    if (done) return;
    done = true; window.clearTimeout(timer);
    document.removeEventListener('keydown', onKey);
    hero.classList.add('hero-intro-done');
    // keep the full-screen overlay (and the scroll lock) until its 0.6s fade is over
    window.setTimeout(function () { root.classList.remove('intro-lock'); }, 600);
  };
  var start = function () { timer = window.setTimeout(reveal, PLAY_MS); };

  // Esc skips the intro (same fade as when it ends on its own); the hint says so on devices with a keyboard
  var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Esc') reveal(); };
  document.addEventListener('keydown', onKey);
  var hint = document.createElement('p');
  hint.className = 'hero-skip'; hint.setAttribute('aria-hidden', 'true');
  hint.innerHTML = 'Press <kbd>Esc</kbd> to skip';
  hero.appendChild(hint);

  anim.addEventListener('error', reveal);
  if (anim.complete) { if (anim.naturalWidth) start(); else reveal(); }       // already failed (blocked network): nothing to play, do not make people wait
  else anim.addEventListener('load', start);
  // a host that never answers fires neither load nor error, which would keep the scroll lock on forever: give up after 6 s
  window.setTimeout(function () { if (!done && !timer) reveal(); }, 6000);
})();
