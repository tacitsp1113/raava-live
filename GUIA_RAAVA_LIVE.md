# 🏎️ GUÍA TÉCNICA: ADDON DE DEPORTES Y TV EN VIVO (RAAVA LIVE)

Este documento detalla la arquitectura, ingeniería inversa de señales de televisión en directo, extracción de flujos HLS (`.m3u8`), optimizaciones de latencia y despliegue del addon **RAAVA LIVE** para Stremio.

---

## 1. 🏗️ Arquitectura y Estructura del Addon

El servicio está construido sobre **Node.js** y **Express**, respetando el protocolo oficial de complementos de Stremio:

```text
raava-live/
├── server.js                 <-- Servidor Express, router Stremio y Landing Page
├── package.json              <-- Dependencias (express, cors, axios)
├── render.yaml               <-- Configuración Infrastructure as Code para Render
└── services/
    └── streamtp.js           <-- Extracción de eventos, canales 24/7 y caché M3U8
```

---

## 2. 📡 Ingeniería Inversa: De Dónde Salen las Señales Deportivas

A diferencia de los sitios web tradicionales que obligan al usuario a navegar entre publicidad emergente, captchas y reproductores bloqueados:

### A. Agenda Diaria en Tiempo Real (JSON)
El servidor consulta periódicamente la API interna de eventos deportivos:
```text
GET https://streamtp-golden1.click/events.json
```
Esta API devuelve una lista estructurada con los eventos del día (UEFA Champions League, Fórmula 1, WRC, LaLiga, NBA):
```json
{
  "title": "UEFA Champions League: Como vs Manchester United",
  "category": "UEFA Champions League",
  "time": "11:45",
  "url": "https://streamtp99a.sbs/global1.php?stream=espn",
  "quality": "HD",
  "status": "next"
}
```

### B. Extracción de la Señal HLS (`playbackURL`)
Cuando un usuario selecciona un canal o partido, el servidor solicita el reproductor emulando un navegador limpio:
```text
GET https://streamtp99a.sbs/global1.php?stream=espn
Referer: https://streamtp-golden1.click/
```
Dentro del código HTML de la respuesta se extrae la URL directa del flujo de video mediante una expresión regular:
```javascript
const match = html.match(/var\s+playbackURL\s*=\s*"([^"]+)"/);
// Resultado limpio: https://99.domhsd.com:443/global/espn/index.m3u8?token=...&ip=...
```

---

## 3. 🛡️ Inyección de Cabeceras para Stremio (`proxyHeaders`)

Muchos reproductores de video devuelven error `403 Forbidden` si detectan que el archivo `.m3u8` se solicita fuera de su dominio. 

Para resolver esto sin necesidad de retransmitir gigabytes de video a través de Render, el addon aprovecha la función nativa de Stremio `behaviorHints.proxyHeaders`:

```javascript
{
  "title": "🔴 EN VIVO • ESPN Latino\n📡 Señal Directa HD",
  "url": cleanUrl,
  "behaviorHints": {
    "notWebReady": false,
    "proxyHeaders": {
      "request": {
        "Referer": "https://streamtp99a.sbs/",
        "Origin": "https://streamtp99a.sbs",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
      }
    }
  }
}
```
Esto le indica al reproductor interno de Stremio (ExoPlayer en Android o MPV en PC) que envíe las cabeceras exactas que el servidor de video espera.

---

## 4. 📺 Catálogos Soportados en Stremio

El addon publica dos catálogos independientes bajo la sección **TV**:

1. **⚽ Partidos y Eventos de Hoy (`raava_live_agenda`):**
   * Agrupa más de 50 eventos diarios (Fútbol, F1, WRC, Tenis, Baloncesto).
   * Asigna portadas automáticas de alta resolución según la categoría.
2. **📺 Canales 24/7 (`raava_live_channels`):**
   * Señales deportivas continuas: **ESPN**, **ESPN México**, **ESPN 2, 3, 4**, **TUDN México**, **TUDN USA**, **Fox Sports**, **Azteca 7**, **Star+ / Disney+ 1-3**, **TNT Sports / Max 1-2** y **Win Sports+**.
   * Identificados con sus logos oficiales de televisión en formato PNG transparente.

---

## 5. ⚡ Optimizaciones de Latencia y Rendimiento

Para asegurar que los canales carguen en menos de un segundo y evitar bloqueos:

1. **Caché en Memoria RAM de Streams (3 Minutos):**
   * Cuando se resuelve un enlace `.m3u8`, queda guardado en la memoria del servidor durante 180 segundos. Si el usuario cambia de canal y regresa, la respuesta tarda **0 milisegundos**.
2. **Pre-carga en Segundo Plano (60 Segundos):**
   * Un temporizador interno (`setInterval`) refresca la agenda de eventos cada minuto en segundo plano. Cuando Stremio solicita el catálogo, nunca se queda esperando peticiones HTTP externas.
3. **Manejo del "Cold Start" en Render:**
   * En el plan gratuito de Render, el contenedor entra en suspensión si pasa 15 minutos inactivo. La primera petición tras dormir puede tardar 30 segundos en despertar; las siguientes solicitudes operan a máxima velocidad.

---

## 6. 🌐 Repositorio y Despliegue en la Nube

* **Repositorio GitHub:** [tacitsp1113/raava-live](https://github.com/tacitsp1113/raava-live)
* **Servicio en Render:** `https://raava-live.onrender.com`
* **URL del Manifiesto Stremio:**
  ```text
  https://raava-live.onrender.com/manifest.json
  ```

---

## 7. 📱 Instalación en Dispositivos

1. Abre **Stremio** en tu Smart TV, Celular Android, Fire TV Stick o PC.
2. Ve a **Complementos** (icono de rompecabezas).
3. En el buscador superior derecho, pega la URL del manifiesto:
   ```text
   https://raava-live.onrender.com/manifest.json
   ```
4. Pulsa **Instalar**.
5. Ve a **Descubrir > TV** y disfruta de tus deportes y canales en vivo sin necesidad de activar tokens cada 24 horas en Discord.
