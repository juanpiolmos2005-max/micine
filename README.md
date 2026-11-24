# MiCine 🎬

App para llevar registro de las películas y series que viste: creá tu personaje, tildá lo que viste, seguí a tus actores favoritos, mirá sagas en orden (Marvel, Star Wars, Harry Potter…) y recibí recomendaciones. Con 9 estilos visuales y pensada para el celular.

**Abrir la app:** https://juanpiolmos2005-max.github.io/micine/

## Cómo funciona

| Parte | Qué hace |
|---|---|
| `index.html`, `css/`, `js/` | La app (GitHub Pages) |
| `supabase/migrations/` | Tablas: perfiles, biblioteca (vistas / quiero ver) y actores seguidos, cada una protegida para que solo el dueño vea sus datos |
| `supabase/functions/tmdb/` | Servidor intermedio: guarda la clave de TMDB en secreto y reenvía solo consultas de lectura |
| `.github/workflows/backend.yml` | Instala todo en Supabase y genera `js/config.js` automáticamente |

Sin Supabase configurado, la app funciona en **modo personal**: cada persona pega su propia clave de TMDB y la lista queda en su navegador.

## Activar las cuentas (una sola vez)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com) y anotá la **contraseña de la base de datos**.
2. En el proyecto, copiá el **Project ref** (Project Settings → General, o la parte `xxxx` de `https://xxxx.supabase.co`).
3. Creá un **Access token** en [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
4. En este repo: **Settings → Secrets and variables → Actions → New repository secret** y cargá:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF`
   - `SUPABASE_DB_PASSWORD`
   - `TMDB_API_KEY` (tu API Key de TMDB)
5. **Actions → Desplegar backend (Supabase) → Run workflow.** En un par de minutos la app pasa a modo cuentas.

La automatización deja el registro **sin mail de confirmación** (el correo gratuito de Supabase permite muy pocos envíos por hora). Si preferís pedir confirmación por mail, activala en Supabase → Authentication → Sign In / Providers → Email, idealmente con un servidor de correo propio.

## Uso no comercial

TMDB es gratis para uso no comercial con atribución. Si la app llegara a cobrar o tener publicidad, hace falta un acuerdo comercial con TMDB.

---
Datos e imágenes de [TMDB](https://www.themoviedb.org). Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
