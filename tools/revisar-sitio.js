#!/usr/bin/env node
//
// Centinela del sitio de Profresh.
//
// Revisa el sitio publicado y lo compara con los archivos de este repositorio.
// NO toca nada: solo mira y cuenta lo que encuentra.
//
//   node tools/revisar-sitio.js
//
// Sale con codigo 1 si encontro algun PROBLEMA (algo roto de verdad),
// y con 0 si solo hay avisos o si esta todo bien.
//
// Pensado para correr todos los dias sin que nadie lo mire: cuando esta todo
// bien el reporte es corto y aburrido, que es exactamente lo que tiene que ser.

const fs = require('fs');
const path = require('path');

const SITIO = 'https://profresh.cl';
const ID_GA4 = 'G-2G9BPXX4JN';
const ID_PIXEL = '1535795264880042';
const CARPETA = path.resolve(__dirname, '..');

// Paginas que a proposito no van en el sitemap. Si alguna deja de ser una
// excepcion, se saca de aca y el centinela vuelve a reclamar por ella.
const NO_VAN_EN_EL_SITEMAP = [
  'propuesta-foco-airbnb-oficinas.html', // borrador interno, no es del sitio
  // La politica de privacidad declara <meta name="robots" content="noindex">
  // a proposito: no tiene nada que buscar en Google y no deberia competir con
  // las paginas de servicio. Se llega a ella por el link del pie, no por el
  // sitemap. Pedirle a Google que la indexe y a la vez decirle que no la
  // indexe es una contradiccion que Search Console reporta como error.
  'privacidad.html',
];

const problemas = [];
const avisos = [];
let revisiones = 0;

function problema(texto) { problemas.push(texto); }
function aviso(texto) { avisos.push(texto); }
function revisado() { revisiones++; }

// ---------------------------------------------------------------- pedir paginas

