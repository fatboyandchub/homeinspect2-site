// The site's only script, its own: each example picture shows its finished
// frame, plays as it comes into view, rests two seconds on that frame and
// plays again (Jay, 2026-10-20: "a 2 second pause after they complete and
// then loop"), and pauses while it's off the screen. The sections rise
// gently. Nothing is loaded from anywhere else and nothing is recorded.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function base(v) { return '/assets/tips/' + v.getAttribute('data-pic'); }
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-pic]'));

  // The clip is fetched well before its card reaches the screen and starts
  // playing a whole screen before it shows, so it's well along or finished
  // by the time it's looked at (Jay, 2026-10-20: "they need to load in
  // faster", "start a project needs to be loaded in already").
  function fetch(v) {
    if (v.getAttribute('src')) return;
    v.preload = 'auto';
    v.src = base(v) + '.mp4';
  }
  function resume(v) {
    if (v.paused && !v.dataset.resting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  }
  function play(v) {
    if (still.matches) return;
    if (v.dataset.played) { resume(v); return; }
    v.dataset.played = '1';
    fetch(v);
    // Done: rest two seconds on the finished frame, then play again.
    v.addEventListener('ended', function () {
      v.dataset.resting = '1';
      setTimeout(function () {
        delete v.dataset.resting;
        if (v.dataset.onScreen) { v.currentTime = 0; resume(v); }
      }, 2000);
    });
    resume(v);
  }
  // Each picture plays while it's on the screen (a screen ahead counts) and
  // pauses off it; a page brought back with Back, or a tab shown again,
  // picks every visible one up (Jay: "go back, the page freezes the videos").
  function wake() {
    videos.forEach(function (v) { if (v.dataset.played && v.dataset.onScreen && !v.dataset.resting) resume(v); });
  }
  window.addEventListener('pageshow', wake);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) wake(); });

  // The 3D models: the row turns one tile every 3 seconds, round and round,
  // the current tile in the middle with its neighbours showing either side
  // (Jay, 2026-10-20: "start in the middle so that there's models on the
  // left and right, feeling like an endless loop"). The last tiles are
  // cloned in front and the first ones behind, so the turn past the last
  // one lands on a copy and the row jumps back unseen.
  var track = document.querySelector('.models .track');
  if (track && !still.matches) {
    var tiles = Array.prototype.slice.call(track.children);
    var count = tiles.length, pad = 3;
    tiles.slice(-pad).forEach(function (t) { var c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.insertBefore(c, track.firstChild); });
    tiles.slice(0, pad).forEach(function (t) { var c = t.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    var at = pad, running = false, timer = null, jumping = false;
    function place(animated) {
      var tile = track.children[0], win = track.parentNode;
      var width = tile.getBoundingClientRect().width;
      var pitch = width + parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 0);
      var ws = getComputedStyle(win);
      var inner = win.clientWidth - parseFloat(ws.paddingLeft || 0) - parseFloat(ws.paddingRight || 0);
      var x = (inner - width) / 2 - at * pitch;
      track.classList.toggle('jump', !animated);
      track.style.transform = 'translateX(' + x + 'px)';
      if (!animated) void track.offsetWidth;
    }
    function step() {
      if (jumping) return;
      at += 1;
      place(true);
      if (at >= pad + count) {
        // On the clone of the first tile: once the slide ends, snap back to the real one without a transition.
        jumping = true;
        setTimeout(function () { at -= count; place(false); jumping = false; }, 720);
      }
    }
    function start() { if (!running) { running = true; timer = setInterval(step, 3000); } }
    function stop() { running = false; clearInterval(timer); }
    place(false);
    // Watched on its window, not the track: the track is many screens wide,
    // so a phone never shows a tenth of it (Jay: "they also don't rotate").
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0 }).observe(track.parentNode);
    } else { start(); }
    window.addEventListener('resize', function () { place(false); });
    window.addEventListener('pageshow', function () { place(false); if (running) { stop(); start(); } });
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
  if (document.readyState !== 'loading') setTimeout(fetchRest, 300);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(fetchRest, 300); });

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px 100% 0px', threshold: 0 });
  rises.forEach(function (el) { seen.observe(el); });
  var screen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { v.dataset.onScreen = '1'; play(v); }
      else { delete v.dataset.onScreen; if (!v.paused) v.pause(); }
    });
  }, { rootMargin: '0px 0px 100% 0px', threshold: 0 });
  videos.forEach(function (v) { screen.observe(v); });
})();
