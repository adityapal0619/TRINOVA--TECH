/**
 * TRINOVA TECH — script.js
 * Physics-based animation engine
 *
 * Systems:
 *  1. Custom cursor
 *  2. Navbar scroll behaviour
 *  3. Particle canvas (hero background)
 *  4. Floating cards parallax (cursor-driven)
 *  5. Mobile hamburger menu
 *  6. Scroll reveal (IntersectionObserver)
 *  7. Animated number counters
 *  8. Services grid cursor-proximity repulsion
 *  9. Orbital portfolio system (RAF loop + click focus)
 * 10. Contact form handling
 * 11. Reduced motion check
 */

'use strict';

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────────────────────────────────────────────────
   1. CUSTOM CURSOR
───────────────────────────────────────────────────────── */
(function initCursor() {
  const glow = $('#cursor-glow');
  const dot  = $('#cursor-dot');
  if (!glow || !dot) return;

  let mx = 0, my = 0;
  let gx = 0, gy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  document.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
    dot.style.opacity  = '0';
  });
  document.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
    dot.style.opacity  = '1';
  });

  if (!reducedMotion) {
    function animateCursor() {
      gx = lerp(gx, mx, 0.08);
      gy = lerp(gy, my, 0.08);
      glow.style.left = gx + 'px';
      glow.style.top  = gy + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  } else {
    document.addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }
})();

/* ─────────────────────────────────────────────────────────
   2. NAVBAR SCROLL BEHAVIOUR + ACTIVE LINK
───────────────────────────────────────────────────────── */
(function initNavbar() {
  const navbar = $('#navbar');
  const navLinks = $$('.nav-link');
  const sections = $$('.section');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link highlighting
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      if (window.scrollY >= top) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
})();

/* ─────────────────────────────────────────────────────────
   3. MOBILE HAMBURGER
───────────────────────────────────────────────────────── */
(function initHamburger() {
  const btn  = $('#hamburger-btn');
  const menu = $('#mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  });

  // Close on mobile link click
  $$('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
    });
  });
})();

/* ─────────────────────────────────────────────────────────
   4. PARTICLE CANVAS (HERO)
───────────────────────────────────────────────────────── */
(function initParticles() {
  const canvas = $('#particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const PARTICLE_COUNT = window.innerWidth < 768 ? 60 : 120;
  const COLORS = [
    'rgba(0,245,255,',
    'rgba(139,92,246,',
    'rgba(240,171,252,'
  ];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function createParticle() {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.3,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 0.4 + 0.15), // drift upward mostly
      alpha: Math.random() * 0.5 + 0.1,
      color,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      p.pulse += p.pulseSpeed;
      const currentAlpha = p.alpha + Math.sin(p.pulse) * 0.15;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + clamp(currentAlpha, 0, 1) + ')';
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
    });

    // Draw subtle connections between close particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,245,255,${0.06 * (1 - dist / 80)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  let raf;
  function loop() {
    if (!reducedMotion) draw();
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { resize(); }, { passive: true });

  init();
  if (!reducedMotion) loop();
})();

