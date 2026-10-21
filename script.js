/* =========================================================
   Fuel-style designer portfolio · interactions
   第5轮: 精简文案 + 多项 HUD 互动
   - Lenis smooth scroll
   - GSAP / ScrollTrigger reveals
   - Custom cursor
   - NEW: image-preview follower (hover 作品卡显示大图)
   - NEW: scroll progress (右侧 + 章节 dots)
   - NEW: magnetic CTAs
   - NEW: click ripple
   - NEW: liquid cursor layer
   ========================================================= */

gsap.registerPlugin(ScrollTrigger);

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const isCoarse = () => window.matchMedia('(hover: none)').matches;
const reduce   = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- LOADER ---------- */
(function loader(){
  const loader = $('#loader');
  if (!loader) return;
  const bar    = loader.querySelector('.loader__bar i');
  const count  = $('#loaderCount');
  let n = 0;
  const tick = () => {
    n += Math.random() * 8 + 2;
    if (n >= 100) n = 100;
    bar.style.transform = `scaleX(${n/100})`;
    count.textContent = Math.floor(n);
    if (n < 100) requestAnimationFrame(() => setTimeout(tick, 22));
    else {
      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.style.overflow = '';
      }, 280);
    }
  };
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => setTimeout(tick, 90));
})();

/* ---------- CUSTOM CURSOR + liquid layer ---------- */
(function cursor(){
  if (isCoarse()) return;
  const cur  = $('#cursor');
  const ring = cur.querySelector('.cursor__ring');
  const dot  = cur.querySelector('.cursor__dot');
  if (!cur) return;

  let mx = innerWidth/2, my = innerHeight/2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  }, { passive: true });

  const loop = () => {
    // ring eases toward cursor with delay
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  // hover state
  const setHover = (on) => cur.classList.toggle('is-hover', on);
  $$('[data-cursor="view"]').forEach(el => {
    el.addEventListener('mouseenter', () => setHover(true));
    el.addEventListener('mouseleave', () => setHover(false));
  });
  $$('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {});
    el.addEventListener('mouseleave', () => {});
  });

  // hide cursor when off-screen (top edges)
  document.addEventListener('mouseleave', () => cur.style.opacity = '0');
  document.addEventListener('mouseenter', () => cur.style.opacity = '1');
})();

/* ---------- LENIS smooth scroll ---------- */
(function smooth(){
  if (reduce()) return;
  const lenis = new Lenis({
    duration: 1.15,
    easing:   (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    smoothTouch: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -60, duration: 1.3 });
    });
  });
  window.__lenis = lenis;
})();

/* ---------- NAV scroll state ---------- */
(function navState(){
  const nav = $('#nav');
  if (!nav) return;
  ScrollTrigger.create({
    start: 80,
    end: 99999,
    onToggle: (self) => self.isActive
      ? nav.classList.add('is-stuck')
      : nav.classList.remove('is-stuck'),
  });
})();

/* ---------- HUD #1: IMAGE PREVIEW FOLLOWER ---------- */
(function imagePreview(){
  if (isCoarse()) return;
  const el  = $('#imagePreview');
  if (!el) return;
  const inner = el.querySelector('.image-preview__inner');
  let mx = 0, my = 0, tx = 0, ty = 0, visible = false;

  // mouse
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  // each card → set preview bg, show/hide
  $$('[data-preview]').forEach(card => {
    const url = card.dataset.preview;
    card.addEventListener('mouseenter', () => {
      inner.style.backgroundImage = `url(${url})`;
      el.classList.add('is-active');
      visible = true;
    });
    card.addEventListener('mouseleave', () => {
      el.classList.remove('is-active');
      visible = false;
    });
  });

  // smooth follow loop (lags slightly behind cursor)
  const loop = () => {
    tx += (mx - tx) * 0.22;
    ty += (my - ty) * 0.22;
    if (visible) {
      el.style.left = `${tx}px`;
      el.style.top  = `${ty}px`;
    }
    requestAnimationFrame(loop);
  };
  loop();
})();