async function pedir(url, opciones = {}) {
  const corte = AbortSignal.timeout(20000);
  try {
    const r = await fetch(url, { redirect: 'manual', signal: corte, ...opciones });
    let cuerpo = '';
    try { cuerpo = await r.text(); } catch { cuerpo = ''; }
    return { ok: true, estado: r.status, destino: r.headers.get('location'), cuerpo };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

async function seguirHasta(url) {
  let actual = url;
  for (let salto = 0; salto < 6; salto++) {
    const r = await pedir(actual);
    if (!r.ok) return { error: r.error, url: actual };
    if (r.estado >= 300 && r.estado < 400 && r.destino) {
      actual = new URL(r.destino, actual).toString();
      continue;
    }
    return { estado: r.estado, url: actual, cuerpo: r.cuerpo };
  }
  return { error: 'demasiadas redirecciones', url: actual };
}

// ------------------------------------------------------------------ el dominio

async function revisarDominio() {
  const combinaciones = [
    'http://profresh.cl/',
    'https://profresh.cl/',
    'http://www.profresh.cl/',
    'https://www.profresh.cl/',
  ];
  for (const partida of combinaciones) {
    const fin = await seguirHasta(partida);
    revisado();
    if (fin.error) { problema(`${partida} no responde: ${fin.error}`); continue; }
    if (fin.estado !== 200) { problema(`${partida} termina en estado ${fin.estado}`); continue; }
    if (!fin.url.startsWith('https://profresh.cl/')) {
      problema(`${partida} termina en ${fin.url} y deberia terminar en https://profresh.cl/`);
    }
  }
}

// ---------------------------------------------------------- sitemap y robots

async function revisarSitemapYRobots() {
  const robots = await pedir(`${SITIO}/robots.txt`);
  revisado();
  if (!robots.ok || robots.estado !== 200) {
    problema(`robots.txt no responde (${robots.error || robots.estado})`);
  } else if (!robots.cuerpo.includes('sitemap.xml')) {
    problema('robots.txt no menciona el sitemap');
  }

  const mapa = await pedir(`${SITIO}/sitemap.xml`);
  revisado();
  if (!mapa.ok || mapa.estado !== 200) {
    problema(`sitemap.xml no responde (${mapa.error || mapa.estado})`);
    return [];
  }
  const urls = [...mapa.cuerpo.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
  if (urls.length === 0) problema('el sitemap publicado no lista ninguna pagina');
  return urls;
}

// ------------------------------------------------ cada pagina, en el sitio vivo

function texto(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim().replace(/\s+/g, ' ') : null;
}

function huellaDeLaPagina(html) {
  return {
    titulo: texto(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    descripcion: texto(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    versiones: [...html.matchAll(/([\w.-]+\.(?:css|js))\?v=([\w]+)/g)]
      .map(m => `${m[1]}?v=${m[2]}`).sort().join(' '),
  };
}

const PALABRAS_DE_CLAVE = /(clave|acceso|c[oó]digo|contrase[nñ]a|password)/i;

function buscarPosiblesClaves(html, donde) {
  // No compara contra la planilla (aca no la tenemos): busca numeros de 4 a 8
  // digitos parados al lado de una palabra como "clave" o "acceso". Es la forma
  // exacta en que se filtro una clave en el HTML de la app en septiembre.
  const limpio = html.replace(/\s+/g, ' ');
  for (const m of limpio.matchAll(/\b\d{4,8}\b/g)) {
    const desde = Math.max(0, m.index - 70);
    const contexto = limpio.slice(desde, m.index + m[0].length + 70);
    if (!PALABRAS_DE_CLAVE.test(contexto)) continue;
    if (/^(19|20)\d{2}$/.test(m[0])) continue; // un anio suelto no es una clave
    const tapado = contexto.replace(m[0], '*'.repeat(m[0].length));
    aviso(`posible clave en ${donde}: "...${tapado}..." (revisar a mano)`);
  }
}

async function revisarPaginaEnVivo(url) {
  // Primero sin seguir la redireccion. Una URL del sitemap que contesta 3xx le
  // esta dando a Google una direccion que no es la definitiva: Google la sigue,
  // pero se diluye la senal y la canonical puede terminar apuntando a otra cosa.
  // Este centinela seguia las redirecciones en silencio y no lo veia: las seis
  // paginas contestaban 307 desde que el sitio pasó a ser un Worker.
  const directo = await pedir(url);
  revisado();
  if (directo.ok && directo.estado >= 300 && directo.estado < 400) {
    const destino = directo.destino ? new URL(directo.destino, url).toString() : '(sin destino)';
    problema(`${url} contesta ${directo.estado} y redirige a ${destino}: el sitemap deberia listar la direccion final`);
  }

  const r = await pedir(url, { redirect: 'follow' });
  revisado();
  if (!r.ok) { problema(`${url} no responde: ${r.error}`); return null; }
  if (r.estado !== 200) { problema(`${url} responde ${r.estado}`); return null; }

  const html = r.cuerpo;
  const nombre = url.replace(SITIO, '') || '/';

  // Los IDs no van en el HTML: viven dentro de lib/analytics.js y lib/meta-pixel.js
  // (eso se revisa aparte, en revisarLosMedidores). Aca solo se comprueba que la
  // pagina los llame: si falta la linea del script, esa pagina no mide nada.
  if (!/src=["'][^"']*lib\/analytics\.js/.test(html)) problema(`${nombre} no llama a analytics.js: sus visitas no se miden`);
  if (!/src=["'][^"']*lib\/meta-pixel\.js/.test(html)) problema(`${nombre} no llama a meta-pixel.js`);

  const titulo = texto(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!titulo) problema(`${nombre} no tiene titulo`);
  else if (titulo.length > 62) aviso(`${nombre}: el titulo tiene ${titulo.length} caracteres, Google corta cerca de 60`);

  const descripcion = texto(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (!descripcion) problema(`${nombre} no tiene meta description`);
  else if (descripcion.length > 160) aviso(`${nombre}: la meta description tiene ${descripcion.length} caracteres, Google corta cerca de 155`);

  // Una pagina que esta en el sitemap y a la vez declara noindex es una
  // contradiccion: se le pide a Google que la indexe y se le prohibe hacerlo.
  // Search Console lo reporta como error ("Enviada mediante sitemap pero
  // marcada como noindex"). Paso de verdad al agregar privacidad.html.
  const robots = texto(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  if (robots && /noindex/i.test(robots)) {
    problema(`${nombre} esta en el sitemap pero declara "noindex": o sale del sitemap, o se le quita el noindex`);
  }

  const canonica = texto(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  if (!canonica) aviso(`${nombre} no declara canonical`);
  else if (!canonica.startsWith('https://profresh.cl')) problema(`${nombre}: la canonical apunta a ${canonica}`);

  const bloques = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (bloques.length === 0) aviso(`${nombre} no trae datos estructurados (JSON-LD)`);
  for (const b of bloques) {
    try { JSON.parse(b[1]); }
    catch (e) { problema(`${nombre}: un bloque JSON-LD esta roto y Google lo va a ignorar (${e.message})`); }
  }

  const h1 = [...html.matchAll(/<h1[\s>]/gi)].length;
  if (h1 === 0) aviso(`${nombre} no tiene ningun H1`);
  if (h1 > 1) aviso(`${nombre} tiene ${h1} H1 distintos`);

  buscarPosiblesClaves(html, nombre);

  return huellaDeLaPagina(html);
}

// -------------------------------------------------------------- los medidores

// GA4 y el Pixel se apagan de la forma mas silenciosa que hay: el ID vuelve a
// quedar vacio en el archivo. El sitio sigue viendose perfecto y deja de medir.
async function revisarLosMedidores() {
  const medidores = [
    { archivo: 'lib/analytics.js', id: ID_GA4, nombre: 'Google Analytics' },
    { archivo: 'lib/meta-pixel.js', id: ID_PIXEL, nombre: 'el Meta Pixel' },
  ];
  for (const m of medidores) {
    const r = await pedir(`${SITIO}/${m.archivo}`, { redirect: 'follow' });
    revisado();
    if (!r.ok || r.estado !== 200) {
      problema(`${m.archivo} no responde en el sitio publicado (${r.error || r.estado})`);
      continue;
    }
    if (!r.cuerpo.includes(m.id)) {
      problema(`${m.archivo} publicado no trae el ID de ${m.nombre} (${m.id}): el sitio no esta midiendo`);
    }
  }
}

// ------------------------------------------------- los archivos de este repo

function paginasDelRepo() {
  return fs.readdirSync(CARPETA).filter(f => f.endsWith('.html'));
}

// Las URLs del sitio van sin ".html" (es lo que sirve Cloudflare), pero los
// archivos del repo si la tienen. Esta funcion traduce de una a otro; sin ella
// las comprobaciones contra el repo dejarian de encontrar nada, en silencio.
function archivoDe(url) {
  let nombre = url.replace(SITIO, '').replace(/^\//, '').replace(/[?#].*$/, '');
  if (nombre === '') return 'index.html';
  if (nombre.endsWith('.html')) return nombre;
  return nombre + '.html';
}

function revisarRepoContraSitemap(urlsDelSitemap) {
  const enElSitemap = new Set(urlsDelSitemap.map(archivoDe));

  for (const pagina of paginasDelRepo()) {
    revisado();
    if (NO_VAN_EN_EL_SITEMAP.includes(pagina)) continue;
    if (!enElSitemap.has(pagina)) {
      aviso(`${pagina} existe pero no esta en el sitemap: Google no la va a encontrar sola`);
    }
  }
  for (const archivo of enElSitemap) {
    revisado();
    if (!fs.existsSync(path.join(CARPETA, archivo))) {
      problema(`el sitemap lista ${archivo} y ese archivo no existe en el repo`);
    }
  }
}

function revisarMedicionYVersionesEnElRepo() {
  const versiones = new Map();
  for (const pagina of paginasDelRepo()) {
    if (NO_VAN_EN_EL_SITEMAP.includes(pagina)) continue;
    const html = fs.readFileSync(path.join(CARPETA, pagina), 'utf8');
    revisado();
    if (!html.includes('lib/analytics.js')) aviso(`${pagina} no carga analytics.js: sus visitas no se miden`);
    if (!html.includes('lib/meta-pixel.js')) aviso(`${pagina} no carga meta-pixel.js`);
    for (const m of html.matchAll(/([\w.-]+\.(?:css|js))\?v=([\w]+)/g)) {
      if (!versiones.has(m[1])) versiones.set(m[1], new Map());
      const porVersion = versiones.get(m[1]);
      porVersion.set(m[2], [...(porVersion.get(m[2]) || []), pagina]);
    }
  }
  for (const [archivo, porVersion] of versiones) {
    if (porVersion.size > 1) {
      const detalle = [...porVersion].map(([v, ps]) => `${v} en ${ps.length}`).join(', ');
      problema(`${archivo} tiene versiones distintas segun la pagina (${detalle}): unas van a cargar la version vieja`);
    }
  }
}

function revisarHuerfanas() {
  const paginas = paginasDelRepo().filter(p => !NO_VAN_EN_EL_SITEMAP.includes(p));
  const enlazadas = new Set(['index.html']);
  for (const pagina of paginas) {
    const html = fs.readFileSync(path.join(CARPETA, pagina), 'utf8');
    // Los enlaces del sitio van sin ".html" (href="/limpieza-airbnb"), pero
    // tambien se aceptan los de la forma vieja por si queda alguno suelto.
    for (const m of html.matchAll(/href=["']\.?\/?([\w-]+)(\.html)?(?:[?#][^"']*)?["']/g)) {
      const archivo = m[1] + '.html';
      if (archivo !== pagina) enlazadas.add(archivo);
    }
  }
  for (const pagina of paginas) {
    revisado();
    if (!enlazadas.has(pagina)) {
      aviso(`${pagina} no esta enlazada desde ninguna otra pagina: nadie llega a ella navegando`);
    }
  }
}

// ------------------------------------------ lo publicado contra lo del repo

function revisarDeriva(nombreArchivo, huellaViva) {
  if (!huellaViva) return;
  const ruta = path.join(CARPETA, nombreArchivo);
  if (!fs.existsSync(ruta)) return;
  const huellaRepo = huellaDeLaPagina(fs.readFileSync(ruta, 'utf8'));
  revisado();
  const diferencias = [];
  if (huellaRepo.titulo !== huellaViva.titulo) diferencias.push('el titulo');
  if (huellaRepo.descripcion !== huellaViva.descripcion) diferencias.push('la meta description');
  if (huellaRepo.versiones !== huellaViva.versiones) diferencias.push('las versiones de css/js');
  if (diferencias.length) {
    problema(`${nombreArchivo}: lo publicado no coincide con el repo (${diferencias.join(' y ')}). Falta publicar, o el deploy fallo`);
  }
}

// ------------------------------------------------------------------- reporte

async function main() {
  const hoy = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
  console.log(`Centinela del sitio de Profresh - ${hoy}\n`);

  await revisarDominio();
  await revisarLosMedidores();
  const urls = await revisarSitemapYRobots();

  for (const url of urls) {
    const huella = await revisarPaginaEnVivo(url);
    revisarDeriva(archivoDe(url), huella);
  }

  revisarRepoContraSitemap(urls);
  revisarMedicionYVersionesEnElRepo();
  revisarHuerfanas();

  if (problemas.length) {
    console.log(`PROBLEMAS (${problemas.length})`);
    for (const p of problemas) console.log(`  - ${p}`);
    console.log('');
  }
  if (avisos.length) {
    console.log(`AVISOS (${avisos.length})`);
    for (const a of avisos) console.log(`  - ${a}`);
    console.log('');
  }
  if (!problemas.length && !avisos.length) {
    console.log('Todo bien.');
  }
  console.log(`${revisiones} comprobaciones sobre ${urls.length} paginas publicadas.`);

  process.exit(problemas.length ? 1 : 0);
}

main().catch(e => {
  console.error(`El centinela no pudo terminar: ${e.stack || e}`);
  console.error('Ojo: esto NO quiere decir que el sitio este bien. Quiere decir que no se pudo revisar.');
  process.exit(2);
});
