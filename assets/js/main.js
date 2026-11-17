/* Hanane — interactions & animations (sans dépendance) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = doc.classList.contains('seen');

  /* ---------- Découpe des titres mot par mot ---------- */
  function splitWords(root) {
    var index = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(' '));
            } else {
              var span = document.createElement('span');
              span.className = 'wi';
              span.style.setProperty('--i', index++);
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
  }
  document.querySelectorAll('[data-split]').forEach(splitWords);

  /* ---------- Poussières de lumière dans le hero ---------- */
  var motes = document.querySelector('[data-motes]');
  if (motes && !reduce) {
    var count = window.innerWidth < 720 ? 10 : 22;
    for (var m = 0; m < count; m++) {
      var s = document.createElement('span');
      var size = 2 + Math.random() * 5;
      s.style.setProperty('--l', (28 + Math.random() * 70).toFixed(1) + '%');
      s.style.setProperty('--t', (30 + Math.random() * 65).toFixed(1) + '%');
      s.style.setProperty('--s', size.toFixed(1) + 'px');
      s.style.setProperty('--o', (0.35 + Math.random() * 0.5).toFixed(2));
      s.style.setProperty('--dx', (-60 + Math.random() * 120).toFixed(0) + 'px');
      s.style.setProperty('--dur', (11 + Math.random() * 14).toFixed(1) + 's');
      s.style.setProperty('--del', (-Math.random() * 20).toFixed(1) + 's');
      motes.appendChild(s);
    }
  }

  /* ---------- Apparitions au défilement ---------- */
  function startReveals() {
    var targets = document.querySelectorAll('[data-reveal], [data-split]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Ouverture ---------- */
  var opened = false;
  function open() {
    if (opened) return;
    opened = true;
    body.classList.add('is-loaded');
    try { sessionStorage.setItem('hanane-seen', '1'); } catch (e) {}
    setTimeout(startReveals, seen ? 60 : 420);
  }
  var minDelay = seen || reduce ? 60 : 1500;
  var started = Date.now();
  function whenReady() { setTimeout(open, Math.max(0, minDelay - (Date.now() - started))); }
  if (document.readyState === 'complete') whenReady();
  else window.addEventListener('load', whenReady);
  setTimeout(open, 4000); // filet de sécurité

  /* ---------- En-tête : état, masquage, lien actif ---------- */
  var header = document.querySelector('[data-header]');
  var heroBg = document.querySelector('[data-hero-bg]');
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var lastY = window.scrollY;
  var ticking = false;

  function onFrame() {
    ticking = false;
    var y = window.scrollY;
    var vh = window.innerHeight;

    if (header) {
      header.classList.toggle('is-solid', y > 40);
      var goingDown = y > lastY && y > 520;
      if (Math.abs(y - lastY) > 6) {
        header.classList.toggle('is-hidden', goingDown && !body.classList.contains('menu-open'));
      }
    }
    lastY = y;

    if (reduce) return;

    if (heroBg && y < vh * 1.2) {
      heroBg.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
    }
    parallaxEls.forEach(function (el) {
      var host = el.parentElement.getBoundingClientRect();
      if (host.bottom < -120 || host.top > vh + 120) return;
      var progress = (host.top + host.height / 2 - vh / 2) / vh;
      var strength = parseFloat(el.getAttribute('data-parallax')) || 30;
      el.style.transform = 'translate3d(0,' + (progress * strength).toFixed(1) + 'px,0)';
    });
  }
  function requestFrame() {
    if (!ticking) { ticking = true; requestAnimationFrame(onFrame); }
  }
  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  onFrame();

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (link) {
      var section = document.querySelector(link.getAttribute('href'));
      if (section) spy.observe(section);
    });
  }

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.getElementById('menu');
  function setMenu(openMenu) {
    body.classList.toggle('menu-open', openMenu);
    body.style.overflow = openMenu ? 'hidden' : '';
    if (burger) {
      burger.setAttribute('aria-expanded', String(openMenu));
      burger.setAttribute('aria-label', openMenu ? 'Fermer le menu' : 'Ouvrir le menu');
    }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  /* ---------- Boutons magnétiques (souris uniquement) ---------- */
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        var dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
        el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
        el.style.transition = 'transform .15s ease-out, color .5s, border-color .5s';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform .9s cubic-bezier(.22,.8,.2,1), color .5s, border-color .5s';
        el.style.transform = '';
      });
    });
  }

  /* ---------- Copier un contact ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      function done() {
        btn.textContent = 'Copié';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------- Année ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