/* ---------- HUD #2: SCROLL PROGRESS + section dots ---------- */
(function scrollProgress(){
  const fill = $('#scrollFill');
  const dots = $$('.scroll-progress__dots li');
  if (!fill || !dots.length) return;

  // Fill bar driven by scroll
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      fill.style.transform = `scaleY(${self.progress})`;
    },
  });

  // dots: which section is in view
  const targets = dots.map(li => $(li.dataset.target)).filter(Boolean);
  targets.forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive) {
          dots.forEach(d => d.classList.remove('is-active'));
          dots[i].classList.add('is-active');
        }
      }
    });
  });

  // click dot → scroll
  dots.forEach(li => {
    li.addEventListener('click', () => {
      const t = $(li.dataset.target);
      if (!t) return;
      window.__lenis
        ? window.__lenis.scrollTo(t, { offset: -60, duration: 1.2 })
        : t.scrollIntoView({ behavior: 'smooth' });
    });
  });
})();

/* ---------- HUD #3: MAGNETIC (cta 磁吸鼠标) ---------- */
(function magnetic(){
  if (isCoarse()) return;
  const mag = $$('.magnetic');
  if (!mag.length) return;
  const strength = 0.32;

  mag.forEach(el => {
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        gsap.to(el, {
          x: dx, y: dy,
          duration: 0.55,
          ease: 'power3.out',
        });
      });
    });
    el.addEventListener('mouseleave', () => {
      if (raf) cancelAnimationFrame(raf);
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, .5)' });
    });
  });
})();

/* ---------- HUD #4: CLICK RIPPLE ---------- */
(function ripples(){
  if (isCoarse()) return;
  const pool = $('#ripples');
  if (!pool) return;
  const colors = ['#F5F2EC', '#FF4500', '#51d88a', '#F5F2EC'];

  document.addEventListener('click', (e) => {
    const r = document.createElement('span');
    r.className = 'ripple';
    const size = 80 + Math.random() * 80;
    r.style.width  = `${size}px`;
    r.style.height = `${size}px`;
    r.style.left = `${e.clientX}px`;
    r.style.top  = `${e.clientY}px`;
    r.style.borderColor = colors[Math.floor(Math.random() * colors.length)];
    pool.appendChild(r);
    setTimeout(() => r.remove(), 950);
  });
})();

/* ---------- HERO title reveal (initial load) ---------- */
(function heroReveal(){
  if (reduce()) return;
  const lines = $$('.hero__title .line .inner');
  if (!lines.length) return;
  gsap.set(lines, { yPercent: 110 });
  gsap.set('.hero__meta',   { y: 12, opacity: 0 });
  gsap.set('.scroll-cue',   { y: 10, opacity: 0 });
  gsap.set('.hero__lede',   { y: 18, opacity: 0 });

  const tl = gsap.timeline({ delay: 0.35, defaults: { ease: 'expo.out' }});
  tl.to(lines,         { yPercent: 0, duration: 1.4, stagger: 0.09 })
    .to('.hero__meta', { y: 0, opacity: 1, duration: 0.9 }, '-=1.0')
    .to('.hero__lede', { y: 0, opacity: 1, duration: 0.9 }, '-=0.75')
    .to('.scroll-cue', { y: 0, opacity: 1, duration: 0.9 }, '<0.1');
})();

/* ---------- SECTION title reveal (scroll in) ---------- */
(function titleReveal(){
  if (reduce()) return;
  $$('.section__title, .contact__title').forEach(title => {
    const lines = $$('.line .inner', title);
    if (!lines.length) return;
    gsap.set(lines, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: title,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(lines, {
          yPercent: 0,
          duration: 1.2,
          stagger: .06,
          ease: 'expo.out',
        });
      }
    });
  });
})();

/* ---------- CARD: fade in, 3D tilt + image preview picks it up ---------- */
(function cards(){
  if (reduce()) return;
  gsap.set('.card', { opacity: 0, y: 24 });
  ScrollTrigger.batch('.card', {
    start: 'top 88%',
    onEnter: batch => {
      batch.forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1.0,
          delay: i * 0.05,
          ease: 'expo.out',
          onComplete: () => bindTilt(el)
        });
      });
    },
    onLeaveBack: self => gsap.set(self, { opacity: 1, y: 0 })
  });

  $$('.card').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight) bindTilt(el);
  });

  function bindTilt(card){
    if (isCoarse()) return;
    const media = card.querySelector('.card__media');
    if (!media) return;
    let raf = null;

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - .5;
      const py = (e.clientY - r.top)  / r.height - .5;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        gsap.to(card, {
          rotationX: -py * 5,
          rotationY:  px * 7,
          transformPerspective: 1000,
          duration: .55,
          ease: 'power3.out',
        });
        gsap.to(media, {
          x: px * 10,
          y: py * 10,
          duration: .6,
          ease: 'power3.out',
        });
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card,  { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'expo.out' });
      gsap.to(media, { x: 0, y: 0, duration: 1.0, ease: 'expo.out' });
    });
  }
})();

