/* ==========================================================================
   Profresh · Aviso de cookies y consentimiento
   --------------------------------------------------------------------------
   Google Analytics y el Pixel de Meta solo se cargan si la persona acepta.
   Lo exige la Ley 21.719 de protección de datos personales, vigente desde el
   1 de diciembre de 2026: la medición publicitaria necesita consentimiento.

   Este archivo va ANTES que lib/analytics.js y lib/meta-pixel.js en cada
   página (los tres con defer, que respeta el orden). Ellos no arrancan solos:
   le piden a ProfreshCookies.cuandoAcepte(...) que los llame.

   La elección se guarda en este navegador (localStorage) y se vuelve a
   preguntar a los 12 meses o si cambia VERSION (subirla cuando cambien las
   herramientas de medición, para pedir el permiso de nuevo). El link
   «Configurar cookies» del pie vuelve a abrir el aviso.
   ========================================================================== */

(function () {
  "use strict";

  var CLAVE = "profresh_cookies";
  var VERSION = 1;
  var DURACION_MS = 365 * 24 * 60 * 60 * 1000;

  var pendientes = [];
  var aviso = null;

  function leer() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE) || "null");
      if (!d || d.v !== VERSION || (d.decision !== "si" && d.decision !== "no")) return null;
      if (Date.now() - d.fecha > DURACION_MS) return null;
      return d.decision;
    } catch (e) {
      return null;
    }
  }

  function guardar(decision) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ v: VERSION, decision: decision, fecha: Date.now() }));
    } catch (e) {}
  }

  // Al retirar el permiso se borran las cookies que dejaron Google y Meta.
  function borrarCookiesDeMedicion() {
    var dominios = ["", location.hostname, "." + location.hostname.replace(/^www\./, "")];
    document.cookie.split(";").forEach(function (c) {
      var nombre = c.split("=")[0].trim();
      if (!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(nombre)) return;
      dominios.forEach(function (dom) {
        document.cookie = nombre + "=; Max-Age=0; path=/" + (dom ? "; domain=" + dom : "");
      });
    });
  }

  function ejecutarPendientes() {
    var lista = pendientes;
    pendientes = [];
    lista.forEach(function (fn) {
      try { fn(); } catch (e) {}
    });
  }

  function decidir(decision) {
    var anterior = leer();
    guardar(decision);
    cerrar();
    if (decision === "si") {
      ejecutarPendientes();
    } else if (anterior === "si") {
      // La medición ya estaba corriendo en esta página: recargar la detiene.
      borrarCookiesDeMedicion();
      location.reload();
    }
  }

  function cerrar() {
    if (aviso && aviso.parentNode) aviso.parentNode.removeChild(aviso);
    aviso = null;
  }

  function abrir() {
    if (aviso) return;
    aviso = document.createElement("div");
    aviso.className = "cookies";
    aviso.setAttribute("role", "region");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.innerHTML =
      '<p class="cookies-texto">Usamos cookies de <strong>Google Analytics</strong> y del <strong>Pixel de Meta</strong> ' +
      'para medir las visitas y saber si llegaste desde un aviso nuestro. Solo se activan si aceptas. ' +
      '<a href="/privacidad">Política de privacidad</a></p>' +
      '<div class="cookies-botones">' +
      '<button type="button" class="btn btn-ghost" data-cookies-decision="no">Rechazar</button>' +
      '<button type="button" class="btn btn-primary" data-cookies-decision="si">Aceptar</button>' +
      "</div>";
    aviso.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-cookies-decision]") : null;
      if (b) decidir(b.getAttribute("data-cookies-decision"));
    });
    document.body.appendChild(aviso);
  }

  window.ProfreshCookies = {
    aceptado: function () { return leer() === "si"; },
    cuandoAcepte: function (fn) {
      if (leer() === "si") {
        try { fn(); } catch (e) {}
      } else {
        pendientes.push(fn);
      }
    },
    abrir: abrir
  };

  document.addEventListener("click", function (e) {
    var link = e.target.closest ? e.target.closest("[data-cookies-config]") : null;
    if (!link) return;
    e.preventDefault();
    abrir();
  });

  if (leer() === null) abrir();
})();
