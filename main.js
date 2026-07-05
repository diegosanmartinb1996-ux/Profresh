/* =============================================================
   PROFRESH — main.js  (IIFE, sin módulos)
   ============================================================= */
(function () {
  "use strict";

  var data = window.__PROFRESH__ || {};
  var $  = function (s, sc) { return (sc || document).querySelector(s); };
  var $$ = function (s, sc) { return Array.prototype.slice.call((sc || document).querySelectorAll(s)); };
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  function escHTML(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];}); }
  function safe(fn, name){ try { fn(); } catch (e) { console.warn("["+name+"]", e); } }

  /* ---------- SPLASH ---------- */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function(){ splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 1400);
    else window.addEventListener("load", function(){ setTimeout(hide, 1200); });
    setTimeout(hide, 4000);
  }

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

  /* ---------- SMOOTH ANCHORS ---------- */
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

  /* ---------- CURSOR ---------- */
  function initCursor() {
    if (!fineHover) return;
    var cursor = $("[data-cursor]");
    if (!cursor) return;
    var ring = $(".cursor-ring", cursor);
    var label = $(".cursor-label", cursor);
    var rx = 0, ry = 0, x = 0, y = 0, first = false;
    window.addEventListener("mousemove", function(e){
      x = e.clientX; y = e.clientY;
      if (!first) { first = true; rx = x; ry = y; cursor.classList.add("is-ready"); }
    });
    (function loop(){
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      label.style.transform = "translate(-50%,-50%) translate3d(" + x + "px," + (y + 30) + "px,0)";
      requestAnimationFrame(loop);
    })();
    var sel = "a, button, [data-cursor-label], .svc-card, .qs-row, input, select, textarea";
    $$(sel).forEach(function(el){
      el.addEventListener("mouseover", function(ev){
        if (el.contains(ev.relatedTarget)) return;
        cursor.classList.add("is-hover");
        label.textContent = el.getAttribute("data-cursor-label") || "";
      });
      el.addEventListener("mouseout", function(ev){
        if (el.contains(ev.relatedTarget)) return;
        cursor.classList.remove("is-hover");
      });
    });
  }

  /* ---------- REVEALS ---------- */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach(function(e){ e.classList.add("is-visible"); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -4% 0px" });
    els.forEach(function(e){ io.observe(e); });
    setTimeout(function(){
      $$("[data-reveal]:not(.is-visible)").forEach(function(el){
        if (el.getBoundingClientRect().top < window.innerHeight + 200) el.classList.add("is-visible");
      });
    }, 6000);
  }

  /* ---------- SVG TRACE ICONS ---------- */
  function setupTrace(box) {
    $$("path, line, circle, polyline, rect", box).forEach(function(p){
      var len = 400;
      try { len = p.getTotalLength() || 400; } catch (e) {}
      // Solo fijamos la longitud; el dasharray/offset los controla el CSS
      // (si los pusiéramos inline, .is-traced no podría animar el trazo).
      p.style.setProperty("--len", len);
    });
  }
  function initTrace() {
    var boxes = $$("[data-trace]");
    if (!boxes.length) return;
    boxes.forEach(setupTrace);
    if (!("IntersectionObserver" in window)) { boxes.forEach(function(b){ b.classList.add("is-traced"); }); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if (en.isIntersecting) { en.target.classList.add("is-traced"); io.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    boxes.forEach(function(b){ io.observe(b); });
    setTimeout(function(){ $$("[data-trace]:not(.is-traced)").forEach(function(b){
      if (b.getBoundingClientRect().left < window.innerWidth * 1.5) b.classList.add("is-traced"); }); }, 6000);
  }

  /* ---------- Bandera de visibilidad (pausa animaciones fuera de pantalla) ---------- */
  function inViewFlag(el) {
    var st = { v: true };
    if (el && "IntersectionObserver" in window) {
      try {
        var io = new IntersectionObserver(function(es){
          es.forEach(function(e){ st.v = e.isIntersecting; });
        }, { rootMargin: "120px" });
        io.observe(el);
      } catch (e) {}
    }
    return st;
  }

  /* ---------- MARQUEES (rAF infinite) ---------- */
  function marquee(track, speed) {
    if (!track) return;
    var x = 0, half = 0;
    var flag = inViewFlag(track.parentNode || track);
    function measure(){ half = track.scrollWidth / 2; }
    measure(); window.addEventListener("resize", measure);
    (function loop(){
      requestAnimationFrame(loop);
      if (!flag.v) return;
      x -= speed;
      if (half && -x >= half) x += half;
      track.style.transform = "translate3d(" + x + "px,0,0)";
    })();
  }
  function initMarquees() {
    marquee($("[data-marquee]"), 0.6);
    marquee($("[data-marquee-rev]"), -0.5);
    marquee($("[data-marquee-foot]"), 0.9);
  }

  /* ---------- SERVICES PROGRESS ---------- */
  function initServices() {
    var vp = $("[data-svc-viewport]");
    if (!vp) return;
    var bar = $("[data-sp-bar]");
    var cur = $("[data-sp-current]");
    var cards = $$("[data-svc-card]", vp);
    var total = cards.length || 10;
    var update = function(){
      var max = vp.scrollWidth - vp.clientWidth;
      var p = max > 0 ? vp.scrollLeft / max : 0;
      if (bar) bar.style.width = (10 + p * 90) + "%";
      var idx = Math.min(total, Math.round(p * (total - 1)) + 1);
      if (cur) cur.textContent = (idx < 10 ? "0" : "") + idx;
    };
    update();
    vp.addEventListener("scroll", update, { passive: true });

    // Desktop: arrastrar con el mouse para mover el carrusel (sin secuestrar
    // la rueda — el scroll vertical de la página queda 100% fluido).
    if (fineHover) {
      var down = false, startX = 0, startScroll = 0, moved = false;
      vp.addEventListener("pointerdown", function(e){
        down = true; moved = false;
        startX = e.clientX; startScroll = vp.scrollLeft;
        vp.classList.add("is-grabbing");
      });
      window.addEventListener("pointermove", function(e){
        if (!down) return;
        var dx = e.clientX - startX;
        if (Math.abs(dx) > 20) moved = true;
        vp.scrollLeft = startScroll - dx;
      });
      window.addEventListener("pointerup", function(){
        down = false; vp.classList.remove("is-grabbing");
      });
      // Evita que un arrastre dispare el click/enlace dentro de la tarjeta
      vp.addEventListener("click", function(e){
        if (moved) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    }
  }

  /* ---------- GALLERY RAILS ---------- */
  function mountGallery() {
    var wrap = $("[data-gallery]");
    if (!wrap || !data.gallery) return;
    var rails = $$(".rail", wrap);
    if (!rails.length || rails[0].children.length > 0) return;
    var imgs = data.gallery;
    var third = Math.ceil(imgs.length / 3);
    var groups = [imgs.slice(0, third), imgs.slice(third, third * 2), imgs.slice(third * 2)];
    rails.forEach(function(rail, i){
      var set = groups[i].length ? groups[i] : imgs;
      var html = set.concat(set).map(function(it){
        var src = typeof it === "string" ? it : it.src;
        var alt = typeof it === "string" ? "Espacio impecable por Profresh" : (it.alt || "Espacio impecable por Profresh");
        return '<img src="' + escHTML(src) + '" alt="' + escHTML(alt) + '" loading="lazy" decoding="async">';
      }).join("");
      rail.innerHTML = html;
    });
  }
  function initGalleryMotion() {
    var wrap = $("[data-gallery]");
    var flag = inViewFlag(wrap);
    $$(".rail").forEach(function(rail){
      var sp = rail.getAttribute("data-rail-speed");
      var speed = sp === "fast" ? 0.7 : sp === "slow" ? 0.35 : -0.5;
      var x = 0, half = 0;
      function measure(){ half = rail.scrollWidth / 2; }
      setTimeout(measure, 200); window.addEventListener("resize", measure);
      (function loop(){
        requestAnimationFrame(loop);
        if (!flag.v) return;
        x -= speed;
        if (half) { if (-x >= half) x += half; if (-x < 0) x -= half; }
        rail.style.transform = "translate3d(" + x + "px,0,0)";
      })();
    });
  }

  /* ---------- TILT (plans card) ---------- */
  function initTilt() {
    if (!fineHover) return;
    $$("[data-tilt]").forEach(function(card){
      card.addEventListener("mousemove", function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateY(" + (px * 5) + "deg) rotateX(" + (-py * 5) + "deg)";
      });
      card.addEventListener("mouseleave", function(){ card.style.transform = ""; });
    });
  }

  /* ---------- QUOTE FORM ---------- */
  function initQuoteForm() {
    var form = $("[data-quote-form]");
    if (!form) return;
    var phone = (data.brand && data.brand.whatsapp) || "56985323016";
    form.addEventListener("submit", function(e){
      e.preventDefault();
      if (!form.reportValidity()) return;
      var f = form.elements;
      var msg = "Hola Profresh 👋 Quiero cotizar:\n"
        + "• Nombre: " + (f.nombre.value || "-") + "\n"
        + "• Teléfono: " + (f.telefono.value || "-") + "\n"
        + "• Comuna: " + (f.comuna.value || "-") + "\n"
        + "• Servicio: " + (f.servicio.value || "-") + "\n"
        + (f.detalle.value ? "• Detalle: " + f.detalle.value + "\n" : "");
      window.open("https://wa.me/" + phone + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  /* ---------- BOOT ---------- */
  function boot() {
    safe(mountGallery, "mountGallery");
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initCursor, "initCursor");
    safe(initReveals, "initReveals");
    safe(initTrace, "initTrace");
    safe(initMarquees, "initMarquees");
    safe(initServices, "initServices");
    safe(initGalleryMotion, "initGalleryMotion");
    safe(initTilt, "initTilt");
    safe(initQuoteForm, "initQuoteForm");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
