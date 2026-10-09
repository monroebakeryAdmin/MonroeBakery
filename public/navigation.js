// Shared back-to-top control for every page.
(() => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.hidden = true;
  button.setAttribute('aria-label', 'Back to top');
  button.title = 'Back to top';
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 10 6-6 6 6M12 4v16"/></svg>';
  document.body.append(button);

  const updateVisibility = () => {
    button.hidden = window.scrollY <= 200;
  };

  button.addEventListener('click', () => {
    // Keep keyboard focus at the top when the button becomes hidden.
    document.querySelector('.navbar-brand')?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  });

  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('pageshow', updateVisibility);
  updateVisibility();
})();
