/* ==========================================================================
   Profresh · Conversions API de Meta (lado servidor)
   --------------------------------------------------------------------------
   Cloudflare Pages convierte este archivo en el endpoint POST /api/capi
   automáticamente (carpeta functions/ = Cloudflare Pages Functions).

   Recibe los eventos que manda lib/meta-pixel.js desde el navegador y los
   reenvía a Meta desde el servidor, con el mismo event_id que usó el Pixel,
   para que Meta los deduplique como un solo evento.

   El Pixel ID va fijo aquí (no es secreto). El token de acceso a la
   Conversions API SÍ es secreto: se lee de la variable de entorno
   META_CAPI_TOKEN, configurada en Cloudflare Pages → Settings →
   Environment variables (ver docs/analitica.md). Mientras esa variable no
   exista, esta función no manda nada a Meta y no rompe el sitio.
   ========================================================================== */

const PIXEL_ID = "1535795264880042";
const EVENTOS_PERMITIDOS = ["PageView", "Contact", "Lead"];

export async function onRequestPost(context) {
  const { request, env } = context;

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

  try {
    await fetch(
      "https://graph.facebook.com/v21.0/" + PIXEL_ID + "/events?access_token=" + encodeURIComponent(env.META_CAPI_TOKEN),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [evento] })
      }
    );
  } catch (e) {
    // Si Meta falla, no hay nada que el sitio pueda hacer al respecto;
    // no debe afectar al usuario que hizo clic.
  }

  return new Response(null, { status: 204 });
}
