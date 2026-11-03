/* ==========================================================================
   ALITAS · Portafolio — JavaScript
   --------------------------------------------------------------------------
   Sin librerías externas. Cada bloque está separado y comentado:
   1. Ajustes generales
   2. Intro (cortina de entrada)
   3. Animaciones al hacer scroll (reveal)
   4. Cambio de color de fondo según la sección
   5. Navegación: se esconde al bajar, aparece al subir
   6. Menú móvil
   7. Parallax suave de la imagen del hero
   8. Año automático en el footer
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. AJUSTES GENERALES
   ✏️ Puedes cambiar la duración de la intro (en milisegundos).
   -------------------------------------------------------------------------- */
const INTRO_DURATION = 1300;

// ¿La persona pidió "reducir movimiento" en su sistema?
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


/* --------------------------------------------------------------------------
   2. INTRO
   Muestra la frase un momento, sube la cortina y arranca las animaciones.
   -------------------------------------------------------------------------- */
function startIntro() {
  const intro = document.querySelector('.intro');

  // La intro se muestra solo la primera vez que se abre la web (por pestaña).
  // Al volver desde un proyecto, no se repite.
  let introSeen = false;
  try {
    introSeen = sessionStorage.getItem('alitas-intro') === '1';
    sessionStorage.setItem('alitas-intro', '1');
  } catch (e) { /* si el navegador bloquea el almacenamiento, no pasa nada */ }

  // Si no hay intro, ya se vio o se prefiere menos movimiento: empezar de inmediato
  if (!intro || introSeen || reduceMotion) {
    document.body.classList.remove('is-loading');
    if (intro) intro.remove();
    startReveals();
    return;
  }

  setTimeout(() => {
    intro.classList.add('is-done');           // la cortina sube (ver CSS)
    document.body.classList.remove('is-loading');
    startReveals();                           // el contenido entra mientras sube
    setTimeout(() => intro.remove(), 1200);   // se elimina cuando terminó
  }, INTRO_DURATION);
}


/* --------------------------------------------------------------------------
   3. ANIMACIONES AL HACER SCROLL
   Usamos IntersectionObserver: avisa cuando un elemento entra en pantalla
   y le agregamos la clase "is-visible". El CSS hace el resto.
   -------------------------------------------------------------------------- */
function startReveals() {
  // a) Titulares con líneas: numeramos cada línea para escalonarlas
  const headings = document.querySelectorAll('h1, h2');
  headings.forEach((heading) => {
    heading.querySelectorAll('.line > span').forEach((span, i) => {
      span.style.setProperty('--i', i);
    });
  });

  // b) Elementos hermanos con reveal-up: cada uno aparece un poco después
  document.querySelectorAll('.skills .reveal-up').forEach((el, i) => {
    el.style.setProperty('--delay', `${i * 0.12}s`);
  });
  document.querySelectorAll('.hero__meta .reveal-fade').forEach((el, i) => {
    el.style.setProperty('--delay', `${0.4 + i * 0.1}s`);
  });

  // c) Todo lo que queremos animar
  const targets = document.querySelectorAll(
    'h1, h2, .reveal-up, .reveal-fade, .reveal-img'
  );

  // Si el navegador es muy antiguo, mostramos todo sin animar
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // se anima una sola vez
        }
      });
    },
    {
      // ✏️ "threshold": qué porcentaje debe verse para animar (0.15 = 15%)
      threshold: 0.15,
      // Empieza un poco antes de que el elemento llegue al borde inferior
      rootMargin: '0px 0px -8% 0px',
    }
  );

  targets.forEach((el) => observer.observe(el));
}


/* --------------------------------------------------------------------------
   4. CAMBIO DE COLOR SEGÚN LA SECCIÓN
   Lee el atributo data-bg de cada <section> y lo pone como tema en <body>.
   Los colores de cada tema están en el CSS (sección "TEMAS POR SECCIÓN").
   -------------------------------------------------------------------------- */
