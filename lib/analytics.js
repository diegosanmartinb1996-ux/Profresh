/* ==========================================================================
   Profresh · Medición de visitas y contactos (Google Analytics 4)
   --------------------------------------------------------------------------
   ÚNICO DATO QUE HAY QUE EDITAR: la línea de abajo (ID_DE_MEDICION).

   Se obtiene en analytics.google.com → Administrar → Flujos de datos →
   (el flujo de profresh.cl). Es un código con el formato "G-XXXXXXXXXX".

   Mientras esté vacío, este archivo NO hace absolutamente nada: no carga
   Google, no envía datos y no afecta la velocidad del sitio.
   ========================================================================== */

var ID_DE_MEDICION = "G-2G9BPXX4JN";

/* ==========================================================================
   De aquí para abajo no hay que tocar nada.
   ========================================================================== */
(function () {
  "use strict";

  // Sin ID configurado no se carga nada. Evita romper el sitio si queda vacío.
  if (!ID_DE_MEDICION || ID_DE_MEDICION.indexOf("G-") !== 0) return;

  // No medir cuando se está probando el sitio en el computador (localhost),
  // así las visitas de prueba no ensucian las estadísticas reales.
  var host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "") return;

  /* ---------- 1. Carga de Google Analytics 4 ---------- */
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID_DE_MEDICION;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", ID_DE_MEDICION);

  /* ---------- 2. Nombre legible del lugar donde se hizo clic ----------
     En vez de etiquetar a mano los 42 botones de WhatsApp del sitio, se
     deduce solo: se busca el primer contenedor conocido hacia arriba, y
     si no hay ninguno, la sección de la página donde está el botón.
     El orden importa: va del caso más específico al más general. */
  var LUGARES = [
    [".wa-float",       "boton flotante"],
    [".nav-cta",        "menu superior"],
    [".quote-alt",      "formulario (link alternativo)"],
    [".qs-row",         "barra lateral cotizacion"],
    [".svc-page-hero",  "inicio pagina de servicio"],
    [".svc-closing",    "cierre pagina de servicio"]
  ];

  function ubicacionDe(el) {
    if (!el.closest) return "otro";

    for (var i = 0; i < LUGARES.length; i++) {
      if (el.closest(LUGARES[i][0])) return LUGARES[i][1];
    }

    var seccion = el.closest("section[id], section[class], footer, header");
    if (seccion) {
      if (seccion.id) return seccion.id;
      if (seccion.tagName === "FOOTER") return "pie de pagina";
      if (seccion.tagName === "HEADER") return "encabezado";
      return seccion.className.trim().split(/\s+/)[0];
    }
    return "otro";
  }

  // Nombre de la página, para saber qué servicio genera más contactos.
  function paginaActual() {
    var archivo = location.pathname.split("/").pop();
    return (!archivo || archivo === "index.html") ? "home" : archivo.replace(".html", "");
  }

  /* ---------- 3. Clics en cualquier botón/enlace de WhatsApp ---------- */
  document.addEventListener("click", function (e) {
    var enlace = e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (!enlace) return;

    gtag("event", "contacto_whatsapp", {
      ubicacion: ubicacionDe(enlace),
      pagina: paginaActual(),
      texto_boton: (enlace.textContent || "").trim().slice(0, 60)
    });
  });

  /* ---------- 4. Envío del formulario de cotización ----------
     El formulario arma el mensaje y abre WhatsApp (ver initQuoteForm en
     main.js). Este listener solo escucha; no interfiere con ese envío. */
  document.addEventListener("submit", function (e) {
    if (!e.target || !e.target.hasAttribute("data-quote-form")) return;

    gtag("event", "envio_formulario_cotizacion", {
      pagina: paginaActual()
    });
  });

  /* ---------- 5. Clic en el Instagram del sitio ---------- */
  document.addEventListener("click", function (e) {
    var ig = e.target.closest ? e.target.closest('a[href*="instagram.com"]') : null;
    if (!ig) return;

    gtag("event", "clic_instagram", { pagina: paginaActual() });
  });
})();