/* ─────────────────────────────────────────────────────────
   5. FLOATING CARDS — CURSOR PARALLAX
───────────────────────────────────────────────────────── */
(function initFloatingCards() {
  if (reducedMotion) return;

  const cards = $$('.floating-card');
  let mouseX = 0, mouseY = 0;
  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  const targets = cards.map(card => ({
    el: card,
    depth: parseFloat(card.dataset.depth || 0.5),
    tx: 0, ty: 0,
    cx: 0, cy: 0,
  }));

  function animate() {
    const dx = mouseX - cx;
    const dy = mouseY - cy;

    targets.forEach(t => {
      const targetX = dx * t.depth * 0.04;
      const targetY = dy * t.depth * 0.04;
      t.tx = lerp(t.tx, targetX, 0.06);
      t.ty = lerp(t.ty, targetY, 0.06);
      // Apply on top of CSS float animation
      t.el.style.setProperty('--px', t.tx + 'px');
      t.el.style.setProperty('--py', t.ty + 'px');
      t.el.style.transform = `translate(var(--px,0), var(--py,0))`;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

/* ─────────────────────────────────────────────────────────
   6. SCROLL REVEAL (IntersectionObserver)
───────────────────────────────────────────────────────── */
(function initScrollReveal() {
  const targets = $$('.reveal-up, .reveal-left, .reveal-right');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────────────────────
   7. ANIMATED COUNTERS
───────────────────────────────────────────────────────── */
(function initCounters() {
  const counters = $$('.stat-num[data-target]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const step = (target / duration) * 16;
      let val = 0;

      const tick = () => {
        val = Math.min(val + step, target);
        el.textContent = Math.floor(val);
        if (val < target) requestAnimationFrame(tick);
        else el.textContent = target;
      };
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ─────────────────────────────────────────────────────────
   8. SERVICES CARDS — CURSOR-PROXIMITY REPULSION
───────────────────────────────────────────────────────── */
(function initServiceRepulsion() {
  if (reducedMotion) return;

  const grid   = $('#services-grid');
  const cards  = $$('.service-card', grid || document);
  if (!grid) return;

  const REPEL_RADIUS  = 200;
  const REPEL_STRENGTH = 18;

  const cardData = cards.map(card => ({
    el: card,
    ox: 0, oy: 0,  // offset targets
    cx: 0, cy: 0,  // current lerped position
  }));

  let mouseX = -9999, mouseY = -9999;
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function repelLoop() {
    cardData.forEach(data => {
      const rect = data.el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
        data.ox = -(dx / dist) * force;
        data.oy = -(dy / dist) * force;
      } else {
        data.ox = 0;
        data.oy = 0;
      }

      data.cx = lerp(data.cx, data.ox, 0.08);
      data.cy = lerp(data.cy, data.oy, 0.08);

      // Don't fight with hover CSS transform
      if (!data.el.matches(':hover')) {
        data.el.style.transform = `translate(${data.cx}px, ${data.cy}px)`;
      }
    });
    requestAnimationFrame(repelLoop);
  }
  repelLoop();
})();

/* ─────────────────────────────────────────────────────────
   9. ORBITAL PORTFOLIO
───────────────────────────────────────────────────────── */
(function initOrbital() {
  const system  = $('#orbital-system');
  const items   = $$('.orbital-item');
  const overlay = $('#focus-overlay');
  const panel   = $('#focus-panel');
  const closeBtn= $('#focus-close-btn');
  if (!system || items.length === 0) return;

  // Project data
  const projects = [
    {
      num: '01', title: 'OmniStore', cat: 'E-Commerce',
      desc: 'A headless Shopify Plus rebuild for a leading D2C brand. Lowered load times to under 1.2s, resulting in a 34% increase in conversion rate.',
      tags: ['Next.js', 'Shopify', 'Tailwind', 'Redis'],
    },
    {
      num: '02', title: 'FinDash', cat: 'SaaS App',
      desc: 'A high-performance financial dashboard handling real-time WebSocket streams for crypto trading. Beautiful UX meets hardcore engineering.',
      tags: ['React', 'Node.js', 'WebSockets', 'PostgreSQL'],
    },
    {
      num: '03', title: 'Nexus AI', cat: 'Landing Page',
      desc: 'An ultra-premium marketing site for an AI startup. Features custom WebGL physics and complex scroll-driven animations optimized for 60fps.',
      tags: ['Three.js', 'Framer Motion', 'SCSS', 'Vite'],
    },
    {
      num: '04', title: 'MedSync', cat: 'Healthcare Portal',
      desc: 'A robust, HIPAA-compliant patient portal that connects 120+ clinics securely. Built with rigorous security patterns and automated testing.',
      tags: ['TypeScript', 'Express', 'Docker', 'AWS'],
    },
    {
      num: '05', title: 'Zenith', cat: 'Corporate Site',
      desc: 'A fully headless CMS implementation for a Fortune 500 company. Reduced publishing workflows from days to minutes with complete SEO dominance.',
      tags: ['Sanity.io', 'Next.js', 'GraphQL', 'Vercel'],
    },
    {
      num: '06', title: 'ChainLog', cat: 'Web3 Platform',
      desc: 'A decentralized application connecting smart contracts with a beautiful front-end interface. Lightning fast indexing and transaction tracking.',
      tags: ['Solidity', 'Web3.js', 'React', 'The Graph'],
    },
  ];

  // Orbital radii for two elliptical orbits
  const ORBIT_CONFIG = [
    { rx: 280, ry: 180, speed: 0.00035 },  // outer orbit
    { rx: 200, ry: 130, speed: 0.00055 },  // inner orbit
  ];

  // Assign items to orbits alternately
  const itemData = items.map((el, i) => ({
    el,
    orbitIdx: i % 2,
    angle: (i / items.length) * Math.PI * 2,
  }));

  let running  = true;
  let focused  = false;

  function getCenter() {
    const rect = system.getBoundingClientRect();
    return {
      cx: system.offsetWidth  / 2,
      cy: system.offsetHeight / 2,
    };
  }

  function positionItems(ts) {
    if (focused) return;
    const { cx, cy } = getCenter();

    itemData.forEach(d => {
      const config = ORBIT_CONFIG[d.orbitIdx];
      d.angle += config.speed;
      const x = cx + config.rx * Math.cos(d.angle) - d.el.offsetWidth  / 2;
      const y = cy + config.ry * Math.sin(d.angle) - d.el.offsetHeight / 2;
      d.el.style.left = x + 'px';
      d.el.style.top  = y + 'px';
    });

    if (running) requestAnimationFrame(positionItems);
  }

  if (!reducedMotion) {
    // Set initial position
    requestAnimationFrame(positionItems);
  } else {
    // Static grid fallback for reduced-motion users
    system.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;height:auto;';
    items.forEach(el => {
      el.style.position = 'static';
      el.style.width = '100%';
      el.style.height = '100px';
    });
    const core = $('#orbital-core');
    if (core) core.style.display = 'none';
  }

  // Focus panel logic
  function openFocus(index) {
    focused = true;
    const proj = projects[index];
    if (!proj) return;

    $('#focus-num').textContent  = proj.num;
    $('#focus-title').textContent= proj.title;
    $('#focus-cat').textContent  = proj.cat;
    $('#focus-desc').textContent = proj.desc;
    const tagsEl = $('#focus-tags');
    tagsEl.innerHTML = proj.tags.map(t => `<span class="sc-tag">${t}</span>`).join('');

    // Dim non-focused orbital items
    items.forEach((el, i) => {
      el.style.opacity = i === index ? '1' : '0.25';
      el.style.filter  = i === index ? 'none' : 'blur(2px)';
    });

    overlay.classList.add('active');
    overlay.removeAttribute('aria-hidden');
    panel.classList.add('active');
    panel.removeAttribute('aria-hidden');
    panel.focus();
  }

  function closeFocus() {
    focused = false;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');

    items.forEach(el => {
      el.style.opacity = '1';
      el.style.filter  = 'none';
    });
  }

  items.forEach((el, i) => {
    el.addEventListener('click',  () => openFocus(i));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFocus(i); } });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeFocus);
  if (overlay)  overlay.addEventListener('click', closeFocus);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && focused) closeFocus(); });

  // Visibility pause (performance)
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running && !reducedMotion && !focused) requestAnimationFrame(positionItems);
  });
})();

/* ─────────────────────────────────────────────────────────
   10. CONTACT FORM
───────────────────────────────────────────────────────── */
(function initContactForm() {
  const form   = $('#contact-form');
  const btn    = $('#form-submit-btn');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name    = $('#cf-name').value.trim();
    const email   = $('#cf-email').value.trim();
    const service = $('#cf-service').value;
    const date    = $('#cf-date').value;
    const message = $('#cf-message').value.trim();

    if (!name || !email || !service || !date || !message) {
      shakeForm();
      return;
    }

    // Simulate async scheduling
    btn.disabled = true;
    const launchText = btn.querySelector('.launch-text');
    launchText.textContent = 'Scheduling... ⏳';

    setTimeout(() => {
      launchText.textContent = 'Meeting Booked! ✓';
      btn.style.background   = 'linear-gradient(135deg, #10b981, #059669)';

      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        launchText.textContent = 'Schedule Meeting 📅';
        btn.style.background   = '';
      }, 3000);
    }, 1800);
  });

  function shakeForm() {
    form.style.animation = 'none';
    void form.offsetWidth; // reflow
    form.style.animation = 'shake 0.4s ease';
    form.addEventListener('animationend', () => { form.style.animation = ''; }, { once: true });
  }
})();