function setupThemes() {
  const sections = document.querySelectorAll('[data-bg]');
  // El tema inicial es el de la primera sección (así no hay "parpadeo")
  document.body.dataset.theme = sections.length ? sections[0].dataset.bg : 'white';

  const themeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          document.body.dataset.theme = entry.target.dataset.bg;
        }
      });
    },
    // La sección "activa" es la que cruza la mitad de la pantalla
    { rootMargin: '-50% 0px -50% 0px' }
  );

  sections.forEach((section) => themeObserver.observe(section));
}


/* --------------------------------------------------------------------------
   5. NAVEGACIÓN
   - Al bajar, la barra se esconde para dejar ver el contenido.
   - Al subir, vuelve a aparecer.
   - Después de 40px de scroll, toma un fondo con desenfoque.
   -------------------------------------------------------------------------- */
function setupNav() {
  const nav = document.getElementById('nav');
  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;

    nav.classList.toggle('is-scrolled', y > 40);

    // Solo se esconde si bajamos más de 300px y el menú móvil está cerrado
    const goingDown = y > lastY;
    const menuOpen = document.body.classList.contains('menu-open');
    nav.classList.toggle('is-hidden', goingDown && y > 300 && !menuOpen);

    lastY = y;
  }, { passive: true });
}


/* --------------------------------------------------------------------------
   6. MENÚ MÓVIL
   Abre/cierra el menú a pantalla completa. Se cierra al tocar un enlace
   o con la tecla Escape.
   -------------------------------------------------------------------------- */
function setupMobileMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', !open);
  };

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('menu-open'));
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });

  // Si la pantalla se agranda (ej: girar la tablet), cerramos el menú
  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setOpen(false);
  });
}


/* --------------------------------------------------------------------------
   7. PARALLAX SUAVE
   Los elementos con data-parallax="0.08" se mueven un poco más lento que
   el scroll. ✏️ Número más alto = más movimiento (recomendado: 0.05 a 0.15).
   -------------------------------------------------------------------------- */
function setupParallax() {
  if (reduceMotion) return;

  const items = document.querySelectorAll('[data-parallax]');
  if (!items.length) return;

  let ticking = false;

  const update = () => {
    items.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0;
      // translate (en vez de transform) para no chocar con otras animaciones
      el.style.translate = `0 ${window.scrollY * speed * -1}px`;
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    // requestAnimationFrame: actualiza al ritmo de la pantalla (más fluido)
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}


/* --------------------------------------------------------------------------
   8. AÑO AUTOMÁTICO
   -------------------------------------------------------------------------- */
function setYear() {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}


/* --------------------------------------------------------------------------
   9. TRANSICIÓN ENTRE PÁGINAS
   Al hacer clic en un enlace a otra página del sitio (.html), una cortina
   azul cubre la pantalla y luego se abre la nueva página.
   En las páginas de proyecto, la cortina se retira al entrar.
   -------------------------------------------------------------------------- */
function setupPageTransitions() {
  // a) Entrada: quitar la cortina (las páginas de proyecto parten con "is-entering")
  requestAnimationFrame(() => {
    requestAnimationFrame(() => document.body.classList.remove('is-entering'));
  });

  if (reduceMotion) return;

  // b) Salida: interceptar clics en enlaces internos a otras páginas
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    const isPage = /\.html(#.*)?$/.test(href) && !/^https?:/.test(href);
    if (!isPage || link.target === '_blank') return;

    link.addEventListener('click', (e) => {
      // Respetar Ctrl/Cmd+clic (abrir en otra pestaña)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add('is-leaving');
      setTimeout(() => { window.location.href = href; }, 550);
    });
  });

  // c) Si el usuario vuelve con el botón "atrás", quitar la cortina
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.body.classList.remove('is-leaving', 'is-entering');
  });
}


/* --------------------------------------------------------------------------
   INICIO: ejecutamos todo cuando la página cargó
   -------------------------------------------------------------------------- */
setYear();
setupPageTransitions();
setupThemes();
setupNav();
setupMobileMenu();
setupParallax();
startIntro();
