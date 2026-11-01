// Simple, framework-free interactions. Works in VS Code Live Server or a normal browser.

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

function closeMenu() {
  if (!menuToggle || !nav) return;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation menu');
  nav.classList.remove('is-open');
}

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation menu' : 'Close navigation menu');
    nav.classList.toggle('is-open', !isOpen);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  document.addEventListener('click', event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
}

// Project filters — updates visible cards and accessible pressed states.
const filterButtons = [...document.querySelectorAll('.filter-btn')];
const projectCards = [...document.querySelectorAll('.project-card')];
const countLabel = document.getElementById('visible-count');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    let visibleCount = 0;
    filterButtons.forEach(item => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    projectCards.forEach(card => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    if (countLabel) countLabel.textContent = String(visibleCount);
  });
});

// Subtle active-link highlighting, where supported.
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const navSections = navLinks
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && navSections.length) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      navLinks.forEach(link => {
        link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  }, { rootMargin: '-24% 0px -68% 0px', threshold: 0 });
  navSections.forEach(section => observer.observe(section));
}

const year = document.getElementById('current-year');
if (year) year.textContent = new Date().getFullYear();

// Optional light 3D perspective movement on pointer-capable devices.
// Avoids running for users who request reduced motion.
const portraitStage = document.querySelector('.portrait-stage');
const heroVisual = document.querySelector('.hero-visual');
const tiltAllowed = window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
if (portraitStage && heroVisual && tiltAllowed) {
  heroVisual.addEventListener('pointermove', event => {
    if (document.body.classList.contains('motion-paused')) return;
    const bounds = heroVisual.getBoundingClientRect();
    const relX = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
    const relY = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
    portraitStage.style.setProperty('--ry', `${Math.max(-5,Math.min(5,relX*5))}deg`);
    portraitStage.style.setProperty('--rx', `${Math.max(-4,Math.min(4,-relY*4))}deg`);
  });
  heroVisual.addEventListener('pointerleave', () => {
    portraitStage.style.setProperty('--ry', '0deg');
    portraitStage.style.setProperty('--rx', '0deg');
  });
}


// User-visible motion toggle: pauses moving portrait ring / signal bars.
const motionToggle = document.querySelector('.motion-toggle');
if (motionToggle) {
  motionToggle.addEventListener('click', () => {
    const paused = document.body.classList.toggle('motion-paused');
    motionToggle.textContent = paused ? 'Play animation' : 'Pause animation';
    motionToggle.setAttribute('aria-pressed', String(paused));
    if (paused && portraitStage) {
      portraitStage.style.setProperty('--ry', '0deg');
      portraitStage.style.setProperty('--rx', '0deg');
    }
  });
}

// Reveal cards as they enter the viewport. No JS => content remains visible.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealItems = [...document.querySelectorAll('.project-card, .tool-card, .expertise-card, .timeline-item')];
  revealItems.forEach(item => item.setAttribute('data-reveal', ''));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .08, rootMargin: '0px 0px 36px 0px' });
  revealItems.forEach(item => revealObserver.observe(item));
  document.documentElement.classList.add('motion-enhanced');
}


// Universal card interaction: adds hover-lift spotlight to all card-like elements.
const hoverCards = [...document.querySelectorAll('.fact-strip > div, .expertise-card, .tool-card, .project-card, .timeline-item, .leadership-entry, .education-item, .social-link')];
hoverCards.forEach(card => card.classList.add('hover-card'));
const hoverCapable = window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)').matches;
if (hoverCapable) {
  hoverCards.forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
    });
  });
}


// Typewriter: four fixed-position phrases, typing left-to-right and erasing right-to-left.
// The line itself never travels horizontally. Respects reduced motion and Pause animation.
(() => {
  const target = document.getElementById('typing-text');
  if (!target) return;
  const messages = [
    'Exploring Data',
    'Discovering Insights',
    'Visualizing Information',
    'Making Data-Driven Decisions'
  ];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    target.textContent = messages[0];
    return;
  }
  let message = 0;
  let count = 0;
  let phase = 'typing';
  let remaining = 0;
  let previous = 0;
  const speeds = { typing: 95, holding: 1450, erasing: 48, next: 350 };
  target.textContent = '';
  function frame(now) {
    if (!previous) previous = now;
    const elapsed = Math.min(now - previous, 100);
    previous = now;
    if (!document.body.classList.contains('motion-paused')) {
      remaining -= elapsed;
      if (remaining <= 0) {
        if (phase === 'typing') {
          count = Math.min(count + 1, messages[message].length);
          target.textContent = messages[message].slice(0, count);
          remaining = speeds.typing;
          if (count === messages[message].length) { phase = 'holding'; remaining = speeds.holding; }
        } else if (phase === 'holding') {
          phase = 'erasing'; remaining = speeds.erasing;
        } else if (phase === 'erasing') {
          count = Math.max(count - 1, 0);
          target.textContent = messages[message].slice(0, count);
          remaining = speeds.erasing;
          if (count === 0) { phase = 'next'; remaining = speeds.next; }
        } else {
          message = (message + 1) % messages.length;
          phase = 'typing';
          remaining = speeds.typing;
        }
      }
    }
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);
})();
