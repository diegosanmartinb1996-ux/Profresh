/* ==========================================================================
   Profresh · Meta Pixel + Conversions API (Facebook / Instagram Ads)
   --------------------------------------------------------------------------
   El ID de abajo es el Pixel "profresh" de Meta Business Manager. No es un
   dato secreto (viaja igual en cualquier sitio con Meta Pixel instalado).

   Lo que SÍ es secreto es el token de la Conversions API (CAPI): ese se
   genera en Meta Events Manager y se guarda como variable de entorno en
   Cloudflare Pages, nunca en este archivo. Mientras no esté configurado,
   el Pixel del navegador funciona igual — el envío server-side
   (/api/capi, ver functions/api/capi.js) simplemente no manda nada.
   Ver docs/analitica.md para los pasos.
   ========================================================================== */

var META_PIXEL_ID = "1535795264880042";

(function () {
  "use strict";

  if (!META_PIXEL_ID) return;

  // No medir cuando se está probando el sitio en el computador (localhost).
  var host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "") return;

  function cookie(nombre) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + nombre + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : undefined;
  }

  // Un mismo event_id se usa en el Pixel del navegador y en el CAPI del
  // servidor para el mismo evento, así Meta los reconcilia como uno solo
  // en vez de contarlo dos veces (deduplicación oficial de Meta).
  function idEvento() {
    return Date.now() + "." + Math.random().toString(36).slice(2);
  }

  function enviarCAPI(evento, eventId) {
    try {
      fetch("/api/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: evento,
          event_id: eventId,
          event_source_url: location.href,
          fbp: cookie("_fbp"),
          fbc: cookie("_fbc")
        }),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function trackear(evento) {
    var id = idEvento();
    fbq("track", evento, {}, { eventID: id });
    enviarCAPI(evento, id);
  }

  /* ---------- 1. Carga del Pixel de Meta (código estándar de Meta) ---------- */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  fbq("init", META_PIXEL_ID);
  trackear("PageView");

  /* ---------- 2. Clics en cualquier botón/enlace de WhatsApp -> "Contact" ---------- */
  document.addEventListener("click", function (e) {
    var enlace = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (!enlace) return;
    trackear("Contact");
  });

  /* ---------- 3. Envío del formulario de cotización -> "Lead" ----------
     El formulario arma el mensaje y abre WhatsApp (ver initQuoteForm en
     main.js). Este listener solo escucha; no interfiere con ese envío. */
  document.addEventListener("submit", function (e) {
    if (!e.target || !e.target.hasAttribute("data-quote-form")) return;
    trackear("Lead");
  });
})();
