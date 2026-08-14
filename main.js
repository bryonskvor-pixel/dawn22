/* DAWN-22 · gate, sky, road, map, audio */
(function () {
  'use strict';

  document.body.classList.add('js');

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= SKY =================
     A fixed gradient layer whose colors interpolate with scroll.
     sunrise: before the gate opens the baseline is pre-dawn (0);
     the correct answer animates the baseline up to first light,
     so the right answer literally brings the sunrise. */

  var sky = document.getElementById('sky');

  // [scroll fraction, [top, middle, bottom]]
  var SKY_STOPS = [
    [0.00, ['#171227', '#2B2440', '#3A2D4D']], // pre-dawn
    [0.14, ['#2B2440', '#7A4E63', '#D98E8E']], // first light
    [0.30, ['#B77289', '#F2C4A0', '#E8D9C0']], // dawn peach
    [0.55, ['#F5EFE0', '#EFDCC0', '#E8D9C0']], // clear desert day
    [0.76, ['#F2C4A0', '#E8A972', '#D98E8E']], // golden hour
    [0.90, ['#8E5A74', '#5C4260', '#2B2440']], // dusk approach
    [1.00, ['#2B2440', '#231D38', '#171227']]  // dusk
  ];

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function mix(a, b, t) {
    var ca = hexToRgb(a), cb = hexToRgb(b);
    return 'rgb(' +
      Math.round(ca[0] + (cb[0] - ca[0]) * t) + ',' +
      Math.round(ca[1] + (cb[1] - ca[1]) * t) + ',' +
      Math.round(ca[2] + (cb[2] - ca[2]) * t) + ')';
  }
  function skyColors(p) {
    p = Math.max(0, Math.min(1, p));
    if (reducedMotion) {
      // static per-section: snap to the nearest keyframe
      var nearest = SKY_STOPS[0], best = 2;
      for (var k = 0; k < SKY_STOPS.length; k++) {
        var d = Math.abs(SKY_STOPS[k][0] - p);
        if (d < best) { best = d; nearest = SKY_STOPS[k]; }
      }
      return nearest[1].slice();
    }
    for (var i = 0; i < SKY_STOPS.length - 1; i++) {
      var a = SKY_STOPS[i], b = SKY_STOPS[i + 1];
      if (p >= a[0] && p <= b[0]) {
        var t = (p - a[0]) / (b[0] - a[0]);
        return [mix(a[1][0], b[1][0], t), mix(a[1][1], b[1][1], t), mix(a[1][2], b[1][2], t)];
      }
    }
    return SKY_STOPS[SKY_STOPS.length - 1][1].slice();
  }

  var sunrise = 0;         // 0 = pre-dawn baseline, rises to 0.17 when gate opens
  var SUNRISE_MAX = 0.17;

  function paintSky() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var sp = max > 0 ? window.scrollY / max : 0;
    var p = sunrise + sp * (1 - sunrise);
    var c = skyColors(p);
    sky.style.background = 'linear-gradient(180deg, ' + c[0] + ' 0%, ' + c[1] + ' 55%, ' + c[2] + ' 100%)';
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { ticking = false; paintSky(); });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  paintSky();

  function animateSunrise() {
    if (reducedMotion) { sunrise = SUNRISE_MAX; paintSky(); return; }
    var start = performance.now(), DUR = 2000;
    function step(now) {
      var t = Math.min(1, (now - start) / DUR);
      var e = 1 - Math.pow(1 - t, 3); // ease-out
      sunrise = SUNRISE_MAX * e;
      paintSky();
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ================= GATE ================= */
  var gate = document.getElementById('gate');
  var form = document.getElementById('gate-form');
  var input = document.getElementById('gate-input');
  var KEY = 'dawn22-open';

  function isRight(v) {
    return v.trim().toLowerCase().indexOf('dill') === 0;
  }
  function openGate(instant) {
    document.body.style.overflow = '';
    if (instant) {
      gate.classList.add('open', 'gone');
      sunrise = SUNRISE_MAX;
      paintSky();
      return;
    }
    gate.classList.add('open');
    animateSunrise();
    gate.addEventListener('transitionend', function () {
      gate.classList.add('gone');
    }, { once: true });
    // safety net in case transitionend never fires
    setTimeout(function () { gate.classList.add('gone'); }, 2400);
  }

  if (sessionStorage.getItem(KEY) === '1') {
    openGate(true);
  } else {
    document.body.style.overflow = 'hidden';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isRight(input.value)) {
        try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
        input.blur();
        openGate(false);
      } else {
        gate.classList.add('tried');
        gate.classList.remove('shake');
        void gate.offsetWidth; // restart the animation
        gate.classList.add('shake');
        input.select();
      }
    });
  }

  /* ================= MARKER ENTRANCES ================= */
  var markers = document.querySelectorAll('.marker');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    markers.forEach(function (m) { io.observe(m); });
  } else {
    markers.forEach(function (m) { m.classList.add('in'); });
  }

  /* ================= MAP MOMENT ================= */
  var mapSection = document.getElementById('mapmoment');
  var mapFired = false;
  function fireMap() {
    if (mapFired) return;
    mapFired = true;
    mapSection.classList.add('drawn');
    var wait = reducedMotion ? 0 : 2500;
    setTimeout(function () { mapSection.classList.add('done'); }, wait);
  }
  if ('IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          fireMap();
          mio.disconnect();
        }
      });
    }, { threshold: 0.45 });
    mio.observe(mapSection);
  } else {
    fireMap();
  }

  /* ================= AUDIO =================
     Drop the voice memo at audio/anniversary.m4a and redeploy;
     the button enables itself when the file loads. */
  var memo = document.getElementById('memo');
  var btn = document.getElementById('playBtn');
  var listen = document.getElementById('listen');
  var ringFill = document.querySelector('.ring-fill');

  memo.addEventListener('loadedmetadata', function () {
    btn.disabled = false;
    listen.classList.add('ready');
  });
  memo.addEventListener('error', function () {
    btn.disabled = true; // no file yet — the note below the button explains
  });

  btn.addEventListener('click', function () {
    if (memo.paused) { memo.play(); } else { memo.pause(); }
  });
  memo.addEventListener('play', function () {
    btn.classList.add('playing');
    btn.setAttribute('aria-label', 'Pause the voice memo');
  });
  memo.addEventListener('pause', function () {
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', 'Play the voice memo');
  });
  memo.addEventListener('timeupdate', function () {
    if (memo.duration) {
      ringFill.style.strokeDashoffset = 100 - (memo.currentTime / memo.duration) * 100;
    }
  });
  memo.addEventListener('ended', function () {
    memo.currentTime = 0;
    ringFill.style.strokeDashoffset = 100;
  });
})();
