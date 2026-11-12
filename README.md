# ALITAS · Portafolio de Alinette Galdames

*Ideas que dan alas* — Diseñadora gráfica · UX/UI · Branding · Packaging.

Sitio estático hecho con HTML, CSS y JavaScript. La experiencia editorial 3D utiliza Three.js.

## Páginas
- `index.html` — portada (hero, proyectos, sobre mí, contacto)
- `cinefilo.html` — caso Cinéfilo (UX/UI · plataforma web)
- `lafken.html` — caso Lafken (packaging)
- `chancho-en-piedra.html` — caso Chancho en Piedra (identidad visual · álbum/vinilo)
- `alitas-editorial.html` — portafolio editorial interactivo en 3D y vista en plano

## Archivos compartidos
- `css/styles.css` — estilos de todo el sitio. Secciones 01–14: portada. Sección 15: páginas de proyecto.
- `js/main.js` — animaciones, filtros de proyectos, menú móvil, cambio de color entre secciones y transición entre páginas.
- `css/editorial-3d.css` y `js/editorial-3d.js` — experiencia editorial 3D y sus controles; incluye una vista en plano accesible en `alitas-editorial.html`.
- `assets/editorial/pages/` — las 15 páginas completas renderizadas a partir de `Portafolio editorial.pdf`, en su orden original. El PDF también está enlazado desde la vista en plano.
- `js/vendor/` — Three.js y OrbitControls 0.160.1, distribuidos localmente con su licencia.
- `img/` — imágenes, logo e isotipo (ver `img/LEEME.txt`).

## Ver en local
Sirve la carpeta mediante HTTP para que funcionen los módulos de la experiencia 3D, por ejemplo con la extensión Live Server de VS Code o ejecutando `python3 -m http.server 8000` y visitando `http://localhost:8000/`. Abrir los archivos directamente con `file://` puede impedir que carguen los módulos; la vista en plano sigue disponible.