/* Shake keyframe (injected into head) */
(function injectShakeAnimation() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-8px)}
      40%{transform:translateX(8px)}
      60%{transform:translateX(-6px)}
      80%{transform:translateX(6px)}
    }
  `;
  document.head.appendChild(style);
})();

/* ─────────────────────────────────────────────────────────
   11. HERO SCROLL — INVERSE PARALLAX
───────────────────────────────────────────────────────── */
(function initHeroScroll() {
  if (reducedMotion) return;

  const heroContent = $('.hero-content');
  const canvas      = $('#particle-canvas');
  if (!heroContent) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const h = window.innerHeight;
    if (scrollY > h) return;

    const progress = scrollY / h;
    // Hero content drifts upward slower than scroll
    heroContent.style.transform  = `translateY(${-scrollY * 0.3}px)`;
    heroContent.style.opacity    = 1 - progress * 1.8;
    if (canvas) canvas.style.transform = `translateY(${-scrollY * 0.1}px)`;
  }, { passive: true });
})();

/* ─────────────────────────────────────────────────────────
   12. SMOOTH ANCHOR SCROLLING (override for nav CTA)
───────────────────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─────────────────────────────────────────────────────────
   13. NAV CTA — scroll to contact
───────────────────────────────────────────────────────── */
const navCta = $('#nav-cta-btn');
if (navCta) {
  navCta.addEventListener('click', () => {
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ─────────────────────────────────────────────────────────
   14. SERVICE CARD — TILT EFFECT
───────────────────────────────────────────────────────── */
(function initCardTilt() {
  if (reducedMotion) return;

  $$('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const cx    = rect.left + rect.width  / 2;
      const cy    = rect.top  + rect.height / 2;
      const rx    = ((e.clientY - cy) / (rect.height / 2)) * 8;
      const ry    = ((e.clientX - cx) / (rect.width  / 2)) * -8;
      card.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-12px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

console.log('%c⬡ TRINOVA TECH%c Engine Initialized', 'color:#00f5ff;font-size:1.2rem;font-weight:bold;', 'color:#8b5cf6;font-size:0.875rem;');
