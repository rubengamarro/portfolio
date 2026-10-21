(function () {
  'use strict';
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const safe = (fn) => { try { fn(); } catch (error) { /* Essential content remains available. */ } };

  function navigation() {
    const button = $('.menu-toggle');
    const nav = $('#navigation');
    const close = () => { nav.classList.remove('open'); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'Abrir menú'); };
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    $$('#navigation a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('open')) { close(); button.focus(); } });
    document.addEventListener('click', event => { if (!nav.contains(event.target) && !button.contains(event.target)) close(); });
    let scheduled = false;
    const progress = $('.scroll-progress');
    const update = () => {
      const distance = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (distance > 0 ? scrollY / distance * 100 : 0) + '%';
      scheduled = false;
    };
    addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function reveals() {
    if (motion.matches || !('IntersectionObserver' in window)) return;
    const elements = $$('[data-reveal]');
    const show = element => { element.classList.remove('reveal-pending'); element.classList.add('reveal-visible'); };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { show(entry.target); observer.unobserve(entry.target); } });
    }, { threshold: 0.04, rootMargin: '0px 0px 25px 0px' });
    elements.forEach(element => { element.classList.add('reveal-pending'); observer.observe(element); });
    setTimeout(() => { elements.forEach(show); observer.disconnect(); }, 6000);
    motion.addEventListener('change', event => { if (event.matches) { elements.forEach(show); observer.disconnect(); } });
  }

  function caseStudy() {
    $$('.project-dialog').forEach(dialog => {
      let trigger = null;
      $$('[data-open-project]').filter(button => button.dataset.openProject === dialog.id).forEach(button => {
        button.addEventListener('click', () => {
          trigger = button;
          dialog.showModal();
          dialog.scrollTop = 0;
          document.body.classList.add('dialog-open');
        });
      });
      $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
      });
      dialog.addEventListener('close', () => {
        document.body.classList.remove('dialog-open');
        if (trigger) trigger.focus({ preventScroll: true });
      });
    });
  }

  function copyEmail() {
    const button = $('#copy-email');
    const status = $('#copy-status');
    let timer;
    button.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText('rubengamarro@gmail.com');
        status.textContent = 'Email copiado.';
      } catch (error) {
        status.textContent = 'Puedes escribir a rubengamarro@gmail.com';
      }
      clearTimeout(timer);
      timer = setTimeout(() => { status.textContent = ''; }, 5000);
    });
  }

  function dataField() {
    const canvas = $('#data-field');
    const hero = $('.hero');
    const atmosphere = $('.hero-atmosphere');
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0, height = 0, points = [], frame = null, onScreen = true;
    const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, inside: false };
    let previousTime = 0;
    function resize() {
      const rect = atmosphere.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      points = [];
      const spacing = width < 650 ? 75 : 65;
      for (let x = 28; x < width; x += spacing) {
        for (let y = 50; y < height; y += spacing) {
          const seed = Math.sin(x * .139 + y * .173);
          points.push({ baseX: x + seed * 12, baseY: y + Math.cos(x * .11 + y * .17) * 15, x, y, phase: seed * 3 });
        }
      }
      draw(0);
    }
    function draw(time) {
      context.clearRect(0, 0, width, height);
      const reduced = motion.matches;
      pointer.x += (pointer.targetX - pointer.x) * .09;
      pointer.y += (pointer.targetY - pointer.y) * .09;
      const activity = reduced ? 0 : time * .00018;
      points.forEach(point => {
        const deltaX = point.baseX - pointer.x;
        const deltaY = point.baseY - pointer.y;
        const distance = Math.hypot(deltaX, deltaY);
        const force = !reduced && pointer.inside ? Math.max(0, 1 - distance / 210) : 0;
        point.x = point.baseX + Math.sin(activity + point.phase) * (reduced ? 0 : 6) + deltaX * force * .14;
        point.y = point.baseY + Math.cos(activity + point.phase) * (reduced ? 0 : 6) + deltaY * force * .14;
        const fade = .13 + Math.max(0, point.baseX / width - .3) * .25;
        context.fillStyle = 'rgba(95,125,172,' + (fade + force * .35) + ')';
        context.beginPath();
        context.arc(point.x, point.y, force ? 1.1 + force * 1.3 : .7, 0, Math.PI * 2);
        context.fill();
        if (force > .1) {
          context.strokeStyle = 'rgba(115,147,198,' + force * .15 + ')';
          context.lineWidth = .55;
          context.beginPath(); context.moveTo(point.x, point.y); context.lineTo(pointer.x, pointer.y); context.stroke();
        }
      });
      for (let line = 0; line < 6; line++) {
        const offset = line * 24;
        context.beginPath();
        for (let x = width * .4; x <= width + 40; x += 8) {
          const wave = Math.sin(x * .0032 + activity * .35 + line * .08);
          const influence = !reduced && pointer.inside ? Math.exp(-Math.pow((x - pointer.x) / 220, 2)) * 18 : 0;
          const y = height * .65 + wave * 105 + offset + influence;
          if (x === width * .4) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.strokeStyle = 'rgba(114,143,187,' + (.05 + line * .006) + ')';
        context.lineWidth = .7; context.stroke();
      }
    }
    function animate(time) {
      frame = null;
      if (motion.matches || !onScreen || document.hidden) return;
      if (time - previousTime > 31) { draw(time); previousTime = time; }
      frame = requestAnimationFrame(animate);
    }
    function run() { if (!frame && !motion.matches && onScreen && !document.hidden) frame = requestAnimationFrame(animate); }
    hero.addEventListener('pointermove', event => {
      if (motion.matches || !finePointer.matches) return;
      const bounds = atmosphere.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
      if (!pointer.inside) { pointer.x = pointer.targetX; pointer.y = pointer.targetY; }
      pointer.inside = true;
      atmosphere.style.setProperty('--mx', (pointer.targetX / width * 100) + '%');
      atmosphere.style.setProperty('--my', (pointer.targetY / height * 100) + '%');
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer.inside = false; });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(atmosphere);
    else addEventListener('resize', resize, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; run(); }, { threshold: 0 }).observe(hero);
    }
    motion.addEventListener('change', () => { if (frame) { cancelAnimationFrame(frame); frame = null; } draw(0); run(); });
    document.addEventListener('visibilitychange', run);
    resize(); run();
  }
  [navigation, reveals, caseStudy, copyEmail, dataField].forEach(safe);
})();
