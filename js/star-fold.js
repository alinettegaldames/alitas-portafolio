function setupStarFold() {
  const experience = document.querySelector('[data-star-fold]');
  if (!experience) return;

  const scene = experience.querySelector('.star-fold__scene');
  const object = experience.querySelector('.star-fold__object');
  const star = experience.querySelector('.star-fold__star');
  const toggle = experience.querySelector('[data-fold-toggle]');
  const content = experience.querySelector('#star-fold-content');
  const sections = [...experience.querySelectorAll('[data-fold-section]')];
  const details = [...experience.querySelectorAll('[data-fold-detail]')];
  const panels = [...experience.querySelectorAll('.star-fold__panel')];
  const rotateButtons = [...experience.querySelectorAll('[data-fold-rotate]')];
  let open = false;
  let yaw = -12;
  let tilt = 12;
  let drag = null;
  let moved = false;

  const setOpen = (next) => {
    open = next;
    experience.classList.toggle('is-open', open);
    experience.classList.remove('is-preview');
    if (!open && star.contains(document.activeElement)) toggle.focus();
    star.setAttribute('aria-hidden', String(!open));
    panels.forEach((panel) => { panel.tabIndex = open ? 0 : -1; });
    toggle.setAttribute('aria-expanded', String(open));
    toggle.innerHTML = open ? 'Cerrar pieza <span aria-hidden=\"true\">↙</span>' : 'Abrir pieza <span aria-hidden=\"true\">↗</span>';
    content.hidden = !open;
  };
  const setRotation = () => {
    object.style.setProperty('--fold-yaw', `${yaw}deg`);
    object.style.setProperty('--fold-tilt', `${tilt}deg`);
  };
  const selectSection = (selected) => {
    sections.forEach((section, index) => {
      const active = section === selected;
      section.setAttribute('aria-pressed', String(active));
      panels[index].classList.toggle('is-selected', active);
    });
    details.forEach((detail) => { detail.hidden = detail.dataset.foldDetail !== selected.dataset.foldSection; });
  };
  selectSection(sections[0]);

  toggle.addEventListener('click', () => setOpen(!open));
  sections.forEach((section) => section.addEventListener('click', () => selectSection(section)));
  panels.forEach((panel, index) => panel.addEventListener('click', (event) => {
    if (open && (!moved || event.detail === 0)) selectSection(sections[index]);
  }));
  rotateButtons.forEach((button) => button.addEventListener('click', () => {
    yaw += Number(button.dataset.foldRotate);
    setRotation();
  }));
  scene.addEventListener('pointerenter', (event) => {
    if (!open && event.pointerType === 'mouse') experience.classList.add('is-preview');
  });
  scene.addEventListener('pointerleave', () => experience.classList.remove('is-preview'));
  scene.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag = { x: event.clientX, y: event.clientY, yaw, tilt };
    moved = false;
  });
  scene.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!moved && Math.hypot(dx, dy) < 8) return;
    if (!moved) {
      moved = true;
      scene.setPointerCapture(event.pointerId);
      scene.classList.add('is-dragging');
    }
    yaw = drag.yaw + dx * .6;
    tilt = Math.max(-65, Math.min(65, drag.tilt - dy * .4));
    setRotation();
  });
  scene.addEventListener('pointerup', () => {
    if (!drag) return;
    if (!moved && !open) setOpen(true);
    drag = null;
    scene.classList.remove('is-dragging');
  });
  scene.addEventListener('pointercancel', () => {
    drag = null;
    scene.classList.remove('is-dragging');
  });
}

setupStarFold();
