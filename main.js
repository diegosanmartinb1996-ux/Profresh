/* =============================================================
   PROFRESH — main.js  (IIFE, sin módulos, sin dependencias)
   Solo tres cosas: el menú, los anclajes suaves y las apariciones
   al hacer scroll. Todo lo demás (splash, cursor, marquees, tilt,
   carrusel, formulario) salió el 10 de septiembre de 2026.
   ============================================================= */
(function () {
  "use strict";

  var $  = function (s, sc) { return (sc || document).querySelector(s); };
  var $$ = function (s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); };
  function safe(fn, name){ try { fn(); } catch (e) { console.warn("["+name+"]", e); } }

  /* ---------- NAV ---------- */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    var onScroll = function(){ nav.classList.toggle("is-stuck", window.scrollY > 24); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });

    var burger = $("[data-burger]");
    if (burger) {
      burger.addEventListener("click", function(){
        var open = nav.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$(".nav-links a").forEach(function(a){
        a.addEventListener("click", function(){ nav.classList.remove("is-open"); burger.setAttribute("aria-expanded","false"); });
      });
    }
  }

  /* ---------- ANCLAJES SUAVES ---------- */
  function initAnchors() {
    document.addEventListener("click", function(e){
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- APARICIONES ----------
     Los elementos con [data-reveal] entran con un desplazamiento corto.
     Si algo falla, a los 3 segundos todo queda visible igual. */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    var showAll = function(){ els.forEach(function(e){ e.classList.add("is-visible"); }); };
    if (!("IntersectionObserver" in window)) { showAll(); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function(e){ io.observe(e); });
    setTimeout(showAll, 3000);
  }

  function boot() {
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