/* ---------- MARQUEE infinite ---------- */
(function marquees(){
  if (reduce()) return;
  $$('.marquee__track').forEach(track => {
    const speed = track.classList.contains('brands') ? 50 : 38;
    gsap.to(track, {
      xPercent: -50,
      duration: speed,
      ease: 'none',
      repeat: -1,
    });
  });
})();

/* ---------- HONORS item entrance ---------- */
(function honors(){
  if (reduce()) return;
  $$('.honors__item').forEach((li, i) => {
    gsap.set(li, { opacity: 0, y: 16 });
    ScrollTrigger.create({
      trigger: li,
      start: 'top 92%',
      once: true,
      onEnter: () => gsap.to(li, {
        opacity: 1, y: 0,
        duration: .9, delay: i * 0.06,
        ease: 'expo.out',
      })
    });
  });
})();

/* ---------- HERO blob parallax + video Ken Burns ---------- */
(function heroMotion(){
  if (reduce()) return;
  const blob = $('.hero__blob');
  if (blob) {
    gsap.to(blob, {
      yPercent: 30,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      }
    });
  }
  // parallax hero text up on scroll
  gsap.to('.hero__title', {
    yPercent: -12,
    opacity: 0.55,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    }
  });
})();

/* ---------- CARD VIDEOS: play only while visible ---------- */
(function cardVideos(){
  const vids = $$('.card__video');
  if (!vids.length) return;

  const tryPlay = (v) => {
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) tryPlay(en.target);
        else en.target.pause();
      });
    }, { threshold: 0.15 });
    vids.forEach((v) => io.observe(v));
  } else {
    vids.forEach(tryPlay);
  }

  // also resume after tab becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) vids.forEach((v) => {
      const r = v.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) tryPlay(v);
    });
  });
})();

