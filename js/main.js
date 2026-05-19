/**
 * MAIN.JS — Vantage Logic
 * Interactions matching deptagency.com
 */

/* Page Loader */
function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  const fill = loader.querySelector('.loader-fill');
  if (fill) {
    setTimeout(() => { fill.style.width = '60%'; }, 100);
    setTimeout(() => { fill.style.width = '85%'; }, 400);
  }
  window.addEventListener('load', () => {
    if (fill) fill.style.width = '100%';
    setTimeout(() => loader.classList.add('loaded'), 350);
    setTimeout(() => loader.remove(), 1000);
  });
  // Fallback
  setTimeout(() => { if (loader.parentNode) loader.classList.add('loaded'); }, 3000);
}

/* Nav scroll state */
function initNav() {
  const nav = document.getElementById('nav');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuBtn = document.getElementById('menuToggle');
  if (!nav) return;

  /* Dropdown parent links — prevent jump-to-top on click */
  nav.querySelectorAll('.has-dd > a[href="#"]').forEach(a => {
    a.addEventListener('click', e => e.preventDefault());
  });

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  // Hamburger toggle
  function toggleMenu() {
    const open = hamburger.classList.toggle('open');
    if (mobileMenu) mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (menuBtn) menuBtn.textContent = open ? 'Close' : 'Menu';
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', toggleMenu);
  }

  // Close mobile menu on link click
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger?.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        if (menuBtn) menuBtn.textContent = 'Menu';
      });
    });
  }
}

/* Scroll Reveal */
function initReveal() {
  const els = document.querySelectorAll('[data-reveal], [data-stagger]');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
}

/* Scroll progress bar */
function initProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.body.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  }, { passive: true });
}

/* Marquee — duplicate for loop */
function initMarquee() {
  document.querySelectorAll('.marquee-track').forEach(t => { t.innerHTML += t.innerHTML; });
}

/* Accordion */
function initAccordion() {
  document.querySelectorAll('.accordion-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const inner = item.querySelector('.accordion-body-inner');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.accordion-item.open').forEach(o => {
        if (o !== item) {
          o.classList.remove('open');
          o.querySelector('.accordion-body').style.maxHeight = '0';
        }
      });

      item.classList.toggle('open', !isOpen);
      body.style.maxHeight = isOpen ? '0' : inner.scrollHeight + 'px';
    });
  });
}

/* Counter animation */
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const dur = 1800;
      function tick(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

/* Form handling */
function initForms() {
  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;
      await new Promise(r => setTimeout(r, 1500));
      btn.textContent = '✓ Message sent!';
      form.reset();
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 4000);
    });
  });
}

/* Hero text scramble on load.
   Each character is wrapped in a span with its measured final width frozen,
   so random letters of any width can never shift the layout.
   Animation is sequential left-to-right with a single flicker per slot. */
function initScramble() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-scramble]').forEach(el => {
    if (el.dataset.scrambleInit) return;
    el.dataset.scrambleInit = '1';
    if (reduced) return; // Leave original text in place

    // Phase 1 — wrap every visible char in its own span, and group each word
    // in a nowrap container so a word can never break across lines.
    const slots = []; // { el, original, isWS }
    function wrap(parent) {
      Array.from(parent.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.nodeValue;
          if (!text.length) return;
          // Split into whitespace and word tokens, preserving order
          const tokens = text.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          for (const token of tokens) {
            if (!token) continue;
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(token));
              slots.push({ el: null, original: token, isWS: true });
            } else {
              // Word — keep its letters together
              const word = document.createElement('span');
              word.style.display = 'inline-block';
              word.style.whiteSpace = 'nowrap';
              for (const ch of token) {
                const span = document.createElement('span');
                span.textContent = ch;
                span.style.display = 'inline-block';
                span.style.textAlign = 'center';
                word.appendChild(span);
                slots.push({ el: span, original: ch, isWS: false });
              }
              frag.appendChild(word);
            }
          }
          parent.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrap(child);
        }
      });
    }
    wrap(el);
    if (!slots.length) return;

    // Phase 2 — measure each slot's natural width while it still shows the final letter,
    // then lock that width and hide the slot
    slots.forEach(s => {
      if (!s.el) return;
      const w = s.el.getBoundingClientRect().width;
      s.el.style.width = w + 'px';
      s.el.style.visibility = 'hidden';
    });

    // Phase 3 — sequential animation, one slot at a time
    const STEP = 38;       // ms per tick (slower than before)
    const FLICKER = 2;     // how many random letters before the final one settles
    let pos = 0, flick = 0;

    function tick() {
      // Skip past whitespace slots without delay
      while (pos < slots.length && slots[pos].isWS) pos++;
      if (pos >= slots.length) return;

      const cur = slots[pos];
      cur.el.style.visibility = 'visible';

      if (flick < FLICKER) {
        cur.el.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
        flick++;
      } else {
        cur.el.textContent = cur.original;
        flick = 0;
        pos++;
      }
      setTimeout(tick, STEP);
    }
    setTimeout(tick, 500);
  });
}

