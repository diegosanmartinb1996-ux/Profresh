# Profresh — Tu sitio web

Bienvenido. Esta carpeta **es** tu página web completa. No necesitas instalar nada
ni saber programar. Aquí te explicamos todo paso a paso, pensado para que lo hagas
con el Bloc de notas.

---

## 1. Ver la web en tu computador

Entra a la carpeta `profresh` y haz **doble clic en `index.html`**.
Se abrirá en tu navegador (Chrome, Edge, etc.). Eso es todo.

> Si algún efecto no se ve perfecto al abrir con doble clic, no te preocupes:
> una vez subida a internet funciona al 100%.

---

## 2. Subirla a internet (Hostinger)

1. Entra a tu panel de **Hostinger** → **Administrador de archivos** (File Manager).
2. Abre la carpeta `public_html`.
3. **Arrastra TODO el contenido** de la carpeta `profresh` dentro de `public_html`
   (los archivos y las carpetas `assets`, `lib`, etc. — incluido el archivo `.htaccess`).
4. Espera a que termine de subir. Listo: visita tu dominio.

> Sube el **contenido** de `profresh`, no la carpeta `profresh` entera, para que
> tu web quede en `tudominio.cl` y no en `tudominio.cl/profresh`.

---

## 3. Cambiar textos, servicios, comunas y WhatsApp

Casi todo el contenido editable está en **un solo archivo**:

```
lib/manifest.js
```

Ábrelo con el **Bloc de notas** (clic derecho → Abrir con → Bloc de notas).
Verás secciones con explicaciones. Cambia solo el texto **entre comillas** `"así"`.
**No borres** las comillas, las comas `,` ni los corchetes `[ ]`.

Qué puedes editar ahí:
- **brand**: nombre, eslogan, horario, Instagram y el mensaje de WhatsApp.
- **zones**: las comunas donde atienden.
- **services**: los 10 servicios (nombre, qué incluye, descripción).
- **process**: los 4 pasos de "cómo trabajamos".
- **gallery**: las fotos de la galería.

Guarda el archivo (Ctrl+S) y recarga la web.

> Los textos principales (hero, servicios, footer) también están escritos
> directamente en `index.html` para que la web nunca aparezca vacía. Si cambias
> un servicio importante, cámbialo en **los dos** lugares: en `index.html`
> (busca el texto con Ctrl+B) y en `lib/manifest.js`.

---

## 4. Cambiar el número de WhatsApp

El número aparece en dos lugares. Cámbialo en **ambos**:

1. En `lib/manifest.js` → línea `whatsapp: "56985323016"`.
2. En `index.html` → usa Buscar (Ctrl+B) y reemplaza **todas** las veces que
   aparece `56985323016` por tu número nuevo (formato: código país + número,
   sin `+`, sin espacios; ejemplo Chile: `569XXXXXXXX`).

---

## 5. Cambiar las fotos

Las fotos están en la carpeta `assets/img/`.
Para reemplazarlas por tus propias fotos de trabajos reales:

1. Guarda tu foto con el **mismo nombre** que la que quieres reemplazar
   (por ejemplo `gallery-01.jpg`).
2. Cópiala dentro de `assets/img/` reemplazando la anterior.

Consejos: usa fotos horizontales, con buena luz, de espacios limpios. Si tu
celular guarda en formato `.HEIC`, conviértelas a `.JPG` antes (WhatsApp Web o
cualquier conversor online sirve).

---

## 6. Si algo no se actualiza

Después de subir cambios, si ves la versión vieja:

1. Pulsa **Ctrl + F5** en el navegador (recarga forzada).
2. Si sigue igual: abre `index.html` y, al final, donde dice `?v=20260617`,
   cambia ese número por la fecha de hoy (por ejemplo `?v=20260720`) en **todas**
   las líneas que lo tengan. Guarda y vuelve a subir. Esto obliga al navegador a
   cargar la versión nueva.

---

## 7. Créditos de imágenes

Las fotos actuales son de stock libre (Openverse) y están listadas en
`assets/credits.json`. Cuando las reemplaces por tus propias fotos, puedes
vaciar o ignorar ese archivo.

---

¿Dudas? Cualquier cambio mayor (nuevas secciones, rediseño) conviene pedirlo a
quien te entregó el sitio. Para lo del día a día, este README te cubre. ✨
