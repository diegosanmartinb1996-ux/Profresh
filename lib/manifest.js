/* =============================================================================
   PROFRESH — Datos editables del sitio
   -----------------------------------------------------------------------------
   Este archivo lo puedes editar con el Bloc de notas. Cambia los textos entre
   comillas "asi". No borres las comillas, las comas, ni los corchetes [ ].
   Si algo deja de funcionar, deshaz tu ultimo cambio (Ctrl+Z) y guarda.
   ============================================================================= */
(function () {
  "use strict";

  window.__PROFRESH__ = {

    /* ---- MARCA -------------------------------------------------------------- */
    brand: {
      name: "Profresh",
      tagline: "Tu espacio impecable, sin que muevas un dedo.",
      kicker: "Aseo profesional · Sector oriente de Santiago",
      est: "EST. 2024 · STGO",
      // Numero de WhatsApp. Formato internacional sin signos ni espacios.
      // Si lo cambias aqui, cambialo TAMBIEN en index.html (busca: wa.me)
      whatsapp: "56985323016",
      whatsappLabel: "+56 9 8532 3016",
      instagram: "@profresh.limpieza",
      instagramUrl: "https://instagram.com/profresh.limpieza",
      hours: "Lunes a viernes · 9:00–19:00 hrs · Sábado · 10:00–15:00 hrs",
      location: "Servicio a domicilio · Sector oriente de Santiago",
      // Mensaje que se rellena solo al abrir WhatsApp desde los botones
      waMessage: "Hola Profresh 👋 Quiero cotizar un servicio de aseo. ¿Me pueden ayudar?"
    },

    /* ---- ZONAS DE COBERTURA ------------------------------------------------- */
    zones: [
      "Las Condes", "Vitacura", "Providencia",
      "La Reina", "Ñuñoa", "Lo Barnechea", "Chicureo"
    ],

    /* ---- SERVICIOS (carrusel) ---------------------------------------------- */
    /* serie: "Insignia" o "Especializado". El icono se dibuja solo (no tocar). */
    services: [
      {
        icon: "key", series: "Insignia", name: "Limpieza Airbnb",
        subtitle: "Tu propiedad lista entre reservas",
        includes: ["Check-out / check-in coordinado", "Reposición de amenities y ropa de cama", "Reporte con fotos de entrega", "Aviso de daños o faltantes"],
        desc: "Coordinamos el cambio entre huéspedes según tu calendario: limpieza, reposición y reporte con fotos. Tu propiedad siempre lista y a tiempo, reserva tras reserva."
      },
      {
        icon: "building", series: "Insignia", name: "Limpieza oficinas",
        subtitle: "Equipos que rinden en espacios impecables",
        includes: ["Convenios semanales o mensuales", "Escritorios, salas y áreas comunes", "Baños y cocina office", "Fuera de horario · con factura"],
        desc: "Mantención de oficinas y espacios comerciales con convenios a tu medida, fuera de horario y con factura. Tu equipo y tus clientes llegan siempre a un lugar impecable."
      },
      {
        icon: "sparkle", series: "Insignia", name: "Limpieza profunda",
        subtitle: "La primera limpieza a fondo",
        includes: ["Cocina y baños a detalle", "Pisos y rincones", "Polvo en altura", "Puesta a punto completa"],
        desc: "Limpieza intensiva pensada para dejar el espacio en cero. Ideal como primer servicio o para una puesta a punto."
      },
      {
        icon: "clock", series: "Especializado", name: "Limpieza express",
        subtitle: "Rápida y al detalle",
        includes: ["Limpieza general de superficies", "Cocina y baños", "Orden y polvo", "En menos tiempo"],
        desc: "Una limpieza ágil para mantener tu espacio al día. Perfecta entre limpiezas profundas o cuando necesitas resultados rápidos."
      },
      {
        icon: "trowel", series: "Especializado", name: "Limpieza post-obra",
        subtitle: "Después de remodelar",
        includes: ["Retiro de polvo de obra", "Residuos finos", "Vidrios y terminaciones", "Listo para habitar"],
        desc: "Limpieza especializada tras una remodelación o construcción. Dejamos el espacio listo para habitar."
      }
    ],

    /* ---- CÓMO TRABAJAMOS ---------------------------------------------------- */
    process: [
      { n: "01", icon: "chat",     title: "Cotizas",          text: "Nos escribes por WhatsApp con lo que necesitas." },
      { n: "02", icon: "calendar", title: "Agendamos",        text: "Coordinamos día, hora y equipo." },
      { n: "03", icon: "sparkle",  title: "Limpiamos",        text: "Llega el equipo y deja todo impecable." },
      { n: "04", icon: "check",    title: "Quedas tranquilo", text: "Revisas el resultado. Si algo falta, lo resolvemos." }
    ],

    /* ---- GALERÍA ------------------------------------------------------------ */
    /* Sustituye estos archivos por tus propias fotos en assets/img/ (mismo nombre). */
    gallery: [
      { src: "assets/img/limpieza-profunda-alfombra-departamento.jpg", alt: "Limpieza profunda de alfombra en departamento del sector oriente de Santiago" },
      { src: "assets/img/limpieza-vidrios-ventanales-casa.jpg", alt: "Limpieza de vidrios y ventanales en casa de Profresh" },
      { src: "assets/img/limpieza-pisos-terraza-profresh.jpg", alt: "Equipo Profresh lavando el piso de una terraza con vista" },
      { src: "assets/img/limpieza-profunda-rieles-living.jpg", alt: "Limpieza profunda de rieles y pisos en un living recién entregado" },
      { src: "assets/img/limpieza-pisos-terraza-departamento.jpg", alt: "Limpieza profesional de pisos en terraza de departamento" },
      { src: "assets/img/limpieza-post-obra-ventanas.jpg", alt: "Limpieza post-obra de ventanas en departamento nuevo" },
      { src: "assets/img/airbnb-departamento-sector-oriente.jpg", alt: "Departamento Airbnb impecable y listo para recibir huéspedes en el sector oriente de Santiago" },
      { src: "assets/img/airbnb-amenities-cafe.jpg", alt: "Detalle de amenities y café preparados para la llegada del huésped en un Airbnb" },
      { src: "assets/img/gallery-13.jpg", alt: "Living luminoso y ordenado tras la limpieza" },
      { src: "assets/img/gallery-10.jpg", alt: "Comedor impecable con luz natural" },
      { src: "assets/img/gallery-11.jpg", alt: "Dormitorio ordenado y luminoso" },
      { src: "assets/img/gallery-15.jpg", alt: "Habitación con luz natural tras la limpieza" }
    ]
  };
})();