/* ---------- SPIDER VOGUE · editorial spread slider ---------- */
(function editorial(){
  const stage  = $('#editorialStage');
  if (!stage) return;

  const imgs   = $$('.editorial__img', stage);
  const thumbs = $$('.editorial__thumbs li');
  const num    = $('#editorialNum');
  const name   = $('#editorialName');
  const desc   = $('#editorialDesc');
  const bar    = $('#editorialProgressBar');

  const data = [
    { num: '01 / 04', name: 'Loom I — Blue Silk Spider', desc: 'Asymmetric silk gown under a sculpted tulle veil — silk caught mid-spin / 2026' },
    { num: '02 / 04', name: 'Loom II — Rooted Black',   desc: 'Deconstructed black volume bound in chain — tension held at the seams / 2026' },
    { num: '03 / 04', name: 'Loom III — Cobweb Silver', desc: 'Pleated silver gown with a bone-line shoulder piece — the web made wearable / 2026' },
    { num: '04 / 04', name: 'Loom IV — Iron Bramble',   desc: 'Black leather cut with embroidered bramble chains — thorn and thread as one / 2026' },
  ];

  let cur = 0;
  let paused = false;
  let progress = 0;
  let raf = null;
  const INTERVAL = 5500;

  const goTo = (next) => {
    if (next === cur) return;
    const prev = cur;
    cur = ((next % imgs.length) + imgs.length) % imgs.length;

    imgs[prev].classList.remove('is-active');
    imgs[prev].classList.add('is-leaving');
    imgs[cur].classList.remove('is-leaving');
    imgs[cur].classList.add('is-active');

    window.setTimeout(() => imgs[prev].classList.remove('is-leaving'), 700);

    thumbs.forEach((t) => t.classList.toggle('is-active', Number(t.dataset.i) === cur));

    if (typeof gsap !== 'undefined') {
      gsap.to([num, name, desc], {
        opacity: 0, y: 6, duration: .25, ease: 'power2.in',
        onComplete: () => {
          num.textContent  = data[cur].num;
          name.textContent = data[cur].name;
          desc.textContent = data[cur].desc;
          gsap.to([num, name, desc], { opacity: 1, y: 0, duration: .4, ease: 'power2.out' });
        }
      });
    } else {
      num.textContent  = data[cur].num;
      name.textContent = data[cur].name;
      desc.textContent = data[cur].desc;
    }

    progress = 0;
    if (bar) bar.style.width = '0%';
  };

  const tick = () => {
    if (!paused) {
      progress += 1000 / 60;
      if (bar) bar.style.width = Math.min(100, (progress / INTERVAL) * 100) + '%';
      if (progress >= INTERVAL) goTo(cur + 1);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  thumbs.forEach((t) => {
    t.addEventListener('click', () => goTo(Number(t.dataset.i)));
  });

  const onEnter = () => { paused = true;  };
  const onLeave = () => { paused = false; progress = 0; if (bar) bar.style.width = '0%'; };
  stage.addEventListener('mouseenter', onEnter);
  stage.addEventListener('mouseleave', onLeave);
  $('#editorialThumbs').addEventListener('mouseenter', onEnter);
  $('#editorialThumbs').addEventListener('mouseleave', onLeave);

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { paused = !es[0].isIntersecting; }, { threshold: 0.05 });
    io.observe(stage);
  }

  if (typeof gsap !== 'undefined' && !reduce()) {
    gsap.set('.editorial__stage', { opacity: 0, y: 40 });
    gsap.set('.editorial__thumbs li', { opacity: 0, x: 20 });
    ScrollTrigger.create({
      trigger: '.editorial',
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to('.editorial__stage', { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out' });
        gsap.to('.editorial__thumbs li', { opacity: 1, x: 0, duration: .8, stagger: .08, delay: .25, ease: 'expo.out' });
      }
    });
  }

  // 3D 鼠标倾斜 (复用 card tilt 的轻量版)
  if (!reduce() && !isCoarse() && typeof gsap !== 'undefined') {
    let raf2 = null;
    stage.addEventListener('mousemove', (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width  - .5;
      const py = (e.clientY - r.top)  / r.height - .5;
      if (raf2) cancelAnimationFrame(raf2);
      raf2 = requestAnimationFrame(() => {
        gsap.to(stage, {
          rotationX: -py * 4, rotationY: px * 6,
          transformPerspective: 1200, duration: .8, ease: 'power3.out',
        });
      });
    });
    stage.addEventListener('mouseleave', () => {
      gsap.to(stage, { rotationX: 0, rotationY: 0, duration: 1.1, ease: 'expo.out' });
    });
  }
})();

/* ---------- LIGHTBOX: 点击作品卡放大播放完整影片 ---------- */
(function lightbox(){
  const box   = $('#lightbox');
  if (!box) return;
  const video = $('#lightboxVideo');
  const title = $('#lightboxTitle');

  const lockScroll  = (on) => {
    if (window.__lenis) on ? window.__lenis.stop() : window.__lenis.start();
    document.documentElement.style.overflow = on ? 'hidden' : '';
  };

  const open = (src, name) => {
    video.src = src;
    title.textContent = name || '';
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    const p = video.play();
    if (p && p.catch) p.catch(() => {}); // 静音自动播放被拒时仍显示播放器控件
  };

  const close = () => {
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    video.pause();
    // 释放资源, 避免后台继续缓冲
    window.setTimeout(() => { if (!box.classList.contains('is-open')) video.removeAttribute('src'); }, 500);
    lockScroll(false);
  };

  // 触发: 带完整影片的作品卡
  $$('[data-fullvideo]').forEach((li) => {
    const link = li.querySelector('.card__link') || li;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      open(li.dataset.fullvideo, li.dataset.fulltitle || '');
    });
  });

  // 关闭: 遮罩 / 按钮 / ESC
  $$('[data-lightbox-close]', box).forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && box.classList.contains('is-open')) close();
  });
})();

/* ---------- FOOTER local time ---------- */
(function clock(){
  const el = $('#time');
  if (!el) return;
  const tz   = 'Asia/Shanghai';
  const fmt  = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const render = () => {
    const t = fmt.format(new Date());
    el.textContent = `南宁 Nanning · ${t} GMT+8`;
  };
  render();
  setInterval(render, 30 * 1000);
})();

