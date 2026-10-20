// The site's only script, its own: the example pictures play once as they
// come into view and keep their last frame (the app's rule: no loops), the
// sections rise gently. Nothing is loaded from anywhere else and nothing is
// recorded.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var dark = window.matchMedia('(prefers-color-scheme: dark)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');

  function look() { return dark.matches ? 'dark' : 'light'; }
  function base(v) { return '/assets/tips/' + look() + '/' + v.getAttribute('data-pic'); }

  // A picture's poster: the first frame until it plays, the last frame when
  // motion is off (that's what the picture ends on). Set only as the picture
  // nears the screen, so a long page doesn't fetch every poster at once.
  function poster(v, last) { v.poster = base(v) + (last || still.matches ? '-last' : '-first') + '.jpg'; }
  var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-pic]'));
  function onLookChange() {
    videos.forEach(function (v) { if (v.poster && !v.getAttribute('src')) poster(v); });
  }
  if (dark.addEventListener) dark.addEventListener('change', onLookChange);
  else if (dark.addListener) dark.addListener(onLookChange);

  function play(v) {
    if (v.getAttribute('src') || still.matches) return;
    if (!v.poster) poster(v);
    v.src = base(v) + '.mp4';
    var p = v.play();
    // Refused (Low Power Mode, a data saver): show where the picture ends.
    if (p && p.catch) p.catch(function () { poster(v, true); });
  }

  var rises = Array.prototype.slice.call(document.querySelectorAll('.rise'));
  if (!('IntersectionObserver' in window)) {
    rises.forEach(function (el) { el.classList.add('in'); });
    videos.forEach(function (v) { poster(v, true); });
    return;
  }
  var near = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      poster(e.target);
      near.unobserve(e.target);
    });
  }, { rootMargin: '600px 0px' });
  videos.forEach(function (v) { near.observe(v); });

  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      var v = el.matches && el.matches('video[data-pic]') ? el : el.querySelector('video[data-pic]');
      if (v) play(v);
      seen.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.2 });
  rises.forEach(function (el) { seen.observe(el); });
  // A picture outside a rising block still plays on its own.
  videos.forEach(function (v) { if (!v.closest('.rise')) seen.observe(v); });
})();