/* Filter buttons */
function initFilters() {
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const key = group.dataset.filterGroup;
    const items = document.querySelectorAll(`[data-filter-target="${key}"]`);
    group.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const val = btn.dataset.filter;
        items.forEach(item => {
          const match = val === 'all' || item.dataset.cat === val;
          item.style.display = match ? '' : 'none';
        });
      });
    });
  });
}

/* Horizontal scroll drag — DEPT work section */
function initHorizontalDrag() {
  document.querySelectorAll('.work-scroll-wrap').forEach(wrap => {
    let isDown = false, startX, scrollLeft;
    wrap.addEventListener('mousedown', e => {
      isDown = true; wrap.style.cursor = 'grabbing';
      startX = e.pageX - wrap.offsetLeft;
      scrollLeft = wrap.scrollLeft;
    });
    wrap.addEventListener('mouseleave', () => { isDown = false; wrap.style.cursor = ''; });
    wrap.addEventListener('mouseup', () => { isDown = false; wrap.style.cursor = ''; });
    wrap.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - wrap.offsetLeft;
      wrap.scrollLeft = scrollLeft - (x - startX) * 1.5;
    });
  });
}

/* Slider arrow buttons */
function initSliderArrows() {
  document.querySelectorAll('[data-slider-arrow]').forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.work-slider-container');
      if (!container) return;
      const wrap = container.querySelector('.work-scroll-wrap');
      if (!wrap) return;
      const card = wrap.querySelector('.work-card');
      const scrollAmount = card ? card.offsetWidth + 24 : 500;
      const dir = btn.dataset.sliderArrow === 'left' ? -1 : 1;
      wrap.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    });
  });
}

/* Align slider arrows vertically with the centre of the card *image*
   (not the whole card height — meta sits below).
   --arrow-y    : offset for flex-flow arrows (desktop) → margin-top
   --arrow-mid-y: pure image centre (mobile) → top + translateY(-50%) */
function alignSliderArrows() {
  document.querySelectorAll('.work-slider-container').forEach(container => {
    const imgWrap = container.querySelector('.work-card-img-wrap');
    if (!imgWrap) return;
    const imgH = imgWrap.offsetHeight;
    const arrow = container.querySelector('.slider-arrow');
    if (!arrow) return;
    const arrowH = arrow.offsetHeight || 52;
    container.style.setProperty('--arrow-y', Math.max(0, (imgH - arrowH) / 2) + 'px');
    container.style.setProperty('--arrow-mid-y', (imgH / 2) + 'px');
  });
}

/* Smooth auto-scroll for culture strip */
function initCultureScroll() {
  const strip = document.querySelector('.culture-strip');
  const track = document.querySelector('.culture-track');
  if (!strip || !track) return;
  if (track.dataset.inited === '1') return;
  track.dataset.inited = '1';

  /* Duplicate content once for a seamless loop */
  track.innerHTML += track.innerHTML;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopMQ = window.matchMedia('(min-width: 769px)');
  if (reduceMotion) return;

  const SPEED = 40; /* pixels per second */
  let offset = 0;
  let lastTs = 0;
  let paused = false;
  let visible = false;
  let raf = 0;
  let halfWidth = 0;

  function measure() {
    /* track holds 2 identical halves — one half-width is the loop length */
    halfWidth = track.scrollWidth / 2;
  }

  function tick(ts) {
    if (!lastTs) lastTs = ts;
    const dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (!paused && desktopMQ.matches && halfWidth > 0) {
      offset -= SPEED * dt;
      if (-offset >= halfWidth) offset += halfWidth;
      track.style.transform = `translate3d(${offset}px,0,0)`;
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (raf) return;
    lastTs = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
  }

  measure();
  window.addEventListener('resize', () => { measure(); }, { passive: true });
  window.addEventListener('load', measure);

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      visible = e.isIntersecting;
      if (visible && desktopMQ.matches) start(); else stop();
    });
  }, { threshold: 0.05 });
  io.observe(strip);

  strip.addEventListener('mouseenter', () => { paused = true; });
  strip.addEventListener('mouseleave', () => { paused = false; lastTs = 0; });

  desktopMQ.addEventListener('change', () => {
    if (desktopMQ.matches && visible) start();
    else { stop(); track.style.transform = ''; }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-ready');

  initLoader();
  initNav();
  initReveal();
  initProgress();
  initMarquee();
  initAccordion();
  initCounters();
  initForms();
  initScramble();
  initFilters();
  initHorizontalDrag();
  initSliderArrows();
  alignSliderArrows();
  window.addEventListener('resize', alignSliderArrows, { passive: true });
  window.addEventListener('load', alignSliderArrows);
  initCultureScroll();
});
