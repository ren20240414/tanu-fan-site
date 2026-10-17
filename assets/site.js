(() => {
  const toggle = document.querySelector('.menu-summary');
  const drawer = document.querySelector('#site-drawer');
  const backdrop = document.querySelector('.menu-backdrop');
  if (!toggle || !drawer || !backdrop) return;

  let closeTimer;
  const openMenu = () => {
    clearTimeout(closeTimer);
    backdrop.hidden = false;
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'メニューを閉じる');
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-visible');
    });
    drawer.querySelector('.drawer-close').focus();
  };
  const closeMenu = (restoreFocus = true) => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
    closeTimer = setTimeout(() => { backdrop.hidden = true; }, 240);
    if (restoreFocus) toggle.focus();
  };

  toggle.addEventListener('click', () => {
    toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
  });
  drawer.querySelectorAll('[data-menu-close]').forEach(button => button.addEventListener('click', () => closeMenu()));
  backdrop.addEventListener('click', () => closeMenu());
  drawer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu();
  });
})();
