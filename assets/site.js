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

  function play(v) {
    if (v.getAttribute('src') || still.matches) return;
    v.src = base(v) + '.mp4';
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  var rises = Array.prototype.slice.call(document.querySelectorAll('.rise'));
  if (!('IntersectionObserver' in window)) {
    rises.forEach(function (el) { el.classList.add('in'); });
    return;
  }
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
