/* ==========================================================================
   Profresh · Worker principal del sitio
   --------------------------------------------------------------------------
   Este sitio se publica como un Worker de Cloudflare con archivos estáticos
   (ver wrangler.toml), no como "Cloudflare Pages" clásico. Por eso el código
   de servidor no puede vivir en una carpeta functions/ (esa convención es
   solo de Pages) — tiene que ser este archivo, declarado como "main" en
   wrangler.toml.

   Cualquier URL que coincide con un archivo real (index.html, styles.css,
   lib/meta-pixel.js, etc.) la sirve Cloudflare directamente desde los
   archivos estáticos, sin pasar por aquí. Este Worker solo se ejecuta para
   URLs que NO son un archivo — hoy, solo /api/capi (Conversions API de
   Meta). Para cualquier otra URL sin archivo, se delega en los archivos
   estáticos igual (para que el 404 se vea igual que siempre).
   ========================================================================== */

const PIXEL_ID = "1535795264880042";
const EVENTOS_PERMITIDOS = ["PageView", "Contact", "Lead"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/capi" && request.method === "POST") {
      return manejarCAPI(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function manejarCAPI(request, env) {
  if (!env.META_CAPI_TOKEN) {
    return new Response(null, { status: 204 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(null, { status: 400 });
  }

  if (!body || EVENTOS_PERMITIDOS.indexOf(body.event_name) === -1 || !body.event_id) {
    return new Response(null, { status: 400 });
  }

  const evento = {
    event_name: body.event_name,
    event_id: body.event_id,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: typeof body.event_source_url === "string" ? body.event_source_url : undefined,
    action_source: "website",
    user_data: {
      client_ip_address: request.headers.get("CF-Connecting-IP") || undefined,
      client_user_agent: request.headers.get("User-Agent") || undefined,
      fbp: typeof body.fbp === "string" ? body.fbp : undefined,
      fbc: typeof body.fbc === "string" ? body.fbc : undefined
    }
  };

  // test_event_code es opcional: solo lo manda quien está probando desde
  // Meta Events Manager (pestaña "Probar eventos"), nunca el tráfico real.
  // Cuando viene, se espera la respuesta real de Meta para poder diagnosticar
  // el error en vez de responder siempre 204 a ciegas.
  const payload = { data: [evento] };
  if (typeof body.test_event_code === "string") {
    payload.test_event_code = body.test_event_code;
  }

  try {
    const resp = await fetch(
      "https://graph.facebook.com/v21.0/" + PIXEL_ID + "/events?access_token=" + encodeURIComponent(env.META_CAPI_TOKEN),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (payload.test_event_code) {
      const texto = await resp.text();
      return new Response(texto, {
        status: resp.status,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    if (payload.test_event_code) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }
    // Si Meta falla en trafico real, no hay nada que el sitio pueda hacer
    // al respecto; no debe afectar al usuario que hizo clic.
  }

  return new Response(null, { status: 204 });
}
