// Estilos de la app. Cada uno define colores, tipografía de títulos, ícono propio
// (usado en el logo, el botón de "visto" y la pestaña Para vos), fondo y frases.
// Íconos en una grilla de 24×24: {d, fill} → relleno; si no, trazo.

export const THEMES = {
  cine: {
    name: 'Cine clásico', font: '"Big Shoulders Display", Impact, sans-serif', dark: true,
    c: { bg: '#141017', panel: '#1e1823', line: '#2f2635', ink: '#f3ecf5', mute: '#a597ab', acc: '#ff4d3d', acc2: '#ff8a7d', on: '#ffffff' },
    mark: { d: 'M5 12.5l4.5 4.5L19 7.5' },
    want: { d: 'M7 3h10v18l-5-4-5 4z' },
    pattern: 'none',
    loading: 'Preparando los pochoclos…', empty: 'La sala está vacía.',
  },
  fantasia: {
    name: 'Fantasía', font: '"Cinzel", Georgia, serif', dark: true,
    c: { bg: '#120d24', panel: '#1d1638', line: '#352a5e', ink: '#f1ebff', mute: '#a99ecb', acc: '#b388ff', acc2: '#ffd166', on: '#120d24' },
    mark: { d: 'M12 2.5l2.4 7.1L21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4z', fill: 1 },
    want: { d: 'M6 4h11a2 2 0 0 1 0 4H8v12H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 8h9v12H8' },
    pattern: 'radial-gradient(1.5px 1.5px at 12% 18%,#fff9 50%,transparent 51%),radial-gradient(1px 1px at 68% 42%,#ffd166aa 50%,transparent 51%),radial-gradient(1.2px 1.2px at 35% 78%,#b388ffcc 50%,transparent 51%),radial-gradient(1px 1px at 88% 88%,#fff8 50%,transparent 51%)',
    patternSize: '220px 220px',
    loading: 'Invocando el hechizo…', empty: 'Este reino todavía está deshabitado.',
  },
  accion: {
    name: 'Acción', font: '"Anton", Impact, sans-serif', dark: true,
    c: { bg: '#0f0f10', panel: '#1a1a1c', line: '#2e2e33', ink: '#f5f5f5', mute: '#9a9aa2', acc: '#ff5a1f', acc2: '#ffb21f', on: '#0f0f10' },
    mark: { d: 'M12 1.5l2.2 5.6 5.3-2.6-2 5.6 5.5 1.9-5.5 1.9 2 5.6-5.3-2.6L12 22.5l-2.2-5.6-5.3 2.6 2-5.6L1 12l5.5-1.9-2-5.6 5.3 2.6z', fill: 1 },
    want: { d: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM12 1v5M12 18v5M1 12h5M18 12h5' },
    pattern: 'repeating-linear-gradient(-45deg,transparent 0 26px,#ffffff07 26px 28px)', patternSize: 'auto',
    loading: 'Cargando munición…', empty: 'Ni una explosión por acá.',
  },
  drama: {
    name: 'Drama', font: '"Playfair Display", Georgia, serif', dark: true,
    c: { bg: '#1f0e13', panel: '#2b161c', line: '#4a2630', ink: '#f7ebe4', mute: '#c4a59d', acc: '#f0a891', acc2: '#ff8a9b', on: '#1f0e13' },
    mark: { d: 'M4 5c3.5 1.6 12.5 1.6 16 0 0 8.5-3 14-8 14S4 13.5 4 5zM7.5 9.5h3.2v1.8H7.5zM13.3 9.5h3.2v1.8h-3.2zM9.5 14.6h5v1.5h-5z', fill: 1 },
    want: { d: 'M12 3c3 4 5 6.5 5 10a5 5 0 0 1-10 0c0-3.5 2-6 5-10z' },
    pattern: 'radial-gradient(ellipse at 50% 0%,#ff8a9b18,transparent 55%),radial-gradient(ellipse at 50% 120%,#000a,transparent 60%)', patternSize: 'auto',
    loading: 'Se levanta el telón…', empty: 'El escenario espera su primera escena.',
  },
  terror: {
    name: 'Terror', font: '"Creepster", "Big Shoulders Display", sans-serif', dark: true,
    c: { bg: '#0a0809', panel: '#151012', line: '#2c1d21', ink: '#ece4e4', mute: '#938284', acc: '#d0101e', acc2: '#ff5c68', on: '#ffffff' },
    mark: { d: 'M12 2.5a8.5 8.5 0 0 0-8.5 8.5c0 3.2 1.6 4.9 3.2 5.9v3.6h10.6v-3.6c1.6-1 3.2-2.7 3.2-5.9A8.5 8.5 0 0 0 12 2.5zM7.6 9.6h3.2v3.4H7.6zM13.2 9.6h3.2v3.4h-3.2zM11 15h2v2h-2z', fill: 1 },
    want: { d: 'M15 3a9 9 0 1 0 6 15.5A7.5 7.5 0 0 1 15 3z' },
    pattern: 'radial-gradient(ellipse at 20% -10%,#d0101e22,transparent 50%),radial-gradient(ellipse at 90% 110%,#ffffff0a,transparent 50%)', patternSize: 'auto',
    loading: 'Algo se acerca en la oscuridad…', empty: 'Silencio… demasiado silencio.',
  },
  scifi: {
    name: 'Ciencia ficción', font: '"Orbitron", "Big Shoulders Display", sans-serif', dark: true,
    c: { bg: '#070b1a', panel: '#0e1530', line: '#1f2c58', ink: '#e6f1ff', mute: '#8ca3cc', acc: '#00e5ff', acc2: '#9d7bff', on: '#070b1a' },
    mark: { d: 'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0M2.5 16c2.5 2.3 16.5-3.2 19-8.5' },
    want: { d: 'M12 2c3 2.5 4.5 6 4.5 10L18 15.5V18h-3.5l-1 2h-3l-1-2H6v-2.5L7.5 12C7.5 8 9 4.5 12 2zM12 8.5a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 1 0 0-3.2z' },
    pattern: 'linear-gradient(#00e5ff0d 1px,transparent 1px),linear-gradient(90deg,#00e5ff0d 1px,transparent 1px)', patternSize: '34px 34px',
    loading: 'Calculando ruta hiperespacial…', empty: 'Sin señales de vida en este sector.',
  },
  comedia: {
    name: 'Comedia', font: '"Fredoka", "Figtree", sans-serif', dark: false,
    c: { bg: '#fff7d6', panel: '#ffffff', line: '#f0dc98', ink: '#2a1d00', mute: '#7d6a3a', acc: '#ff3d7f', acc2: '#e07000', on: '#ffffff' },
    mark: { d: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0M8 14c2 2.6 6 2.6 8 0M9 9.5h.01M15 9.5h.01' },
    want: { d: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z' },
    pattern: 'radial-gradient(#ff3d7f1f 2px,transparent 2.6px)', patternSize: '22px 22px',
    loading: 'Contando un chiste…', empty: 'Acá no hay nada… ¿se entendió el chiste?',
  },
  romance: {
    name: 'Romance', font: '"Playfair Display", Georgia, serif', dark: false,
    c: { bg: '#fff0f3', panel: '#ffffff', line: '#ffd0dc', ink: '#3d0f1d', mute: '#9b5d6d', acc: '#e63962', acc2: '#b5179e', on: '#ffffff' },
    mark: { d: 'M12 20.5s-7.4-4.6-9.3-9.4C1.4 7.8 3.7 4.5 7 4.5c2.1 0 3.4 1.2 5 3.1 1.6-1.9 2.9-3.1 5-3.1 3.3 0 5.6 3.3 4.3 6.6-1.9 4.8-9.3 9.4-9.3 9.4z', fill: 1 },
    want: { d: 'M4 6h16v12H4zM4 6l8 7 8-7' },
    pattern: 'radial-gradient(circle at 8% 0%,#ff8fab40,transparent 38%),radial-gradient(circle at 100% 100%,#b5179e18,transparent 40%)', patternSize: 'auto',
    loading: 'Buscando a tu media naranja…', empty: 'Todavía no flechó ninguna.',
  },
  animacion: {
    name: 'Animación', font: '"Baloo 2", "Fredoka", sans-serif', dark: false,
    c: { bg: '#eefbff', panel: '#ffffff', line: '#c6e9f5', ink: '#102a43', mute: '#52708a', acc: '#7b2ff7', acc2: '#04a77d', on: '#ffffff' },
    mark: { d: 'M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z', fill: 1 },
    want: { d: 'M4 4h16v16H4zM4 9h16M9 4v16' },
    pattern: 'radial-gradient(circle at 92% 6%,#ffd16666,transparent 26%),radial-gradient(circle at 0% 100%,#06d6a040,transparent 32%)', patternSize: 'auto',
    loading: 'Dibujando cuadro por cuadro…', empty: 'Una hoja en blanco, lista para dibujar.',
  },
};

export function icon(ic, size = 24, cls = '') {
  const fill = ic.fill ? `fill="currentColor" fill-rule="evenodd"` : `fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ic.d}" ${fill}/></svg>`;
}
