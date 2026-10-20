// The site's only script, its own: each example picture shows its finished
// frame, then plays once as it comes into view and ends on that same frame
// (the app's rule: no loops). The sections rise gently. Nothing is loaded
// from anywhere else and nothing is recorded.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function base(v) { return '/assets/tips/' + v.getAttribute('data-pic'); }
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-pic]'));

  // The clip is fetched well before its card reaches the screen, so it can
  // start the moment it does (Jay, 2026-10-20: "they need to load in faster").
  function fetch(v) {
    if (v.getAttribute('src')) return;
    v.preload = 'auto';
    v.src = base(v) + '.mp4';
  }
  function play(v) {
    if (still.matches || v.dataset.played) return;
    v.dataset.played = '1';
    fetch(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  var rises = Array.prototype.slice.call(document.querySelectorAll('.rise'));
  if (!('IntersectionObserver' in window)) {
    rises.forEach(function (el) { el.classList.add('in'); });
    return;
  }
  var near = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (!still.matches) fetch(e.target);
      near.unobserve(e.target);
    });
  }, { rootMargin: '2500px 0px' });
  videos.forEach(function (v) { near.observe(v); });

  // Once the page is up, the rest of the clips come down quietly one after
  // another (about 5 MB in all), so a fast scroll never waits on one.
  function fetchRest() {
    if (still.matches) return;
    var queue = videos.filter(function (v) { return !v.getAttribute('src'); });
    (function next() {
      var v = queue.shift();
      if (!v) return;
      var done = false;
      function go() { if (done) return; done = true; setTimeout(next, 50); }
      v.addEventListener('loadeddata', go, { once: true });
      v.addEventListener('error', go, { once: true });
      setTimeout(go, 2500);
      fetch(v);
    })();
  }
  if (document.readyState === 'complete') setTimeout(fetchRest, 800);
  else window.addEventListener('load', function () { setTimeout(fetchRest, 800); });

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      var v = el.matches && el.matches('video[data-pic]') ? el : el.querySelector('video[data-pic]');
      if (v) play(v);
      seen.unobserve(el);
    });
  }, { rootMargin: '0px 0px 160px 0px', threshold: 0 });
  rises.forEach(function (el) { seen.observe(el); });
  // A picture outside a rising block still plays on its own.
  videos.forEach(function (v) { if (!v.closest('.rise')) seen.observe(v); });
})();