/* ---------- 24H CONVENIENCE STORE (hero interactive scene) ---------- */
(function storeScene(){
  const store = $('#store');
  if (!store) return;

  const frame  = $('#storeFrame');
  const timeEl = $('#storeTime');
  const phEl   = $('#storePhase');
  const range  = $('#storeRange');
  const btnLit = $('#storeLights');
  const btnAuto= $('#storeAuto');

  /* --- 时间 → 昼夜 --- */
  // daylight 曲线: 05:30 起 → 12:45 峰值 → 19:00 落
  const daylightAt = (m) => {
    const h = m / 60;
    if (h <= 5.5 || h >= 19) return 0;
    return Math.max(0, Math.sin(((h - 5.5) / 13.5) * Math.PI));
  };
  const phaseOf = (m) => {
    const h = m / 60;
    if (h < 5)   return ['深夜 · LATE NIGHT', 0];
    if (h < 8)   return ['清晨 · DAWN', 1];
    if (h < 11)  return ['上午 · MORNING', 2];
    if (h < 14)  return ['正午 · MIDDAY', 3];
    if (h < 17)  return ['下午 · AFTERNOON', 4];
    if (h < 19)  return ['黄昏 · DUSK', 5];
    if (h < 22)  return ['夜晚 · EVENING', 6];
    return ['深夜 · LATE NIGHT', 0];
  };
  const pad = (n) => String(n).padStart(2, '0');

  let minutes = range ? Number(range.value) : 1360;

  function render() {
    const m = ((minutes % 1440) + 1440) % 1440;
    const d = daylightAt(m);
    store.style.setProperty('--day',   d.toFixed(3));
    store.style.setProperty('--night', (1 - d).toFixed(3));
    if (timeEl) timeEl.textContent = `${pad(Math.floor(m / 60))}:${pad(Math.floor(m % 60))}`;
    if (phEl) {
      const [label] = phaseOf(m);
      phEl.textContent = label;
    }
    if (range && Number(range.value) !== Math.round(m)) range.value = String(Math.round(m));
  }
  render();

  if (range) {
    range.addEventListener('input', () => { minutes = Number(range.value); render(); });
  }

  /* --- 自动时间流动 --- */
  let timer = null;
  if (btnAuto) {
    btnAuto.addEventListener('click', () => {
      const on = btnAuto.getAttribute('aria-pressed') === 'true';
      if (on) {
        clearInterval(timer); timer = null;
        btnAuto.setAttribute('aria-pressed', 'false');
      } else {
        btnAuto.setAttribute('aria-pressed', 'true');
        timer = setInterval(() => { minutes += 3; render(); }, 60);
      }
    });
  }

  /* --- 店内灯光开关 (24H 营业, 关灯 = 清扫模式) --- */
  if (btnLit) {
    btnLit.addEventListener('click', () => {
      const on = btnLit.getAttribute('aria-pressed') === 'true';
      btnLit.setAttribute('aria-pressed', on ? 'false' : 'true');
      store.style.setProperty('--lit', on ? '0' : '1');
      const t = btnLit.querySelector('.bt');
      if (t) t.textContent = on ? '清扫中 · CLEANING' : '营业中 · OPEN';
    });
  }

  /* --- 热点 → 平滑滚动到板块 --- */
  const goTo = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    if (window.__lenis) window.__lenis.scrollTo(el, { offset: -60, duration: 1.4 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  $$('.store .hs').forEach((b) => {
    const target = b.dataset.go;
    if (!target) return;
    b.setAttribute('aria-label', (b.querySelector('b') ? b.querySelector('b').textContent + ' — ' : '') + target.replace('#', ''));
    b.addEventListener('click', () => goTo(target));
    // 门: hover 自动滑开
    if (b.classList.contains('hs--door') && frame) {
      const open  = () => frame.classList.add('is-door');
      const close = () => frame.classList.remove('is-door');
      b.addEventListener('mouseenter', open);
      b.addEventListener('mouseleave', close);
      b.addEventListener('focus', open);
      b.addEventListener('blur', close);
    }
  });

  /* --- 鼠标视差 --- */
  const soft = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!soft && fine && frame) {
    const inner = frame.querySelector('.m24-scene-in');
    const sheen = frame.querySelector('.m24-sheen');
    frame.addEventListener('mousemove', (e) => {
      const r = frame.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width  - .5;
      const ny = (e.clientY - r.top)  / r.height - .5;
      if (inner) inner.style.transform = `translate3d(${(nx * -14).toFixed(2)}px, ${(ny * -6).toFixed(2)}px, 0)`;
      if (sheen) sheen.style.transform = `translate3d(${(nx * 26).toFixed(2)}px, 0, 0)`;
    });
    frame.addEventListener('mouseleave', () => {
      if (inner) inner.style.transform = 'translate3d(0,0,0)';
      if (sheen) sheen.style.transform = 'translate3d(0,0,0)';
    });
  }

  /* --- 滚动视差 --- */
  if (!soft && window.ScrollTrigger) {
    gsap.fromTo('.store__frame', { y: 0 }, {
      y: -60, ease: 'none',
      scrollTrigger: { trigger: '.store', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  }
})();

/* ---------- REFRESH on fonts loaded ---------- */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
window.addEventListener('load', () => ScrollTrigger.refresh());

