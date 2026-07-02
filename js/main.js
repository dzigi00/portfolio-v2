/* ============================================================
   Ivan Zashov — Portfolio V.2  ·  interactions
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     Floating dust — tiny motes each drifting their own slow path,
     like specks caught in a sunbeam.
  --------------------------------------------------------- */
  function initDust() {
    const canvas = document.getElementById("dust");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, parts = [];

    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(window.innerWidth * dpr);
      h = canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      const count = Math.min(220, Math.round((window.innerWidth * window.innerHeight) / 13000));
      parts = [];
      for (let i = 0; i < count; i++) {
        const speed = 0.09 + Math.random() * 0.14; // slow
        const ang = Math.random() * Math.PI * 2;    // each its own direction
        parts.push({
          x: Math.random() * w, y: Math.random() * h,
          r: (0.4 + Math.random() * 1.3) * dpr,
          base: 0.06 + Math.random() * 0.34,        // dim → medium (some catch the light)
          vx: Math.cos(ang) * speed * dpr,
          vy: Math.sin(ang) * speed * dpr,
          tw: Math.random() * Math.PI * 2,
          tws: 0.004 + Math.random() * 0.012,
          cyan: Math.random() < 0.18,               // a few faint cyan motes
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -6) p.x = w + 6; else if (p.x > w + 6) p.x = -6;
        if (p.y < -6) p.y = h + 6; else if (p.y > h + 6) p.y = -6;
        p.tw += p.tws;
        const op = p.base * (0.55 + 0.45 * Math.sin(p.tw));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cyan ? "rgba(120,220,240," + op + ")" : "rgba(255,255,255," + op + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }

    let raf;
    build();
    window.addEventListener("resize", build);
    if (reduceMotion) { // draw a single static frame
      for (const p of parts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255," + p.base + ")"; ctx.fill(); }
      return;
    }
    frame();
  }

  /* ---------------------------------------------------------
     2. Preloader
  --------------------------------------------------------- */
  function runPreloader(done) {
    const num = document.getElementById("loaderNum");
    const bar = document.getElementById("loaderBar");
    const loader = document.getElementById("loader");
    let finished = false;
    function finish(animate) {
      if (finished) return;
      finished = true;
      document.body.classList.remove("is-loading");
      if (loader) {
        if (animate && hasGSAP && !reduceMotion) {
          gsap.to(loader, { yPercent: -100, duration: 0.9, ease: "power4.inOut",
            onComplete() { loader.style.display = "none"; } });
        } else {
          loader.style.display = "none";
        }
      }
      done();
    }

    if (!loader || reduceMotion || !hasGSAP) { finish(false); return; }

    // Hard failsafe: never let the loader trap the page, even if a CDN stalls.
    const failsafe = setTimeout(() => finish(true), 4000);

    const obj = { v: 0 };
    gsap.to(obj, {
      v: 100, duration: 1.7, ease: "power2.inOut",
      onUpdate() {
        const val = Math.round(obj.v);
        if (num) num.textContent = val;
        if (bar) bar.style.width = val + "%";
      },
      onComplete() {
        clearTimeout(failsafe);
        gsap.delayedCall(0.15, () => finish(true));
      },
    });
  }

  /* ---------------------------------------------------------
     3. Smooth scroll (Lenis) + ScrollTrigger sync
  --------------------------------------------------------- */
  let lenis = null;
  function initSmoothScroll() {
    if (reduceMotion || typeof Lenis === "undefined") return;
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    window.lenis = lenis;
    if (hasGSAP && typeof ScrollTrigger !== "undefined") {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length > 1) { e.preventDefault(); lenis.scrollTo(id, { offset: -10, duration: 1.2 }); }
        else { e.preventDefault(); lenis.scrollTo(0, { duration: 1.2 }); }
      });
    });
  }

  /* ---------------------------------------------------------
     4. Hero headline reveal
  --------------------------------------------------------- */
  function animateHero() {
    if (!hasGSAP || reduceMotion) return;
    const tl = gsap.timeline({ delay: 0.1 });
    // Lamp "switches on" — flares, line and core grow out from the centre.
    tl.from(".lamp__line", { width: "8rem", duration: 0.9, ease: "power2.inOut" }, 0)
      .from(".lamp__core", { width: "8rem", opacity: 0, duration: 0.9, ease: "power2.inOut" }, 0)
      .from(".lamp__bloom", { opacity: 0, duration: 1, ease: "power2.out" }, 0)
      .from(".lamp__content > *", { y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.12 }, 0.35);
  }

  /* ---------------------------------------------------------
     5. Scroll reveals
  --------------------------------------------------------- */
  function initReveals() {
    if (!hasGSAP || typeof ScrollTrigger === "undefined") {
      document.querySelectorAll(".reveal-up, .reveal-line").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    gsap.utils.toArray(".reveal-up").forEach((el) => {
      if (el.closest(".hero")) return; // hero handled separately
      gsap.to(el, {
        y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
    // contact title words
    gsap.utils.toArray(".contact__title .w").forEach((w) => gsap.set(w, { yPercent: 120 }));
    ScrollTrigger.create({
      trigger: ".contact__title", start: "top 80%",
      onEnter: () => gsap.to(".contact__title .w", { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.08 }),
    });
    // work title lift
    gsap.utils.toArray(".about__big.reveal-line").forEach((el) => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
  }

  /* ---------------------------------------------------------
     6. Animated counters
  --------------------------------------------------------- */
  function initCounters() {
    function run(el) {
      if (el.dataset.done) return;
      el.dataset.done = "1";
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || "";
      const prefix = el.dataset.prefix || "";
      if (!hasGSAP || reduceMotion) { el.textContent = prefix + target + suffix; return; }
      let raf;
      const startT = performance.now();
      const dur = 1800;
      (function tick(now) {
        const p = Math.min(1, (now - startT) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) raf = requestAnimationFrame(tick);
      })(startT);
    }
    // Scroll-driven visibility check via getBoundingClientRect — robust against
    // position:sticky (which ScrollTrigger mis-measures) and embedded preview
    // renderers (where IntersectionObserver may not fire). No perpetual rAF, so
    // the page can go idle when the user isn't scrolling.
    const els = Array.prototype.slice.call(document.querySelectorAll(".count, .card__stat-num"));
    function check() {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.88 && r.bottom > 0) { run(el); els.splice(i, 1); }
      }
      if (!els.length) {
        window.removeEventListener("scroll", check);
        if (lenis) lenis.off("scroll", check);
      }
    }
    window.addEventListener("scroll", check, { passive: true });
    if (lenis) lenis.on("scroll", check);
    check(); // catch anything already in view on load
  }

  /* ---------------------------------------------------------
     7. Card parallax depth on the browser mockups
  --------------------------------------------------------- */
  function initTiltProjects() {
    const frames = document.querySelectorAll(".tproj__frame");
    if (!frames.length) return;
    // Without GSAP/ScrollTrigger (or reduced motion), the frames stay flat — CSS default.
    if (!hasGSAP || typeof ScrollTrigger === "undefined" || reduceMotion) return;
    const isMobile = window.innerWidth <= 768;
    const reveals = []; // header entrances, revealed via live position check
    frames.forEach((frame) => {
      const proj = frame.closest(".tproj");
      const head = proj.querySelector(".tproj__head");
      gsap.set(frame, { rotateX: 20, scale: isMobile ? 0.95 : 1.05 });
      gsap.to(frame, {
        rotateX: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: proj, start: "top 82%", end: "top 32%", scrub: 0.6 },
      });
      if (head) {
        // subtle parallax drift on the whole header as it passes
        gsap.fromTo(head, { y: 52 }, {
          y: -26, ease: "none",
          scrollTrigger: { trigger: proj, start: "top 82%", end: "top 32%", scrub: 0.6 },
        });
        // hide the header pieces now; reveal them when the project actually enters
        // the viewport (live getBoundingClientRect check — immune to layout shift,
        // font loading, etc. so every project animates, not just the first ones)
        gsap.set(head.children, { y: 40, opacity: 0, filter: "blur(8px)" });
        reveals.push({ head: head, done: false });
      }
    });

    function checkReveals() {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      let remaining = 0;
      reveals.forEach((r) => {
        if (r.done) return;
        const rect = r.head.getBoundingClientRect();
        if (rect.top < vh * 0.82 && rect.bottom > 0) {
          r.done = true;
          gsap.to(r.head.children, { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out", stagger: 0.12 });
        } else { remaining++; }
      });
      if (!remaining) { window.removeEventListener("scroll", checkReveals); if (lenis) lenis.off("scroll", checkReveals); }
    }
    window.addEventListener("scroll", checkReveals, { passive: true });
    if (lenis) lenis.on("scroll", checkReveals);
    checkReveals();
  }

  /* ---------------------------------------------------------
     7b. Funnel / System showcase switcher
  --------------------------------------------------------- */
  function initShowcase() {
    const sec = document.getElementById("system");
    if (!sec) return;
    const statusEl = sec.querySelector("[data-status]");
    const STATUS = { funnel: "Front-stage · live", system: "Backstage · always on" };

    function setSide(side) {
      sec.dataset.active = side;
      sec.querySelectorAll("[data-side]").forEach((el) => {
        const on = el.dataset.side === side;
        el.classList.toggle("is-active", on);
        if (el.classList.contains("sc-switch__btn")) el.setAttribute("aria-selected", on ? "true" : "false");
      });
      if (statusEl) statusEl.textContent = STATUS[side] || "";
    }

    sec.querySelectorAll(".sc-switch__btn").forEach((btn) => {
      btn.addEventListener("click", () => setSide(btn.dataset.side));
    });

    // Reveal metric bars when the section scrolls into view (scroll-driven,
    // not IntersectionObserver — see initCounters note).
    function check() {
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.top < vh * 0.8 && r.bottom > 0) {
        sec.classList.add("is-inview");
        window.removeEventListener("scroll", check);
        if (lenis) lenis.off("scroll", check);
      }
    }
    window.addEventListener("scroll", check, { passive: true });
    if (lenis) lenis.on("scroll", check);
    check();
  }

  /* ---------------------------------------------------------
     8. Nav show/hide on scroll
  --------------------------------------------------------- */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    function update(y) {
      nav.classList.toggle("is-scrolled", y > 40);
    }
    if (lenis) lenis.on("scroll", ({ scroll }) => update(scroll));
    else window.addEventListener("scroll", () => update(window.scrollY));
  }

  /* ---------------------------------------------------------
     8b. Tubelight pill nav — glowing light slides to the active item
  --------------------------------------------------------- */
  function initTubelight() {
    const pill = document.querySelector(".nav__pill");
    if (!pill) return;
    const lamp = pill.querySelector(".nav__lamp");
    const items = Array.prototype.slice.call(pill.querySelectorAll(".nav__pill-item"));
    if (!lamp || !items.length) return;

    function place(item) {
      lamp.style.left = item.offsetLeft + "px";
      lamp.style.width = item.offsetWidth + "px";
    }
    function activate(item) {
      items.forEach((i) => i.classList.toggle("is-active", i === item));
      place(item);
    }

    items.forEach((item) => item.addEventListener("click", () => activate(item)));

    // scroll-spy: light follows whichever section is in view
    const spy = items.map((i) => {
      const href = i.getAttribute("href");
      return { item: i, target: href === "#top" ? document.getElementById("top") : document.querySelector(href) };
    });
    function onScroll() {
      const y = window.scrollY + window.innerHeight * 0.35;
      let current = spy[0];
      spy.forEach((s) => { if (s.target && s.target.offsetTop <= y) current = s; });
      if (current && !current.item.classList.contains("is-active")) activate(current.item);
    }
    if (lenis) lenis.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      const active = items.find((i) => i.classList.contains("is-active")) || items[0];
      place(active);
    });

    // initial position (after layout settles)
    requestAnimationFrame(() => { place(items.find((i) => i.classList.contains("is-active")) || items[0]); onScroll(); });
  }

  /* ---------------------------------------------------------
     9. Custom cursor + magnetic buttons
  --------------------------------------------------------- */
  function initCursor() {
    // No custom cursor — just the native pointer. Keep magnetic buttons.
    if (window.matchMedia("(hover: none)").matches || reduceMotion || !hasGSAP) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
    });
  }

  /* ---------------------------------------------------------
     Boot
  --------------------------------------------------------- */
  function boot() {
    initDust();
    initSmoothScroll();
    initReveals();
    initCounters();
    initTiltProjects();
    initNav();
    initTubelight();
    initCursor();
    animateHero();
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.refresh();
      // reccompute trigger positions once everything (fonts, images) has loaded,
      // so later projects still animate even after layout settles
      window.addEventListener("load", () => ScrollTrigger.refresh());
      document.querySelectorAll(".tproj__screen img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
